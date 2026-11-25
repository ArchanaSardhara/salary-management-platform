import { apiRequest } from "@/lib/api-client";
import { toQueryString } from "@/lib/search-params";

import type {
  CreateEmployeePayload,
  Employee,
  EmployeeListFilters,
  EmployeeListResponse,
  EmployeeOptions,
  UpdateEmployeePayload,
} from "./types";

/** Fetches one page. List filters are sent as repeated query keys. */
export function listEmployees(
  filters: EmployeeListFilters,
  page: number,
  pageSize: number,
): Promise<EmployeeListResponse> {
  const query = toQueryString({
    page,
    pageSize,
    // No status selected means every status.
    status: filters.statuses.length > 0 ? filters.statuses : "all",
    search: filters.search,
    countryCode: filters.countryCodes,
    department: filters.departments,
  });
  return apiRequest<EmployeeListResponse>(`/employees${query}`);
}

export function getEmployee(id: string): Promise<Employee> {
  return apiRequest<Employee>(`/employees/${encodeURIComponent(id)}`);
}

export function getEmployeeOptions(): Promise<EmployeeOptions> {
  return apiRequest<EmployeeOptions>("/employees/options");
}

export function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
  return apiRequest<Employee>("/employees", { method: "POST", body: payload });
}

export function updateEmployee(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
  return apiRequest<Employee>(`/employees/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

/** Soft delete: the backend keeps the record and marks it deleted. */
export function deleteEmployee(id: string): Promise<Employee> {
  return apiRequest<Employee>(`/employees/${encodeURIComponent(id)}`, { method: "DELETE" });
}
