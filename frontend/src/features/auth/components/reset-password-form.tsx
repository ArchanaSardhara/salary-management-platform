"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api-client";

import { useResetPassword } from "../hooks";
import { AUTH_ROUTES } from "../routes";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../schemas";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const resetPassword = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!token) {
      router.replace(AUTH_ROUTES.forgotPassword);
    }
  }, [token, router]);

  const onSubmit = handleSubmit(({ password }) =>
    resetPassword.mutate({ token, password }),
  );

  if (resetPassword.isSuccess) {
    return (
      <FieldGroup>
        <FormAlert
          variant="success"
          title="Password updated"
          message="Your password has been reset successfully."
        />
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href={AUTH_ROUTES.login}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in with your new password
          </Link>
        </p>
      </FieldGroup>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Set new password">
      <FieldGroup>
        {resetPassword.isError ? (
          <FormAlert
            variant="error"
            title="Unable to reset password"
            message={getErrorMessage(resetPassword.error)}
          />
        ) : null}

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "password-error" : "password-hint"
              }
              {...register("password")}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <EyeOffIcon aria-hidden="true" />
                ) : (
                  <EyeIcon aria-hidden="true" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription id="password-hint">
            Between 8 and 20 characters.
          </FieldDescription>
          <FieldError id="password-error" errors={[errors.password]} />
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            {...register("confirmPassword")}
          />
          <FieldError
            id="confirmPassword-error"
            errors={[errors.confirmPassword]}
          />
        </Field>

        <SubmitButton
          isPending={resetPassword.isPending}
          pendingLabel="Saving…"
        >
          Set new password
        </SubmitButton>
      </FieldGroup>
    </form>
  );
}
