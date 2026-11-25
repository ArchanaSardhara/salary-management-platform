export const COMPENSATION_TYPE_LABELS: Record<string, string> = {
  BASE_SALARY: "Base Salary",
  BONUS: "Bonus",
  COMMISSION: "Commission",
  EQUITY_GRANT: "Equity Grant",
  ALLOWANCE: "Allowance",
};

/** Format a Decimal string amount for display — chart tooltips and tables. */
export function formatAmount(
  amount: string | null,
  currency: string | null,
): string {
  if (!amount || !currency) return "—";
  const num = parseFloat(amount);
  if (Number.isNaN(num)) return amount;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  })
    .formatToParts(num)
    .map((part) => (part.type === "currency" ? `${part.value} ` : part.value))
    .join("")
    .trim();
}

/** "2026-01" → "Jan" (short month for chart axis). */
export function formatShortMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-GB", {
    month: "short",
  });
}

/**
 * Formats a period string for the headcount chart X-axis based on granularity.
 * - monthly "2026-01" → "Jan"
 * - weekly/daily "2026-01-15" → "15 Jan"
 */
export function formatPeriodLabel(period: string, granularity: string): string {
  if (granularity === "monthly") {
    return formatShortMonth(period);
  }
  const date = new Date(`${period.slice(0, 10)}T00:00:00Z`);
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Returns ISO date string "YYYY-MM-DD" for a date N days before today. */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split("T")[0];
}

/** Returns today as "YYYY-MM-DD". */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Common currencies offered in the payroll currency selector. */
export const PAYROLL_CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
];

/** Categorical chart palette — fixed order, colorblind-safe. */
export const CHART_COLORS = [
  "#a7bcea",
  "#b698ea",
  "#ace6c2",
  "#d3d9cc",
  "#edb093",
];
