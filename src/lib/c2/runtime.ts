import { GenerationContext, productionGenerationContext } from "../generate";
import { DifficultyBand, GeneratedQuestion } from "../types";
import { isC2ActiveSession, type C2Preset } from "./contract";
import { generateC2ComprehensiveQuestion } from "./generator";
import { generateC2SupportNxrSet, generateC2SupportRQuestion } from "./support";

export type C2RuntimeGenerationRequest = {
  preset: C2Preset;
  difficultyBand?: DifficultyBand;
  questionCount: number;
};

/**
 * Generates only the C2 modes whose visible semantics are already locked.
 *
 * Direct / Split / Scaling method workspaces intentionally remain outside this
 * dispatcher until their remaining local diagnostic tolerances and frontend
 * difficulty admissions are product-closed.
 */
export function generateC2RuntimeSet(
  request: C2RuntimeGenerationRequest,
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion[] | undefined {
  // Fail closed: legacy presets remain readable but cannot start new sessions.
  if (!isC2ActiveSession(request.preset, request.questionCount))
    return undefined;

  if (request.preset.mode === "support") {
    if (request.preset.support === "r") {
      if (!request.difficultyBand) return undefined;
      return Array.from({ length: request.questionCount }, () =>
        generateC2SupportRQuestion(request.difficultyBand!, context),
      );
    }

    return generateC2SupportNxrSet(
      request.preset.variant,
      request.questionCount,
      context,
    );
  }

  if (request.preset.mode === "comprehensive") {
    return Array.from({ length: request.questionCount }, () =>
      generateC2ComprehensiveQuestion(context),
    );
  }

  return undefined;
}
