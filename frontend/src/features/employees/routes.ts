export const EMPLOYEE_ROUTES = {
  list: "/employees",
  create: "/employees/new",
  detail: (id: string) => `/employees/${encodeURIComponent(id)}`,
  edit: (id: string) => `/employees/${encodeURIComponent(id)}/edit`,
} as const;

/** HR Managers and Admins can view employee pages; write actions are HR-only. */
export const EMPLOYEE_PAGE_ROLES = ["HR_MANAGER", "ADMIN"] as const;

/** Only HR Managers may create or edit employees. */
export const EMPLOYEE_WRITE_ROLES = ["HR_MANAGER"] as const;
