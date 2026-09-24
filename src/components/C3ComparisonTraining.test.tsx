import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { C3ComparisonTraining } from "./C3ComparisonTraining";
import { TrainingSession } from "@/lib/types";

function session(): TrainingSession {
  const question = {
    id: "c3-q",
    type: "c_training" as const,
    subtype: "c_task" as const,
    prompt: "47/100 ？ 95/202",
    answer: "<",
    data: { a: 47, b: 100, c: 95, d: 202 },
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
    id: "c3-session",
    userId: "fish",
    questionType: "c_training",
    subtype: "c_task",
    questionCount: 1,
    questions: [question],
    currentIndex: 0,
    records: [],
    currentAnswer: "",
    currentRestartCount: 0,
    accumulatedMs: 0,
    runningSince: null,
    pauseDurationMs: 0,
    status: "active",
    startedAt: 1,
    trainingSource: "normal",
    schemaVersion: 3,
    trainingMode: "c_task",
    difficultyBand: "L3",
    cProject: "C3",
    cTrainingMode: "specialty",
  };
}

describe("C3ComparisonTraining", () => {
  it("submits the first comparison click immediately", () => {
    const onSubmit = vi.fn();
    render(
      <C3ComparisonTraining
        isRestarting={false}
        onRestart={vi.fn()}
        onSubmit={onSubmit}
        session={session()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "小于" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].currentAnswer).toBe("<");
  });
});
