import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createC2PilotSession } from "@/lib/c2/pilot-session";
import { C2PilotTraining } from "./C2PilotTraining";
import { C2_SPLIT_PILOT_BLOCKS } from "@/lib/c2/split-pilot";
import { c2PassesTarget, c2Round } from "@/lib/c2/math";


// prettier-ignore
function splitWitness(a: number, b: number) {
  const blocks = C2_SPLIT_PILOT_BLOCKS.flatMap((p) => [p, -p]);
  const target = a / b;
  for (const p of blocks) {
    if (c2PassesTarget(p / 100, target)) return [p];
    for (const q of blocks) {
      if (c2PassesTarget((p + q) / 100, target)) return [p, q];
      for (const r of blocks)
        if (c2PassesTarget((p + q + r) / 100, target))
          return [p, q, r];
    }
  }
  throw new Error("No pilot Split path");
}

// prettier-ignore
describe("C2 candidate playable interaction", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("can start, answer 20 r questions, see results and train again", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const questions = createC2PilotSession("r", 0).questions;
    render(<C2PilotTraining />);
    expect(screen.getByLabelText("选择C2支撑专项")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /求 r.*20题/ }));
    expect(screen.getByLabelText("C2训练作答")).toBeTruthy();

    for (const question of questions) {
      fireEvent.change(screen.getByLabelText("r百分数"), {
        target: { value: question.answer },
      });
      fireEvent.click(screen.getByRole("button", { name: "提交本题" }));
    }

    expect(screen.getByLabelText("C2训练结果")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "答对 20 / 20 题" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "再练一组" }));
    expect(screen.getByLabelText("C2训练作答")).toBeTruthy();
    expect(screen.getByText("第 1 / 20 题")).toBeTruthy();
  });

  it("completes ten chained NxR questions from both real inputs", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const questions = createC2PilotSession("nxr_second", 0).questions;
    render(<C2PilotTraining />);
    fireEvent.click(screen.getByRole("button", { name: /N×r · 二阶.*10题/ }));

    for (const question of questions) {
      fireEvent.change(screen.getByLabelText("一阶修正量"), {
        target: { value: String(question.data.c2ExactC1) },
      });
      fireEvent.change(screen.getByLabelText("二阶修正量"), {
        target: { value: String(question.data.c2ExactC2) },
      });
      fireEvent.click(screen.getByRole("button", { name: "提交本题" }));
    }

    expect(
      screen.getByRole("heading", { name: "答对 10 / 10 题" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "切换专项" }));
    expect(screen.getByLabelText("选择C2支撑专项")).toBeTruthy();
  });

  it("blocks a two-decimal r attempt while keeping the current frozen question", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<C2PilotTraining />);
    fireEvent.click(screen.getByRole("button", { name: /求 r.*20题/ }));
    fireEvent.change(screen.getByLabelText("r百分数"), {
      target: { value: "3.14" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交本题" }));
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("第 1 / 20 题")).toBeTruthy();
  });

  it("does not advance on nondecimal C1 or C2 from the actual React form", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<C2PilotTraining />);
    fireEvent.click(screen.getByRole("button", { name: /N×r · 二阶.*10题/ }));

    fireEvent.change(screen.getByLabelText("一阶修正量"), {
      target: { value: "0x10" },
    });
    fireEvent.change(screen.getByLabelText("二阶修正量"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交本题" }));
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("第 1 / 10 题")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("一阶修正量"), {
      target: { value: "16" },
    });
    fireEvent.change(screen.getByLabelText("二阶修正量"), {
      target: { value: "0b10000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交本题" }));
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("第 1 / 10 题")).toBeTruthy();
  });

  it("plays the ten-question Direct session", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const questions = createC2PilotSession("direct", 0).questions;
    render(<C2PilotTraining />);
    fireEvent.click(screen.getByRole("button", { name: /直除 Direct.*10题/ }));
    expect(screen.getByLabelText("C2训练作答")).toBeTruthy();
    for (const question of questions) {
      fireEvent.change(screen.getByLabelText("首位商"), {
        target: { value: String(question.data.c2DirectFirstDigit) },
      });
      fireEvent.change(screen.getByLabelText("首位商 × 除数"), {
        target: { value: String(question.data.c2DirectFirstProduct) },
      });
      fireEvent.change(screen.getByLabelText("当前真实余量"), {
        target: { value: String(question.data.c2DirectFirstRemainder) },
      });
      fireEvent.change(screen.getByLabelText("第二位商"), {
        target: { value: String(question.data.c2DirectSecondDigit) },
      });
      if (question.data.c2DirectRequestedDigits === 3)
        fireEvent.change(screen.getByLabelText("第三位商"), {
          target: { value: String(question.data.c2DirectThirdDigit) },
        });
      fireEvent.click(screen.getByRole("button", { name: "提交本题" }));
    }
    expect(
      screen.getByRole("heading", { name: "答对 10 / 10 题" }),
    ).toBeTruthy();
    expect(screen.getAllByText(/过程：一致/)).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "再练一组" }));
    expect(screen.getByText("第 1 / 10 题")).toBeTruthy();
  });

  it("does not consume the Direct question when process text is illegal", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const firstQuestion = createC2PilotSession("direct", 0).questions[0];
    render(<C2PilotTraining />);
    fireEvent.click(screen.getByRole("button", { name: /直除 Direct.*10题/ }));
    fireEvent.change(screen.getByLabelText("首位商"), {
      target: { value: "0x1" },
    });
    fireEvent.change(screen.getByLabelText("首位商 × 除数"), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText("当前真实余量"), {
      target: { value: "40" },
    });
    fireEvent.change(screen.getByLabelText("第二位商"), {
      target: { value: "3" },
    });
    if (firstQuestion.data.c2DirectRequestedDigits === 3)
      fireEvent.change(screen.getByLabelText("第三位商"), {
        target: { value: "4" },
      });
    fireEvent.click(screen.getByRole("button", { name: "提交本题" }));
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("第 1 / 10 题")).toBeTruthy();
  });
  it("finishes Split ten questions with entered signed blocks and no forced third", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const questions = createC2PilotSession("split", 0).questions;
    render(<C2PilotTraining />);
    fireEvent.click(screen.getByRole("button", { name: /拆分 Split.*10题/ }));
    for (const q of questions) {
      const a = Number(q.data.c2SplitCoreA);
      const b = Number(q.data.c2SplitCoreB);
      const blocks = splitWitness(a, b);
      let remainder = a;
      for (const [index, percent] of blocks.entries()) {
        if (index > 0)
          fireEvent.click(screen.getByRole("button", { name: "增加下一块" }));
        const number = index + 1;
        const amount = c2Round((percent * b) / 100, 8);
        remainder = c2Round(remainder - amount, 8);
        fireEvent.change(screen.getByLabelText(`拆分第${number}块比例`), {
          target: { value: String(percent) },
        });
        fireEvent.change(screen.getByLabelText(`拆分第${number}块对应量`), {
          target: { value: String(amount) },
        });
        fireEvent.change(screen.getByLabelText(`拆分第${number}块剩余量`), {
          target: { value: String(remainder) },
        });
      }
      fireEvent.change(screen.getByLabelText("拆分最终累计比例"), {
        target: { value: String(blocks.reduce((acc, p) => acc + p, 0)) },
      });
      if (blocks.length < 3)
        expect(screen.queryByLabelText("拆分第3块比例")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "提交本题" }));
    }
    expect(
      screen.getByRole("heading", { name: "答对 10 / 10 题" }),
    ).toBeTruthy();
    expect(screen.getAllByText(/算式一致/)).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "再练一组" }));
    expect(screen.getByText("第 1 / 10 题")).toBeTruthy();
  });

  it("allows removing extra Split blocks; rejects unsupported percent without advance", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<C2PilotTraining />);
    fireEvent.click(screen.getByRole("button", { name: /拆分 Split.*10题/ }));
    expect(screen.queryByLabelText("拆分第3块比例")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "增加下一块" }));
    fireEvent.click(screen.getByRole("button", { name: "增加下一块" }));
    expect(screen.getByLabelText("拆分第3块比例")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "移除最后一块" }));
    fireEvent.click(screen.getByRole("button", { name: "移除最后一块" }));
    expect(screen.queryByLabelText("拆分第2块比例")).toBeNull();
    fireEvent.change(screen.getByLabelText("拆分第1块比例"), {
      target: { value: "0.2" },
    });
    fireEvent.change(screen.getByLabelText("拆分第1块对应量"), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText("拆分第1块剩余量"), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText("拆分最终累计比例"), {
      target: { value: "0.2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交本题" }));
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("第 1 / 10 题")).toBeTruthy();
  });

});
