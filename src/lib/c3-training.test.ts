import { describe, expect, it } from "vitest";
import {
  C3_MINIMUM_APPEARANCE_COVERAGE,
  C3_MINIMUM_RATIO_ZONE_COVERAGE,
  C3_QUOTAS,
  C3_QUESTION_COUNT,
  classifyC3Question,
  generateC3Set,
} from "./c3-training";
import { gradeCQuestion } from "./c-training";
import { GenerationContext } from "./generate";
import { DifficultyBand } from "./types";

function context(seed = 0.371): GenerationContext {
  let id = 0;
  let state = seed;
  return {
    random: () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    },
    createId: () => `c3-${id++}`,
  };
}

function quotaKey(question: ReturnType<typeof generateC3Set>[number]) {
  return `${question.data.c3StructureLevel}-${question.data.c3Salience}`;
}

function expectedQuota(band: DifficultyBand) {
  return Object.fromEntries(
    C3_QUOTAS[band].map((cell) => [
      `${cell.structureLevel}-${cell.salience}`,
      cell.count,
    ]),
  );
}

describe("C3 objective classifier", () => {
  it("separates S1, S2 and S3 from frontend difficulty", () => {
    expect(classifyC3Question(110, 200, 100, 210)).toMatchObject({
      structureLevel: "S1",
      salience: "normal",
    });
    expect(classifyC3Question(140, 100, 179, 118)).toMatchObject({
      structureLevel: "S2",
      salience: "normal",
    });
    expect(classifyC3Question(47, 100, 95, 202)).toMatchObject({
      structureLevel: "S3",
      salience: "strong",
    });
  });

  it("keeps S1 objective appearance tags additive instead of direct-only", () => {
    const profile = classifyC3Question(49, 100, 49, 105);
    expect(profile).toMatchObject({
      structureLevel: "S1",
      ratioZone: "both_below_1",
    });
    expect(profile?.appearanceTags).toContain("direct");
    expect(profile?.appearanceTags).toContain("benchmark");
  });

  it("keeps very-close questions in S2 whenever an effective scale or delta cue is already decisive", () => {
    expect(classifyC3Question(47, 100, 95, 199)).toMatchObject({
      structureLevel: "S2",
      salience: "strong",
    });
    expect(classifyC3Question(105, 100, 115, 111)).toMatchObject({
      structureLevel: "S2",
      salience: "strong",
    });

    // 50/51 vs 60/61 differs by well under 2%. The delta comparison is
    // 10/10 vs 50/51, which is already decisive even though the delta cue is
    // only normal rather than strong.
    expect(classifyC3Question(50, 51, 60, 61)).toMatchObject({
      structureLevel: "S2",
      deltaCue: "normal",
      symmetricRatioGap: expect.any(Number),
    });
  });

  it("classifies a ratio exactly on 1 explicitly instead of folding it into both-above-1", () => {
    expect(classifyC3Question(100, 100, 101, 102)).toMatchObject({
      structureLevel: "S1",
      salience: "strong",
      ratioZone: "touch_1",
    });
  });

  it("rejects equal ratios and keeps exact comparison as truth only", () => {
    expect(classifyC3Question(1, 2, 2, 4)).toBeUndefined();
    expect(classifyC3Question(3, 5, 4, 5)?.answer).toBe("<");
    expect(classifyC3Question(7, 9, 6, 10)?.answer).toBe(">");
  });
});

describe("C3 formal generator", () => {
  for (const band of ["L1", "L2", "L3"] as const) {
    it(`builds the exact ${band} 20-question quota, direction balance and appearance coverage`, () => {
      const questions = generateC3Set(
        band,
        C3_QUESTION_COUNT,
        context(band === "L1" ? 0.137 : band === "L2" ? 0.419 : 0.773),
      );

      expect(questions).toHaveLength(20);
      const actualQuota = questions.reduce<Record<string, number>>(
        (result, question) => {
          const key = quotaKey(question);
          result[key] = (result[key] ?? 0) + 1;
          return result;
        },
        {},
      );
      expect(actualQuota).toEqual(expectedQuota(band));

      expect(
        questions.filter((question) => question.answer === ">"),
      ).toHaveLength(10);
      expect(
        questions.filter((question) => question.answer === "<"),
      ).toHaveLength(10);
      expect(questions.some((question) => question.answer === "=")).toBe(false);

      const keys = new Set(
        questions.map((question) => {
          const { a, b, c, d } = question.data;
          return [`${a}/${b}`, `${c}/${d}`].sort().join("|");
        }),
      );
      expect(keys.size).toBe(20);

      const appearance = new Set(
        questions.flatMap((question) =>
          Array.isArray(question.data.c3AppearanceTags)
            ? question.data.c3AppearanceTags.map(String)
            : [],
        ),
      );
      C3_MINIMUM_APPEARANCE_COVERAGE[band].forEach((tag) =>
        expect(appearance.has(tag)).toBe(true),
      );

      const ratioZones = questions.reduce<Record<string, number>>(
        (result, question) => {
          const zone = String(question.data.c3RatioZone);
          result[zone] = (result[zone] ?? 0) + 1;
          return result;
        },
        {},
      );
      Object.entries(C3_MINIMUM_RATIO_ZONE_COVERAGE[band]).forEach(
        ([zone, minimum]) =>
          expect(ratioZones[zone] ?? 0).toBeGreaterThanOrEqual(minimum ?? 0),
      );

      questions.forEach((question) => {
        expect(question).toMatchObject({
          type: "c_training",
          subtype: "c_task",
          difficultyBand: band,
          inputKind: "choice",
          cMeta: {
            project: "C3",
            mode: "specialty",
            grading: {
              kind: "exact",
              normalize: "comparison",
            },
          },
        });
        const profile = classifyC3Question(
          Number(question.data.a),
          Number(question.data.b),
          Number(question.data.c),
          Number(question.data.d),
        );
        expect(profile?.structureLevel).toBe(question.data.c3StructureLevel);
        expect(profile?.salience).toBe(question.data.c3Salience);
        expect(profile?.answer).toBe(question.answer);
      });
    });
  }

  it("remains quota-stable across several generation seeds", () => {
    for (const band of ["L1", "L2", "L3"] as const) {
      for (const seed of [
        0.071, 0.111, 0.247, 0.371, 0.503, 0.683, 0.811, 0.887,
      ]) {
        const questions = generateC3Set(band, 20, context(seed));
        const counts = questions.reduce<Record<string, number>>(
          (result, question) => {
            const key = quotaKey(question);
            result[key] = (result[key] ?? 0) + 1;
            return result;
          },
          {},
        );
        expect(counts).toEqual(expectedQuota(band));
        const zones = questions.reduce<Record<string, number>>(
          (result, question) => {
            const zone = String(question.data.c3RatioZone);
            result[zone] = (result[zone] ?? 0) + 1;
            return result;
          },
          {},
        );
        Object.entries(C3_MINIMUM_RATIO_ZONE_COVERAGE[band]).forEach(
          ([zone, minimum]) =>
            expect(zones[zone] ?? 0).toBeGreaterThanOrEqual(minimum ?? 0),
        );
      }
    }
  });

  it("grades only the submitted relation and accepts full-width comparison symbols", () => {
    const [question] = generateC3Set("L1", 20, context(0.663));
    expect(gradeCQuestion(question, question.answer).isCorrect).toBe(true);
    const fullWidth = question.answer === ">" ? "＞" : "＜";
    expect(gradeCQuestion(question, fullWidth).isCorrect).toBe(true);
    expect(
      gradeCQuestion(question, question.answer === ">" ? "<" : ">").isCorrect,
    ).toBe(false);
  });

  it("rejects non-20 formal blocks", () => {
    expect(() => generateC3Set("L1", 10, context())).toThrow("20 questions");
  });
});
