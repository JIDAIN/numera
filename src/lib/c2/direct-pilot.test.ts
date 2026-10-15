import { describe, expect, it } from "vitest";
import { gradeTrainingResponse } from "../grader-registry";
import type { GeneratedQuestion } from "../types";
import {
  c2DirectCompose,
  c2DirectFacts,
  generateC2DirectQuestion,
} from "./direct-pilot";
import { c2SeededContext } from "./pilot-session";

function answer(question: GeneratedQuestion) {
  const fields = {
    firstQuotientDigit: String(question.data.c2DirectFirstDigit),
    firstDigitProduct: String(question.data.c2DirectFirstProduct),
    remainderAfterFirstDigit: String(question.data.c2DirectFirstRemainder),
    secondQuotientDigit: String(question.data.c2DirectSecondDigit),
    ...(question.data.c2DirectRequestedDigits === 3
      ? { thirdQuotientDigit: String(question.data.c2DirectThirdDigit) }
      : {}),
  };
  return { kind: "structured" as const, fields };
}

describe("C2 Direct candidate: exact significant digits", () => {
  it("truncates instead of rounding, even when 3% would pass", () => {
    const facts = c2DirectFacts(199, 100, 2)!;
    expect(facts.firstDigit).toBe(1);
    expect(facts.secondDigit).toBe(9);
    expect(facts.thirdDigit).toBe(9);
    expect(facts.answer).toBe("1.9");
    expect(c2DirectFacts(199, 100, 3)?.answer).toBe("1.99");
    expect(c2DirectFacts(234, 1000, 2)?.answer).toBe("0.23");
    expect(c2DirectFacts(234, 1000, 3)?.answer).toBe("0.234");
    expect(c2DirectCompose("1", "9", "9", 1, 2)).toBe("1.9");
    expect(c2DirectCompose("1", "9", "9", 1, 3)).toBe("1.99");
  });

  it("rejects invalid Direct numeric cores", () => {
    expect(c2DirectFacts(0, 200, 2)).toBeUndefined();
    expect(c2DirectFacts(200, 0, 2)).toBeUndefined();
    expect(c2DirectFacts(10, 100, 2)).toBeUndefined();
    expect(c2DirectFacts(601, 100, 2)).toBeUndefined();
    expect(c2DirectFacts(200.5, 100, 2)).toBeUndefined();
  });

  it("creates reproducible candidate facts without L quota", () => {
    for (const seed of [0, 1, 34, 2147483647, 4294967295]) {
      const a = generateC2DirectQuestion(c2SeededContext(seed));
      const b = generateC2DirectQuestion(c2SeededContext(seed));
      expect(a).toEqual(b);
      expect(a.data.c2TaskKind).toBe("method_direct");
      expect(a.inputKind).toBe("structured");
      expect(a.targetPrecision).toBe("exact");
      expect(a.cMeta?.preset).toBe("v1;route=direct");
      expect(a.difficulty?.tags).toContain("pilot_unclassified");
      expect([2, 3]).toContain(a.data.c2DirectRequestedDigits);
      expect(gradeTrainingResponse(a, answer(a)).isCorrect).toBe(true);
    }
  });

  it("separates final correctness from process diagnostics", () => {
    const question = generateC2DirectQuestion(c2SeededContext(211));
    const good = answer(question);
    const normal = gradeTrainingResponse(question, good);
    expect(normal.isCorrect).toBe(true);
    expect(normal.gradingMetrics?.finalPass).toBe(true);
    expect(normal.gradingMetrics?.processConsistency).toBe("consistent");

    const wrongProduct = gradeTrainingResponse(question, {
      ...good,
      fields: {
        ...good.fields,
        firstDigitProduct: String(Number(good.fields.firstDigitProduct) + 1),
      },
    });
    expect(wrongProduct.isCorrect).toBe(true);
    expect(wrongProduct.gradingMetrics?.productValid).toBe(false);
    expect(wrongProduct.gradingMetrics?.processConsistency).toBe(
      "review_needed",
    );

    const wrongRemainder = gradeTrainingResponse(question, {
      ...good,
      fields: {
        ...good.fields,
        remainderAfterFirstDigit: String(
          Number(good.fields.remainderAfterFirstDigit) + 1,
        ),
      },
    });
    expect(wrongRemainder.isCorrect).toBe(true);
    expect(wrongRemainder.gradingMetrics?.remainderValid).toBe(false);
  });

  it("rejects a 3%-close but incorrect second digit without rounding", () => {
    // 199/100 = 1.99; 2.0 would be within 1% but is NOT
    // the accurate first two significant digits (1,9).
    const reference = generateC2DirectQuestion(c2SeededContext(2));
    const question = {
      ...reference,
      answer: "1.9",
      data: {
        ...reference.data,
        c2DirectA: 199,
        c2DirectB: 100,
        c2DirectFirstPlace: 1,
        c2DirectRequestedDigits: 2,
        c2DirectFirstDigit: 1,
        c2DirectSecondDigit: 9,
        c2DirectThirdDigit: 9,
        c2DirectFirstProduct: 100,
        c2DirectFirstRemainder: 99,
        c2DirectFinalAnswer: "1.9",
      },
    };
    const exact = {
      kind: "structured" as const,
      fields: {
        firstQuotientDigit: "1",
        firstDigitProduct: "100",
        remainderAfterFirstDigit: "99",
        secondQuotientDigit: "9",
      },
    };
    expect(gradeTrainingResponse(question, exact).isCorrect).toBe(true);
    const rounded = gradeTrainingResponse(question, {
      ...exact,
      fields: {
        ...exact.fields,
        firstQuotientDigit: "2",
        secondQuotientDigit: "0",
      },
    });
    expect(rounded.isCorrect).toBe(false);
    expect(rounded.gradingMetrics?.submittedFinal).toBe("2");
  });

  it("makes a third digit genuinely mandatory when frozen target is 3", () => {
    const question = generateC2DirectQuestion(c2SeededContext(19));
    const exact3 = c2DirectFacts(
      Number(question.data.c2DirectA),
      Number(question.data.c2DirectB),
      3,
    )!;
    const frozen: GeneratedQuestion = {
      ...question,
      answer: exact3.answer,
      data: {
        ...question.data,
        c2DirectRequestedDigits: 3,
        c2DirectFinalAnswer: exact3.answer,
      },
    };
    expect(gradeTrainingResponse(frozen, answer(frozen)).isCorrect).toBe(true);
    const incomplete = gradeTrainingResponse(frozen, {
      kind: "structured",
      fields: {
        firstQuotientDigit: String(frozen.data.c2DirectFirstDigit),
        firstDigitProduct: String(frozen.data.c2DirectFirstProduct),
        remainderAfterFirstDigit: String(frozen.data.c2DirectFirstRemainder),
        secondQuotientDigit: String(frozen.data.c2DirectSecondDigit),
      },
    });
    expect(incomplete.isCorrect).toBe(false);
    expect(incomplete.gradingMetrics?.invalidResponse).toBe(true);
  });
});
