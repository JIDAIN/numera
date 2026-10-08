import { describe, expect, it } from "vitest";
import {
  c2PresetLabel,
  c2TaskKindFromPreset,
  decodeC2Preset,
  encodeC2Preset,
} from "./contract";

describe("C2 preset contract", () => {
  it("round-trips every locked C2 launch shape", () => {
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
