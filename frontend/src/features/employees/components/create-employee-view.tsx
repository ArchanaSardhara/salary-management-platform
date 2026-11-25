"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { QueryError } from "@/components/query-error";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-client";
import { getFullName } from "@/lib/format";

import { useCreateEmployee, useEmployeeOptions } from "../hooks";
import { EMPLOYEE_ROUTES } from "../routes";
import { EMPTY_EMPLOYEE_FORM, formValuesToPayload } from "../schemas";
import { EmployeeForm } from "./employee-form";
import { EmployeeFormSkeleton } from "./employee-form-skeleton";

export function CreateEmployeeView() {
  const router = useRouter();
  const options = useEmployeeOptions();
  const createEmployee = useCreateEmployee();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Add employee"
        description="The employee ID is generated automatically when you save."
      />
      <Card>
        <CardContent>
          {options.isPending ? (
            <EmployeeFormSkeleton />
          ) : options.isError ? (
            <QueryError
              title="Unable to load form options"
              error={options.error}
              onRetry={() => void options.refetch()}
            />
          ) : (
            <EmployeeForm
              options={options.data}
              defaultValues={EMPTY_EMPLOYEE_FORM}
              submitLabel="Add employee"
              pendingLabel="Saving…"
              cancelHref={EMPLOYEE_ROUTES.list}
              isPending={createEmployee.isPending}
              errorMessage={createEmployee.isError ? getErrorMessage(createEmployee.error) : null}
              onSubmit={(values) =>
                createEmployee.mutate(formValuesToPayload(values), {
                  onSuccess: (employee) => {
                    toast.add({
                      type: "success",
                      title: "Employee added",
                      description: `${getFullName(employee)} was added as ${employee.employeeCode}.`,
                    });
                    router.push(EMPLOYEE_ROUTES.detail(employee.id));
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
