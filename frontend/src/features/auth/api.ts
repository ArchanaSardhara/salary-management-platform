import { apiRequest } from "@/lib/api-client";

import type {
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from "./types";

export function login(payload: LoginPayload): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function register(payload: RegisterPayload): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function logout(): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/logout", { method: "POST" });
}

export function forgotPassword(
  payload: ForgotPasswordPayload,
): Promise<ForgotPasswordResponse> {
  return apiRequest<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: payload,
  });
}

export function resetPassword(
  payload: ResetPasswordPayload,
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/reset-password", {
    method: "POST",
    body: payload,
  });
}

export function verifyEmail(
  payload: VerifyEmailPayload,
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/verify-email", {
    method: "POST",
    body: payload,
  });
}
