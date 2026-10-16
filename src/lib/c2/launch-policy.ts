import type { C2Preset } from "./contract";

/**
 * This gate applies to NEW C2 sessions only. Historical v1 presets (including
 * mixed and method_choice) remain decodable for frozen-record compatibility.
 */
export const C2_R2_GROUP_SIZE = {
  direct: 10,
  split: 10,
  scaling: 10,
  r: 20,
  nxr_first: 20,
  nxr_second: 10,
  comprehensive: 10,
} as const;

export function c2RequiredQuestionCount(preset: C2Preset): number | undefined {
  if (preset.mode === "method_choice") return undefined;
  if (preset.mode === "comprehensive") return C2_R2_GROUP_SIZE.comprehensive;
  if (preset.mode === "method") return C2_R2_GROUP_SIZE[preset.route];
  if (preset.support === "r") return C2_R2_GROUP_SIZE.r;
  if (preset.variant === "ordinary") return C2_R2_GROUP_SIZE.nxr_first;
  if (preset.variant === "second_order") return C2_R2_GROUP_SIZE.nxr_second;
  return undefined;
}

export function c2CanLaunch(preset: C2Preset, count: number): boolean {
  return Number.isInteger(count) && c2RequiredQuestionCount(preset) === count;
}
