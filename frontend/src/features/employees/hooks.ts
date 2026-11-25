"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createEmployee,
  deleteEmployee,
  getCompensationAuditLog,
  getEmployee,
  getEmployeeOptions,
  listCompensationRecords,
  listEmployees,
  updateEmployee,
} from "./api";
import { SCROLL_PAGE_SIZE } from "./list-params";
import type { EmployeeListFilters, UpdateEmployeePayload } from "./types";

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (filters: EmployeeListFilters) => [...employeeKeys.lists(), filters] as const,
  detail: (id: string) => [...employeeKeys.all, "detail", id] as const,
  options: () => [...employeeKeys.all, "options"] as const,
};

const OPTIONS_STALE_TIME = 10 * 60 * 1000;

/**
 * Directory list, loaded page by page as the user scrolls. Pages come from
 * the backend's server-side pagination.
 */
export function useInfiniteEmployees(filters: EmployeeListFilters) {
  return useInfiniteQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: ({ pageParam }) => listEmployees(filters, pageParam, SCROLL_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) => (meta.page < meta.totalPages ? meta.page + 1 : undefined),
    // Keep the previous results on screen while new filters load.
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => getEmployee(id),
  });
}

export function useEmployeeOptions() {
  return useQuery({
    queryKey: employeeKeys.options(),
    queryFn: getEmployeeOptions,
    staleTime: OPTIONS_STALE_TIME,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: (employee) => {
      queryClient.setQueryData(employeeKeys.detail(employee.id), employee);
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      // A new country may now be "in use" for the country filter.
      void queryClient.invalidateQueries({ queryKey: employeeKeys.options() });
    },
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateEmployeePayload) => updateEmployee(id, payload),
    onSuccess: (employee) => {
      queryClient.setQueryData(employeeKeys.detail(id), employee);
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: employeeKeys.options() });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: (employee) => {
      queryClient.setQueryData(employeeKeys.detail(employee.id), employee);
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

// ---------------------------------------------------------------------------
// Compensation
// ---------------------------------------------------------------------------

export const compensationKeys = {
  all: (employeeId: string) => ["compensation", employeeId] as const,
  list: (employeeId: string) => [...compensationKeys.all(employeeId), "list"] as const,
  audit: (employeeId: string, recordId: string) =>
    [...compensationKeys.all(employeeId), "audit", recordId] as const,
};

export function useCompensationRecords(employeeId: string) {
  return useQuery({
    queryKey: compensationKeys.list(employeeId),
    queryFn: () => listCompensationRecords(employeeId),
  });
}

export function useCompensationAuditLog(employeeId: string, recordId: string) {
  return useQuery({
    queryKey: compensationKeys.audit(employeeId, recordId),
    queryFn: () => getCompensationAuditLog(employeeId, recordId),
  });
}
