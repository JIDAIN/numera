import { describe, expect, it } from "vitest";
import { gradeTrainingResponse } from "../grader-registry";
import { GenerationContext } from "../generate";
import { decodeC2Preset, encodeC2Preset } from "./contract";
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

  it("rejects retired mixed factory and enforces current R2 sizes even on direct calls", () => {
    expect(() => generateC2SupportNxrSet("mixed", 10, context())).toThrow(
      /retired/,
    );
    expect(() => generateC2SupportNxrSet("mixed", 20, context())).toThrow(
      /retired/,
    );
    expect(() => generateC2SupportNxrSet("ordinary", 10, context())).toThrow(
      /exactly 20/,
    );
    expect(() => generateC2SupportNxrSet("second_order", 20, context())).toThrow(
      /exactly 10/,
    );

    expect(generateC2SupportNxrSet("ordinary", 20, context())).toHaveLength(20);
    expect(generateC2SupportNxrSet("second_order", 10, context())).toHaveLength(10);
  });

  it("keeps old mixed-v1 decoding and historical N×r grading semantics", () => {
    const preset = encodeC2Preset({
      mode: "support",
      support: "nxr",
      variant: "mixed",
    });
    expect(decodeC2Preset("support", preset)).toEqual({
      mode: "support",
      support: "nxr",
      variant: "mixed",
    });

    // Synthetic historic frozen question: old records don't carry the new
    // strict-input marker, even though new generated questions do.
    const fresh = generateC2SupportNxrQuestion("second_order", context());
    const oldQuestion = {
      ...fresh,
      data: { ...fresh.data, c2ExactC1: 1600, c2ExactC2: 160, c2R: 0.1 },
      cMeta: { ...fresh.cMeta!, preset },
    };
    delete oldQuestion.data.c2DecimalInputFormat;

    const result = gradeTrainingResponse(oldQuestion, {
      kind: "structured",
      fields: { firstCorrection: "1,600", secondCorrection: "160" },
    });
    expect(result.isCorrect).toBe(true);
    expect(result.gradingMetrics?.processExpectedC2).toBe(160);
  });

  it("new N×r generator marks strictly decimal inputs for the grader", () => {
    const fresh = generateC2SupportNxrQuestion("ordinary", context());
    expect(fresh.data.c2DecimalInputFormat).toBe("strict_decimal");
    const oldStyleHex = gradeTrainingResponse(fresh, {
      kind: "structured",
      fields: { firstCorrection: "0x10" },
    });
    expect(oldStyleHex.isCorrect).toBe(false);
    expect(oldStyleHex.gradingMetrics?.invalidResponse).toBe(true);
    expect(
      gradeTrainingResponse(fresh, {
        kind: "structured",
        fields: { firstCorrection: String(fresh.data.c2ExactC1) },
      }).isCorrect,
    ).toBe(true);
  });
});
