-- New enums
CREATE TYPE "PaymentMethod_new" AS ENUM ('Cash', 'Bank', 'ZBSmilePay');
ALTER TABLE "FeePayment" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING "method"::text::"PaymentMethod_new";
DROP TYPE IF EXISTS "PaymentMethod";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";

CREATE TYPE "ZBPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- FeeType table
CREATE TABLE "FeeType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeeType_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeeType_name_key" ON "FeeType"("name");

-- Alter FeePayment
ALTER TABLE "FeePayment"
    ADD COLUMN IF NOT EXISTS "feeTypeId" TEXT,
    ADD COLUMN IF NOT EXISTS "bankReceipt" TEXT,
    ADD COLUMN IF NOT EXISTS "zbPaymentId" TEXT,
    ADD COLUMN IF NOT EXISTS "zbStatus" "ZBPaymentStatus" DEFAULT 'PENDING';

ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_feeTypeId_fkey"
    FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ZBPayment table
CREATE TABLE "ZBPayment" (
    "id" TEXT NOT NULL,
    "zbReference" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeTypeId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "term" TEXT NOT NULL,
    "schoolReceipt" TEXT NOT NULL,
    "status" "ZBPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentUrl" TEXT,
    "payerPhone" TEXT,
    "payerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ZBPayment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ZBPayment_zbReference_key" ON "ZBPayment"("zbReference");
CREATE INDEX "ZBPayment_studentId_idx" ON "ZBPayment"("studentId");
CREATE INDEX "ZBPayment_status_idx" ON "ZBPayment"("status");

-- Add studentId to Transaction if missing
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "studentId" TEXT;
