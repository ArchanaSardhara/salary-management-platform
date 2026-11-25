"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormAlert } from "@/components/form/form-alert";
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
import { formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/api-client";

import type { CompensationRecord } from "../types";
import { useUpdateCompensationRecord } from "../hooks";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isoDate = (message: string) =>
  z
    .string()
    .regex(ISO_DATE, message)
    .refine(
      (v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()),
      message,
    );

const schema = z.object({
  effectiveTo: z.union([z.literal(""), isoDate("Enter a valid end date")]),
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EditEndDateDialogProps {
  employeeId: string;
  record: CompensationRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEndDateDialog({
  employeeId,
  record,
  open,
  onOpenChange,
}: EditEndDateDialogProps) {
  const updateRecord = useUpdateCompensationRecord(employeeId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { effectiveTo: record.effectiveTo ?? "" },
  });

  // Re-sync form when the dialog opens for a (possibly different) record.
  useEffect(() => {
    if (open) reset({ effectiveTo: record.effectiveTo ?? "" });
  }, [open, record.effectiveTo, reset]);

  const handleClose = () => {
    reset({ effectiveTo: record.effectiveTo ?? "" });
    updateRecord.reset();
    onOpenChange(false);
  };

  const onSubmit = (values: FormValues) => {
    updateRecord.mutate(
      {
        recordId: record.id,
        payload: { effectiveTo: values.effectiveTo || null },
      },
      {
        onSuccess: () => {
          toast.add({
            type: "success",
            title: "End date updated",
            description: "The compensation record has been updated.",
          });
          handleClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit end date</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {updateRecord.isError ? (
              <FormAlert
                variant="error"
                title="Unable to update record"
                message={getErrorMessage(updateRecord.error)}
              />
            ) : null}

            <p className="text-sm text-muted-foreground">
              Effective from:{" "}
              <span className="font-medium text-foreground">
                {formatDate(record.effectiveFrom)}
              </span>
            </p>

            <Field data-invalid={!!errors.effectiveTo}>
              <FieldLabel htmlFor="edit-effective-to">
                End date{" "}
                <span className="font-normal text-muted-foreground">
                  (leave empty for ongoing)
                </span>
              </FieldLabel>
              <Input
                id="edit-effective-to"
                type="date"
                min={record.effectiveFrom}
                aria-invalid={!!errors.effectiveTo}
                aria-describedby={
                  errors.effectiveTo ? "edit-effective-to-error" : undefined
                }
                {...register("effectiveTo")}
              />
              <FieldError id="edit-effective-to-error">
                {errors.effectiveTo?.message}
              </FieldError>
            </Field>

            {record.effectiveTo ? (
              <button
                type="button"
                className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={() =>
                  setValue("effectiveTo", "", { shouldValidate: false })
                }
              >
                Clear — set as ongoing
              </button>
            ) : null}
          </FieldGroup>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={updateRecord.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateRecord.isPending}
              aria-busy={updateRecord.isPending}
            >
              {updateRecord.isPending ? (
                <>
                  <Spinner aria-hidden="true" role="presentation" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
