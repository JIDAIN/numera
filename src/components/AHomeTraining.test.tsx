import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrainingSession } from "@/lib/types";
import { AHomeTraining } from "./AHomeTraining";

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

function completedSkillSession(
  overrides: Partial<TrainingSession> = {},
): TrainingSession {
  return {
    id: "recent-skill",
    userId: "fish",
    questionType: "skill_drill",
    subtype: "skill:A-COM-01:L3",
    questionCount: 10,
    questions: [],
    currentIndex: 10,
    records: [],
    currentAnswer: "",
    currentRestartCount: 0,
    accumulatedMs: 5_000,
    runningSince: null,
    pauseDurationMs: 0,
    status: "completed",
    startedAt: 100,
    completedAt: 200,
    trainingMode: "skill",
    primarySkillId: "A-COM-01",
    difficultyBand: "L3",
    ...overrides,
  };
}

function renderHome(
  history: TrainingSession[] = [],
  onStartSkill = vi.fn(),
  onStartDaily = vi.fn(),
) {
  render(
    <AHomeTraining
      history={history}
      onStartDaily={onStartDaily}
      onStartSkill={onStartSkill}
      preferenceScope="fish-test"
      userId="fish"
    />,
  );
  return { onStartDaily, onStartSkill };
}

describe("AHomeTraining", () => {
  it("starts a single ability with friendly difficulty labels and 10 questions by default", () => {
    const { onStartSkill } = renderHome();
    fireEvent.click(screen.getByRole("button", { name: "加法 2～3位" }));

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "挑战" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "开始 10 题" }));

    expect(onStartSkill).toHaveBeenCalledWith("A-ADD-01", "L3", 10);
  });

  it("lets the user define and reuse a fixed daily plan", () => {
    const { onStartDaily } = renderHome();
    fireEvent.click(screen.getByRole("button", { name: "去设置" }));

    const dialog = screen.getByRole("dialog");
    const smallDifferenceRow = screen
      .getByText("小差值")
      .closest(".dailyAbilitySetting");
    const inverseFactRow = screen
      .getByText("逆向口诀")
      .closest(".dailyAbilitySetting");
    expect(smallDifferenceRow).toBeTruthy();
    expect(inverseFactRow).toBeTruthy();
    fireEvent.click(
      within(smallDifferenceRow as HTMLElement).getByRole("button", {
        name: "挑战",
      }),
    );
    fireEvent.click(
      within(inverseFactRow as HTMLElement).getByRole("button", {
        name: "标准",
      }),
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "保存日常训练" }));

    expect(screen.getByText("小差值 · 挑战")).toBeTruthy();
    expect(screen.getByText("逆向口诀 · 标准")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "开始 10 题" }));

    expect(onStartDaily).toHaveBeenCalledWith({
      version: 1,
      questionCount: 10,
      entries: [
        { abilityId: "A-COM-01", difficultyBand: "L3" },
        { abilityId: "A-MUL-02", difficultyBand: "L2" },
      ],
    });
  });

  it("shows the latest own non-PK specialty as a quick repeat action", () => {
    const onStartSkill = vi.fn();
    renderHome(
      [
        completedSkillSession(),
        completedSkillSession({
          id: "newer-pk",
          startedAt: 300,
          completedAt: 400,
          trainingSource: "pk",
          primarySkillId: "A-MUL-03",
          subtype: "skill:A-MUL-03:L2",
          difficultyBand: "L2",
        }),
      ],
      onStartSkill,
    );

    expect(screen.getByText("小差值 · 挑战")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "再来一组" }));
    expect(onStartSkill).toHaveBeenCalledWith("A-COM-01", "L3", 10);
  });
});
