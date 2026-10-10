-- Make studentId NOT NULL on Transaction
-- (safe to run even if column is already NOT NULL)
DO $$
BEGIN
  -- Remove any orphaned transactions with no student
  DELETE FROM "Transaction" WHERE "studentId" IS NULL OR "studentId" = '';
  -- Set NOT NULL constraint
  ALTER TABLE "Transaction" ALTER COLUMN "studentId" SET NOT NULL;
EXCEPTION WHEN others THEN
  NULL; -- already NOT NULL, skip
END $$;

-- Add term column to Transaction if not present
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

DO $$
BEGIN
  ALTER TABLE "StudentTermBalance"
    ADD CONSTRAINT "StudentTermBalance_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "StudentTermBalance_studentId_idx" ON "StudentTermBalance"("studentId");
CREATE INDEX IF NOT EXISTS "FeePayment_term_studentId_idx" ON "FeePayment"("term", "studentId");
