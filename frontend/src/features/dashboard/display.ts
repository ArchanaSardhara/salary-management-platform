export const COMPENSATION_TYPE_LABELS: Record<string, string> = {
  BASE_SALARY: "Base Salary",
  BONUS: "Bonus",
  COMMISSION: "Commission",
  EQUITY_GRANT: "Equity Grant",
  ALLOWANCE: "Allowance",
};

/** Format a Decimal string amount for display — chart tooltips and tables. */
export function formatAmount(amount: string | null, currency: string | null): string {
  if (!amount || !currency) return "—";
  const num = parseFloat(amount);
  if (Number.isNaN(num)) return amount;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

/** "2026-01" → "Jan" (short month for chart axis). */
export function formatShortMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "short" });
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
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#d97706", // amber-600
  "#dc2626", // red-600
  "#7c3aed", // violet-600
  "#0891b2", // cyan-600
  "#db2777", // pink-600
  "#65a30d", // lime-600
];
