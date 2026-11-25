"use client";

import { PlusIcon, SearchXIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParamsState } from "@/hooks/use-search-params-state";
import { formatNumber } from "@/lib/format";

import { useInfiniteEmployees, useEmployeeOptions } from "../hooks";
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT_FIELD,
  DEFAULT_SORT_ORDER,
  filtersToSearchParams,
  hasActiveFilters as getHasActiveFilters,
  LIST_PARAM_DEFAULTS,
  parseEmployeeListFilters,
  SCROLL_PAGE_SIZE,
} from "../list-params";
import { EMPLOYEE_ROUTES } from "../routes";
import type { Employee, EmployeeListFilters, EmployeeSortField } from "../types";
import { DeleteEmployeeDialog } from "./delete-employee-dialog";
import { EmployeeFilters } from "./employee-filters";
import { EmployeeListFooter } from "./employee-list-footer";
import { EmployeesTable } from "./employees-table";

/**
 * Employee directory: search, multi-select filters and a table that loads
 * more employees as the user scrolls. Filters live in the URL, so they
 * survive reloads and can be shared.
 */
export function EmployeeDirectory({ readOnly }: { readOnly?: boolean }) {
  const { searchParams, setParams } = useSearchParamsState(LIST_PARAM_DEFAULTS);
  const filters = parseEmployeeListFilters(searchParams);
  const hasActiveFilters = getHasActiveFilters(filters);

  const employees = useInfiniteEmployees(filters);
  const options = useEmployeeOptions();
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null,
  );

  // Measure the sticky filter bar's height so the table header can stick
  // directly below it (dashboard header = 56 px / h-14).
  const DASHBOARD_HEADER_H = 56;
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [filterBarH, setFilterBarH] = useState(80);
  useEffect(() => {
    const el = filterBarRef.current;
    if (!el) return;
    const measure = () => setFilterBarH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pages = employees.data?.pages ?? [];
  const rows = pages.flatMap((page) => page.data);
  const total = pages[0]?.meta.total;
  const isFirstLoad = employees.isPending;
  const isRefreshing = employees.isPlaceholderData;

  const changeFilters = (change: Partial<EmployeeListFilters>) =>
    setParams(filtersToSearchParams({ ...filters, ...change }));

  const clearFilters = () => setParams(filtersToSearchParams(DEFAULT_FILTERS));

  function handleSort(field: EmployeeSortField) {
    if (filters.sortBy !== field) {
      changeFilters({ sortBy: field, sortOrder: "asc" });
    } else if (filters.sortOrder === "asc") {
      changeFilters({ sortOrder: "desc" });
    } else {
      changeFilters({ sortBy: DEFAULT_SORT_FIELD, sortOrder: DEFAULT_SORT_ORDER });
    }
  }

  const loadMore = () => {
    if (employees.hasNextPage && !employees.isFetchingNextPage) {
      void employees.fetchNextPage();
    }
  };

  const failedFirstPage = employees.isError && !employees.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employees"
        description={
          total === undefined ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            <span aria-live="polite">
              <strong className="font-semibold text-foreground">
                {formatNumber(total)}
              </strong>{" "}
              {total === 1 ? "employee" : "employees"}
              {hasActiveFilters
                ? total === 1
                  ? " matches your filters"
                  : " match your filters"
                : " in total"}
            </span>
          )
        }
        actions={
          readOnly ? null : (
            <Link
              href={EMPLOYEE_ROUTES.create}
              className={buttonVariants({ size: "lg" })}
            >
              <PlusIcon aria-hidden="true" />
              Add employee
            </Link>
          )
        }
      />

      <div className="flex flex-col gap-6 p-1">
        {/* Sticky filter bar — sits just below the 56 px dashboard header */}
        <div
          ref={filterBarRef}
          className="sticky top-14 z-20 bg-background pb-3 pt-1"
        >
          <EmployeeFilters
            filters={filters}
            options={options.data}
            hasActiveFilters={hasActiveFilters}
            onChange={changeFilters}
            onClear={clearFilters}
          />
        </div>

        {failedFirstPage ? (
          <QueryError
            title="Unable to load employees"
            error={employees.error}
            onRetry={() => void employees.refetch()}
          />
        ) : !isFirstLoad && total === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={SearchXIcon}
              title="No employees match your filters"
              description="Try a different search term or remove some filters."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={UsersIcon}
              title="No employees yet"
              description="Add your first employee to start building the directory."
            />
          )
        ) : (
          <>
            <EmployeesTable
              employees={rows}
              isLoading={isFirstLoad}
              isRefreshing={isRefreshing}
              skeletonRows={10}
              onDelete={setEmployeeToDelete}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSort={handleSort}
              tableHeadTop={DASHBOARD_HEADER_H + filterBarH}
              readOnly={readOnly}
            />
            {!isFirstLoad && total !== undefined ? (
              <EmployeeListFooter
                loadedCount={rows.length}
                total={total}
                hasMore={!!employees.hasNextPage}
                isLoadingMore={employees.isFetchingNextPage}
                // Don't load more for stale (placeholder) results.
                isPaused={isRefreshing}
                loadMoreError={
                  employees.isFetchNextPageError ? employees.error : null
                }
                pageSize={SCROLL_PAGE_SIZE}
                onLoadMore={loadMore}
              />
            ) : null}
          </>
        )}
      </div>

      <DeleteEmployeeDialog
        employee={employeeToDelete}
        onClose={() => setEmployeeToDelete(null)}
      />
    </div>
  );
}
