import { Skeleton } from "@/components/ui/skeleton";

/** Fallback while the server verifies access to an employee page. */
export function EmployeePageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
