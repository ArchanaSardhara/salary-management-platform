"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export const COMPENSATION_PAGE_SIZE = 5;

import {
  createCompensationRecord,
  createEmployee,
  deleteEmployee,
  getCompensationAuditLog,
  getCurrencies,
  getEmployee,
  getEmployeeOptions,
  listCompensationRecords,
  listEmployees,
  updateCompensationRecord,
  updateEmployee,
} from "./api";
import { SCROLL_PAGE_SIZE } from "./list-params";
import type {
  CreateCompensationPayload,
  EmployeeListFilters,
  UpdateCompensationPayload,
  UpdateEmployeePayload,
} from "./types";

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
  lists: (employeeId: string) => [...compensationKeys.all(employeeId), "list"] as const,
  list: (employeeId: string, page: number) => [...compensationKeys.lists(employeeId), page] as const,
  audit: (employeeId: string, recordId: string) =>
    [...compensationKeys.all(employeeId), "audit", recordId] as const,
};

export function useCompensationRecords(employeeId: string, page = 1) {
  return useQuery({
    queryKey: compensationKeys.list(employeeId, page),
    queryFn: () => listCompensationRecords(employeeId, page, COMPENSATION_PAGE_SIZE),
    placeholderData: keepPreviousData,
  });
}

export function useCompensationAuditLog(employeeId: string, recordId: string) {
  return useQuery({
    queryKey: compensationKeys.audit(employeeId, recordId),
    queryFn: () => getCompensationAuditLog(employeeId, recordId),
  });
}

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: getCurrencies,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useUpdateCompensationRecord(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      recordId,
      payload,
    }: {
      recordId: string;
      payload: UpdateCompensationPayload;
    }) => updateCompensationRecord(employeeId, recordId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: compensationKeys.lists(employeeId),
      });
    },
  });
}

export function useCreateCompensationRecord(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCompensationPayload) =>
      createCompensationRecord(employeeId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: compensationKeys.lists(employeeId),
      });
    },
  });
}
