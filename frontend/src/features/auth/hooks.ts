"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { forgotPassword, login, logout, register } from "./api";
import { AUTH_ROUTES } from "./routes";
import type {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
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
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => forgotPassword(payload),
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
