import { describe, expect, it } from "vitest";

import { getNavItemsForRole, isNavItemActive, NAV_ITEMS } from "./navigation";
import { getFullName, getInitials } from "@/lib/format";

describe("getNavItemsForRole", () => {
  it("returns only items that list the role", () => {
    for (const role of ["HR_MANAGER", "ADMIN"] as const) {
      const items = getNavItemsForRole(role);
      expect(items.every((item) => item.roles.includes(role))).toBe(true);
      expect(items.length).toBe(NAV_ITEMS.filter((item) => item.roles.includes(role)).length);
    }
  });

  it("shows the dashboard to every role", () => {
    expect(getNavItemsForRole("HR_MANAGER").map((item) => item.href)).toContain("/dashboard");
    expect(getNavItemsForRole("ADMIN").map((item) => item.href)).toContain("/dashboard");
  });
});

describe("isNavItemActive", () => {
  it("matches the exact path and nested paths only", () => {
    expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true);
    expect(isNavItemActive("/dashboard/reports", "/dashboard")).toBe(true);
    expect(isNavItemActive("/dashboards", "/dashboard")).toBe(false);
  });
});

describe("user display helpers", () => {
  it("builds names and initials with or without a last name", () => {
    expect(getFullName({ firstName: "Ada", lastName: "Lovelace" })).toBe("Ada Lovelace");
    expect(getFullName({ firstName: "Ada", lastName: null })).toBe("Ada");
    expect(getInitials({ firstName: "ada", lastName: "lovelace" })).toBe("AL");
    expect(getInitials({ firstName: "Ada", lastName: null })).toBe("A");
  });
});
describe("employee navigation", () => {
  it("shows Employees to both HR Managers and ADMINs", () => {
    expect(getNavItemsForRole("HR_MANAGER").map((item) => item.href)).toContain("/employees");
    expect(getNavItemsForRole("ADMIN").map((item) => item.href)).toContain("/employees");
  });
});
