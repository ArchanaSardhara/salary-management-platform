"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
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
import { getErrorMessage } from "@/lib/api-client";

import { useLogin } from "../hooks";
import { AUTH_ROUTES } from "../routes";
import { loginSchema, type LoginFormValues } from "../schemas";

export function LoginForm() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = handleSubmit((values) => login.mutate(values));

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Sign in">
      <FieldGroup>
        {login.isError ? (
          <FormAlert
            variant="error"
            title="Unable to sign in"
            message={getErrorMessage(login.error)}
          />
        ) : null}

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            <FieldError id="email-error" errors={[errors.email]} />
          </InputGroup>
        </Field>

        <Field data-invalid={!!errors.password}>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href={AUTH_ROUTES.forgotPassword}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <InputGroup>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
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
          <FieldError id="password-error" errors={[errors.password]} />
        </Field>

        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="rememberMe"
                name={field.name}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
              />
              <FieldLabel htmlFor="rememberMe" className="font-normal">
                Keep me signed in
              </FieldLabel>
            </Field>
          )}
        />

        <SubmitButton isPending={login.isPending} pendingLabel="Signing in…">
          Sign in
        </SubmitButton>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={AUTH_ROUTES.register}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
