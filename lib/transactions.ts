import { prisma } from "./db";
import type {
  PaymentCategory,
  TransactionType,
  AccountType,
  Transaction,
  CashBookRow,
  TrialBalanceRow,
} from "@/types";

export interface CreateTransactionInput {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: PaymentCategory;
  reference: string;
  account: AccountType;
  createdById: string;
}

interface LedgerDraft {
  account: string;
  debit: number;
  credit: number;
}

/** Handles Prisma Decimal, number, string, or null uniformly */
function toNum(val: { toNumber(): number } | number | string | null | undefined): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val);
  return val.toNumber();
}

function buildLedgerEntries(input: CreateTransactionInput): LedgerDraft[] {
  const categoryAccount = `${input.category} Fund`;
  if (input.type === "DEBIT") {
    return [
      { account: input.account, debit: input.amount, credit: 0 },
      { account: categoryAccount, debit: 0, credit: input.amount },
    ];
  }
  return [
    { account: categoryAccount, debit: input.amount, credit: 0 },
    { account: input.account, debit: 0, credit: input.amount },
  ];
}

// ---------------------------------------------------------------------------
// Row shapes returned by Prisma (manually typed so tsc doesn't lose them when
// the generated client isn't present in the sandbox environment)
// ---------------------------------------------------------------------------

interface TxRow {
  id: string;
  date: Date;
  description: string;
  amount: { toNumber(): number } | number;
  type: string;
  category: string;
  reference: string;
  account: string;
  createdAt: Date;
  createdById: string;
  createdBy: { username: string };
}

interface TxRowSimple {
  id: string;
  date: Date;
  description: string;
  amount: { toNumber(): number } | number;
  type: string;
  category: string;
  reference: string;
  account: string;
  createdAt: Date;
  createdById: string;
}

interface LedgerGroupRow {
  account: string;
  _sum: {
    debit: { toNumber(): number } | number | null;
    credit: { toNumber(): number } | number | null;
  };
}

interface CategoryGroupRow {
  category: string;
  _sum: { amount: { toNumber(): number } | number | null };
}

// ---------------------------------------------------------------------------

export async function createTransaction(input: CreateTransactionInput): Promise<string> {
  const tx = await prisma.transaction.create({
    data: {
      date: new Date(input.date),
      description: input.description,
      amount: input.amount,
      type: input.type,
      category: input.category,
      reference: input.reference,
      account: input.account,
      createdById: input.createdById,
      ledgerEntries: { create: buildLedgerEntries(input) },
    },
  });
  return (tx as { id: string }).id;
}

export async function getTransactions(filters?: {
  category?: PaymentCategory;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Transaction[]> {
  const rows = (await prisma.transaction.findMany({
    where: {
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.dateFrom || filters?.dateTo
        ? {
            date: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
            },
          }
        : {}),
    },
    include: { createdBy: { select: { username: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  })) as TxRow[];

  return rows.map((r) => ({
    id: r.id,
    date: r.date.toISOString().split("T")[0] ?? "",
    description: r.description,
    amount: toNum(r.amount),
    type: r.type as TransactionType,
    category: r.category as PaymentCategory,
    reference: r.reference,
    account: r.account as AccountType,
    createdAt: r.createdAt.toISOString(),
    createdById: r.createdById,
    createdByUsername: r.createdBy.username,
  }));
}

export async function getCashBook(category?: PaymentCategory): Promise<CashBookRow[]> {
  const rows = (await prisma.transaction.findMany({
    where: category ? { category } : {},
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  })) as TxRowSimple[];

  let balance = 0;
  return rows.map((r) => {
    const amount = toNum(r.amount);
    const debit = r.type === "DEBIT" ? amount : 0;
    const credit = r.type === "CREDIT" ? amount : 0;
    balance += debit - credit;
    return {
      date: r.date.toISOString().split("T")[0] ?? "",
      description: r.description,
      reference: r.reference,
      debit,
      credit,
      balance,
      category: r.category as PaymentCategory,
      transactionId: r.id,
    };
  });
}

export async function getTrialBalance(): Promise<TrialBalanceRow[]> {
  const rawRows = await prisma.ledgerEntry.groupBy({
    by: ["account"],
    _sum: { debit: true, credit: true },
    orderBy: { account: "asc" },
  });
  const rows = rawRows as unknown as LedgerGroupRow[];

  return rows.map((r) => ({
    account: r.account,
    debit: toNum(r._sum.debit),
    credit: toNum(r._sum.credit),
  }));
}

export async function getDashboardStats(): Promise<{
  totalReceipts: number;
  totalPayments: number;
  balance: number;
  transactionCount: number;
  byCategory: { category: string; total: number }[];
}> {
  const [receipts, payments, count, byCategory] = await Promise.all([
    prisma.transaction.aggregate({ where: { type: "DEBIT" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "CREDIT" }, _sum: { amount: true } }),
    prisma.transaction.count(),
    prisma.transaction.groupBy({
      by: ["category"],
      where: { type: "DEBIT" },
      _sum: { amount: true },
    }),
  ]);

  const totalReceipts = toNum((receipts._sum as { amount: { toNumber(): number } | number | null }).amount);
  const totalPayments = toNum((payments._sum as { amount: { toNumber(): number } | number | null }).amount);

  return {
    totalReceipts,
    totalPayments,
    balance: totalReceipts - totalPayments,
    transactionCount: count,
    byCategory: (byCategory as unknown as CategoryGroupRow[]).map((r) => ({
      category: r.category,
      total: toNum(r._sum.amount),
    })),
  };
}
