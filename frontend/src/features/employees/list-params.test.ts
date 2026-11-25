import { describe, expect, it } from "vitest";

import {
  DEFAULT_FILTERS,
  filtersToSearchParams,
  hasActiveFilters,
  LIST_PARAM_DEFAULTS,
  parseEmployeeListFilters,
} from "./list-params";
import { mergeSearchParams } from "@/lib/search-params";

const parse = (query: string) => parseEmployeeListFilters(new URLSearchParams(query));

describe("parseEmployeeListFilters", () => {
  it("returns the defaults (active employees only) for an empty URL", () => {
    expect(parse("")).toEqual({
      search: "",
      countryCodes: [],
      departments: [],
      statuses: ["active"],
    });
  });

  it("reads repeated keys and normalises country codes", () => {
    expect(
      parse("q=ada&country=in&country=US&department=Engineering&department=Finance&status=deleted"),
    ).toEqual({
      search: "ada",
      countryCodes: ["IN", "US"],
      departments: ["Engineering", "Finance"],
      statuses: ["deleted"],
    });
  });

  it("reads status=all as every status", () => {
    expect(parse("status=all").statuses).toEqual([]);
  });

  it("falls back to the default for unknown statuses", () => {
    expect(parse("status=archived").statuses).toEqual(["active"]);
    expect(parse("status=archived&status=deleted").statuses).toEqual(["deleted"]);
  });

  it("caps the search length", () => {
    expect(parse(`q=${"a".repeat(150)}`).search).toHaveLength(100);
  });
});

describe("filtersToSearchParams", () => {
  const toUrl = (filters: Parameters<typeof filtersToSearchParams>[0]) =>
    mergeSearchParams(new URLSearchParams(), filtersToSearchParams(filters), LIST_PARAM_DEFAULTS).toString();

  it("omits defaults", () => {
    expect(toUrl(DEFAULT_FILTERS)).toBe("");
  });

  it("writes every status as status=all and round-trips", () => {
    const filters = { ...DEFAULT_FILTERS, statuses: [], departments: ["Finance", "Legal"] };
    const url = toUrl(filters);
    expect(url).toBe("department=Finance&department=Legal&status=all");
    expect(parse(url)).toEqual(filters);
  });
});

describe("hasActiveFilters", () => {
  it("is false for the defaults", () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
  });

  it.each([
    { search: "ada" },
    { countryCodes: ["IN"] },
    { departments: ["Finance"] },
    { statuses: ["deleted" as const] },
    { statuses: [] },
    { statuses: ["active" as const, "deleted" as const] },
  ])("is true when %o is set", (change) => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, ...change })).toBe(true);
  });
});
