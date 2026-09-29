import { CTrainingMode } from "../types";

export const C2_GENERATION_VERSION = "c2-v1";
export const C2_TARGET_PRECISION = 0.03;
export const C2_SUPPORT_NXR_TOLERANCE = 0.05;
export const C2_SUPPORT_R_DECIMALS = 1;

export const C2_SUPPORT_R_GRADER_ID = "c2-support-r-v1";
export const C2_SUPPORT_NXR_GRADER_ID = "c2-support-nxr-v1";
export const C2_METHOD_CHOICE_GRADER_ID = "c2-method-choice-v1";
export const C2_COMPREHENSIVE_GRADING_VERSION =
  "c2-comprehensive-relative-error-v1";

export type C2RouteKind = "direct" | "split" | "scaling";
export type C2RouteLevel = "low" | "medium" | "high";
export type C2TaskKind =
  | "support_r"
  | "support_nxr"
  | "method_direct"
  | "method_split"
  | "method_scaling"
  | "method_choice"
  | "comprehensive";

export type C2NxrVariant = "ordinary" | "second_order" | "mixed";

export type C2Preset =
  | { mode: "support"; support: "r" }
  | { mode: "support"; support: "nxr"; variant: C2NxrVariant }
  | { mode: "method"; route: C2RouteKind }
  | { mode: "method_choice" }
  | { mode: "comprehensive" };

const VERSION = "v1";

export function encodeC2Preset(preset: C2Preset): string {
  if (preset.mode === "support" && preset.support === "r")
    return `${VERSION};support=r`;

  if (preset.mode === "support")
    return `${VERSION};support=nxr;variant=${preset.variant}`;

  if (preset.mode === "method")
    return `${VERSION};route=${preset.route}`;

  return `${VERSION};mode=${preset.mode}`;
}

export function decodeC2Preset(
  mode: CTrainingMode,
  encoded?: string,
): C2Preset | undefined {
  if (!encoded) return undefined;
  const parts = encoded.split(";").filter(Boolean);
  if (parts.shift() !== VERSION) return undefined;

  const values = new Map<string, string>();
  for (const part of parts) {
    const [key, value, extra] = part.split("=");
    if (!key || !value || extra !== undefined || values.has(key))
      return undefined;
    values.set(key, value);
  }

  if (mode === "support") {
    if (values.get("support") === "r" && values.size === 1)
      return { mode: "support", support: "r" };

    if (
      values.get("support") === "nxr" &&
      values.size === 2 &&
      ["ordinary", "second_order", "mixed"].includes(
        values.get("variant") ?? "",
      )
    )
      return {
        mode: "support",
        support: "nxr",
        variant: values.get("variant") as C2NxrVariant,
      };
    return undefined;
  }

  if (mode === "method") {
    const route = values.get("route");
    if (
      values.size === 1 &&
      (route === "direct" || route === "split" || route === "scaling")
    )
      return { mode: "method", route };
    return undefined;
  }

  if (
    (mode === "method_choice" || mode === "comprehensive") &&
    values.size === 1 &&
    values.get("mode") === mode
  )
    return { mode };

  return undefined;
}

export function c2TaskKindFromPreset(preset: C2Preset): C2TaskKind {
  if (preset.mode === "support")
    return preset.support === "r" ? "support_r" : "support_nxr";
  if (preset.mode === "method") return `method_${preset.route}`;
  return preset.mode;
}

export function c2PresetLabel(preset: C2Preset) {
  if (preset.mode === "support" && preset.support === "r") return "求 r";
  if (preset.mode === "support") {
    if (preset.variant === "ordinary") return "N×r · 普通修正";
    if (preset.variant === "second_order") return "N×r · 一阶+二阶";
    return "N×r · 混合";
  }
  if (preset.mode === "method") {
    if (preset.route === "direct") return "直除";
    if (preset.route === "split") return "拆分法";
    return "补偿放缩";
  }
  if (preset.mode === "method_choice") return "方法选择";
  return "综合训练";
}
