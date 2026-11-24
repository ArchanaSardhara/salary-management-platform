/*
  Warnings:

  - You are about to drop the column `changed_by` on the `audit_logs` table. All the data in the column will be lost.
  - Added the required column `end_date` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CompensationType" AS ENUM ('BASE_SALARY', 'BONUS', 'COMMISSION', 'EQUITY_GRANT', 'ALLOWANCE');

-- CreateEnum
CREATE TYPE "PayFrequency" AS ENUM ('MONTHLY', 'SEMI_MONTHLY', 'BI_WEEKLY', 'WEEKLY', 'ANNUAL');

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "changed_by",
ADD COLUMN     "changed_by_id" TEXT;

-- AlterTable
ALTER TABLE "compensation_records" ADD COLUMN     "change_reason" TEXT,
ADD COLUMN     "pay_frequency" "PayFrequency" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "type" "CompensationType" NOT NULL DEFAULT 'BASE_SALARY';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "end_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "audit_logs_changed_by_id_idx" ON "audit_logs"("changed_by_id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
