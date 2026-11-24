import type { SessionUser } from "@/features/auth/types";

type NamedUser = Pick<SessionUser, "firstName" | "lastName">;

export function getDisplayName({ firstName, lastName }: NamedUser): string {
  return [firstName, lastName].filter(Boolean).join(" ");
}

export function getInitials({ firstName, lastName }: NamedUser): string {
  return [firstName, lastName]
    .map((part) => part?.trim().charAt(0) ?? "")
    .join("")
    .toUpperCase();
}
