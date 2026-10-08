import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TrainingSession } from "@/lib/types";
import { C2Training } from "./C2Training";

function baseSession(
  question: TrainingSession["questions"][number],
): TrainingSession {
  return {
    id: "c2-session",
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
    cProject: "C2",
  };
}

function question(
  taskKind: "support_r" | "support_nxr" | "method_choice" | "comprehensive",
) {
  const supportR = taskKind === "support_r";
  const supportNxr = taskKind === "support_nxr";
  const choice = taskKind === "method_choice";
  return {
    id: `c2-${taskKind}`,
    type: "c_training" as const,
    subtype: "c_task" as const,
    prompt:
      taskKind === "comprehensive"
        ? "64537 ÷ 12218"
        : choice
          ? "424 ÷ 214"
          : supportNxr
            ? "684 × 4.9%，继续复用一阶结果再 × r"
            : "B=150，B₀=143，r = ?%",
    answer: supportR ? "4.9" : supportNxr ? "33.516" : choice ? "split" : "5.282",
    data: {
      c2TaskKind: taskKind,
      ...(supportNxr ? { c2NxrVariant: "second_order" } : {}),
    },
    difficulty: { level: 3 as const, tags: ["C2"] },
    primaryStructure: taskKind,
    secondaryTags: [],
    generationRuleVersion: "c2-v1",
    inputKind: choice ? ("choice" as const) : supportNxr ? ("structured" as const) : ("number" as const),
    cMeta: {
      project: "C2" as const,
      mode:
        taskKind === "method_choice"
          ? ("method_choice" as const)
          : taskKind === "comprehensive"
            ? ("comprehensive" as const)
            : ("support" as const),
      grading: supportR || supportNxr || choice
        ? {
            kind: "custom" as const,
            graderId: "c2-test",
            version: "c2-test",
          }
        : {
            kind: "relative_error" as const,
            tolerance: 0.03,
            version: "c2-test",
          },
    },
  };
}

describe("C2Training", () => {
  afterEach(() => cleanup());

  it("stores solve-r using the semantic rPercent structured field", () => {
    const onChange = vi.fn();
    let current = baseSession(question("support_r"));
    onChange.mockImplementation((next) => {
      current = next;
    });

    const { rerender } = render(
      <C2Training
        isRestarting={false}
        onChange={onChange}
        onRestart={vi.fn()}
        onSubmit={vi.fn()}
        session={current}
      />,
    );

    fireEvent.change(screen.getByLabelText("r百分数"), {
      target: { value: "4.9" },
    });
    current = onChange.mock.calls.at(-1)?.[0];
    rerender(
      <C2Training
        isRestarting={false}
        onChange={onChange}
        onRestart={vi.fn()}
        onSubmit={vi.fn()}
        session={current}
      />,
    );

    expect(current.currentResponse).toEqual({
      kind: "structured",
      fields: { rPercent: "4.9" },
    });
    expect(screen.getByRole("button", { name: "提交本题" })).not.toBeDisabled();
  });

  it("collects both N×r stages and explains that second order follows the user's first result", () => {
    const onChange = vi.fn();
    let current = baseSession(question("support_nxr"));
    onChange.mockImplementation((next) => {
      current = next;
    });
    const onSubmit = vi.fn();

    const renderCurrent = () => (
      <C2Training
        isRestarting={false}
        onChange={onChange}
        onRestart={vi.fn()}
        onSubmit={onSubmit}
        session={current}
      />
    );
    const { rerender } = render(renderCurrent());

    fireEvent.change(screen.getByLabelText("一阶修正量"), {
      target: { value: "33.5" },
    });
    current = onChange.mock.calls.at(-1)?.[0];
    rerender(renderCurrent());

    fireEvent.change(screen.getByLabelText("二阶修正量"), {
      target: { value: "1.64" },
    });
    current = onChange.mock.calls.at(-1)?.[0];
    rerender(renderCurrent());

    expect(screen.getByText(/沿用你自己填写的一阶结果/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "提交本题" }));
    expect(onSubmit.mock.calls[0][0].currentResponse).toEqual({
      kind: "structured",
      fields: {
        firstCorrection: "33.5",
        secondCorrection: "1.64",
      },
    });
  });

  it("submits the first method-choice click as one structured response", () => {
    const onSubmit = vi.fn();
    render(
      <C2Training
        isRestarting={false}
        onChange={vi.fn()}
        onRestart={vi.fn()}
        onSubmit={onSubmit}
        session={baseSession(question("method_choice"))}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "拆分" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].currentResponse).toEqual({
      kind: "structured",
      fields: { selectedRoute: "split" },
    });
  });

  it("keeps comprehensive training final-answer-only", () => {
    const onChange = vi.fn();
    let current = baseSession(question("comprehensive"));
    onChange.mockImplementation((next) => {
      current = next;
    });

    render(
      <C2Training
        isRestarting={false}
        onChange={onChange}
        onRestart={vi.fn()}
        onSubmit={vi.fn()}
        session={current}
      />,
    );

    fireEvent.change(screen.getByLabelText("最终答案"), {
      target: { value: "5.28" },
    });
    current = onChange.mock.calls.at(-1)?.[0];

    expect(current.currentAnswer).toBe("5.28");
    expect(current.currentResponse).toBeUndefined();
    expect(screen.getByText(/系统不会反推你用了哪种方法/)).toBeTruthy();
  });
});
