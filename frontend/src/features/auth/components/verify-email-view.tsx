"use client";

import Link from "next/link";
import { useEffect } from "react";

import { FormAlert } from "@/components/form/form-alert";
import { FieldGroup } from "@/components/ui/field";
import { getErrorMessage } from "@/lib/api-client";

import { useVerifyEmail } from "../hooks";
import { AUTH_ROUTES } from "../routes";

interface VerifyEmailViewProps {
  token: string;
}

export function VerifyEmailView({ token }: VerifyEmailViewProps) {
  const verifyEmail = useVerifyEmail();

  useEffect(() => {
    if (token) {
      verifyEmail.mutate({ token });
    }
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) {
    return (
      <FieldGroup>
        <FormAlert
          variant="error"
          title="Invalid link"
          message="This verification link is missing a token. Please use the link from your email."
        />
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href={AUTH_ROUTES.login}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </FieldGroup>
    );
  }

  if (verifyEmail.isPending) {
    return (
      <FieldGroup>
        <p className="text-center text-sm text-muted-foreground">
          Verifying your email address…
        </p>
      </FieldGroup>
    );
  }

  if (verifyEmail.isSuccess) {
    return (
      <FieldGroup>
        <FormAlert
          variant="success"
          title="Email verified"
          message="Your email address has been verified successfully."
        />
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href={AUTH_ROUTES.login}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in to your account
          </Link>
        </p>
      </FieldGroup>
    );
  }

  if (verifyEmail.isError) {
    return (
      <FieldGroup>
        <FormAlert
          variant="error"
          title="Verification failed"
          message={getErrorMessage(verifyEmail.error)}
        />
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href={AUTH_ROUTES.login}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </FieldGroup>
    );
  }

  return null;
}
