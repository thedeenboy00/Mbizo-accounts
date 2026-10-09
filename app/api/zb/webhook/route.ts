import { NextRequest, NextResponse } from "next/server";
import { processZBWebhook } from "@/lib/zbPay";

/**
 * ZB Bank calls this endpoint server-to-server when a payment completes.
 * Register this URL in your ZB Merchant Portal settings:
 *   https://mbizo-accounts.vercel.app/api/zb/webhook
 *
 * ZB sends a POST with JSON payload containing:
 *   { transactionReference, status, amount, paymentOption, ... }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const payload = await req.json() as Record<string, unknown>;
    console.log("[ZB Webhook]", JSON.stringify(payload));

    await processZBWebhook(payload);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[ZB Webhook] Error:", err);
    // Always return 200 to ZB so they don't retry indefinitely
    return NextResponse.json({ received: true, error: true });
  }
}

// Allow ZB to also send GET pings
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, endpoint: "ZB SmilePay Webhook" });
}
