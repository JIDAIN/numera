import {
  registerCustomCGrader,
  type TrainingGradeResult,
} from "../grader-registry";
import type { GenerationContext } from "../generate";
import { productionGenerationContext } from "../generate";
import type { GeneratedQuestion, TrainingResponse } from "../types";
import { encodeC2Preset } from "./contract";
import { c2ParseDecimal } from "./decimal";
import { c2FormatNumber, c2Round } from "./math";

export const C2_DIRECT_GRADER_ID = "c2-direct-significant-digits-v1";
export const C2_DIRECT_GENERATION_VERSION = "c2-direct-pilot-v1";

export type C2DirectFacts = {
  a: number;
  b: number;
  firstPlace: number;
  firstDigit: number;
  secondDigit: number;
  thirdDigit: number;
  requestedDigits: 2 | 3;
  firstProduct: number;
  firstRemainder: number;
  answer: string;
};

function integerInRange(value: unknown, min: number, max: number) {
  const parsed = c2ParseDecimal(value);
  if (
    parsed === undefined ||
    !Number.isInteger(parsed) ||
    parsed < min ||
    parsed > max
  )
    return undefined;
  return parsed;
}

/**
 * Direct's digits are TRUNCATED one at a time, never rounded to a nearby
 * quotient and never stopped by comprehensive's 3% criterion.
 * The integer core limits make all intermediate scaled numerators exact.
 */
export function c2DirectFacts(
  a: number,
  b: number,
  requestedDigits: 2 | 3,
): C2DirectFacts | undefined {
  if (
    !Number.isSafeInteger(a) ||
    !Number.isSafeInteger(b) ||
    a < 1 ||
    b < 1 ||
    (requestedDigits !== 2 && requestedDigits !== 3)
  )
    return undefined;

  const quotient = a / b;
  if (quotient < 0.2 || quotient > 5) return undefined;
  const exponent = quotient < 1 ? -1 : 0;
  const firstPlace = 10 ** exponent;
  const scale = 10 ** (2 - exponent);
  if (!Number.isSafeInteger(a * scale)) return undefined;
  const prefix = Math.floor((a * scale) / b);
  const firstDigit = Math.floor(prefix / 100);
  const secondDigit = Math.floor(prefix / 10) % 10;
  const thirdDigit = prefix % 10;
  if (firstDigit < 1 || firstDigit > 9) return undefined;

  const firstProduct = c2Round(firstDigit * firstPlace * b, 6);
  const firstRemainder = c2Round(a - firstProduct, 6);
  const digits = firstDigit * 10 + secondDigit;
  const value =
    (requestedDigits === 2 ? digits : digits * 10 + thirdDigit) *
    (requestedDigits === 2 ? firstPlace / 10 : firstPlace / 100);

  return {
    a,
    b,
    firstPlace,
    firstDigit,
    secondDigit,
    thirdDigit,
    requestedDigits,
    firstProduct,
    firstRemainder,
    answer: c2FormatNumber(value, 6),
  };
}

export function c2DirectCompose(
  first: unknown,
  second: unknown,
  third: unknown,
  place: number,
  requestedDigits: 2 | 3,
): string | undefined {
  const f = integerInRange(first, 1, 9);
  const s = integerInRange(second, 0, 9);
  const t = requestedDigits === 3 ? integerInRange(third, 0, 9) : 0;
  if (f === undefined || s === undefined || t === undefined) return undefined;
  const quotient =
    (f * 10 + s + (requestedDigits === 3 ? t / 10 : 0)) * (place / 10);
  return c2FormatNumber(quotient, 6);
}

export function generateC2DirectQuestion(
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion {
  const b = Math.floor(context.random() * 751) + 125;
  const minA = Math.max(100, Math.ceil(b * 0.2));
  const maxA = Math.min(999, Math.floor(b * 5));
  const a = Math.floor(context.random() * (maxA - minA + 1)) + minA;
  const base = c2DirectFacts(a, b, 2);
  if (!base)
    throw new Error("quota_unfillable: Direct natural calculation core");
  // Pilot-only *structural* continuation: second place 0/9 and nonzero
  // third digit benefit from another long-division step. This is NOT an
  // approved third-digit ratio, L classifier, or 3% stop decision.
  const needsThird =
    (base.secondDigit === 0 || base.secondDigit === 9) &&
    base.thirdDigit !== 0;
  const requestedDigits: 2 | 3 = needsThird ? 3 : 2;
  const facts = c2DirectFacts(a, b, requestedDigits)!;
  return {
    id: context.createId(),
    type: "c_training",
    subtype: "c_task",
    prompt: `${a} ÷ ${b}`,
    answer: facts.answer,
    data: {
      c2TaskKind: "method_direct",
      c2DirectA: a,
      c2DirectB: b,
      c2DirectFirstPlace: facts.firstPlace,
      c2DirectRequestedDigits: requestedDigits,
      c2DirectFirstDigit: facts.firstDigit,
      c2DirectSecondDigit: facts.secondDigit,
      c2DirectThirdDigit: facts.thirdDigit,
      c2DirectFirstProduct: facts.firstProduct,
      c2DirectFirstRemainder: facts.firstRemainder,
      c2DirectFinalAnswer: facts.answer,
    },
    difficulty: { level: 0, tags: ["C2", "direct", "pilot_unclassified"] },
    primaryStructure: "c2_direct_significant_digits",
    secondaryTags: ["candidate_unclassified"],
    generationRuleVersion: C2_DIRECT_GENERATION_VERSION,
    inputKind: "structured",
    targetPrecision: "exact",
    cMeta: {
      project: "C2",
      mode: "method",
      preset: encodeC2Preset({ mode: "method", route: "direct" }),
      grading: {
        kind: "custom",
        graderId: C2_DIRECT_GRADER_ID,
        version: C2_DIRECT_GRADER_ID,
      },
    },
  };
}

function gradeC2Direct(
  question: GeneratedQuestion,
  response: TrainingResponse,
): TrainingGradeResult {
  const fields = response.kind === "structured" ? response.fields : {};
  const first = integerInRange(fields.firstQuotientDigit, 1, 9);
  const product = c2ParseDecimal(fields.firstDigitProduct);
  const remainder = c2ParseDecimal(fields.remainderAfterFirstDigit);
  const second = integerInRange(fields.secondQuotientDigit, 0, 9);
  const requested = Number(question.data.c2DirectRequestedDigits);
  let third: number | undefined;
  if (requested === 3)
    third = integerInRange(fields.thirdQuotientDigit, 0, 9);
  const a = Number(question.data.c2DirectA);
  const b = Number(question.data.c2DirectB);
  const place = Number(question.data.c2DirectFirstPlace);
  if (
    first === undefined ||
    product === undefined ||
    remainder === undefined ||
    second === undefined ||
    (requested === 3 && third === undefined) ||
    ![a, b, place].every(Number.isFinite) ||
    (requested !== 2 && requested !== 3)
  )
    return {
      isCorrect: false,
      accuracyLevel: "wrong",
      gradingMetrics: {
        gradingVersion: C2_DIRECT_GRADER_ID,
        invalidResponse: true,
      },
    };

  const composed = c2DirectCompose(
    first,
    second,
    third,
    place,
    requested as 2 | 3,
  )!;
  const finalPass = composed === String(question.data.c2DirectFinalAnswer);
  // Process checks compare EXACT long-division identities. They are separate
  // diagnostics, not a newly approved local numerical tolerance/L rule.
  const productExpectedFromInput = c2Round(first * place * b, 6);
  const remainderExpectedFromInput = c2Round(a - product, 6);
  const same = (left: number, right: number) =>
    Math.abs(left - right) <= 1e-8;
  const firstDigitValid = first === Number(question.data.c2DirectFirstDigit);
  const productValid = same(product, productExpectedFromInput);
  const remainderValid = same(remainder, remainderExpectedFromInput);
  const secondDigitValid =
    second === Number(question.data.c2DirectSecondDigit);
  const thirdDigitValid =
    requested !== 3 || third === Number(question.data.c2DirectThirdDigit);
  const processConsistent =
    firstDigitValid &&
    productValid &&
    remainderValid &&
    secondDigitValid &&
    thirdDigitValid;

  return {
    isCorrect: finalPass,
    accuracyLevel: finalPass ? "exact" : "wrong",
    gradingMetrics: {
      gradingVersion: C2_DIRECT_GRADER_ID,
      finalPass,
      processConsistency: processConsistent ? "consistent" : "review_needed",
      submittedFinal: composed,
      targetFinal: String(question.data.c2DirectFinalAnswer),
      requestedSignificantDigits: requested,
      firstDigitValid,
      productValid,
      remainderValid,
      secondDigitValid,
      thirdDigitValid,
      actualFirstProduct: product,
      actualFirstRemainder: remainder,
      expectedFirstProduct: Number(question.data.c2DirectFirstProduct),
      expectedFirstRemainder: Number(question.data.c2DirectFirstRemainder),
    },
  };
}

registerCustomCGrader(C2_DIRECT_GRADER_ID, gradeC2Direct);
