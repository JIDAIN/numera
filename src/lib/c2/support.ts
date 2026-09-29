import { registerCustomCGrader } from "../grader-registry";
import { GenerationContext, productionGenerationContext } from "../generate";
import {
  DifficultyBand,
  GeneratedQuestion,
  StructuredResponseValue,
  TrainingResponse,
} from "../types";
import {
  C2_GENERATION_VERSION,
  C2_NXR_DEFAULT_MIXED_COUNT,
  C2_SUPPORT_NXR_GRADER_ID,
  C2_SUPPORT_NXR_TOLERANCE,
  C2_SUPPORT_R_DECIMALS,
  C2_SUPPORT_R_GRADER_ID,
  C2NxrVariant,
  encodeC2Preset,
} from "./contract";
import { c2FormatNumber, c2RelativeError, c2Round } from "./math";

const SPECIAL_BASELINES = [111, 125, 143, 167, 250, 333] as const;
const EASY_BASELINES = [
  100, 125, 200, 250, 300, 400, 500, 600, 700, 800, 900,
] as const;

function randomInteger(context: GenerationContext, min: number, max: number) {
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

function scalarNumber(value: StructuredResponseValue | undefined) {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().replaceAll(",", "").replace(/%$/, "");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function responseField(
  response: TrainingResponse,
  key: string,
): StructuredResponseValue | undefined {
  if (response.kind !== "structured") return undefined;
  return response.fields[key];
}

function answerScalar(response: TrainingResponse) {
  if (response.kind === "single") return scalarNumber(response.value);
  return scalarNumber(response.fields.value ?? response.fields.answer);
}

function roundedPercent(value: number) {
  return c2Round(value * 100, C2_SUPPORT_R_DECIMALS);
}

function supportRPair(
  band: DifficultyBand,
  context: GenerationContext,
): {
  b: number;
  b0: number;
  baselineType: "round" | "special" | "relation";
} {
  if (band === "L1") {
    const b0 = randomChoice(context, EASY_BASELINES);
    const percent = randomChoice(context, [1, 2, 4, 5, 8, 10] as const);
    const sign = context.random() < 0.5 ? -1 : 1;
    const rawDelta = (b0 * percent) / 100;
    const delta = Math.max(1, Math.round(rawDelta));
    return {
      b: Math.max(1, b0 + sign * delta),
      b0,
      baselineType: SPECIAL_BASELINES.includes(
        b0 as (typeof SPECIAL_BASELINES)[number],
      )
        ? "special"
        : "round",
    };
  }

  if (band === "L2") {
    const b0 = randomChoice(context, SPECIAL_BASELINES);
    const percent = randomInteger(context, 25, 100) / 10;
    const sign = context.random() < 0.5 ? -1 : 1;
    const delta = Math.max(2, Math.round((b0 * percent) / 100));
    return {
      b: Math.max(1, b0 + sign * delta),
      b0,
      baselineType: "special",
    };
  }

  let b0 = randomInteger(context, 118, 382);
  while (
    SPECIAL_BASELINES.includes(b0 as (typeof SPECIAL_BASELINES)[number]) ||
    b0 % 25 === 0 ||
    b0 % 10 === 0
  )
    b0 = randomInteger(context, 118, 382);

  const percent = randomInteger(context, 35, 145) / 10;
  const sign = context.random() < 0.5 ? -1 : 1;
  const delta = Math.max(2, Math.round((b0 * percent) / 100));
  return {
    b: Math.max(1, b0 + sign * delta),
    b0,
    baselineType: "relation",
  };
}

export function generateC2SupportRQuestion(
  difficultyBand: DifficultyBand,
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion {
  const pair = supportRPair(difficultyBand, context);
  const exactR = Math.abs(pair.b0 - pair.b) / pair.b0;
  const expected = roundedPercent(exactR);
  const preset = encodeC2Preset({ mode: "support", support: "r" });

  return {
    id: context.createId(),
    type: "c_training",
    subtype: "c_task",
    prompt: `B=${pair.b}，B₀=${pair.b0}，r = ?%`,
    answer: c2FormatNumber(expected, C2_SUPPORT_R_DECIMALS),
    data: {
      c2TaskKind: "support_r",
      c2B: pair.b,
      c2B0: pair.b0,
      c2ExactR: exactR,
      c2ExpectedRPercent: expected,
      c2BaselineType: pair.baselineType,
    },
    difficulty: {
      level: difficultyBand === "L1" ? 1 : difficultyBand === "L2" ? 3 : 5,
      tags: ["C2", "support_r", difficultyBand, pair.baselineType],
    },
    primaryStructure: `support_r_${pair.baselineType}`,
    secondaryTags: [difficultyBand],
    generationRuleVersion: C2_GENERATION_VERSION,
    difficultyBand,
    inputKind: "number",
    targetPrecision: "exact",
    cMeta: {
      project: "C2",
      mode: "support",
      preset,
      grading: {
        kind: "custom",
        graderId: C2_SUPPORT_R_GRADER_ID,
        version: C2_SUPPORT_R_GRADER_ID,
      },
    },
  };
}

function realisticR(
  variant: Exclude<C2NxrVariant, "mixed">,
  context: GenerationContext,
) {
  const tenths =
    variant === "ordinary"
      ? randomInteger(context, 31, context.random() < 0.86 ? 100 : 170)
      : randomInteger(context, 80, 200);
  return tenths / 1000;
}

export function generateC2SupportNxrQuestion(
  variant: Exclude<C2NxrVariant, "mixed">,
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion {
  const numeratorType = context.random() < 0.6;
  const n = numeratorType
    ? randomInteger(context, 100, 999)
    : c2Round(randomInteger(context, 50, 990) / 100, 2);
  const r = realisticR(variant, context);
  const exactC1 = n * r;
  const exactC2 = exactC1 * r;
  const preset = encodeC2Preset({ mode: "support", support: "nxr", variant });

  return {
    id: context.createId(),
    type: "c_training",
    subtype: "c_task",
    prompt:
      variant === "ordinary"
        ? `${c2FormatNumber(n)} × ${c2FormatNumber(r * 100, 1)}%`
        : `${c2FormatNumber(n)} × ${c2FormatNumber(r * 100, 1)}%，继续复用一阶结果再 × r`,
    answer: c2FormatNumber(exactC1),
    data: {
      c2TaskKind: "support_nxr",
      c2NxrVariant: variant,
      c2N: n,
      c2R: r,
      c2RPercent: r * 100,
      c2NType: numeratorType ? "numerator_scale" : "result_scale",
      c2ExactC1: exactC1,
      c2ExactC2: exactC2,
    },
    difficulty: {
      level: variant === "ordinary" ? 3 : 4,
      tags: ["C2", "support_nxr", variant],
    },
    primaryStructure: `support_nxr_${variant}`,
    secondaryTags: [
      numeratorType ? "numerator_scale" : "result_scale",
      r <= 0.1 ? "r_common" : "r_transfer",
    ],
    generationRuleVersion: C2_GENERATION_VERSION,
    inputKind: "structured",
    targetPrecision: "5%",
    cMeta: {
      project: "C2",
      mode: "support",
      preset,
      grading: {
        kind: "custom",
        graderId: C2_SUPPORT_NXR_GRADER_ID,
        version: C2_SUPPORT_NXR_GRADER_ID,
      },
    },
  };
}

export function generateC2SupportNxrSet(
  variant: C2NxrVariant,
  count: number,
  context: GenerationContext = productionGenerationContext,
) {
  if (!Number.isInteger(count) || count <= 0)
    throw new Error("C2 N×r question count must be a positive integer.");

  if (variant !== "mixed")
    return Array.from({ length: count }, () =>
      generateC2SupportNxrQuestion(variant, context),
    );

  if (count !== C2_NXR_DEFAULT_MIXED_COUNT)
    throw new Error("C2 N×r mixed V1 is locked to 10 questions.");

  return shuffle(context, [
    ...Array.from({ length: 7 }, () =>
      generateC2SupportNxrQuestion("ordinary", context),
    ),
    ...Array.from({ length: 3 }, () =>
      generateC2SupportNxrQuestion("second_order", context),
    ),
  ]).map((question) => ({
    ...question,
    cMeta: {
      ...question.cMeta!,
      preset: encodeC2Preset({
        mode: "support",
        support: "nxr",
        variant: "mixed",
      }),
    },
  }));
}

function gradeSupportR(
  question: GeneratedQuestion,
  response: TrainingResponse,
) {
  const user = answerScalar(response);
  const expected = Number(question.data.c2ExpectedRPercent);
  if (!Number.isFinite(user) || !Number.isFinite(expected))
    return {
      isCorrect: false,
      accuracyLevel: "wrong" as const,
      gradingMetrics: {
        gradingVersion: C2_SUPPORT_R_GRADER_ID,
        invalidResponse: true,
      },
    };

  const roundedUser = c2Round(user, C2_SUPPORT_R_DECIMALS);
  const pointError = roundedUser - expected;
  const passed = Math.abs(pointError) <= 1e-9;

  return {
    isCorrect: passed,
    accuracyLevel: passed ? ("exact" as const) : ("wrong" as const),
    gradingMetrics: {
      gradingVersion: C2_SUPPORT_R_GRADER_ID,
      targetRPercent: expected,
      submittedRPercent: user,
      roundedSubmittedRPercent: roundedUser,
      pointError,
    },
  };
}

function gradeSupportNxr(
  question: GeneratedQuestion,
  response: TrainingResponse,
) {
  const variant = String(question.data.c2NxrVariant);
  const r = Number(question.data.c2R);
  const exactC1 = Number(question.data.c2ExactC1);
  const first =
    response.kind === "single"
      ? scalarNumber(response.value)
      : scalarNumber(responseField(response, "firstCorrection"));

  if (
    !Number.isFinite(first) ||
    !Number.isFinite(r) ||
    !Number.isFinite(exactC1)
  )
    return {
      isCorrect: false,
      accuracyLevel: "wrong" as const,
      gradingMetrics: {
        gradingVersion: C2_SUPPORT_NXR_GRADER_ID,
        invalidResponse: true,
      },
    };

  const c1Error = c2RelativeError(first!, exactC1);
  const c1Passed = c1Error <= C2_SUPPORT_NXR_TOLERANCE + 1e-12;

  if (variant !== "second_order") {
    return {
      isCorrect: c1Passed,
      accuracyLevel: c1Passed ? ("accepted" as const) : ("wrong" as const),
      relativeError: c1Error,
      gradingMetrics: {
        gradingVersion: C2_SUPPORT_NXR_GRADER_ID,
        variant: "ordinary",
        targetC1: exactC1,
        submittedC1: first!,
        c1RelativeError: c1Error,
        c1Passed,
      },
    };
  }

  const second = scalarNumber(responseField(response, "secondCorrection"));
  const processExpectedC2 = Math.abs(first!) * r;
  const exactC2 = Number(question.data.c2ExactC2);
  const c2ProcessError = Number.isFinite(second)
    ? c2RelativeError(second!, processExpectedC2)
    : Number.POSITIVE_INFINITY;
  const c2Passed = c2ProcessError <= C2_SUPPORT_NXR_TOLERANCE + 1e-12;
  const passed = c1Passed && c2Passed;

  return {
    isCorrect: passed,
    accuracyLevel: passed ? ("accepted" as const) : ("wrong" as const),
    relativeError: Math.max(c1Error, c2ProcessError),
    gradingMetrics: {
      gradingVersion: C2_SUPPORT_NXR_GRADER_ID,
      variant: "second_order",
      targetC1: exactC1,
      submittedC1: first!,
      c1RelativeError: c1Error,
      c1Passed,
      processExpectedC2,
      exactC2,
      submittedC2: Number.isFinite(second) ? second! : Number.NaN,
      c2ProcessRelativeError: c2ProcessError,
      c2Passed,
      c2VsExactError: Number.isFinite(second)
        ? c2RelativeError(second!, exactC2)
        : Number.POSITIVE_INFINITY,
    },
  };
}

registerCustomCGrader(C2_SUPPORT_R_GRADER_ID, gradeSupportR);
registerCustomCGrader(C2_SUPPORT_NXR_GRADER_ID, gradeSupportNxr);
