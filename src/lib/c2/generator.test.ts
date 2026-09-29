import { describe, expect, it } from "vitest";
import { gradeTrainingResponse } from "../grader-registry";
import { GenerationContext } from "../generate";
import {
  generateC2ComprehensiveQuestion,
  generateC2MethodChoiceSet,
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

  it("builds the locked 6 targeted + 4 number-first method-choice set", () => {
    const questions = generateC2MethodChoiceSet(10, context(0.517));

    expect(questions).toHaveLength(10);
    expect(
      questions.filter(
        (question) => question.data.c2GenerationMode === "targeted",
      ),
    ).toHaveLength(6);
    expect(
      questions.filter(
        (question) => question.data.c2GenerationMode === "number_first",
      ),
    ).toHaveLength(4);
    expect(
      questions.every(
        (question) =>
          question.cMeta?.project === "C2" &&
          question.cMeta.mode === "method_choice",
      ),
    ).toBe(true);
  });

  it("treats both recommended and acceptable route choices as correct", () => {
    let question;
    for (const seed of [0.137, 0.263, 0.389, 0.511, 0.647, 0.773]) {
      const candidate = makeC2MethodChoiceQuestion(
        generateC2NaturalCore(context(seed)),
        "number_first",
        context(seed + 0.01),
      );
      if (
        (candidate.data.c2AcceptableRoutes as string[]).length > 0 &&
        (candidate.data.c2InefficientRoutes as string[]).length > 0
      ) {
        question = candidate;
        break;
      }
    }

    expect(question).toBeDefined();
    const recommended = (question!.data.c2RecommendedRoutes as string[])[0];
    const acceptable = (question!.data.c2AcceptableRoutes as string[])[0];
    const inefficient = (question!.data.c2InefficientRoutes as string[])[0];

    expect(
      gradeTrainingResponse(question!, {
        kind: "single",
        value: recommended,
      }).isCorrect,
    ).toBe(true);
    expect(
      gradeTrainingResponse(question!, {
        kind: "single",
        value: acceptable,
      }).isCorrect,
    ).toBe(true);
    expect(
      gradeTrainingResponse(question!, {
        kind: "single",
        value: inefficient,
      }).isCorrect,
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
