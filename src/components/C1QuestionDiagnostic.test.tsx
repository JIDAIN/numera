import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { C1QuestionDiagnostic } from "./C1QuestionDiagnostic";
import { TrainingSession } from "@/lib/types";

type RecordItem = TrainingSession["records"][number];

function record(overrides: Partial<RecordItem> = {}): RecordItem {
  return {
    question: {
      id: "c1-q",
      type: "c_training",
      subtype: "c_task",
      prompt: "424 × 214",
      answer: "90736",
      data: {
        a: 424,
        b: 214,
        c1RecommendedAPrime: 420,
        c1RecommendedBPrime: 215,
        c1RecommendedMethodError: 0.0048,
      },
      difficulty: { level: 1, tags: ["L1"] },
      primaryStructure: "obvious",
      secondaryTags: [],
      generationRuleVersion: "c1-v2",
      difficultyBand: "L1",
      inputKind: "structured",
      cMeta: {
        project: "C1",
        mode: "specialty",
        grading: {
          kind: "custom",
          graderId: "c1-multiplication-scaling-v2",
          version: "c1-multiplication-scaling-v2",
        },
      },
    },
    userAnswer: '{"aPrime":"420","bPrime":"215","result":"90300"}',
    response: {
      kind: "structured",
      fields: { aPrime: "420", bPrime: "215", result: "90300" },
    },
    isCorrect: false,
    accuracyLevel: "wrong",
    timeUsedMs: 4200,
    restartCount: 0,
    usedScratchpad: false,
    gradingMetrics: {
      directionPass: true,
      actualDirectionPattern: "left_down_right_up",
      costPass: false,
      methodPass: true,
      executionPass: false,
      totalPass: false,
      largeAdjustment: true,
      maxAdjustment: 0.118,
      methodError: 0.0048,
      executionError: 0.027,
      totalError: 0.031,
    },
    ...overrides,
  };
}

describe("C1QuestionDiagnostic", () => {
  afterEach(() => cleanup());

  it("separates each observable C1 failure cause and keeps the system route as reference only", () => {
    render(<C1QuestionDiagnostic record={record()} />);

    expect(screen.getByText("逐项诊断")).toBeTruthy();
    expect(screen.getByText("实际路线：左侧下调 · 右侧上调")).toBeTruthy();
    expect(screen.getByText("完整放缩路线没有形成足够的成本下降")).toBeTruthy();
    expect(screen.getByText("0.48% · ≤ 2%")).toBeTruthy();
    expect(screen.getByText("2.70% · > 2%")).toBeTruthy();
    expect(screen.getByText("3.10% · > 2%")).toBeTruthy();
    expect(screen.getByText(/调整幅度 11.80%/)).toBeTruthy();
    expect(screen.getByText(/A′=420 · B′=215 · 方法误差 0.48%/)).toBeTruthy();
    expect(screen.getByText("仅作参考，不是唯一答案。")).toBeTruthy();
  });

  it("explains an invalid direction without inventing a user route label", () => {
    const invalid = record({
      gradingMetrics: {
        directionPass: false,
        costPass: true,
        methodPass: true,
        executionPass: true,
        totalPass: true,
        methodError: 0.01,
        executionError: 0.01,
        totalError: 0.01,
      },
    });
    render(<C1QuestionDiagnostic record={invalid} />);

    expect(screen.getByText("A′、B′ 没有形成反向调整")).toBeTruthy();
    expect(screen.queryByText(/实际路线：/)).toBeNull();
  });

  it("does not render for non-C1 records", () => {
    const other = record({
      question: {
        ...record().question,
        cMeta: {
          project: "C3",
          mode: "specialty",
          grading: { kind: "exact", version: "test" },
        },
      },
    });

    const { container } = render(<C1QuestionDiagnostic record={other} />);
    expect(container.innerHTML).toBe("");
  });
});
