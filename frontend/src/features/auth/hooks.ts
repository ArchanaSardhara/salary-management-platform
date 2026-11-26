"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  verifyEmail,
} from "./api";
import { AUTH_ROUTES } from "./routes";
import type {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from "./types";

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: () => {
      router.replace(AUTH_ROUTES.afterLogin);
      router.refresh();
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: () => {
      router.replace(AUTH_ROUTES.afterLogin);
      router.refresh();
    },
  });
}

export function useForgotPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => forgotPassword(payload),
    onSuccess: (data) => {
      if (data.resetUrl) {
        router.push(data.resetUrl);
      }
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetPassword(payload),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (payload: VerifyEmailPayload) => verifyEmail(payload),
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    // Leave the app even if the request fails: cookies are httpOnly, and the
    // server-side session check will still reject a stale session.
    onSettled: () => {
      queryClient.clear();
      router.replace(AUTH_ROUTES.login);
      router.refresh();
    },
  });
}
