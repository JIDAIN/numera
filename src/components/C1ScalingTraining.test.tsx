import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { C1ScalingTraining } from "./C1ScalingTraining";
import { TrainingSession } from "@/lib/types";

function session(): TrainingSession {
  const question = {
    id: "c1-q",
    type: "c_training" as const,
    subtype: "c_task" as const,
    prompt: "424 × 214",
    answer: String(424 * 214),
    data: { a: 424, b: 214 },
    difficulty: { level: 1 as const, tags: ["L1"] },
    primaryStructure: "obvious",
    secondaryTags: [],
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
    id: "c1-session",
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
    difficultyBand: "L1",
    cProject: "C1",
    cTrainingMode: "specialty",
  };
}

describe("C1ScalingTraining", () => {
  it("collects A-prime, B-prime and U as one structured response", () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    let current = session();
    onChange.mockImplementation((next) => {
      current = next;
    });
    const { rerender } = render(
      <C1ScalingTraining
        isRestarting={false}
        onChange={onChange}
        onRestart={vi.fn()}
        onSubmit={onSubmit}
        session={current}
      />,
    );

    fireEvent.change(screen.getByLabelText("调整后第一个因子"), {
      target: { value: "420" },
    });
    current = onChange.mock.calls.at(-1)?.[0];
    rerender(
      <C1ScalingTraining
        isRestarting={false}
        onChange={onChange}
        onRestart={vi.fn()}
        onSubmit={onSubmit}
        session={current}
      />,
    );

    fireEvent.change(screen.getByLabelText("调整后第二个因子"), {
      target: { value: "215" },
    });
    current = onChange.mock.calls.at(-1)?.[0];
    rerender(
      <C1ScalingTraining
        isRestarting={false}
        onChange={onChange}
        onRestart={vi.fn()}
        onSubmit={onSubmit}
        session={current}
      />,
    );

    fireEvent.change(screen.getByLabelText("最终结果"), {
      target: { value: "90300" },
    });
    current = onChange.mock.calls.at(-1)?.[0];
    rerender(
      <C1ScalingTraining
        isRestarting={false}
        onChange={onChange}
        onRestart={vi.fn()}
        onSubmit={onSubmit}
        session={current}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "提交本题" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].currentResponse).toEqual({
      kind: "structured",
      fields: { aPrime: "420", bPrime: "215", result: "90300" },
    });
  });
});
