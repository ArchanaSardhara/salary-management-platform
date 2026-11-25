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
import { formatDateTime } from "@/lib/format";
import { EMPLOYEE_ROUTES } from "@/features/employees/routes";

import { formatAmount } from "../display";
import { useRecentChanges } from "../hooks";

export function RecentChangesTable() {
  const { data, isLoading } = useRecentChanges(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Compensation Changes</CardTitle>
        <CardDescription>Latest 10 audit log entries</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data?.length ? (
          <div className="flex h-40 items-center justify-center rounded-b-lg border-t border-dashed">
            <p className="text-sm text-muted-foreground">
              No compensation changes recorded yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Before</TableHead>
                  <TableHead>After</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Changed At
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell className="whitespace-nowrap">
                      <Link
                        href={EMPLOYEE_ROUTES.detail(change.employeeId)}
                        className="font-medium hover:underline underline-offset-4 focus-visible:underline"
                      >
                        {change.employeeName}
                      </Link>
                      <span className="ml-1 font-mono text-xs text-muted-foreground">
                        {change.employeeCode}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {change.beforeAmount ? (
                        formatAmount(change.beforeAmount, change.beforeCurrency)
                      ) : (
                        <span className="italic">New</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(change.afterAmount, change.afterCurrency)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(change.changedAt)}
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
