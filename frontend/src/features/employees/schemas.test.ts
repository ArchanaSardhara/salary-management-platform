import { describe, expect, it } from "vitest";

import {
  buildUpdatePayload,
  employeeFormSchema,
  employeeToFormValues,
  formValuesToPayload,
} from "./schemas";
import type { Employee } from "./types";

const employee: Employee = {
  id: "emp-1",
  employeeCode: "EMP-000042",
  firstName: "Priya",
  lastName: "Sharma",
  email: "priya@example.com",
  countryCode: "IN",
  department: "Engineering",
  jobTitle: "Software Engineer",
  startDate: "2026-01-15",
  endDate: null,
  status: "ACTIVE",
  version: 3,
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z",
  deletedAt: null,
};

const validValues = employeeToFormValues(employee);

describe("employeeFormSchema", () => {
  it("accepts a valid employee", () => {
    expect(employeeFormSchema.safeParse(validValues).success).toBe(true);
  });

  it("reports required fields", () => {
    const result = employeeFormSchema.safeParse({
      ...validValues,
      firstName: "  ",
      countryCode: "",
      department: "",
      jobTitle: "",
      startDate: "",
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((issue) => issue.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        "First name is required",
        "Country is required",
        "Department is required",
        "Title is required",
        "Joining date is required",
      ]),
    );
  });

  it("rejects an invalid email but allows a blank one", () => {
    expect(
      employeeFormSchema.safeParse({ ...validValues, email: "nope" }).success,
    ).toBe(false);
    expect(
      employeeFormSchema.safeParse({ ...validValues, email: "" }).success,
    ).toBe(true);
  });

  it("rejects an end date before the joining date", () => {
    const result = employeeFormSchema.safeParse({
      ...validValues,
      endDate: "2025-12-31",
    });
    expect(result.error?.issues[0]).toMatchObject({
      path: ["endDate"],
      message: "End date cannot be before the joining date",
    });
  });
});

describe("formValuesToPayload", () => {
  it("turns blank optional fields into null and normalises email", () => {
    expect(
      formValuesToPayload({
        ...validValues,
        lastName: " ",
        email: " ADA@Example.com ",
        endDate: "",
      }),
    ).toMatchObject({
      lastName: null,
      email: "ada@example.com",
      endDate: null,
    });
  });
});

describe("buildUpdatePayload", () => {
  it("sends only changed fields with the version", () => {
    expect(
      buildUpdatePayload(employee, {
        ...validValues,
        department: "Finance",
        email: "",
      }),
    ).toEqual({ department: "Finance", email: null, version: 3 });
  });

  it("sends only the version when nothing changed", () => {
    expect(buildUpdatePayload(employee, validValues)).toEqual({ version: 3 });
  });
});
