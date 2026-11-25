import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, renderWithQueryClient } from "@/test/render";

import type { Employee, EmployeeOptions } from "../types";
import { CreateEmployeeView } from "./create-employee-view";
import { EditEmployeeView } from "./edit-employee-view";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

const fetchMock = vi.fn<typeof fetch>();
const API = "http://localhost:4000/api/v1";

const options: EmployeeOptions = {
  countryCodes: ["DE", "IN"],
  countriesInUse: ["IN"],
  departments: ["Engineering", "Finance"],
  jobTitles: ["Software Engineer", "Accountant"],
};

const employee: Employee = {
  id: "emp-1",
  employeeCode: "EMP-000001",
  firstName: "Priya",
  lastName: "Sharma",
  email: "priya@example.com",
  countryCode: "IN",
  department: "Engineering",
  jobTitle: "Software Engineer",
  startDate: "2026-01-15",
  endDate: null,
  status: "ACTIVE",
  version: 4,
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z",
  deletedAt: null,
};

beforeEach(() => {
  push.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

async function choose(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole("option", { name: option }));
}

function requestBody(method: string): unknown {
  const call = fetchMock.mock.calls.find(([, init]) => init?.method === method);
  return call ? JSON.parse(String(call[1]?.body)) : undefined;
}

describe("CreateEmployeeView", () => {
  beforeEach(() => {
    fetchMock.mockImplementation(async (input, init) => {
      if (String(input).endsWith("/employees/options")) return jsonResponse(options);
      if (init?.method === "POST") return jsonResponse({ ...employee, id: "emp-new" }, 201);
      return jsonResponse({}, 404);
    });
  });

  it("shows validation errors for required fields", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CreateEmployeeView />);

    await user.click(await screen.findByRole("button", { name: "Add employee" }));

    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(screen.getByText("Country is required")).toBeInTheDocument();
    expect(screen.getByText("Department is required")).toBeInTheDocument();
    expect(screen.getByText("Designation is required")).toBeInTheDocument();
    expect(screen.getByText("Joining date is required")).toBeInTheDocument();
    expect(requestBody("POST")).toBeUndefined();
  });

  it("creates the employee and opens the profile", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CreateEmployeeView />);

    await user.type(await screen.findByLabelText("First name"), "Priya");
    await user.type(screen.getByLabelText(/Email/), "Priya@Example.com");
    await choose(user, "Country", "India");
    await choose(user, "Department", "Engineering");
    await choose(user, "Designation", "Software Engineer");
    await user.type(screen.getByLabelText("Joining date"), "2026-01-15");
    await user.click(screen.getByRole("button", { name: "Add employee" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/employees/emp-new"));
    expect(requestBody("POST")).toEqual({
      firstName: "Priya",
      lastName: null,
      email: "priya@example.com",
      countryCode: "IN",
      department: "Engineering",
      jobTitle: "Software Engineer",
      startDate: "2026-01-15",
      endDate: null,
    });
  });

  it("shows the API error when the email is taken", async () => {
    fetchMock.mockImplementation(async (input, init) => {
      if (String(input).endsWith("/employees/options")) return jsonResponse(options);
      if (init?.method === "POST") {
        return jsonResponse(
          { statusCode: 409, message: "An employee with this email already exists" },
          409,
        );
      }
      return jsonResponse({}, 404);
    });
    const user = userEvent.setup();
    renderWithQueryClient(<CreateEmployeeView />);

    await user.type(await screen.findByLabelText("First name"), "Priya");
    await choose(user, "Country", "India");
    await choose(user, "Department", "Finance");
    await choose(user, "Designation", "Accountant");
    await user.type(screen.getByLabelText("Joining date"), "2026-01-15");
    await user.click(screen.getByRole("button", { name: "Add employee" }));

    expect(
      await screen.findByText("An employee with this email already exists"),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

describe("EditEmployeeView", () => {
  function mockEdit(patchResponse: () => Response) {
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/employees/options")) return jsonResponse(options);
      if (init?.method === "PATCH") return patchResponse();
      if (url.endsWith("/employees/emp-1")) return jsonResponse(employee);
      return jsonResponse({ statusCode: 404, message: "Employee not found" }, 404);
    });
  }

  it("prefills the form and saves only changed fields with the version", async () => {
    mockEdit(() => jsonResponse({ ...employee, department: "Finance", version: 5 }));
    const user = userEvent.setup();
    renderWithQueryClient(<EditEmployeeView id="emp-1" />);

    const firstName = await screen.findByLabelText("First name");
    expect(firstName).toHaveValue("Priya");
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();

    await choose(user, "Department", "Finance");
    await user.click(save);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/employees/emp-1"));
    expect(requestBody("PATCH")).toEqual({ department: "Finance", version: 4 });
    expect(fetchMock).toHaveBeenCalledWith(
      `${API}/employees/emp-1`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("shows a conflict when someone else changed the employee", async () => {
    mockEdit(() =>
      jsonResponse(
        {
          statusCode: 409,
          message: "This employee was changed by someone else; reload to see the latest version",
        },
        409,
      ),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<EditEmployeeView id="emp-1" />);

    await user.clear(await screen.findByLabelText("First name"));
    await user.type(screen.getByLabelText("First name"), "Priyanka");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText(/changed by someone else/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows not found for an unknown employee", async () => {
    mockEdit(() => jsonResponse({}));
    renderWithQueryClient(<EditEmployeeView id="missing" />);

    expect(await screen.findByText("Employee not found")).toBeInTheDocument();
  });
});
