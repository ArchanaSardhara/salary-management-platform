"use client";

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

import { EMPLOYEE_ROUTES } from "../routes";
import type { Employee } from "../types";
import { EmployeeRowActions } from "./employee-row-actions";
import { EmployeeStatusBadge } from "./employee-status-badge";

const COLUMNS = [
  "ID",
  "Name",
  "Email",
  "Country",
  "Department",
  "Title",
  "Status",
  "Joining Date",
] as const;

interface EmployeesTableProps {
  employees: readonly Employee[] | undefined;
  /** First load: render skeleton rows. */
  isLoading: boolean;
  /** Showing previous results while new ones load. */
  isRefreshing: boolean;
  skeletonRows: number;
  onDelete: (employee: Employee) => void;
  /** `top` offset (px) for the sticky table header — accounts for the
   *  dashboard header + sticky filter bar above the table. */
  tableHeadTop?: number;
}

export function EmployeesTable({
  employees,
  isLoading,
  isRefreshing,
  skeletonRows,
  onDelete,
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
      {/* table-fixed with no overflow on the container keeps all columns
          visible without a horizontal scrollbar while allowing sticky <th>
          elements to anchor to the page scroll (not a local scroll context). */}
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
            {COLUMNS.map((column) => (
              <TableHead
                key={column}
                scope="col"
                className="sticky z-10 bg-secondary"
                style={{ top: tableHeadTop }}
              >
                {column}
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
                  <TableCell
                    className="max-w-0 truncate"
                    title={employee.department}
                  >
                    {employee.department}
                  </TableCell>
                  <TableCell
                    className="max-w-0 truncate"
                    title={employee.jobTitle}
                  >
                    {employee.jobTitle}
                  </TableCell>
                  <TableCell>
                    <EmployeeStatusBadge status={employee.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(employee.startDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <EmployeeRowActions
                      employee={employee}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
