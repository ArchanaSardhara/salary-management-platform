"use client";

import { useQuery } from "@tanstack/react-query";
import { listHrManagers } from "./api";

export const hrManagerKeys = {
  all: ["hr-managers"] as const,
  list: (search: string) => [...hrManagerKeys.all, search] as const,
};

export function useHrManagers(search: string) {
  return useQuery({
    queryKey: hrManagerKeys.list(search),
    queryFn: () => listHrManagers(search || undefined),
  });
}
