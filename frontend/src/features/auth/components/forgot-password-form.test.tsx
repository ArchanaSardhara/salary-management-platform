import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, renderWithQueryClient } from "@/test/render";

import { ForgotPasswordForm } from "./forgot-password-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  push.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("ForgotPasswordForm", () => {
  it("validates the email before calling the API", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ForgotPasswordForm />);

    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });


  it("redirects to resetUrl when the backend returns one", async () => {
    const resetUrl =
      "http://localhost:3000/reset-password?token=abc123";
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "If an account exists, a password reset email has been sent.", resetUrl }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "hr@acme.test");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(resetUrl));
  });

  it("shows the backend's neutral confirmation when no resetUrl is returned", async () => {
    const message = "If an account exists, a password reset email has been sent.";
    fetchMock.mockResolvedValue(jsonResponse({ message }));
    const user = userEvent.setup();
    renderWithQueryClient(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "hr@acme.test");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await screen.findByText("Check your email");
    expect(push).not.toHaveBeenCalled();
  });

  it("shows a network error when the server is unreachable", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    renderWithQueryClient(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "hr@acme.test");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Unable to send reset link")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to reach the server. Check your connection and try again."),
    ).toBeInTheDocument();
  });
});
