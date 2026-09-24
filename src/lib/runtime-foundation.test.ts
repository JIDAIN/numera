import { afterEach, describe, expect, it } from "vitest";
import {
  gradeTrainingResponse,
  registerCustomCGrader,
  unregisterCustomCGrader,
} from "./grader-registry";
import {
  buildTrainingLaunchSpec,
  getTrainingDefinition,
  getTrainingDisplayDescriptor,
  isSessionPkEligible,
} from "./training-definition";
import { resolveTrainingRenderer } from "./training-renderer";
import {
  singleTrainingResponse,
  structuredTrainingResponse,
} from "./training-response";
import { createCTrainingSession, createTrainingSession } from "./session";
import { submitCurrentAnswer } from "./training";
import { GeneratedQuestion } from "./types";

afterEach(() => {
  unregisterCustomCGrader("test-structured");
});

describe("training runtime foundation", () => {
  it("defines Classic, A and C as separate training families", () => {
    expect(getTrainingDefinition("two_digit_add_subtract")).toMatchObject({
      family: "classic",
      pkEligible: true,
      analyticsKind: "legacy_rating",
    });
    expect(getTrainingDefinition("skill_drill")).toMatchObject({
      family: "a",
      pkEligible: true,
      analyticsKind: "a_mastery",
    });
    expect(getTrainingDefinition("c_training")).toMatchObject({
      family: "c",
      pkEligible: false,
      analyticsKind: "c_project",
    });
  });

  it("freezes launch contracts on new sessions", () => {
    const classic = createTrainingSession({
      userId: "fish",
      questionType: "two_digit_add_subtract",
      subtype: "standard",
      questionCount: 10,
    });
    const a = createTrainingSession({
      userId: "fish",
      questionType: "skill_drill",
      subtype: "skill:A-ADD-01:L2",
      questionCount: 10,
    });

    expect(classic.launchSpec).toMatchObject({
      version: 1,
      family: "classic",
      questionType: "two_digit_add_subtract",
      subtype: "standard",
      questionCount: 10,
      pkEligible: true,
    });
    expect(a.launchSpec).toMatchObject({
      version: 1,
      family: "a",
      primarySkillId: "A-ADD-01",
      difficultyBand: "L2",
      pkEligible: true,
    });
  });

  it("keeps C project identity separate and disables PK by default", () => {
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
      generationRuleVersion: "test-c4",
      difficultyBand: "L1" as const,
      cMeta: {
        project: "C4" as const,
        mode: "specialty" as const,
        grading: {
          kind: "relative_error" as const,
          tolerance: 0.02,
          version: "test-c4-grade",
        },
      },
    }));
    const session = createCTrainingSession({
      userId: "fish",
      project: "C4",
      mode: "specialty",
      difficultyBand: "L1",
      questionCount: 10,
      questions,
    });

    expect(session.launchSpec).toMatchObject({
      family: "c",
      cProject: "C4",
      cTrainingMode: "specialty",
      pkEligible: false,
    });
    expect(isSessionPkEligible(session)).toBe(false);
    expect(getTrainingDisplayDescriptor(session)).toMatchObject({
      family: "c",
      title: "C4 · 特殊基准数乘除转换",
    });
  });

  it("routes renderer choice through the renderer registry", () => {
    const choice: GeneratedQuestion = {
      id: "choice",
      type: "skill_drill",
      subtype: "skill_drill",
      prompt: "2×3=?",
      answer: "6",
      data: {},
      difficulty: { level: 1, tags: [] },
      primaryStructure: "fact",
      secondaryTags: [],
      generationRuleVersion: "test",
      inputKind: "choice",
    };
    const steps: GeneratedQuestion = {
      ...choice,
      id: "steps",
      inputKind: "steps",
      stepSpecs: [
        {
          id: "step-1",
          stepType: "number",
          prompt: "第一步",
          inputKind: "number",
        },
      ],
    };

    const c3Choice: GeneratedQuestion = {
      ...choice,
      id: "c3-choice",
      type: "c_training",
      subtype: "c_task",
      answer: ">",
      cMeta: {
        project: "C3",
        mode: "specialty",
        grading: {
          kind: "exact",
          normalize: "comparison",
          version: "test-c3",
        },
      },
    };

    expect(resolveTrainingRenderer(choice)).toBe("structured_single");
    expect(resolveTrainingRenderer(steps)).toBe("structured_steps");
    expect(resolveTrainingRenderer(c3Choice)).toBe("c3_comparison");
  });

  it("submits structured-only responses without requiring a legacy scalar answer", () => {
    const question: GeneratedQuestion = {
      id: "c1-submit",
      type: "c_training",
      subtype: "c_task",
      prompt: "structured",
      answer: "",
      data: {},
      difficulty: { level: 3, tags: [] },
      primaryStructure: "structured",
      secondaryTags: [],
      generationRuleVersion: "test",
      difficultyBand: "L3",
      cMeta: {
        project: "C1",
        mode: "specialty",
        grading: {
          kind: "custom",
          graderId: "test-structured",
          version: "1",
        },
      },
    };
    registerCustomCGrader("test-structured", (_question, response) => {
      const accepted =
        response.kind === "structured" && response.fields.final === "100";
      return {
        isCorrect: accepted,
        accuracyLevel: accepted ? "exact" : "wrong",
      };
    });
    const source = createCTrainingSession({
      userId: "fish",
      project: "C1",
      mode: "specialty",
      difficultyBand: "L3",
      questionCount: 10,
      questions: Array.from({ length: 10 }, (_, index) => ({
        ...question,
        id: `c1-submit-${index}`,
      })),
    });
    const completed = submitCurrentAnswer(
      {
        ...source,
        questions: [source.questions[0]],
        questionCount: 1,
        currentAnswer: "",
        currentResponse: structuredTrainingResponse({
          left: "10",
          right: "10",
          final: "100",
        }),
      },
      1_000,
      false,
      2_000,
    );

    expect(completed.status).toBe("completed");
    expect(completed.records[0]).toMatchObject({
      isCorrect: true,
      response: {
        kind: "structured",
        fields: { left: "10", right: "10", final: "100" },
      },
    });
  });

  it("supports registered custom graders with structured responses", () => {
    const question: GeneratedQuestion = {
      id: "c1",
      type: "c_training",
      subtype: "c_task",
      prompt: "structured",
      answer: "",
      data: {},
      difficulty: { level: 3, tags: [] },
      primaryStructure: "structured",
      secondaryTags: [],
      generationRuleVersion: "test",
      cMeta: {
        project: "C1",
        mode: "specialty",
        grading: {
          kind: "custom",
          graderId: "test-structured",
          version: "1",
        },
      },
    };

    registerCustomCGrader("test-structured", (_question, response) => {
      const accepted =
        response.kind === "structured" && response.fields.final === "100";
      return {
        isCorrect: accepted,
        accuracyLevel: accepted ? "exact" : "wrong",
        gradingMetrics: { custom: true },
      };
    });

    const result = gradeTrainingResponse(
      question,
      structuredTrainingResponse({ left: "10", right: "10", final: "100" }),
    );
    expect(result).toMatchObject({
      isCorrect: true,
      accuracyLevel: "exact",
      gradingMetrics: { custom: true },
    });
  });

  it("persists a first-class response while keeping the legacy answer projection", () => {
    const session = createTrainingSession({
      userId: "fish",
      questionType: "two_digit_add_subtract",
      subtype: "standard",
      questionCount: 10,
    });
    const answered = {
      ...session,
      questions: [session.questions[0]],
      questionCount: 1,
      currentAnswer: session.questions[0].answer,
      currentResponse: singleTrainingResponse(session.questions[0].answer),
    };
    const completed = submitCurrentAnswer(answered, 1_000, false, 2_000);

    expect(completed.records[0].response).toEqual(
      singleTrainingResponse(session.questions[0].answer),
    );
    expect(completed.records[0].userAnswer).toBe(session.questions[0].answer);
  });

  it("rejects contradictory family and PK launch contracts", () => {
    expect(() =>
      buildTrainingLaunchSpec({
        family: "a",
        questionType: "c_training",
        subtype: "c_task",
        questionCount: 20,
        trainingMode: "c_task",
      }),
    ).toThrow("Training family");

    expect(() =>
      buildTrainingLaunchSpec({
        pkEligible: true,
        questionType: "c_training",
        subtype: "c_task",
        questionCount: 20,
        trainingMode: "c_task",
      }),
    ).toThrow("PK eligibility");
  });

  it("builds an explicit launch contract without duplicating family rules", () => {
    expect(
      buildTrainingLaunchSpec({
        questionType: "c_training",
        subtype: "c_task",
        questionCount: 20,
        trainingMode: "c_task",
        cProject: "C3",
        cTrainingMode: "specialty",
      }),
    ).toMatchObject({
      family: "c",
      pkEligible: false,
      cProject: "C3",
    });
  });
});
