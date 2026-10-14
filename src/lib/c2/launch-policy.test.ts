import { describe, expect, it } from "vitest";
import { decodeC2Preset, encodeC2Preset } from "./contract";
import { c2AllowsGroupSize, c2CanStartPreset } from "./launch-policy";

describe("C2 new-launch restrictions versus legacy replay", () => {
  it("accepts exactly 10 or 20 questions", () => {
    expect([10, 20].every(c2AllowsGroupSize)).toBe(true);
    for (const count of [0, 6, 8, 12, 21, 10.5, NaN, Infinity]) {
      expect(c2AllowsGroupSize(count)).toBe(false);
    }
  });

  it("offers only first- and second-order N×r for new sessions", () => {
    expect(
      c2CanStartPreset({
        mode: "support",
        support: "nxr",
        variant: "ordinary", // historical v1 wire name for 一阶
      }),
    ).toBe(true);
    expect(
      c2CanStartPreset({
        mode: "support",
        support: "nxr",
        variant: "second_order",
      }),
    ).toBe(true);
    expect(
      c2CanStartPreset({
        mode: "support",
        support: "nxr",
        variant: "mixed",
      }),
    ).toBe(false);
    expect(c2CanStartPreset({ mode: "method_choice" })).toBe(false);
    expect(c2CanStartPreset({ mode: "comprehensive" })).toBe(true);
  });

  it("continues decoding retired v1 presets for historical use", () => {
    const legacyMixed = "v1;support=nxr;variant=mixed";
    const legacyChoice = "v1;mode=method_choice";
    const decodedMixed = decodeC2Preset("support", legacyMixed);
    const decodedChoice = decodeC2Preset("method_choice", legacyChoice);

    expect(decodedMixed).toEqual({
      mode: "support",
      support: "nxr",
      variant: "mixed",
    });
    expect(decodedChoice).toEqual({ mode: "method_choice" });
    expect(encodeC2Preset(decodedMixed!)).toBe(legacyMixed);
    expect(encodeC2Preset(decodedChoice!)).toBe(legacyChoice);
    expect(c2CanStartPreset(decodedMixed!)).toBe(false);
    expect(c2CanStartPreset(decodedChoice!)).toBe(false);
  });
});
