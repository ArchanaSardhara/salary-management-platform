import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, renderWithQueryClient } from "@/test/render";

import { RegisterForm } from "./register-form";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  replace.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("First name"), "Ada");
  await user.type(screen.getByLabelText("Work email"), "ada@acme.test");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.type(screen.getByLabelText("Confirm password"), "password123");
}

describe("RegisterForm", () => {
  it("validates required fields", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects passwords longer than 20 characters and mismatched confirmation", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<RegisterForm />);

    await user.type(screen.getByLabelText("First name"), "Ada");
    await user.type(screen.getByLabelText("Work email"), "ada@acme.test");
    await user.type(screen.getByLabelText("Password"), "a".repeat(21));
    await user.type(screen.getByLabelText("Confirm password"), "different");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Password must be at most 20 characters"),
    ).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("registers without sending confirmPassword or an empty last name", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, message: "Registration successful" }));
    const user = userEvent.setup();
    renderWithQueryClient(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:4000/api/v1/auth/register");
    expect(JSON.parse(String(init?.body))).toEqual({
      firstName: "Ada",
      email: "ada@acme.test",
      password: "password123",
    });
  });

  it("shows the API error when the email is already registered", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ statusCode: 409, error: "Conflict", message: "Email already exists" }, 409),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Unable to create account")).toBeInTheDocument();
    expect(screen.getByText("Email already exists")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("hides backend detail for server errors", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ statusCode: 500, message: "db exploded" }, 500),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText("db exploded")).not.toBeInTheDocument();
  });
});
