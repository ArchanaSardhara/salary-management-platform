import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useInfiniteScroll } from "./use-infinite-scroll";

const observers = new Set<MockObserver>();
class MockObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {
    observers.add(this);
  }
  observe() {}
  disconnect() {
    observers.delete(this);
  }
  trigger(isIntersecting = true) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}
const triggerAll = (isIntersecting = true) =>
  act(() => {
    for (const observer of [...observers]) observer.trigger(isIntersecting);
  });

function List(props: { hasMore: boolean; isLoading: boolean; loadedCount: number; onLoadMore: () => void }) {
  const ref = useInfiniteScroll(props);
  return <div ref={ref} />;
}

beforeEach(() => {
  observers.clear();
  vi.stubGlobal("IntersectionObserver", MockObserver);
});

describe("useInfiniteScroll", () => {
  it("loads more when the sentinel becomes visible, once per intersection", () => {
    const onLoadMore = vi.fn();
    render(<List hasMore isLoading={false} loadedCount={25} onLoadMore={onLoadMore} />);

    triggerAll(false);
    expect(onLoadMore).not.toHaveBeenCalled();

    triggerAll();
    triggerAll();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("does not observe while loading or when there is nothing more", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<List hasMore isLoading loadedCount={25} onLoadMore={onLoadMore} />);
    expect(observers.size).toBe(0);

    rerender(<List hasMore={false} isLoading={false} loadedCount={25} onLoadMore={onLoadMore} />);
    expect(observers.size).toBe(0);
  });

  it("observes again after more items load, even without a loading render", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<List hasMore isLoading={false} loadedCount={25} onLoadMore={onLoadMore} />);
    triggerAll();
    expect(observers.size).toBe(0);

    rerender(<List hasMore isLoading={false} loadedCount={50} onLoadMore={onLoadMore} />);
    expect(observers.size).toBe(1);
    triggerAll();
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it("does nothing without IntersectionObserver support", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const onLoadMore = vi.fn();
    expect(() =>
      render(<List hasMore isLoading={false} loadedCount={25} onLoadMore={onLoadMore} />),
    ).not.toThrow();
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
