"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { FormAlert } from "@/components/form/form-alert";
import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-error";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-client";
import { getFullName } from "@/lib/format";

import { useEmployee, useEmployeeOptions, useUpdateEmployee } from "../hooks";
import { EMPLOYEE_ROUTES } from "../routes";
import { buildUpdatePayload, employeeToFormValues } from "../schemas";
import { EmployeeForm } from "./employee-form";
import { EmployeeFormSkeleton } from "./employee-form-skeleton";
import { EmployeeNotFound, isNotFoundError } from "./employee-not-found";

export function EditEmployeeView({ id }: { id: string }) {
  const router = useRouter();
  const employee = useEmployee(id);
  const options = useEmployeeOptions();
  const updateEmployee = useUpdateEmployee(id);

  if (employee.isError && isNotFoundError(employee.error)) {
    return <EmployeeNotFound />;
  }

  const title = employee.data ? `Edit ${getFullName(employee.data)}` : "Edit employee";

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title={title} description={employee.data?.employeeCode} />
      <Card>
        <CardContent>
          {employee.isPending || options.isPending ? (
            <EmployeeFormSkeleton />
          ) : employee.isError || options.isError ? (
            <QueryError
              title="Unable to load employee"
              error={employee.error ?? options.error}
              onRetry={() => {
                void employee.refetch();
                void options.refetch();
              }}
            />
          ) : employee.data.status === "DELETED" ? (
            <div className="flex flex-col items-start gap-3">
              <FormAlert
                variant="error"
                title="This employee has been deleted"
                message="Deleted employees can't be edited."
              />
              <Link
                href={EMPLOYEE_ROUTES.detail(id)}
                className={buttonVariants({ variant: "outline" })}
              >
                View employee
              </Link>
            </div>
          ) : (
            <EmployeeForm
              // Reset the form if a newer version of the employee is loaded.
              key={employee.data.version}
              options={options.data}
              defaultValues={employeeToFormValues(employee.data)}
              submitLabel="Save changes"
              pendingLabel="Saving…"
              cancelHref={EMPLOYEE_ROUTES.detail(id)}
              requireChanges
              isPending={updateEmployee.isPending}
              errorMessage={updateEmployee.isError ? getErrorMessage(updateEmployee.error) : null}
              onSubmit={(values) =>
                updateEmployee.mutate(buildUpdatePayload(employee.data, values), {
                  onSuccess: (updated) => {
                    toast.add({
                      type: "success",
                      title: "Changes saved",
                      description: `${getFullName(updated)} was updated.`,
                    });
                    router.push(EMPLOYEE_ROUTES.detail(id));
                  },
                })
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
