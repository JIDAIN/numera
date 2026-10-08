import { describe, expect, it } from "vitest";
import { GenerationContext } from "../generate";
import {
  C2_METHOD_CHOICE_DEFAULT_COUNT,
  encodeC2Preset,
} from "./contract";
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

  it("preserves the locked 7+3 mixed N×r distribution", () => {
    const questions = generateC2RuntimeSet(
      {
        preset: { mode: "support", support: "nxr", variant: "mixed" },
        questionCount: 10,
      },
      context(0.623),
    );

    expect(questions).toHaveLength(10);
    expect(
      questions?.filter(
        (question) => question.data.c2NxrVariant === "ordinary",
      ),
    ).toHaveLength(7);
    expect(
      questions?.filter(
        (question) => question.data.c2NxrVariant === "second_order",
      ),
    ).toHaveLength(3);
  });

  it("keeps the method-choice backend locked to ten questions", () => {
    expect(
      generateC2RuntimeSet(
        {
          preset: { mode: "method_choice" },
          questionCount: C2_METHOD_CHOICE_DEFAULT_COUNT,
        },
        context(0.731),
      ),
    ).toHaveLength(10);

    expect(
      generateC2RuntimeSet(
        {
          preset: { mode: "method_choice" },
          questionCount: 20,
        },
        context(0.731),
      ),
    ).toBeUndefined();
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
