"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { FormAlert } from "@/components/form/form-alert";
import { SelectField } from "@/components/form/select-field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-client";

import {
  compensationFormSchema,
  EMPTY_COMPENSATION_FORM,
  formValuesToCompensationPayload,
  type CompensationFormValues,
} from "../compensation-schemas";
import { useCreateCompensationRecord, useCurrencies } from "../hooks";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const TYPE_OPTIONS = [
  { value: "BASE_SALARY", label: "Base salary" },
  { value: "BONUS", label: "Bonus" },
  { value: "COMMISSION", label: "Commission" },
  { value: "EQUITY_GRANT", label: "Equity grant" },
  { value: "ALLOWANCE", label: "Allowance" },
];

const FREQUENCY_OPTIONS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "SEMI_MONTHLY", label: "Semi-monthly" },
  { value: "BI_WEEKLY", label: "Bi-weekly" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "ANNUAL", label: "Annual" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AddCompensationDialogProps {
  employeeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddCompensationDialog({
  employeeId,
  open,
  onOpenChange,
  onSuccess,
}: AddCompensationDialogProps) {
  const currencies = useCurrencies();
  const createRecord = useCreateCompensationRecord(employeeId);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompensationFormValues>({
    resolver: zodResolver(compensationFormSchema),
    defaultValues: EMPTY_COMPENSATION_FORM,
  });

  const currencyOptions =
    currencies.data?.map((c) => ({ value: c.code, label: `${c.code} — ${c.label}` })) ?? [];

  const handleClose = () => {
    reset();
    createRecord.reset();
    onOpenChange(false);
  };

  const onSubmit = (values: CompensationFormValues) => {
    createRecord.mutate(formValuesToCompensationPayload(values), {
      onSuccess: () => {
        toast.add({
          type: "success",
          title: "Compensation record added",
          description: "The new compensation record has been saved.",
        });
        onSuccess?.();
        handleClose();
      },
    });
  };

  const optional = (
    <span className="font-normal text-muted-foreground">(optional)</span>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add compensation record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {createRecord.isError ? (
              <FormAlert
                variant="error"
                title="Unable to save record"
                message={getErrorMessage(createRecord.error)}
              />
            ) : null}

            {/* Amount + Currency */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.amount}>
                <FieldLabel htmlFor="comp-amount">Amount</FieldLabel>
                <Input
                  id="comp-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-invalid={!!errors.amount}
                  aria-describedby={errors.amount ? "comp-amount-error" : undefined}
                  {...register("amount")}
                />
                <FieldError id="comp-amount-error">{errors.amount?.message}</FieldError>
              </Field>

              <Controller
                name="currencyCode"
                control={control}
                render={({ field, fieldState }) => (
                  <SelectField
                    label="Currency"
                    placeholder="Select currency"
                    options={currencyOptions}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    disabled={currencies.isPending}
                  />
                )}
              />
            </div>

            {/* Type + Frequency */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="type"
                control={control}
                render={({ field, fieldState }) => (
                  <SelectField
                    label="Type"
                    placeholder="Select type"
                    options={TYPE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="payFrequency"
                control={control}
                render={({ field, fieldState }) => (
                  <SelectField
                    label="Pay frequency"
                    placeholder="Select frequency"
                    options={FREQUENCY_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            {/* Effective dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.effectiveFrom}>
                <FieldLabel htmlFor="comp-from">Effective from</FieldLabel>
                <Input
                  id="comp-from"
                  type="date"
                  aria-invalid={!!errors.effectiveFrom}
                  aria-describedby={errors.effectiveFrom ? "comp-from-error" : undefined}
                  {...register("effectiveFrom")}
                />
                <FieldError id="comp-from-error">{errors.effectiveFrom?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.effectiveTo}>
                <FieldLabel htmlFor="comp-to">
                  Effective to {optional}
                </FieldLabel>
                <Input
                  id="comp-to"
                  type="date"
                  aria-invalid={!!errors.effectiveTo}
                  aria-describedby={errors.effectiveTo ? "comp-to-error" : undefined}
                  {...register("effectiveTo")}
                />
                <FieldError id="comp-to-error">{errors.effectiveTo?.message}</FieldError>
              </Field>
            </div>

            {/* Change reason */}
            <Field>
              <FieldLabel htmlFor="comp-reason">
                Change reason {optional}
              </FieldLabel>
              <Input
                id="comp-reason"
                placeholder="e.g. Annual review, promotion…"
                {...register("changeReason")}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={createRecord.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRecord.isPending}
              aria-busy={createRecord.isPending}
            >
              {createRecord.isPending ? (
                <>
                  <Spinner aria-hidden="true" role="presentation" />
                  Saving…
                </>
              ) : (
                "Save record"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
