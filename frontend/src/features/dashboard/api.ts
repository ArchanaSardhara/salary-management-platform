import { apiRequest } from "@/lib/api-client";
import { toQueryString } from "@/lib/search-params";
import type {
  CompensationTypeBreakdown,
  DashboardStats,
  EmployeeWithoutCompensationItem,
  HeadcountTrend,
  PayrollGroupItem,
  RecentChangeItem,
} from "./types";

export function getDashboardStats(): Promise<DashboardStats> {
  return apiRequest<DashboardStats>("/dashboard/stats");
}

export function getPayrollByDepartment(currency: string): Promise<PayrollGroupItem[]> {
  return apiRequest<PayrollGroupItem[]>(`/dashboard/payroll-by-department${toQueryString({ currency })}`);
}

export function getPayrollByCountry(currency: string): Promise<PayrollGroupItem[]> {
  return apiRequest<PayrollGroupItem[]>(`/dashboard/payroll-by-country${toQueryString({ currency })}`);
}

export function getCompensationTypeBreakdown(): Promise<CompensationTypeBreakdown> {
  return apiRequest<CompensationTypeBreakdown>("/dashboard/compensation-type-breakdown");
}

export function getHeadcountTrend(): Promise<HeadcountTrend> {
  return apiRequest<HeadcountTrend>("/dashboard/headcount-trend");
}

export function getRecentChanges(limit = 10): Promise<RecentChangeItem[]> {
  return apiRequest<RecentChangeItem[]>(`/dashboard/recent-changes${toQueryString({ limit })}`);
}

export function getEmployeesWithoutCompensation(limit = 10): Promise<EmployeeWithoutCompensationItem[]> {
  return apiRequest<EmployeeWithoutCompensationItem[]>(
    `/dashboard/employees-without-compensation${toQueryString({ limit })}`,
  );
}
