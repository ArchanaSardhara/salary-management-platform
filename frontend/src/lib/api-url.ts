const DEFAULT_API_URL = "http://localhost:4000";

/**
 * Route prefix of every backend endpoint. Must match `backend/src/main.ts`:
 * `setGlobalPrefix('api')` + URI versioning (`v1` default) → `/api/v1/...`.
 */
export const API_PREFIX = "/api/v1";

/**
 * Origin of the NestJS API (no path). `API_URL` is deliberately not a
 * NEXT_PUBLIC_ variable, so it is never inlined into browser bundles.
 */
export function getApiUrl(): string {
  return (process.env.API_URL ?? DEFAULT_API_URL).replace(/\/+$/, "");
}

/** Origin plus route prefix, e.g. `http://localhost:4000/api/v1`. */
export function getApiBaseUrl(): string {
  return `${getApiUrl()}${API_PREFIX}`;
}
