import "fake-indexeddb/auto";
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readActive } from "@/lib/storage";
import Home from "./page";

const DB_NAME = "speed-math-v1";

async function deleteDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function dailySettingRow(dialog: HTMLElement, name: string) {
  const row = within(dialog).getByText(name).closest(".dailyAbilitySetting");
  if (!row) throw new Error(`Missing daily setting row: ${name}`);
  return row as HTMLElement;
}

describe("A home to frozen session integration", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
    await deleteDatabase();
  });

  afterEach(async () => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
    await deleteDatabase();
  });

  it("starts a canonical A specialty and freezes the selected ability, difficulty and count", async () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "加法 2～3位" }));

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "挑战" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "开始 10 题" }));

    await waitFor(async () => {
      const active = await readActive();
      expect(active).toMatchObject({
        questionType: "skill_drill",
        subtype: "skill:A-ADD-01:L3",
        questionCount: 10,
        trainingMode: "skill",
        primarySkillId: "A-ADD-01",
        difficultyBand: "L3",
        currentIndex: 0,
        status: "active",
      });
      expect(active?.questions).toHaveLength(10);
      expect(
        active?.questions.every(
          (question) =>
            question.skillId === "A-ADD-01" && question.difficultyBand === "L3",
        ),
      ).toBe(true);
    });
  });

  it("starts the user-configured daily plan as one frozen daily_plan session", async () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "去设置" }));

    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dailySettingRow(dialog, "小差值")).getByRole("button", {
        name: "挑战",
      }),
    );
    fireEvent.click(
      within(dailySettingRow(dialog, "逆向口诀")).getByRole("button", {
        name: "标准",
      }),
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "20题" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "保存日常训练" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "开始 20 题" }));

    await waitFor(async () => {
      const active = await readActive();
      expect(active).toMatchObject({
        questionType: "skill_drill",
        subtype: "daily_plan",
        questionCount: 20,
        trainingMode: "mixed",
        currentIndex: 0,
        status: "active",
      });
      expect(active?.questions).toHaveLength(20);
      expect(
        new Set(active?.questions.map((question) => question.skillId)),
      ).toEqual(new Set(["A-COM-01", "A-MUL-02"]));
      expect(
        active?.questions.every(
          (question) =>
            question.structureTags?.includes("a_daily_training") &&
            question.generatorParams?.dailyAbilityCount === 2,
        ),
      ).toBe(true);
      expect(
        active?.questions
          .filter((question) => question.skillId === "A-COM-01")
          .every((question) => question.difficultyBand === "L3"),
      ).toBe(true);
      expect(
        active?.questions
          .filter((question) => question.skillId === "A-MUL-02")
          .every((question) => question.difficultyBand === "L2"),
      ).toBe(true);
    });
  });
});
