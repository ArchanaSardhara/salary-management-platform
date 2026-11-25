import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, renderWithQueryClient } from "@/test/render";

import { ResetPasswordForm } from "./reset-password-form";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  replace.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("ResetPasswordForm", () => {
  it("redirects to forgot-password when no token is provided", async () => {
    renderWithQueryClient(<ResetPasswordForm token="" />);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/forgot-password"),
    );
  });

  it("renders the form when a token is present", () => {
    renderWithQueryClient(<ResetPasswordForm token="abc123" />);
    expect(
      screen.getByRole("form", { name: "Set new password" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Set new password" }),
    ).toBeInTheDocument();
  });

  it("validates both password fields before calling the API", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ResetPasswordForm token="abc123" />);

    await user.click(screen.getByRole("button", { name: "Set new password" }));

    expect(
      await screen.findByText("Password must be at least 8 characters"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates that passwords match", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ResetPasswordForm token="abc123" />);

    await user.type(screen.getByLabelText("New password"), "Password1");
    await user.type(screen.getByLabelText("Confirm new password"), "Different1");
    await user.click(screen.getByRole("button", { name: "Set new password" }));

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows success state after a valid submission", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "Password reset successfully." }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<ResetPasswordForm token="abc123" />);

    await user.type(screen.getByLabelText("New password"), "NewPass123");
    await user.type(screen.getByLabelText("Confirm new password"), "NewPass123");
    await user.click(screen.getByRole("button", { name: "Set new password" }));

    expect(await screen.findByText("Password updated")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Sign in with your new password" }),
    ).toHaveAttribute("href", "/login");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:4000/api/v1/auth/reset-password");
    expect(JSON.parse(String(init?.body))).toEqual({
      token: "abc123",
      password: "NewPass123",
    });
  });

  it("shows an error when the token is invalid or expired", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Token is invalid or has expired." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<ResetPasswordForm token="expired-token" />);

    await user.type(screen.getByLabelText("New password"), "NewPass123");
    await user.type(screen.getByLabelText("Confirm new password"), "NewPass123");
    await user.click(screen.getByRole("button", { name: "Set new password" }));

    expect(
      await screen.findByText("Unable to reset password"),
    ).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ResetPasswordForm token="abc123" />);

    const passwordInput = screen.getByLabelText("New password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
