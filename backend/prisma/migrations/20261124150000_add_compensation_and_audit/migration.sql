-- CreateTable
CREATE TABLE "compensation_records" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency_code" CHAR(3) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compensation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "compensation_record_id" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "before_value" JSONB,
    "after_value" JSONB NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compensation_records_employee_id_effective_from_idx" ON "compensation_records"("employee_id", "effective_from");

-- CreateIndex
CREATE INDEX "compensation_records_employee_id_effective_to_idx" ON "compensation_records"("employee_id", "effective_to");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_compensation_record_id_key" ON "audit_logs"("compensation_record_id");

-- AddForeignKey
ALTER TABLE "compensation_records" ADD CONSTRAINT "compensation_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_compensation_record_id_fkey" FOREIGN KEY ("compensation_record_id") REFERENCES "compensation_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
