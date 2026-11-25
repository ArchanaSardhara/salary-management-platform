"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm, type FieldError as RhfFieldError } from "react-hook-form";

import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { getErrorMessage } from "@/lib/api-client";

import { useRegister } from "../hooks";
import { AUTH_ROUTES } from "../routes";
import { registerSchema, type RegisterFormValues } from "../schemas";

function describedBy(id: string, error: RhfFieldError | undefined, extra?: string) {
  const ids = [extra, error ? `${id}-error` : undefined].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function RegisterForm() {
  const registerUser = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(({ firstName, lastName, email, password }) =>
    registerUser.mutate({
      firstName,
      lastName: lastName || undefined,
      email,
      password,
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Create account">
      <FieldGroup>
        {registerUser.isError ? (
          <FormAlert
            variant="error"
            title="Unable to create account"
            message={getErrorMessage(registerUser.error)}
          />
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={!!errors.firstName}>
            <FieldLabel htmlFor="firstName">First name</FieldLabel>
            <Input
              id="firstName"
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
              aria-describedby={describedBy("firstName", errors.firstName)}
              {...register("firstName")}
            />
            <FieldError id="firstName-error" errors={[errors.firstName]} />
          </Field>

          <Field data-invalid={!!errors.lastName}>
            <FieldLabel htmlFor="lastName">
              Last name <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input
              id="lastName"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              aria-describedby={describedBy("lastName", errors.lastName)}
              {...register("lastName")}
            />
            <FieldError id="lastName-error" errors={[errors.lastName]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Work email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email", errors.email)}
            {...register("email")}
          />
          <FieldError id="email-error" errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={describedBy("password", errors.password, "password-hint")}
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
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={describedBy("confirmPassword", errors.confirmPassword)}
            {...register("confirmPassword")}
          />
          <FieldError id="confirmPassword-error" errors={[errors.confirmPassword]} />
        </Field>

        <SubmitButton isPending={registerUser.isPending} pendingLabel="Creating account…">
          Create account
        </SubmitButton>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={AUTH_ROUTES.login}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
