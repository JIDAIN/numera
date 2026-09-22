import { describe, expect, it } from "vitest";
import { gradeCQuestion, UnsupportedCGraderError } from "./c-training";
import { GeneratedQuestion } from "./types";

function cQuestion(
  grading: NonNullable<GeneratedQuestion["cMeta"]>["grading"],
  answer: string,
): GeneratedQuestion {
  return {
    id: "c-q",
    type: "c_training",
    subtype: "c_task",
    prompt: "test",
    answer,
    data: {},
    difficulty: { level: 2, tags: [] },
    primaryStructure: "test",
    secondaryTags: [],
    generationRuleVersion: "c-test",
    difficultyBand: "L2",
    structureTags: [],
    cMeta: {
      project: "C3",
      mode: "specialty",
      preset: "test",
      grading,
    },
  };
}

describe("C-layer grading shell", () => {
  it("normalizes comparison symbols for exact C grading", () => {
    const question = cQuestion(
      { kind: "exact", version: "c3-v1", normalize: "comparison" },
      ">",
    );

    expect(gradeCQuestion(question, "＞")).toMatchObject({
      isCorrect: true,
      accuracyLevel: "exact",
      gradingMetrics: {
        gradingKind: "exact",
        gradingVersion: "c3-v1",
      },
    });
  });

  it("applies the question-owned relative error tolerance", () => {
    const question = cQuestion(
      { kind: "relative_error", tolerance: 0.02, version: "c4-v1" },
      "100",
    );

    expect(gradeCQuestion(question, "101.5")).toMatchObject({
      isCorrect: true,
      accuracyLevel: "accepted",
      relativeError: 0.015,
    });
    expect(gradeCQuestion(question, "103")).toMatchObject({
      isCorrect: false,
      accuracyLevel: "wrong",
      relativeError: 0.03,
    });
  });

  it("never silently falls back for a custom project grader", () => {
    const question = cQuestion(
      { kind: "custom", graderId: "c1_scaling_v1", version: "c1-v1" },
      "100",
    );

    expect(() => gradeCQuestion(question, "100")).toThrow(
      UnsupportedCGraderError,
    );
  });
});
