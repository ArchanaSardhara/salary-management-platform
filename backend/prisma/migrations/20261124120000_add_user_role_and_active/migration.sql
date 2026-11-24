-- CreateEnum
CREATE TYPE "Role" AS ENUM ('HR_MANAGER', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'HR_MANAGER';
