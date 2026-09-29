import {
  c2LocalCostBand,
  c2PassesTarget,
  c2RelativeError,
  c2Round,
  c2RoundToSignificantDigits,
  c2SignificantUnit,
  c2TruncateToSignificantDigits,
  type C2LocalCostBand,
} from "./math";
import { C2RouteLevel, C2_TARGET_PRECISION } from "./contract";

export type C2DirectEvaluation = {
  route: "direct";
  feasible: boolean;
  level: C2RouteLevel;
  stopStage: "first" | "second" | "third" | "beyond";
  finalEstimate: number;
  relativeError: number;
  firstEstimate: number;
  firstProduct: number;
  remainder: number;
  secondEstimate: number;
  thirdEstimate: number;
  firstProductCost: C2LocalCostBand;
  remainderCost: C2LocalCostBand;
  boundaryMargin: number;
  boundaryCost: C2LocalCostBand;
  boundaryRelevant: boolean;
  hardCount: number;
  normalCount: number;
};

function secondDigitBoundary(
  a: number,
  b: number,
  firstEstimate: number,
  quotient: number,
) {
  const unit = c2SignificantUnit(quotient);
  const secondUnit = unit / 10;
  const remainder = a - firstEstimate * b;
  const x = remainder / (b * secondUnit);
  const nearestHalf = Math.round(x - 0.5) + 0.5;
  const margin = Math.abs(x - nearestHalf);

  const lowerDigit = Math.floor(x);
  const upperDigit = Math.ceil(x);
  const lower = firstEstimate + lowerDigit * secondUnit;
  const upper = firstEstimate + upperDigit * secondUnit;
  const bothAcceptable =
    c2PassesTarget(lower, quotient) && c2PassesTarget(upper, quotient);

  const cost: C2LocalCostBand =
    margin >= 0.2 ? "easy" : margin >= 0.08 ? "normal" : "hard";

  return {
    margin,
    cost,
    relevant: !bothAcceptable,
  };
}

export function evaluateC2Direct(
  a: number,
  b: number,
): C2DirectEvaluation | undefined {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0)
    return undefined;

  const quotient = a / b;
  const firstEstimate = c2TruncateToSignificantDigits(quotient, 1);
  const secondEstimate = c2RoundToSignificantDigits(quotient, 2);
  const thirdEstimate = c2RoundToSignificantDigits(quotient, 3);
  const firstProduct = c2Round(firstEstimate * b);
  const remainder = c2Round(a - firstProduct);

  const firstError = c2RelativeError(firstEstimate, quotient);
  const secondError = c2RelativeError(secondEstimate, quotient);
  const thirdError = c2RelativeError(thirdEstimate, quotient);

  const stopStage: C2DirectEvaluation["stopStage"] =
    firstError <= C2_TARGET_PRECISION
      ? "first"
      : secondError <= C2_TARGET_PRECISION
        ? "second"
        : thirdError <= C2_TARGET_PRECISION
          ? "third"
          : "beyond";

  const finalEstimate =
    stopStage === "first"
      ? firstEstimate
      : stopStage === "second"
        ? secondEstimate
        : thirdEstimate;
  const relativeError =
    stopStage === "first"
      ? firstError
      : stopStage === "second"
        ? secondError
        : thirdError;

  const firstProductCost = c2LocalCostBand(firstProduct);
  const remainderCost = c2LocalCostBand(Math.abs(remainder));
  const boundary = secondDigitBoundary(a, b, firstEstimate, quotient);

  const bands = [
    firstProductCost,
    remainderCost,
    boundary.relevant ? boundary.cost : "easy",
  ];
  const hardCount = bands.filter((band) => band === "hard").length;
  const normalCount = bands.filter((band) => band === "normal").length;

  let level: C2RouteLevel;
  if (stopStage === "first") {
    level = "low";
  } else if (stopStage === "second") {
    level = hardCount === 0 && normalCount <= 1 ? "low" : "medium";
  } else if (stopStage === "third") {
    level = hardCount > 0 ? "high" : "medium";
  } else {
    level = "high";
  }

  return {
    route: "direct",
    feasible: stopStage !== "beyond",
    level,
    stopStage,
    finalEstimate,
    relativeError,
    firstEstimate,
    firstProduct,
    remainder,
    secondEstimate,
    thirdEstimate,
    firstProductCost,
    remainderCost,
    boundaryMargin: boundary.margin,
    boundaryCost: boundary.cost,
    boundaryRelevant: boundary.relevant,
    hardCount,
    normalCount,
  };
}
