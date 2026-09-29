import { C2RouteLevel, C2_TARGET_PRECISION } from "./contract";
import {
  c2LocalCostBand,
  c2NumberMentalCost,
  c2RelativeError,
  c2Round,
  type C2LocalCostBand,
} from "./math";

export type C2ScalingBranch = "repair_result" | "repair_numerator";
export type C2BaselineVisibility = "easy" | "normal" | "hard";
export type C2BaselineSource = "round" | "special" | "relation";

export type C2ScalingCandidate = {
  route: "scaling";
  feasible: boolean;
  level: C2RouteLevel;
  branch: C2ScalingBranch;
  baseline: number;
  baselineSource: C2BaselineSource;
  baselineVisibility: C2BaselineVisibility;
  delta: number;
  r: number;
  rPercent: number;
  stopStage: 0 | 1 | 2 | "beyond";
  q0: number;
  correction1?: number;
  intermediateNumerator1?: number;
  q1?: number;
  correction2?: number;
  intermediateNumerator2?: number;
  q2?: number;
  finalEstimate: number;
  relativeError: number;
  hardCount: number;
  normalCount: number;
  totalCost: number;
};

export type C2ScalingEvaluation = C2ScalingCandidate & {
  alternatives: C2ScalingCandidate[];
};

const SPECIAL_BASELINES = [111, 125, 143, 167, 250, 333] as const;
const RELATION_QUOTIENTS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5] as const;

function visibilityPenalty(visibility: C2BaselineVisibility) {
  if (visibility === "easy") return 0;
  if (visibility === "normal") return 1;
  return 2.6;
}

function bandPenalty(band: C2LocalCostBand) {
  if (band === "easy") return 0;
  if (band === "normal") return 0.7;
  return 1.6;
}

function baselineCandidates(a: number, b: number) {
  const values = new Map<
    string,
    {
      baseline: number;
      source: C2BaselineSource;
      visibility: C2BaselineVisibility;
    }
  >();

  const add = (
    baseline: number,
    source: C2BaselineSource,
    visibility: C2BaselineVisibility,
  ) => {
    if (!Number.isFinite(baseline) || baseline <= 0) return;
    const deviation = Math.abs(baseline - b) / baseline;
    if (deviation > 0.35) return;
    const rounded = c2Round(baseline, 6);
    const key = rounded.toFixed(6);
    const previous = values.get(key);
    if (
      !previous ||
      visibilityPenalty(visibility) < visibilityPenalty(previous.visibility)
    )
      values.set(key, { baseline: rounded, source, visibility });
  };

  for (const step of [10, 100, 1000]) {
    const center = Math.round(b / step);
    for (const offset of [-1, 0, 1]) {
      const candidate = (center + offset) * step;
      if (candidate > 0) add(candidate, "round", "easy");
    }
  }

  for (const special of SPECIAL_BASELINES) {
    add(special, "special", "easy");
  }

  for (const quotient of RELATION_QUOTIENTS) {
    const raw = a / quotient;
    const nearestInteger = Math.round(raw);
    const baseline =
      Math.abs(raw - nearestInteger) <= 0.08 ? nearestInteger : c2Round(raw, 1);
    const simpleRelation = Number.isInteger(quotient);
    const visibility: C2BaselineVisibility =
      simpleRelation && c2NumberMentalCost(baseline) <= 2.2
        ? "easy"
        : c2NumberMentalCost(baseline) <= 3
          ? "normal"
          : "hard";
    add(baseline, "relation", visibility);
  }

  return [...values.values()];
}

function classifyCandidate(input: {
  stage: C2ScalingCandidate["stopStage"];
  visibility: C2BaselineVisibility;
  bands: C2LocalCostBand[];
}): {
  level: C2RouteLevel;
  hardCount: number;
  normalCount: number;
} {
  const hardCount = input.bands.filter((band) => band === "hard").length;
  const normalCount = input.bands.filter((band) => band === "normal").length;

  if (input.stage === "beyond")
    return { level: "high", hardCount, normalCount };

  if (input.visibility === "hard")
    return { level: "high", hardCount, normalCount };

  if (input.stage === 0)
    return {
      level: hardCount === 0 && normalCount <= 1 ? "low" : "medium",
      hardCount,
      normalCount,
    };

  if (input.stage === 1) {
    if (input.visibility === "easy" && hardCount === 0 && normalCount <= 1)
      return { level: "low", hardCount, normalCount };
    return {
      level: hardCount >= 2 ? "high" : "medium",
      hardCount,
      normalCount,
    };
  }

  return {
    level: hardCount === 0 && normalCount <= 2 ? "medium" : "high",
    hardCount,
    normalCount,
  };
}

function evaluateBranch(
  a: number,
  b: number,
  baseline: number,
  source: C2BaselineSource,
  visibility: C2BaselineVisibility,
  branch: C2ScalingBranch,
): C2ScalingCandidate {
  const exact = a / b;
  const delta = baseline - b;
  const signedRatio = delta / baseline;
  const r = Math.abs(signedRatio);
  const rPercent = r * 100;
  const q0 = a / baseline;
  const q0Error = c2RelativeError(q0, exact);

  let correction1: number | undefined;
  let intermediateNumerator1: number | undefined;
  let q1: number | undefined;
  let correction2: number | undefined;
  let intermediateNumerator2: number | undefined;
  let q2: number | undefined;

  if (branch === "repair_result") {
    correction1 = signedRatio * q0;
    q1 = q0 + correction1;
    correction2 = q0 * r * r;
    q2 = q1 + correction2;
  } else {
    correction1 = signedRatio * a;
    intermediateNumerator1 = a + correction1;
    q1 = intermediateNumerator1 / baseline;
    correction2 = a * r * r;
    intermediateNumerator2 = intermediateNumerator1 + correction2;
    q2 = intermediateNumerator2 / baseline;
  }

  const q1Error = c2RelativeError(q1, exact);
  const q2Error = c2RelativeError(q2, exact);
  const stopStage: C2ScalingCandidate["stopStage"] =
    q0Error <= C2_TARGET_PRECISION
      ? 0
      : q1Error <= C2_TARGET_PRECISION
        ? 1
        : q2Error <= C2_TARGET_PRECISION
          ? 2
          : "beyond";

  const finalEstimate = stopStage === 0 ? q0 : stopStage === 1 ? q1 : q2;
  const relativeError =
    stopStage === 0 ? q0Error : stopStage === 1 ? q1Error : q2Error;

  const bands: C2LocalCostBand[] = [
    c2LocalCostBand(rPercent),
    c2LocalCostBand(q0),
  ];
  if (stopStage !== 0) {
    bands.push(c2LocalCostBand(Math.abs(correction1)));
    if (branch === "repair_numerator")
      bands.push(c2LocalCostBand(Math.abs(intermediateNumerator1 ?? 0)));
  }
  if (stopStage === 2 || stopStage === "beyond") {
    bands.push(c2LocalCostBand(Math.abs(correction2)));
  }

  const classification = classifyCandidate({
    stage: stopStage,
    visibility,
    bands,
  });

  let totalCost =
    0.6 +
    visibilityPenalty(visibility) +
    0.18 * c2NumberMentalCost(rPercent) +
    0.2 * c2NumberMentalCost(q0) +
    bands.reduce((sum, band) => sum + bandPenalty(band), 0);

  if (stopStage !== 0) {
    totalCost +=
      0.18 * c2NumberMentalCost(Math.abs(correction1)) +
      (branch === "repair_numerator"
        ? 0.14 * c2NumberMentalCost(Math.abs(intermediateNumerator1 ?? 0))
        : 0);
  }
  if (stopStage === 2 || stopStage === "beyond")
    totalCost += 0.2 * c2NumberMentalCost(Math.abs(correction2));

  return {
    route: "scaling",
    feasible: stopStage !== "beyond",
    level: classification.level,
    branch,
    baseline,
    baselineSource: source,
    baselineVisibility: visibility,
    delta,
    r,
    rPercent,
    stopStage,
    q0,
    correction1,
    intermediateNumerator1,
    q1,
    correction2,
    intermediateNumerator2,
    q2,
    finalEstimate,
    relativeError,
    hardCount: classification.hardCount,
    normalCount: classification.normalCount,
    totalCost,
  };
}

export function evaluateC2Scaling(
  a: number,
  b: number,
): C2ScalingEvaluation | undefined {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0)
    return undefined;

  const candidates = baselineCandidates(a, b).flatMap((candidate) => [
    evaluateBranch(
      a,
      b,
      candidate.baseline,
      candidate.source,
      candidate.visibility,
      "repair_result",
    ),
    evaluateBranch(
      a,
      b,
      candidate.baseline,
      candidate.source,
      candidate.visibility,
      "repair_numerator",
    ),
  ]);

  if (!candidates.length) return undefined;

  const sorted = candidates.sort(
    (left, right) =>
      Number(right.feasible) - Number(left.feasible) ||
      left.totalCost - right.totalCost ||
      left.relativeError - right.relativeError,
  );
  const best = sorted[0];

  return {
    ...best,
    alternatives: sorted.slice(1, 8),
  };
}
