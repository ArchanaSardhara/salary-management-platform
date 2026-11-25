"use client";

import { useId } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "cn";

export interface FilterOption {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  label: string;
  /** Selected values; empty means "no filter". */
  values: readonly string[];
  onChange: (values: string[]) => void;
  options: readonly FilterOption[];
  /** Shown when nothing is selected, e.g. "All countries". */
  allLabel: string;
  disabled?: boolean;
  className?: string;
}

/** Summary for the trigger: "All …", the single label, or "First +N". */
export function summarizeSelection(
  values: readonly string[],
  options: readonly FilterOption[],
  allLabel: string,
): string {
  if (values.length === 0) {
    return allLabel;
  }
  const first = options.find((option) => option.value === values[0])?.label ?? values[0];
  return values.length === 1 ? first : `${first} +${values.length - 1}`;
}

// Sentinel used for the "All …" option inside the multi-select.
// Real filter values are country codes, department names, and status strings —
// none of which can be an empty string.
const ALL_VALUE = "";

/** Labeled multi-select filter. The popup stays open while toggling options. */
export function MultiSelectFilter({
  label,
  values,
  onChange,
  options,
  allLabel,
  disabled,
  className,
}: MultiSelectFilterProps) {
  const labelId = useId();
  const summary = summarizeSelection(values, options, allLabel);

  // Show the "All" sentinel as checked when nothing is selected.
  const selectValue = values.length === 0 ? [ALL_VALUE] : [...values];

  function handleChange(next: unknown) {
    const raw = Array.isArray(next) ? (next as string[]).filter((v) => typeof v === "string") : [];
    if (raw.includes(ALL_VALUE) && values.length > 0) {
      // User explicitly clicked "All …" while something was selected → clear.
      onChange([]);
    } else {
      // Normal toggle; strip the sentinel in case it slipped through.
      onChange(raw.filter((v) => v !== ALL_VALUE));
    }
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span id={labelId} className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <Select
        multiple
        items={options}
        value={selectValue}
        disabled={disabled}
        onValueChange={handleChange}
      >
        <SelectTrigger aria-labelledby={labelId} className="w-full">
          <SelectValue className={cn(values.length === 0 && "text-muted-foreground")}>
            {() => summary}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE} className="text-muted-foreground">
            {allLabel}
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
