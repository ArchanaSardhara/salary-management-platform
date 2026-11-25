import { apiRequest } from "@/lib/api-client";
import { toQueryString } from "@/lib/search-params";
import type { HrManager } from "./types";

export function listHrManagers(search?: string): Promise<HrManager[]> {
  return apiRequest<HrManager[]>(`/users${toQueryString({ search })}`);
}
