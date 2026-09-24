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
  it("marks C1, C3 and C4 current while C2 remains reserved", () => {
    expect(isImplementedCProject("C1")).toBe(true);
    expect(isImplementedCProject("C2")).toBe(false);
    expect(isImplementedCProject("C3")).toBe(true);
    expect(isImplementedCProject("C4")).toBe(true);
  });

  it("generates C1 and C3 from the shared project registry", () => {
    const c1 = generateImplementedCProjectSet(
      {
        project: "C1",
        mode: "specialty",
        difficultyBand: "L1",
        questionCount: 20,
      },
      context(0.517),
    );
    expect(c1).toHaveLength(20);
    expect(c1?.every((question) => question.cMeta?.project === "C1")).toBe(
      true,
    );
    expect(
      cProjectDisplaySubtitle({
        project: "C1",
        mode: "specialty",
        difficultyBand: "L1",
      }),
    ).toBe("简单 · 20题");

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
