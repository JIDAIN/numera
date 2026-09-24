import { getSkillDefinition, isRegisteredSkillId } from "./skill-registry";
import {
  getSubtypeLabel,
  QuestionType,
  TrainingFamily,
  TrainingLaunchSpec,
  TrainingSession,
  typeLabels,
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
  const expected = getTrainingDefinition(questionType).pkEligible;
  if (explicit !== undefined && explicit !== expected) {
    throw new Error("PK eligibility must match the registered training family");
  }
  return expected;
}

export function launchFamily(
  questionType: QuestionType,
  explicit?: TrainingFamily,
) {
  const expected = trainingFamilyForQuestionType(questionType);
  if (explicit !== undefined && explicit !== expected) {
    throw new Error("Training family must match the registered question type");
  }
  return expected;
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

export type TrainingDisplayDescriptor = {
  family: TrainingFamily;
  title: string;
  subtitle: string;
  analyticsKey: string;
  pkEligible: boolean;
};

export function getTrainingDisplayDescriptor(
  session: Pick<
    TrainingSession,
    | "questionType"
    | "subtype"
    | "primarySkillId"
    | "difficultyBand"
    | "cProject"
    | "cTrainingMode"
    | "cPreset"
    | "launchSpec"
  >,
): TrainingDisplayDescriptor {
  const definition = getTrainingDefinition(session);

  if (definition.family === "a") {
    const skillId = session.primarySkillId;
    const title =
      skillId && isRegisteredSkillId(skillId)
        ? getSkillDefinition(skillId).displayName
        : session.subtype === "daily_plan"
          ? "我的日常"
          : "A层专项";
    const subtitle = [
      skillId && isRegisteredSkillId(skillId) ? skillId : undefined,
      session.difficultyBand,
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      family: "a",
      title,
      subtitle:
        subtitle || getSubtypeLabel(session.questionType, session.subtype),
      analyticsKey: `a:${skillId ?? session.subtype}:${
        session.difficultyBand ?? "mixed"
      }`,
      pkEligible: isSessionPkEligible(session),
    };
  }

  if (definition.family === "c") {
    const project = session.cProject ?? "C";
    const subtitle = [
      session.cTrainingMode,
      session.cPreset,
      session.difficultyBand,
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      family: "c",
      title: `${project} · C层训练`,
      subtitle: subtitle || "C层专项",
      analyticsKey: `c:${project}:${session.cTrainingMode ?? "unknown"}:${
        session.cPreset ?? "default"
      }:${session.difficultyBand ?? "mixed"}`,
      pkEligible: isSessionPkEligible(session),
    };
  }

  return {
    family: "classic",
    title: typeLabels[session.questionType],
    subtitle: getSubtypeLabel(session.questionType, session.subtype),
    analyticsKey: `classic:${session.questionType}:${session.subtype}`,
    pkEligible: isSessionPkEligible(session),
  };
}
