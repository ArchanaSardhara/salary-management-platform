"use client";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, getCountryName, getFullName } from "@/lib/format";
import { EMPLOYEE_ROUTES } from "@/features/employees/routes";

import { useEmployeesWithoutCompensation } from "../hooks";

export function NoCompensationTable() {
  const { data, isLoading } = useEmployeesWithoutCompensation(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employees Without Compensation</CardTitle>
        <CardDescription>
          Active employees with no open-ended compensation record
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data?.length ? (
          <div className="flex h-40 items-center justify-center rounded-b-lg border-t">
            <p className="text-sm text-muted-foreground">
              All active employees have compensation records
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Start Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="whitespace-nowrap">
                      <Link
                        href={EMPLOYEE_ROUTES.detail(employee.id)}
                        className="font-medium hover:underline underline-offset-4 focus-visible:underline"
                      >
                        {getFullName(employee)}
                      </Link>
                      <span className="ml-1 font-mono text-xs text-muted-foreground">
                        {employee.employeeCode}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.department}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getCountryName(employee.countryCode)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(employee.startDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
