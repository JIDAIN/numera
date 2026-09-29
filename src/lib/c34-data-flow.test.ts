import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CloudCompletedTrainingRow } from "./cloud";
import { createDataExport } from "./data-export";
import { readCompleted, saveSession } from "./storage";
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

function c3Session(): TrainingSession {
  const question = {
    id: "c3-data-q",
    type: "c_training" as const,
    subtype: "c_task" as const,
    prompt: "50/51 ？ 60/61",
    answer: "<",
    data: {
      a: 50,
      b: 51,
      c: 60,
      d: 61,
      c3StructureLevel: "S2",
      c3Salience: "normal",
      c3AppearanceTags: ["delta", "ordinary_two_axis", "very_close"],
      c3RatioZone: "both_below_1",
      c3DeltaCue: "normal",
      c3SymmetricRatioGap: 0.0032733224,
    },
    difficulty: { level: 3 as const, tags: ["L2", "S2", "normal"] },
    primaryStructure: "S2",
    secondaryTags: ["normal", "delta", "very_close"],
    generationRuleVersion: "c3-v1",
    difficultyBand: "L2" as const,
    inputKind: "choice" as const,
    cMeta: {
      project: "C3" as const,
      mode: "specialty" as const,
      grading: {
        kind: "exact" as const,
        normalize: "comparison" as const,
        version: "c3-exact-comparison-v1",
      },
    },
  };

  return {
    id: "c3-data-session",
    userId: "fish",
    ownerAccountId: "owner-1",
    questionType: "c_training",
    subtype: "c_task",
    questionCount: 1,
    questions: [question],
    currentIndex: 1,
    records: [
      {
        question,
        userAnswer: "<",
        response: { kind: "single", value: "<" },
        isCorrect: true,
        accuracyLevel: "exact",
        timeUsedMs: 1800,
        restartCount: 0,
        usedScratchpad: false,
        gradingMetrics: {
          gradingKind: "exact",
          gradingVersion: "c3-exact-comparison-v1",
        },
      },
    ],
    currentAnswer: "",
    currentRestartCount: 0,
    accumulatedMs: 1800,
    runningSince: null,
    pauseDurationMs: 0,
    status: "completed",
    startedAt: 1000,
    completedAt: 2800,
    trainingSource: "normal",
    schemaVersion: 3,
    trainingMode: "c_task",
    difficultyBand: "L2",
    cProject: "C3",
    cTrainingMode: "specialty",
    gradingRuleVersion: "c3-exact-comparison-v1",
  };
}

function c4Session(): TrainingSession {
  const question = {
    id: "c4-data-q",
    type: "c_training" as const,
    subtype: "c_task" as const,
    prompt: "5000 ÷ 286 = ?",
    answer: String(5000 / 286),
    data: {
      c4BaseAnchor: 286,
      c4DisplayedAnchor: 286,
      c4Operation: "divide",
      c4ScaleExponent: 0,
      c4OtherOperand: 5000,
      c4AnchorGroup: "single_anchor",
    },
    difficulty: { level: 3 as const, tags: ["L2", "divide"] },
    primaryStructure: "special_anchor",
    secondaryTags: ["anchor_286", "divide"],
    generationRuleVersion: "c4-v1",
    difficultyBand: "L2" as const,
    inputKind: "number" as const,
    cMeta: {
      project: "C4" as const,
      mode: "specialty" as const,
      preset: "anchor=286;operation=divide",
      grading: {
        kind: "relative_error" as const,
        tolerance: 0.02,
        version: "c4-relative-error-v1",
      },
    },
  };

  return {
    id: "c4-data-session",
    userId: "fish",
    ownerAccountId: "owner-1",
    questionType: "c_training",
    subtype: "c_task",
    questionCount: 1,
    questions: [question],
    currentIndex: 1,
    records: [
      {
        question,
        userAnswer: "17.48",
        response: { kind: "single", value: "17.48" },
        isCorrect: true,
        accuracyLevel: "accepted",
        relativeError: 0.00014,
        timeUsedMs: 3200,
        restartCount: 0,
        usedScratchpad: false,
        gradingMetrics: {
          gradingKind: "relative_error",
          gradingVersion: "c4-relative-error-v1",
          tolerance: 0.02,
        },
      },
    ],
    currentAnswer: "",
    currentRestartCount: 0,
    accumulatedMs: 3200,
    runningSince: null,
    pauseDurationMs: 0,
    status: "completed",
    startedAt: 1000,
    completedAt: 4200,
    trainingSource: "normal",
    schemaVersion: 3,
    trainingMode: "c_task",
    difficultyBand: "L2",
    cProject: "C4",
    cTrainingMode: "specialty",
    cPreset: "anchor=286;operation=divide",
    gradingRuleVersion: "c4-relative-error-v1",
  };
}

function cloudRow(session: TrainingSession): CloudCompletedTrainingRow {
  return {
    session_id: session.id,
    owner_id: "owner-1",
    owner_role: "fish",
    question_type: "c_training",
    subtype: "c_task",
    question_count: 1,
    generator_version: session.questions[0].generationRuleVersion,
    grading_version: session.gradingRuleVersion ?? "unknown",
    rating_version: "legacy_dynamic",
    schema_version: 3,
    session_data: session as unknown as Record<string, unknown>,
    completed_at: "2026-09-29T00:00:00Z",
    created_at: "2026-09-29T00:00:00Z",
  };
}

beforeEach(removeDatabase);
afterEach(removeDatabase);

describe("C3/C4 data-flow closure", () => {
  it("round-trips C3 objective structure facts without inventing a method", async () => {
    const source = c3Session();
    await saveSession(source);

    const [saved] = await readCompleted();
    expect(saved).toMatchObject({ cProject: "C3", status: "completed" });
    expect(saved.questions[0].data).toMatchObject({
      c3StructureLevel: "S2",
      c3Salience: "normal",
      c3RatioZone: "both_below_1",
      c3DeltaCue: "normal",
    });
    expect(saved.questions[0].data.userMethod).toBeUndefined();
    expect(saved.records[0].response).toEqual({ kind: "single", value: "<" });
  });

  it("round-trips C4 anchor, operation, scale and final-error facts", async () => {
    const source = c4Session();
    await saveSession(source);

    const saved = (await readCompleted()).find(
      (session) => session.id === source.id,
    );
    expect(saved?.questions[0].data).toMatchObject({
      c4BaseAnchor: 286,
      c4Operation: "divide",
      c4ScaleExponent: 0,
    });
    expect(saved?.records[0]).toMatchObject({
      relativeError: 0.00014,
      response: { kind: "single", value: "17.48" },
    });
  });

  it("exports C3 and C4 frozen facts and grading diagnostics unchanged", () => {
    const c3 = c3Session();
    const c4 = c4Session();
    const exported = createDataExport([cloudRow(c3), cloudRow(c4)]);

    const c3Question = exported.questions.find(
      (question) => question.c_project === "C3",
    );
    const c4Question = exported.questions.find(
      (question) => question.c_project === "C4",
    );

    expect(JSON.parse(c3Question?.question_data_json ?? "{}")).toMatchObject({
      c3StructureLevel: "S2",
      c3Salience: "normal",
      c3RatioZone: "both_below_1",
      c3DeltaCue: "normal",
    });
    expect(JSON.parse(c3Question?.response_json ?? "{}")).toEqual({
      kind: "single",
      value: "<",
    });

    expect(JSON.parse(c4Question?.question_data_json ?? "{}")).toMatchObject({
      c4BaseAnchor: 286,
      c4Operation: "divide",
      c4ScaleExponent: 0,
    });
    expect(c4Question?.relative_error).toBeCloseTo(0.00014);
    expect(JSON.parse(c4Question?.grading_metrics_json ?? "{}")).toMatchObject({
      gradingVersion: "c4-relative-error-v1",
      tolerance: 0.02,
    });
  });
});
