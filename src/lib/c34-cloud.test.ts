import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrainingSession } from "./types";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc }),
}));

function cSession(project: "C3" | "C4"): TrainingSession {
  const isC3 = project === "C3";
  const question = isC3
    ? {
        id: "c3-cloud-q",
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
        },
        difficulty: { level: 3 as const, tags: ["L2", "S2", "normal"] },
        primaryStructure: "S2",
        secondaryTags: ["normal", "delta"],
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
      }
    : {
        id: "c4-cloud-q",
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

  const answer = isC3 ? "<" : "17.48";
  return {
    id: isC3 ? "c3-cloud-session" : "c4-cloud-session",
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
        userAnswer: answer,
        response: { kind: "single", value: answer },
        isCorrect: true,
        accuracyLevel: isC3 ? "exact" : "accepted",
        relativeError: isC3 ? undefined : 0.00014,
        timeUsedMs: isC3 ? 1800 : 3200,
        restartCount: 0,
        usedScratchpad: false,
        gradingMetrics: isC3
          ? {
              gradingKind: "exact",
              gradingVersion: "c3-exact-comparison-v1",
            }
          : {
              gradingKind: "relative_error",
              gradingVersion: "c4-relative-error-v1",
              tolerance: 0.02,
            },
      },
    ],
    currentAnswer: "",
    currentRestartCount: 0,
    accumulatedMs: isC3 ? 1800 : 3200,
    runningSince: null,
    pauseDurationMs: 0,
    status: "completed",
    startedAt: 1000,
    completedAt: isC3 ? 2800 : 4200,
    trainingSource: "normal",
    schemaVersion: 3,
    trainingMode: "c_task",
    difficultyBand: "L2",
    cProject: project,
    cTrainingMode: "specialty",
    cPreset: isC3 ? undefined : "anchor=286;operation=divide",
    gradingRuleVersion: isC3
      ? "c3-exact-comparison-v1"
      : "c4-relative-error-v1",
  };
}

describe("C3/C4 cloud payload closure", () => {
  beforeEach(() => {
    vi.resetModules();
    rpc.mockReset();
    rpc.mockResolvedValue({ error: null });
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.test";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "key";
  });

  for (const project of ["C3", "C4"] as const) {
    it(
      project +
        " uploads frozen question facts, response and grading metrics unchanged",
      async () => {
        const { syncCompleted } = await import("./cloud");
        const session = cSession(project);

        await expect(syncCompleted(session)).resolves.toBe(true);

        expect(rpc).toHaveBeenCalledTimes(1);
        const [, args] = rpc.mock.calls[0];
        expect(args.p_generator_version).toBe(
          project === "C3" ? "c3-v1" : "c4-v1",
        );
        expect(args.p_grading_version).toBe(
          project === "C3" ? "c3-exact-comparison-v1" : "c4-relative-error-v1",
        );
        expect(args.p_schema_version).toBe(3);
        expect(args.p_session_data.cProject).toBe(project);
        expect(args.p_session_data.records[0].response).toEqual(
          session.records[0].response,
        );
        expect(args.p_session_data.records[0].gradingMetrics).toEqual(
          session.records[0].gradingMetrics,
        );

        if (project === "C3") {
          expect(args.p_session_data.questions[0].data).toMatchObject({
            c3StructureLevel: "S2",
            c3Salience: "normal",
            c3RatioZone: "both_below_1",
            c3DeltaCue: "normal",
          });
        } else {
          expect(args.p_session_data.questions[0].data).toMatchObject({
            c4BaseAnchor: 286,
            c4Operation: "divide",
            c4ScaleExponent: 0,
          });
        }
      },
    );
  }
});
