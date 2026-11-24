import { Skeleton } from "@/components/ui/skeleton";

/** Static placeholder shown while the session is verified on the server. */
export function DashboardShellSkeleton() {
  return (
    <div className="flex min-h-svh w-full" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your workspace…</span>
      <div className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-4 md:flex">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="mt-auto h-12 w-full" />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
