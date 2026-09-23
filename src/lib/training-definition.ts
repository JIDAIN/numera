import {
  QuestionType,
  TrainingFamily,
  TrainingLaunchSpec,
  TrainingSession,
} from "./types";

export type TrainingAnalyticsKind = "legacy_rating" | "a_mastery" | "c_project";

export type TrainingDefinition = {
  family: TrainingFamily;
  pkEligible: boolean;
  analyticsKind: TrainingAnalyticsKind;
};

export const trainingDefinitionRegistry: Readonly<
  Record<TrainingFamily, TrainingDefinition>
> = Object.freeze({
  classic: {
    family: "classic",
    pkEligible: true,
    analyticsKind: "legacy_rating",
  },
  a: {
    family: "a",
    pkEligible: true,
    analyticsKind: "a_mastery",
  },
  c: {
    family: "c",
    pkEligible: false,
    analyticsKind: "c_project",
  },
});

export function trainingFamilyForQuestionType(
  questionType: QuestionType,
): TrainingFamily {
  if (questionType === "skill_drill") return "a";
  if (questionType === "c_training") return "c";
  return "classic";
}

export function getTrainingDefinition(
  sessionOrType: Pick<TrainingSession, "questionType" | "launchSpec"> | QuestionType,
): TrainingDefinition {
  const launchFamily =
    typeof sessionOrType === "string"
      ? undefined
      : sessionOrType.launchSpec?.family;
  const questionType =
    typeof sessionOrType === "string"
      ? sessionOrType
      : sessionOrType.questionType;
  return trainingDefinitionRegistry[
    launchFamily ?? trainingFamilyForQuestionType(questionType)
  ];
}

export function isSessionPkEligible(
  session: Pick<TrainingSession, "questionType" | "launchSpec">,
) {
  return session.launchSpec?.pkEligible ?? getTrainingDefinition(session).pkEligible;
}

export function launchPkEligibility(
  questionType: QuestionType,
  explicit?: boolean,
) {
  return explicit ?? getTrainingDefinition(questionType).pkEligible;
}

export function launchFamily(
  questionType: QuestionType,
  explicit?: TrainingFamily,
) {
  return explicit ?? trainingFamilyForQuestionType(questionType);
}

export function buildTrainingLaunchSpec(
  input: Omit<TrainingLaunchSpec, "version" | "family" | "pkEligible"> & {
    family?: TrainingFamily;
    pkEligible?: boolean;
  },
): TrainingLaunchSpec {
  return {
    ...input,
    version: 1,
    family: launchFamily(input.questionType, input.family),
    pkEligible: launchPkEligibility(input.questionType, input.pkEligible),
  };
}

export function hasFrozenLaunchSpec(
  session: Pick<TrainingSession, "launchSpec">,
): session is Pick<TrainingSession, "launchSpec"> & {
  launchSpec: TrainingLaunchSpec;
} {
  return session.launchSpec?.version === 1;
}
