import { describe, expect, it } from "vitest";

import { mergeSearchParams, readList, readString, toQueryString } from "./search-params";

describe("readString", () => {
  it("trims and defaults to an empty string", () => {
    const params = new URLSearchParams("q=%20ada%20");
    expect(readString(params, "q")).toBe("ada");
    expect(readString(params, "missing")).toBe("");
  });
});

describe("readList", () => {
  const params = new URLSearchParams("c=in&c=US&c=&c=IN&c=%20de%20");

  it("reads repeated keys, trims, drops blanks and duplicates", () => {
    expect(readList(params, "c", { normalise: (value) => value.toUpperCase() })).toEqual([
      "IN",
      "US",
      "DE",
    ]);
  });

  it("keeps only allowed values", () => {
    // "de" is not allowed: allowed values are compared after normalisation.
    expect(readList(params, "c", { allowed: ["US", "DE"] })).toEqual(["US"]);
  });

  it("returns an empty list for a missing key", () => {
    expect(readList(params, "missing")).toEqual([]);
  });
});

describe("mergeSearchParams", () => {
  it("writes lists as repeated keys and removes empty values", () => {
    const next = mergeSearchParams(new URLSearchParams("q=old&country=FR"), {
      q: "",
      country: ["IN", "US"],
      department: [],
    });
    expect(next.getAll("country")).toEqual(["IN", "US"]);
    expect(next.has("q")).toBe(false);
    expect(next.has("department")).toBe(false);
  });

  it("drops values equal to the defaults, regardless of list order", () => {
    const next = mergeSearchParams(
      new URLSearchParams("status=deleted"),
      { status: ["deleted", "active"] },
      { status: ["active", "deleted"] },
    );
    expect(next.toString()).toBe("");
  });

  it("does not mutate the input", () => {
    const input = new URLSearchParams("a=1");
    mergeSearchParams(input, { a: "2" });
    expect(input.get("a")).toBe("1");
  });
});

describe("toQueryString", () => {
  it("skips empty values and repeats list keys", () => {
    expect(toQueryString({ page: 2, search: "", country: ["IN", "US"], none: null })).toBe(
      "?page=2&country=IN&country=US",
    );
    expect(toQueryString({ search: "" })).toBe("");
  });
});
