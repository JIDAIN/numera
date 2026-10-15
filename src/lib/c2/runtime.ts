import type { GenerationContext } from "../generate";
import { productionGenerationContext } from "../generate";
import type { DifficultyBand, GeneratedQuestion } from "../types";
import type { C2Preset } from "./contract";
import { generateC2ComprehensiveQuestion } from "./generator";
import { generateC2DirectQuestion } from "./direct-pilot";
import { c2RequiredQuestionCount, c2CanLaunch } from "./launch-policy";
import {
  generateC2SupportNxrQuestion,
  generateC2SupportRQuestion,
} from "./support";
import { c2RNominalDisplayConflict } from "./r-admission";

export type C2RuntimeGenerationRequest = {
  preset: C2Preset;
  questionCount: number;
  /** Existing generator input; not a signed machine L allocation. */
  difficultyBand?: DifficultyBand;
};

const MAX_ATTEMPTS_PER_QUESTION = 80;

/**
 * A historical v1 preset being decodable MUST NOT imply that it can create
 * a new session. This dispatcher is the only sanctioned C2 candidate launch.
 * Direct has its own digit-accurate pilot; Split/Scaling remain closed.
 */
export function generateC2RuntimeSet(
  request: C2RuntimeGenerationRequest,
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion[] | undefined {
  if (!c2CanLaunch(request.preset, request.questionCount)) return undefined;

  const { preset } = request;
  if (preset.mode === "method" && preset.route !== "direct")
    return undefined;

  if (
    preset.mode === "support" &&
    preset.support === "r" &&
    !request.difficultyBand
  )
    return undefined;

  const questions: GeneratedQuestion[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < request.questionCount; index += 1) {
    let accepted: GeneratedQuestion | undefined;

    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_QUESTION; attempt += 1) {
      let question: GeneratedQuestion;
      if (preset.mode === "support" && preset.support === "r") {
        question = generateC2SupportRQuestion(request.difficultyBand!, context);
        // A nominal shortcut and exact 0.1pp answer must not conflict for a
        // single-answer r exercise. This is admission, not looser grading.
        if (
          c2RNominalDisplayConflict(
            Number(question.data.c2B),
            Number(question.data.c2B0),
          )
        )
          continue;
      } else if (preset.mode === "support" && preset.support === "nxr") {
        if (preset.variant === "mixed") return undefined;
        question = generateC2SupportNxrQuestion(preset.variant, context);
      } else if (preset.mode === "method" && preset.route === "direct") {
        question = generateC2DirectQuestion(context);
      } else if (preset.mode === "comprehensive") {
        question = generateC2ComprehensiveQuestion(context);
      } else {
        return undefined;
      }

      const signature =
        preset.mode === "support" && preset.support === "r"
          ? `${question.data.c2B}:${question.data.c2B0}`
          : preset.mode === "support"
            ? `${question.data.c2N}:${question.data.c2R}`
            : preset.mode === "method"
              ? `${question.data.c2DirectA}:${question.data.c2DirectB}`
              : `${question.data.c2RawA}:${question.data.c2RawB}`;

      if (seen.has(signature)) continue;
      seen.add(signature);
      accepted = question;
      break;
    }

    if (!accepted)
      throw new Error(
        `quota_unfillable: C2 ${preset.mode} requires ${c2RequiredQuestionCount(preset)} unique questions`,
      );
    questions.push(accepted);
  }

  return questions;
}
