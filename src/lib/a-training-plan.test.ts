import { describe, expect, it } from "vitest";
import { GenerationContext } from "./generate";
import {
  dailyTrainingPlanFromQuestions,
  generateDailyTrainingSet,
  normalizeDailyTrainingPlan,
} from "./a-training-plan";

function context(seed = 1): GenerationContext {
  let state = seed >>> 0;
  let id = 0;
  return {
    random: () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    createId: () => `daily-${seed}-${id++}`,
  };
}

function skillCounts(questions: ReturnType<typeof generateDailyTrainingSet>) {
  const counts = new Map<string, number>();
  questions.forEach((question) =>
    counts.set(
      question.skillId ?? "",
      (counts.get(question.skillId ?? "") ?? 0) + 1,
    ),
  );
  return counts;
}

describe("A daily training plans", () => {
  it("generates an even mixed set with each configured difficulty preserved", () => {
    const questions = generateDailyTrainingSet(
      {
        version: 1,
        questionCount: 10,
        entries: [
          { abilityId: "A-COM-01", difficultyBand: "L3" },
          { abilityId: "A-MUL-02", difficultyBand: "L2" },
          { abilityId: "A-MUL-03", difficultyBand: "L1" },
        ],
      },
      context(11),
    );

    expect(questions).toHaveLength(10);
    const counts = skillCounts(questions);
    questions.forEach((question) => {
      if (question.skillId === "A-COM-01")
        expect(question.difficultyBand).toBe("L3");
      if (question.skillId === "A-MUL-02")
        expect(question.difficultyBand).toBe("L2");
      if (question.skillId === "A-MUL-03")
        expect(question.difficultyBand).toBe("L1");
      expect(question.structureTags).toContain("a_daily_training");
    });
    expect([...counts.values()].sort()).toEqual([3, 3, 4]);
  });

  it("accepts a one-ability daily plan instead of requiring automatic recommendations", () => {
    const questions = generateDailyTrainingSet(
      {
        version: 1,
        questionCount: 10,
        entries: [{ abilityId: "A-FRA-01", difficultyBand: "L2" }],
      },
      context(22),
    );
    expect(new Set(questions.map((question) => question.skillId))).toEqual(
      new Set(["A-FRA-01"]),
    );
  });

  it("normalizes persisted plans canonically and rejects empty, invalid or future-version plans", () => {
    expect(
      normalizeDailyTrainingPlan({
        version: 1,
        questionCount: 20,
        entries: [
          { abilityId: "A-MUL-02", difficultyBand: "L3" },
          { abilityId: "A-ADD-01", difficultyBand: "L2" },
          { abilityId: "A-ADD-01", difficultyBand: "L3" },
          { abilityId: "old-leaf", difficultyBand: "L1" },
        ],
      }),
    ).toEqual({
      version: 1,
      questionCount: 20,
      entries: [
        { abilityId: "A-ADD-01", difficultyBand: "L2" },
        { abilityId: "A-MUL-02", difficultyBand: "L3" },
      ],
    });
    expect(
      normalizeDailyTrainingPlan({
        version: 1,
        questionCount: 10,
        entries: [],
      }),
    ).toBeUndefined();
    expect(
      normalizeDailyTrainingPlan({
        version: 2,
        questionCount: 10,
        entries: [{ abilityId: "A-ADD-01", difficultyBand: "L2" }],
      }),
    ).toBeUndefined();
  });

  it("reconstructs a restartable daily plan in canonical order", () => {
    const original = generateDailyTrainingSet(
      {
        version: 1,
        questionCount: 10,
        entries: [
          { abilityId: "A-SUB-01", difficultyBand: "L1" },
          { abilityId: "A-PCT-01", difficultyBand: "L3" },
        ],
      },
      context(33),
    );
    const restored = dailyTrainingPlanFromQuestions(original, 10);
    expect(restored).toEqual({
      version: 1,
      questionCount: 10,
      entries: [
        { abilityId: "A-SUB-01", difficultyBand: "L1" },
        { abilityId: "A-PCT-01", difficultyBand: "L3" },
      ],
    });
  });

  it("keeps the remainder allocation stable after a shuffled daily set is restarted", () => {
    const plan = {
      version: 1 as const,
      questionCount: 10 as const,
      entries: [
        { abilityId: "A-COM-01" as const, difficultyBand: "L3" as const },
        { abilityId: "A-MUL-02" as const, difficultyBand: "L2" as const },
        { abilityId: "A-MUL-03" as const, difficultyBand: "L1" as const },
      ],
    };
    const original = generateDailyTrainingSet(plan, context(44));
    expect(skillCounts(original)).toEqual(
      new Map([
        ["A-COM-01", 4],
        ["A-MUL-02", 3],
        ["A-MUL-03", 3],
      ]),
    );

    const restored = dailyTrainingPlanFromQuestions(original, 10);
    expect(restored).toEqual(plan);
    const restarted = generateDailyTrainingSet(restored!, context(45));
    expect(skillCounts(restarted)).toEqual(skillCounts(original));
  });
});
