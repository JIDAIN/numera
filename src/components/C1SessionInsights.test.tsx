import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { C1SessionInsights } from "./C1SessionInsights";
import { TrainingSession } from "@/lib/types";

function session(): TrainingSession {
  const question = {
    id: "c1-q",
    type: "c_training" as const,
    subtype: "c_task" as const,
    prompt: "424 × 214",
    answer: "90736",
    data: {
      a: 424,
      b: 214,
      c1ChallengeType: "obvious",
      c1DirectionPattern: "left_down_right_up",
    },
    difficulty: { level: 1 as const, tags: ["L1"] },
    primaryStructure: "obvious",
    secondaryTags: ["left_down_right_up"],
    generationRuleVersion: "c1-v1",
    difficultyBand: "L1" as const,
    inputKind: "structured" as const,
    cMeta: {
      project: "C1" as const,
      mode: "specialty" as const,
      grading: {
        kind: "custom" as const,
        graderId: "c1-multiplication-scaling-v1",
        version: "c1-multiplication-scaling-v1",
      },
    },
  };
  return {
    id: "c1-result",
    userId: "fish",
    questionType: "c_training",
    subtype: "c_task",
    questionCount: 1,
    questions: [question],
    currentIndex: 1,
    records: [
      {
        question,
        userAnswer: '{"aPrime":"420","bPrime":"215","result":"90300"}',
        response: {
          kind: "structured",
          fields: { aPrime: "420", bPrime: "215", result: "90300" },
        },
        isCorrect: true,
        accuracyLevel: "accepted",
        timeUsedMs: 4200,
        restartCount: 0,
        usedScratchpad: false,
        gradingMetrics: {
          directionPass: true,
          costPass: true,
          methodPass: true,
          executionPass: true,
          totalPass: true,
          largeAdjustment: false,
          methodError: 0.0048,
          executionError: 0,
          totalError: 0.0048,
        },
      },
    ],
    currentAnswer: "",
    currentRestartCount: 0,
    accumulatedMs: 4200,
    runningSince: null,
    pauseDurationMs: 0,
    status: "completed",
    startedAt: 1,
    completedAt: 2,
    trainingSource: "normal",
    schemaVersion: 3,
    trainingMode: "c_task",
    difficultyBand: "L1",
    cProject: "C1",
    cTrainingMode: "specialty",
  };
}

describe("C1SessionInsights", () => {
  it("shows observed route and error diagnostics without claiming a mental method", () => {
    render(<C1SessionInsights session={session()} />);

    expect(screen.getByText("放缩方案与误差表现")).toBeTruthy();
    expect(screen.getByText("方向相反")).toBeTruthy();
    expect(screen.getByText("计算成本下降")).toBeTruthy();
    expect(screen.getByText("方法误差 ≤ 2%")).toBeTruthy();
    expect(screen.getByText("执行误差 ≤ 2%")).toBeTruthy();
    expect(screen.getByText("总误差 ≤ 2%")).toBeTruthy();
    expect(screen.getByText("明显目标")).toBeTruthy();
    expect(screen.getByText(/不会反推未提交的心算方法/)).toBeTruthy();
  });
});
