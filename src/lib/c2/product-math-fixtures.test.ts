import { describe, expect, it } from "vitest";
import {
  c2PassesTarget,
  c2RoundToSignificantDigits,
  c2TruncateToSignificantDigits,
} from "./math";

describe("C2 product math fixtures (source vs controlled variants)", () => {
  it("does not use a 3% approximate answer as the exact two-digit Direct oracle", () => {
    const original = 867 / 371;
    const controlled = 890 / 371;

    expect(c2TruncateToSignificantDigits(original, 2)).toBe(2.3);
    expect(c2TruncateToSignificantDigits(controlled, 2)).toBe(2.3);
    expect(c2RoundToSignificantDigits(controlled, 2)).toBe(2.4);
    expect(c2PassesTarget(2.3, original)).toBe(true);
    expect(c2PassesTarget(2.3, controlled)).toBe(false);

    // A visible multiply-back boundary for the controlled expression.
    expect(890 - 2 * 371).toBe(148);
    expect(2.4 * 371).toBeGreaterThan(890);
    expect(2.3 * 371).toBeLessThan(890);
  });

  it("checks Split first-sufficient stage against the original quotient", () => {
    expect(c2PassesTarget(0.5, 157 / 354)).toBe(false);
    expect(c2PassesTarget(0.45, 157 / 354)).toBe(true);
    expect(c2PassesTarget(0.5, 423 / 866)).toBe(true);

    expect(c2PassesTarget(0.7, 492 / 689)).toBe(true);
    expect(c2PassesTarget(0.7, 500 / 689)).toBe(false);
    expect(c2PassesTarget(0.72, 500 / 689)).toBe(true);
  });

  it("checks Scaling zero-order stop and independent numerator correction", () => {
    const q0 = 645 / 125;
    expect(q0).toBe(5.16);
    expect(c2PassesTarget(q0, 645 / 122)).toBe(true);
    expect(c2PassesTarget(q0, 645 / 119)).toBe(false);

    const delta = 125 - 119;
    const userRoughQuotient = 5;
    const adjustedNumerator = 645 + userRoughQuotient * delta;
    expect(adjustedNumerator).toBe(675);
    expect(c2PassesTarget(adjustedNumerator / 125, 645 / 119)).toBe(true);

    expect(c2PassesTarget(7, 6279 / 853)).toBe(false);
    expect(c2PassesTarget(7.4, 6279 / 853)).toBe(true);
  });

  it("preserves the strict 0.1 percentage-point r display conflict", () => {
    const strictPercentage = (100 * (167 - 125)) / 167;
    const nominalPercentage = (42 * 6) / 10;
    expect(Math.round(strictPercentage * 10) / 10).toBe(25.1);
    expect(Math.round(nominalPercentage * 10) / 10).toBe(25.2);
  });

  it("uses the submitted first-order N×r value for second-order reference", () => {
    const r = 0.042;
    const userC1 = 36;
    const exactC1 = 856 * r;
    const processC2 = Math.abs(userC1) * r;
    expect(processC2).toBeCloseTo(1.512, 12);
    expect(processC2).not.toBeCloseTo(Math.abs(exactC1) * r, 4);
  });
});
