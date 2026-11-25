import { UserXIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";

import { EMPLOYEE_ROUTES } from "../routes";

export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function EmployeeNotFound() {
  return (
    <EmptyState
      icon={UserXIcon}
      title="Employee not found"
      description="This employee doesn't exist or the link is incorrect."
      action={
        <Link href={EMPLOYEE_ROUTES.list} className={buttonVariants({ variant: "outline" })}>
          Back to employees
        </Link>
      }
    />
  );
}
