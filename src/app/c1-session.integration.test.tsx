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

describe("C1 home to frozen session integration", () => {
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

  it("starts a formal C1 session with structured response questions and frozen C identity", async () => {
    render(<Home />);

    const allPractice = screen.getByRole("heading", {
      name: "全部练习",
    }).parentElement;
    expect(allPractice).toBeTruthy();
    expect(
      within(allPractice as HTMLElement).getByRole("button", {
        name: "C1 乘法放缩",
      }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "C1 乘法放缩" }));
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
        cProject: "C1",
        cTrainingMode: "specialty",
        currentIndex: 0,
        status: "active",
        launchSpec: {
          family: "c",
          cProject: "C1",
          cTrainingMode: "specialty",
          difficultyBand: "L2",
          pkEligible: false,
        },
      });
      expect(active?.questions).toHaveLength(20);
      expect(
        active?.questions.every(
          (question) =>
            question.cMeta?.project === "C1" &&
            question.cMeta.grading.kind === "custom" &&
            question.inputKind === "structured" &&
            typeof question.data.a === "number" &&
            typeof question.data.b === "number" &&
            question.data.userMethod === undefined,
        ),
      ).toBe(true);

      const directions = active?.questions.reduce<Record<string, number>>(
        (result, question) => {
          const key = String(question.data.c1DirectionPattern);
          result[key] = (result[key] ?? 0) + 1;
          return result;
        },
        {},
      );
      expect(Object.values(directions ?? {})).toEqual([5, 5, 5, 5]);
    });

    const launched = await readActive();
    const first = launched?.questions[0];
    expect(first).toBeTruthy();
    const aPrime = String(first?.data.c1RecommendedAPrime);
    const bPrime = String(first?.data.c1RecommendedBPrime);
    const result = String(Number(aPrime) * Number(bPrime));

    fireEvent.change(screen.getByLabelText("调整后第一个因子"), {
      target: { value: aPrime },
    });
    fireEvent.change(screen.getByLabelText("调整后第二个因子"), {
      target: { value: bPrime },
    });
    fireEvent.change(screen.getByLabelText("最终结果"), {
      target: { value: result },
    });

    await waitFor(async () => {
      expect((await readActive())?.currentResponse).toEqual({
        kind: "structured",
        fields: { aPrime, bPrime, result },
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "提交本题" }));

    await waitFor(async () => {
      const active = await readActive();
      expect(active?.currentIndex).toBe(1);
      expect(active?.currentResponse).toBeUndefined();
      expect(active?.records[0]).toMatchObject({
        isCorrect: true,
        response: {
          kind: "structured",
          fields: { aPrime, bPrime, result },
        },
      });
    });
  });
});
