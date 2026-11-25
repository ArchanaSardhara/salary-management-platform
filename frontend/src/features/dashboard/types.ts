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

export interface HeadcountMonthItem {
  month: string;
  active: number;
  newHires: number;
}

export interface HeadcountTrend {
  months: HeadcountMonthItem[];
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

export interface EmployeeWithoutCompensationItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string | null;
  department: string;
  countryCode: string;
  startDate: string;
}
