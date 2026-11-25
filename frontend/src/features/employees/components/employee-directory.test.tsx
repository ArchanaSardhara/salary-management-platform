import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, renderWithQueryClient } from "@/test/render";

import type { Employee, EmployeeOptions } from "../types";
import { EmployeeDirectory } from "./employee-directory";

let currentSearch = "";
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/employees",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

/** IntersectionObserver stand-in: tests decide when the sentinel is visible. */
const observers = new Set<MockIntersectionObserver>();
class MockIntersectionObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {
    observers.add(this);
  }
  observe() {}
  disconnect() {
    observers.delete(this);
  }
  trigger() {
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}
/** Waits until the list is observing its end (effects have run), then "scrolls" to it. */
async function scrollToEnd() {
  await waitFor(() => expect(observers.size).toBeGreaterThan(0));
  act(() => {
    for (const observer of [...observers]) observer.trigger();
  });
}

const fetchMock = vi.fn<typeof fetch>();
const API = "http://localhost:4000/api/v1";
const PAGE_SIZE = 25;

const options: EmployeeOptions = {
  countryCodes: ["DE", "IN", "US"],
  countriesInUse: ["IN", "US"],
  departments: ["Engineering", "Finance"],
  jobTitles: ["Software Engineer"],
};

function makeEmployee(index = 1, overrides: Partial<Employee> = {}): Employee {
  return {
    id: `emp-${index}`,
    employeeCode: `EMP-${String(index).padStart(6, "0")}`,
    firstName: index === 1 ? "Priya" : `Person${index}`,
    lastName: index === 1 ? "Sharma" : "Test",
    email: `person${index}@example.com`,
    countryCode: "IN",
    department: "Engineering",
    jobTitle: "Software Engineer",
    startDate: "2026-01-15",
    endDate: null,
    status: "ACTIVE",
    version: 1,
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

/** Serves `total` employees in pages of PAGE_SIZE, like the backend. */
function pagedList(total: number, overrides: Partial<Employee> = {}) {
  return (url: URL) => {
    const page = Number(url.searchParams.get("page"));
    const start = (page - 1) * PAGE_SIZE;
    const data = Array.from(
      { length: Math.max(0, Math.min(PAGE_SIZE, total - start)) },
      (_, i) => makeEmployee(start + i + 1, overrides),
    );
    return jsonResponse({
      data,
      meta: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  };
}

function mockApi(list: (url: URL) => Response | Promise<Response>) {
  fetchMock.mockImplementation(async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/employees/options"))
      return jsonResponse(options);
    if (init?.method === "DELETE") {
      return jsonResponse(
        makeEmployee(1, {
          status: "DELETED",
          deletedAt: "2026-11-24T10:00:00Z",
        }),
      );
    }
    return list(url);
  });
}

function listCalls(): URL[] {
  return fetchMock.mock.calls
    .map(([input]) => new URL(String(input)))
    .filter((url) => url.pathname === "/api/v1/employees");
}

beforeEach(() => {
  currentSearch = "";
  replace.mockReset();
  fetchMock.mockReset();
  observers.clear();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

describe("EmployeeDirectory", () => {
  it("renders the total, the columns and an employee row", async () => {
    mockApi(pagedList(1234));
    renderWithQueryClient(<EmployeeDirectory />);

    expect(await screen.findByText("Priya Sharma")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
    expect(screen.getByText(/employees in total/)).toBeInTheDocument();

    for (const column of [
      "ID",
      "Name",
      "Email",
      "Country",
      "Department",
      "Title",
      "Status",
      "Joining Date",
      "Actions",
    ]) {
      expect(
        screen.getByRole("columnheader", { name: column }),
      ).toBeInTheDocument();
    }

    const row = screen.getByRole("row", { name: /Priya Sharma/ });
    expect(within(row).getByText("EMP-000001")).toBeInTheDocument();
    expect(within(row).getByText("India")).toBeInTheDocument();
    expect(within(row).getByText("15 Jan 2026")).toBeInTheDocument();
    expect(within(row).getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add employee" })).toHaveAttribute(
      "href",
      "/employees/new",
    );
  });

  it("loads the next batch when the end of the list scrolls into view", async () => {
    mockApi(pagedList(60));
    renderWithQueryClient(<EmployeeDirectory />);

    await screen.findByText("Priya Sharma");
    expect(screen.getAllByRole("row")).toHaveLength(1 + 25);
    expect(screen.getByText("Showing 25 of 60 employees")).toBeInTheDocument();

    await scrollToEnd();
    expect(
      await screen.findByText("Showing 50 of 60 employees"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(1 + 50);

    await scrollToEnd();
    expect(
      await screen.findByText("All 60 employees loaded"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(1 + 60);
    expect(listCalls().map((url) => url.searchParams.get("page"))).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(
      listCalls().every((url) => url.searchParams.get("pageSize") === "25"),
    ).toBe(true);
    expect(
      screen.queryByRole("button", { name: /Load .* more/ }),
    ).not.toBeInTheDocument();
  });

  it("offers a Load more button that fetches the next batch", async () => {
    mockApi(pagedList(30));
    const user = userEvent.setup();
    renderWithQueryClient(<EmployeeDirectory />);
    await screen.findByText("Priya Sharma");

    await user.click(screen.getByRole("button", { name: "Load 5 more" }));

    expect(
      await screen.findByText("All 30 employees loaded"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(1 + 30);
  });

  it("shows an error with retry when loading more fails, without retrying on its own", async () => {
    let failNext = true;
    const list = pagedList(60);
    mockApi((url) => {
      if (url.searchParams.get("page") === "2" && failNext) {
        failNext = false;
        return jsonResponse({ statusCode: 500, message: "boom" }, 500);
      }
      return list(url);
    });
    const user = userEvent.setup();
    renderWithQueryClient(<EmployeeDirectory />);
    await screen.findByText("Priya Sharma");

    await scrollToEnd();
    expect(
      await screen.findByText("Unable to load more employees"),
    ).toBeInTheDocument();
    // The first page stays visible.
    expect(screen.getAllByRole("row")).toHaveLength(1 + 25);
    // While the error is shown, the list does not observe its end (no retry loop).
    expect(observers.size).toBe(0);
    expect(
      listCalls().filter((url) => url.searchParams.get("page") === "2"),
    ).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByText("Showing 50 of 60 employees"),
    ).toBeInTheDocument();
  });

  it("sends multi-value URL filters to the API as repeated keys", async () => {
    currentSearch =
      "q=ada&country=in&country=US&department=Engineering&department=Finance&status=active&status=deleted";
    mockApi(pagedList(3));
    renderWithQueryClient(<EmployeeDirectory />);

    await screen.findByText("Priya Sharma");
    const url = listCalls()[0];
    expect(url.searchParams.getAll("countryCode")).toEqual(["IN", "US"]);
    expect(url.searchParams.getAll("department")).toEqual([
      "Engineering",
      "Finance",
    ]);
    expect(url.searchParams.getAll("status")).toEqual(["active", "deleted"]);
    expect(url.searchParams.get("search")).toBe("ada");
    expect(url.searchParams.get("page")).toBe("1");
    expect(screen.getByText(/match your filters/)).toBeInTheDocument();
  });

  it("asks the API for every status when status=all", async () => {
    currentSearch = "status=all";
    mockApi(pagedList(1));
    renderWithQueryClient(<EmployeeDirectory />);

    await screen.findByText("Priya Sharma");
    expect(listCalls()[0].searchParams.getAll("status")).toEqual(["all"]);
    expect(screen.getByText("All statuses")).toBeInTheDocument();
  });

  it("shows a summary of selected filter values", async () => {
    currentSearch = "country=IN&country=US&department=Finance";
    mockApi(pagedList(1));
    renderWithQueryClient(<EmployeeDirectory />);

    await screen.findByText("Priya Sharma");
    await waitFor(() =>
      expect(screen.getByText("India +1")).toBeInTheDocument(),
    );
    expect(screen.getByText("Finance")).toBeInTheDocument();
  });

  it("adds a department to the filter from the multi-select", async () => {
    currentSearch = "department=Engineering";
    mockApi(pagedList(1));
    const user = userEvent.setup();
    renderWithQueryClient(<EmployeeDirectory />);
    await screen.findByText("Priya Sharma");

    await user.click(screen.getByRole("combobox", { name: "Department" }));
    await user.click(await screen.findByRole("option", { name: "Finance" }));

    expect(replace).toHaveBeenLastCalledWith(
      "/employees?department=Engineering&department=Finance",
      { scroll: false },
    );
  });

  it("writes status=all when every status is deselected", async () => {
    mockApi(pagedList(1));
    const user = userEvent.setup();
    renderWithQueryClient(<EmployeeDirectory />);
    await screen.findByText("Priya Sharma");

    await user.click(
      screen.getByRole("combobox", { name: "Employment status" }),
    );
    await user.click(await screen.findByRole("option", { name: "Active" }));

    expect(replace).toHaveBeenLastCalledWith("/employees?status=all", {
      scroll: false,
    });
  });

  it("updates the URL after a debounced search", async () => {
    mockApi(pagedList(1));
    const user = userEvent.setup();
    renderWithQueryClient(<EmployeeDirectory />);
    await screen.findByText("Priya Sharma");

    await user.type(
      screen.getByLabelText("Search employees by name, email or employee ID"),
      "EMP-1",
    );

    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });
    expect(replace).toHaveBeenCalledWith("/employees?q=EMP-1", {
      scroll: false,
    });
  });

  it("clears all filters back to the defaults", async () => {
    currentSearch = "q=ada&country=IN&country=US&status=deleted";
    mockApi(pagedList(1));
    const user = userEvent.setup();
    renderWithQueryClient(<EmployeeDirectory />);
    await screen.findByText("Priya Sharma");

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(replace).toHaveBeenCalledWith("/employees", { scroll: false });
  });

  it("disables Clear filters when no filter is active", async () => {
    mockApi(pagedList(1));
    renderWithQueryClient(<EmployeeDirectory />);
    await screen.findByText("Priya Sharma");

    expect(
      screen.getByRole("button", { name: "Clear filters" }),
    ).toBeDisabled();
  });

  it("shows a no-results state when filters match nothing", async () => {
    currentSearch = "q=nobody";
    mockApi(pagedList(0));
    renderWithQueryClient(<EmployeeDirectory />);

    expect(
      await screen.findByText("No employees match your filters"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows an empty directory state without filters", async () => {
    mockApi(pagedList(0));
    renderWithQueryClient(<EmployeeDirectory />);

    expect(await screen.findByText("No employees yet")).toBeInTheDocument();
  });

  it("shows an error with retry when the first load fails", async () => {
    mockApi(() => jsonResponse({ statusCode: 500, message: "boom" }, 500));
    renderWithQueryClient(<EmployeeDirectory />);

    expect(
      await screen.findByText("Unable to load employees"),
    ).toBeInTheDocument();
    expect(screen.queryByText("boom")).not.toBeInTheDocument();

    mockApi(pagedList(1));
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Priya Sharma")).toBeInTheDocument();
  });

  it("deletes an employee after confirmation and refreshes the list", async () => {
    mockApi(pagedList(1));
    const user = userEvent.setup();
    renderWithQueryClient(<EmployeeDirectory />);
    await screen.findByText("Priya Sharma");

    await user.click(
      screen.getByRole("button", { name: "Actions for Priya Sharma" }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete employee" }),
    );

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(/Priya Sharma \(EMP-000001\)/),
    ).toBeInTheDocument();
    const listCallsBefore = listCalls().length;

    await user.click(
      within(dialog).getByRole("button", { name: "Delete employee" }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${API}/employees/emp-1`,
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(listCalls().length).toBeGreaterThan(listCallsBefore),
    );
  });

  it("disables edit and delete for a deleted employee", async () => {
    currentSearch = "status=deleted";
    mockApi(
      pagedList(1, { status: "DELETED", deletedAt: "2026-11-01T00:00:00Z" }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<EmployeeDirectory />);
    await screen.findByText("Priya Sharma");

    await user.click(
      screen.getByRole("button", { name: "Actions for Priya Sharma" }),
    );

    expect(
      await screen.findByRole("menuitem", { name: "View employee" }),
    ).not.toHaveAttribute("aria-disabled");
    expect(
      screen.getByRole("menuitem", { name: "Edit employee" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByRole("menuitem", { name: "Delete employee" }),
    ).toHaveAttribute("aria-disabled", "true");
  });
});
