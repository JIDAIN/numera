import {
  CGradingSpec,
  CProject,
  CQuestionMeta,
  GeneratedQuestion,
} from "./types";

export interface CGradeResult {
  isCorrect: boolean;
  accuracyLevel: "exact" | "accepted" | "wrong";
  relativeError?: number;
  gradingMetrics: Record<
    string,
    string | number | boolean | string[] | number[]
  >;
}

function normalizeComparisonAnswer(value: string) {
  return value.trim().replace("＞", ">").replace("＜", "<").replace("＝", "=");
}

function normalizeExactAnswer(
  value: string,
  mode: Extract<CGradingSpec, { kind: "exact" }>["normalize"],
) {
  return mode === "comparison"
    ? normalizeComparisonAnswer(value)
    : value.trim();
}

function parseNumericAnswer(value: string) {
  const normalized = value.trim().replaceAll(",", "").replace("%", "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export class UnsupportedCGraderError extends Error {
  constructor(graderId: string) {
    super(`C grader is not implemented: ${graderId}`);
    this.name = "UnsupportedCGraderError";
  }
}

export function gradeCQuestion(
  question: GeneratedQuestion,
  userAnswer: string,
): CGradeResult {
  const meta = question.cMeta;
  if (!meta) throw new Error("C question requires cMeta");

  if (meta.grading.kind === "custom") {
    throw new UnsupportedCGraderError(meta.grading.graderId);
  }

  if (meta.grading.kind === "exact") {
    const actual = normalizeExactAnswer(userAnswer, meta.grading.normalize);
    const expected = normalizeExactAnswer(
      question.answer,
      meta.grading.normalize,
    );
    const allowed = question.allowedAnswerSet?.map(String) ?? [];
    const normalizedAllowed = allowed.map((value) =>
      normalizeExactAnswer(value, meta.grading.normalize),
    );
    const isCorrect = actual === expected || normalizedAllowed.includes(actual);
    return {
      isCorrect,
      accuracyLevel: isCorrect ? "exact" : "wrong",
      gradingMetrics: {
        gradingKind: "exact",
        gradingVersion: meta.grading.version,
      },
    };
  }

  const actual = parseNumericAnswer(userAnswer);
  const expected = parseNumericAnswer(question.answer);
  if (actual === undefined || expected === undefined) {
    return {
      isCorrect: false,
      accuracyLevel: "wrong",
      gradingMetrics: {
        gradingKind: "relative_error",
        gradingVersion: meta.grading.version,
        tolerance: meta.grading.tolerance,
      },
    };
  }

  const scale = Math.max(1, Math.abs(expected));
  const exact = Math.abs(actual - expected) <= Number.EPSILON * scale;
  const relativeError =
    expected === 0
      ? exact
        ? 0
        : Number.POSITIVE_INFINITY
      : Math.abs(actual - expected) / Math.abs(expected);
  const accepted = relativeError <= meta.grading.tolerance;

  return {
    isCorrect: accepted,
    accuracyLevel: exact ? "exact" : accepted ? "accepted" : "wrong",
    relativeError: Number.isFinite(relativeError) ? relativeError : undefined,
    gradingMetrics: {
      gradingKind: "relative_error",
      gradingVersion: meta.grading.version,
      tolerance: meta.grading.tolerance,
    },
  };
}

export function isCProject(value: unknown): value is CProject {
  return value === "C1" || value === "C2" || value === "C3" || value === "C4";
}

export function hasCQuestionMeta(
  question: GeneratedQuestion,
): question is GeneratedQuestion & { cMeta: CQuestionMeta } {
  return Boolean(question.cMeta && isCProject(question.cMeta.project));
}
