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

describe("C4 home to frozen session integration", () => {
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

  it("starts a formal C4 session with frozen project identity and product rules", async () => {
    render(<Home />);
    fireEvent.click(
      screen.getByRole("button", { name: "C4 特殊基准数乘除转换" }),
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "困难" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "除法" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "286" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "开始 20 题" }));

    await waitFor(async () => {
      const active = await readActive();
      expect(active).toMatchObject({
        questionType: "c_training",
        subtype: "c_task",
        questionCount: 20,
        trainingMode: "c_task",
        difficultyBand: "L2",
        cProject: "C4",
        cTrainingMode: "specialty",
        currentIndex: 0,
        status: "active",
        launchSpec: {
          family: "c",
          questionType: "c_training",
          subtype: "c_task",
          questionCount: 20,
          cProject: "C4",
          cTrainingMode: "specialty",
          difficultyBand: "L2",
          pkEligible: false,
        },
      });
      expect(active?.questions).toHaveLength(20);
      expect(
        active?.questions.every(
          (question) =>
            question.cMeta?.project === "C4" &&
            question.cMeta.mode === "specialty" &&
            question.difficultyBand === "L2" &&
            question.data.c4BaseAnchor === 286 &&
            question.data.c4Operation === "divide",
        ),
      ).toBe(true);
    });
  });
});
