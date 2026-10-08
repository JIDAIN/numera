import { C2_TARGET_PRECISION } from "./contract";

export function c2RelativeError(actual: number, expected: number) {
  if (!Number.isFinite(actual) || !Number.isFinite(expected))
    return Number.POSITIVE_INFINITY;
  if (expected === 0) return actual === 0 ? 0 : Number.POSITIVE_INFINITY;
  return Math.abs(actual - expected) / Math.abs(expected);
}

export function c2SignedRelativeError(actual: number, expected: number) {
  if (!Number.isFinite(actual) || !Number.isFinite(expected) || expected === 0)
    return Number.NaN;
  return actual / expected - 1;
}

export function c2PassesTarget(
  actual: number,
  expected: number,
  tolerance = C2_TARGET_PRECISION,
) {
  return c2RelativeError(actual, expected) <= tolerance + 1e-12;
}

export function c2Round(value: number, digits = 8) {
  return Number(value.toFixed(digits));
}

export function c2FormatNumber(value: number, digits = 6) {
  const rounded = c2Round(value, digits);
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(digits).replace(/0+$/, "").replace(/.$/, "");
}

export function c2SignificantUnit(value: number) {
  const absolute = Math.abs(value);
  if (!Number.isFinite(absolute) || absolute === 0) return 1;
  return 10 ** Math.floor(Math.log10(absolute));
}

export function c2RoundToSignificantDigits(value: number, digits: number) {
  if (!Number.isFinite(value) || value === 0) return value;
  const unit = c2SignificantUnit(value);
  const step = unit / 10 ** (digits - 1);
  return c2Round(Math.round(value / step) * step);
}

export function c2TruncateToSignificantDigits(value: number, digits: number) {
  if (!Number.isFinite(value) || value === 0) return value;
  const unit = c2SignificantUnit(value);
  const step = unit / 10 ** (digits - 1);
  return c2Round(Math.trunc(value / step) * step);
}

export type C2CoreCompressionFacts = {
  rawA: number;
  rawB: number;
  coreA: number;
  coreB: number;
  rawQuotient: number;
  coreQuotient: number;
  signedCoreError: number;
  coreError: number;
};

export function evaluateC2CoreCompression(
  rawA: number,
  rawB: number,
  coreA: number,
  coreB: number,
): C2CoreCompressionFacts | undefined {
  if (
    ![rawA, rawB, coreA, coreB].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    return undefined;

  const rawQuotient = rawA / rawB;
  const coreQuotient = coreA / coreB;
  const signedCoreError = c2SignedRelativeError(coreQuotient, rawQuotient);

  return {
    rawA,
    rawB,
    coreA,
    coreB,
    rawQuotient,
    coreQuotient,
    signedCoreError,
    coreError: Math.abs(signedCoreError),
  };
}

function normalizedDigits(value: number) {
  if (!Number.isFinite(value) || value === 0) return { digits: "0", scale: 0 };
  const absolute = Math.abs(value);
  const exponent = Math.floor(Math.log10(absolute));
  const normalized = absolute / 10 ** exponent;
  const text = normalized.toFixed(5).replace(/0+$/, "").replace(/.$/, "");
  const digits = text.replace(".", "");
  return { digits, scale: exponent };
}

/**
 * Engineering-only mental-cost calibration. It is deliberately not a frontend
 * difficulty label and may be recalibrated later from real training data.
 */
export function c2NumberMentalCost(value: number) {
  if (!Number.isFinite(value)) return Number.POSITIVE_INFINITY;
  const { digits, scale } = normalizedDigits(value);
  const weight: Record<string, number> = {
    "0": 0,
    "1": 0.15,
    "2": 0.35,
    "3": 0.75,
    "4": 0.65,
    "5": 0.3,
    "6": 0.8,
    "7": 0.95,
    "8": 0.75,
    "9": 0.85,
  };
  const digitCost = [...digits].reduce(
    (sum, digit) => sum + (weight[digit] ?? 1),
    0,
  );
  const repeatBonus = new Set(digits).size === 1 ? 0.35 : 0;
  const fiveBonus = digits.endsWith("5") ? 0.15 : 0;

  return Math.max(
    0.2,
    digitCost +
      0.18 * digits.length +
      0.04 * Math.abs(scale) -
      repeatBonus -
      fiveBonus,
  );
}

export type C2LocalCostBand = "easy" | "normal" | "hard";

export function c2LocalCostBand(value: number): C2LocalCostBand {
  const cost = c2NumberMentalCost(value);
  if (cost <= 1.65) return "easy";
  if (cost <= 2.65) return "normal";
  return "hard";
}
