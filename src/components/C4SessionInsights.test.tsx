import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { C4SessionInsights } from "./C4SessionInsights";
import { TrainingSession } from "@/lib/types";

function session(): TrainingSession {
  return {
    id: "c4-result",
    userId: "fish",
    questionType: "c_training",
    subtype: "c_task",
    questionCount: 2,
    questions: [],
    currentIndex: 2,
    records: [
      {
        question: {
          id: "q1",
          type: "c_training",
          subtype: "c_task",
          prompt: "1000 × 222 = ?",
          answer: "222000",
          data: {
            c4BaseAnchor: 222,
            c4DisplayedAnchor: 222,
            c4Operation: "multiply",
            c4ScaleExponent: 0,
            c4OtherOperand: 1000,
            c4AnchorGroup: "repeat_digits",
          },
          difficulty: { level: 3, tags: ["L2"] },
          primaryStructure: "repeat_digits_anchor",
          secondaryTags: ["anchor_222", "multiply"],
          generationRuleVersion: "c4-v1",
          difficultyBand: "L2",
          inputKind: "number",
          cMeta: {
            project: "C4",
            mode: "specialty",
            grading: {
              kind: "relative_error",
              tolerance: 0.02,
              version: "c4-relative-error-v1",
            },
          },
        },
        userAnswer: "220000",
        isCorrect: true,
        accuracyLevel: "accepted",
        relativeError: 0.009,
        timeUsedMs: 2400,
        restartCount: 0,
        usedScratchpad: false,
      },
      {
        question: {
          id: "q2",
          type: "c_training",
          subtype: "c_task",
          prompt: "5000 ÷ 286 = ?",
          answer: "17.4825",
          data: {
            c4BaseAnchor: 286,
            c4DisplayedAnchor: 286,
            c4Operation: "divide",
            c4ScaleExponent: 0,
            c4OtherOperand: 5000,
            c4AnchorGroup: "single_anchor",
          },
          difficulty: { level: 3, tags: ["L2"] },
          primaryStructure: "special_anchor",
          secondaryTags: ["anchor_286", "divide"],
          generationRuleVersion: "c4-v1",
          difficultyBand: "L2",
          inputKind: "number",
          cMeta: {
            project: "C4",
            mode: "specialty",
            grading: {
              kind: "relative_error",
              tolerance: 0.02,
              version: "c4-relative-error-v1",
            },
          },
        },
        userAnswer: "17.48",
        isCorrect: true,
        accuracyLevel: "accepted",
        relativeError: 0.00014,
        timeUsedMs: 3200,
        restartCount: 0,
        usedScratchpad: false,
      },
    ],
    currentAnswer: "",
    currentRestartCount: 0,
    accumulatedMs: 5600,
    runningSince: null,
    pauseDurationMs: 0,
    status: "completed",
    startedAt: 1,
    completedAt: 2,
    trainingSource: "normal",
    schemaVersion: 3,
    trainingMode: "c_task",
    difficultyBand: "L2",
    cProject: "C4",
    cTrainingMode: "specialty",
  };
}

describe("C4SessionInsights", () => {
  it("shows final-error, direction, anchor and repeat-digit review facts", () => {
    render(<C4SessionInsights session={session()} />);

    expect(screen.getByText(/平均最终误差/)).toBeTruthy();
    expect(screen.getByText(/最大最终误差/)).toBeTruthy();
    expect(screen.getByText("乘除方向")).toBeTruthy();
    expect(screen.getByText("基准")).toBeTruthy();
    expect(screen.getByText("同类结构")).toBeTruthy();
    expect(screen.getByText("重复数字组")).toBeTruthy();
  });
});
