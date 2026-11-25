import type { Metadata } from "next";
import { Suspense } from "react";

import { requireRole } from "@/features/auth/server/session";
import { CreateEmployeeView } from "@/features/employees/components/create-employee-view";
import { EmployeePageSkeleton } from "@/features/employees/components/employee-page-skeleton";
import { EMPLOYEE_WRITE_ROLES } from "@/features/employees/routes";

export const metadata: Metadata = {
  title: "Add employee",
};

export default function NewEmployeePage() {
  return (
    <Suspense fallback={<EmployeePageSkeleton />}>
      <AuthorizedCreate />
    </Suspense>
  );
}

async function AuthorizedCreate() {
  await requireRole(EMPLOYEE_WRITE_ROLES);
  return <CreateEmployeeView />;
}
