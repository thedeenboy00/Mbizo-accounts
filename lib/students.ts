import { prisma } from "./db";
import type { Student, FeePayment, PaymentMethod } from "@/types";

interface DecimalLike { toNumber(): number }
function toNum(v: DecimalLike | number | string | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  return v.toNumber();
}

interface StudentRow {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  form: string;
  class: string;
  termFee: DecimalLike | number;
  createdAt: Date;
  feePayments: { amount: DecimalLike | number; createdAt: Date }[];
}

function mapStudent(r: StudentRow): Student {
  const payments = r.feePayments ?? [];
  const totalPaid = payments.reduce((s, p) => s + toNum(p.amount), 0);
  const sorted = [...payments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  const last = sorted[0] ?? null;

  return {
    id: r.id,
    studentId: r.studentId,
    firstName: r.firstName,
    lastName: r.lastName,
    form: r.form,
    class: r.class,
    termFee: toNum(r.termFee),
    createdAt: r.createdAt.toISOString(),
    totalPaid,
    lastPayment: last ? last.createdAt.toISOString() : null,
    lastPaymentAmount: last ? toNum(last.amount) : null,
    balance: toNum(r.termFee) - totalPaid,
  };
}

export async function getStudents(search?: string): Promise<Student[]> {
  const rows = (await prisma.student.findMany({
    where: search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { studentId: { contains: search, mode: "insensitive" } },
            { form: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      feePayments: { select: { amount: true, createdAt: true } },
    },
    orderBy: [{ form: "asc" }, { lastName: "asc" }],
  })) as unknown as StudentRow[];

  return rows.map(mapStudent);
}

export async function getStudent(id: string): Promise<Student | null> {
  const r = (await prisma.student.findUnique({
    where: { id },
    include: {
      feePayments: { select: { amount: true, createdAt: true } },
    },
  })) as unknown as StudentRow | null;
  return r ? mapStudent(r) : null;
}

export async function getStudentPayments(studentId: string): Promise<FeePayment[]> {
  interface FeeRow {
    id: string;
    studentId: string;
    amount: DecimalLike | number;
    method: string;
    reference: string;
    term: string;
    notes: string | null;
    createdAt: Date;
    createdBy: { username: string };
  }

  const rows = (await prisma.feePayment.findMany({
    where: { studentId },
    include: { createdBy: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  })) as unknown as FeeRow[];

  return rows.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    amount: toNum(r.amount),
    method: r.method as PaymentMethod,
    reference: r.reference,
    term: r.term,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    createdByUsername: r.createdBy.username,
  }));
}

export interface CreateStudentInput {
  studentId: string;
  firstName: string;
  lastName: string;
  form: string;
  class: string;
  termFee: number;
}

export async function createStudent(input: CreateStudentInput): Promise<string> {
  const s = await prisma.student.create({ data: input });
  return s.id;
}

export async function bulkCreateStudents(
  inputs: CreateStudentInput[]
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const input of inputs) {
    const existing = await prisma.student.findUnique({
      where: { studentId: input.studentId },
    });
    if (existing) { skipped++; continue; }
    await prisma.student.create({ data: input });
    created++;
  }

  return { created, skipped };
}

export interface RecordFeePaymentInput {
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  term: string;
  notes?: string;
  createdById: string;
}

export async function recordFeePayment(
  input: RecordFeePaymentInput
): Promise<string> {
  const p = await prisma.feePayment.create({
    data: {
      studentId: input.studentId,
      amount: input.amount,
      method: input.method,
      reference: input.reference,
      term: input.term,
      notes: input.notes ?? null,
      createdById: input.createdById,
    },
  });
  return p.id;
}

export async function getStudentSummaryStats(): Promise<{
  total: number;
  fullyPaid: number;
  partiallyPaid: number;
  unpaid: number;
  totalExpected: number;
  totalCollected: number;
  outstanding: number;
}> {
  const rows = (await prisma.student.findMany({
    include: {
      feePayments: { select: { amount: true, createdAt: true } },
    },
  })) as unknown as StudentRow[];

  const students = rows.map(mapStudent);
  const fullyPaid = students.filter((s) => s.balance <= 0).length;
  const partiallyPaid = students.filter((s) => s.balance > 0 && s.totalPaid > 0).length;
  const unpaid = students.filter((s) => s.totalPaid === 0).length;
  const totalExpected = students.reduce((s, st) => s + st.termFee, 0);
  const totalCollected = students.reduce((s, st) => s + st.totalPaid, 0);

  return {
    total: students.length,
    fullyPaid,
    partiallyPaid,
    unpaid,
    totalExpected,
    totalCollected,
    outstanding: totalExpected - totalCollected,
  };
}
