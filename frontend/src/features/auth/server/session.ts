import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { z } from "zod";

import { getApiBaseUrl } from "@/lib/api-url";

import { ACCESS_TOKEN_COOKIE, AUTH_ROUTES } from "../routes";
import { ROLES, type Role, type SessionUser } from "../types";

const verifiedUserSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string().nullable(),
  email: z.string(),
  role: z.enum(ROLES),
  isActive: z.boolean(),
});

/**
 * Data Access Layer entry point for the current session.
 *
 * Validates the access-token cookie against the backend (`GET /auth/verify`),
 * which checks the JWT, loads the user from the database and enforces role
 * and active status. Redirects to the login page when there is no valid
 * session. Wrapped in React `cache` so a layout and page in the same request
 * share one verification call.
 *
 * Must be called inside a <Suspense> boundary (it reads request cookies).
 */
export const getCurrentUser = cache(async (): Promise<SessionUser> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    redirect(AUTH_ROUTES.login);
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/verify`, {
    headers: {
      Accept: "application/json",
      Cookie: `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(accessToken)}`,
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    redirect(AUTH_ROUTES.login);
  }

  if (!response.ok) {
    throw new Error(`Session verification failed (status ${response.status})`);
  }

  const parsed = verifiedUserSchema.safeParse(await response.json());
  if (!parsed.success || !parsed.data.isActive) {
    redirect(AUTH_ROUTES.login);
  }

  const { id, firstName, lastName, email, role } = parsed.data;
  return { id, firstName, lastName, email, role };
});

/**
 * Like `getCurrentUser`, but also requires one of `roles`. Users with another
 * role are sent to the dashboard. The backend enforces the same roles on
 * every API call; this only keeps them away from pages they cannot use.
 */
export async function requireRole(roles: readonly Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!roles.includes(user.role)) {
    redirect(AUTH_ROUTES.afterLogin);
  }
  return user;
}
