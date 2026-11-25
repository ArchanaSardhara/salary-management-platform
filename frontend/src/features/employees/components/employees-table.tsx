"use client";

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, getCountryName, getFullName } from "@/lib/format";
import { cn } from "cn";

import { DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER } from "../list-params";
import { EMPLOYEE_ROUTES } from "../routes";
import type { Employee, EmployeeSortField, SortOrder } from "../types";
import { EmployeeRowActions } from "./employee-row-actions";
import { EmployeeStatusBadge } from "./employee-status-badge";

type ColumnDef =
  | { label: string; sortField: EmployeeSortField; align?: "right" }
  | { label: string; sortField?: undefined; align?: "right" };

const COLUMNS: ColumnDef[] = [
  { label: "ID",           sortField: "employeeNumber" },
  { label: "Name",         sortField: "firstName" },
  { label: "Email",        sortField: "email" },
  { label: "Country",      sortField: "countryCode" },
  { label: "Department",   sortField: "department" },
  { label: "Title",        sortField: "jobTitle" },
  { label: "Status" },
  { label: "Joining Date", sortField: "startDate" },
];

interface EmployeesTableProps {
  employees: readonly Employee[] | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  skeletonRows: number;
  onDelete: (employee: Employee) => void;
  sortBy: EmployeeSortField;
  sortOrder: SortOrder;
  onSort: (field: EmployeeSortField) => void;
  /** `top` offset (px) for the sticky header. */
  tableHeadTop?: number;
}

function SortIcon({
  field,
  sortBy,
  sortOrder,
}: {
  field: EmployeeSortField;
  sortBy: EmployeeSortField;
  sortOrder: SortOrder;
}) {
  if (sortBy !== field) {
    return <ArrowUpDownIcon className="size-3.5 opacity-40" aria-hidden="true" />;
  }
  return sortOrder === "asc" ? (
    <ArrowUpIcon className="size-3.5" aria-hidden="true" />
  ) : (
    <ArrowDownIcon className="size-3.5" aria-hidden="true" />
  );
}

export function EmployeesTable({
  employees,
  isLoading,
  isRefreshing,
  skeletonRows,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
  tableHeadTop = 56,
}: EmployeesTableProps) {

  return (
    <div
      className={cn(
        "rounded-lg transition-opacity",
        isRefreshing && "opacity-60",
      )}
      aria-busy={isLoading || isRefreshing}
    >
      <Table containerClassName="relative w-full" className="table-fixed">
        <colgroup>
          <col className="w-[8%]" />
          <col className="w-[14%]" />
          <col className="w-[17%]" />
          <col className="w-[13%]" />
          <col className="w-[12%]" />
          <col className="w-[13%]" />
          <col className="w-[10%]" />
          <col className="w-[8%]" />
          <col className="w-[5%]" />
        </colgroup>
        <TableCaption className="sr-only">Employee directory</TableCaption>
        <TableHeader>
          <TableRow>
            {COLUMNS.map(({ label, sortField, align }) => (
              <TableHead
                key={label}
                scope="col"
                className={cn("sticky z-10 bg-secondary", align === "right" && "text-right")}
                style={{ top: tableHeadTop }}
                aria-sort={
                  sortField && sortBy === sortField
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {sortField ? (
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                    onClick={() => onSort(sortField)}
                  >
                    {label}
                    <SortIcon field={sortField} sortBy={sortBy} sortOrder={sortOrder} />
                  </button>
                ) : (
                  label
                )}
              </TableHead>
            ))}
            <TableHead
              scope="col"
              className="sticky z-10 bg-secondary text-right"
              style={{ top: tableHeadTop }}
            >
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: skeletonRows }, (_, index) => (
                <TableRow key={index} aria-hidden="true">
                  {Array.from({ length: COLUMNS.length + 1 }, (_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : employees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-mono text-xs">
                    {employee.employeeCode}
                  </TableCell>
                  <TableCell className="max-w-0 truncate font-medium">
                    <Link
                      href={EMPLOYEE_ROUTES.detail(employee.id)}
                      className="underline-offset-4 hover:underline focus-visible:underline"
                      title={getFullName(employee)}
                    >
                      {getFullName(employee)}
                    </Link>
                  </TableCell>
                  <TableCell
                    className="max-w-0 truncate text-muted-foreground"
                    title={employee.email ?? undefined}
                  >
                    {employee.email ?? <span aria-label="No email">—</span>}
                  </TableCell>
                  <TableCell
                    className="whitespace-nowrap truncate"
                    title={getCountryName(employee.countryCode)}
                  >
                    {getCountryName(employee.countryCode)}
                  </TableCell>
                  <TableCell className="max-w-0 truncate" title={employee.department}>
                    {employee.department}
                  </TableCell>
                  <TableCell className="max-w-0 truncate" title={employee.jobTitle}>
                    {employee.jobTitle}
                  </TableCell>
                  <TableCell>
                    <EmployeeStatusBadge status={employee.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(employee.startDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <EmployeeRowActions employee={employee} onDelete={onDelete} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
