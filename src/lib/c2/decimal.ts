/**
 * C2 current answer syntax: ordinary finite signed decimal, never Number()
 * coercion of hexadecimal / binary / octal / exponent / Infinity / blank.
 * Numeric frozen legacy response values remain accepted by the grader.
 */
const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

export function c2ParseDecimal(value: unknown): number | undefined {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!DECIMAL_PATTERN.test(normalized)) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}
