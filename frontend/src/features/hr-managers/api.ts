import { apiRequest } from "@/lib/api-client";
import { toQueryString } from "@/lib/search-params";
import type { PaginatedHrManagersResponse } from "./types";

export function listHrManagers(
  page: number,
  pageSize: number,
  search?: string,
): Promise<PaginatedHrManagersResponse> {
  return apiRequest<PaginatedHrManagersResponse>(
    `/users${toQueryString({ page, pageSize, search })}`,
  );
}
