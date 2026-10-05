import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTransaction, getTransactions } from "@/lib/transactions";
import { initDb } from "@/lib/db";
import type { PaymentCategory, TransactionType, AccountType } from "@/types";

const VALID_CATEGORIES: PaymentCategory[] = [
  "BEAM", "PLAN", "HIGHERLIFE", "CAMFED", "CHILDCARE", "SELF",
];
const VALID_TYPES: TransactionType[] = ["DEBIT", "CREDIT"];
const VALID_ACCOUNTS: AccountType[] = ["Cash", "Bank"];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as PaymentCategory | null;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;

  const transactions = getTransactions({
    category: category ?? undefined,
    dateFrom,
    dateTo,
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    initDb();

    const body = await req.json() as {
      date?: string;
      description?: string;
      amount?: unknown;
      type?: unknown;
      category?: unknown;
      reference?: string;
      account?: unknown;
    };

    const { date, description, amount, type, category, reference, account } = body;

    if (!date || !description || !amount || !type || !category || !reference || !account) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!VALID_TYPES.includes(type as TransactionType)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category as PaymentCategory)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!VALID_ACCOUNTS.includes(account as AccountType)) {
      return NextResponse.json({ error: "Invalid account" }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const id = createTransaction({
      date: date as string,
      description: description as string,
      amount: parsedAmount,
      type: type as TransactionType,
      category: category as PaymentCategory,
      reference: reference as string,
      account: account as AccountType,
      createdById: session.id,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Transaction error:", err);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}
