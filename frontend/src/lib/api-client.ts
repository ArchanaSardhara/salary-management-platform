/**
 * Browser-side HTTP client for the NestJS API.
 *
 * Requests go to the same-origin `/api` prefix, which `next.config.ts`
 * rewrites to the backend. Keeping the API same-origin means the backend's
 * httpOnly auth cookies are stored for, and sent to, this app's origin
 * without CORS or third-party-cookie configuration.
 */

import { getApiBaseUrl } from "@/lib/api-url";

export const API_BASE_PATH = getApiBaseUrl();

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
const NETWORK_ERROR_MESSAGE =
  "Unable to reach the server. Check your connection and try again.";

/** Error body shape returned by the backend's AllExceptionsFilter. */
interface ApiErrorBody {
  statusCode?: number;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/** Server errors never surface backend detail to the user. */
function toErrorMessage(status: number, body: unknown): string {
  if (status >= 500) {
    return GENERIC_ERROR_MESSAGE;
  }
  if (
    isApiErrorBody(body) &&
    typeof body.message === "string" &&
    body.message
  ) {
    return body.message;
  }
  return GENERIC_ERROR_MESSAGE;
}

export async function apiRequest<TResponse>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Promise<TResponse> {
  const { body, headers, ...rest } = init;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }

  const data = await readJson(response);

  if (!response.ok) {
    throw new ApiError(response.status, toErrorMessage(response.status, data));
  }

  return data as TResponse;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return GENERIC_ERROR_MESSAGE;
}
