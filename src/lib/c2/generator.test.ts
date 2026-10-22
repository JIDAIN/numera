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

  it("blocks retired choice factories and barrel exports", () => {
    const core = generateC2NaturalCore(context(0.371));
    const make = () =>
      makeC2MethodChoiceQuestion(core, "number_first", context(0.223));
    expect(make).toThrow(/retired/);

    for (const route of ["direct", "split", "scaling"] as const) {
      const targeted = () =>
        generateC2TargetedChoiceQuestion(route, context(0.571));
      expect(targeted).toThrow(/retired/);
    }

    for (const count of [6, 10, 20]) {
      const group = () => generateC2MethodChoiceSet(count, context(0.517));
      expect(group).toThrow(/retired/);
    }

    expect(currentC2).not.toHaveProperty("makeC2MethodChoiceQuestion");
    expect(currentC2).not.toHaveProperty("generateC2TargetedChoiceQuestion");
    expect(currentC2).not.toHaveProperty("generateC2MethodChoiceSet");
  });

  it("grades a synthetic frozen legacy choice question", () => {
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
    const gradeLegacy = (value: string) =>
      gradeTrainingResponse(oldQuestion, { kind: "single", value }).isCorrect;

    expect(decodeC2Preset("method_choice", preset)).toEqual({
      mode: "method_choice",
    });
    expect(gradeLegacy("direct")).toBe(true);
    expect(gradeLegacy("split")).toBe(true);
    expect(gradeLegacy("scaling")).toBe(false);
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
