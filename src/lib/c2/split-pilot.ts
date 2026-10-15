import {
  registerCustomCGrader,
  type TrainingGradeResult,
} from "../grader-registry";
import type { GenerationContext } from "../generate";
import { productionGenerationContext } from "../generate";
import type { GeneratedQuestion, TrainingResponse } from "../types";
import { encodeC2Preset } from "./contract";
import { c2ParseDecimal } from "./decimal";
import { c2FormatNumber, c2PassesTarget, c2Round } from "./math";

// prettier-ignore
export const C2_SPLIT_GRADER_ID = "c2-split-actual-blocks-v1";
// prettier-ignore
export const C2_SPLIT_GENERATION_VERSION = "c2-split-pilot-v1";

/**
 * Existing familiar percentage vocabulary. This is NOT a signed difficulty
 * model or a new approval for 0.1%/0.2% micro-blocks.
 */
// prettier-ignore
export const C2_SPLIT_PILOT_BLOCKS = [
  100, 50, 25, 20, 10, 5, 2, 1, 0.5,
] as const;

// prettier-ignore
export type C2SplitSubmission = {
  blocks: { percent: number; amount: number; remainder: number }[];
  finalPercent: number;
};

/** Strictly read only steps the learner actually chose to enter. */
// prettier-ignore
export function c2ParseSplitResponse(
  response: TrainingResponse,
): C2SplitSubmission | undefined {
  if (response.kind !== "structured") return undefined;
  const { fields } = response;
  const count = c2ParseDecimal(fields.splitCount);
  if (
    count === undefined ||
    !Number.isSafeInteger(count) ||
    count < 1 ||
    count > 20
  )
    return undefined;
  const finalPercent = c2ParseDecimal(fields.splitFinalPercent);
  if (finalPercent === undefined) return undefined;
  const blocks: C2SplitSubmission["blocks"] = [];
  for (let i = 1; i <= count; i += 1) {
    const percent = c2ParseDecimal(fields[`splitPercent${i}`]);
    const amount = c2ParseDecimal(fields[`splitAmount${i}`]);
    const remainder = c2ParseDecimal(fields[`splitRemainder${i}`]);
    if (
      percent === undefined ||
      !C2_SPLIT_PILOT_BLOCKS.some((block) => Math.abs(percent) === block) ||
      amount === undefined ||
      remainder === undefined
    )
      return undefined;
    blocks.push({ percent, amount, remainder });
  }
  // A removed or unentered block is never silently incorporated into grading.
  if (
    Object.keys(fields).some((key) => {
      const match = /^split(?:Percent|Amount|Remainder)(\d+)$/.exec(key);
      return match !== null && Number(match[1]) > count;
    })
  )
    return undefined;
  return { blocks, finalPercent };
}

// prettier-ignore
const signedBlocks = C2_SPLIT_PILOT_BLOCKS.flatMap((value) => [
  value,
  -value,
]);

/** Admission requires an executable 1–3 familiar-block witness. The witness
 * is not stored or displayed as if it were the learner's solution.
 * This is a pilot shape filter, not an approved quota or fastest-route claim.
 */
// prettier-ignore
export function c2SplitHasPilotWitness(a: number, b: number): boolean {
  if (
    !Number.isSafeInteger(a) ||
    !Number.isSafeInteger(b) ||
    !(a > 0 && a < b) ||
    a / b < 0.2
  )
    return false;
  const goal = a / b;
  for (const first of signedBlocks) {
    if (c2PassesTarget(first / 100, goal)) return true;
    for (const second of signedBlocks) {
      if (c2PassesTarget((first + second) / 100, goal)) return true;
      for (const third of signedBlocks)
        if (c2PassesTarget((first + second + third) / 100, goal)) return true;
    }
  }
  return false;
}

// prettier-ignore
export function generateC2SplitQuestion(
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion {
  const coreB = Math.floor(context.random() * 601) + 350;
  const lo = Math.ceil(coreB * 0.2);
  const coreA = Math.floor(context.random() * (coreB - lo)) + lo;
  if (!c2SplitHasPilotWitness(coreA, coreB))
    throw new Error("quota_unfillable: Split familiar-block route absent");

  // C-004 pilot: raw numbers intentionally equal the displayed core.
  // The grader ALWAYS uses raw quotient fields, even for other frozen versions.
  const rawA = coreA;
  const rawB = coreB;
  return {
    id: context.createId(),
    type: "c_training",
    subtype: "c_task",
    prompt: `${rawA} ÷ ${rawB}`,
    answer: c2FormatNumber((rawA / rawB) * 100, 4),
    data: {
      c2TaskKind: "method_split",
      c2SplitRawA: rawA,
      c2SplitRawB: rawB,
      c2SplitCoreA: coreA,
      c2SplitCoreB: coreB,
      c2SplitReferencePercent: (rawA / rawB) * 100,
    },
    // Old question schema requires 1..5: placeholder is not a C2 L rating.
    difficulty: { level: 1, tags: ["C2", "split", "pilot_unclassified"] },
    primaryStructure: "c2_split_actual_blocks",
    secondaryTags: ["candidate_unclassified"],
    generationRuleVersion: C2_SPLIT_GENERATION_VERSION,
    inputKind: "structured",
    targetPrecision: "3%",
    cMeta: {
      project: "C2",
      mode: "method",
      preset: encodeC2Preset({ mode: "method", route: "split" }),
      grading: {
        kind: "custom",
        graderId: C2_SPLIT_GRADER_ID,
        version: C2_SPLIT_GRADER_ID,
      },
    },
  };
}

// prettier-ignore
function gradeC2Split(
  question: GeneratedQuestion,
  response: TrainingResponse,
): TrainingGradeResult {
  const submitted = c2ParseSplitResponse(response);
  const rawA = Number(question.data.c2SplitRawA);
  const rawB = Number(question.data.c2SplitRawB);
  const coreA = Number(question.data.c2SplitCoreA);
  const coreB = Number(question.data.c2SplitCoreB);
  if (
    !submitted ||
    ![rawA, rawB, coreA, coreB].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    return {
      isCorrect: false,
      accuracyLevel: "wrong",
      gradingMetrics: { gradingVersion: C2_SPLIT_GRADER_ID, invalidResponse: true },
    };

  const originalQuotient = rawA / rawB;
  const finalQuotient = submitted.finalPercent / 100;
  const finalPass = c2PassesTarget(finalQuotient, originalQuotient);
  let previous = coreA;
  let cumulative = 0;
  let firstSufficientStage = 0;
  let amountIdentityMatched = true;
  let remainderIdentityMatched = true;
  const actualPercents: number[] = [];
  const actualAmounts: number[] = [];
  const actualRemainders: number[] = [];

  for (const [index, block] of submitted.blocks.entries()) {
    cumulative += block.percent;
    actualPercents.push(block.percent);
    actualAmounts.push(block.amount);
    actualRemainders.push(block.remainder);
    if (
      firstSufficientStage === 0 &&
      c2PassesTarget(cumulative / 100, originalQuotient)
    )
      firstSufficientStage = index + 1;

    // Identity audit only; no unapproved local 5% tolerance, process grade
    // or mastery deduction. Decimal display normalization removes IEEE noise.
    if (c2Round(block.amount, 8) !== c2Round((block.percent * coreB) / 100, 8))
      amountIdentityMatched = false;
    if (c2Round(block.remainder, 8) !== c2Round(previous - block.amount, 8))
      remainderIdentityMatched = false;
    previous = block.remainder;
  }
  const cumulativeMatches =
    c2Round(cumulative, 8) === c2Round(submitted.finalPercent, 8);
  const processConsistent =
    amountIdentityMatched && remainderIdentityMatched && cumulativeMatches;

  return {
    isCorrect: finalPass,
    accuracyLevel: finalPass ? "accepted" : "wrong",
    relativeError:
      Math.abs(finalQuotient - originalQuotient) / originalQuotient,
    gradingMetrics: {
      gradingVersion: C2_SPLIT_GRADER_ID,
      finalPass,
      processConsistency: processConsistent ? "consistent" : "review_needed",
      amountIdentityMatched,
      remainderIdentityMatched,
      cumulativeMatches,
      finalPercent: submitted.finalPercent,
      cumulativePercent: c2Round(cumulative, 8),
      originalQuotient,
      enteredBlockCount: submitted.blocks.length,
      actualPercents,
      actualAmounts,
      actualRemainders,
      firstSufficientStage,
      continuedAfterEnough:
        firstSufficientStage > 0 &&
        submitted.blocks.length > firstSufficientStage,
    },
  };
}

// prettier-ignore
registerCustomCGrader(C2_SPLIT_GRADER_ID, gradeC2Split);
