import {
  registerCustomCGrader,
  type TrainingGradeResult,
} from "./grader-registry";
import {
  GenerationContext,
  productionGenerationContext,
} from "./generate";
import {
  DifficultyBand,
  GeneratedQuestion,
  QuestionDataValue,
  QuestionRecord,
  StructuredResponseValue,
  TrainingResponse,
  TrainingSession,
} from "./types";

export const C1_QUESTION_COUNT = 20;
export const C1_MINIMUM_DIRECTION_COUNT = 5;
export const C1_GENERATION_VERSION = "c1-v1";
export const C1_GRADER_ID = "c1-multiplication-scaling-v1";
export const C1_GRADING_VERSION = "c1-multiplication-scaling-v1";
export const C1_ERROR_TOLERANCE = 0.02;
export const C1_LARGE_ADJUSTMENT_THRESHOLD = 0.1;

export type C1ChallengeType =
  | "obvious"
  | "amplitude"
  | "recognition"
  | "same_side_competition"
  | "cross_side_competition";

export type C1DirectionPattern =
  | "left_up_right_down"
  | "left_down_right_up"
  | "right_up_left_down"
  | "right_down_left_up";

type PrimarySide = "left" | "right";

type C1Route = {
  aPrime: number;
  bPrime: number;
  rA: number;
  rB: number;
  maxAdjustment: number;
  methodError: number;
  costBefore: number;
  costAfter: number;
  costReduction: number;
  leftFactorImprovement: number;
  rightFactorImprovement: number;
  primarySide: PrimarySide;
  primaryAdjustment: number;
  directionPattern: C1DirectionPattern;
};

type C1TargetSlot = {
  challengeType: C1ChallengeType;
  directionPattern: C1DirectionPattern;
};

export type C1DiagnosticSummary = {
  questionCount: number;
  passedCount: number;
  directionPassed: number;
  costPassed: number;
  methodPassed: number;
  executionPassed: number;
  totalPassed: number;
  largeAdjustmentCount: number;
  averageMethodError: number;
  averageExecutionError: number;
  averageTotalError: number;
};

export type C1BreakdownRow = {
  key: string;
  label: string;
  questionCount: number;
  correctCount: number;
  accuracy: number;
  averageMs: number;
};

const C4_CORES = new Set([
  5, 9, 11, 25, 111, 125, 143, 167, 222, 250, 286, 333, 444, 555, 666, 667,
  777, 888,
]);

const DIRECTION_PATTERNS: readonly C1DirectionPattern[] = [
  "left_up_right_down",
  "left_down_right_up",
  "right_up_left_down",
  "right_down_left_up",
];

function randomInteger(
  context: GenerationContext,
  min: number,
  max: number,
) {
  return Math.floor(context.random() * (max - min + 1)) + min;
}

function randomChoice<T>(context: GenerationContext, values: readonly T[]) {
  return values[randomInteger(context, 0, values.length - 1)];
}

function shuffle<T>(context: GenerationContext, values: readonly T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomInteger(context, 0, index);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function roundNumber(value: number, digits = 8) {
  return Number(value.toFixed(digits));
}

function formatNumber(value: number) {
  const rounded = roundNumber(value, 6);
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function normalizedCore(value: number) {
  if (!Number.isFinite(value) || value <= 0) return undefined;
  const text = Math.abs(value).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  const [integerPart = "0", fractionalPart = ""] = text.split(".");
  let digits = `${integerPart}${fractionalPart}`.replace(/^0+/, "") || "0";
  let scale = -fractionalPart.length;
  while (digits.length > 1 && digits.endsWith("0")) {
    digits = digits.slice(0, -1);
    scale += 1;
  }
  return { digits, scale, core: Number(digits) };
}

function factorMentalCost(value: number) {
  const profile = normalizedCore(value);
  if (!profile) return Number.POSITIVE_INFINITY;

  const digitWeight: Record<string, number> = {
    "0": 0,
    "1": 0.2,
    "2": 0.45,
    "3": 0.9,
    "4": 0.65,
    "5": 0.45,
    "6": 0.9,
    "7": 1,
    "8": 0.7,
    "9": 0.9,
  };

  let score =
    [...profile.digits].reduce(
      (total, digit) => total + (digitWeight[digit] ?? 1),
      0,
    ) +
    0.35 * profile.digits.length +
    0.08 * Math.abs(profile.scale);

  if (profile.core <= 9) score -= 0.3;
  if (
    profile.digits.length >= 2 &&
    new Set(profile.digits.split("")).size === 1
  )
    score -= 0.25;
  if (profile.digits.endsWith("5")) score -= 0.12;

  return Math.max(0.25, score);
}

/**
 * Engineering calibration for C1 only. It estimates the mental work of the
 * whole multiplication expression; it is intentionally independent from
 * frontend L1/L2/L3 and can be recalibrated later from real usage data.
 */
export function evaluateMultiplicationCost(a: number, b: number) {
  const left = normalizedCore(a);
  const right = normalizedCore(b);
  if (!left || !right) return Number.POSITIVE_INFINITY;

  const leftNonZero = [...left.digits].filter((digit) => digit !== "0").length;
  const rightNonZero = [...right.digits].filter((digit) => digit !== "0").length;

  return (
    factorMentalCost(a) +
    factorMentalCost(b) +
    0.55 * leftNonZero * rightNonZero +
    0.08 * Math.abs(left.scale + right.scale)
  );
}

function relativeError(actual: number, expected: number) {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return Infinity;
  if (expected === 0) return actual === 0 ? 0 : Infinity;
  return Math.abs(actual - expected) / Math.abs(expected);
}

function routeFacts(
  a: number,
  b: number,
  aPrime: number,
  bPrime: number,
): C1Route | undefined {
  if (![a, b, aPrime, bPrime].every((value) => Number.isFinite(value) && value > 0))
    return undefined;

  const rA = (aPrime - a) / a;
  const rB = (bPrime - b) / b;
  if ((aPrime - a) * (bPrime - b) >= 0) return undefined;

  const costBefore = evaluateMultiplicationCost(a, b);
  const costAfter = evaluateMultiplicationCost(aPrime, bPrime);
  const leftFactorImprovement = factorMentalCost(a) - factorMentalCost(aPrime);
  const rightFactorImprovement = factorMentalCost(b) - factorMentalCost(bPrime);
  const primarySide: PrimarySide =
    leftFactorImprovement >= rightFactorImprovement ? "left" : "right";
  const directionPattern: C1DirectionPattern =
    primarySide === "left"
      ? rA > 0
        ? "left_up_right_down"
        : "left_down_right_up"
      : rB > 0
        ? "right_up_left_down"
        : "right_down_left_up";

  return {
    aPrime,
    bPrime,
    rA,
    rB,
    maxAdjustment: Math.max(Math.abs(rA), Math.abs(rB)),
    methodError: relativeError(aPrime * bPrime, a * b),
    costBefore,
    costAfter,
    costReduction: costBefore - costAfter,
    leftFactorImprovement,
    rightFactorImprovement,
    primarySide,
    primaryAdjustment: Math.abs(primarySide === "left" ? rA : rB),
    directionPattern,
  };
}

function isQualifiedRoute(route: C1Route, maxAdjustment: number) {
  return (
    route.maxAdjustment <= maxAdjustment + 1e-12 &&
    route.methodError <= C1_ERROR_TOLERANCE + 1e-12 &&
    route.costAfter < route.costBefore - 0.05
  );
}

function candidateTargets(value: number, maxAdjustment: number) {
  const minimum = value * (1 - maxAdjustment);
  const maximum = value * (1 + maxAdjustment);
  const magnitudeStep =
    10 ** (Math.floor(Math.log10(Math.max(Number.EPSILON, value))) - 2);
  const values = new Set<number>();

  for (const multiple of [1, 2, 5, 10, 20, 25, 50, 100]) {
    const step = magnitudeStep * multiple;
    const center = Math.round(value / step);
    for (let offset = -2; offset <= 2; offset += 1) {
      const candidate = (center + offset) * step;
      if (
        candidate > 0 &&
        candidate >= minimum &&
        candidate <= maximum &&
        Math.abs(candidate - value) > 1e-12
      )
        values.add(roundNumber(candidate));
    }
  }

  return [...values];
}

function validRoutes(a: number, b: number, maxAdjustment: number) {
  const routes: C1Route[] = [];
  for (const aPrime of candidateTargets(a, maxAdjustment)) {
    for (const bPrime of candidateTargets(b, maxAdjustment)) {
      const route = routeFacts(a, b, aPrime, bPrime);
      if (route && isQualifiedRoute(route, maxAdjustment)) routes.push(route);
    }
  }
  return routes.sort(
    (left, right) =>
      left.costAfter - right.costAfter ||
      right.costReduction - left.costReduction,
  );
}

function isC4Core(value: number) {
  const profile = normalizedCore(value);
  return Boolean(profile && C4_CORES.has(profile.core));
}

function rawQuestionIsUseful(a: number, b: number) {
  return (
    !isC4Core(a) &&
    !isC4Core(b) &&
    evaluateMultiplicationCost(a, b) >= 5.5
  );
}

function landscapeFor(
  a: number,
  b: number,
  slot: C1TargetSlot,
): { recommended: C1Route; alternate?: C1Route } | undefined {
  const maxAdjustment =
    slot.challengeType === "obvious" || slot.challengeType === "recognition"
      ? 0.05
      : slot.challengeType === "amplitude"
        ? 0.082
        : 0.1;
  const all = validRoutes(a, b, maxAdjustment);
  const matching = all.filter(
    (route) => route.directionPattern === slot.directionPattern,
  );
  if (!matching.length) return undefined;

  if (slot.challengeType === "obvious") {
    const candidates = matching.filter(
      (route) =>
        route.maxAdjustment <= 0.05 &&
        route.costReduction >= 1 &&
        route.methodError <= C1_ERROR_TOLERANCE,
    );
    if (!candidates.length) return undefined;
    const [recommended, second] = candidates;
    if (second && second.costAfter < recommended.costAfter + 0.3)
      return undefined;
    return { recommended };
  }

  if (slot.challengeType === "amplitude") {
    const recommended = matching.find(
      (route) =>
        route.maxAdjustment >= 0.05 &&
        route.maxAdjustment <= 0.082 &&
        route.costReduction >= 0.7,
    );
    return recommended ? { recommended } : undefined;
  }

  if (slot.challengeType === "recognition") {
    for (const recommended of matching) {
      if (
        recommended.maxAdjustment > 0.05 ||
        recommended.costReduction < 0.7
      )
        continue;
      const alternate = matching.find(
        (route) =>
          route.primarySide === recommended.primarySide &&
          route.primaryAdjustment < recommended.primaryAdjustment - 0.002 &&
          route.costAfter > recommended.costAfter + 0.25,
      );
      if (alternate) return { recommended, alternate };
    }
    return undefined;
  }

  if (slot.challengeType === "same_side_competition") {
    for (const recommended of matching) {
      if (
        recommended.maxAdjustment > 0.1 ||
        recommended.costReduction < 0.7
      )
        continue;
      const alternate = matching.find(
        (route) =>
          route.primarySide === recommended.primarySide &&
          route.primaryAdjustment < recommended.primaryAdjustment - 0.003 &&
          route.costAfter > recommended.costAfter + 0.35,
      );
      if (alternate) return { recommended, alternate };
    }
    return undefined;
  }

  for (const recommended of matching) {
    if (recommended.maxAdjustment > 0.1 || recommended.costReduction < 0.7)
      continue;
    const alternate = all.find(
      (route) =>
        route.primarySide !== recommended.primarySide &&
        route.maxAdjustment <= 0.1 &&
        route.costReduction >= 0.4,
    );
    if (alternate) return { recommended, alternate };
  }
  return undefined;
}

function challengeSlots(difficultyBand: DifficultyBand) {
  return Array.from({ length: C1_QUESTION_COUNT }, (_, index): C1TargetSlot => {
    const directionPattern = DIRECTION_PATTERNS[index % DIRECTION_PATTERNS.length];
    if (difficultyBand === "L1")
      return { challengeType: "obvious", directionPattern };
    if (difficultyBand === "L2")
      return {
        challengeType: index < 10 ? "amplitude" : "recognition",
        directionPattern,
      };
    return {
      challengeType:
        index < 10 ? "same_side_competition" : "cross_side_competition",
      directionPattern,
    };
  });
}

function generateQuestionForSlot(
  difficultyBand: DifficultyBand,
  slot: C1TargetSlot,
  context: GenerationContext,
  used: Set<string>,
): GeneratedQuestion {
  for (let attempt = 0; attempt < 1200; attempt += 1) {
    const baseA = randomInteger(context, 130, 980);
    const baseB = randomInteger(context, 130, 980);
    if (!rawQuestionIsUseful(baseA, baseB)) continue;

    const landscape = landscapeFor(baseA, baseB, slot);
    if (!landscape) continue;

    const scalePowerA = randomChoice(
      context,
      [-2, -1, 0, 0, 0, 1, 2] as const,
    );
    const scalePowerB = randomChoice(
      context,
      [-2, -1, 0, 0, 0, 1, 2] as const,
    );
    const scaleA = 10 ** scalePowerA;
    const scaleB = 10 ** scalePowerB;
    let a = roundNumber(baseA * scaleA);
    let b = roundNumber(baseB * scaleB);
    let actualLandscape = landscapeFor(a, b, slot);

    if (!actualLandscape) {
      a = baseA;
      b = baseB;
      actualLandscape = landscape;
    }

    const { recommended, alternate } = actualLandscape;

    const coreA = normalizedCore(a)?.core;
    const coreB = normalizedCore(b)?.core;
    const key =
      coreA !== undefined && coreB !== undefined
        ? `${coreA}x${coreB}`
        : `${formatNumber(a)}x${formatNumber(b)}`;
    if (used.has(key)) continue;
    used.add(key);

    const data: Record<string, QuestionDataValue> = {
      a,
      b,
      c1ChallengeType: slot.challengeType,
      c1DirectionPattern: slot.directionPattern,
      c1RecommendedAPrime: recommended.aPrime,
      c1RecommendedBPrime: recommended.bPrime,
      c1RecommendedMethodError: recommended.methodError,
      c1RecommendedMaxAdjustment: recommended.maxAdjustment,
      c1RecommendedCostBefore: recommended.costBefore,
      c1RecommendedCostAfter: recommended.costAfter,
    };
    if (alternate) {
      data.c1AlternateAPrime = alternate.aPrime;
      data.c1AlternateBPrime = alternate.bPrime;
      data.c1AlternateCostAfter = alternate.costAfter;
      data.c1AlternateMaxAdjustment = alternate.maxAdjustment;
    }

    return {
      id: context.createId(),
      type: "c_training",
      subtype: "c_task",
      prompt: `${formatNumber(a)} × ${formatNumber(b)}`,
      answer: formatNumber(a * b),
      data,
      difficulty: {
        level:
          difficultyBand === "L1" ? 1 : difficultyBand === "L2" ? 3 : 5,
        tags: [difficultyBand, slot.challengeType, slot.directionPattern],
      },
      primaryStructure: slot.challengeType,
      secondaryTags: [slot.directionPattern],
      generationRuleVersion: C1_GENERATION_VERSION,
      difficultyBand,
      structureTags: [slot.challengeType, slot.directionPattern],
      generatorParams: {
        recommendedMethodError: recommended.methodError,
        recommendedMaxAdjustment: recommended.maxAdjustment,
        recommendedCostReduction: recommended.costReduction,
      },
      inputKind: "structured",
      cMeta: {
        project: "C1",
        mode: "specialty",
        grading: {
          kind: "custom",
          graderId: C1_GRADER_ID,
          version: C1_GRADING_VERSION,
        },
      },
    };
  }

  throw new Error(
    `Unable to generate C1 target ${difficultyBand}-${slot.challengeType}-${slot.directionPattern}`,
  );
}

function responseField(
  fields: Record<string, StructuredResponseValue>,
  key: string,
) {
  const raw = fields[key];
  if (typeof raw !== "string" && typeof raw !== "number") return undefined;
  const value = Number(String(raw).trim().replaceAll(",", "").replace("%", ""));
  return Number.isFinite(value) ? value : undefined;
}

export function gradeC1Response(
  question: GeneratedQuestion,
  response: TrainingResponse,
): TrainingGradeResult {
  const a = Number(question.data.a);
  const b = Number(question.data.b);
  const fields = response.kind === "structured" ? response.fields : {};
  const aPrime = responseField(fields, "aPrime");
  const bPrime = responseField(fields, "bPrime");
  const result = responseField(fields, "result");
  const complete =
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    a > 0 &&
    b > 0 &&
    aPrime !== undefined &&
    bPrime !== undefined &&
    result !== undefined &&
    aPrime > 0 &&
    bPrime > 0 &&
    result > 0;

  if (!complete) {
    return {
      isCorrect: false,
      accuracyLevel: "wrong",
      gradingMetrics: {
        gradingKind: "custom",
        gradingVersion: C1_GRADING_VERSION,
        responseComplete: false,
      },
    };
  }

  const route = routeFacts(a, b, aPrime, bPrime);
  const directionPass = Boolean(route);
  const methodError = relativeError(aPrime * bPrime, a * b);
  const executionError = relativeError(result, aPrime * bPrime);
  const totalError = relativeError(result, a * b);
  const costBefore = evaluateMultiplicationCost(a, b);
  const costAfter = evaluateMultiplicationCost(aPrime, bPrime);
  const costPass = costAfter < costBefore - 0.05;
  const methodPass = methodError <= C1_ERROR_TOLERANCE + 1e-12;
  const executionPass = executionError <= C1_ERROR_TOLERANCE + 1e-12;
  const totalPass = totalError <= C1_ERROR_TOLERANCE + 1e-12;
  const rA = (aPrime - a) / a;
  const rB = (bPrime - b) / b;
  const maxAdjustment = Math.max(Math.abs(rA), Math.abs(rB));
  const largeAdjustment =
    maxAdjustment > C1_LARGE_ADJUSTMENT_THRESHOLD + 1e-12;
  const isCorrect =
    directionPass &&
    costPass &&
    methodPass &&
    executionPass &&
    totalPass;
  const exact =
    isCorrect &&
    methodError <= Number.EPSILON &&
    executionError <= Number.EPSILON &&
    totalError <= Number.EPSILON;

  return {
    isCorrect,
    accuracyLevel: exact ? "exact" : isCorrect ? "accepted" : "wrong",
    relativeError: Number.isFinite(totalError) ? totalError : undefined,
    gradingMetrics: {
      gradingKind: "custom",
      gradingVersion: C1_GRADING_VERSION,
      responseComplete: true,
      aPrime,
      bPrime,
      result,
      rA,
      rB,
      maxAdjustment,
      largeAdjustment,
      directionPass,
      costBefore,
      costAfter,
      costReduction: costBefore - costAfter,
      costPass,
      methodError,
      methodPass,
      executionError,
      executionPass,
      totalError,
      totalPass,
    },
  };
}

registerCustomCGrader(C1_GRADER_ID, gradeC1Response);

export function generateC1Set(
  difficultyBand: DifficultyBand,
  questionCount = C1_QUESTION_COUNT,
  context: GenerationContext = productionGenerationContext,
) {
  if (questionCount !== C1_QUESTION_COUNT)
    throw new RangeError("C1 formal training blocks require 20 questions");

  const used = new Set<string>();
  const questions = challengeSlots(difficultyBand).map((slot) =>
    generateQuestionForSlot(difficultyBand, slot, context, used),
  );

  const directionCounts = questions.reduce<Record<string, number>>(
    (result, question) => {
      const pattern = String(question.data.c1DirectionPattern);
      result[pattern] = (result[pattern] ?? 0) + 1;
      return result;
    },
    {},
  );
  for (const pattern of DIRECTION_PATTERNS) {
    if (directionCounts[pattern] !== C1_MINIMUM_DIRECTION_COUNT)
      throw new Error(`C1 set must contain five questions for ${pattern}`);
  }

  if (difficultyBand === "L2") {
    const amplitude = questions.filter(
      (question) => question.data.c1ChallengeType === "amplitude",
    ).length;
    const recognition = questions.filter(
      (question) => question.data.c1ChallengeType === "recognition",
    ).length;
    if (amplitude !== 10 || recognition !== 10)
      throw new Error("C1 L2 requires 10 amplitude and 10 recognition questions");
  }

  if (difficultyBand === "L3") {
    const sameSide = questions.filter(
      (question) => question.data.c1ChallengeType === "same_side_competition",
    ).length;
    const crossSide = questions.filter(
      (question) => question.data.c1ChallengeType === "cross_side_competition",
    ).length;
    if (sameSide !== 10 || crossSide !== 10)
      throw new Error(
        "C1 L3 requires 10 same-side and 10 cross-side competition questions",
      );
  }

  return shuffle(context, questions);
}

function metricBoolean(record: QuestionRecord, key: string) {
  return record.gradingMetrics?.[key] === true;
}

function metricNumber(record: QuestionRecord, key: string) {
  const value = record.gradingMetrics?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function breakdownRows(
  records: QuestionRecord[],
  keyFor: (record: QuestionRecord) => string | undefined,
  labelFor: (key: string) => string,
): C1BreakdownRow[] {
  const groups = new Map<string, QuestionRecord[]>();
  records.forEach((record) => {
    const key = keyFor(record);
    if (!key) return;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  });
  return [...groups.entries()].map(([key, items]) => {
    const correctCount = items.filter((record) => record.isCorrect).length;
    const duration = items.reduce((sum, record) => sum + record.timeUsedMs, 0);
    return {
      key,
      label: labelFor(key),
      questionCount: items.length,
      correctCount,
      accuracy: items.length ? correctCount / items.length : 0,
      averageMs: items.length ? duration / items.length : 0,
    };
  });
}

export function summarizeC1Session(
  session: Pick<TrainingSession, "cProject" | "records">,
) {
  if (session.cProject !== "C1") return undefined;
  const records = session.records;
  const count = records.length;
  const average = (key: string) => {
    const values = records
      .map((record) => record.gradingMetrics?.[key])
      .filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value),
      );
    return values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;
  };

  const diagnostics: C1DiagnosticSummary = {
    questionCount: count,
    passedCount: records.filter((record) => record.isCorrect).length,
    directionPassed: records.filter((record) =>
      metricBoolean(record, "directionPass"),
    ).length,
    costPassed: records.filter((record) =>
      metricBoolean(record, "costPass"),
    ).length,
    methodPassed: records.filter((record) =>
      metricBoolean(record, "methodPass"),
    ).length,
    executionPassed: records.filter((record) =>
      metricBoolean(record, "executionPass"),
    ).length,
    totalPassed: records.filter((record) =>
      metricBoolean(record, "totalPass"),
    ).length,
    largeAdjustmentCount: records.filter((record) =>
      metricBoolean(record, "largeAdjustment"),
    ).length,
    averageMethodError: average("methodError"),
    averageExecutionError: average("executionError"),
    averageTotalError: average("totalError"),
  };

  return {
    diagnostics,
    byChallenge: breakdownRows(
      records,
      (record) =>
        typeof record.question.data.c1ChallengeType === "string"
          ? record.question.data.c1ChallengeType
          : undefined,
      (key) =>
        ({
          obvious: "明显目标",
          amplitude: "幅度型",
          recognition: "识别型",
          same_side_competition: "同侧竞争",
          cross_side_competition: "跨侧竞争",
        })[key] ?? key,
    ),
    byDirection: breakdownRows(
      records,
      (record) =>
        typeof record.question.data.c1DirectionPattern === "string"
          ? record.question.data.c1DirectionPattern
          : undefined,
      (key) =>
        ({
          left_up_right_down: "左主目标：左上右下",
          left_down_right_up: "左主目标：左下右上",
          right_up_left_down: "右主目标：右上左下",
          right_down_left_up: "右主目标：右下左上",
        })[key] ?? key,
    ),
  };
}
