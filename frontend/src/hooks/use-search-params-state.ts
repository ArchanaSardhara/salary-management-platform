"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { mergeSearchParams, type SearchParamValue } from "@/lib/search-params";

const NO_DEFAULTS: Record<string, SearchParamValue> = {};

/**
 * Exposes the current URL search params and a setter that merges updates
 * into them with `router.replace` (no new history entry, no scroll jump).
 * Values equal to `defaults` are removed to keep URLs canonical. Pass a
 * module-level constant for `defaults` so the setter stays stable.
 *
 * Components using this must render inside a <Suspense> boundary
 * (`useSearchParams` requirement).
 */
export function useSearchParamsState(
  defaults: Record<string, SearchParamValue> = NO_DEFAULTS,
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (updates: Record<string, SearchParamValue>) => {
      const next = mergeSearchParams(
        new URLSearchParams(searchParams.toString()),
        updates,
        defaults,
      );
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [defaults, pathname, router, searchParams],
  );

  return { searchParams, setParams };
}
