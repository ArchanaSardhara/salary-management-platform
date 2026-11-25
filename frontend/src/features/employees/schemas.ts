import { z } from "zod";

import type {
  Employee,
  EmployeeFormPayload,
  UpdateEmployeePayload,
} from "./types";

/** Mirrors the backend's employee field rules (employee-fields.ts). */
const NAME_MAX = 100;
const EMAIL_MAX = 255;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isoDate = (message: string) =>
  z
    .string()
    .regex(ISO_DATE, message)
    .refine(
      (value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()),
      message,
    );

export const employeeFormSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(NAME_MAX, `First name must be at most ${NAME_MAX} characters`),
    lastName: z
      .string()
      .trim()
      .max(NAME_MAX, `Last name must be at most ${NAME_MAX} characters`),
    email: z
      .string()
      .trim()
      .max(EMAIL_MAX, `Email must be at most ${EMAIL_MAX} characters`)
      .refine((value) => value === "" || z.email().safeParse(value).success, {
        message: "Enter a valid email address",
      }),
    countryCode: z.string().min(1, "Country is required"),
    department: z.string().min(1, "Department is required"),
    jobTitle: z.string().min(1, "Title is required"),
    startDate: z
      .string()
      .min(1, "Joining date is required")
      .pipe(isoDate("Enter a valid joining date")),
    endDate: z.union([z.literal(""), isoDate("Enter a valid end date")]),
  })
  .refine(
    (values) => values.endDate === "" || values.endDate >= values.startDate,
    {
      message: "End date cannot be before the joining date",
      path: ["endDate"],
    },
  );

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const EMPTY_EMPLOYEE_FORM: EmployeeFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  countryCode: "",
  department: "",
  jobTitle: "",
  startDate: "",
  endDate: "",
};

export function employeeToFormValues(employee: Employee): EmployeeFormValues {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName ?? "",
    email: employee.email ?? "",
    countryCode: employee.countryCode,
    department: employee.department,
    jobTitle: employee.jobTitle,
    startDate: employee.startDate,
    endDate: employee.endDate ?? "",
  };
}

/** Form values → API payload. Blank optional fields become null. */
export function formValuesToPayload(
  values: EmployeeFormValues,
): EmployeeFormPayload {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim() || null,
    email: values.email.trim().toLowerCase() || null,
    countryCode: values.countryCode,
    department: values.department,
    jobTitle: values.jobTitle,
    startDate: values.startDate,
    endDate: values.endDate || null,
  };
}

/**
 * Builds a PATCH payload with only the fields that changed, plus the version
 * the edit was based on (the backend rejects stale versions with 409).
 */
export function buildUpdatePayload(
  employee: Employee,
  values: EmployeeFormValues,
): UpdateEmployeePayload {
  const next = formValuesToPayload(values);
  const current = formValuesToPayload(employeeToFormValues(employee));
  const changes: Partial<EmployeeFormPayload> = {};

  for (const key of Object.keys(next) as (keyof EmployeeFormPayload)[]) {
    if (next[key] !== current[key]) {
      Object.assign(changes, { [key]: next[key] });
    }
  }

  return { ...changes, version: employee.version };
}
