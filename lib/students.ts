import { prisma } from "./db";
import type { Student, FeePayment, PaymentMethod } from "@/types";

interface DecimalLike { toNumber(): number }
function toNum(v: DecimalLike | number | string | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  return v.toNumber();
}

interface PaymentRow { amount: DecimalLike | number; createdAt: Date; term: string; }
interface TermBalRow { term: string; expectedAmount: DecimalLike | number; carryForward: DecimalLike | number; }

interface StudentRow {
  id: string; studentId: string; firstName: string; lastName: string;
  form: string; class: string; termFee: DecimalLike | number; createdAt: Date;
  feePayments: PaymentRow[];
  termBalances: TermBalRow[];
}

function mapStudent(r: StudentRow): Student {
  const payments = r.feePayments ?? [];
  const totalPaid = payments.reduce((s, p) => s + toNum(p.amount), 0);
  const sorted = [...payments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const last = sorted[0] ?? null;

  // Carry-forward: sum of carryForward across all term balances
  const carryForward = (r.termBalances ?? []).reduce((s, tb) => s + toNum(tb.carryForward), 0);

  // Expected: sum of all term balances expectedAmount + carryForward
  const totalExpected = (r.termBalances ?? []).reduce(
    (s, tb) => s + toNum(tb.expectedAmount) + toNum(tb.carryForward), 0
  ) || toNum(r.termFee); // fall back to termFee if no term balances yet

  return {
    id: r.id, studentId: r.studentId, firstName: r.firstName, lastName: r.lastName,
    form: r.form, class: r.class, termFee: toNum(r.termFee), createdAt: r.createdAt.toISOString(),
    totalPaid, lastPayment: last ? last.createdAt.toISOString() : null,
    lastPaymentAmount: last ? toNum(last.amount) : null,
    balance: totalExpected - totalPaid,
    carryForward,
  };
}

const STUDENT_INCLUDE = {
  feePayments: { select: { amount: true, createdAt: true, term: true } },
  termBalances: { select: { term: true, expectedAmount: true, carryForward: true } },
};

export async function getStudents(filters?: {
  search?: string;
  balanceFilter?: "all" | "paid" | "partial" | "unpaid" | "outstanding";
}): Promise<Student[]> {
  const rows = (await prisma.student.findMany({
    where: filters?.search ? {
      OR: [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName:  { contains: filters.search, mode: "insensitive" } },
        { studentId: { contains: filters.search, mode: "insensitive" } },
        { form:      { contains: filters.search, mode: "insensitive" } },
      ],
    } : undefined,
    include: STUDENT_INCLUDE,
    orderBy: [{ form: "asc" }, { lastName: "asc" }],
  })) as unknown as StudentRow[];

  const students = rows.map(mapStudent);

  if (!filters?.balanceFilter || filters.balanceFilter === "all") return students;

  switch (filters.balanceFilter) {
    case "paid":        return students.filter(s => s.balance <= 0);
    case "partial":     return students.filter(s => s.balance > 0 && s.totalPaid > 0);
    case "unpaid":      return students.filter(s => s.totalPaid === 0);
    case "outstanding": return students.filter(s => s.balance > 0).sort((a, b) => b.balance - a.balance);
    default:            return students;
  }
}

export async function getStudent(id: string): Promise<Student | null> {
  const r = (await prisma.student.findUnique({
    where: { id }, include: STUDENT_INCLUDE,
  })) as unknown as StudentRow | null;
  return r ? mapStudent(r) : null;
}

export async function getStudentPayments(studentId: string): Promise<FeePayment[]> {
  interface FeeRow {
    id: string; studentId: string; amount: DecimalLike | number; method: string;
    reference: string; term: string; notes: string | null; createdAt: Date;
    createdBy: { username: string };
    feeType: { name: string } | null;
  }
  const rows = (await prisma.feePayment.findMany({
    where: { studentId },
    include: { createdBy: { select: { username: true } }, feeType: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })) as unknown as FeeRow[];

  return rows.map(r => ({
    id: r.id, studentId: r.studentId, amount: toNum(r.amount),
    method: r.method as PaymentMethod, reference: r.reference,
    feeTypeName: r.feeType?.name, term: r.term, notes: r.notes,
    createdAt: r.createdAt.toISOString(), createdByUsername: r.createdBy.username,
  }));
}

export interface CreateStudentInput {
  studentId: string; firstName: string; lastName: string;
  form: string; class: string; termFee: number; term: string;
}

export async function createStudent(input: CreateStudentInput): Promise<string> {
  // Get all active fee types to build term balance
  const feeTypes = (await prisma.feeType.findMany({
    where: { active: true }, select: { amount: true },
  })) as unknown as { amount: DecimalLike | number }[];

  const expectedAmount = feeTypes.length > 0
    ? feeTypes.reduce((s, ft) => s + toNum(ft.amount), 0)
    : input.termFee;

  const student = await prisma.student.create({
    data: {
      studentId: input.studentId, firstName: input.firstName, lastName: input.lastName,
      form: input.form, class: input.class, termFee: input.termFee,
      termBalances: {
        create: { term: input.term, expectedAmount, carryForward: 0 },
      },
    },
  });
  return (student as { id: string }).id;
}

export async function bulkCreateStudents(
  inputs: (CreateStudentInput)[]
): Promise<{ created: number; skipped: number }> {
  let created = 0; let skipped = 0;
  for (const input of inputs) {
    const existing = await prisma.student.findUnique({ where: { studentId: input.studentId } });
    if (existing) { skipped++; continue; }
    await createStudent(input);
    created++;
  }
  return { created, skipped };
}

export interface RecordFeePaymentInput {
  studentId: string; amount: number; method: PaymentMethod;
  reference: string; term: string; notes?: string;
  feeTypeId?: string; createdById: string;
}

export async function recordFeePayment(input: RecordFeePaymentInput): Promise<string> {
  const p = await prisma.feePayment.create({
    data: {
      studentId: input.studentId, amount: input.amount, method: input.method,
      reference: input.reference, term: input.term,
      notes: input.notes ?? null, feeTypeId: input.feeTypeId ?? null,
      createdById: input.createdById,
    },
  });
  return (p as { id: string }).id;
}

/** Roll outstanding balance from one term into the next as carry-forward */
export async function rollOverTerm(opts: {
  studentId: string; fromTerm: string; toTerm: string; newExpectedAmount: number;
}): Promise<void> {
  const student = await getStudent(opts.studentId);
  if (!student) return;

  // Payments made for the fromTerm
  const fromPayments = (await prisma.feePayment.findMany({
    where: { studentId: opts.studentId, term: opts.fromTerm },
    select: { amount: true },
  })) as unknown as { amount: DecimalLike | number }[];

  const paidForTerm = fromPayments.reduce((s, p) => s + toNum(p.amount), 0);

  const fromBalance = (await prisma.studentTermBalance.findUnique({
    where: { studentId_term: { studentId: opts.studentId, term: opts.fromTerm } },
  })) as unknown as { expectedAmount: DecimalLike | number; carryForward: DecimalLike | number } | null;

  const expectedForTerm = fromBalance
    ? toNum(fromBalance.expectedAmount) + toNum(fromBalance.carryForward)
    : student.termFee;

  const outstanding = Math.max(0, expectedForTerm - paidForTerm);

  await prisma.studentTermBalance.upsert({
    where: { studentId_term: { studentId: opts.studentId, term: opts.toTerm } },
    create: {
      studentId: opts.studentId, term: opts.toTerm,
      expectedAmount: opts.newExpectedAmount, carryForward: outstanding,
    },
    update: { carryForward: outstanding, expectedAmount: opts.newExpectedAmount },
  });
}

export async function getStudentSummaryStats() {
  const rows = (await prisma.student.findMany({ include: STUDENT_INCLUDE })) as unknown as StudentRow[];
  const students = rows.map(mapStudent);
  const fullyPaid     = students.filter(s => s.balance <= 0).length;
  const partiallyPaid = students.filter(s => s.balance > 0 && s.totalPaid > 0).length;
  const unpaid        = students.filter(s => s.totalPaid === 0).length;
  const totalExpected = students.reduce((s, st) => s + st.balance + st.totalPaid, 0);
  const totalCollected = students.reduce((s, st) => s + st.totalPaid, 0);
  return {
    total: students.length, fullyPaid, partiallyPaid, unpaid,
    totalExpected, totalCollected, outstanding: totalExpected - totalCollected,
  };
}
