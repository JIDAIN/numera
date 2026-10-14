import { GenerationContext, productionGenerationContext } from "../generate";
import { DifficultyBand, GeneratedQuestion } from "../types";
import { type C2Preset } from "./contract";
import { generateC2ComprehensiveQuestion } from "./generator";
import { generateC2SupportNxrSet, generateC2SupportRQuestion } from "./support";
import { c2AllowsGroupSize, c2CanStartPreset } from "./launch-policy";

export type C2RuntimeGenerationRequest = {
  preset: C2Preset;
  difficultyBand?: DifficultyBand;
  questionCount: number;
};

/**
 * Generates only current C2 launchable modes. Retired v1 presets remain
 * decodable for historical records but cannot start a new session.
 *
 * Direct / Split / Scaling method workspaces intentionally remain outside this
 * dispatcher until their remaining local diagnostic tolerances and frontend
 * difficulty admissions are product-closed.
 */
export function generateC2RuntimeSet(
  request: C2RuntimeGenerationRequest,
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion[] | undefined {
  if (
    !c2AllowsGroupSize(request.questionCount) ||
    !c2CanStartPreset(request.preset)
  )
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
