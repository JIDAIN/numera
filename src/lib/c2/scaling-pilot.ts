import {
  registerCustomCGrader,
  type TrainingGradeResult,
} from "../grader-registry";
import type { GenerationContext } from "../generate";
import { productionGenerationContext } from "../generate";
import type { GeneratedQuestion, TrainingResponse } from "../types";
import { encodeC2Preset } from "./contract";
import { c2ParseDecimal } from "./decimal";
import {
  c2FormatNumber,
  c2PassesTarget,
  c2RelativeError,
  c2Round,
} from "./math";

export const C2_SCALING_GRADER_ID = "c2-scaling-real-process-v1";
export const C2_SCALING_GENERATION_VERSION = "c2-scaling-pilot-v1";
export type C2ScalingPath =
  "zero" | "result" | "numerator_r" | "numerator_rough";
export type C2ScalingSubmission = {
  path: C2ScalingPath;
  b0: number;
  delta: number;
  final: number;
  q0?: number;
  r?: number;
  rough?: number;
  c1?: number;
  a1?: number;
  q1?: number;
  c2?: number;
  a2?: number;
  q2?: number;
};
const paths: C2ScalingPath[] = [
  "zero",
  "result",
  "numerator_r",
  "numerator_rough",
];
const names: Record<keyof Omit<C2ScalingSubmission, "path">, string> = {
  b0: "scalingB0",
  delta: "scalingDelta",
  final: "scalingFinal",
  q0: "scalingQ0",
  r: "scalingR",
  rough: "scalingRough",
  c1: "scalingC1",
  a1: "scalingA1",
  q1: "scalingQ1",
  c2: "scalingC2",
  a2: "scalingA2",
  q2: "scalingQ2",
};

/** Only explicitly entered numeric fields are accepted. Unknown or
 * out-of-path fields are rejected, not silently inferred as user work.
 * r is a non-negative ratio (not a percentage) when actually used.
 */
export function c2ParseScalingResponse(
  response: TrainingResponse,
): C2ScalingSubmission | undefined {
  if (response.kind !== "structured") return undefined;
  const f = response.fields;
  if (
    typeof f.scalingPath !== "string" ||
    !paths.includes(f.scalingPath as C2ScalingPath)
  )
    return undefined;
  const path = f.scalingPath as C2ScalingPath;
  const second = f.scalingSecond === "yes";
  if (
    f.scalingSecond !== undefined &&
    f.scalingSecond !== "yes" &&
    f.scalingSecond !== "no"
  )
    return undefined;
  if (path === "zero" && f.scalingSecond !== undefined) return undefined;
  const required: (keyof typeof names)[] = ["b0", "delta", "final"];
  if (path === "zero" || path === "result") required.push("q0");
  if (path === "result" || path === "numerator_r") required.push("r");
  if (path === "numerator_rough") required.push("rough");
  if (path !== "zero") {
    required.push("c1", "q1");
    if (path !== "result") required.push("a1");
  }
  if (second) {
    required.push("c2", "q2");
    if (path !== "result") required.push("a2");
  }
  const parsed: Record<string, number> = {};
  for (const [key, field] of Object.entries(names)) {
    if (!required.includes(key as keyof typeof names)) {
      if (f[field] !== undefined) return undefined;
      continue;
    }
    const value = c2ParseDecimal(f[field]);
    if (value === undefined) return undefined;
    parsed[key] = value;
  }
  if (
    parsed.b0 <= 0 ||
    (parsed.r !== undefined && parsed.r < 0) ||
    (parsed.rough !== undefined && parsed.rough <= 0) ||
    (parsed.c2 !== undefined && path !== "numerator_rough" && parsed.c2 < 0)
  )
    return undefined;
  if (
    Object.keys(f).some(
      (k) =>
        !["scalingPath", "scalingSecond", ...Object.values(names)].includes(k),
    )
  )
    return undefined;
  return { path, ...parsed } as C2ScalingSubmission;
}

/** One candidate arithmetic shape, no machine L, path quota or oracle route.
 * Learners select B0 themselves. The generated expression is not a teacher's
 * question; raw and core coincide only in this pilot.
 */
export function generateC2ScalingQuestion(
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion {
  const b = Math.floor(context.random() * 231) + 120;
  const ratio = 0.2 + context.random() * 4.6;
  const a = Math.max(1, Math.round(b * ratio));
  return {
    id: context.createId(),
    type: "c_training",
    subtype: "c_task",
    prompt: `${a} ÷ ${b}`,
    answer: c2FormatNumber(a / b),
    data: {
      c2TaskKind: "method_scaling",
      c2ScalingRawA: a,
      c2ScalingRawB: b,
      c2ScalingCoreA: a,
      c2ScalingCoreB: b,
    },
    difficulty: { level: 1, tags: ["C2", "scaling", "pilot_unclassified"] },
    primaryStructure: "c2_scaling_real_process",
    secondaryTags: ["candidate_unclassified"],
    generationRuleVersion: C2_SCALING_GENERATION_VERSION,
    inputKind: "structured",
    targetPrecision: "3%",
    cMeta: {
      project: "C2",
      mode: "method",
      preset: encodeC2Preset({ mode: "method", route: "scaling" }),
      grading: {
        kind: "custom",
        graderId: C2_SCALING_GRADER_ID,
        version: C2_SCALING_GRADER_ID,
      },
    },
  };
}

function gradeC2Scaling(
  question: GeneratedQuestion,
  response: TrainingResponse,
): TrainingGradeResult {
  const user = c2ParseScalingResponse(response);
  const a = Number(question.data.c2ScalingCoreA);
  const b = Number(question.data.c2ScalingCoreB);
  const rawA = Number(question.data.c2ScalingRawA);
  const rawB = Number(question.data.c2ScalingRawB);
  if (!user || ![a, b, rawA, rawB].every((v) => Number.isFinite(v) && v > 0))
    return {
      isCorrect: false,
      accuracyLevel: "wrong",
      gradingMetrics: {
        gradingVersion: C2_SCALING_GRADER_ID,
        invalidResponse: true,
      },
    };

  const exact = rawA / rawB;
  const finalPass = c2PassesTarget(user.final, exact);
  // Approximations (Q0, r, rough quotient, multiplications and division)
  // permit deliberate mental rounding. Owner has not approved a local
  // numeric hard tolerance: only entered additive links are audited here.
  // Compare each reported destination at the precision actually written.
  const sameAtWrittenPrecision = (
    expected: number,
    key: keyof typeof names,
  ) => {
    const fields = response.kind === "structured" ? response.fields : {};
    const raw = fields[names[key]];
    if (typeof raw !== "string") return false;
    const decimals = Math.min(raw.split(".")[1]?.length ?? 0, 12);
    return c2Round(expected, decimals) === c2Round(user[key]!, decimals);
  };
  const checks: boolean[] = [sameAtWrittenPrecision(user.b0 - b, "delta")];
  if (user.path === "zero") {
    checks.push(sameAtWrittenPrecision(user.q0!, "final"));
  } else if (user.path === "result") {
    checks.push(sameAtWrittenPrecision(user.q0! + user.c1!, "q1"));
    if (user.c2 !== undefined)
      checks.push(sameAtWrittenPrecision(user.q1! + user.c2, "q2"));
  } else {
    checks.push(sameAtWrittenPrecision(a + user.c1!, "a1"));
    if (user.c2 !== undefined)
      checks.push(sameAtWrittenPrecision(user.a1! + user.c2, "a2"));
  }
  if (user.path !== "zero")
    checks.push(sameAtWrittenPrecision(user.q2 ?? user.q1!, "final"));
  const finalStage = user.c2 === undefined ? (user.path === "zero" ? 0 : 1) : 2;
  const initialSufficient =
    user.q0 !== undefined && c2PassesTarget(user.q0, exact);
  const oneSufficient = user.q1 !== undefined && c2PassesTarget(user.q1, exact);
  const firstSufficientStage = initialSufficient
    ? 0
    : oneSufficient
      ? 1
      : finalPass
        ? finalStage
        : -1;
  return {
    isCorrect: finalPass,
    accuracyLevel: finalPass ? "accepted" : "wrong",
    relativeError: c2RelativeError(user.final, exact),
    gradingMetrics: {
      gradingVersion: C2_SCALING_GRADER_ID,
      finalPass,
      processConsistency: checks.every(Boolean)
        ? "consistent"
        : "review_needed",
      processChecks: checks.map((ok) => (ok ? "ok" : "review")),
      approximateMultiplicationAndDivision: "not_verified_no_owner_local_threshold",
      actualPath: user.path,
      actualBaseline: user.b0,
      actualSignedDelta: user.delta,
      actualFinal: user.final,
      originalQuotient: exact,
      enteredStage: finalStage,
      firstSufficientStage,
      continuedAfterEnough:
        firstSufficientStage >= 0 && finalStage > firstSufficientStage,
    },
  };
}
registerCustomCGrader(C2_SCALING_GRADER_ID, gradeC2Scaling);
