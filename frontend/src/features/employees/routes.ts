export const EMPLOYEE_ROUTES = {
  list: "/employees",
  create: "/employees/new",
  detail: (id: string) => `/employees/${encodeURIComponent(id)}`,
  edit: (id: string) => `/employees/${encodeURIComponent(id)}/edit`,
} as const;

/** Only HR Managers can use the employee pages (the API enforces the same). */
export const EMPLOYEE_PAGE_ROLES = ["HR_MANAGER"] as const;
