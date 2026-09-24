import { describe, expect, it } from "vitest";
import {
  C1_ERROR_TOLERANCE,
  C1_MINIMUM_DIRECTION_COUNT,
  evaluateMultiplicationCost,
  generateC1Set,
  gradeC1Response,
} from "./c1-training";
import { GenerationContext, GeneratedQuestion } from "./generate";
import { structuredTrainingResponse } from "./training-response";
import { DifficultyBand } from "./types";

function context(seed = 0.371): GenerationContext {
  let id = 0;
  let state = seed;
  return {
    random: () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    },
    createId: () => `c1-${id++}`,
  };
}

function recommendedResponse(question: GeneratedQuestion) {
  const aPrime = Number(question.data.c1RecommendedAPrime);
  const bPrime = Number(question.data.c1RecommendedBPrime);
  return structuredTrainingResponse({
    aPrime,
    bPrime,
    result: aPrime * bPrime,
  });
}

describe("C1 multiplication cost evaluator", () => {
  it("treats a genuinely simplified expression as lower cost", () => {
    expect(evaluateMultiplicationCost(424, 214)).toBeGreaterThan(
      evaluateMultiplicationCost(420, 215),
    );
  });
});

describe("C1 formal generator", () => {
  for (const band of ["L1", "L2", "L3"] as const) {
    it(`builds a stable ${band} 20-question block with valid recommended routes`, () => {
      const questions = generateC1Set(
        band,
        20,
        context(band === "L1" ? 0.113 : band === "L2" ? 0.527 : 0.881),
      );

      expect(questions).toHaveLength(20);
      const directions = questions.reduce<Record<string, number>>(
        (result, question) => {
          const key = String(question.data.c1DirectionPattern);
          result[key] = (result[key] ?? 0) + 1;
          return result;
        },
        {},
      );
      Object.values(directions).forEach((count) =>
        expect(count).toBe(C1_MINIMUM_DIRECTION_COUNT),
      );
      expect(Object.keys(directions)).toHaveLength(4);

      questions.forEach((question) => {
        expect(question).toMatchObject({
          type: "c_training",
          subtype: "c_task",
          difficultyBand: band,
          inputKind: "structured",
          cMeta: {
            project: "C1",
            mode: "specialty",
            grading: {
              kind: "custom",
            },
          },
        });
        const grading = gradeC1Response(
          question,
          recommendedResponse(question),
        );
        expect(grading.isCorrect).toBe(true);
        expect(Number(grading.gradingMetrics?.methodError)).toBeLessThanOrEqual(
          C1_ERROR_TOLERANCE + 1e-10,
        );
      });
    });
  }

  it("enforces L2 and L3 challenge composition", () => {
    const l2 = generateC1Set("L2", 20, context(0.441));
    expect(
      l2.filter((question) => question.data.c1ChallengeType === "amplitude"),
    ).toHaveLength(10);
    expect(
      l2.filter((question) => question.data.c1ChallengeType === "recognition"),
    ).toHaveLength(10);

    const l3 = generateC1Set("L3", 20, context(0.729));
    expect(
      l3.filter(
        (question) =>
          question.data.c1ChallengeType === "same_side_competition",
      ),
    ).toHaveLength(10);
    expect(
      l3.filter(
        (question) =>
          question.data.c1ChallengeType === "cross_side_competition",
      ),
    ).toHaveLength(10);
  });

  it("remains generatable across several deterministic seeds", () => {
    for (const band of ["L1", "L2", "L3"] as const) {
      for (const seed of [0.127, 0.263, 0.509, 0.907]) {
        expect(generateC1Set(band, 20, context(seed))).toHaveLength(20);
      }
    }
  });

  it("accepts a valid alternative route instead of matching the recommended answer", () => {
    const questions = generateC1Set("L3", 20, context(0.683));
    const question = questions.find(
      (item) =>
        typeof item.data.c1AlternateAPrime === "number" &&
        typeof item.data.c1AlternateBPrime === "number",
    );
    expect(question).toBeTruthy();
    const aPrime = Number(question?.data.c1AlternateAPrime);
    const bPrime = Number(question?.data.c1AlternateBPrime);
    const grading = gradeC1Response(
      question as GeneratedQuestion,
      structuredTrainingResponse({
        aPrime,
        bPrime,
        result: aPrime * bPrime,
      }),
    );
    expect(grading.isCorrect).toBe(true);
  });

  it("rejects same-direction adjustment even when the final number is close", () => {
    const [question] = generateC1Set("L1", 20, context(0.311));
    const a = Number(question.data.a);
    const b = Number(question.data.b);
    const response = structuredTrainingResponse({
      aPrime: a * 1.01,
      bPrime: b * 1.01,
      result: a * b,
    });
    const grading = gradeC1Response(question, response);
    expect(grading.isCorrect).toBe(false);
    expect(grading.gradingMetrics?.directionPass).toBe(false);
  });

  it("treats adjustment beyond about 10% as a diagnostic rather than an automatic failure", () => {
    const question: GeneratedQuestion = {
      id: "large-adjustment",
      type: "c_training",
      subtype: "c_task",
      prompt: "198 × 203",
      answer: String(198 * 203),
      data: { a: 198, b: 203 },
      difficulty: { level: 5, tags: ["L3"] },
      primaryStructure: "test",
      secondaryTags: [],
      generationRuleVersion: "test",
      difficultyBand: "L3",
      inputKind: "structured",
      cMeta: {
        project: "C1",
        mode: "specialty",
        grading: {
          kind: "custom",
          graderId: "c1-multiplication-scaling-v1",
          version: "test",
        },
      },
    };
    const grading = gradeC1Response(
      question,
      structuredTrainingResponse({
        aPrime: 220,
        bPrime: 183,
        result: 220 * 183,
      }),
    );

    expect(grading.gradingMetrics?.largeAdjustment).toBe(true);
    expect(grading.isCorrect).toBe(true);
  });

  it("rejects formal blocks other than 20 questions", () => {
    expect(() => generateC1Set("L1", 10, context())).toThrow("20 questions");
  });
});
