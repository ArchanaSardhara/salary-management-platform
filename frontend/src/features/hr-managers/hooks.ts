"use client";

import { useQuery } from "@tanstack/react-query";
import { listHrManagers } from "./api";

export const HR_MANAGER_PAGE_SIZE = 20;

export const hrManagerKeys = {
  all: ["hr-managers"] as const,
  list: (search: string, page: number) =>
    [...hrManagerKeys.all, search, page] as const,
};

export function useHrManagers(search: string, page: number) {
  return useQuery({
    queryKey: hrManagerKeys.list(search, page),
    queryFn: () => listHrManagers(page, HR_MANAGER_PAGE_SIZE, search || undefined),
  });
}
