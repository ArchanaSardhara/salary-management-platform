"use client";

import { QueryError } from "@/components/query-error";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { formatNumber } from "@/lib/format";

interface EmployeeListFooterProps {
  loadedCount: number;
  total: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  /** Stop automatic loading, e.g. while new filters are being applied. */
  isPaused: boolean;
  loadMoreError: unknown;
  pageSize: number;
  onLoadMore: () => void;
}

/**
 * End of the employee list: loads the next batch when scrolled into view,
 * with a "Load more" button for keyboard users and as a fallback.
 */
export function EmployeeListFooter({
  loadedCount,
  total,
  hasMore,
  isLoadingMore,
  isPaused,
  loadMoreError,
  pageSize,
  onLoadMore,
}: EmployeeListFooterProps) {
  const sentinelRef = useInfiniteScroll({
    // After a failed load, wait for an explicit retry instead of looping.
    hasMore: hasMore && !isPaused && !loadMoreError,
    isLoading: isLoadingMore,
    onLoadMore,
    loadedCount,
  });

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {hasMore
          ? `Showing ${formatNumber(loadedCount)} of ${formatNumber(total)} employees`
          : `All ${formatNumber(total)} ${total === 1 ? "employee" : "employees"} loaded`}
      </p>

      {loadMoreError ? (
        <QueryError title="Unable to load more employees" error={loadMoreError} onRetry={onLoadMore} />
      ) : isLoadingMore ? (
        <p className="flex items-center gap-2 text-sm" role="status">
          <Spinner aria-hidden="true" />
          Loading more employees…
        </p>
      ) : hasMore ? (
        <Button variant="outline" onClick={onLoadMore} disabled={isPaused}>
          Load {formatNumber(Math.min(pageSize, total - loadedCount))} more
        </Button>
      ) : null}
    </div>
  );
}
