import { describe, expect, it } from "vitest";
import { c2FormatNumber } from "./math";

describe("C2 decimal presentation regression", () => {
  it("does not drop the last non-zero digit of a generated answer or prompt", () => {
    expect(c2FormatNumber(7.3, 1)).toBe("7.3");
    expect(c2FormatNumber(3.14, 2)).toBe("3.14");
    expect(c2FormatNumber(0.5, 1)).toBe("0.5");
    expect(c2FormatNumber(19.125, 3)).toBe("19.125");
  });

  it("trims only trailing zeros and a trailing dot", () => {
    expect(c2FormatNumber(7.0, 1)).toBe("7");
    expect(c2FormatNumber(7.2, 3)).toBe("7.2");
    expect(c2FormatNumber(100, 2)).toBe("100");
    expect(c2FormatNumber(0.04, 4)).toBe("0.04");
  });
});
