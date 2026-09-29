import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrainingSession } from "./types";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc }),
}));

function completedC1Session(): TrainingSession {
  const question = {
    id: "c1-cloud-q",
    type: "c_training" as const,
    subtype: "c_task" as const,
    prompt: "42% × 214",
    answer: String(0.42 * 214),
    data: {
      a: 0.42,
      b: 214,
      c1APresentation: "percent",
      c1BPresentation: "number",
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
    id: "c1-cloud-session",
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

describe("C1 cloud payload", () => {
  beforeEach(() => {
    vi.resetModules();
    rpc.mockReset();
    rpc.mockResolvedValue({ error: null });
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.test";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "key";
  });

  it("uploads first-class response and grading metrics unchanged", async () => {
    const { syncCompleted } = await import("./cloud");
    const session = completedC1Session();

    await expect(syncCompleted(session)).resolves.toBe(true);

    expect(rpc).toHaveBeenCalledTimes(1);
    const [, args] = rpc.mock.calls[0];
    expect(args.p_generator_version).toBe("c1-v3");
    expect(args.p_grading_version).toBe("c1-multiplication-scaling-v3");
    expect(args.p_schema_version).toBe(3);
    expect(args.p_session_data.records[0].response).toEqual(
      session.records[0].response,
    );
    expect(args.p_session_data.records[0].gradingMetrics).toEqual(
      session.records[0].gradingMetrics,
    );
    expect(args.p_session_data.questions[0].data).toMatchObject({
      c1APresentation: "percent",
      c1BPresentation: "number",
    });
  });
});
