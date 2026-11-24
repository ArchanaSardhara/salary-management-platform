import { CURRENCY_CODES } from '../../../common/constants/currency-codes';

export { CURRENCY_CODES };

export const AMOUNT_MIN = 0.01;
export const AMOUNT_MAX = 10_000_000;

export const COMPENSATION_MESSAGES = {
  employeeNotFound: 'Employee not found',
  employeeDeleted: 'Cannot record compensation for a deleted employee',
  notFound: 'Compensation record not found',
  auditNotFound: 'Audit log not found for this compensation record',
  overlap:
    'The effective period overlaps with an existing compensation record for this employee',
  endBeforeStart: 'effectiveTo must be on or after effectiveFrom',
  noCurrent: 'No active compensation record found for this employee',
} as const;
