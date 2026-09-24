import { describe, expect, it } from "vitest";
import { gradeCQuestion } from "./c-training";
import {
  C4_ALL_ANCHORS,
  C4_GRADING_VERSION,
  C4_L1_ANCHORS,
  C4_L2_ANCHORS,
  C4_QUESTION_COUNT,
  C4_SCALE_EXPONENTS,
  C4_TOLERANCE,
  decodeC4Preset,
  encodeC4Preset,
  generateC4Set,
} from "./c4-training";
import { GenerationContext } from "./generate";

function context(seed = 0.371): GenerationContext {
  let id = 0;
  let state = seed;
  return {
    random: () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    },
    createId: () => `c4-${id++}`,
  };
}

describe("C4 formal generator", () => {
  it("generates a 20-question L1 comprehensive block covering every L1 anchor", () => {
    const questions = generateC4Set(
      { difficultyBand: "L1", anchor: "all", operation: "mixed" },
      C4_QUESTION_COUNT,
      context(),
    );

    expect(questions).toHaveLength(20);
    expect(
      new Set(questions.map((question) => question.data.c4BaseAnchor)),
    ).toEqual(new Set(C4_L1_ANCHORS));
    expect(
      questions.filter(
        (question) => question.data.c4Operation === "multiply",
      ),
    ).toHaveLength(10);
    expect(
      questions.filter((question) => question.data.c4Operation === "divide"),
    ).toHaveLength(10);

    questions.forEach((question) => {
      expect(question).toMatchObject({
        type: "c_training",
        subtype: "c_task",
        difficultyBand: "L1",
        inputKind: "number",
        cMeta: {
          project: "C4",
          mode: "specialty",
          grading: {
            kind: "relative_error",
            tolerance: C4_TOLERANCE,
            version: C4_GRADING_VERSION,
          },
        },
      });
      expect(question.data.c4ScaleExponent).toBe(0);
      expect(String(question.data.c4OtherOperand)).toMatch(/^\d{3,5}$/);
    });
  });

  it("covers every L2 anchor in the L2 comprehensive block", () => {
    const questions = generateC4Set(
      { difficultyBand: "L2", anchor: "all", operation: "multiply" },
      20,
      context(0.217),
    );

    expect(
      new Set(questions.map((question) => question.data.c4BaseAnchor)),
    ).toEqual(new Set(C4_L2_ANCHORS));
    expect(
      questions.every(
        (question) => question.data.c4Operation === "multiply",
      ),
    ).toBe(true);
  });

  it("keeps single-anchor L1/L2 training on the selected anchor", () => {
    const questions = generateC4Set(
      { difficultyBand: "L1", anchor: 125, operation: "divide" },
      20,
      context(0.481),
    );

    expect(
      new Set(questions.map((question) => question.data.c4BaseAnchor)),
    ).toEqual(new Set([125]));
    expect(
      new Set(questions.map((question) => question.data.c4Operation)),
    ).toEqual(new Set(["divide"]));
  });

  it("uses all learned anchors and all four scale exponents in L3", () => {
    const questions = generateC4Set(
      { difficultyBand: "L3", anchor: "all", operation: "mixed" },
      20,
      context(0.613),
    );

    const anchors = new Set(
      questions.map((question) => question.data.c4BaseAnchor),
    );
    C4_ALL_ANCHORS.forEach((anchor) => expect(anchors.has(anchor)).toBe(true));

    const exponentCounts = new Map<number, number>();
    questions.forEach((question) => {
      const exponent = question.data.c4ScaleExponent as number;
      exponentCounts.set(exponent, (exponentCounts.get(exponent) ?? 0) + 1);
      expect(question.primaryStructure).toBe("magnitude_migration");
    });
    expect(new Set(exponentCounts.keys())).toEqual(
      new Set(C4_SCALE_EXPONENTS),
    );
    C4_SCALE_EXPONENTS.forEach((exponent) =>
      expect(exponentCounts.get(exponent)).toBe(5),
    );
  });

  it("round-trips the frozen C4 preset", () => {
    const config = {
      difficultyBand: "L2" as const,
      anchor: 286 as const,
      operation: "mixed" as const,
    };
    const preset = encodeC4Preset(config);
    expect(decodeC4Preset("L2", preset)).toEqual(config);
    expect(decodeC4Preset("L3", preset)).toEqual({
      difficultyBand: "L3",
      anchor: "all",
      operation: "mixed",
    });
  });

  it("grades the final numeric answer with the C4 2% relative-error rule", () => {
    const [question] = generateC4Set(
      { difficultyBand: "L1", anchor: 125, operation: "multiply" },
      20,
      context(0.529),
    );
    const expected = Number(question.answer);

    expect(gradeCQuestion(question, String(expected * 1.019)).isCorrect).toBe(
      true,
    );
    expect(gradeCQuestion(question, String(expected * 1.021)).isCorrect).toBe(
      false,
    );
  });

  it("rejects non-20 formal blocks", () => {
    expect(() =>
      generateC4Set(
        { difficultyBand: "L1", anchor: "all", operation: "mixed" },
        10,
        context(),
      ),
    ).toThrow("20 questions");
  });
});
