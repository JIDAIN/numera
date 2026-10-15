import { describe, expect, it } from "vitest";
import { gradeTrainingResponse } from "../grader-registry";
import { GenerationContext } from "../generate";
import {
  C2_METHOD_CHOICE_GRADER_ID,
  decodeC2Preset,
  encodeC2Preset,
} from "./contract";
import * as currentC2 from "./index";
import {
  generateC2ComprehensiveQuestion,
  generateC2MethodChoiceSet,
  generateC2TargetedChoiceQuestion,
  generateC2NaturalCore,
  makeC2MethodChoiceQuestion,
} from "./generator";

function context(seed = 0.371): GenerationContext {
  let id = 0;
  let state = seed;
  return {
    random: () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    },
    createId: () => `c2-generator-${id++}`,
  };
}

describe("C2 number-first and method-choice generation", () => {
  it("keeps natural cores when at least one route is usable without requiring a low route", () => {
    for (const seed of [0.113, 0.217, 0.319, 0.421, 0.527, 0.631, 0.743]) {
      const core = generateC2NaturalCore(context(seed));
      const levels = [
        core.landscape.direct.level,
        core.landscape.split.level,
        core.landscape.scaling.level,
      ];
      expect(levels.every((level) => level === "high")).toBe(false);
      expect(core.landscape.feasibleRoutes.length).toBeGreaterThan(0);
    }
  });

  it("fails closed for all three legacy choice factory paths and removes barrel exports", () => {
    const core = generateC2NaturalCore(context(0.371));
    expect(() =>
      makeC2MethodChoiceQuestion(core, "number_first", context(0.223)),
    ).toThrow(/retired/);
    for (const route of ["direct", "split", "scaling"] as const)
      expect(() =>
        generateC2TargetedChoiceQuestion(route, context(0.571)),
      ).toThrow(/retired/);
    for (const count of [6, 10, 20])
      expect(() =>
        generateC2MethodChoiceSet(count, context(0.517)),
      ).toThrow(/retired/);

    expect(currentC2).not.toHaveProperty("makeC2MethodChoiceQuestion");
    expect(currentC2).not.toHaveProperty("generateC2TargetedChoiceQuestion");
    expect(currentC2).not.toHaveProperty("generateC2MethodChoiceSet");
  });

  it("preserves grading and decoding of an already-frozen v1 choice question", () => {
    // Synthetic frozen-v1 wire fixture, NOT a newly generated choice session.
    const template = generateC2ComprehensiveQuestion(context(0.821));
    const preset = encodeC2Preset({ mode: "method_choice" });
    const oldQuestion = {
      ...template,
      answer: "direct",
      allowedAnswerSet: ["direct", "split"],
      data: {
        ...template.data,
        c2TaskKind: "method_choice",
        c2RecommendedRoutes: ["direct"],
        c2AcceptableRoutes: ["split"],
        c2InefficientRoutes: ["scaling"],
      },
      cMeta: {
        project: "C2" as const,
        mode: "method_choice" as const,
        preset,
        grading: {
          kind: "custom" as const,
          graderId: C2_METHOD_CHOICE_GRADER_ID,
          version: C2_METHOD_CHOICE_GRADER_ID,
        },
      },
    };

    expect(decodeC2Preset("method_choice", preset)).toEqual({
      mode: "method_choice",
    });
    expect(
      gradeTrainingResponse(oldQuestion, { kind: "single", value: "direct" })
        .isCorrect,
    ).toBe(true);
    expect(
      gradeTrainingResponse(oldQuestion, { kind: "single", value: "split" })
        .isCorrect,
    ).toBe(true);
    expect(
      gradeTrainingResponse(oldQuestion, { kind: "single", value: "scaling" })
        .isCorrect,
    ).toBe(false);
  });

  it("wraps comprehensive questions only after revalidating the raw quotient", () => {
    const question = generateC2ComprehensiveQuestion(context(0.821));

    expect(question).toMatchObject({
      type: "c_training",
      inputKind: "number",
      targetPrecision: "3%",
      cMeta: {
        project: "C2",
        mode: "comprehensive",
        grading: {
          kind: "relative_error",
          tolerance: 0.03,
        },
      },
    });
    expect(question.data.c2GenerationMode).toBe("number_first");
    expect(Number(question.data.c2CoreError)).toBeGreaterThanOrEqual(0);

    const grade = gradeTrainingResponse(question, {
      kind: "single",
      value: question.answer,
    });
    expect(grade.isCorrect).toBe(true);
  });
});
