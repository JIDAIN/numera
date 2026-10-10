import { describe, expect, it } from "vitest";
import {
  c2PresetLabel,
  c2TaskKindFromPreset,
  isC2ActiveSession,
  decodeC2ActivePreset,
  c2ActivePresetLabel,
  isC2AllowedGroupSize,
  isC2ActivePreset,
  decodeC2Preset,
  encodeC2Preset,
} from "./contract";

describe("C2 preset contract", () => {
  it("round-trips historical v1 shapes for frozen session read-back", () => {
    const presets = [
      { mode: "support", support: "r" } as const,
      { mode: "support", support: "nxr", variant: "ordinary" } as const,
      { mode: "support", support: "nxr", variant: "second_order" } as const,
      { mode: "support", support: "nxr", variant: "mixed" } as const,
      { mode: "method", route: "direct" } as const,
      { mode: "method", route: "split" } as const,
      { mode: "method", route: "scaling" } as const,
      { mode: "method_choice" } as const,
      { mode: "comprehensive" } as const,
    ];

    for (const preset of presets) {
      const encoded = encodeC2Preset(preset);
      expect(decodeC2Preset(preset.mode, encoded)).toEqual(preset);
      expect(c2PresetLabel(preset)).not.toBe("");
      expect(c2TaskKindFromPreset(preset)).not.toBe("");
    }
  });

  it("exposes only two N×r modes and no choice or mixed sessions to new launches", () => {
    const active = [
      { mode: "support", support: "r" } as const,
      { mode: "support", support: "nxr", variant: "ordinary" } as const,
      { mode: "support", support: "nxr", variant: "second_order" } as const,
      { mode: "method", route: "direct" } as const,
      { mode: "method", route: "split" } as const,
      { mode: "method", route: "scaling" } as const,
      { mode: "comprehensive" } as const,
    ];
    for (const preset of active) {
      expect(isC2ActivePreset(preset)).toBe(true);
      expect(isC2ActiveSession(preset, 10)).toBe(true);
      expect(isC2ActiveSession(preset, 20)).toBe(true);
      expect(isC2ActiveSession(preset, 8)).toBe(false);
    }
    for (const legacy of [
      { mode: "support", support: "nxr", variant: "mixed" } as const,
      { mode: "method_choice" } as const,
    ]) {
      expect(isC2ActivePreset(legacy)).toBe(false);
      expect(isC2ActiveSession(legacy, 10)).toBe(false);
      expect(isC2ActiveSession(legacy, 20)).toBe(false);
      const stored = encodeC2Preset(legacy);
      expect(decodeC2Preset(legacy.mode, stored)).toEqual(legacy);
    }
  });

  it("separates current launch labels and decoding from frozen v1 history", () => {
    const ordinary = {
      mode: "support",
      support: "nxr",
      variant: "ordinary",
    } as const;
    const second = {
      mode: "support",
      support: "nxr",
      variant: "second_order",
    } as const;
    expect(c2ActivePresetLabel(ordinary)).toBe("N×r · 一阶");
    expect(c2ActivePresetLabel(second)).toBe("N×r · 二阶");
    expect(c2PresetLabel(ordinary)).toBe("N×r · 普通修正");
    expect(c2PresetLabel(second)).toBe("N×r · 一阶+二阶");
    expect(decodeC2ActivePreset("support", encodeC2Preset(ordinary))).toEqual(
      ordinary,
    );
    expect(decodeC2ActivePreset("support", encodeC2Preset(second))).toEqual(
      second,
    );
    expect(
      decodeC2ActivePreset("support", "v1;support=nxr;variant=mixed"),
    ).toBeUndefined();
    expect(
      decodeC2ActivePreset("method_choice", "v1;mode=method_choice"),
    ).toBeUndefined();
    expect(decodeC2Preset("method_choice", "v1;mode=method_choice")).toEqual({
      mode: "method_choice",
    });
  });

  it("enforces 10/20 as the only valid new C2 group sizes", () => {
    expect([10, 20].every(isC2AllowedGroupSize)).toBe(true);
    for (const invalid of [-1, 0, 6, 8, 12, 19, 21, 10.5, Number.NaN]) {
      expect(isC2AllowedGroupSize(invalid)).toBe(false);
    }
  });

  it("rejects malformed or cross-mode presets instead of downgrading", () => {
    expect(decodeC2Preset("support", "support=r")).toBeUndefined();
    expect(
      decodeC2Preset("method", "v1;support=nxr;variant=ordinary"),
    ).toBeUndefined();
    expect(
      decodeC2Preset("support", "v1;support=nxr;variant=unknown"),
    ).toBeUndefined();
    expect(
      decodeC2Preset("comprehensive", "v1;mode=method_choice"),
    ).toBeUndefined();
    expect(
      decodeC2Preset("method", "v1;route=direct;route=split"),
    ).toBeUndefined();
  });
});
