import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDataExport } from "./data-export";
import { readCompleted, saveSession } from "./storage";
import { CloudCompletedTrainingRow } from "./cloud";
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

function completedC1Session(): TrainingSession {
  const question = {
    id: "c1-percent-q",
    type: "c_training" as const,
    subtype: "c_task" as const,
    prompt: "42% × 214",
    answer: String(0.42 * 214),
    data: {
      a: 0.42,
      b: 214,
      c1APresentation: "percent",
      c1BPresentation: "number",
      c1PresentationPattern: "percent_left",
      c1RecommendedAPrime: 0.4,
      c1RecommendedBPrime: 225,
    },
    difficulty: { level: 1 as const, tags: ["L1"] },
    primaryStructure: "obvious",
    secondaryTags: [],
    generationRuleVersion: "c1-v3",
    difficultyBand: "L1" as const,
    inputKind: "structured" as const,
    cMeta: {
      project: "C1" as const,
      mode: "specialty" as const,
      grading: {
        kind: "custom" as const,
        graderId: "c1-multiplication-scaling-v3",
        version: "c1-multiplication-scaling-v3",
      },
    },
  };

  return {
    id: "c1-completed",
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
        userAnswer: '{"aPrime":"40","bPrime":"225","result":"90"}',
        response: {
          kind: "structured",
          fields: { aPrime: "40", bPrime: "225", result: "90" },
        },
        isCorrect: true,
        accuracyLevel: "accepted",
        timeUsedMs: 4200,
        restartCount: 0,
        usedScratchpad: false,
        gradingMetrics: {
          gradingKind: "custom",
          gradingVersion: "c1-multiplication-scaling-v3",
          aPrime: 0.4,
          bPrime: 225,
          result: 90,
          directionPass: true,
          costPass: true,
          methodPass: true,
          executionPass: true,
          totalPass: true,
          methodError: 0.002,
          executionError: 0,
          totalError: 0.002,
          largeAdjustment: false,
        },
      },
    ],
    currentAnswer: "",
    currentRestartCount: 0,
    accumulatedMs: 4200,
    runningSince: null,
    pauseDurationMs: 0,
    status: "completed",
    startedAt: 1000,
    completedAt: 5200,
    trainingSource: "normal",
    schemaVersion: 3,
    trainingMode: "c_task",
    difficultyBand: "L1",
    cProject: "C1",
    cTrainingMode: "specialty",
    gradingRuleVersion: "c1-multiplication-scaling-v3",
  };
}

beforeEach(removeDatabase);
afterEach(removeDatabase);

describe("C1 structured data closure", () => {
  it("round-trips structured response, percentage presentation and grading metrics through IndexedDB", async () => {
    const source = completedC1Session();
    await saveSession(source);

    const [saved] = await readCompleted();
    expect(saved).toMatchObject({
      id: source.id,
      cProject: "C1",
      status: "completed",
    });
    expect(saved.questions[0].data).toMatchObject({
      c1APresentation: "percent",
      c1PresentationPattern: "percent_left",
    });
    expect(saved.records[0].response).toEqual(source.records[0].response);
    expect(saved.records[0].gradingMetrics).toMatchObject({
      aPrime: 0.4,
      bPrime: 225,
      directionPass: true,
      costPass: true,
      methodPass: true,
      executionPass: true,
      totalPass: true,
    });
  });

  it("exports the same C1 response, grading diagnostics and presentation facts without inference", () => {
    const session = completedC1Session();
    const row: CloudCompletedTrainingRow = {
      session_id: session.id,
      owner_id: "owner-1",
      owner_role: "fish",
      question_type: "c_training",
      subtype: "c_task",
      question_count: 1,
      generator_version: "c1-v3",
      grading_version: "c1-multiplication-scaling-v3",
      rating_version: "legacy_dynamic",
      schema_version: 3,
      session_data: session as unknown as Record<string, unknown>,
      completed_at: "2026-09-29T00:00:00Z",
      created_at: "2026-09-29T00:00:00Z",
    };

    const exported = createDataExport([row]);
    const question = exported.questions[0];

    expect(exported.trainings[0]).toMatchObject({
      c_project: "C1",
      difficulty_band: "L1",
      grading_rule_version: "c1-multiplication-scaling-v3",
    });
    expect(JSON.parse(question.response_json)).toEqual(
      session.records[0].response,
    );
    expect(JSON.parse(question.grading_metrics_json)).toMatchObject({
      aPrime: 0.4,
      bPrime: 225,
      methodError: 0.002,
      totalError: 0.002,
    });
    expect(JSON.parse(question.question_data_json)).toMatchObject({
      c1APresentation: "percent",
      c1BPresentation: "number",
      c1PresentationPattern: "percent_left",
    });
  });
});
