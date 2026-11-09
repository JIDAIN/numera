import { describe, expect, it } from "vitest";
import { c2SeededContext } from "./pilot-session";
import { generateC2RuntimeSet } from "./runtime";
import { c2RNominalDisplayConflict } from "./r-admission";
import { c2TruncateToSignificantDigits, c2PassesTarget } from "./math";

describe("C2 support dispatch and math admission", () => {
  it("builds exactly the signed frozen group for all playable modes", () => {
    const shapes = [
      [{ mode: "support", support: "r" }, 20],
      [{ mode: "support", support: "nxr", variant: "ordinary" }, 20],
      [{ mode: "support", support: "nxr", variant: "second_order" }, 10],
      [{ mode: "comprehensive" }, 10],
    ] as const;

    for (const [preset, questionCount] of shapes) {
      const request = {
        preset,
        questionCount,
        difficultyBand: "L2" as const,
      };
      const one = generateC2RuntimeSet(request, c2SeededContext(211));
      const two = generateC2RuntimeSet(request, c2SeededContext(211));
      expect(one).toHaveLength(questionCount);
      expect(two).toEqual(one);
      expect(new Set(one?.map((question) => question.id)).size).toBe(
        questionCount,
      );
      expect(new Set(one?.map((question) => question.prompt)).size).toBe(
        questionCount,
      );
    }
  });

  it("rejects wrong-length and retired modes without generation", () => {
    const rejected = [
      [{ mode: "support", support: "r" }, 10],
      [{ mode: "support", support: "nxr", variant: "ordinary" }, 10],
      [{ mode: "support", support: "nxr", variant: "second_order" }, 20],
      [{ mode: "comprehensive" }, 20],
      [{ mode: "support", support: "nxr", variant: "mixed" }, 10],
      [{ mode: "method_choice" }, 10],
      [{ mode: "method", route: "direct" }, 20],
      [{ mode: "method", route: "direct" }, 8],
      [{ mode: "method", route: "split" }, 20],
      [{ mode: "method", route: "split" }, 8],
    ] as const;

    for (const [preset, questionCount] of rejected)
      expect(
        generateC2RuntimeSet(
          { preset, questionCount, difficultyBand: "L2" },
          c2SeededContext(211),
        ),
      ).toBeUndefined();
  });

  it("launches Scaling exactly ten times with a reproducible seed", () => {
    const request = {
      preset: { mode: "method" as const, route: "scaling" as const },
      questionCount: 10,
    };
    const a = generateC2RuntimeSet(request, c2SeededContext(11));
    expect(a).toHaveLength(10);
    expect(a).toEqual(generateC2RuntimeSet(request, c2SeededContext(11)));
    expect(a?.every((q) => q.data.c2TaskKind === "method_scaling")).toBe(true);
  });

  it("freezes exactly ten deterministic Direct questions under R2", () => {
    const request = {
      preset: { mode: "method" as const, route: "direct" as const },
      questionCount: 10,
    };
    for (const seed of [0, 1, 89, 333]) {
      const questions = generateC2RuntimeSet(request, c2SeededContext(seed));
      expect(questions).toHaveLength(10);
      expect(questions).toEqual(
        generateC2RuntimeSet(request, c2SeededContext(seed)),
      );
      expect(new Set(questions?.map((q) => q.prompt)).size).toBe(10);
      expect(
        questions?.every((q) => q.data.c2TaskKind === "method_direct"),
      ).toBe(true);
    }
  });

  it("freezes exactly ten Split questions without a hidden L allocation", () => {
    const preset = { mode: "method" as const, route: "split" as const };
    for (const seed of [0, 7, 99, 501, 4294967295]) {
      const questions = generateC2RuntimeSet(
        { preset, questionCount: 10 },
        c2SeededContext(seed),
      );
      expect(questions).toHaveLength(10);
      expect(questions).toEqual(
        generateC2RuntimeSet(
          { preset, questionCount: 10 },
          c2SeededContext(seed),
        ),
      );
      expect(new Set(questions?.map((q) => q.prompt)).size).toBe(10);
      expect(
        questions?.every((q) => q.data.c2TaskKind === "method_split"),
      ).toBe(true);
    }
  });

  it("keeps unsupported 6/8/12 lengths and missing internal band closed", () => {
    for (const questionCount of [6, 8, 12])
      expect(
        generateC2RuntimeSet(
          { preset: { mode: "support", support: "r" }, questionCount },
          c2SeededContext(53),
        ),
      ).toBeUndefined();
    expect(
      generateC2RuntimeSet(
        { preset: { mode: "support", support: "r" }, questionCount: 20 },
        c2SeededContext(53),
      ),
    ).toBeUndefined();
  });

  it("keeps the 125/167 strict-vs-nominal r conflict out, not two accepted answers", () => {
    expect(c2RNominalDisplayConflict(125, 167)).toBe(true);
    expect(c2RNominalDisplayConflict(159, 167)).toBe(false);
    expect(c2RNominalDisplayConflict(120, 125)).toBe(false);
    for (const seed of [7, 79, 211, 533, 1031]) {
      const questions = generateC2RuntimeSet(
        {
          preset: { mode: "support", support: "r" },
          questionCount: 20,
          difficultyBand: "L2",
        },
        c2SeededContext(seed),
      );
      expect(questions).toHaveLength(20);
      expect(
        questions?.some((question) =>
          c2RNominalDisplayConflict(
            Number(question.data.c2B),
            Number(question.data.c2B0),
          ),
        ),
      ).toBe(false);
    }
  });

  it("does not confuse accurate Direct digits with comprehensive 3-percent rounding", () => {
    expect(c2TruncateToSignificantDigits(867 / 371, 2)).toBe(2.3);
    expect(c2TruncateToSignificantDigits(890 / 371, 2)).toBe(2.3);
    expect(c2PassesTarget(2.3, 890 / 371)).toBe(false);
  });
});
