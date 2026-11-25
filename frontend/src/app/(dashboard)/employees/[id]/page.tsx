import type { Metadata } from "next";
import { Suspense } from "react";

import { requireRole } from "@/features/auth/server/session";
import { EmployeePageSkeleton } from "@/features/employees/components/employee-page-skeleton";
import { EmployeeProfile } from "@/features/employees/components/employee-profile";
import { EMPLOYEE_PAGE_ROLES } from "@/features/employees/routes";

export const metadata: Metadata = {
  title: "Employee",
};

export default function EmployeePage({ params }: PageProps<"/employees/[id]">) {
  return (
    <Suspense fallback={<EmployeePageSkeleton />}>
      <AuthorizedProfile params={params} />
    </Suspense>
  );
}

async function AuthorizedProfile({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }] = await Promise.all([params, requireRole(EMPLOYEE_PAGE_ROLES)]);
  return <EmployeeProfile id={id} />;
}
