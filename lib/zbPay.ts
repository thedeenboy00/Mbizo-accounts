/**
 * ZB Bank SmilePay integration
 * Docs: https://documentation.mitas.co.zw
 * Sandbox: https://zbnet.zb.co.zw/wallet_sandbox_merchant
 *
 * ENV VARS REQUIRED:
 *   ZB_API_KEY       — from Settings > API Keys in ZB Merchant Portal
 *   ZB_API_SECRET    — from Settings > API Keys in ZB Merchant Portal
 *   ZB_MERCHANT_ID   — your merchant ID
 *   ZB_SANDBOX       — "true" for sandbox, "false" for production
 *   NEXT_PUBLIC_APP_URL — e.g. https://mbizo-accounts.vercel.app
 */

import { prisma } from "./db";

const BASE_URL =
  process.env.ZB_SANDBOX === "true"
    ? "https://zbnet.zb.co.zw/wallet_sandbox_merchant/api"
    : "https://zbnet.zb.co.zw/merchant_gateway/api";

function getHeaders(): Record<string, string> {
  const key    = process.env.ZB_API_KEY;
  const secret = process.env.ZB_API_SECRET;
  if (!key || !secret) {
    throw new Error("ZB_API_KEY and ZB_API_SECRET must be set in environment variables.");
  }
  return {
    "Content-Type": "application/json",
    "x-api-key": key,
    "x-api-secret": secret,
    ...(process.env.ZB_MERCHANT_ID ? { "x-merchant-id": process.env.ZB_MERCHANT_ID } : {}),
  };
}

export interface ZBInitiateResult {
  success: boolean;
  zbReference: string;
  paymentUrl: string;
  error?: string;
}

export interface ZBStatusResult {
  zbReference: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  amount?: number;
  paymentMethod?: string;
  paidAt?: string;
}

/**
 * Initiate a hosted payment — generates a ZB checkout URL.
 * The parent/student uses this URL to pay from their phone.
 */
export async function initiateZBPayment(opts: {
  zbPaymentDbId: string;
  amount: number;
  currency: "USD" | "ZWG";
  description: string;
  schoolReceipt: string;
  payerName?: string;
  payerPhone?: string;
  payerEmail?: string;
}): Promise<ZBInitiateResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const callbackUrl = `${appUrl}/api/zb/webhook`;
  const returnUrl   = `${appUrl}/dashboard/students`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/payments/initiate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        amount: opts.amount.toFixed(2),
        currency: opts.currency,
        description: opts.description,
        reference: opts.schoolReceipt,
        callbackUrl,
        returnUrl,
        customer: {
          name:  opts.payerName  ?? "Parent/Guardian",
          phone: opts.payerPhone ?? "",
          email: opts.payerEmail ?? "",
        },
      }),
    });
  } catch (err) {
    return { success: false, zbReference: "", paymentUrl: "", error: String(err) };
  }

  if (!response.ok) {
    const text = await response.text();
    return { success: false, zbReference: "", paymentUrl: "", error: text };
  }

  const data = await response.json() as {
    transactionReference?: string;
    paymentUrl?: string;
    reference?: string;
    redirectUrl?: string;
  };

  const zbReference = data.transactionReference ?? data.reference ?? "";
  const paymentUrl  = data.paymentUrl ?? data.redirectUrl ?? "";

  // Persist ZB reference and URL
  await prisma.zBPayment.update({
    where: { id: opts.zbPaymentDbId },
    data: { zbReference, paymentUrl, status: "PENDING" },
  });

  return { success: true, zbReference, paymentUrl };
}

/**
 * Poll ZB for current payment status (use when webhook hasn't fired yet).
 */
export async function pollZBStatus(zbReference: string): Promise<ZBStatusResult> {
  const response = await fetch(`${BASE_URL}/payments/status/${zbReference}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    return { zbReference, status: "PENDING" };
  }

  const data = await response.json() as {
    status?: string;
    amount?: number;
    paymentOption?: string;
    paidAt?: string;
  };

  const rawStatus = (data.status ?? "").toUpperCase();
  const status: ZBStatusResult["status"] =
    rawStatus === "PAID" || rawStatus === "SUCCESS"     ? "PAID"
    : rawStatus === "FAILED" || rawStatus === "ERROR"   ? "FAILED"
    : rawStatus === "CANCELLED"                         ? "CANCELLED"
    : "PENDING";

  return {
    zbReference,
    status,
    amount:        data.amount,
    paymentMethod: data.paymentOption,
    paidAt:        data.paidAt,
  };
}

/**
 * Process incoming ZB webhook payload.
 * Called from POST /api/zb/webhook.
 * On PAID: creates FeePayment and updates ZBPayment record.
 */
export async function processZBWebhook(payload: Record<string, unknown>): Promise<void> {
  const zbReference = String(payload.transactionReference ?? payload.reference ?? "");
  const rawStatus   = String(payload.status ?? "").toUpperCase();

  if (!zbReference) return;

  const zbPayment = (await prisma.zBPayment.findUnique({
    where: { zbReference },
  })) as {
    id: string;
    studentId: string;
    feeTypeId: string | null;
    amount: { toNumber(): number } | number;
    term: string;
    schoolReceipt: string;
    status: string;
  } | null;

  if (!zbPayment) return;
  if (zbPayment.status === "PAID") return; // idempotent

  const status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" =
    rawStatus === "PAID" || rawStatus === "SUCCESS"   ? "PAID"
    : rawStatus === "FAILED" || rawStatus === "ERROR" ? "FAILED"
    : rawStatus === "CANCELLED"                       ? "CANCELLED"
    : "PENDING";

  await prisma.zBPayment.update({
    where: { id: zbPayment.id },
    data: { status, updatedAt: new Date() },
  });

  if (status !== "PAID") return;

  // Auto-create FeePayment on success — find admin user for createdById
  const adminUser = (await prisma.user.findFirst({
    where: { role: "admin" },
  })) as { id: string } | null;

  const createdById = adminUser?.id ?? "system";
  const amount = typeof zbPayment.amount === "number"
    ? zbPayment.amount
    : zbPayment.amount.toNumber();

  await prisma.feePayment.create({
    data: {
      studentId:   zbPayment.studentId,
      feeTypeId:   zbPayment.feeTypeId ?? null,
      amount,
      method:      "ZBSmilePay",
      reference:   zbPayment.schoolReceipt,
      bankReceipt: zbReference,
      term:        zbPayment.term,
      notes:       "Auto-recorded via ZB SmilePay",
      zbPaymentId: zbReference,
      zbStatus:    "PAID",
      createdById,
    },
  });
}
