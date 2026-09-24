import { GenerationContext, productionGenerationContext } from "./generate";
import { getSkillDefinition } from "./skill-registry";
import {
  DifficultyBand,
  GeneratedQuestion,
  SkillId,
  StructuredInputKind,
  TargetPrecision,
} from "./types";

export const CANONICAL_A_GENERATOR_VERSION = "a-canonical-1.2.0";

export const canonicalAAbilityIds = [
  "A-ADD-01",
  "A-SUB-01",
  "A-COM-01",
  "A-MUL-01",
  "A-MUL-02",
  "A-MUL-03",
  "A-MUL-04",
  "A-MUL-05",
  "A-FRA-01",
  "A-PCT-01",
] as const satisfies readonly SkillId[];

export type CanonicalAAbilityId = (typeof canonicalAAbilityIds)[number];

const canonicalAAbilitySet = new Set<string>(canonicalAAbilityIds);

export function isCanonicalAAbilityId(
  value: unknown,
): value is CanonicalAAbilityId {
  return typeof value === "string" && canonicalAAbilitySet.has(value);
}

const bandLevel: Record<DifficultyBand, 2 | 3 | 5> = {
  L1: 2,
  L2: 3,
  L3: 5,
};

const randomInteger = (context: GenerationContext, min: number, max: number) =>
  Math.floor(context.random() * (max - min + 1)) + min;

const choose = <T>(context: GenerationContext, values: readonly T[]): T =>
  values[randomInteger(context, 0, values.length - 1)];

function shuffle<T>(context: GenerationContext, values: readonly T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomInteger(context, 0, index);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function cleanNumber(value: number, decimals = 6): string {
  const rounded = Number(value.toFixed(decimals));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function acceptedAround(value: number, tolerance: number) {
  const epsilon = Number.EPSILON * Math.max(1, Math.abs(value));
  return {
    min: value - tolerance - epsilon,
    max: value + tolerance + epsilon,
  };
}

function makeQuestion(input: {
  context: GenerationContext;
  abilityId: CanonicalAAbilityId;
  difficultyBand: DifficultyBand;
  prompt: string;
  answer: string;
  inputKind: StructuredInputKind;
  primaryStructure: string;
  data?: GeneratedQuestion["data"];
  secondaryTags?: string[];
  targetPrecision?: TargetPrecision;
  acceptedRange?: GeneratedQuestion["acceptedRange"];
  generatorParams?: GeneratedQuestion["generatorParams"];
  allowedAnswerSet?: GeneratedQuestion["allowedAnswerSet"];
}): GeneratedQuestion {
  const definition = getSkillDefinition(input.abilityId);
  const structureTags = Array.from(
    new Set([
      input.primaryStructure,
      ...(input.secondaryTags ?? []),
      input.difficultyBand.toLowerCase(),
    ]),
  );
  return {
    id: input.context.createId(),
    type: "skill_drill",
    subtype: "skill_drill",
    prompt: input.prompt,
    answer: input.answer,
    acceptedRange: input.acceptedRange,
    data: input.data ?? {},
    difficulty: {
      level: bandLevel[input.difficultyBand],
      tags: ["A层正式能力", ...structureTags],
    },
    primaryStructure: input.primaryStructure,
    secondaryTags: input.secondaryTags ?? [],
    generationRuleVersion: CANONICAL_A_GENERATOR_VERSION,
    skillId: input.abilityId,
    difficultyBand: input.difficultyBand,
    structureTags,
    targetPrecision: input.targetPrecision ?? "exact",
    generatorParams: {
      generatorFamily: "a_canonical",
      abilityId: input.abilityId,
      ...(input.generatorParams ?? {}),
    },
    allowedAnswerSet: input.allowedAnswerSet,
    masteryProfile: definition.masteryProfile,
    inputKind: input.inputKind,
  };
}

function choicePayload(
  values: readonly string[],
  labels: readonly string[] = values,
): GeneratedQuestion["data"] {
  return { choiceValues: [...values], choiceLabels: [...labels] };
}

function fourNumericChoices(
  context: GenerationContext,
  correct: number,
  candidates: readonly number[],
) {
  const unique = new Set<number>([correct]);
  for (const candidate of candidates) {
    if (Number.isFinite(candidate)) unique.add(candidate);
    if (unique.size >= 4) break;
  }
  let offset = 2;
  while (unique.size < 4) {
    unique.add(correct + offset);
    if (unique.size < 4) unique.add(correct - offset);
    offset += 1;
  }
  return shuffle(context, [...unique].slice(0, 4).map(String));
}

function additionCarryCount(a: number, b: number) {
  let left = a;
  let right = b;
  let carry = 0;
  let count = 0;
  let consecutive = 0;
  let maxConsecutive = 0;
  while (left > 0 || right > 0) {
    const sum = (left % 10) + (right % 10) + carry;
    carry = sum >= 10 ? 1 : 0;
    if (carry) {
      count += 1;
      consecutive += 1;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 0;
    }
    left = Math.floor(left / 10);
    right = Math.floor(right / 10);
  }
  return { count, maxConsecutive };
}

function subtractionBorrowProfile(a: number, b: number) {
  let left = Math.max(a, b);
  let right = Math.min(a, b);
  let borrow = 0;
  let borrowCount = 0;
  let crossedZero = false;
  while (left > 0 || right > 0) {
    const originalDigit = left % 10;
    const leftDigit = originalDigit - borrow;
    const rightDigit = right % 10;
    const nextBorrow = leftDigit < rightDigit ? 1 : 0;
    if (nextBorrow) {
      borrowCount += 1;
      if (originalDigit === 0) crossedZero = true;
    }
    borrow = nextBorrow;
    left = Math.floor(left / 10);
    right = Math.floor(right / 10);
  }
  return { borrowCount, crossedZero };
}

function twoByOneCarryCount(a: number, b: number) {
  const onesCarry = (a % 10) * b >= 10;
  const tensTotal = Math.floor(a / 10) * b + Math.floor(((a % 10) * b) / 10);
  const secondCarry = tensTotal >= 10;
  return Number(onesCarry) + Number(secondCarry);
}

function additionPair(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
): [number, number] {
  if (difficultyBand === "L1") {
    const targetCarry = context.random() < 0.6 ? 0 : 1;
    for (let attempt = 0; attempt < 160; attempt += 1) {
      const a = randomInteger(context, 10, 99);
      const b = randomInteger(context, 10, 99);
      if (additionCarryCount(a, b).count === targetCarry) return [a, b];
    }
    return targetCarry === 0 ? [23, 41] : [27, 15];
  }

  if (difficultyBand === "L2") {
    const mixedDigits = context.random() < 0.5;
    for (let attempt = 0; attempt < 160; attempt += 1) {
      let a = randomInteger(context, 100, 999);
      let b = mixedDigits
        ? randomInteger(context, 10, 99)
        : randomInteger(context, 100, 999);
      if (context.random() < 0.5) [a, b] = [b, a];
      if (additionCarryCount(a, b).count >= 1) return [a, b];
    }
    return mixedDigits ? [278, 65] : [278, 165];
  }

  const targetContinuous = context.random() < 0.6;
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const a = randomInteger(context, 100, 999);
    const b = randomInteger(context, 100, 999);
    const carry = additionCarryCount(a, b);
    const containsZero = `${a}${b}`.includes("0");
    if (
      carry.count >= 2 &&
      (targetContinuous ? carry.maxConsecutive >= 2 : containsZero)
    )
      return [a, b];
  }
  return targetContinuous ? [587, 468] : [590, 487];
}

function additionQuestion(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
) {
  const [a, b] = additionPair(difficultyBand, context);
  const carry = additionCarryCount(a, b);
  const digits = `${String(a).length}d_${String(b).length}d`;
  return makeQuestion({
    context,
    abilityId: "A-ADD-01",
    difficultyBand,
    prompt: `${a}＋${b}＝`,
    answer: String(a + b),
    inputKind: "number",
    primaryStructure: `addition_${digits}`,
    secondaryTags: [
      carry.count === 0
        ? "no_carry"
        : carry.count === 1
          ? "single_carry"
          : "multi_carry",
      ...(carry.maxConsecutive >= 2 ? ["continuous_carry"] : []),
      ...(`${a}${b}`.includes("0") ? ["contains_zero"] : []),
    ],
    data: { a, b, carryCount: carry.count },
    generatorParams: { a, b, carryCount: carry.count },
  });
}

type SubtractionSign = "positive" | "negative" | "zero";
type SubtractionTarget =
  "standard" | "near_difference" | "cross_zero" | "multi_borrow";

function chooseSubtractionSign(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
): SubtractionSign {
  const roll = context.random();
  if (difficultyBand === "L1") {
    if (roll < 0.05) return "zero";
    if (roll < 0.2) return "negative";
    return "positive";
  }
  if (difficultyBand === "L2") {
    if (roll < 0.08) return "zero";
    if (roll < 0.38) return "negative";
    return "positive";
  }
  if (roll < 0.1) return "zero";
  if (roll < 0.5) return "negative";
  return "positive";
}

function chooseSubtractionTarget(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
): SubtractionTarget {
  if (difficultyBand === "L1") return "standard";
  const roll = context.random();
  if (difficultyBand === "L2") {
    if (roll < 0.45) return "standard";
    if (roll < 0.7) return "near_difference";
    if (roll < 0.85) return "cross_zero";
    return "multi_borrow";
  }
  if (roll < 0.15) return "standard";
  if (roll < 0.45) return "near_difference";
  if (roll < 0.75) return "cross_zero";
  return "multi_borrow";
}

function applySubtractionSign(
  low: number,
  high: number,
  sign: Exclude<SubtractionSign, "zero">,
): [number, number] {
  return sign === "positive" ? [high, low] : [low, high];
}

function subtractionPair(
  difficultyBand: DifficultyBand,
  sign: SubtractionSign,
  target: SubtractionTarget,
  context: GenerationContext,
): [number, number] {
  const min = difficultyBand === "L1" ? 10 : 100;
  const max = difficultyBand === "L1" ? 99 : 999;
  if (sign === "zero") {
    const value = randomInteger(context, min, max);
    return [value, value];
  }

  if (target === "near_difference") {
    const difference = randomInteger(context, 1, 30);
    const low = randomInteger(context, min, max - difference);
    return applySubtractionSign(low, low + difference, sign);
  }

  const predicate = (a: number, b: number) => {
    const borrow = subtractionBorrowProfile(a, b);
    if (difficultyBand === "L1")
      return borrow.borrowCount <= 1 && !borrow.crossedZero;
    if (target === "cross_zero") return borrow.crossedZero;
    if (target === "multi_borrow") return borrow.borrowCount >= 2;
    return true;
  };

  for (let attempt = 0; attempt < 240; attempt += 1) {
    const first = randomInteger(context, min, max);
    const second = randomInteger(context, min, max);
    if (first === second) continue;
    const low = Math.min(first, second);
    const high = Math.max(first, second);
    const [a, b] = applySubtractionSign(low, high, sign);
    if (predicate(a, b)) return [a, b];
  }

  if (difficultyBand === "L1") return sign === "positive" ? [84, 31] : [31, 84];
  if (target === "cross_zero")
    return sign === "positive" ? [502, 478] : [478, 502];
  if (target === "multi_borrow")
    return sign === "positive" ? [654, 278] : [278, 654];
  return sign === "positive" ? [684, 178] : [178, 684];
}

function subtractionQuestion(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
) {
  const sign = chooseSubtractionSign(difficultyBand, context);
  const target = chooseSubtractionTarget(difficultyBand, context);
  const [a, b] = subtractionPair(difficultyBand, sign, target, context);
  const result = a - b;
  const borrow = subtractionBorrowProfile(a, b);
  return makeQuestion({
    context,
    abilityId: "A-SUB-01",
    difficultyBand,
    prompt: `${a}－${b}＝`,
    answer: String(result),
    inputKind: "number",
    primaryStructure: `subtraction_${String(a).length}d_${String(b).length}d`,
    secondaryTags: [
      result > 0
        ? "positive_result"
        : result < 0
          ? "negative_result"
          : "zero_result",
      `borrow_count_${borrow.borrowCount}`,
      ...(borrow.crossedZero ? ["cross_zero"] : []),
      ...(Math.abs(result) <= 30 ? ["near_difference"] : []),
    ],
    data: {
      a,
      b,
      result,
      borrowCount: borrow.borrowCount,
      crossedZero: borrow.crossedZero,
    },
    generatorParams: {
      a,
      b,
      resultSign: result > 0 ? "positive" : result < 0 ? "negative" : "zero",
      subtractionTarget: sign === "zero" ? "zero" : target,
    },
  });
}

const specialDifferenceAnchors = [111, 125, 143, 167, 250, 333] as const;

function nearDifferenceQuestion(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
) {
  const range =
    difficultyBand === "L1"
      ? { min: 1, max: 5 }
      : difficultyBand === "L2"
        ? { min: 6, max: 10 }
        : { min: 11, max: 30 };
  const magnitude = randomInteger(context, range.min, range.max);
  const signedDifference = context.random() < 0.5 ? magnitude : -magnitude;
  const useSpecialAnchor = context.random() < 0.3;
  let right: number;
  if (useSpecialAnchor) {
    right = choose(context, specialDifferenceAnchors);
  } else {
    const minimumRight =
      signedDifference < 0 ? Math.max(20, magnitude + 1) : 20;
    const maximumRight =
      signedDifference > 0 ? Math.min(970, 999 - magnitude) : 970;
    right = randomInteger(context, minimumRight, maximumRight);
  }
  const left = right + signedDifference;
  const choices = fourNumericChoices(context, signedDifference, [
    -signedDifference,
    signedDifference + 1,
    signedDifference - 1,
    signedDifference + (signedDifference > 0 ? -2 : 2),
  ]);
  return makeQuestion({
    context,
    abilityId: "A-COM-01",
    difficultyBand,
    prompt: `${left}－${right}＝`,
    answer: String(signedDifference),
    inputKind: "choice",
    primaryStructure: `near_difference_${range.min}_to_${range.max}`,
    secondaryTags: [
      signedDifference > 0 ? "positive_result" : "negative_result",
      ...(useSpecialAnchor ? ["special_anchor"] : []),
    ],
    data: {
      left,
      right,
      absoluteDifference: magnitude,
      signedDifference,
      ...choicePayload(choices),
    },
    generatorParams: {
      left,
      right,
      differenceBand: `${range.min}-${range.max}`,
      specialAnchor: useSpecialAnchor ? right : 0,
    },
    allowedAnswerSet: [String(signedDifference)],
  });
}

function multiplicationFactFactors(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
): [number, number] {
  if (difficultyBand === "L1") {
    if (context.random() < 0.8)
      return [randomInteger(context, 2, 6), randomInteger(context, 2, 6)];
    return [randomInteger(context, 2, 9), randomInteger(context, 2, 9)];
  }

  if (difficultyBand === "L2")
    return [randomInteger(context, 2, 9), randomInteger(context, 2, 9)];

  if (context.random() < 0.8) {
    const high = randomInteger(context, 6, 9);
    const other = randomInteger(context, 2, 9);
    return context.random() < 0.5 ? [high, other] : [other, high];
  }
  return [randomInteger(context, 2, 9), randomInteger(context, 2, 9)];
}

function multiplicationFactQuestion(
  abilityId: "A-MUL-01" | "A-MUL-02",
  difficultyBand: DifficultyBand,
  context: GenerationContext,
) {
  const [a, b] = multiplicationFactFactors(difficultyBand, context);
  const product = a * b;
  const highFact = a >= 6 || b >= 6;

  if (abilityId === "A-MUL-01") {
    const choices = fourNumericChoices(context, product, [
      a * Math.max(2, b - 1),
      a * Math.min(9, b + 1),
      Math.max(2, a - 1) * b,
      Math.min(9, a + 1) * b,
      product + 1,
    ]);
    return makeQuestion({
      context,
      abilityId,
      difficultyBand,
      prompt: `${a}×${b}＝?`,
      answer: String(product),
      inputKind: "choice",
      primaryStructure: highFact ? "high_fact_6_to_9" : "basic_fact_2_to_5",
      data: { a, b, product, ...choicePayload(choices) },
      generatorParams: { factorA: a, factorB: b, direction: "forward" },
      allowedAnswerSet: [String(product)],
    });
  }

  const missingLeft = context.random() < 0.5;
  const correct = missingLeft ? a : b;
  const factorChoices = shuffle(
    context,
    Array.from(
      new Set([
        correct,
        Math.max(2, correct - 1),
        Math.min(9, correct + 1),
        correct <= 5 ? Math.min(9, correct + 2) : Math.max(2, correct - 2),
        missingLeft ? b : a,
      ]),
    )
      .slice(0, 4)
      .map(String),
  );
  while (factorChoices.length < 4) {
    const candidate = String(randomInteger(context, 2, 9));
    if (!factorChoices.includes(candidate)) factorChoices.push(candidate);
  }
  return makeQuestion({
    context,
    abilityId,
    difficultyBand,
    prompt: missingLeft ? `□×${b}＝${product}` : `${a}×□＝${product}`,
    answer: String(correct),
    inputKind: "choice",
    primaryStructure: highFact ? "inverse_high_fact" : "inverse_basic_fact",
    data: {
      a,
      b,
      product,
      missingSide: missingLeft ? "left" : "right",
      ...choicePayload(factorChoices),
    },
    generatorParams: {
      factorA: a,
      factorB: b,
      direction: "inverse",
      missingSide: missingLeft ? "left" : "right",
    },
    allowedAnswerSet: [String(correct)],
  });
}

function twoByOneTargetCarry(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
): 0 | 1 | 2 | "any" {
  const roll = context.random();
  if (difficultyBand === "L1") return roll < 0.65 ? 0 : 1;
  if (difficultyBand === "L2") {
    if (roll < 0.3) return 0;
    if (roll < 0.7) return 1;
    return 2;
  }
  if (roll < 0.7) return 2;
  if (roll < 0.95) return 1;
  return 0;
}

function twoByOnePair(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
): [number, number] {
  const targetCarry = twoByOneTargetCarry(difficultyBand, context);
  const maxMultiplier = difficultyBand === "L1" ? 5 : 9;
  if (targetCarry === "any")
    return [
      randomInteger(context, 10, 99),
      randomInteger(context, 2, maxMultiplier),
    ];

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const a = randomInteger(context, 10, 99);
    const b = randomInteger(context, 2, maxMultiplier);
    if (twoByOneCarryCount(a, b) === targetCarry) return [a, b];
  }

  if (targetCarry === 0) return [23, 2];
  if (targetCarry === 1) return [27, 3];
  return [68, 7];
}

function twoByOneQuestion(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
) {
  const [a, b] = twoByOnePair(difficultyBand, context);
  const carryCount = twoByOneCarryCount(a, b);
  return makeQuestion({
    context,
    abilityId: "A-MUL-03",
    difficultyBand,
    prompt: `${a}×${b}＝`,
    answer: String(a * b),
    inputKind: "number",
    primaryStructure: "two_by_one",
    secondaryTags: [
      carryCount === 0
        ? "no_carry"
        : carryCount === 1
          ? "single_carry"
          : "multi_carry",
      ...(a % 10 === 0 ? ["round_ten"] : []),
    ],
    data: { a, b, carryCount },
    generatorParams: { a, b, carryCount },
  });
}


function twoByTwoCarryLoad(a: number, b: number) {
  const ones = b % 10;
  const tens = Math.floor(b / 10);
  const partialOnes = a * ones;
  const partialTens = a * tens * 10;
  return (
    twoByOneCarryCount(a, ones) +
    twoByOneCarryCount(a, tens) +
    additionCarryCount(partialOnes, partialTens).count
  );
}

function twoByTwoPair(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
): [number, number] {
  const target =
    difficultyBand === "L1"
      ? { min: 0, max: 1 }
      : difficultyBand === "L2"
        ? { min: 2, max: 3 }
        : { min: 4, max: 6 };

  for (let attempt = 0; attempt < 600; attempt += 1) {
    const a = randomInteger(context, 10, 99);
    const b = randomInteger(context, 10, 99);
    const warmupRoundTen = a % 10 === 0 || b % 10 === 0;
    if (warmupRoundTen && context.random() >= 0.12) continue;
    const carryLoad = twoByTwoCarryLoad(a, b);
    if (carryLoad >= target.min && carryLoad <= target.max) return [a, b];
  }

  if (difficultyBand === "L1") return [21, 31];
  if (difficultyBand === "L2") return [47, 23];
  return [68, 79];
}

function twoByTwoQuestion(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
) {
  const [a, b] = twoByTwoPair(difficultyBand, context);
  const carryLoad = twoByTwoCarryLoad(a, b);
  return makeQuestion({
    context,
    abilityId: "A-MUL-04",
    difficultyBand,
    prompt: `${a}×${b}＝`,
    answer: String(a * b),
    inputKind: "number",
    primaryStructure: "two_by_two",
    secondaryTags: [
      carryLoad <= 1
        ? "low_carry_load"
        : carryLoad <= 3
          ? "medium_carry_load"
          : "high_carry_load",
      ...(a % 10 === 0 || b % 10 === 0 ? ["round_ten_warmup"] : []),
    ],
    data: { a, b, carryLoad },
    generatorParams: { a, b, carryLoad },
  });
}

function percentFactor(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
) {
  if (difficultyBand === "L1") {
    return randomInteger(context, 1, 19) * 5;
  }
  if (difficultyBand === "L2") {
    return context.random() < 0.5
      ? randomInteger(context, 10, 99)
      : randomInteger(context, 10, 999) / 10;
  }
  let value = randomInteger(context, 11, 999) / 10;
  if (Number.isInteger(value)) value += 0.1;
  return value;
}

function percentByPercentQuestion(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
) {
  const leftPercent = percentFactor(difficultyBand, context);
  const rightPercent = percentFactor(difficultyBand, context);
  const resultPercent = (leftPercent * rightPercent) / 100;
  const answer = `${resultPercent.toFixed(2)}%`;
  const leftDecimals = Number.isInteger(leftPercent) ? 0 : 1;
  const rightDecimals = Number.isInteger(rightPercent) ? 0 : 1;

  return makeQuestion({
    context,
    abilityId: "A-MUL-05",
    difficultyBand,
    prompt: `${leftPercent}%×${rightPercent}%＝?%`,
    answer,
    inputKind: "number",
    primaryStructure: "percent_by_percent",
    secondaryTags: [
      `decimal_places_${leftDecimals}_${rightDecimals}`,
      resultPercent < 1 ? "sub_one_percent_result" : "one_plus_percent_result",
      "percent_result_two_decimals",
    ],
    data: {
      leftPercent,
      rightPercent,
      leftDecimals,
      rightDecimals,
      resultPercent: Number(resultPercent.toFixed(2)),
    },
    generatorParams: {
      leftPercent,
      rightPercent,
      leftDecimals,
      rightDecimals,
    },
  });
}

type FixedRelation = {
  numerator: number;
  denominator: number;
  percent: string;
  relationKind: "exact" | "approximate";
};

const fixedRelations: readonly FixedRelation[] = [
  { numerator: 1, denominator: 2, percent: "50", relationKind: "exact" },
  {
    numerator: 1,
    denominator: 3,
    percent: "33.3",
    relationKind: "approximate",
  },
  { numerator: 1, denominator: 4, percent: "25", relationKind: "exact" },
  { numerator: 1, denominator: 5, percent: "20", relationKind: "exact" },
  {
    numerator: 1,
    denominator: 6,
    percent: "16.7",
    relationKind: "approximate",
  },
  {
    numerator: 1,
    denominator: 7,
    percent: "14.3",
    relationKind: "approximate",
  },
  { numerator: 1, denominator: 8, percent: "12.5", relationKind: "exact" },
  {
    numerator: 1,
    denominator: 9,
    percent: "11.1",
    relationKind: "approximate",
  },
  {
    numerator: 2,
    denominator: 7,
    percent: "28.6",
    relationKind: "approximate",
  },
  {
    numerator: 3,
    denominator: 7,
    percent: "42.9",
    relationKind: "approximate",
  },
  { numerator: 3, denominator: 8, percent: "37.5", relationKind: "exact" },
];

function fixedRelationPool(difficultyBand: DifficultyBand) {
  const l1 = new Set(["1/2", "1/4", "1/5", "1/8"]);
  const l2 = new Set([...l1, "1/3", "1/6", "1/9", "3/8"]);
  const approved =
    difficultyBand === "L1" ? l1 : difficultyBand === "L2" ? l2 : null;
  if (!approved) return fixedRelations;
  return fixedRelations.filter((relation) =>
    approved.has(`${relation.numerator}/${relation.denominator}`),
  );
}

function fractionPercentQuestion(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
) {
  const pool = fixedRelationPool(difficultyBand);
  const relation = choose(context, pool);
  const fraction = `${relation.numerator}/${relation.denominator}`;
  const fractionToPercent = context.random() < 0.5;
  const relationSymbol = relation.relationKind === "exact" ? "=" : "≈";

  if (fractionToPercent) {
    const nearby = [...fixedRelations]
      .filter((candidate) => candidate !== relation)
      .sort(
        (left, right) =>
          Math.abs(Number(left.percent) - Number(relation.percent)) -
          Math.abs(Number(right.percent) - Number(relation.percent)),
      )
      .slice(0, 6)
      .map((candidate) => candidate.percent);
    const choices = shuffle(
      context,
      [...new Set([relation.percent, ...nearby])].slice(0, 4),
    );
    return makeQuestion({
      context,
      abilityId: "A-FRA-01",
      difficultyBand,
      prompt: `${fraction} ${relationSymbol} ?`,
      answer: relation.percent,
      inputKind: "choice",
      primaryStructure:
        relation.numerator === 1
          ? "unit_fraction_to_percent"
          : "nonunit_fraction_to_percent",
      secondaryTags: [`${relation.relationKind}_relation`],
      data: {
        numerator: relation.numerator,
        denominator: relation.denominator,
        percent: relation.percent,
        relationKind: relation.relationKind,
        ...choicePayload(
          choices,
          choices.map((value) => `${value}%`),
        ),
      },
      generatorParams: {
        direction: "fraction_to_percent",
        fraction,
        percent: relation.percent,
        relationKind: relation.relationKind,
      },
      allowedAnswerSet: [relation.percent],
    });
  }

  const nearby = [...fixedRelations]
    .filter((candidate) => candidate !== relation)
    .sort(
      (left, right) =>
        Math.abs(Number(left.percent) - Number(relation.percent)) -
        Math.abs(Number(right.percent) - Number(relation.percent)),
    )
    .slice(0, 8)
    .map((candidate) => `${candidate.numerator}/${candidate.denominator}`);
  const choices = shuffle(
    context,
    [...new Set([fraction, ...nearby])].slice(0, 4),
  );
  return makeQuestion({
    context,
    abilityId: "A-FRA-01",
    difficultyBand,
    prompt: `${relation.percent}% ${relationSymbol} ?`,
    answer: fraction,
    inputKind: "choice",
    primaryStructure:
      relation.numerator === 1
        ? "percent_to_unit_fraction"
        : "percent_to_nonunit_fraction",
    secondaryTags: [`${relation.relationKind}_relation`],
    data: {
      numerator: relation.numerator,
      denominator: relation.denominator,
      percent: relation.percent,
      relationKind: relation.relationKind,
      ...choicePayload(choices),
    },
    generatorParams: {
      direction: "percent_to_fraction",
      fraction,
      percent: relation.percent,
      relationKind: relation.relationKind,
    },
    allowedAnswerSet: [fraction],
  });
}

type PercentAnchor = {
  label: string;
  ratio: number;
  friendlyUnit: number;
};

const percentAnchors: readonly PercentAnchor[] = [
  { label: "0.1%", ratio: 0.001, friendlyUnit: 1000 },
  { label: "1%", ratio: 0.01, friendlyUnit: 100 },
  { label: "2%", ratio: 0.02, friendlyUnit: 50 },
  { label: "2.5%", ratio: 0.025, friendlyUnit: 40 },
  { label: "3%", ratio: 0.03, friendlyUnit: 100 },
  { label: "5%", ratio: 0.05, friendlyUnit: 20 },
  { label: "10%", ratio: 0.1, friendlyUnit: 10 },
  { label: "12.5%", ratio: 0.125, friendlyUnit: 8 },
  { label: "20%", ratio: 0.2, friendlyUnit: 5 },
  { label: "25%", ratio: 0.25, friendlyUnit: 4 },
  { label: "33.3%", ratio: 1 / 3, friendlyUnit: 3 },
  { label: "50%", ratio: 0.5, friendlyUnit: 2 },
];

function percentageValueQuestion(
  difficultyBand: DifficultyBand,
  context: GenerationContext,
) {
  const anchor = choose(context, percentAnchors);
  let value: number;
  if (difficultyBand === "L1") {
    const minimumMultiplier = anchor.friendlyUnit >= 100 ? 1 : 10;
    const maximumMultiplier = anchor.friendlyUnit >= 100 ? 20 : 200;
    value =
      anchor.friendlyUnit *
      randomInteger(context, minimumMultiplier, maximumMultiplier);
  } else {
    value = randomInteger(context, difficultyBand === "L2" ? 100 : 101, 9999);
    if (difficultyBand === "L3" && value % 10 === 0) value += 3;
  }
  const result = value * anchor.ratio;
  const isApproximateThird = anchor.label === "33.3%";
  const tolerance = Math.max(0.1, Math.abs(result) * 0.005);
  return makeQuestion({
    context,
    abilityId: "A-PCT-01",
    difficultyBand,
    prompt: `求 ${value} 的 ${anchor.label}：`,
    answer: cleanNumber(result),
    inputKind: "number",
    primaryStructure:
      difficultyBand === "L1"
        ? "friendly_percent_block"
        : difficultyBand === "L2"
          ? "standard_percent_block"
          : "non_round_percent_block",
    secondaryTags: [
      Number.isInteger(result) ? "integer_result" : "decimal_result",
    ],
    targetPrecision: isApproximateThird ? "range" : "exact",
    acceptedRange: isApproximateThird
      ? acceptedAround(result, tolerance)
      : undefined,
    data: { value, rateAnchor: anchor.label, ratio: anchor.ratio, result },
    generatorParams: { value, rateAnchor: anchor.label, ratio: anchor.ratio },
  });
}

export function generateCanonicalAQuestion(
  abilityId: CanonicalAAbilityId,
  difficultyBand: DifficultyBand,
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion {
  if (abilityId === "A-ADD-01")
    return additionQuestion(difficultyBand, context);
  if (abilityId === "A-SUB-01")
    return subtractionQuestion(difficultyBand, context);
  if (abilityId === "A-COM-01")
    return nearDifferenceQuestion(difficultyBand, context);
  if (abilityId === "A-MUL-01" || abilityId === "A-MUL-02")
    return multiplicationFactQuestion(abilityId, difficultyBand, context);
  if (abilityId === "A-MUL-03")
    return twoByOneQuestion(difficultyBand, context);
  if (abilityId === "A-MUL-04")
    return twoByTwoQuestion(difficultyBand, context);
  if (abilityId === "A-MUL-05")
    return percentByPercentQuestion(difficultyBand, context);
  if (abilityId === "A-FRA-01")
    return fractionPercentQuestion(difficultyBand, context);
  return percentageValueQuestion(difficultyBand, context);
}

export function generateCanonicalASet(
  abilityId: CanonicalAAbilityId,
  difficultyBand: DifficultyBand,
  count: number,
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion[] {
  if (!Number.isInteger(count) || count <= 0)
    throw new RangeError("题量必须是正整数。");
  return Array.from({ length: count }, () =>
    generateCanonicalAQuestion(abilityId, difficultyBand, context),
  );
}

export function gradeCanonicalAQuestion(
  question: GeneratedQuestion,
  input: string,
) {
  if (!isCanonicalAAbilityId(question.skillId))
    throw new Error("Question does not use a canonical A ability.");

  if (question.inputKind === "choice") {
    const isCorrect = input === question.answer;
    return {
      isCorrect,
      accuracyLevel: isCorrect ? ("exact" as const) : ("wrong" as const),
    };
  }

  const actual = Number(input.replace("%", ""));
  const expected = Number(question.answer.replace("%", ""));
  if (!Number.isFinite(actual) || !Number.isFinite(expected))
    return { isCorrect: false, accuracyLevel: "wrong" as const };

  const epsilon = Number.EPSILON * Math.max(1, Math.abs(expected));
  if (Math.abs(actual - expected) <= epsilon)
    return { isCorrect: true, accuracyLevel: "exact" as const };

  if (
    question.acceptedRange &&
    actual >= question.acceptedRange.min &&
    actual <= question.acceptedRange.max
  )
    return { isCorrect: true, accuracyLevel: "accepted" as const };

  return { isCorrect: false, accuracyLevel: "wrong" as const };
}
