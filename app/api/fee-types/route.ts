import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getFeeTypes, createFeeType } from "@/lib/feeTypes";

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const feeTypes = await getFeeTypes();
  return NextResponse.json(feeTypes);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 });

  try {
    const body = await req.json() as { name?: string; amount?: unknown; description?: string };
    const { name, amount, description } = body;

    if (!name || amount === undefined) {
      return NextResponse.json({ error: "Name and amount are required." }, { status: 400 });
    }
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
    }

    const id = await createFeeType({ name: name.trim(), amount: parsedAmount, description });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create fee type.";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "A fee type with that name already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
