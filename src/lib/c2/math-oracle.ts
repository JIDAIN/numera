import { C2_SUPPORT_NXR_TOLERANCE, C2_TARGET_PRECISION } from "./contract";
import {
  c2RelativeError,
  c2Round,
  c2TruncateToSignificantDigits,
} from "./math";

/**
 * E2 research / regression oracle, NOT a runtime grader or question-admission rule.
 * In particular, arithmetic feasibility here says nothing about route cost,
 * L1/L2/L3, approved mental actions, or eligibility to publish questions.
 */
function positivePair(a: number, b: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0;
}

function finite(value: number): boolean {
  return Number.isFinite(value);
}

export function auditC2RawApproximation(
  rawA: number,
  rawB: number,
  submittedQuotient: number,
) {
  if (!positivePair(rawA, rawB) || !finite(submittedQuotient)) return undefined;
  const exactQuotient = rawA / rawB;
  const relativeError = c2RelativeError(submittedQuotient, exactQuotient);
  return {
    target: "raw_quotient_3_percent" as const,
    exactQuotient,
    submittedQuotient,
    relativeError,
    passed: relativeError <= C2_TARGET_PRECISION + 1e-12,
  };
}

/**
 * Direct specialty asks for accurate, truncated significant quotient digits.
 * Its answer must NOT be rounded or marked using the 3% approximation rule.
 * This does not pretend to model the human long-division process or difficulty.
 */
export function auditC2DirectDigits(
  a: number,
  b: number,
  submitted: number,
  digits: 2 | 3 = 2,
) {
  if (!positivePair(a, b) || !finite(submitted)) return undefined;
  const exactQuotient = a / b;
  const expected = c2TruncateToSignificantDigits(exactQuotient, digits);
  const unit = 10 ** (Math.floor(Math.log10(exactQuotient)) - digits + 1);
  const passed = Math.abs(submitted - expected) <= unit * 1e-9;
  return {
    target: "direct_truncated_digits" as const,
    digits,
    exactQuotient,
    expected,
    submitted,
    passed,
    // Diagnostic only: this may exceed 3% while the direct answer is correct.
    rawRelativeError: c2RelativeError(submitted, exactQuotient),
  };
}

/**
 * A signed block is a fractional share of B: 0.50 means +50%, -0.05 means -5%.
 * No admission, supported-block vocabulary, route-cost or L label is inferred.
 */
export function auditC2SplitBlocks(
  a: number,
  b: number,
  signedBlocks: readonly number[],
) {
  if (!positivePair(a, b) || signedBlocks.some((block) => !finite(block)))
    return undefined;
  const exactQuotient = a / b;
  let estimate = 0;
  let firstPassingStep: number | undefined;
  const steps = signedBlocks.map((block, index) => {
    estimate += block;
    const amount = block * b;
    const remaining = a - estimate * b;
    const error = c2RelativeError(estimate, exactQuotient);
    const passed = error <= C2_TARGET_PRECISION + 1e-12;
    if (passed && firstPassingStep === undefined) firstPassingStep = index + 1;
    return {
      step: index + 1,
      signedBlock: block,
      amount,
      remaining,
      estimate,
      relativeError: error,
      passed,
    };
  });
  return {
    target: "split_math_only" as const,
    exactQuotient,
    steps,
    firstPassingStep,
  };
}

export type C2ScalingReferencePath =
  "repair_result" | "repair_numerator_r" | "repair_numerator_rough";

/**
 * Computes idealized stage references for an explicitly selected scaling path.
 * No process field is prefilled for the learner and no branch is auto-selected.
 * Rough-quotient numerator repair has NO assumed second-order formula.
 */
export function referenceC2ScalingStages(input: {
  a: number;
  b: number;
  baseline: number;
  path: C2ScalingReferencePath;
  roughQuotient?: number;
}) {
  const { a, b, baseline, path, roughQuotient } = input;
  if (!positivePair(a, b) || !finite(baseline) || baseline <= 0)
    return undefined;
  if (
    path === "repair_numerator_rough" &&
    (roughQuotient === undefined || !finite(roughQuotient))
  )
    return undefined;

  const exactQuotient = a / b;
  const delta = baseline - b;
  const signedR = delta / baseline;
  const q0 = a / baseline;
  let firstCorrection: number;
  let stage1: number;
  let stage2: number | undefined;
  let firstNumerator: number | undefined;
  let secondNumerator: number | undefined;

  if (path === "repair_result") {
    firstCorrection = q0 * signedR;
    stage1 = q0 + firstCorrection;
    stage2 = stage1 + Math.abs(firstCorrection) * Math.abs(signedR);
  } else {
    firstCorrection =
      path === "repair_numerator_rough" ? roughQuotient! * delta : a * signedR;
    firstNumerator = a + firstCorrection;
    stage1 = firstNumerator / baseline;
    if (path === "repair_numerator_r") {
      secondNumerator =
        firstNumerator + Math.abs(firstCorrection) * Math.abs(signedR);
      stage2 = secondNumerator / baseline;
    }
  }

  const stageError = (value: number) => c2RelativeError(value, exactQuotient);
  return {
    target: "scaling_ideal_stage_reference" as const,
    path,
    exactQuotient,
    delta,
    signedR,
    q0,
    firstCorrection,
    firstNumerator,
    secondNumerator,
    stage0: {
      value: q0,
      relativeError: stageError(q0),
      passed: stageError(q0) <= C2_TARGET_PRECISION + 1e-12,
    },
    stage1: {
      value: stage1,
      relativeError: stageError(stage1),
      passed: stageError(stage1) <= C2_TARGET_PRECISION + 1e-12,
    },
    stage2:
      stage2 === undefined
        ? undefined
        : {
            value: stage2,
            relativeError: stageError(stage2),
            passed: stageError(stage2) <= C2_TARGET_PRECISION + 1e-12,
          },
  };
}

/**
 * Solve-r specialty reports percent to one decimal place (0.1 percentage point).
 * A documented classroom shortcut is evidence for review, not automatically an
 * accepted alternate correct answer when strict and nominal rounding differ.
 */
export function auditC2RPercent(
  denominator: number,
  baseline: number,
  submittedPercent: number,
  nominalShortcutPercent?: number,
) {
  if (
    !positivePair(denominator, baseline) ||
    !finite(submittedPercent) ||
    (nominalShortcutPercent !== undefined && !finite(nominalShortcutPercent))
  )
    return undefined;
  const exactPercent = (100 * Math.abs(baseline - denominator)) / baseline;
  const displayedPercent = c2Round(exactPercent, 1);
  return {
    target: "r_0_1_percentage_point" as const,
    exactPercent,
    displayedPercent,
    submittedPercent,
    passed: Math.abs(c2Round(submittedPercent, 1) - displayedPercent) <= 1e-9,
    shortcutConflict:
      nominalShortcutPercent === undefined
        ? undefined
        : Math.abs(c2Round(nominalShortcutPercent, 1) - displayedPercent) >
          1e-9,
  };
}

/** N×r each-stage arithmetic oracle. Step 2 uses the user's ACTUAL C1. */
export function auditC2Nxr(input: {
  n: number;
  r: number;
  submittedC1: number;
  variant: "first_order" | "second_order";
  submittedC2?: number;
}) {
  const { n, r, submittedC1, submittedC2, variant } = input;
  if (!positivePair(n, 1) || !finite(r) || r < 0 || !finite(submittedC1))
    return undefined;
  if (submittedC2 !== undefined && !finite(submittedC2)) return undefined;
  const expectedC1 = n * r;
  const c1RelativeError = c2RelativeError(submittedC1, expectedC1);
  const c1Passed = c1RelativeError <= C2_SUPPORT_NXR_TOLERANCE + 1e-12;
  if (variant === "first_order")
    return {
      target: "nxr_each_stage_5_percent" as const,
      variant,
      expectedC1,
      c1RelativeError,
      c1Passed,
      passed: c1Passed,
      expectedC2FromUserC1: undefined,
      c2RelativeError: undefined,
      c2Passed: undefined,
    };
  const expectedC2FromUserC1 = Math.abs(submittedC1) * r;
  const c2SecondRelativeError =
    submittedC2 === undefined
      ? Number.POSITIVE_INFINITY
      : c2RelativeErrorFn(submittedC2, expectedC2FromUserC1);
  const c2Passed = c2SecondRelativeError <= C2_SUPPORT_NXR_TOLERANCE + 1e-12;
  return {
    target: "nxr_each_stage_5_percent" as const,
    variant,
    expectedC1,
    c1RelativeError,
    c1Passed,
    expectedC2FromUserC1,
    c2RelativeError: c2SecondRelativeError,
    c2Passed,
    passed: c1Passed && c2Passed,
  };
}

// Keep the imported relative-error helper distinct from the local metric name.
const c2RelativeErrorFn = c2RelativeError;
