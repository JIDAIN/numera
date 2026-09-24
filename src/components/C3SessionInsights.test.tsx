import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { C3SessionInsights } from "./C3SessionInsights";
import { TrainingSession } from "@/lib/types";

function session(): TrainingSession {
  const question = {
    id: "c3-q",
    type: "c_training" as const,
    subtype: "c_task" as const,
    prompt: "47/100 ？ 95/202",
    answer: "<",
    data: {
      a: 47,
      b: 100,
      c: 95,
      d: 202,
      c3StructureLevel: "S3",
      c3Salience: "strong",
      c3AppearanceTags: [
        "benchmark",
        "scale",
        "ordinary_two_axis",
        "very_close",
      ],
    },
    difficulty: { level: 5 as const, tags: ["L3", "S3", "strong"] },
    primaryStructure: "S3",
    secondaryTags: ["strong", "very_close"],
    generationRuleVersion: "c3-v1",
    difficultyBand: "L3" as const,
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
    id: "c3-result",
    userId: "fish",
    questionType: "c_training",
    subtype: "c_task",
    questionCount: 1,
    questions: [question],
    currentIndex: 1,
    records: [
      {
        question,
        userAnswer: "<",
        isCorrect: true,
        accuracyLevel: "exact",
        timeUsedMs: 2800,
        restartCount: 0,
        usedScratchpad: false,
      },
    ],
    currentAnswer: "",
    currentRestartCount: 0,
    accumulatedMs: 2800,
    runningSince: null,
    pauseDurationMs: 0,
    status: "completed",
    startedAt: 1,
    completedAt: 2,
    trainingSource: "normal",
    schemaVersion: 3,
    trainingMode: "c_task",
    difficultyBand: "L3",
    cProject: "C3",
    cTrainingMode: "specialty",
  };
}

describe("C3SessionInsights", () => {
  it("shows objective structure review without claiming a user method", () => {
    render(<C3SessionInsights session={session()} />);

    expect(screen.getByText("结构层级")).toBeTruthy();
    expect(screen.getByText("结构显著度")).toBeTruthy();
    expect(screen.getByText("相对 1 的位置")).toBeTruthy();
    expect(screen.getByText("两边都小于1")).toBeTruthy();
    expect(screen.getByText("客观结构画像")).toBeTruthy();
    expect(screen.getByText("非常接近")).toBeTruthy();
    expect(screen.getByText(/不根据最终答案推断/)).toBeTruthy();
  });
});
