import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SearchInput } from "./search-input";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderSearch(value = "", onSearch = vi.fn()) {
  const utils = render(<SearchInput label="Search" value={value} onSearch={onSearch} delay={300} />);
  return { ...utils, onSearch, input: screen.getByLabelText("Search") };
}

describe("SearchInput", () => {
  it("calls onSearch once with the trimmed value after the user stops typing", () => {
    const { input, onSearch } = renderSearch();

    fireEvent.change(input, { target: { value: "a" } });
    act(() => void vi.advanceTimersByTime(200));
    fireEvent.change(input, { target: { value: "ada " } });
    act(() => void vi.advanceTimersByTime(299));
    expect(onSearch).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(1));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("ada");
  });

  it("clears immediately and cancels a pending search", () => {
    const { input, onSearch } = renderSearch();

    fireEvent.change(input, { target: { value: "ada" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    act(() => void vi.advanceTimersByTime(500));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("");
    expect(input).toHaveValue("");
  });

  it("follows outside changes to the value", () => {
    const { input, rerender, onSearch } = renderSearch("ada");
    expect(input).toHaveValue("ada");

    rerender(<SearchInput label="Search" value="" onSearch={onSearch} />);
    expect(input).toHaveValue("");
  });

  it("keeps a pending edit when the value changes from outside", () => {
    const { input, rerender, onSearch } = renderSearch("ada");

    fireEvent.change(input, { target: { value: "grace" } });
    rerender(<SearchInput label="Search" value="other" onSearch={onSearch} />);

    expect(input).toHaveValue("grace");
  });
});
