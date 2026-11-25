export interface DashboardStats {
  activeEmployees: number;
  newHiresThisMonth: number;
  employeesWithoutCompensation: number;
  compensationRecordsThisMonth: number;
}

export interface PayrollGroupItem {
  name: string;
  currency: string;
  count: number;
  min: string;
  max: string;
  avg: string;
  total: string;
}

export interface CompensationTypeItem {
  type: string;
  count: number;
}

export interface CompensationTypeBreakdown {
  breakdown: CompensationTypeItem[];
  total: number;
}

export type HeadcountGranularity = "daily" | "weekly" | "monthly";

export interface HeadcountPeriodItem {
  /** "YYYY-MM-DD" for daily/weekly, "YYYY-MM" for monthly. */
  period: string;
  active: number;
  newHires: number;
}

export interface HeadcountTrend {
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
  beforeAmount: string | null;
  beforeCurrency: string | null;
  afterAmount: string;
  afterCurrency: string;
}

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
