export interface DashboardStatsResponse {
  activeEmployees: number;
  newHiresThisMonth: number;
  employeesWithoutCompensation: number;
  compensationRecordsThisMonth: number;
}

/** One row in a payroll-by-department or payroll-by-country breakdown. */
export interface PayrollGroupItem {
  /** Department name or ISO 3166-1 alpha-2 country code. */
  name: string;
  currency: string;
  count: number;
  /** Decimal strings — never converted to float to preserve precision. */
  min: string;
  max: string;
  avg: string;
  total: string;
}

export interface CompensationTypeItem {
  type: string;
  count: number;
}

export interface CompensationTypeBreakdownResponse {
  breakdown: CompensationTypeItem[];
  /** Total active compensation records across all types. */
  total: number;
}

export type HeadcountGranularity = 'daily' | 'weekly' | 'monthly';

export interface HeadcountPeriodItem {
  /** "YYYY-MM-DD" for daily/weekly, "YYYY-MM" for monthly. */
  period: string;
  active: number;
  newHires: number;
}

export interface HeadcountTrendResponse {
  granularity: HeadcountGranularity;
  periods: HeadcountPeriodItem[];
}

export interface RecentChangeItem {
  id: string;
  compensationRecordId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  changedById: string | null;
  changedAt: string;
  /** null for the initial record creation (no previous compensation). */
  beforeAmount: string | null;
  beforeCurrency: string | null;
  afterAmount: string;
  afterCurrency: string;
}

/** Count of active (ongoing) compensation records per currency code. */
export interface PayrollCurrencyItem {
  currency: string;
  count: number;
}

export interface EmployeeWithoutCompensationItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string | null;
  department: string;
  countryCode: string;
  startDate: string;
}
