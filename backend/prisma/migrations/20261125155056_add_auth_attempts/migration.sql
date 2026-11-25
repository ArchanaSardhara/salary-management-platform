-- CreateEnum
CREATE TYPE "AuthAction" AS ENUM ('LOGIN', 'FORGOT_PASSWORD', 'RESET_PASSWORD');

-- CreateTable
CREATE TABLE "auth_attempts" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "action" "AuthAction" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_attempts_locked_until_idx" ON "auth_attempts"("locked_until");

-- CreateIndex
CREATE UNIQUE INDEX "auth_attempts_identifier_action_key" ON "auth_attempts"("identifier", "action");
