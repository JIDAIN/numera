import {
  GenerationContext,
  productionGenerationContext,
} from "./generate";
import {
  C4_QUESTION_COUNT,
  decodeC4Preset,
  generateC4Set,
} from "./c4-training";
import {
  CProject,
  CTrainingMode,
  DifficultyBand,
  GeneratedQuestion,
} from "./types";

export type CProjectGenerationRequest = {
  project: CProject;
  mode: CTrainingMode;
  preset?: string;
  difficultyBand?: DifficultyBand;
  questionCount: number;
};

export type CProjectDefinition = {
  project: CProject;
  displayName: string;
  implemented: boolean;
};

export const cProjectDefinitions: readonly CProjectDefinition[] = [
  { project: "C1", displayName: "乘法放缩", implemented: false },
  { project: "C2", displayName: "除法综合", implemented: false },
  { project: "C3", displayName: "分数比较", implemented: false },
  { project: "C4", displayName: "特殊基准数乘除转换", implemented: true },
];

export function isImplementedCProject(project: CProject) {
  return Boolean(
    cProjectDefinitions.find(
      (definition) => definition.project === project && definition.implemented,
    ),
  );
}

export function cProjectDisplayName(project: CProject) {
  return (
    cProjectDefinitions.find((definition) => definition.project === project)
      ?.displayName ?? project
  );
}

export function generateImplementedCProjectSet(
  request: CProjectGenerationRequest,
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion[] | undefined {
  if (request.project !== "C4") return undefined;
  if (
    request.mode !== "specialty" ||
    !request.difficultyBand ||
    request.questionCount !== C4_QUESTION_COUNT
  )
    return undefined;
  const config = decodeC4Preset(request.difficultyBand, request.preset);
  if (!config) return undefined;
  return generateC4Set(config, request.questionCount, context);
}
