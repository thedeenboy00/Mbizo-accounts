export type PaymentCategory =
  | "BEAM"
  | "PLAN"
  | "HIGHERLIFE"
  | "CAMFED"
  | "CHILDCARE"
  | "SELF";

export type TransactionType = "DEBIT" | "CREDIT";

export type AccountType = "Cash" | "Bank";

export interface User {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: PaymentCategory;
  reference: string;
  account: AccountType;
  createdAt: string;
  createdById: string;
  createdByUsername?: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  account: string;
  debit: number;
  credit: number;
  createdAt: string;
}

export interface CashBookRow {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  category: PaymentCategory;
  transactionId: string;
}

export interface TrialBalanceRow {
  account: string;
  debit: number;
  credit: number;
}

export interface SessionUser {
  id: string;
  username: string;
  role: string;
}
