"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormAlert } from "@/components/form/form-alert";
import { SelectField } from "@/components/form/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getCountryName } from "@/lib/format";

import { employeeFormSchema, type EmployeeFormValues } from "../schemas";
import type { EmployeeOptions } from "../types";

interface EmployeeFormProps {
  options: EmployeeOptions;
  defaultValues: EmployeeFormValues;
  onSubmit: (values: EmployeeFormValues) => void;
  isPending: boolean;
  /** Error message from the last submit attempt. */
  errorMessage: string | null;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
  /** Edit mode: disable submit until something changes. */
  requireChanges?: boolean;
}

type TextFieldName =
  | "firstName"
  | "lastName"
  | "email"
  | "startDate"
  | "endDate";

export function EmployeeForm({
  options,
  defaultValues,
  onSubmit,
  isPending,
  errorMessage,
  submitLabel,
  pendingLabel,
  cancelHref,
  requireChanges = false,
}: EmployeeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
  });

  const countryOptions = options.countryCodes
    .map((code) => ({ value: code, label: getCountryName(code) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const toOptions = (values: readonly string[]) =>
    values.map((value) => ({ value, label: value }));

  const optional = (
    <span className="font-normal text-muted-foreground">(optional)</span>
  );

  const textField = (
    name: TextFieldName,
    label: ReactNode,
    inputProps: ComponentProps<typeof Input> = {},
  ) => {
    const error = errors[name]?.message;
    const errorId = `${name}-error`;
    return (
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        <Input
          id={name}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
          {...register(name)}
        />
        <FieldError id={errorId}>{error}</FieldError>
      </Field>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label={submitLabel}>
      <FieldGroup>
        {errorMessage ? (
          <FormAlert
            variant="error"
            title="Unable to save employee"
            message={errorMessage}
          />
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          {textField("firstName", "First name", { autoComplete: "off" })}
          {textField("lastName", <>Last name {optional}</>, {
            autoComplete: "off",
          })}
        </div>

        {textField("email", <>Email {optional}</>, {
          type: "email",
          autoComplete: "off",
        })}

        <div className="grid gap-5 sm:grid-cols-3">
          <Controller
            name="countryCode"
            control={control}
            render={({ field, fieldState }) => (
              <SelectField
                label="Country"
                placeholder="Select a country"
                options={countryOptions}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="department"
            control={control}
            render={({ field, fieldState }) => (
              <SelectField
                label="Department"
                placeholder="Select a department"
                options={toOptions(options.departments)}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="jobTitle"
            control={control}
            render={({ field, fieldState }) => (
              <SelectField
                label="Title"
                placeholder="Select a title"
                options={toOptions(options.jobTitles)}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {textField("startDate", "Joining date", { type: "date" })}
          {textField("endDate", <>End date {optional}</>, { type: "date" })}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link
            href={cancelHref}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Cancel
          </Link>
          <Button
            type="submit"
            size="lg"
            disabled={isPending || (requireChanges && !isDirty)}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <Spinner aria-hidden="true" />
                {pendingLabel}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
