"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCompensationTypeBreakdown,
  getDashboardStats,
  getEmployeesWithoutCompensation,
  getHeadcountTrend,
  getPayrollByCountry,
  getPayrollByDepartment,
  getRecentChanges,
} from "./api";

const STALE_TIME = 2 * 60 * 1000;

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  payrollByDepartment: (currency: string) => [...dashboardKeys.all, "payroll-dept", currency] as const,
  payrollByCountry: (currency: string) => [...dashboardKeys.all, "payroll-country", currency] as const,
  compensationTypeBreakdown: () => [...dashboardKeys.all, "comp-type"] as const,
  headcountTrend: () => [...dashboardKeys.all, "headcount"] as const,
  recentChanges: (limit: number) => [...dashboardKeys.all, "recent-changes", limit] as const,
  noCompensation: (limit: number) => [...dashboardKeys.all, "no-comp", limit] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: getDashboardStats,
    staleTime: STALE_TIME,
  });
}

export function usePayrollByDepartment(currency: string) {
  return useQuery({
    queryKey: dashboardKeys.payrollByDepartment(currency),
    queryFn: () => getPayrollByDepartment(currency),
    staleTime: STALE_TIME,
  });
}

export function usePayrollByCountry(currency: string) {
  return useQuery({
    queryKey: dashboardKeys.payrollByCountry(currency),
    queryFn: () => getPayrollByCountry(currency),
    staleTime: STALE_TIME,
  });
}

export function useCompensationTypeBreakdown() {
  return useQuery({
    queryKey: dashboardKeys.compensationTypeBreakdown(),
    queryFn: getCompensationTypeBreakdown,
    staleTime: STALE_TIME,
  });
}

export function useHeadcountTrend() {
  return useQuery({
    queryKey: dashboardKeys.headcountTrend(),
    queryFn: getHeadcountTrend,
    staleTime: STALE_TIME,
  });
}

export function useRecentChanges(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.recentChanges(limit),
    queryFn: () => getRecentChanges(limit),
    staleTime: STALE_TIME,
  });
}

export function useEmployeesWithoutCompensation(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.noCompensation(limit),
    queryFn: () => getEmployeesWithoutCompensation(limit),
    staleTime: STALE_TIME,
  });
}
