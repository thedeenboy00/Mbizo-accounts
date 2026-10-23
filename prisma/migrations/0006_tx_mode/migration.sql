-- Add txMode column to Transaction (safe if already exists)
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "txMode" TEXT NOT NULL DEFAULT 'fee';

-- Make studentId nullable (in case it was set NOT NULL previously)
ALTER TABLE "Transaction" ALTER COLUMN "studentId" DROP NOT NULL;
