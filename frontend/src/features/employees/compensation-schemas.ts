import { z } from "zod";

import type { CompensationType, CreateCompensationPayload, PayFrequency } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isoDate = (message: string) =>
  z
    .string()
    .regex(ISO_DATE, message)
    .refine(
      (v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()),
      message,
    );

const AMOUNT_MAX = 10_000_000;

export const compensationFormSchema = z
  .object({
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine(
        (v) => { const n = Number(v); return !Number.isNaN(n) && n > 0; },
        "Enter a valid positive amount",
      )
      .refine(
        (v) => Number(v) <= AMOUNT_MAX,
        `Amount cannot exceed ${AMOUNT_MAX.toLocaleString()}`,
      )
      .refine(
        (v) => /^\d+(\.\d{1,2})?$/.test(v),
        "Amount can have at most 2 decimal places",
      ),
    currencyCode: z.string().min(1, "Currency is required"),
    type: z.string().min(1, "Type is required"),
    payFrequency: z.string().min(1, "Pay frequency is required"),
    effectiveFrom: z
      .string()
      .min(1, "Effective from date is required")
      .pipe(isoDate("Enter a valid date")),
    effectiveTo: z.union([z.literal(""), isoDate("Enter a valid end date")]),
    changeReason: z.string(),
  })
  .refine(
    (v) => v.effectiveTo === "" || v.effectiveTo >= v.effectiveFrom,
    {
      message: "End date cannot be before the start date",
      path: ["effectiveTo"],
    },
  );

export type CompensationFormValues = z.infer<typeof compensationFormSchema>;

export const EMPTY_COMPENSATION_FORM: CompensationFormValues = {
  amount: "",
  currencyCode: "",
  type: "",
  payFrequency: "",
  effectiveFrom: "",
  effectiveTo: "",
  changeReason: "",
};

export function formValuesToCompensationPayload(
  values: CompensationFormValues,
): CreateCompensationPayload {
  return {
    amount: Number(values.amount),
    currencyCode: values.currencyCode,
    type: values.type as CompensationType,
    payFrequency: values.payFrequency as PayFrequency,
    effectiveFrom: values.effectiveFrom,
    effectiveTo: values.effectiveTo || undefined,
    changeReason: values.changeReason.trim() || undefined,
  };
}
