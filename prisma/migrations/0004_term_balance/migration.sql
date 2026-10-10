-- Make studentId NOT NULL on Transaction (it was optional before)
-- First set any NULLs to a placeholder if any exist
UPDATE "Transaction" SET "studentId" = '' WHERE "studentId" IS NULL;
ALTER TABLE "Transaction" ALTER COLUMN "studentId" SET NOT NULL;

-- Add term column to Transaction
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "term" TEXT;

-- StudentTermBalance table
CREATE TABLE IF NOT EXISTS "StudentTermBalance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "expectedAmount" DECIMAL(12,2) NOT NULL,
    "carryForward" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentTermBalance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StudentTermBalance_studentId_term_key"
    ON "StudentTermBalance"("studentId", "term");
ALTER TABLE "StudentTermBalance"
    ADD CONSTRAINT "StudentTermBalance_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "StudentTermBalance_studentId_idx" ON "StudentTermBalance"("studentId");
CREATE INDEX IF NOT EXISTS "FeePayment_term_studentId_idx" ON "FeePayment"("term", "studentId");
