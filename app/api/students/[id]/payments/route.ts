import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStudentPayments, recordFeePayment } from "@/lib/students";
import type { PaymentMethod } from "@/types";

const VALID_METHODS: PaymentMethod[] = ["Cash", "Bank"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const payments = await getStudentPayments(id);
  return NextResponse.json(payments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: studentId } = await params;

  try {
    const body = await req.json() as {
      amount?: unknown;
      method?: unknown;
      reference?: string;
      term?: string;
      notes?: string;
    };

    const { amount, method, reference, term, notes } = body;

    if (!amount || !method || !reference || !term) {
      return NextResponse.json({ error: "Amount, method, reference and term are required." }, { status: 400 });
    }

    if (!VALID_METHODS.includes(method as PaymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
    }

    const payId = await recordFeePayment({
      studentId,
      amount: parsedAmount,
      method: method as PaymentMethod,
      reference: reference.trim(),
      term: term.trim(),
      notes: notes?.trim(),
      createdById: session.id,
    });

    return NextResponse.json({ id: payId }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to record payment." }, { status: 500 });
  }
}
