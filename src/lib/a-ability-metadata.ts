import { MasteryProfile, StructuredInputKind } from "./types";

export type CanonicalAAbilityMetadata = {
  displayName: string;
  group: string;
  masteryProfile: MasteryProfile;
  inputKind: StructuredInputKind;
  homeSymbol: string;
  homeLabel: string;
  homeDetail: string;
};

export const canonicalAAbilityMetadata = Object.freeze({
  "A-ADD-01": {
    displayName: "2～3位加法",
    group: "加减与差值",
    masteryProfile: "C",
    inputKind: "number",
    homeSymbol: "＋",
    homeLabel: "加法",
    homeDetail: "2～3位",
  },
  "A-SUB-01": {
    displayName: "2～3位减法",
    group: "加减与差值",
    masteryProfile: "C",
    inputKind: "number",
    homeSymbol: "−",
    homeLabel: "减法",
    homeDetail: "2～3位",
  },
  "A-COM-01": {
    displayName: "近邻小差值",
    group: "加减与差值",
    masteryProfile: "R",
    inputKind: "choice",
    homeSymbol: "↔",
    homeLabel: "小差值",
    homeDetail: "近邻反应",
  },
  "A-MUL-01": {
    displayName: "正向乘法口诀",
    group: "乘法基础",
    masteryProfile: "R",
    inputKind: "choice",
    homeSymbol: "×",
    homeLabel: "正向口诀",
    homeDetail: "乘法口诀",
  },
  "A-MUL-02": {
    displayName: "逆向乘法口诀",
    group: "乘法基础",
    masteryProfile: "R",
    inputKind: "choice",
    homeSymbol: "□",
    homeLabel: "逆向口诀",
    homeDetail: "倒推因子",
  },
  "A-MUL-03": {
    displayName: "两位数×一位数",
    group: "乘法基础",
    masteryProfile: "C",
    inputKind: "number",
    homeSymbol: "×1",
    homeLabel: "两位×一位",
    homeDetail: "快速计算",
  },
  "A-MUL-04": {
    displayName: "两位数×两位数",
    group: "乘法基础",
    masteryProfile: "C",
    inputKind: "number",
    homeSymbol: "×2",
    homeLabel: "两位×两位",
    homeDetail: "普通乘法",
  },
  "A-MUL-05": {
    displayName: "百分数×百分数",
    group: "乘法基础",
    masteryProfile: "C",
    inputKind: "number",
    homeSymbol: "%×%",
    homeLabel: "百分数×百分数",
    homeDetail: "数量级计算",
  },
  "A-FRA-01": {
    displayName: "高频分数 ↔ 百分数",
    group: "分百固定反应",
    masteryProfile: "R",
    inputKind: "choice",
    homeSymbol: "%",
    homeLabel: "分百反应",
    homeDetail: "分数 ↔ 百分数",
  },
  "A-PCT-01": {
    displayName: "基础百分比取值",
    group: "百分比取值",
    masteryProfile: "C",
    inputKind: "number",
    homeSymbol: "25%",
    homeLabel: "百分比取值",
    homeDetail: "常用百分比",
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
