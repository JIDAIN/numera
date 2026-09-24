import {
  GenerationContext,
  productionGenerationContext,
} from "./generate";
import {
  DifficultyBand,
  GeneratedQuestion,
  QuestionDataValue,
  QuestionRecord,
  TrainingSession,
} from "./types";

export const C3_GENERATION_VERSION = "c3-v1";
export const C3_GRADING_VERSION = "c3-exact-comparison-v1";
export const C3_QUESTION_COUNT = 20;
export const C3_S3_GAP_THRESHOLD = 0.02;

export type C3StructureLevel = "S1" | "S2" | "S3";
export type C3Salience = "strong" | "normal" | "weak";
export type C3AppearanceTag =
  | "direct"
  | "benchmark"
  | "scale"
  | "delta"
  | "ordinary_two_axis"
  | "very_close";

type CueSalience = C3Salience | undefined;

export type C3Profile = {
  structureLevel: C3StructureLevel;
  salience: C3Salience;
  answer: "<" | ">";
  leftValue: number;
  rightValue: number;
  symmetricRatioGap: number;
  numeratorRelativeGap: number;
  denominatorRelativeGap: number;
  deltaNumerator: number;
  deltaDenominator: number;
  appearanceTags: C3AppearanceTag[];
  rawCue: C3Salience;
  benchmarkCue?: C3Salience;
  benchmarkLabel?: string;
  benchmarkSide?: "same" | "opposite";
  scaleCue?: C3Salience;
  scaleFactor?: number;
  deltaCue?: C3Salience;
};

export type C3QuotaCell = {
  structureLevel: C3StructureLevel;
  salience: C3Salience;
  count: number;
};

export const C3_QUOTAS: Record<DifficultyBand, readonly C3QuotaCell[]> = {
  L1: [
    { structureLevel: "S1", salience: "strong", count: 4 },
    { structureLevel: "S1", salience: "normal", count: 4 },
    { structureLevel: "S2", salience: "strong", count: 12 },
  ],
  L2: [
    { structureLevel: "S1", salience: "normal", count: 2 },
    { structureLevel: "S1", salience: "weak", count: 2 },
    { structureLevel: "S2", salience: "strong", count: 6 },
    { structureLevel: "S2", salience: "normal", count: 10 },
  ],
  L3: [
    { structureLevel: "S2", salience: "normal", count: 4 },
    { structureLevel: "S2", salience: "weak", count: 6 },
    { structureLevel: "S3", salience: "strong", count: 4 },
    { structureLevel: "S3", salience: "normal", count: 4 },
    { structureLevel: "S3", salience: "weak", count: 2 },
  ],
};

export const C3_MINIMUM_APPEARANCE_COVERAGE: Record<
  DifficultyBand,
  readonly C3AppearanceTag[]
> = {
  L1: ["direct", "benchmark", "scale", "delta"],
  L2: ["direct", "benchmark", "scale", "delta", "ordinary_two_axis"],
  L3: ["benchmark", "scale", "delta", "ordinary_two_axis", "very_close"],
};

const BENCHMARKS = [
  { label: "1/10", value: 1 / 10 },
  { label: "1/5", value: 1 / 5 },
  { label: "1/4", value: 1 / 4 },
  { label: "1/3", value: 1 / 3 },
  { label: "2/5", value: 2 / 5 },
  { label: "1/2", value: 1 / 2 },
  { label: "3/5", value: 3 / 5 },
  { label: "2/3", value: 2 / 3 },
  { label: "3/4", value: 3 / 4 },
  { label: "4/5", value: 4 / 5 },
  { label: "5/6", value: 5 / 6 },
  { label: "1", value: 1 },
] as const;

type FractionPair = { a: number; b: number; c: number; d: number };

type InternalC3Profile = C3Profile & {
  benchmarkDecisive: boolean;
  rawDecisive: boolean;
};

type TargetSlot = {
  structureLevel: C3StructureLevel;
  salience: C3Salience;
  preferredAppearance?: C3AppearanceTag;
  desiredAnswer: "<" | ">";
};

export type C3BreakdownRow = {
  key: string;
  label: string;
  questionCount: number;
  correctCount: number;
  accuracy: number;
  averageMs: number;
};

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

function symmetricRelativeGap(left: number, right: number) {
  return (2 * Math.abs(left - right)) / (left + right);
}

function relativeDifference(left: number, right: number) {
  return (2 * Math.abs(left - right)) / (left + right);
}

function digitCount(value: number) {
  return String(Math.abs(Math.trunc(value))).length;
}

function cueRank(value: CueSalience) {
  return value === "strong" ? 3 : value === "normal" ? 2 : value === "weak" ? 1 : 0;
}

function rankToSalience(rank: number): C3Salience {
  return rank >= 3 ? "strong" : rank >= 2 ? "normal" : "weak";
}

function comparisonAnswer(
  a: number,
  b: number,
  c: number,
  d: number,
): "<" | ">" | "=" {
  const left = a * d;
  const right = c * b;
  return left === right ? "=" : left > right ? ">" : "<";
}

function directS1(
  a: number,
  b: number,
  c: number,
  d: number,
  leftValue: number,
  rightValue: number,
) {
  return (
    a === c ||
    b === d ||
    (a > c && b < d) ||
    (a < c && b > d) ||
    (leftValue < 1 && rightValue > 1) ||
    (leftValue > 1 && rightValue < 1)
  );
}

function s1Salience(
  a: number,
  b: number,
  c: number,
  d: number,
  leftValue: number,
  rightValue: number,
): C3Salience {
  if (
    a === c ||
    b === d ||
    (leftValue < 1 && rightValue > 1) ||
    (leftValue > 1 && rightValue < 1)
  )
    return "strong";
  const minimumGap = Math.min(
    relativeDifference(a, c),
    relativeDifference(b, d),
  );
  if (minimumGap >= 0.12) return "strong";
  if (minimumGap >= 0.04) return "normal";
  return "weak";
}

function benchmarkCue(leftValue: number, rightValue: number) {
  const best = BENCHMARKS.map((benchmark) => {
    const leftDeviation =
      Math.abs(leftValue - benchmark.value) / benchmark.value;
    const rightDeviation =
      Math.abs(rightValue - benchmark.value) / benchmark.value;
    return {
      ...benchmark,
      leftDeviation,
      rightDeviation,
      maxDeviation: Math.max(leftDeviation, rightDeviation),
    };
  }).sort((left, right) => left.maxDeviation - right.maxDeviation)[0];

  if (!best || best.maxDeviation > 0.12) return undefined;

  const epsilon = 1e-12;
  const leftSide =
    Math.abs(leftValue - best.value) <= epsilon
      ? 0
      : leftValue > best.value
        ? 1
        : -1;
  const rightSide =
    Math.abs(rightValue - best.value) <= epsilon
      ? 0
      : rightValue > best.value
        ? 1
        : -1;
  const opposite = leftSide === 0 || rightSide === 0 || leftSide !== rightSide;

  return {
    salience: opposite
      ? ("strong" as const)
      : best.leftDeviation <= 0.06 && best.rightDeviation <= 0.06
        ? ("normal" as const)
        : ("weak" as const),
    label: best.label,
    side: opposite ? ("opposite" as const) : ("same" as const),
    decisive: opposite,
  };
}

function scaleCue(n0: number, d0: number, n1: number, d1: number) {
  const numeratorScale = n1 / n0;
  const denominatorScale = d1 / d0;
  const best = Array.from({ length: 9 }, (_, index) => index + 2)
    .map((factor) => ({
      factor,
      deviation: Math.max(
        Math.abs(numeratorScale - factor) / factor,
        Math.abs(denominatorScale - factor) / factor,
      ),
    }))
    .sort((left, right) => left.deviation - right.deviation)[0];

  if (!best || best.deviation > 0.08) return undefined;
  return {
    factor: best.factor,
    salience:
      best.deviation <= 0.03
        ? ("strong" as const)
        : ("normal" as const),
  };
}

function deltaCue(n0: number, d0: number, n1: number, d1: number) {
  const deltaNumerator = n1 - n0;
  const deltaDenominator = d1 - d0;
  const numeratorShare = deltaNumerator / n0;
  const denominatorShare = deltaDenominator / d0;
  if (numeratorShare > 0.35 || denominatorShare > 0.35) return undefined;

  const bothDropADigit =
    digitCount(deltaNumerator) <= digitCount(n0) - 1 &&
    digitCount(deltaDenominator) <= digitCount(d0) - 1;

  return {
    salience:
      bothDropADigit && numeratorShare <= 0.2 && denominatorShare <= 0.2
        ? ("strong" as const)
        : ("normal" as const),
  };
}

export function classifyC3Question(
  a: number,
  b: number,
  c: number,
  d: number,
): C3Profile | undefined {
  if (
    ![a, b, c, d].every(
      (value) => Number.isInteger(value) && value > 0,
    ) ||
    b === 0 ||
    d === 0
  )
    return undefined;

  const answer = comparisonAnswer(a, b, c, d);
  if (answer === "=") return undefined;

  const leftValue = a / b;
  const rightValue = c / d;
  const ratioGap = symmetricRelativeGap(leftValue, rightValue);
  const numeratorGap = relativeDifference(a, c);
  const denominatorGap = relativeDifference(b, d);
  const deltaNumerator = Math.abs(a - c);
  const deltaDenominator = Math.abs(b - d);

  if (directS1(a, b, c, d, leftValue, rightValue)) {
    return {
      structureLevel: "S1",
      salience: s1Salience(a, b, c, d, leftValue, rightValue),
      answer,
      leftValue,
      rightValue,
      symmetricRatioGap: ratioGap,
      numeratorRelativeGap: numeratorGap,
      denominatorRelativeGap: denominatorGap,
      deltaNumerator,
      deltaDenominator,
      appearanceTags: ["direct"],
      rawCue: "strong",
    };
  }

  if ((a - c) * (b - d) <= 0) return undefined;

  const [n0, d0, n1, d1] =
    a < c ? [a, b, c, d] : [c, d, a, b];
  const rN = (n1 - n0) / n0;
  const rD = (d1 - d0) / d0;
  if (rN <= 0 || rD <= 0) return undefined;

  const changeStrengthRatio = Math.max(rN, rD) / Math.min(rN, rD);
  const rawCue: C3Salience =
    changeStrengthRatio >= 2
      ? "strong"
      : changeStrengthRatio >= 1.35
        ? "normal"
        : "weak";
  const benchmark = benchmarkCue(leftValue, rightValue);
  const scale = scaleCue(n0, d0, n1, d1);
  const delta = deltaCue(n0, d0, n1, d1);
  const rawDecisive = changeStrengthRatio >= 2;
  const benchmarkDecisive = Boolean(benchmark?.decisive);
  const decisiveExit = rawDecisive || benchmarkDecisive;
  const maxCueRank = Math.max(
    cueRank(rawCue),
    cueRank(benchmark?.salience),
    cueRank(scale?.salience),
    cueRank(delta?.salience),
  );

  const structureLevel: C3StructureLevel =
    ratioGap <= C3_S3_GAP_THRESHOLD && !decisiveExit ? "S3" : "S2";
  const salience = rankToSalience(maxCueRank);
  const appearanceTags: C3AppearanceTag[] = ["ordinary_two_axis"];
  if (benchmark) appearanceTags.push("benchmark");
  if (scale) appearanceTags.push("scale");
  if (delta) appearanceTags.push("delta");
  if (ratioGap <= C3_S3_GAP_THRESHOLD) appearanceTags.push("very_close");

  const result: InternalC3Profile = {
    structureLevel,
    salience,
    answer,
    leftValue,
    rightValue,
    symmetricRatioGap: ratioGap,
    numeratorRelativeGap: numeratorGap,
    denominatorRelativeGap: denominatorGap,
    deltaNumerator,
    deltaDenominator,
    appearanceTags,
    rawCue,
    benchmarkCue: benchmark?.salience,
    benchmarkLabel: benchmark?.label,
    benchmarkSide: benchmark?.side,
    scaleCue: scale?.salience,
    scaleFactor: scale?.factor,
    deltaCue: delta?.salience,
    benchmarkDecisive,
    rawDecisive,
  };

  const {
    benchmarkDecisive: _benchmarkDecisive,
    rawDecisive: _rawDecisive,
    ...publicProfile
  } = result;
  return publicProfile;
}

function roundPositive(value: number) {
  return Math.max(1, Math.round(value));
}

function s1StrongCandidate(context: GenerationContext): FractionPair {
  const variant = randomInteger(context, 0, 2);
  if (variant === 0) {
    const numerator = randomInteger(context, 35, 140);
    const firstDenominator = randomInteger(
      context,
      numerator + 25,
      numerator + 180,
    );
    let secondDenominator = randomInteger(
      context,
      numerator + 25,
      numerator + 180,
    );
    if (secondDenominator === firstDenominator) secondDenominator += 7;
    return {
      a: numerator,
      b: firstDenominator,
      c: numerator,
      d: secondDenominator,
    };
  }
  if (variant === 1) {
    const denominator = randomInteger(context, 90, 260);
    const firstNumerator = randomInteger(context, 20, denominator - 15);
    let secondNumerator = randomInteger(context, 20, denominator - 15);
    if (secondNumerator === firstNumerator) secondNumerator += 3;
    return {
      a: firstNumerator,
      b: denominator,
      c: secondNumerator,
      d: denominator,
    };
  }

  const leftDenominator = randomInteger(context, 90, 260);
  const rightDenominator = randomInteger(context, 90, 260);
  return {
    a: randomInteger(context, 20, leftDenominator - 8),
    b: leftDenominator,
    c: randomInteger(
      context,
      rightDenominator + 8,
      rightDenominator + 120,
    ),
    d: rightDenominator,
  };
}

function s1DominanceCandidate(
  context: GenerationContext,
  salience: "normal" | "weak",
): FractionPair {
  const d = randomInteger(context, 140, 360);
  const c = roundPositive(d * (1.25 + context.random() * 0.35));
  const gap =
    salience === "normal"
      ? 0.055 + context.random() * 0.04
      : 0.012 + context.random() * 0.018;
  return {
    a: roundPositive(c * (1 + gap)),
    b: roundPositive(d * (1 - gap)),
    c,
    d,
  };
}

function benchmarkStrongCandidate(context: GenerationContext): FractionPair {
  const benchmark = randomChoice(
    context,
    BENCHMARKS.filter((item) => item.value < 0.9 && item.value > 0.2),
  );
  const b = randomInteger(context, 120, 240);
  const d = b + randomInteger(context, 70, 180);
  const margin = 0.04 + context.random() * 0.025;
  return {
    a: roundPositive(b * benchmark.value * (1 - margin)),
    b,
    c: roundPositive(d * benchmark.value * (1 + margin)),
    d,
  };
}

function scaleStrongS2Candidate(context: GenerationContext): FractionPair {
  const b = randomInteger(context, 90, 170);
  const a = roundPositive(b * (0.44 + context.random() * 0.04));
  const factor = randomInteger(context, 2, 5);
  return {
    a,
    b,
    c: roundPositive(a * factor * 1.024),
    d: roundPositive(b * factor * 0.978),
  };
}

function deltaStrongS2Candidate(context: GenerationContext): FractionPair {
  const b = randomInteger(context, 120, 260);
  const a = roundPositive(b * (1.25 + context.random() * 0.35));
  return {
    a,
    b,
    c: roundPositive(a * (1.17 + context.random() * 0.02)),
    d: roundPositive(b * (1.09 + context.random() * 0.02)),
  };
}

function rawStrongS2Candidate(context: GenerationContext): FractionPair {
  const b = randomInteger(context, 120, 260);
  const a = roundPositive(b * (1.25 + context.random() * 0.45));
  return {
    a,
    b,
    c: roundPositive(a * (1.28 + context.random() * 0.08)),
    d: roundPositive(b * (1.08 + context.random() * 0.04)),
  };
}

function normalS2Candidate(context: GenerationContext): FractionPair {
  const b = randomInteger(context, 110, 250);
  const a = roundPositive(b * (1.28 + context.random() * 0.45));
  return {
    a,
    b,
    c: roundPositive(a * (1.26 + context.random() * 0.04)),
    d: roundPositive(b * (1.17 + context.random() * 0.025)),
  };
}

function weakS2Candidate(context: GenerationContext): FractionPair {
  const b = randomInteger(context, 100, 240);
  const a = roundPositive(b * (1.28 + context.random() * 0.45));
  return {
    a,
    b,
    c: roundPositive(a * (1.5 + context.random() * 0.12)),
    d: roundPositive(b * (1.4 + context.random() * 0.1)),
  };
}

function strongS3ScaleCandidate(context: GenerationContext): FractionPair {
  const b = randomInteger(context, 100, 210);
  const a = roundPositive(b * (0.44 + context.random() * 0.035));
  const factor = randomInteger(context, 2, 5);
  return {
    a,
    b,
    c: roundPositive(a * factor * (1.006 + context.random() * 0.006)),
    d: roundPositive(b * factor * (0.998 + context.random() * 0.004)),
  };
}

function strongS3DeltaCandidate(context: GenerationContext): FractionPair {
  const b = randomInteger(context, 130, 300);
  const a = roundPositive(b * (1.28 + context.random() * 0.4));
  const baseChange = 0.13 + context.random() * 0.035;
  return {
    a,
    b,
    c: roundPositive(a * (1 + baseChange + 0.008)),
    d: roundPositive(b * (1 + baseChange)),
  };
}

function normalS3Candidate(context: GenerationContext): FractionPair {
  const b = randomInteger(context, 110, 260);
  const a = roundPositive(b * (1.28 + context.random() * 0.45));
  const baseChange = 0.27 + context.random() * 0.05;
  return {
    a,
    b,
    c: roundPositive(a * (1 + baseChange)),
    d: roundPositive(b * (1 + baseChange + 0.01)),
  };
}

function weakS3Candidate(context: GenerationContext): FractionPair {
  const b = randomInteger(context, 100, 240);
  const a = roundPositive(b * (1.28 + context.random() * 0.45));
  const baseChange = 0.48 + context.random() * 0.14;
  return {
    a,
    b,
    c: roundPositive(a * (1 + baseChange)),
    d: roundPositive(b * (1 + baseChange + 0.012)),
  };
}

function candidateForTarget(
  context: GenerationContext,
  target: Pick<TargetSlot, "structureLevel" | "salience" | "preferredAppearance">,
): FractionPair {
  if (target.structureLevel === "S1") {
    return target.salience === "strong"
      ? s1StrongCandidate(context)
      : s1DominanceCandidate(context, target.salience);
  }

  if (target.structureLevel === "S2" && target.salience === "strong") {
    if (target.preferredAppearance === "benchmark")
      return benchmarkStrongCandidate(context);
    if (target.preferredAppearance === "scale")
      return scaleStrongS2Candidate(context);
    if (target.preferredAppearance === "delta")
      return deltaStrongS2Candidate(context);
    return rawStrongS2Candidate(context);
  }

  if (target.structureLevel === "S2" && target.salience === "normal")
    return normalS2Candidate(context);
  if (target.structureLevel === "S2" && target.salience === "weak")
    return weakS2Candidate(context);

  if (target.structureLevel === "S3" && target.salience === "strong") {
    return target.preferredAppearance === "delta"
      ? strongS3DeltaCandidate(context)
      : strongS3ScaleCandidate(context);
  }
  if (target.structureLevel === "S3" && target.salience === "normal")
    return normalS3Candidate(context);
  return weakS3Candidate(context);
}

function mirror(pair: FractionPair): FractionPair {
  return { a: pair.c, b: pair.d, c: pair.a, d: pair.b };
}

function pairKey(pair: FractionPair) {
  const left = `${pair.a}/${pair.b}`;
  const right = `${pair.c}/${pair.d}`;
  return [left, right].sort().join("|");
}

function profileMatchesTarget(profile: C3Profile, target: TargetSlot) {
  return (
    profile.structureLevel === target.structureLevel &&
    profile.salience === target.salience &&
    (!target.preferredAppearance ||
      profile.appearanceTags.includes(target.preferredAppearance))
  );
}

function generateTargetPair(
  context: GenerationContext,
  target: TargetSlot,
  used: Set<string>,
): { pair: FractionPair; profile: C3Profile } {
  for (let attempt = 0; attempt < 1200; attempt += 1) {
    let pair = candidateForTarget(context, target);
    let profile = classifyC3Question(pair.a, pair.b, pair.c, pair.d);
    if (!profile || !profileMatchesTarget(profile, target)) continue;

    if (profile.answer !== target.desiredAnswer) {
      pair = mirror(pair);
      profile = classifyC3Question(pair.a, pair.b, pair.c, pair.d);
    }
    if (
      !profile ||
      profile.answer !== target.desiredAnswer ||
      !profileMatchesTarget(profile, target)
    )
      continue;

    const key = pairKey(pair);
    if (used.has(key)) continue;
    used.add(key);
    return { pair, profile };
  }

  throw new Error(
    `Unable to generate C3 target ${target.structureLevel}-${target.salience}`,
  );
}

function targetsForBand(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
): TargetSlot[] {
  const expanded = C3_QUOTAS[difficultyBand].flatMap((cell) =>
    Array.from({ length: cell.count }, () => ({
      structureLevel: cell.structureLevel,
      salience: cell.salience,
    })),
  );

  const appearanceRequests: Partial<
    Record<`${C3StructureLevel}-${C3Salience}`, C3AppearanceTag[]>
  > =
    difficultyBand === "L1"
      ? {
          "S2-strong": ["benchmark", "scale", "delta"],
        }
      : difficultyBand === "L2"
        ? {
            "S2-strong": ["benchmark", "scale", "delta"],
          }
        : {
            "S3-strong": ["scale", "delta"],
          };

  const occurrence = new Map<string, number>();
  const slots = expanded.map((cell, index) => {
    const key = `${cell.structureLevel}-${cell.salience}` as const;
    const current = occurrence.get(key) ?? 0;
    occurrence.set(key, current + 1);
    return {
      ...cell,
      preferredAppearance: appearanceRequests[key]?.[current],
      desiredAnswer: index % 2 === 0 ? (">" as const) : ("<" as const),
    };
  });

  return shuffle(context, slots);
}

function questionData(
  pair: FractionPair,
  profile: C3Profile,
): Record<string, QuestionDataValue> {
  const data: Record<string, QuestionDataValue> = {
    a: pair.a,
    b: pair.b,
    c: pair.c,
    d: pair.d,
    choiceValues: [">", "<"],
    choiceLabels: ["大于", "小于"],
    c3StructureLevel: profile.structureLevel,
    c3Salience: profile.salience,
    c3AppearanceTags: profile.appearanceTags,
    c3LeftValue: profile.leftValue,
    c3RightValue: profile.rightValue,
    c3SymmetricRatioGap: profile.symmetricRatioGap,
    c3NumeratorRelativeGap: profile.numeratorRelativeGap,
    c3DenominatorRelativeGap: profile.denominatorRelativeGap,
    c3DeltaNumerator: profile.deltaNumerator,
    c3DeltaDenominator: profile.deltaDenominator,
    c3RawCue: profile.rawCue,
  };
  if (profile.benchmarkCue) data.c3BenchmarkCue = profile.benchmarkCue;
  if (profile.benchmarkLabel) data.c3BenchmarkLabel = profile.benchmarkLabel;
  if (profile.benchmarkSide) data.c3BenchmarkSide = profile.benchmarkSide;
  if (profile.scaleCue) data.c3ScaleCue = profile.scaleCue;
  if (profile.scaleFactor !== undefined) data.c3ScaleFactor = profile.scaleFactor;
  if (profile.deltaCue) data.c3DeltaCue = profile.deltaCue;
  return data;
}

function buildQuestion(
  context: GenerationContext,
  difficultyBand: DifficultyBand,
  pair: FractionPair,
  profile: C3Profile,
): GeneratedQuestion {
  return {
    id: context.createId(),
    type: "c_training",
    subtype: "c_task",
    prompt: `${pair.a}/${pair.b} ？ ${pair.c}/${pair.d}`,
    answer: profile.answer,
    data: questionData(pair, profile),
    difficulty: {
      level:
        difficultyBand === "L1" ? 1 : difficultyBand === "L2" ? 3 : 5,
      tags: [
        difficultyBand,
        profile.structureLevel,
        profile.salience,
        ...profile.appearanceTags,
      ],
    },
    primaryStructure: profile.structureLevel,
    secondaryTags: [profile.salience, ...profile.appearanceTags],
    generationRuleVersion: C3_GENERATION_VERSION,
    difficultyBand,
    structureTags: [
      profile.structureLevel,
      profile.salience,
      ...profile.appearanceTags,
    ],
    generatorParams: {
      symmetricRatioGap: profile.symmetricRatioGap,
      numeratorRelativeGap: profile.numeratorRelativeGap,
      denominatorRelativeGap: profile.denominatorRelativeGap,
      deltaNumerator: profile.deltaNumerator,
      deltaDenominator: profile.deltaDenominator,
    },
    inputKind: "choice",
    cMeta: {
      project: "C3",
      mode: "specialty",
      grading: {
        kind: "exact",
        normalize: "comparison",
        version: C3_GRADING_VERSION,
      },
    },
  };
}

export function generateC3Set(
  difficultyBand: DifficultyBand,
  questionCount = C3_QUESTION_COUNT,
  context: GenerationContext = productionGenerationContext,
) {
  if (questionCount !== C3_QUESTION_COUNT)
    throw new RangeError("C3 formal training blocks require 20 questions");

  const used = new Set<string>();
  const questions = targetsForBand(difficultyBand, context).map((target) => {
    const { pair, profile } = generateTargetPair(context, target, used);
    return buildQuestion(context, difficultyBand, pair, profile);
  });

  const answerCounts = questions.reduce(
    (result, question) => {
      if (question.answer === ">") result.greater += 1;
      if (question.answer === "<") result.less += 1;
      return result;
    },
    { greater: 0, less: 0 },
  );
  if (answerCounts.greater !== 10 || answerCounts.less !== 10)
    throw new Error("C3 set must contain 10 greater and 10 less answers");

  const coverage = new Set(
    questions.flatMap((question) =>
      Array.isArray(question.data.c3AppearanceTags)
        ? question.data.c3AppearanceTags.map(String)
        : [],
    ),
  );
  const missing = C3_MINIMUM_APPEARANCE_COVERAGE[difficultyBand].filter(
    (tag) => !coverage.has(tag),
  );
  if (missing.length)
    throw new Error(`C3 set is missing appearance coverage: ${missing.join(",")}`);

  return shuffle(context, questions);
}

function groupRows(
  records: QuestionRecord[],
  keyFor: (record: QuestionRecord) => string | undefined,
  labelFor: (key: string) => string = (key) => key,
): C3BreakdownRow[] {
  const groups = new Map<string, QuestionRecord[]>();
  records.forEach((record) => {
    const key = keyFor(record);
    if (!key) return;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  });
  return [...groups.entries()]
    .map(([key, items]) => {
      const correctCount = items.filter((record) => record.isCorrect).length;
      const totalMs = items.reduce(
        (sum, record) => sum + record.timeUsedMs,
        0,
      );
      return {
        key,
        label: labelFor(key),
        questionCount: items.length,
        correctCount,
        accuracy: items.length ? correctCount / items.length : 0,
        averageMs: items.length ? totalMs / items.length : 0,
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label, "zh-CN"));
}

export function summarizeC3Session(
  session: Pick<TrainingSession, "cProject" | "records">,
) {
  if (session.cProject !== "C3") return undefined;
  return {
    byStructureLevel: groupRows(
      session.records,
      (record) => {
        const value = record.question.data.c3StructureLevel;
        return value === "S1" || value === "S2" || value === "S3"
          ? value
          : undefined;
      },
    ),
    bySalience: groupRows(
      session.records,
      (record) => {
        const value = record.question.data.c3Salience;
        return value === "strong" || value === "normal" || value === "weak"
          ? value
          : undefined;
      },
      (key) =>
        key === "strong" ? "strong" : key === "normal" ? "normal" : "weak",
    ),
    byAppearance: groupRows(
      session.records.flatMap((record) => {
        const tags = record.question.data.c3AppearanceTags;
        if (!Array.isArray(tags)) return [];
        return tags.map((tag) => ({
          ...record,
          question: {
            ...record.question,
            data: {
              ...record.question.data,
              c3CurrentAppearance: String(tag),
            },
          },
        }));
      }),
      (record) => {
        const value = record.question.data.c3CurrentAppearance;
        return typeof value === "string" ? value : undefined;
      },
      (key) =>
        ({
          direct: "直接结构",
          benchmark: "共同基准",
          scale: "简单缩放",
          delta: "变化量缩小",
          ordinary_two_axis: "双轴冲突",
          very_close: "非常接近",
        })[key] ?? key,
    ),
  };
}
