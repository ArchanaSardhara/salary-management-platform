"use client";

import { useEffect, useRef, useState } from "react";

interface UseInfiniteScrollOptions {
  /** Whether more items can be loaded. */
  hasMore: boolean;
  /** Whether a load is in progress (no new load is triggered meanwhile). */
  isLoading: boolean;
  onLoadMore: () => void;
  /**
   * Changes whenever a load completes (e.g. the number of loaded items). The
   * sentinel is re-observed on change, even if the loading state was never
   * rendered in between.
   */
  loadedCount: number;
  /** How far before the end to start loading, e.g. "400px". */
  rootMargin?: string;
}

/**
 * Calls `onLoadMore` when a sentinel element is (or scrolls) near the
 * viewport. Attach the returned ref callback to an element placed after the
 * last item.
 *
 * The observer is recreated after every load, so if the sentinel is still
 * visible (e.g. on a tall screen) the next page loads too. Without
 * IntersectionObserver support nothing happens, so pair it with a visible
 * "Load more" button.
 */
export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  loadedCount,
  rootMargin = "400px",
}: UseInfiniteScrollOptions) {
  const [sentinel, setSentinel] = useState<Element | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!sentinel || !hasMore || isLoading || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          onLoadMoreRef.current();
        }
      },
      { rootMargin },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasMore, isLoading, loadedCount, rootMargin]);

  return setSentinel;
}
