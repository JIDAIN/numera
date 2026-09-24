import { describe, expect, it } from "vitest";
import {
  cProjectDisplaySubtitle,
  generateImplementedCProjectSet,
  isImplementedCProject,
} from "./c-project-registry";
import { GenerationContext } from "./generate";

function context(seed = 0.413): GenerationContext {
  let id = 0;
  let state = seed;
  return {
    random: () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    },
    createId: () => `registry-${id++}`,
  };
}

describe("C project registry", () => {
  it("marks C3 and C4 current while C1 and C2 remain reserved", () => {
    expect(isImplementedCProject("C1")).toBe(false);
    expect(isImplementedCProject("C2")).toBe(false);
    expect(isImplementedCProject("C3")).toBe(true);
    expect(isImplementedCProject("C4")).toBe(true);
  });

  it("generates C3 from the shared project registry and keeps the friendly subtitle", () => {
    const questions = generateImplementedCProjectSet(
      {
        project: "C3",
        mode: "specialty",
        difficultyBand: "L2",
        questionCount: 20,
      },
      context(),
    );

    expect(questions).toHaveLength(20);
    expect(
      questions?.every((question) => question.cMeta?.project === "C3"),
    ).toBe(true);
    expect(
      cProjectDisplaySubtitle({
        project: "C3",
        mode: "specialty",
        difficultyBand: "L2",
      }),
    ).toBe("困难 · 20题");
  });
});
