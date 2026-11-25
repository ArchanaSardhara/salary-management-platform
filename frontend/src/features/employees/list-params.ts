import { readList, readString, type SearchParamValue } from "@/lib/search-params";

import {
  EMPLOYEE_SORT_FIELDS,
  EMPLOYEE_STATUS_FILTERS,
  type EmployeeListFilters,
  type EmployeeSortField,
  type EmployeeStatusFilter,
  type SortOrder,
} from "./types";

/** Employees fetched per scroll batch. */
export const SCROLL_PAGE_SIZE = 25;
/** Deleted employees are hidden unless the user asks for them. */
export const DEFAULT_STATUSES: readonly EmployeeStatusFilter[] = ["active"];
/** Matches the backend's search length limit. */
export const SEARCH_MAX_LENGTH = 100;

export const DEFAULT_SORT_FIELD: EmployeeSortField = "employeeNumber";
export const DEFAULT_SORT_ORDER: SortOrder = "asc";

/** URL search-param names. Lists are repeated keys (`?country=IN&country=US`). */
export const LIST_PARAM_KEYS = {
  search: "q",
  countryCodes: "country",
  departments: "department",
  statuses: "status",
  sortBy: "sort",
  sortOrder: "order",
} as const;

/** In the URL, "no status selected" (= every status) is written as `status=all`. */
const ALL_STATUSES_PARAM = "all";

/** Defaults are omitted from the URL. */
export const LIST_PARAM_DEFAULTS: Record<string, SearchParamValue> = {
  [LIST_PARAM_KEYS.statuses]: DEFAULT_STATUSES,
};

function isStatusFilter(value: string): value is EmployeeStatusFilter {
  return (EMPLOYEE_STATUS_FILTERS as readonly string[]).includes(value);
}

/** Reads directory filters from URL search params, ignoring invalid values. */
export function parseEmployeeListFilters(params: URLSearchParams): EmployeeListFilters {
  const sortByRaw = readString(params, LIST_PARAM_KEYS.sortBy);
  const sortOrderRaw = readString(params, LIST_PARAM_KEYS.sortOrder);
  return {
    search: readString(params, LIST_PARAM_KEYS.search).slice(0, SEARCH_MAX_LENGTH),
    countryCodes: readList(params, LIST_PARAM_KEYS.countryCodes, {
      normalise: (value) => value.toUpperCase(),
    }),
    departments: readList(params, LIST_PARAM_KEYS.departments),
    statuses: parseStatuses(readList(params, LIST_PARAM_KEYS.statuses)),
    sortBy: (EMPLOYEE_SORT_FIELDS as readonly string[]).includes(sortByRaw)
      ? (sortByRaw as EmployeeSortField)
      : DEFAULT_SORT_FIELD,
    sortOrder: sortOrderRaw === "desc" ? "desc" : DEFAULT_SORT_ORDER,
  };
}

/** `all` → every status (empty list); missing or only invalid → the default. */
function parseStatuses(raw: string[]): EmployeeStatusFilter[] {
  if (raw.includes(ALL_STATUSES_PARAM)) {
    return [];
  }
  const valid = raw.filter(isStatusFilter);
  return valid.length > 0 ? valid : [...DEFAULT_STATUSES];
}

/** Filters → URL param updates (the inverse of `parseEmployeeListFilters`). */
export function filtersToSearchParams(
  filters: EmployeeListFilters,
): Record<string, SearchParamValue> {
  // Omit sort params when they equal the default (keeps URLs short).
  const isDefaultSort =
    filters.sortBy === DEFAULT_SORT_FIELD && filters.sortOrder === DEFAULT_SORT_ORDER;
  return {
    [LIST_PARAM_KEYS.search]: filters.search,
    [LIST_PARAM_KEYS.countryCodes]: filters.countryCodes,
    [LIST_PARAM_KEYS.departments]: filters.departments,
    [LIST_PARAM_KEYS.statuses]:
      filters.statuses.length === 0 ? ALL_STATUSES_PARAM : filters.statuses,
    [LIST_PARAM_KEYS.sortBy]: isDefaultSort ? undefined : filters.sortBy,
    [LIST_PARAM_KEYS.sortOrder]:
      filters.sortOrder === DEFAULT_SORT_ORDER ? undefined : filters.sortOrder,
  };
}

export const DEFAULT_FILTERS: EmployeeListFilters = {
  search: "",
  countryCodes: [],
  departments: [],
  statuses: [...DEFAULT_STATUSES],
  sortBy: DEFAULT_SORT_FIELD,
  sortOrder: DEFAULT_SORT_ORDER,
};

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value));
}

/** True when any filter or sort differs from the defaults. */
export function hasActiveFilters(filters: EmployeeListFilters): boolean {
  return (
    filters.search !== "" ||
    filters.countryCodes.length > 0 ||
    filters.departments.length > 0 ||
    !sameSet(filters.statuses, DEFAULT_STATUSES) ||
    filters.sortBy !== DEFAULT_SORT_FIELD ||
    filters.sortOrder !== DEFAULT_SORT_ORDER
  );
}
