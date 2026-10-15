import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createC2PilotSession } from "@/lib/c2/pilot-session";
import { C2PilotTraining } from "./C2PilotTraining";

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
});
