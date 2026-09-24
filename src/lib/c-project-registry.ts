import { GenerationContext, productionGenerationContext } from "./generate";
import {
  C4_QUESTION_COUNT,
  decodeC4Preset,
  generateC4Set,
} from "./c4-training";
import { C3_QUESTION_COUNT, generateC3Set } from "./c3-training";
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
  { project: "C3", displayName: "分数比较", implemented: true },
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
  if (request.project === "C3") {
    if (
      request.mode !== "specialty" ||
      !request.difficultyBand ||
      request.questionCount !== C3_QUESTION_COUNT
    )
      return undefined;
    return generateC3Set(
      request.difficultyBand,
      request.questionCount,
      context,
    );
  }

  if (request.project === "C4") {
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

  return undefined;
}

const cDifficultyLabels: Record<DifficultyBand, string> = {
  L1: "简单",
  L2: "困难",
  L3: "复杂",
};

export function cProjectDisplaySubtitle(input: {
  project: CProject;
  mode?: CTrainingMode;
  preset?: string;
  difficultyBand?: DifficultyBand;
}) {
  if (input.project === "C3" && input.difficultyBand) {
    return `${cDifficultyLabels[input.difficultyBand]} · 20题`;
  }

  if (input.project === "C4" && input.difficultyBand) {
    const config = decodeC4Preset(input.difficultyBand, input.preset);
    if (config) {
      const anchorLabel =
        config.difficultyBand === "L3"
          ? "跨数量级综合"
          : config.anchor === "all"
            ? "本级综合"
            : String(config.anchor);
      const operationLabel =
        config.operation === "multiply"
          ? "乘法"
          : config.operation === "divide"
            ? "除法"
            : "乘除综合";
      return `${cDifficultyLabels[config.difficultyBand]} · ${anchorLabel} · ${operationLabel}`;
    }
  }

  return [input.mode, input.difficultyBand].filter(Boolean).join(" · ");
}
