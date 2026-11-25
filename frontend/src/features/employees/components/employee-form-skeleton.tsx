import { Skeleton } from "@/components/ui/skeleton";

export function EmployeeFormSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <span className="sr-only">Loading form…</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ))}
    </div>
  );
}
