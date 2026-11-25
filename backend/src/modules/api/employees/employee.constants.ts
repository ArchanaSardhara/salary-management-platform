/**
 * Fixed lists approved by the developer on 2026-11-24. Changing a list is a
 * code change; stored values are plain strings validated against these.
 */
export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Customer Support',
  'Finance',
  'Human Resources',
  'Operations',
  'Legal',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const JOB_TITLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Engineering Manager',
  'Product Manager',
  'Product Designer',
  'Data Analyst',
  'Marketing Specialist',
  'Sales Representative',
  'Account Manager',
  'Support Specialist',
  'Accountant',
  'Financial Analyst',
  'HR Specialist',
  'HR Manager',
  'Operations Manager',
  'Legal Counsel',
] as const;

export type JobTitle = (typeof JOB_TITLES)[number];

export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 255;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Formats the database-generated employee number, e.g. 42 -> "EMP-000042". */
export function formatEmployeeCode(employeeNumber: number): string {
  return `EMP-${String(employeeNumber).padStart(6, '0')}`;
}

/** Max length of the directory search term. */
export const SEARCH_MAX_LENGTH = 100;

/** Matches an employee code ("EMP-000042", "emp42") or a bare number ("42"). */
const EMPLOYEE_CODE_PATTERN = /^(?:EMP-?)?0*(\d{1,9})$/i;

/**
 * Parses a search term as an employee code. Returns the employee number, or
 * null when the term is not a code. Nine digits keep it within Postgres int.
 */
export function parseEmployeeCode(term: string): number | null {
  const match = EMPLOYEE_CODE_PATTERN.exec(term.trim());
  return match ? Number(match[1]) : null;
}
