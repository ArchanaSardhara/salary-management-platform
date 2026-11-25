import type {
  AuditLog,
  CompensationRecord,
  CompensationType,
  PayFrequency,
} from '../../../../generated/prisma/client';

/** Snapshot stored in audit_log.before_value / after_value. */
export interface CompensationSnapshot {
  amount: string;
  currencyCode: string;
  payFrequency: PayFrequency;
  type: CompensationType;
  effectiveFrom: string;
  effectiveTo: string | null;
  changeReason: string | null;
}

export interface CompensationResponse {
  id: string;
  employeeId: string;
  amount: string;
  currencyCode: string;
  payFrequency: PayFrequency;
  type: CompensationType;
  effectiveFrom: string;
  effectiveTo: string | null;
  changeReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogChangedBy {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
}

export interface AuditLogResponse {
  id: string;
  compensationRecordId: string;
  changedById: string | null;
  changedBy: AuditLogChangedBy | null;
  changedAt: Date;
  beforeValue: CompensationSnapshot | null;
  afterValue: CompensationSnapshot;
}

export interface PaginatedCompensationResponse {
  data: CompensationResponse[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** YYYY-MM-DD from a Postgres Date stored as a Date object at midnight UTC. */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function toCompensationResponse(
  record: CompensationRecord,
): CompensationResponse {
  return {
    id: record.id,
    employeeId: record.employeeId,
    amount: record.amount.toFixed(2),
    currencyCode: record.currencyCode,
    payFrequency: record.payFrequency,
    type: record.type,
    effectiveFrom: formatDate(record.effectiveFrom),
    effectiveTo: record.effectiveTo ? formatDate(record.effectiveTo) : null,
    changeReason: record.changeReason ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function toCompensationSnapshot(
  record: CompensationRecord,
): CompensationSnapshot {
  return {
    amount: record.amount.toFixed(2),
    currencyCode: record.currencyCode,
    payFrequency: record.payFrequency,
    type: record.type,
    effectiveFrom: formatDate(record.effectiveFrom),
    effectiveTo: record.effectiveTo ? formatDate(record.effectiveTo) : null,
    changeReason: record.changeReason ?? null,
  };
}

export function toAuditLogResponse(
  log: AuditLog & {
    changedBy: { id: string; firstName: string; lastName: string | null; email: string } | null;
  },
): AuditLogResponse {
  return {
    id: log.id,
    compensationRecordId: log.compensationRecordId,
    changedById: log.changedById ?? null,
    changedBy: log.changedBy
      ? {
          id: log.changedBy.id,
          firstName: log.changedBy.firstName,
          lastName: log.changedBy.lastName ?? null,
          email: log.changedBy.email,
        }
      : null,
    changedAt: log.changedAt,
    beforeValue: (log.beforeValue as unknown as CompensationSnapshot | null) ?? null,
    afterValue: log.afterValue as unknown as CompensationSnapshot,
  };
}
