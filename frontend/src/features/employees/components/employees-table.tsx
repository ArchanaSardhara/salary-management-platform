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
  "Employee ID",
  "Employee Name",
  "Email",
  "Country",
  "Department",
  "Designation",
  "Employment Status",
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
}

export function EmployeesTable({
  employees,
  isLoading,
  isRefreshing,
  skeletonRows,
  onDelete,
}: EmployeesTableProps) {
  return (
    <div
      className={cn(
        "rounded-lg transition-opacity",
        isRefreshing && "opacity-60",
      )}
      aria-busy={isLoading || isRefreshing}
    >
      <Table>
        <TableCaption className="sr-only">Employee directory</TableCaption>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead key={column} scope="col" className="whitespace-nowrap">
                {column}
              </TableHead>
            ))}
            <TableHead scope="col" className="text-right">
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
                      <Skeleton className="h-4 w-full min-w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : employees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {employee.employeeCode}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    <Link
                      href={EMPLOYEE_ROUTES.detail(employee.id)}
                      className="underline-offset-4 hover:underline focus-visible:underline"
                    >
                      {getFullName(employee)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.email ?? <span aria-label="No email">—</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {getCountryName(employee.countryCode)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {employee.department}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
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
