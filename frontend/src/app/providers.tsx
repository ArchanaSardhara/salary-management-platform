"use client";

import type { ReactNode } from "react";
import {
  isServer,
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Toaster } from "@/components/ui/toast";
import { AUTH_ROUTES } from "@/features/auth/routes";
import { ApiError } from "@/lib/api-client";

const MAX_QUERY_RETRIES = 2;

/**
 * An expired or revoked session makes protected API calls fail with 401.
 * Send the user to sign in again instead of showing a generic error. On the
 * public auth pages a 401 (e.g. wrong password) is shown as a form error.
 */
const PUBLIC_AUTH_PATHS: readonly string[] = [
  AUTH_ROUTES.login,
  AUTH_ROUTES.register,
  AUTH_ROUTES.forgotPassword,
];

function redirectOnUnauthorized(error: unknown) {
  if (
    !isServer &&
    error instanceof ApiError &&
    error.status === 401 &&
    !PUBLIC_AUTH_PATHS.includes(window.location.pathname)
  ) {
    window.location.assign(AUTH_ROUTES.login);
  }
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: redirectOnUnauthorized }),
    mutationCache: new MutationCache({ onError: redirectOnUnauthorized }),
    defaultOptions: {
      queries: {
        // Avoid immediate refetching on the client after SSR
        staleTime: 60 * 1000,
        // Client errors (4xx) will not succeed on retry.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
          failureCount < MAX_QUERY_RETRIES,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: reuse the existing client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster>{children}</Toaster>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
