"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

interface SearchInputProps {
  /** The committed value (e.g. from the URL). */
  value: string;
  /** Called with the trimmed value after the user stops typing. */
  onSearch: (value: string) => void;
  label: string;
  placeholder?: string;
  delay?: number;
  maxLength?: number;
  className?: string;
}

/**
 * Search box with a debounced `onSearch`. It keeps the typed text locally and
 * follows outside changes to `value` (e.g. "Clear filters", browser back)
 * unless the user has a pending, not yet committed edit.
 */
export function SearchInput({
  value,
  onSearch,
  label,
  placeholder,
  delay = 300,
  maxLength,
  className,
}: SearchInputProps) {
  const inputId = useId();
  const [text, setText] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const [isPending, setIsPending] = useState(false);

  const debounced = useDebouncedCallback((next: string) => {
    setIsPending(false);
    onSearch(next.trim());
  }, delay);

  // Adopt outside changes to `value` during render (React's recommended
  // alternative to syncing state in an effect).
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (!isPending) {
      setText(value);
    }
  }

  const handleChange = (next: string) => {
    setText(next);
    setIsPending(true);
    debounced.run(next);
  };

  const handleClear = () => {
    debounced.cancel();
    setIsPending(false);
    setText("");
    onSearch("");
  };

  return (
    <div className={className}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id={inputId}
          type="search"
          value={text}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete="off"
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && text) {
              event.preventDefault();
              handleClear();
            }
          }}
        />
        {text ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={handleClear}>
              <XIcon aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </div>
  );
}
