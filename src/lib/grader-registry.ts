import { gradeCQuestion, UnsupportedCGraderError } from "./c-training";
import { grade } from "./generate";
import { gradeSkillDrillQuestion } from "./implemented-skill-drills";
import {
  GeneratedQuestion,
  TrainingResponse,
} from "./types";
import { responseScalarValue } from "./training-response";

export type TrainingGradeResult = {
  isCorrect: boolean;
  accuracyLevel: "exact" | "accepted" | "wrong";
  relativeError?: number;
  gradingMetrics?: Record<
    string,
    string | number | boolean | string[] | number[]
  >;
};

export type CustomTrainingGrader = (
  question: GeneratedQuestion,
  response: TrainingResponse,
) => TrainingGradeResult;

const customCGraders = new Map<string, CustomTrainingGrader>();

export function registerCustomCGrader(
  graderId: string,
  grader: CustomTrainingGrader,
) {
  if (!graderId.trim()) throw new Error("Custom grader ID is required.");
  customCGraders.set(graderId, grader);
}

export function unregisterCustomCGrader(graderId: string) {
  customCGraders.delete(graderId);
}

export function gradeTrainingResponse(
  question: GeneratedQuestion,
  response: TrainingResponse,
): TrainingGradeResult {
  if (question.cMeta?.grading.kind === "custom") {
    const grader = customCGraders.get(question.cMeta.grading.graderId);
    if (!grader)
      throw new UnsupportedCGraderError(question.cMeta.grading.graderId);
    return grader(question, response);
  }

  const scalar = responseScalarValue(response);
  if (scalar === undefined) {
    return {
      isCorrect: false,
      accuracyLevel: "wrong",
      gradingMetrics: {
        responseKind: response.kind,
        unsupportedScalarGrading: true,
      },
    };
  }

  if (question.cMeta) return gradeCQuestion(question, scalar);
  if (question.type === "skill_drill")
    return gradeSkillDrillQuestion(question, scalar);
  return grade(question, scalar);
}
