import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  AUTH_ROUTES,
  REFRESH_TOKEN_COOKIE,
} from "@/features/auth/routes";
import { getApiBaseUrl } from "@/lib/api-url";

/**
 * Optimistic route protection for the authenticated area.
 *
 * - No access token and no refresh token: redirect to /login before rendering.
 * - Access token expired but a "remember me" refresh token exists: rotate the
 *   tokens with the backend, forward the new cookies to the browser and to
 *   this request, then continue.
 *
 * This is only a fast first gate. The authoritative check is
 * `getCurrentUser()` in the dashboard layout/page, which verifies the token
 * with the backend on every render.
 */
export async function proxy(request: NextRequest) {
  if (request.cookies.has(ACCESS_TOKEN_COOKIE)) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    const setCookies = await refreshSession(refreshToken);
    const accessToken = setCookies && readCookieValue(setCookies, ACCESS_TOKEN_COOKIE);

    if (setCookies && accessToken) {
      request.cookies.set(ACCESS_TOKEN_COOKIE, accessToken);
      const response = NextResponse.next({
        request: { headers: request.headers },
      });
      for (const cookie of setCookies) {
        response.headers.append("Set-Cookie", cookie);
      }
      return response;
    }
  }

  return NextResponse.redirect(new URL(AUTH_ROUTES.login, request.url));
}

async function refreshSession(refreshToken: string): Promise<string[] | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Cookie: `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(refreshToken)}`,
      },
      cache: "no-store",
    });
    return response.ok ? response.headers.getSetCookie() : null;
  } catch {
    return null;
  }
}

function readCookieValue(setCookies: string[], name: string): string | null {
  for (const header of setCookies) {
    const [pair] = header.split(";");
    const separator = pair.indexOf("=");
    if (separator > 0 && pair.slice(0, separator).trim() === name) {
      return decodeURIComponent(pair.slice(separator + 1).trim());
    }
  }
  return null;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
