"use client";

import { useId } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly SelectFieldOption[];
  placeholder: string;
  error?: string;
  disabled?: boolean;
  name?: string;
}

/** Form select with label, placeholder and validation message. */
export function SelectField({
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  error,
  disabled,
  name,
}: SelectFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        items={options}
        value={value === "" ? null : value}
        disabled={disabled}
        name={name}
        onValueChange={(next) => onChange(typeof next === "string" ? next : "")}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onBlur={onBlur}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  );
}
