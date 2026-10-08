-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('Cash', 'Bank');

-- CreateTable: students
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "termFee" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateTable: fee_payments
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- Add optional studentId to Transaction
ALTER TABLE "Transaction" ADD COLUMN "studentId" TEXT;

-- Foreign Keys
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "Student_form_idx" ON "Student"("form");
CREATE INDEX "FeePayment_studentId_idx" ON "FeePayment"("studentId");
CREATE INDEX "FeePayment_term_idx" ON "FeePayment"("term");
CREATE INDEX "Transaction_studentId_idx" ON "Transaction"("studentId");
