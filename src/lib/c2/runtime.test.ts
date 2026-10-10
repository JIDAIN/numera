import { describe, expect, it } from "vitest";
import { GenerationContext } from "../generate";
import { decodeC2Preset, encodeC2Preset } from "./contract";
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
          questionCount: 20,
        },
        context(),
      ),
    ).toBeUndefined();

    const questions = generateC2RuntimeSet(
      {
        preset: { mode: "support", support: "r" },
        difficultyBand: "L2",
        questionCount: 20,
      },
      context(),
    );

    expect(questions).toHaveLength(20);
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

  it("generates only one-step or two-step N×r when group size is valid", () => {
    for (const variant of ["ordinary", "second_order"] as const) {
      const questions = generateC2RuntimeSet(
        {
          preset: { mode: "support", support: "nxr", variant },
          questionCount: variant === "ordinary" ? 20 : 10,
        },
        context(0.623),
      );
      expect(questions).toHaveLength(variant === "ordinary" ? 20 : 10);
      expect(questions?.every((q) => q.data.c2NxrVariant === variant)).toBe(
        true,
      );
    }
  });

  it("denies new legacy choice or mixed sets, but preserves v1 decoding", () => {
    const retired = [
      { mode: "support", support: "nxr", variant: "mixed" } as const,
      { mode: "method_choice" } as const,
    ];
    for (const preset of retired) {
      expect(decodeC2Preset(preset.mode, encodeC2Preset(preset))).toEqual(
        preset,
      );
      for (const questionCount of [10, 20]) {
        expect(
          generateC2RuntimeSet({ preset, questionCount }, context(0.731)),
        ).toBeUndefined();
      }
    }
  });

  it("rejects the OTHER allowed length for every supported R2 runtime entry", () => {
    expect(
      generateC2RuntimeSet(
        { preset: { mode: "support", support: "r" }, questionCount: 10, difficultyBand: "L1" },
        context(),
      ),
    ).toBeUndefined();
    expect(
      generateC2RuntimeSet(
        { preset: { mode: "support", support: "nxr", variant: "ordinary" }, questionCount: 10 },
        context(),
      ),
    ).toBeUndefined();
    expect(
      generateC2RuntimeSet(
        { preset: { mode: "support", support: "nxr", variant: "second_order" }, questionCount: 20 },
        context(),
      ),
    ).toBeUndefined();
    expect(
      generateC2RuntimeSet({ preset: { mode: "comprehensive" }, questionCount: 20 }, context()),
    ).toBeUndefined();
    expect(
      generateC2RuntimeSet({ preset: { mode: "method", route: "direct" }, questionCount: 20 }, context()),
    ).toBeUndefined();
  });
  it("rejects invalid group lengths for every active runtime mode", () => {
    for (const questionCount of [6, 8, 12, 21, 10.5]) {
      expect(
        generateC2RuntimeSet(
          {
            preset: { mode: "support", support: "r" },
            difficultyBand: "L1",
            questionCount,
          },
          context(),
        ),
      ).toBeUndefined();
      expect(
        generateC2RuntimeSet(
          { preset: { mode: "comprehensive" }, questionCount },
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
