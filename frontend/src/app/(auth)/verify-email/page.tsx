import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { VerifyEmailView } from "@/features/auth/components/verify-email-view";

export const metadata: Metadata = {
  title: "Verify email",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;

  return (
    <AuthCard
      title="Verify your email"
      description="Confirming your email address."
    >
      <VerifyEmailView token={token} />
    </AuthCard>
  );
}
