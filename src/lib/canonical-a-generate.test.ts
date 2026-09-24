import { describe, expect, it } from "vitest";
import { GenerationContext } from "./generate";
import {
  canonicalAAbilityIds,
  generateCanonicalAQuestion,
  generateCanonicalASet,
  gradeCanonicalAQuestion,
} from "./canonical-a-generate";
import { DifficultyBand } from "./types";

function context(seed = 1): GenerationContext {
  let state = seed >>> 0;
  let id = 0;
  return {
    random: () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    createId: () => `canonical-a-${seed}-${id++}`,
  };
}

function contextWithRandoms(values: readonly number[]): GenerationContext {
  let index = 0;
  let id = 0;
  return {
    random: () => values[index++] ?? 0.42,
    createId: () => `canonical-a-controlled-${id++}`,
  };
}

function fractionKey(question: ReturnType<typeof generateCanonicalAQuestion>) {
  return `${question.data.numerator}/${question.data.denominator}`;
}

describe("canonical A ability generators", () => {
  it("contains exactly the ten audited A abilities", () => {
    expect(canonicalAAbilityIds).toEqual([
      "A-ADD-01",
      "A-SUB-01",
      "A-COM-01",
      "A-MUL-01",
      "A-MUL-02",
      "A-MUL-03",
      "A-MUL-04",
      "A-MUL-05",
      "A-FRA-01",
      "A-PCT-01",
    ]);
  });

  it.each(["L1", "L2", "L3"] as const)(
    "generates all ten abilities in %s with canonical metadata",
    (difficultyBand) => {
      canonicalAAbilityIds.forEach((abilityId, index) => {
        const generated = generateCanonicalAQuestion(
          abilityId,
          difficultyBand,
          context(100 + index),
        );
        expect(generated.skillId).toBe(abilityId);
        expect(generated.difficultyBand).toBe(difficultyBand);
        expect(generated.generationRuleVersion).toBe("a-canonical-1.2.0");
        expect(generated.generatorParams).toMatchObject({
          generatorFamily: "a_canonical",
          abilityId,
        });
      });
    },
  );

  it("uses one-click choices for the four reaction abilities", () => {
    const reactionIds = [
      "A-COM-01",
      "A-MUL-01",
      "A-MUL-02",
      "A-FRA-01",
    ] as const;
    reactionIds.forEach((abilityId, index) => {
      const generated = generateCanonicalAQuestion(
        abilityId,
        "L2",
        context(200 + index),
      );
      expect(generated.inputKind).toBe("choice");
      expect(generated.data.choiceValues).toHaveLength(4);
      expect(generated.data.choiceLabels).toHaveLength(4);
      expect(generated.allowedAnswerSet).toEqual([generated.answer]);
      expect(
        gradeCanonicalAQuestion(generated, generated.answer).isCorrect,
      ).toBe(true);
    });
  });

  it("uses numeric input for the six calculation abilities", () => {
    const calculationIds = [
      "A-ADD-01",
      "A-SUB-01",
      "A-MUL-03",
      "A-MUL-04",
      "A-MUL-05",
      "A-PCT-01",
    ] as const;
    calculationIds.forEach((abilityId, index) => {
      const generated = generateCanonicalAQuestion(
        abilityId,
        "L2",
        context(300 + index),
      );
      expect(generated.inputKind).toBe("number");
      expect(
        gradeCanonicalAQuestion(generated, generated.answer).isCorrect,
      ).toBe(true);
    });
  });

  it("keeps addition and subtraction inside two to three digits", () => {
    const bands: DifficultyBand[] = ["L1", "L2", "L3"];
    bands.forEach((band, bandIndex) => {
      const addSet = generateCanonicalASet(
        "A-ADD-01",
        band,
        40,
        context(400 + bandIndex),
      );
      const subSet = generateCanonicalASet(
        "A-SUB-01",
        band,
        40,
        context(500 + bandIndex),
      );
      for (const question of [...addSet, ...subSet]) {
        const a = Number(question.data.a);
        const b = Number(question.data.b);
        expect(String(Math.abs(a)).length).toBeGreaterThanOrEqual(2);
        expect(String(Math.abs(a)).length).toBeLessThanOrEqual(3);
        expect(String(Math.abs(b)).length).toBeGreaterThanOrEqual(2);
        expect(String(Math.abs(b)).length).toBeLessThanOrEqual(3);
      }
    });
  });

  it("layers addition difficulty by carry structure without increasing digit length", () => {
    const l1 = generateCanonicalASet("A-ADD-01", "L1", 120, context(610));
    const l2 = generateCanonicalASet("A-ADD-01", "L2", 120, context(611));
    const l3 = generateCanonicalASet("A-ADD-01", "L3", 120, context(612));

    expect(l1.every((question) => Number(question.data.carryCount) <= 1)).toBe(
      true,
    );
    expect(l2.every((question) => Number(question.data.carryCount) >= 1)).toBe(
      true,
    );
    expect(l3.every((question) => Number(question.data.carryCount) >= 2)).toBe(
      true,
    );
    expect(
      l3.every(
        (question) =>
          question.structureTags?.includes("continuous_carry") ||
          question.structureTags?.includes("contains_zero"),
      ),
    ).toBe(true);
  });

  it("uses explicit subtraction structure targets in L2/L3 while keeping signed results", () => {
    const l1 = generateCanonicalASet("A-SUB-01", "L1", 160, context(620));
    const l2 = generateCanonicalASet("A-SUB-01", "L2", 240, context(621));
    const l3 = generateCanonicalASet("A-SUB-01", "L3", 240, context(622));

    expect(
      l1.every(
        (question) =>
          Number(question.data.borrowCount) <= 1 &&
          question.data.crossedZero !== true,
      ),
    ).toBe(true);

    for (const question of [...l2, ...l3]) {
      const target = question.generatorParams?.subtractionTarget;
      if (target === "near_difference")
        expect(Math.abs(Number(question.answer))).toBeLessThanOrEqual(30);
      if (target === "cross_zero")
        expect(question.structureTags).toContain("cross_zero");
      if (target === "multi_borrow")
        expect(Number(question.data.borrowCount)).toBeGreaterThanOrEqual(2);
    }

    expect(l2.some((question) => Number(question.answer) < 0)).toBe(true);
    expect(l3.some((question) => Number(question.answer) < 0)).toBe(true);
    expect(
      l3.some((question) => question.structureTags?.includes("cross_zero")),
    ).toBe(true);
  });

  it("keeps near-difference bands signed and both operands inside 1..999", () => {
    const expectedBands: Record<DifficultyBand, [number, number]> = {
      L1: [1, 5],
      L2: [6, 10],
      L3: [11, 30],
    };
    (Object.keys(expectedBands) as DifficultyBand[]).forEach((band, index) => {
      const questions = generateCanonicalASet(
        "A-COM-01",
        band,
        240,
        context(630 + index),
      );
      const [min, max] = expectedBands[band];
      questions.forEach((question) => {
        const difference = Math.abs(Number(question.answer));
        const left = Number(question.data.left);
        const right = Number(question.data.right);
        expect(difference).toBeGreaterThanOrEqual(min);
        expect(difference).toBeLessThanOrEqual(max);
        expect(left).toBeGreaterThanOrEqual(1);
        expect(left).toBeLessThanOrEqual(999);
        expect(right).toBeGreaterThanOrEqual(1);
        expect(right).toBeLessThanOrEqual(999);
      });
    });
  });

  it("weights multiplication facts by band without excluding the full 2..9 range", () => {
    const l1 = generateCanonicalASet("A-MUL-01", "L1", 400, context(640));
    const l2 = generateCanonicalASet("A-MUL-01", "L2", 400, context(641));
    const l3 = generateCanonicalASet("A-MUL-01", "L3", 400, context(642));

    const factors = (question: (typeof l1)[number]) => [
      Number(question.data.a),
      Number(question.data.b),
    ];
    const l1MostlyBasic =
      l1.filter((question) => factors(question).every((factor) => factor <= 6))
        .length / l1.length;
    const l3High =
      l3.filter((question) => factors(question).some((factor) => factor >= 6))
        .length / l3.length;

    expect(l1MostlyBasic).toBeGreaterThan(0.7);
    expect(
      l1.some((question) => factors(question).some((factor) => factor >= 7)),
    ).toBe(true);
    expect(l2.some((question) => factors(question).includes(2))).toBe(true);
    expect(l2.some((question) => factors(question).includes(9))).toBe(true);
    expect(l3High).toBeGreaterThan(0.75);
    expect(
      l3.some((question) => factors(question).every((factor) => factor <= 5)),
    ).toBe(true);
  });

  it("layers two-digit by one-digit multiplication by carry structure", () => {
    const l1 = generateCanonicalASet("A-MUL-03", "L1", 200, context(650));
    const l2 = generateCanonicalASet("A-MUL-03", "L2", 200, context(651));
    const l3 = generateCanonicalASet("A-MUL-03", "L3", 400, context(652));

    expect(l1.every((question) => Number(question.data.carryCount) <= 1)).toBe(
      true,
    );
    expect(l2.some((question) => Number(question.data.carryCount) === 0)).toBe(
      true,
    );
    expect(l2.some((question) => Number(question.data.carryCount) === 2)).toBe(
      true,
    );
    const l3MultiRate =
      l3.filter((question) => Number(question.data.carryCount) === 2).length /
      l3.length;
    expect(l3MultiRate).toBeGreaterThan(0.6);
  });

  it("layers two-digit by two-digit multiplication by carry load", () => {
    const l1 = generateCanonicalASet("A-MUL-04", "L1", 160, context(653));
    const l2 = generateCanonicalASet("A-MUL-04", "L2", 160, context(654));
    const l3 = generateCanonicalASet("A-MUL-04", "L3", 160, context(655));

    expect(l1.every((question) => Number(question.data.carryLoad) <= 1)).toBe(
      true,
    );
    expect(
      l2.every((question) => {
        const load = Number(question.data.carryLoad);
        return load >= 2 && load <= 3;
      }),
    ).toBe(true);
    expect(l3.every((question) => Number(question.data.carryLoad) >= 4)).toBe(
      true,
    );
    expect(
      [...l1, ...l2, ...l3].every(
        (question) =>
          Number(question.data.a) >= 10 &&
          Number(question.data.a) <= 99 &&
          Number(question.data.b) >= 10 &&
          Number(question.data.b) <= 99,
      ),
    ).toBe(true);
  });

  it("keeps percent-by-percent answers in percent form with two decimals", () => {
    (["L1", "L2", "L3"] as const).forEach((band, index) => {
      const questions = generateCanonicalASet(
        "A-MUL-05",
        band,
        80,
        context(656 + index),
      );
      questions.forEach((question) => {
        expect(question.prompt).toMatch(/%×.*%＝\?%$/);
        expect(question.answer).toMatch(/^\d+\.\d{2}%$/);
        expect(question.data.leftDecimals).toBeGreaterThanOrEqual(0);
        expect(question.data.rightDecimals).toBeGreaterThanOrEqual(0);
        expect(
          gradeCanonicalAQuestion(
            question,
            question.answer.replace("%", ""),
          ).isCorrect,
        ).toBe(true);
      });
    });
  });

  it("limits A-FRA-01 to the audited high-frequency mapping pool", () => {
    const l1Allowed = new Set(["1/2", "1/4", "1/5", "1/8"]);
    const l2Allowed = new Set([...l1Allowed, "1/3", "1/6", "1/9", "3/8"]);
    const l3Allowed = new Set([...l2Allowed, "1/7", "2/7", "3/7"]);

    const l1 = generateCanonicalASet("A-FRA-01", "L1", 240, context(660));
    const l2 = generateCanonicalASet("A-FRA-01", "L2", 240, context(661));
    const l3 = generateCanonicalASet("A-FRA-01", "L3", 480, context(662));

    expect(l1.every((question) => l1Allowed.has(fractionKey(question)))).toBe(
      true,
    );
    expect(l2.every((question) => l2Allowed.has(fractionKey(question)))).toBe(
      true,
    );
    expect(l3.every((question) => l3Allowed.has(fractionKey(question)))).toBe(
      true,
    );
    expect(l3.some((question) => fractionKey(question) === "2/7")).toBe(true);
    expect(l3.some((question) => fractionKey(question) === "3/7")).toBe(true);
    expect(l3.some((question) => Number(question.data.denominator) > 9)).toBe(
      false,
    );
  });

  it("marks exact and approximate fraction-percent relations explicitly", () => {
    const questions = generateCanonicalASet(
      "A-FRA-01",
      "L3",
      480,
      context(670),
    );
    const exact = questions.find(
      (question) => question.data.relationKind === "exact",
    );
    const approximate = questions.find(
      (question) => question.data.relationKind === "approximate",
    );

    expect(exact).toBeDefined();
    expect(approximate).toBeDefined();
    expect(exact?.prompt).toContain("=");
    expect(approximate?.prompt).toContain("≈");
  });

  it("contains every approved percentage anchor under the unified A-PCT-01 ability", () => {
    const approvedAnchors = [
      "0.1%",
      "1%",
      "2%",
      "2.5%",
      "3%",
      "5%",
      "10%",
      "12.5%",
      "20%",
      "25%",
      "33.3%",
      "50%",
    ] as const;

    approvedAnchors.forEach((expectedAnchor, index) => {
      const generated = generateCanonicalAQuestion(
        "A-PCT-01",
        "L2",
        contextWithRandoms([(index + 0.5) / approvedAnchors.length, 0.42]),
      );
      expect(generated.data.rateAnchor).toBe(expectedAnchor);
    });
  });
});
