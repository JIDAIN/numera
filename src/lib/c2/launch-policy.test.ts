import { describe, expect, it } from "vitest";
import { decodeC2Preset, encodeC2Preset, type C2Preset } from "./contract";
import { c2CanLaunch, c2RequiredQuestionCount } from "./launch-policy";

const signed: { preset: C2Preset; count: number }[] = [
  { preset: { mode: "method", route: "direct" }, count: 10 },
  { preset: { mode: "method", route: "split" }, count: 10 },
  { preset: { mode: "method", route: "scaling" }, count: 10 },
  { preset: { mode: "support", support: "r" }, count: 20 },
  { preset: { mode: "support", support: "nxr", variant: "ordinary" }, count: 20 },
  { preset: { mode: "support", support: "nxr", variant: "second_order" }, count: 10 },
  { preset: { mode: "comprehensive" }, count: 10 },
];

describe("C2 R2 new-session gate", () => {
  it("enforces the approved exact group length per mode", () => {
    for (const { preset, count } of signed) {
      expect(c2RequiredQuestionCount(preset)).toBe(count);
      expect(c2CanLaunch(preset, count)).toBe(true);
      for (const other of [0, 6, 8, 10, 12, 20, 21, 10.5]) {
        if (other === count) continue;
        expect(c2CanLaunch(preset, other)).toBe(false);
      }
    }
  });

  it("decodes old v1 mixed and method-choice but never creates them", () => {
    const retired: C2Preset[] = [
      { mode: "method_choice" },
      { mode: "support", support: "nxr", variant: "mixed" },
    ];
    for (const preset of retired) {
      expect(decodeC2Preset(preset.mode, encodeC2Preset(preset))).toEqual(preset);
      expect(c2RequiredQuestionCount(preset)).toBeUndefined();
      expect(c2CanLaunch(preset, 10)).toBe(false);
      expect(c2CanLaunch(preset, 20)).toBe(false);
    }
  });
});
