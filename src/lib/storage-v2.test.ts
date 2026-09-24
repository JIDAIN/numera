import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCTrainingSession, createTrainingSession } from "./session";
import { readActive, saveSession } from "./storage";
import { TrainingSession } from "./types";

const DB = "speed-math-v1";

function removeDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

function baseLegacySession(
  overrides: Partial<TrainingSession> = {},
): TrainingSession {
  return {
    id: "v2-session",
    userId: "fish",
    questionType: "two_by_two_multiply",
    subtype: "carry_intensive",
    questionCount: 20,
    questions: [],
    currentIndex: 0,
    records: [],
    currentAnswer: "",
    currentRestartCount: 0,
    accumulatedMs: 0,
    runningSince: null,
    pauseDurationMs: 0,
    status: "active",
    startedAt: 1,
    schemaVersion: 2,
    trainingMode: "legacy",
    ...overrides,
  };
}

beforeEach(removeDatabase);
afterEach(removeDatabase);

describe("session storage normalization", () => {
  it("restores classic carry-intensive and hundred-scaling subtypes without inventing A ability ids", async () => {
    await saveSession(baseLegacySession({ id: "carry" }));
    expect(await readActive()).toMatchObject({
      id: "carry",
      subtype: "carry_intensive",
      trainingMode: "legacy",
      primarySkillId: undefined,
    });

    await removeDatabase();
    await saveSession(
      baseLegacySession({
        id: "scale",
        questionType: "special_hundred_scaling_division",
        subtype: "hundred_scaling",
      }),
    );
    expect(await readActive()).toMatchObject({
      id: "scale",
      subtype: "hundred_scaling",
      primarySkillId: undefined,
    });
  });

  it("restores encoded canonical A subtypes and generated metadata", async () => {
    const session = createTrainingSession({
      userId: "fish",
      questionType: "skill_drill",
      subtype: "skill:A-PCT-01:L3",
      questionCount: 10,
      now: 100,
      createSessionId: () => "foundation-storage",
    });
    await saveSession(session);

    const restored = await readActive();
    expect(restored).toMatchObject({
      id: "foundation-storage",
      questionType: "skill_drill",
      subtype: "skill:A-PCT-01:L3",
      primarySkillId: "A-PCT-01",
      difficultyBand: "L3",
      trainingMode: "skill",
    });
    expect(restored?.questions[0]).toMatchObject({
      type: "skill_drill",
      subtype: "skill_drill",
      skillId: "A-PCT-01",
      difficultyBand: "L3",
    });
  });

  it("preserves schema-v3 C project metadata and grading contracts", async () => {
    const questions = Array.from({ length: 10 }, (_, index) => ({
      id: `c4-${index}`,
      type: "c_training" as const,
      subtype: "c_task" as const,
      prompt: "25 × 432",
      answer: "10800",
      data: {},
      difficulty: { level: 2 as const, tags: [] },
      primaryStructure: "special_anchor",
      secondaryTags: [],
      generationRuleVersion: "c4-generator-v1",
      difficultyBand: "L1" as const,
      structureTags: ["anchor_25"],
      cMeta: {
        project: "C4" as const,
        mode: "specialty" as const,
        preset: "anchor_25_multiply",
        grading: {
          kind: "relative_error" as const,
          tolerance: 0.02,
          version: "c4-grading-v1",
        },
      },
    }));
    const session = createCTrainingSession({
      userId: "fish",
      project: "C4",
      mode: "specialty",
      preset: "anchor_25_multiply",
      difficultyBand: "L1",
      questionCount: 10,
      questions,
      now: 100,
      createSessionId: () => "c-storage",
    });

    await saveSession(session);
    const restored = await readActive();

    expect(restored).toMatchObject({
      id: "c-storage",
      schemaVersion: 3,
      trainingMode: "c_task",
      cProject: "C4",
      cTrainingMode: "specialty",
      cPreset: "anchor_25_multiply",
      gradingRuleVersion: "c4-grading-v1",
      primarySkillId: undefined,
    });
    expect(restored?.questions[0]).toMatchObject({
      type: "c_training",
      subtype: "c_task",
      difficultyBand: "L1",
      cMeta: {
        project: "C4",
        mode: "specialty",
        preset: "anchor_25_multiply",
        grading: {
          kind: "relative_error",
          tolerance: 0.02,
          version: "c4-grading-v1",
        },
      },
    });
  });

  it("preserves canonical A metadata and generic method-step specifications", async () => {
    const session = createTrainingSession({
      userId: "fish",
      questionType: "skill_drill",
      subtype: "skill:A-MUL-04:L2",
      questionCount: 10,
      now: 100,
      createSessionId: () => "a-storage-mul04",
    });
    session.questions[0] = {
      ...session.questions[0],
      structureTags: ["single_carry"],
      targetPrecision: "exact",
      generatorParams: { min: 10, max: 99 },
      stepSpecs: [
        {
          id: "answer",
          stepType: "numeric_answer",
          prompt: "计算结果",
          inputKind: "number",
          targetPrecision: "exact",
        },
      ],
    };
    await saveSession(session);

    const restored = await readActive();
    expect(restored).toMatchObject({
      schemaVersion: 2,
      trainingMode: "skill",
      primarySkillId: "A-MUL-04",
      difficultyBand: "L2",
    });
    expect(restored?.questions[0]).toMatchObject({
      skillId: "A-MUL-04",
      difficultyBand: "L2",
      targetPrecision: "exact",
      masteryProfile: "C",
      inputKind: "number",
    });
    expect(restored?.questions[0].stepSpecs?.[0]).toMatchObject({
      stepType: "numeric_answer",
      inputKind: "number",
    });
  });
});
