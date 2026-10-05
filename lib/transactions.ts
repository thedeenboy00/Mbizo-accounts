import Database from "better-sqlite3";
import { executeTransaction, query } from "./db";
import { generateId } from "./auth";
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

interface TransactionRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: PaymentCategory;
  reference: string;
  account: AccountType;
  created_at: string;
  created_by_id: string;
  username: string;
}

interface LedgerRow {
  account: string;
  debit: number;
  credit: number;
}

export function createTransaction(input: CreateTransactionInput): string {
  const txId = generateId();
  const ledgerEntries = buildLedgerEntries(input);

  executeTransaction((db: Database.Database) => {
    db.prepare(
      `INSERT INTO transactions (id, date, description, amount, type, category, reference, account, created_by_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      txId,
      input.date,
      input.description,
      input.amount,
      input.type,
      input.category,
      input.reference,
      input.account,
      input.createdById
    );

    const insertLedger = db.prepare(
      `INSERT INTO ledger_entries (id, transaction_id, account, debit, credit)
       VALUES (?, ?, ?, ?, ?)`
    );

    for (const entry of ledgerEntries) {
      insertLedger.run(generateId(), txId, entry.account, entry.debit, entry.credit);
    }
  });

  return txId;
}

function buildLedgerEntries(
  input: CreateTransactionInput
): { account: string; debit: number; credit: number }[] {
  const categoryAccount = `${input.category} Fund`;
  const cashAccount = input.account;

  if (input.type === "DEBIT") {
    // Money received into cash/bank — debit cash, credit the fund
    return [
      { account: cashAccount, debit: input.amount, credit: 0 },
      { account: categoryAccount, debit: 0, credit: input.amount },
    ];
  } else {
    // Payment out — debit the fund, credit cash/bank
    return [
      { account: categoryAccount, debit: input.amount, credit: 0 },
      { account: cashAccount, debit: 0, credit: input.amount },
    ];
  }
}

export function getTransactions(filters?: {
  category?: PaymentCategory;
  dateFrom?: string;
  dateTo?: string;
}): Transaction[] {
  let sql = `
    SELECT t.*, u.username
    FROM transactions t
    JOIN users u ON u.id = t.created_by_id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (filters?.category) {
    sql += " AND t.category = ?";
    params.push(filters.category);
  }
  if (filters?.dateFrom) {
    sql += " AND t.date >= ?";
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    sql += " AND t.date <= ?";
    params.push(filters.dateTo);
  }

  sql += " ORDER BY t.date DESC, t.created_at DESC";

  const rows = query<TransactionRow>(sql, params);
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    description: r.description,
    amount: r.amount,
    type: r.type,
    category: r.category,
    reference: r.reference,
    account: r.account,
    createdAt: r.created_at,
    createdById: r.created_by_id,
    createdByUsername: r.username,
  }));
}

export function getCashBook(category?: PaymentCategory): CashBookRow[] {
  let sql = `
    SELECT t.date, t.description, t.reference, t.amount, t.type, t.category, t.id as transactionId
    FROM transactions t
    WHERE 1=1
  `;
  const params: string[] = [];

  if (category) {
    sql += " AND t.category = ?";
    params.push(category);
  }

  sql += " ORDER BY t.date ASC, t.created_at ASC";

  interface CashRow {
    date: string;
    description: string;
    reference: string;
    amount: number;
    type: TransactionType;
    category: PaymentCategory;
    transactionId: string;
  }

  const rows = query<CashRow>(sql, params);
  let balance = 0;

  return rows.map((r) => {
    const debit = r.type === "DEBIT" ? r.amount : 0;
    const credit = r.type === "CREDIT" ? r.amount : 0;
    balance += debit - credit;

    return {
      date: r.date,
      description: r.description,
      reference: r.reference,
      debit,
      credit,
      balance,
      category: r.category,
      transactionId: r.transactionId,
    };
  });
}

export function getTrialBalance(): TrialBalanceRow[] {
  const rows = query<LedgerRow>(
    `SELECT account, SUM(debit) as debit, SUM(credit) as credit
     FROM ledger_entries
     GROUP BY account
     ORDER BY account ASC`
  );

  return rows.map((r) => ({
    account: r.account,
    debit: r.debit,
    credit: r.credit,
  }));
}

export function getDashboardStats(): {
  totalReceipts: number;
  totalPayments: number;
  balance: number;
  transactionCount: number;
  byCategory: { category: string; total: number }[];
} {
  interface TotalsRow {
    type: TransactionType;
    total: number;
  }
  interface CountRow {
    count: number;
  }
  interface CategoryRow {
    category: string;
    total: number;
  }

  const totals = query<TotalsRow>(
    `SELECT type, SUM(amount) as total FROM transactions GROUP BY type`
  );
  const countRow = query<CountRow>(`SELECT COUNT(*) as count FROM transactions`);
  const byCategory = query<CategoryRow>(
    `SELECT category, SUM(amount) as total FROM transactions WHERE type = 'DEBIT' GROUP BY category`
  );

  const receipts = totals.find((r) => r.type === "DEBIT")?.total ?? 0;
  const payments = totals.find((r) => r.type === "CREDIT")?.total ?? 0;

  return {
    totalReceipts: receipts,
    totalPayments: payments,
    balance: receipts - payments,
    transactionCount: countRow[0]?.count ?? 0,
    byCategory,
  };
}
