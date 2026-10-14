import { describe, expect, it } from "vitest";
import { GenerationContext } from "../generate";
import { encodeC2Preset } from "./contract";
import { generateC2RuntimeSet } from "./runtime";

function context(seed = 0.417): GenerationContext {
  let id = 0;
  let state = seed;
  return {
    random: () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    },
    createId: () => `c2-runtime-${id++}`,
  };
}

describe("C2 runtime-set dispatcher", () => {
  it("generates solve-r blocks only when a frontend difficulty is supplied", () => {
    expect(
      generateC2RuntimeSet(
        {
          preset: { mode: "support", support: "r" },
          questionCount: 10,
        },
        context(),
      ),
    ).toBeUndefined();

    const questions = generateC2RuntimeSet(
      {
        preset: { mode: "support", support: "r" },
        difficultyBand: "L2",
        questionCount: 10,
      },
      context(),
    );

    expect(questions).toHaveLength(10);
    expect(
      questions?.every(
        (question) =>
          question.data.c2TaskKind === "support_r" &&
          question.difficultyBand === "L2" &&
          question.cMeta?.preset ===
            encodeC2Preset({ mode: "support", support: "r" }),
      ),
    ).toBe(true);
  });

  it("rejects retired N×r mixed and method-choice sessions", () => {
    for (const count of [10, 20]) {
      expect(
        generateC2RuntimeSet(
          {
            preset: { mode: "support", support: "nxr", variant: "mixed" },
            questionCount: count,
          },
          context(0.623),
        ),
      ).toBeUndefined();
      expect(
        generateC2RuntimeSet(
          {
            preset: { mode: "method_choice" },
            questionCount: count,
          },
          context(0.731),
        ),
      ).toBeUndefined();
    }
  });

  it("generates only first- or second-order N×r in 10/20-question sets", () => {
    for (const variant of ["ordinary", "second_order"] as const) {
      for (const count of [10, 20]) {
        const questions = generateC2RuntimeSet(
          {
            preset: { mode: "support", support: "nxr", variant },
            questionCount: count,
          },
          context(0.517),
        );
        expect(questions).toHaveLength(count);
        expect(
          questions?.every((question) => question.data.c2NxrVariant === variant),
        ).toBe(true);
      }
    }
  });

  it("rejects non-10/20 session lengths for every mode", () => {
    for (const count of [6, 8, 12, 21, 0, 10.5]) {
      expect(
        generateC2RuntimeSet(
          {
            preset: { mode: "support", support: "r" },
            difficultyBand: "L1",
            questionCount: count,
          },
          context(),
        ),
      ).toBeUndefined();
      expect(
        generateC2RuntimeSet(
          { preset: { mode: "comprehensive" }, questionCount: count },
          context(),
        ),
      ).toBeUndefined();
    }
  });

  it("generates comprehensive frozen questions without assigning a user method", () => {
    const questions = generateC2RuntimeSet(
      {
        preset: { mode: "comprehensive" },
        questionCount: 10,
      },
      context(0.811),
    );

    expect(questions).toHaveLength(10);
    questions?.forEach((question) => {
      expect(question.data.c2TaskKind).toBe("comprehensive");
      expect(question.data.c2GenerationMode).toBe("number_first");
      expect(question.data).not.toHaveProperty("selectedMethod");
      expect(question.data).not.toHaveProperty("methodUsed");
    });
  });

  it("does not silently generate still-unclosed full method workspaces", () => {
    expect(
      generateC2RuntimeSet(
        {
          preset: { mode: "method", route: "direct" },
          difficultyBand: "L1",
          questionCount: 10,
        },
        context(),
      ),
    ).toBeUndefined();
  });
});
