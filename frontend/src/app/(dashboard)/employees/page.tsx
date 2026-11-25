import type { Metadata } from "next";
import { Suspense } from "react";

import { requireRole } from "@/features/auth/server/session";
import { EmployeeDirectory } from "@/features/employees/components/employee-directory";
import { EmployeePageSkeleton } from "@/features/employees/components/employee-page-skeleton";
import { EMPLOYEE_PAGE_ROLES } from "@/features/employees/routes";

export const metadata: Metadata = {
  title: "Employees",
};

export default function EmployeesPage() {
  return (
    <Suspense fallback={<EmployeePageSkeleton />}>
      <AuthorizedDirectory />
    </Suspense>
  );
}

async function AuthorizedDirectory() {
  await requireRole(EMPLOYEE_PAGE_ROLES);
  return <EmployeeDirectory />;
}
