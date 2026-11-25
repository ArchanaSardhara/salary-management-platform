import type { EmployeeStatus, EmployeeStatusFilter } from "./types";

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: "Active",
  DELETED: "Deleted",
};

export const STATUS_FILTER_OPTIONS: readonly { value: EmployeeStatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "deleted", label: "Deleted" },
];
