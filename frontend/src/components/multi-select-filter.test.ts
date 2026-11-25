import { describe, expect, it } from "vitest";

import { summarizeSelection } from "./multi-select-filter";

const options = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "DE", label: "Germany" },
];

describe("summarizeSelection", () => {
  it("shows the 'all' label when nothing is selected", () => {
    expect(summarizeSelection([], options, "All countries")).toBe("All countries");
  });

  it("shows the label of a single selection", () => {
    expect(summarizeSelection(["US"], options, "All countries")).toBe("United States");
  });

  it("shows the first label and a count for several selections", () => {
    expect(summarizeSelection(["DE", "IN", "US"], options, "All countries")).toBe("Germany +2");
  });

  it("falls back to the raw value for an unknown option", () => {
    expect(summarizeSelection(["XX"], options, "All countries")).toBe("XX");
  });
});
