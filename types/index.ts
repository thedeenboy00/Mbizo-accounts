export type PaymentCategory =
  | "BEAM" | "PLAN" | "HIGHERLIFE" | "CAMFED" | "CHILDCARE" | "SELF";
export type TransactionType = "DEBIT" | "CREDIT";
export type AccountType     = "Cash" | "Bank";
export type UserRole        = "admin" | "bursar" | "cashier";
export type PaymentMethod   = "Cash" | "Bank" | "ZBSmilePay";

export interface SessionUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  form: string;
  class: string;
  termFee: number;
  createdAt: string;
  // computed
  totalPaid: number;
  lastPayment: string | null;
  lastPaymentAmount: number | null;
  balance: number;           // current term balance (including carry-forward)
  carryForward: number;      // outstanding from previous term
}

export interface StudentTermBalance {
  id: string;
  studentId: string;
  term: string;
  expectedAmount: number;
  carryForward: number;
  createdAt: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  studentName?: string;
  feeTypeName?: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  term: string;
  notes: string | null;
  createdAt: string;
  createdByUsername?: string;
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
  term: string | null;
  studentId: string;
  studentName?: string;
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

export interface LedgerRow {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  transactionId: string;
}
