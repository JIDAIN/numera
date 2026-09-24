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

describe("C3 home to frozen session integration", () => {
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

  it("starts a formal C3 session with exact quota facts and no method inference", async () => {
    render(<Home />);
    const allPractice = screen
      .getByRole("heading", { name: "全部练习" })
      .parentElement;
    expect(allPractice).toBeTruthy();
    expect(
      within(allPractice as HTMLElement).getByRole("button", {
        name: "C3 分数比较",
      }),
    ).toBeTruthy();
    expect(
      within(allPractice as HTMLElement).getByRole("button", {
        name: "C4 特殊基准数乘除转换",
      }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "C3 分数比较" }));

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "困难" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "开始 20 题" }));

    await waitFor(async () => {
      const active = await readActive();
      expect(active).toMatchObject({
        questionType: "c_training",
        subtype: "c_task",
        questionCount: 20,
        trainingMode: "c_task",
        difficultyBand: "L2",
        cProject: "C3",
        cTrainingMode: "specialty",
        currentIndex: 0,
        status: "active",
        launchSpec: {
          family: "c",
          cProject: "C3",
          cTrainingMode: "specialty",
          difficultyBand: "L2",
          pkEligible: false,
        },
      });
      expect(active?.questions).toHaveLength(20);
      expect(
        active?.questions.every(
          (question) =>
            question.cMeta?.project === "C3" &&
            question.inputKind === "choice" &&
            ["S1", "S2", "S3"].includes(
              String(question.data.c3StructureLevel),
            ) &&
            ["strong", "normal", "weak"].includes(
              String(question.data.c3Salience),
            ) &&
            ["both_below_1", "both_above_1", "cross_1"].includes(
              String(question.data.c3RatioZone),
            ) &&
            question.data.userMethod === undefined,
        ),
      ).toBe(true);
      expect(
        active?.questions.filter((question) => question.answer === ">"),
      ).toHaveLength(10);
      expect(
        active?.questions.filter((question) => question.answer === "<"),
      ).toHaveLength(10);
    });
  });
});
