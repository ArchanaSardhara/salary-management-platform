const LOCALE = "en-GB";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

const regionNames = new Intl.DisplayNames([LOCALE], { type: "region" });

/**
 * Formats a calendar date ("YYYY-MM-DD", as returned by the API) without
 * shifting it by the viewer's time zone: "2026-01-15" → "15 Jan 2026".
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

/** Formats an ISO timestamp in the viewer's time zone. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** ISO 3166-1 alpha-2 code → English country name ("IN" → "India"). */
export function getCountryName(code: string): string {
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Joins first and last name, skipping a missing last name. */
export function getFullName({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string | null;
}): string {
  return [firstName, lastName].filter(Boolean).join(" ");
}

/** Uppercase initials from first and last name ("Ada Lovelace" → "AL"). */
export function getInitials({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string | null;
}): string {
  return [firstName, lastName]
    .map((part) => part?.trim().charAt(0) ?? "")
    .join("")
    .toUpperCase();
}
