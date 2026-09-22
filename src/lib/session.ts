import { generateCanonicalAMixedSet } from "./a-mixed-training";
import { learnedImplementedSkillIds } from "./mastery";
import {
  generateSet,
  GenerationContext,
  productionGenerationContext,
} from "./generate";
import {
  generateSkillDrillSet,
  ImplementedSkillId,
  isImplementedSkillId,
} from "./implemented-skill-drills";
import {
  isValidNewTrainingQuestionCount,
  isValidStoredQuestionCount,
} from "./question-count";
import { startStepTimer } from "./timer";
import {
  CProject,
  CTrainingMode,
  DifficultyBand,
  GeneratedQuestion,
  parseSkillDrillSubtype,
  parseSmartTrainingSubtype,
  QuestionType,
  SkillId,
  Subtype,
  TrainingMode,
  TrainingSession,
} from "./types";

interface CreateTrainingSessionOptions {
  userId: string;
  questionType: QuestionType;
  subtype: Subtype;
  questionCount: number;
  now?: number;
  createSessionId?: () => string;
  generationContext?: GenerationContext;
  ownerAccountId?: string;
  questions?: TrainingSession["questions"];
  pkChallengeId?: string;
  trainingMode?: TrainingMode;
  primarySkillId?: SkillId;
  difficultyBand?: DifficultyBand;
  cProject?: CProject;
  cTrainingMode?: CTrainingMode;
  cPreset?: string;
  gradingRuleVersion?: string;
  history?: TrainingSession[];
}

function onlyValue<T>(values: readonly (T | undefined)[]): T | undefined {
  const unique = Array.from(
    new Set(values.filter((value): value is T => value !== undefined)),
  );
  return unique.length === 1 ? unique[0] : undefined;
}

/** Creates one entirely fresh training run from frozen training parameters. */
export function createTrainingSession({
  userId,
  questionType,
  subtype,
  questionCount,
  now = Date.now(),
  createSessionId = () => globalThis.crypto.randomUUID(),
  generationContext = productionGenerationContext,
  ownerAccountId,
  questions,
  pkChallengeId,
  trainingMode,
  primarySkillId,
  difficultyBand,
  cProject,
  cTrainingMode,
  cPreset,
  gradingRuleVersion,
  history = [],
}: CreateTrainingSessionOptions): TrainingSession {
  // New sessions use 10/20 only. A frozen classic PK set may still contain a
  // previously-supported 30–100 question count and must remain playable.
  const validCount = questions
    ? isValidStoredQuestionCount(questionCount)
    : isValidNewTrainingQuestionCount(questionCount);
  if (!validCount) throw new RangeError("Invalid question count");

  // Frozen PK question sets are never regenerated. This preserves both classic
  // history semantics and canonical A questions byte-for-byte across updates.
  const newlyGenerated = questions === undefined;
  if (newlyGenerated && questionType === "c_training") {
    throw new Error("c_training sessions require a frozen generated question set");
  }

  const encodedSkill =
    questionType === "skill_drill" ? parseSkillDrillSubtype(subtype) : undefined;
  const smartTraining =
    questionType === "skill_drill" ? parseSmartTrainingSubtype(subtype) : undefined;
  const requestedSkillId = primarySkillId ?? encodedSkill?.skillId;
  const requestedSkillDifficulty =
    difficultyBand ??
    encodedSkill?.difficultyBand ??
    smartTraining?.difficultyBand ??
    "L2";

  if (
    newlyGenerated &&
    questionType === "skill_drill" &&
    !smartTraining &&
    !isImplementedSkillId(requestedSkillId)
  ) {
    throw new Error("skill_drill sessions require a canonical A ability ID");
  }

  const generatedSkillQuestions =
    newlyGenerated && questionType === "skill_drill"
      ? smartTraining?.mode === "mixed"
        ? generateCanonicalAMixedSet(
            learnedImplementedSkillIds(history, userId),
            smartTraining.difficultyBand,
            questionCount,
            generationContext,
          )
        : generateSkillDrillSet(
            requestedSkillId as ImplementedSkillId,
            requestedSkillDifficulty,
            questionCount,
            generationContext,
          )
      : undefined;

  // Classic training stays classic. Do not decorate its questions with inferred
  // A/B/C leaf IDs; the old 160-leaf migration model has been retired.
  const frozenQuestions =
    questions ??
    (questionType === "skill_drill"
      ? (generatedSkillQuestions ?? [])
      : generateSet(questionType, subtype, questionCount, generationContext));

  const inferredPrimarySkillId = newlyGenerated
    ? onlyValue(frozenQuestions.map((question) => question.skillId))
    : undefined;
  const inferredDifficultyBand = onlyValue(
    frozenQuestions.map((question) => question.difficultyBand),
  );
  const inferredCProject = onlyValue(
    frozenQuestions.map((question) => question.cMeta?.project),
  );
  const inferredCTrainingMode = onlyValue(
    frozenQuestions.map((question) => question.cMeta?.mode),
  );
  const inferredCPreset = onlyValue(
    frozenQuestions.map((question) => question.cMeta?.preset),
  );
  const inferredGradingRuleVersion = onlyValue(
    frozenQuestions.map((question) => question.cMeta?.grading.version),
  );

  if (
    questionType === "c_training" &&
    frozenQuestions.some((question) => !question.cMeta)
  ) {
    throw new Error("c_training questions require cMeta");
  }
  if (cProject && inferredCProject && cProject !== inferredCProject) {
    throw new Error("C project metadata does not match frozen questions");
  }
  if (
    cTrainingMode &&
    inferredCTrainingMode &&
    cTrainingMode !== inferredCTrainingMode
  ) {
    throw new Error("C training mode does not match frozen questions");
  }
  const hasStructuredFlow = frozenQuestions.every(
    (question) =>
      question.inputKind === "steps" && Boolean(question.stepSpecs?.length),
  );
  const effectivePrimarySkillId =
    primarySkillId ?? encodedSkill?.skillId ?? inferredPrimarySkillId;
  const effectiveDifficultyBand =
    difficultyBand ??
    smartTraining?.difficultyBand ??
    encodedSkill?.difficultyBand ??
    inferredDifficultyBand;
  const effectiveCProject = cProject ?? inferredCProject;
  const effectiveCTrainingMode = cTrainingMode ?? inferredCTrainingMode;
  const effectiveCPreset = cPreset ?? inferredCPreset;
  const effectiveGradingRuleVersion =
    gradingRuleVersion ?? inferredGradingRuleVersion;
  const effectiveTrainingMode =
    trainingMode ??
    (questionType === "c_training"
      ? "c_task"
      : smartTraining?.mode === "mixed"
        ? "mixed"
        : hasStructuredFlow
          ? "flow"
          : effectivePrimarySkillId &&
              isImplementedSkillId(effectivePrimarySkillId)
            ? "skill"
            : "legacy");

  return {
    id: createSessionId(),
    userId,
    questionType,
    subtype,
    questionCount,
    questions: frozenQuestions,
    currentIndex: 0,
    records: [],
    currentAnswer: "",
    currentRestartCount: 0,
    accumulatedMs: 0,
    runningSince: now,
    pauseDurationMs: 0,
    status: "active",
    startedAt: now,
    ownerAccountId,
    trainingSource: pkChallengeId ? "pk" : "normal",
    pkChallengeId,
    pkSyncStatus: pkChallengeId ? "not_synced" : undefined,
    schemaVersion: questionType === "c_training" ? 3 : 2,
    trainingMode: effectiveTrainingMode,
    primarySkillId: effectivePrimarySkillId,
    difficultyBand: effectiveDifficultyBand,
    cProject: effectiveCProject,
    cTrainingMode: effectiveCTrainingMode,
    cPreset: effectiveCPreset,
    gradingRuleVersion: effectiveGradingRuleVersion,
    currentStepIndex: hasStructuredFlow ? 0 : undefined,
    currentStepAnswer: hasStructuredFlow ? "" : undefined,
    currentStepRecords: hasStructuredFlow ? [] : undefined,
    currentStepTimer: hasStructuredFlow ? startStepTimer(now) : undefined,
    currentStepEditCount: hasStructuredFlow ? 0 : undefined,
  };
}


export interface CreateCTrainingSessionOptions {
  userId: string;
  project: CProject;
  mode: CTrainingMode;
  preset?: string;
  difficultyBand?: DifficultyBand;
  questionCount: number;
  questions: GeneratedQuestion[];
  now?: number;
  createSessionId?: () => string;
  ownerAccountId?: string;
  pkChallengeId?: string;
}

export function createCTrainingSession({
  userId,
  project,
  mode,
  preset,
  difficultyBand,
  questionCount,
  questions,
  now,
  createSessionId,
  ownerAccountId,
  pkChallengeId,
}: CreateCTrainingSessionOptions): TrainingSession {
  if (!isValidNewTrainingQuestionCount(questionCount)) {
    throw new RangeError("Invalid C training question count");
  }
  if (questions.length !== questionCount) {
    throw new Error("Frozen C question count does not match session count");
  }
  for (const question of questions) {
    if (
      question.type !== "c_training" ||
      question.subtype !== "c_task" ||
      !question.cMeta
    ) {
      throw new Error("C sessions require c_training questions with cMeta");
    }
    if (question.cMeta.project !== project || question.cMeta.mode !== mode) {
      throw new Error("C question metadata does not match session metadata");
    }
    if ((question.cMeta.preset ?? undefined) !== (preset ?? undefined)) {
      throw new Error("C question preset does not match session preset");
    }
    if (
      difficultyBand !== undefined &&
      question.difficultyBand !== difficultyBand
    ) {
      throw new Error("C question difficulty does not match session difficulty");
    }
  }

  return createTrainingSession({
    userId,
    questionType: "c_training",
    subtype: "c_task",
    questionCount,
    now,
    createSessionId,
    ownerAccountId,
    questions,
    pkChallengeId,
    trainingMode: "c_task",
    difficultyBand,
    cProject: project,
    cTrainingMode: mode,
    cPreset: preset,
    gradingRuleVersion: onlyValue(
      questions.map((question) => question.cMeta?.grading.version),
    ),
  });
}
