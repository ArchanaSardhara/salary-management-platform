import type { Metadata } from "next";
import { Suspense } from "react";

import { requireRole } from "@/features/auth/server/session";
import { HrManagerList } from "@/features/hr-managers/components/hr-manager-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "HR Managers",
};

export default function HrManagersPage() {
  return (
    <Suspense fallback={<HrManagersPageSkeleton />}>
      <AuthorizedList />
    </Suspense>
  );
}

async function AuthorizedList() {
  await requireRole(["ADMIN"]);
  return <HrManagerList />;
}

function HrManagersPageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-9 w-72" />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
