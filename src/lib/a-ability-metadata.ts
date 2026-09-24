import { MasteryProfile, StructuredInputKind } from "./types";

export type CanonicalAAbilityMetadata = {
  displayName: string;
  group: string;
  masteryProfile: MasteryProfile;
  inputKind: StructuredInputKind;
};

export const canonicalAAbilityMetadata = Object.freeze({
  "A-ADD-01": {
    displayName: "2～3位加法",
    group: "加减与差值",
    masteryProfile: "C",
    inputKind: "number",
  },
  "A-SUB-01": {
    displayName: "2～3位减法",
    group: "加减与差值",
    masteryProfile: "C",
    inputKind: "number",
  },
  "A-COM-01": {
    displayName: "近邻小差值",
    group: "加减与差值",
    masteryProfile: "R",
    inputKind: "choice",
  },
  "A-MUL-01": {
    displayName: "正向乘法口诀",
    group: "乘法基础",
    masteryProfile: "R",
    inputKind: "choice",
  },
  "A-MUL-02": {
    displayName: "逆向乘法口诀",
    group: "乘法基础",
    masteryProfile: "R",
    inputKind: "choice",
  },
  "A-MUL-03": {
    displayName: "两位数×一位数",
    group: "乘法基础",
    masteryProfile: "C",
    inputKind: "number",
  },
  "A-MUL-04": {
    displayName: "两位数×两位数",
    group: "乘法基础",
    masteryProfile: "C",
    inputKind: "number",
  },
  "A-MUL-05": {
    displayName: "百分数×百分数",
    group: "乘法基础",
    masteryProfile: "C",
    inputKind: "number",
  },
  "A-FRA-01": {
    displayName: "高频分数 ↔ 百分数",
    group: "分百固定反应",
    masteryProfile: "R",
    inputKind: "choice",
  },
  "A-PCT-01": {
    displayName: "基础百分比取值",
    group: "百分比取值",
    masteryProfile: "C",
    inputKind: "number",
  },
} as const);

export type CanonicalAAbilityMetadataId =
  keyof typeof canonicalAAbilityMetadata;

export function getCanonicalAAbilityMetadata(
  abilityId: string,
): CanonicalAAbilityMetadata | undefined {
  return canonicalAAbilityMetadata[abilityId as CanonicalAAbilityMetadataId] as
    CanonicalAAbilityMetadata | undefined;
}
