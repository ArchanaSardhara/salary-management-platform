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

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span id={labelId} className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <Select
        multiple
        items={options}
        value={[...values]}
        disabled={disabled}
        onValueChange={(next) =>
          onChange(Array.isArray(next) ? next.filter((item) => typeof item === "string") : [])
        }
      >
        <SelectTrigger aria-labelledby={labelId} className="w-full">
          <SelectValue className={cn(values.length === 0 && "text-muted-foreground")}>
            {() => summary}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
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
