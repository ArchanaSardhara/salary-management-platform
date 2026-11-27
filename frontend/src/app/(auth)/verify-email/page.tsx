import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/features/auth/components/auth-card";
import { VerifyEmailView } from "@/features/auth/components/verify-email-view";

export const metadata: Metadata = {
  title: "Verify email",
};

async function VerifyEmailContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return <VerifyEmailView token={token} />;
}

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <AuthCard
      title="Verify your email"
      description="Confirming your email address."
    >
      <Suspense fallback={<p>Loading verification...</p>}>
        <VerifyEmailContent searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
