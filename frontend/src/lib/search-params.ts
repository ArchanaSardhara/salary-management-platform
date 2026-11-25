/** Helpers for reading and writing typed values in URL search parameters. */

/** A scalar, or a list written as repeated keys (`?a=1&a=2`). */
export type SearchParamValue = string | number | readonly string[] | null | undefined;

/** Reads a trimmed string; empty becomes "". */
export function readString(params: URLSearchParams, key: string): string {
  return params.get(key)?.trim() ?? "";
}

/**
 * Reads every value of a repeated key, trimmed, without blanks or duplicates.
 * With `allowed`, values outside it are dropped.
 */
export function readList(
  params: URLSearchParams,
  key: string,
  options: { normalise?: (value: string) => string; allowed?: readonly string[] } = {},
): string[] {
  const { normalise = (value: string) => value, allowed } = options;
  const values = params
    .getAll(key)
    .map((value) => normalise(value.trim()))
    .filter((value) => value !== "" && (!allowed || allowed.includes(value)));
  return [...new Set(values)];
}

function isEmpty(value: SearchParamValue): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function sameValue(a: SearchParamValue, b: SearchParamValue): boolean {
  const toKey = (value: SearchParamValue) =>
    Array.isArray(value) ? [...value].sort().join("\u0000") : String(value ?? "");
  return toKey(a) === toKey(b);
}

/**
 * Returns a copy of `params` with `updates` applied. Empty values (including
 * empty lists) remove the key, as do values equal to `defaults[key]`, so URLs
 * stay short and canonical. Lists are written as repeated keys.
 */
export function mergeSearchParams(
  params: URLSearchParams,
  updates: Record<string, SearchParamValue>,
  defaults: Record<string, SearchParamValue> = {},
): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(updates)) {
    next.delete(key);
    if (isEmpty(value) || (key in defaults && sameValue(value, defaults[key]))) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) next.append(key, item);
    } else {
      next.set(key, String(value));
    }
  }
  return next;
}

/** Builds a query string ("?a=1&b=x&b=y" or "") from non-empty values. */
export function toQueryString(values: Record<string, SearchParamValue>): string {
  const query = mergeSearchParams(new URLSearchParams(), values).toString();
  return query ? `?${query}` : "";
}
