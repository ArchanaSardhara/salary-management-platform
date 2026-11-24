import { Suspense, type ReactNode } from "react";

import { getCurrentUser } from "@/features/auth/server/session";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardShellSkeleton } from "@/features/dashboard/components/dashboard-shell-skeleton";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}

/**
 * Verifies the session on the server before any authenticated UI renders.
 * `getCurrentUser` redirects to /login when the session is missing or invalid.
 */
async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
