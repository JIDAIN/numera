import {
  canonicalAAbilityIds,
  CanonicalAAbilityId,
  isCanonicalAAbilityId,
} from "./a-abilities";
import { generateCanonicalAQuestion } from "./canonical-a-generate";
import { GenerationContext, productionGenerationContext } from "./generate";
import { isValidNewTrainingQuestionCount } from "./question-count";
import { DifficultyBand, GeneratedQuestion } from "./types";

export const A_DAILY_TRAINING_VERSION = "a-daily-1.0.0";

export type DailyTrainingEntry = {
  abilityId: CanonicalAAbilityId;
  difficultyBand: DifficultyBand;
};

export type DailyTrainingPlan = {
  version: 1;
  entries: DailyTrainingEntry[];
  questionCount: 10 | 20;
};

function isDifficultyBand(value: unknown): value is DifficultyBand {
  return value === "L1" || value === "L2" || value === "L3";
}

function randomInteger(context: GenerationContext, min: number, max: number) {
  return Math.floor(context.random() * (max - min + 1)) + min;
}

function shuffle<T>(context: GenerationContext, values: readonly T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomInteger(context, 0, index);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function entriesInCanonicalOrder(
  selected: ReadonlyMap<CanonicalAAbilityId, DifficultyBand>,
): DailyTrainingEntry[] {
  return canonicalAAbilityIds.flatMap((abilityId) => {
    const difficultyBand = selected.get(abilityId);
    return difficultyBand ? [{ abilityId, difficultyBand }] : [];
  });
}

export function normalizeDailyTrainingPlan(
  value: unknown,
): DailyTrainingPlan | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as {
    entries?: unknown;
    questionCount?: unknown;
    version?: unknown;
  };
  if (candidate.version !== 1) return undefined;
  if (!Array.isArray(candidate.entries)) return undefined;
  if (!isValidNewTrainingQuestionCount(candidate.questionCount))
    return undefined;

  const selected = new Map<CanonicalAAbilityId, DifficultyBand>();
  for (const rawEntry of candidate.entries) {
    if (!rawEntry || typeof rawEntry !== "object") continue;
    const entry = rawEntry as { abilityId?: unknown; difficultyBand?: unknown };
    if (
      !isCanonicalAAbilityId(entry.abilityId) ||
      !isDifficultyBand(entry.difficultyBand) ||
      selected.has(entry.abilityId)
    )
      continue;
    selected.set(entry.abilityId, entry.difficultyBand);
  }

  const entries = entriesInCanonicalOrder(selected);
  if (!entries.length) return undefined;

  return {
    version: 1,
    entries,
    questionCount: candidate.questionCount,
  };
}

export function generateDailyTrainingSet(
  plan: DailyTrainingPlan,
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion[] {
  const normalized = normalizeDailyTrainingPlan(plan);
  if (!normalized) throw new Error("日常训练至少需要选择1个练习项目。");

  const scheduled = Array.from(
    { length: normalized.questionCount },
    (_, index) => normalized.entries[index % normalized.entries.length],
  );

  return shuffle(context, scheduled).map((entry) => {
    const question = generateCanonicalAQuestion(
      entry.abilityId,
      entry.difficultyBand,
      context,
    );
    return {
      ...question,
      structureTags: Array.from(
        new Set([...(question.structureTags ?? []), "a_daily_training"]),
      ),
      generatorParams: {
        ...(question.generatorParams ?? {}),
        dailyTrainingVersion: A_DAILY_TRAINING_VERSION,
        dailyAbilityCount: normalized.entries.length,
      },
    };
  });
}

export function dailyTrainingPlanFromQuestions(
  questions: readonly GeneratedQuestion[],
  questionCount: number,
): DailyTrainingPlan | undefined {
  if (!isValidNewTrainingQuestionCount(questionCount)) return undefined;

  const selected = new Map<CanonicalAAbilityId, DifficultyBand>();
  for (const question of questions) {
    if (
      !isCanonicalAAbilityId(question.skillId) ||
      !isDifficultyBand(question.difficultyBand) ||
      selected.has(question.skillId)
    )
      continue;
    selected.set(question.skillId, question.difficultyBand);
  }

  const entries = entriesInCanonicalOrder(selected);
  if (!entries.length) return undefined;

  return { version: 1, entries, questionCount };
}
