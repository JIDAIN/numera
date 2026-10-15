import { describe, expect, it } from "vitest";
import { c2ParseDecimal } from "./decimal";

describe("C2 signed decimal response grammar", () => {
  it("accepts finite ordinary integers and decimals including signs", () => {
    for (const [raw, value] of [
      ["16", 16],
      ["+16", 16],
      ["-16", -16],
      ["0", 0],
      ["-0", 0],
      ["0.125", 0.125],
      ["-0.125", -0.125],
      ["+.5", 0.5],
      ["5.", 5],
      ["  -12.50  ", -12.5],
      [16, 16],
    ] as const)
      expect(c2ParseDecimal(raw)).toBe(value);
  });

  it("rejects non-decimal literals, coercion, nonfinite and blank text", () => {
    for (const raw of [
      "0x10",
      "0X10",
      "0b10000",
      "0B10000",
      "0o20",
      "0O20",
      "2e2",
      "2E2",
      "1e309",
      "",
      "   ",
      ".",
      "+",
      "-",
      "Infinity",
      "NaN",
      "1,000",
      "25%",
      "1_000",
      "16abc",
      true,
      null,
      undefined,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])
      expect(c2ParseDecimal(raw)).toBeUndefined();
  });
});
