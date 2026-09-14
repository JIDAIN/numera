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
    const counts = new Map<string, number>();
    questions.forEach((question) => {
      counts.set(question.skillId ?? "", (counts.get(question.skillId ?? "") ?? 0) + 1);
      if (question.skillId === "A-COM-01") expect(question.difficultyBand).toBe("L3");
      if (question.skillId === "A-MUL-02") expect(question.difficultyBand).toBe("L2");
      if (question.skillId === "A-MUL-03") expect(question.difficultyBand).toBe("L1");
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

  it("normalizes persisted plans and rejects empty or invalid plans", () => {
    expect(
      normalizeDailyTrainingPlan({
        version: 1,
        questionCount: 20,
        entries: [
          { abilityId: "A-ADD-01", difficultyBand: "L2" },
          { abilityId: "A-ADD-01", difficultyBand: "L3" },
          { abilityId: "old-leaf", difficultyBand: "L1" },
        ],
      }),
    ).toEqual({
      version: 1,
      questionCount: 20,
      entries: [{ abilityId: "A-ADD-01", difficultyBand: "L2" }],
    });
    expect(
      normalizeDailyTrainingPlan({ version: 1, questionCount: 10, entries: [] }),
    ).toBeUndefined();
  });

  it("can reconstruct a restartable daily plan from frozen questions", () => {
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
    expect(restored?.questionCount).toBe(10);
    expect(new Set(restored?.entries.map((entry) => `${entry.abilityId}:${entry.difficultyBand}`))).toEqual(
      new Set(["A-SUB-01:L1", "A-PCT-01:L3"]),
    );
  });
});
