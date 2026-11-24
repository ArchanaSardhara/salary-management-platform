"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api-client";

import { useForgotPassword } from "../hooks";
import { AUTH_ROUTES } from "../routes";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas";

export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit((values) => forgotPassword.mutate(values));

  const backToSignIn = (
    <p className="text-center text-sm text-muted-foreground">
      Remembered it?{" "}
      <Link
        href={AUTH_ROUTES.login}
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        Back to sign in
      </Link>
    </p>
  );

  // The backend replies identically whether or not the account exists, so
  // the UI does the same and never reveals which emails are registered.
  if (forgotPassword.isSuccess) {
    return (
      <FieldGroup>
        <FormAlert
          variant="success"
          title="Check your email"
          message={forgotPassword.data.message}
        />
        {backToSignIn}
      </FieldGroup>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Reset password">
      <FieldGroup>
        {forgotPassword.isError ? (
          <FormAlert
            variant="error"
            title="Unable to send reset link"
            message={getErrorMessage(forgotPassword.error)}
          />
        ) : null}

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="email-error" errors={[errors.email]} />
        </Field>

        <SubmitButton isPending={forgotPassword.isPending} pendingLabel="Sending…">
          Send reset link
        </SubmitButton>

        {backToSignIn}
      </FieldGroup>
    </form>
  );
}
