import { GeneratedQuestion } from "./types";

export type TrainingRendererId =
  | "structured_steps"
  | "c3_comparison"
  | "structured_single"
  | "fraction_comparison"
  | "fraction_conversion"
  | "default";

type RendererRule = {
  id: TrainingRendererId;
  matches: (question: GeneratedQuestion) => boolean;
};

export const trainingRendererRegistry: readonly RendererRule[] = Object.freeze([
  {
    id: "structured_steps",
    matches: (question) =>
      question.inputKind === "steps" && Boolean(question.stepSpecs?.length),
  },
  {
    id: "c3_comparison",
    matches: (question) => question.cMeta?.project === "C3",
  },
  {
    id: "structured_single",
    matches: (question) =>
      question.inputKind === "choice" ||
      question.inputKind === "sequence" ||
      question.inputKind === "percent_blocks",
  },
  {
    id: "fraction_comparison",
    matches: (question) => question.type === "fraction_comparison",
  },
  {
    id: "fraction_conversion",
    matches: (question) => question.type === "fraction_percent_conversion",
  },
]);

export function resolveTrainingRenderer(
  question: GeneratedQuestion,
): TrainingRendererId {
  return (
    trainingRendererRegistry.find((entry) => entry.matches(question))?.id ??
    "default"
  );
}
