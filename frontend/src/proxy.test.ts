// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

function requestWithCookies(cookie?: string) {
  return new NextRequest("http://localhost:3001/dashboard", {
    headers: cookie ? { cookie } : {},
  });
}

describe("proxy", () => {
  it("redirects to /login when there is no session cookie", async () => {
    const response = await proxy(requestWithCookies());

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3001/login");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lets the request through when an access token is present", async () => {
    const response = await proxy(requestWithCookies("access_token=abc"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes the session with a refresh token and forwards the new cookies", async () => {
    const headers = new Headers();
    headers.append("Set-Cookie", "access_token=new-access; Path=/; HttpOnly; SameSite=Lax");
    headers.append("Set-Cookie", "refresh_token=new-refresh; Path=/; HttpOnly; SameSite=Lax");
    fetchMock.mockResolvedValue(new Response("{}", { status: 201, headers }));

    const response = await proxy(requestWithCookies("refresh_token=old-refresh"));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:4000/api/v1/auth/refresh");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("cookie")).toBe("refresh_token=old-refresh");

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.getSetCookie()).toEqual(
      expect.arrayContaining([
        expect.stringContaining("access_token=new-access"),
        expect.stringContaining("refresh_token=new-refresh"),
      ]),
    );
    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      "access_token=new-access",
    );
  });

  it("redirects to /login when the refresh is rejected", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    const response = await proxy(requestWithCookies("refresh_token=revoked"));

    expect(response.headers.get("location")).toBe("http://localhost:3001/login");
  });

  it("redirects to /login when the backend is unreachable", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const response = await proxy(requestWithCookies("refresh_token=abc"));

    expect(response.headers.get("location")).toBe("http://localhost:3001/login");
  });
});
