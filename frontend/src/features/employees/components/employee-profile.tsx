"use client";

import { ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDate,
  formatDateTime,
  getCountryName,
  getFullName,
} from "@/lib/format";

import { useEmployee } from "../hooks";
import { EMPLOYEE_ROUTES } from "../routes";
import type { Employee } from "../types";
import { DeleteEmployeeDialog } from "./delete-employee-dialog";
import { EmployeeCompensation } from "./employee-compensation";
import { EmployeeNotFound, isNotFoundError } from "./employee-not-found";
import { EmployeeStatusBadge } from "./employee-status-badge";

export function EmployeeProfile({
  id,
  readOnly,
}: {
  id: string;
  readOnly?: boolean;
}) {
  const employee = useEmployee(id);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null,
  );

  const backLink = (
    <Link
      href={EMPLOYEE_ROUTES.list}
      className={buttonVariants({
        variant: "ghost",
        className: "-ml-2 w-fit",
      })}
    >
      <ArrowLeftIcon aria-hidden="true" size={14} />
      Employees
    </Link>
  );

  if (employee.isPending) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        {backLink}
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full max-w-3xl" />
      </div>
    );
  }

  if (employee.isError) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        {isNotFoundError(employee.error) ? (
          <EmployeeNotFound />
        ) : (
          <QueryError
            title="Unable to load employee"
            error={employee.error}
            onRetry={() => void employee.refetch()}
          />
        )}
      </div>
    );
  }

  const data = employee.data;
  const isDeleted = data.status === "DELETED";

  const details: { label: string; value: ReactNode }[] = [
    {
      label: "Employee ID",
      value: <span className="font-mono">{data.employeeCode}</span>,
    },
    { label: "Email", value: data.email ?? "—" },
    { label: "Country", value: getCountryName(data.countryCode) },
    { label: "Department", value: data.department },
    { label: "Title", value: data.jobTitle },
    {
      label: "Employment status",
      value: <EmployeeStatusBadge status={data.status} />,
    },
    { label: "Joining date", value: formatDate(data.startDate) },
    { label: "End date", value: formatDate(data.endDate) },
    { label: "Last updated", value: formatDateTime(data.updatedAt) },
    ...(data.deletedAt
      ? [{ label: "Deleted on", value: formatDateTime(data.deletedAt) }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      {backLink}
      <PageHeader
        title={getFullName(data)}
        description={`${data.jobTitle} · ${data.department}`}
        actions={
          isDeleted || readOnly ? null : (
            <>
              <Link
                href={EMPLOYEE_ROUTES.edit(data.id)}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                <PencilIcon aria-hidden="true" />
                Edit employee
              </Link>
              <Button
                variant="destructive"
                size="lg"
                onClick={() => setEmployeeToDelete(data)}
              >
                <Trash2Icon aria-hidden="true" />
                Delete employee
              </Button>
            </>
          )
        }
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>
            <h2>Employee details</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {details.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <dt className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="text-sm">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <EmployeeCompensation employeeId={data.id} readOnly={readOnly} />

      <DeleteEmployeeDialog
        employee={employeeToDelete}
        onClose={() => setEmployeeToDelete(null)}
      />
    </div>
  );
}
