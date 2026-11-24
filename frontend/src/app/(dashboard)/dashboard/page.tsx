import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/features/auth/server/session";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-24 w-full max-w-xl" />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  // Re-verified here (deduplicated per request) because layouts are not
  // re-rendered on every client navigation.
  const user = await getCurrentUser();
  return <DashboardOverview user={user} />;
}
