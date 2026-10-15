import { describe, expect, it } from "vitest";
import { gradeTrainingResponse } from "../grader-registry";
import type { GeneratedQuestion, TrainingResponse } from "../types";
import { c2SeededContext } from "./pilot-session";
import {
  C2_SPLIT_PILOT_BLOCKS,
  c2ParseSplitResponse,
  c2SplitHasPilotWitness,
  generateC2SplitQuestion,
} from "./split-pilot";
import { c2PassesTarget, c2Round } from "./math";

function response(blocks: number[], a: number, b: number, final?: number) {
  let residual = a;
  const fields: Record<string, string | number> = {
    splitCount: blocks.length,
    splitFinalPercent: String(final ?? blocks.reduce((x, y) => x + y, 0)),
  };
  blocks.forEach((percent, index) => {
    const amount = c2Round((percent * b) / 100, 8);
    residual = c2Round(residual - amount, 8);
    fields[`splitPercent${index + 1}`] = String(percent);
    fields[`splitAmount${index + 1}`] = String(amount);
    fields[`splitRemainder${index + 1}`] = String(residual);
  });
  return { kind: "structured" as const, fields };
}

function fixture(rawA: number, rawB: number, coreA = rawA, coreB = rawB) {
  return {
    ...generateC2SplitQuestion(c2SeededContext(15)),
    data: {
      c2TaskKind: "method_split",
      c2SplitRawA: rawA,
      c2SplitRawB: rawB,
      c2SplitCoreA: coreA,
      c2SplitCoreB: coreB,
    },
  } as GeneratedQuestion;
}

describe("C2 Split pilot: actual blocks and original-quotient threshold", () => {
  it("preserves signed familiar blocks and rejects unsupported micro-blocks", () => {
    expect(C2_SPLIT_PILOT_BLOCKS).toContain(0.5);
    expect(C2_SPLIT_PILOT_BLOCKS).not.toContain(0.1);
    expect(C2_SPLIT_PILOT_BLOCKS).not.toContain(0.2);
    expect(c2ParseSplitResponse(response([50, -5], 470, 500))).toBeDefined();
    for (const invalid of ["0x10", "1e1", "0.1", "0.2", "", "NaN", "Infinity"]) {
      const attempt = response([50], 200, 500);
      attempt.fields.splitPercent1 = invalid;
      expect(c2ParseSplitResponse(attempt)).toBeUndefined();
    }
  });

  it("one stage can finish: later unused fields are never required or fabricated", () => {
    const question = fixture(251, 500);
    const entered = response([50], 251, 500);
    const grade = gradeTrainingResponse(question, entered);
    expect(grade.isCorrect).toBe(true);
    expect(grade.gradingMetrics?.enteredBlockCount).toBe(1);
    expect(grade.gradingMetrics?.firstSufficientStage).toBe(1);
    expect(grade.gradingMetrics?.continuedAfterEnough).toBe(false);
    expect(grade.gradingMetrics?.actualPercents).toEqual([50]);
    expect(grade.gradingMetrics?.processConsistency).toBe("consistent");
    expect(entered.fields.splitPercent2).toBeUndefined();
  });

  it("two stages can stop without third; signed subtractive route works", () => {
    const normal = gradeTrainingResponse(
      fixture(492, 689),
      response([50, 20], 492, 689),
    );
    expect(normal.isCorrect).toBe(true);
    expect(normal.gradingMetrics?.firstSufficientStage).toBe(2);
    expect(normal.gradingMetrics?.enteredBlockCount).toBe(2);
    expect(normal.gradingMetrics?.processConsistency).toBe("consistent");

    const subtract = gradeTrainingResponse(
      fixture(472, 500),
      response([100, -5], 472, 500),
    );
    expect(subtract.isCorrect).toBe(true);
    expect(subtract.gradingMetrics?.actualAmounts).toEqual([500, -25]);
    expect(subtract.gradingMetrics?.processConsistency).toBe("consistent");
  });

  it("three-stage path reaches target; additional step is speed feedback only", () => {
    const three = gradeTrainingResponse(
      fixture(623, 1000),
      response([50, 10, 2], 623, 1000),
    );
    expect(three.isCorrect).toBe(true);
    expect(three.gradingMetrics?.firstSufficientStage).toBe(3);

    const extra = gradeTrainingResponse(
      fixture(492, 689),
      response([50, 20, 1], 492, 689),
    );
    expect(extra.isCorrect).toBe(true);
    expect(extra.gradingMetrics?.continuedAfterEnough).toBe(true);
  });

  it("compares final 3% to RAW quotient, never only to a compressed core", () => {
    const question = fixture(600, 1000, 500, 1000);
    const calculatedOnCore = response([50], 500, 1000);
    const grade = gradeTrainingResponse(question, calculatedOnCore);
    expect(grade.isCorrect).toBe(false);
    expect(grade.gradingMetrics?.originalQuotient).toBe(0.6);
    expect(grade.relativeError).toBeCloseTo(1 / 6);
    // Product input can be wrong with a mathematically successful final value.
    expect(
      gradeTrainingResponse(
        fixture(492, 689),
        response([50, 20], 492, 689, 72),
      ).isCorrect,
    ).toBe(true);
  });

  it("keeps final correctness separate from obviously contradictory process", () => {
    const question = fixture(492, 689);
    const entered = response([50, 20], 492, 689);
    entered.fields.splitAmount1 = "1";
    entered.fields.splitRemainder2 = "-999";
    const grade = gradeTrainingResponse(question, entered);
    expect(grade.isCorrect).toBe(true);
    expect(grade.gradingMetrics?.processConsistency).toBe("review_needed");
    expect(grade.gradingMetrics?.amountIdentityMatched).toBe(false);
    expect(grade.gradingMetrics?.remainderIdentityMatched).toBe(false);
    expect(grade.gradingMetrics?.actualAmounts).toEqual([1, 137.8]);
    expect(grade.gradingMetrics?.actualRemainders).toEqual([147.5, -999]);

    const wrongCumulative = gradeTrainingResponse(
      question,
      response([50, 20], 492, 689, 71),
    );
    expect(wrongCumulative.isCorrect).toBe(true);
    expect(wrongCumulative.gradingMetrics?.cumulativeMatches).toBe(false);
  });

  it("rejects malformed count, missing partial stage and rogue removed-stage data", () => {
    const valid = response([50, 20], 492, 689);
    for (const [key, value] of [
      ["splitCount", 0],
      ["splitCount", 21],
      ["splitCount", 1.5],
      ["splitFinalPercent", "0b10"],
      ["splitAmount1", ""],
      ["splitRemainder2", "Infinity"],
    ] as const)
      expect(
        c2ParseSplitResponse({
          ...valid,
          fields: { ...valid.fields, [key]: value },
        }),
      ).toBeUndefined();
    expect(
      c2ParseSplitResponse({
        ...valid,
        fields: { ...valid.fields, splitCount: 1 },
      }),
    ).toBeUndefined();
    expect(
      gradeTrainingResponse(fixture(492, 689), {
        kind: "single",
        value: "70",
      }).gradingMetrics?.invalidResponse,
    ).toBe(true);
  });

  it("only admits candidate integer cores with a 1–3-block witness", () => {
    expect(c2SplitHasPilotWitness(492, 689)).toBe(true);
    expect(c2SplitHasPilotWitness(100, 800)).toBe(false);
    expect(c2SplitHasPilotWitness(800, 800)).toBe(false);
    for (const seed of [0, 1, 7, 21, 40, 2026, 4294967295]) {
      const q = generateC2SplitQuestion(c2SeededContext(seed));
      expect(q).toEqual(generateC2SplitQuestion(c2SeededContext(seed)));
      expect(q.data.c2TaskKind).toBe("method_split");
      expect(q.cMeta?.preset).toBe("v1;route=split");
      expect(q.targetPrecision).toBe("3%");
      expect(q.difficulty?.tags).toContain("pilot_unclassified");
      expect(
        c2SplitHasPilotWitness(
          Number(q.data.c2SplitCoreA),
          Number(q.data.c2SplitCoreB),
        ),
      ).toBe(true);
      expect(
        c2PassesTarget(Number(q.answer) / 100, Number(q.data.c2SplitRawA) / Number(q.data.c2SplitRawB)),
      ).toBe(true);
    }
  });
});
