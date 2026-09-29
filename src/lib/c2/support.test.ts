import { describe, expect, it } from "vitest";
import { gradeTrainingResponse } from "../grader-registry";
import { GenerationContext } from "../generate";
import {
  generateC2SupportNxrQuestion,
  generateC2SupportNxrSet,
  generateC2SupportRQuestion,
} from "./support";

function context(seed = 0.371): GenerationContext {
  let id = 0;
  let state = seed;
  return {
    random: () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    },
    createId: () => `c2-support-${id++}`,
  };
}

describe("C2 support drills", () => {
  it("generates solve-r facts and grades the locked 0.1 percentage-point result", () => {
    const question = generateC2SupportRQuestion("L2", context());
    const expected = Number(question.data.c2ExpectedRPercent);

    expect(question).toMatchObject({
      type: "c_training",
      difficultyBand: "L2",
      inputKind: "number",
      cMeta: {
        project: "C2",
        mode: "support",
        grading: { kind: "custom" },
      },
    });

    expect(
      gradeTrainingResponse(question, {
        kind: "single",
        value: String(expected),
      }).isCorrect,
    ).toBe(true);

    expect(
      gradeTrainingResponse(question, {
        kind: "single",
        value: String(expected + 0.1),
      }).isCorrect,
    ).toBe(false);
  });

  it("grades second-order N×r from the user's own first-order value", () => {
    const question = generateC2SupportNxrQuestion(
      "second_order",
      context(0.517),
    );
    const exactC1 = Number(question.data.c2ExactC1);
    const r = Number(question.data.c2R);
    const userC1 = exactC1 * 1.049;
    const processC2 = Math.abs(userC1) * r;
    const userC2 = processC2 * 1.049;

    const grade = gradeTrainingResponse(question, {
      kind: "structured",
      fields: {
        firstCorrection: String(userC1),
        secondCorrection: String(userC2),
      },
    });

    expect(grade.isCorrect).toBe(true);
    expect(grade.gradingMetrics?.c1Passed).toBe(true);
    expect(grade.gradingMetrics?.c2Passed).toBe(true);
    expect(grade.gradingMetrics?.processExpectedC2).toBeCloseTo(processC2);
    expect(Number(grade.gradingMetrics?.c2VsExactError)).toBeGreaterThan(0.05);
  });

  it("keeps the locked mixed set at 7 ordinary plus 3 second-order questions", () => {
    const questions = generateC2SupportNxrSet("mixed", 10, context(0.733));
    expect(questions).toHaveLength(10);
    expect(
      questions.filter(
        (question) => question.data.c2NxrVariant === "ordinary",
      ),
    ).toHaveLength(7);
    expect(
      questions.filter(
        (question) => question.data.c2NxrVariant === "second_order",
      ),
    ).toHaveLength(3);
    expect(
      questions.every((question) => question.cMeta?.preset?.includes("mixed")),
    ).toBe(true);
  });
});
