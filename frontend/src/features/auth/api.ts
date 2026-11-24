import { apiRequest } from "@/lib/api-client";

import type {
  ForgotPasswordPayload,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
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
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/auth/forgot-password", {
    method: "POST",
    body: payload,
  });
}
