import type { C2Preset } from "./contract";

/**
 * Current C2 product launch policy. Historical v1 presets remain decodable for
 * frozen-session replay, but decoding must never grant a new launch.
 *
 * The existing v1 NxR code name "ordinary" represents the current 一阶
 * calculation. Keep its wire value until a versioned migration is tested.
 */
export const C2_ALLOWED_GROUP_SIZES = [10, 20] as const;

export function c2AllowsGroupSize(count: number): boolean {
  return Number.isInteger(count) && C2_ALLOWED_GROUP_SIZES.some((size) => size === count);
}

export function c2CanStartPreset(preset: C2Preset): boolean {
  if (preset.mode === "method_choice") return false;
  if (preset.mode === "support" && preset.support === "nxr") {
    return preset.variant === "ordinary" || preset.variant === "second_order";
  }
  return true;
}
