import type { Metadata } from "next";
import { Suspense } from "react";

import { requireRole } from "@/features/auth/server/session";
import { EditEmployeeView } from "@/features/employees/components/edit-employee-view";
import { EmployeePageSkeleton } from "@/features/employees/components/employee-page-skeleton";
import { EMPLOYEE_WRITE_ROLES } from "@/features/employees/routes";

export const metadata: Metadata = {
  title: "Edit employee",
};

export default function EditEmployeePage({ params }: PageProps<"/employees/[id]/edit">) {
  return (
    <Suspense fallback={<EmployeePageSkeleton />}>
      <AuthorizedEdit params={params} />
    </Suspense>
  );
}

async function AuthorizedEdit({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }] = await Promise.all([params, requireRole(EMPLOYEE_WRITE_ROLES)]);
  return <EditEmployeeView id={id} />;
}
