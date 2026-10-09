import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initiateZBPayment } from "@/lib/zbPay";

function generateReceipt(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `MHS-${ts}-${rand}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json() as {
      studentId?: string;
      feeTypeId?: string;
      amount?: unknown;
      currency?: string;
      term?: string;
      payerName?: string;
      payerPhone?: string;
      payerEmail?: string;
    };

    const { studentId, feeTypeId, amount, currency, term, payerName, payerPhone, payerEmail } = body;

    if (!studentId || !amount || !term) {
      return NextResponse.json({ error: "studentId, amount and term are required." }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }

    const curr = (currency === "ZWG" ? "ZWG" : "USD") as "USD" | "ZWG";
    const schoolReceipt = generateReceipt();

    // Get fee type name for description
    let description = "School Fee Payment";
    if (feeTypeId) {
      const ft = await prisma.feeType.findUnique({ where: { id: feeTypeId } });
      if (ft) description = `${(ft as { name: string }).name} — Mbizo High School`;
    }

    // Get student name
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

    const s = student as { firstName: string; lastName: string };
    const desc = `${description} — ${s.firstName} ${s.lastName}`;

    // Create pending ZBPayment record first
    const zbRecord = await prisma.zBPayment.create({
      data: {
        zbReference: `PENDING-${schoolReceipt}`,
        studentId,
        feeTypeId: feeTypeId ?? null,
        amount: parsedAmount,
        term,
        schoolReceipt,
        status: "PENDING",
        payerPhone: payerPhone ?? null,
        payerName:  payerName  ?? `${s.firstName} ${s.lastName}`,
      },
    });

    const result = await initiateZBPayment({
      zbPaymentDbId: (zbRecord as { id: string }).id,
      amount: parsedAmount,
      currency: curr,
      description: desc,
      schoolReceipt,
      payerName:  payerName  ?? `${s.firstName} ${s.lastName}`,
      payerPhone: payerPhone ?? undefined,
      payerEmail: payerEmail ?? undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "ZB payment initiation failed." }, { status: 502 });
    }

    return NextResponse.json({
      zbReference:   result.zbReference,
      paymentUrl:    result.paymentUrl,
      schoolReceipt,
    }, { status: 201 });
  } catch (err) {
    console.error("ZB initiate error:", err);
    return NextResponse.json({ error: "Failed to initiate payment." }, { status: 500 });
  }
}
