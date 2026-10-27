import { describe, it, expect } from "vitest";
import type { GeneratedQuestion } from "../types";
import { gradeTrainingResponse } from "../grader-registry";
import {
  c2SeededContext,
  c2PilotScore,
  createC2PilotSession,
  submitC2PilotAnswer,
} from "./pilot-session";
import { generateC2RuntimeSet } from "./runtime";
import {
  c2ParseScalingResponse,
  generateC2ScalingQuestion,
} from "./scaling-pilot";

function response(path: string, fields: Record<string, string> = {}) {
  return {
    kind: "structured" as const,
    fields: {
      scalingPath: path,
      scalingB0: "125",
      scalingDelta: "3",
      scalingFinal: "5.28",
      ...fields,
    },
  };
}
function question(a = 645, b = 122) {
  return {
    ...generateC2ScalingQuestion(c2SeededContext(1)),
    data: {
      c2TaskKind: "method_scaling",
      c2ScalingRawA: a,
      c2ScalingRawB: b,
      c2ScalingCoreA: a,
      c2ScalingCoreB: b,
    },
  } as GeneratedQuestion;
}
const grade = (q: GeneratedQuestion, r: ReturnType<typeof response>) =>
  gradeTrainingResponse(q, r);

describe("C-007 Scaling actual staged process and independent original quotient", () => {
  it("accepts genuine zero-order result without any unentered correction", () => {
    const r = response("zero", { scalingQ0: "5.16", scalingFinal: "5.16" });
    const g = grade(question(), r);
    expect(g.isCorrect).toBe(true);
    expect(g.gradingMetrics?.enteredStage).toBe(0);
    expect(g.gradingMetrics?.processConsistency).toBe("consistent");
    expect(r.fields.scalingR).toBeUndefined();
    expect(r.fields.scalingC1).toBeUndefined();
  });
  it("recognizes user-input positive Delta through rough quotient with no r or Q0", () => {
    const r = response("numerator_rough", {
      scalingRough: "5",
      scalingC1: "15",
      scalingA1: "660",
      scalingQ1: "5.28",
    });
    const g = grade(question(), r);
    expect(g.isCorrect).toBe(true);
    expect(g.gradingMetrics?.processConsistency).toBe("consistent");
    expect(c2ParseScalingResponse(r)?.r).toBeUndefined();
    expect(c2ParseScalingResponse(r)?.q0).toBeUndefined();
  });
  it("retains signed negative Delta for repair-result", () => {
    const r = response("result", {
      scalingB0: "100",
      scalingDelta: "-4",
      scalingQ0: "2",
      scalingR: "0.04",
      scalingC1: "-0.08",
      scalingQ1: "1.92",
      scalingFinal: "1.92",
      scalingSecond: "no",
    });
    expect(grade(question(200, 104), r).isCorrect).toBe(true);
    expect(
      grade(question(200, 104), r).gradingMetrics?.processConsistency,
    ).toBe("consistent");
  });
  it("supports A×r numerator and legitimate positive second-order", () => {
    const r = response("numerator_r", {
      scalingB0: "100",
      scalingDelta: "-4",
      scalingR: "0.04",
      scalingC1: "-8",
      scalingA1: "192",
      scalingQ1: "1.92",
      scalingSecond: "yes",
      scalingC2: "0.32",
      scalingA2: "192.32",
      scalingQ2: "1.9232",
      scalingFinal: "1.9232",
    });
    const g = grade(question(200, 104), r);
    expect(g.isCorrect).toBe(true);
    expect(g.gradingMetrics?.processConsistency).toBe("consistent");
    expect(g.gradingMetrics?.enteredStage).toBe(2);
  });
  it("does not falsely apply the A×r second-order formula to rough Delta route", () => {
    const r = response("numerator_rough", {
      scalingB0: "100",
      scalingDelta: "-4",
      scalingRough: "2",
      scalingC1: "-8",
      scalingA1: "192",
      scalingQ1: "1.92",
      scalingSecond: "yes",
      scalingC2: "0.3",
      scalingA2: "192.3",
      scalingQ2: "1.923",
      scalingFinal: "1.923",
    });
    expect(
      grade(question(200, 104), r).gradingMetrics?.processConsistency,
    ).toBe("consistent");
  });
  it("final pass does not launder an incorrect intermediate process", () => {
    const r = response("numerator_rough", {
      scalingRough: "5",
      scalingC1: "999",
      scalingA1: "660",
      scalingQ1: "5.28",
    });
    const g = grade(question(), r);
    expect(g.isCorrect).toBe(true);
    expect(g.gradingMetrics?.processConsistency).toBe("review_needed");
    expect(r.fields.scalingC1).toBe("999");
  });
  it("uses ORIGINAL raw quotient, not transformed core, for 3%", () => {
    const q = question(600, 1000);
    q.data.c2ScalingCoreA = 500;
    const g = grade(
      q,
      response("zero", {
        scalingB0: "1000",
        scalingDelta: "0",
        scalingQ0: "0.5",
        scalingFinal: "0.5",
      }),
    );
    expect(g.isCorrect).toBe(false);
    expect(g.gradingMetrics?.originalQuotient).toBe(0.6);
    expect(g.relativeError).toBeCloseTo(1 / 6);
  });
  it("rejects unentered/foreign/invalid values and disallowed path fields", () => {
    const good = response("numerator_rough", {
      scalingRough: "5",
      scalingC1: "15",
      scalingA1: "660",
      scalingQ1: "5.28",
    });
    expect(c2ParseScalingResponse(good)).toBeDefined();
    for (const edits of [
      { scalingR: "0.02" },
      { scalingQ0: "5.16" },
      { scalingRough: "NaN" },
      { scalingB0: "0" },
      { scalingFinal: "1e2" },
      { scalingC1: "0x10" },
      { scalingSecond: "yes" },
      { scalingDelta: "" },
      { scalingPath: "unsupported" },
    ]) {
      expect(
        c2ParseScalingResponse({
          kind: "structured",
          fields: {
            ...good.fields,
            ...edits,
          },
        }),
      ).toBeUndefined();
    }
    const zero = response("zero", { scalingQ0: "5.16", scalingSecond: "no" });
    expect(c2ParseScalingResponse(zero)).toBeUndefined();
  });
  it("always freezes ten unique questions for several seeds without a machine L quota", () => {
    for (const seed of [0, 7, 99, 2026, 4294967295]) {
      const req = {
        preset: { mode: "method" as const, route: "scaling" as const },
        questionCount: 10,
      };
      const a = generateC2RuntimeSet(req, c2SeededContext(seed));
      expect(a).toHaveLength(10);
      expect(a).toEqual(generateC2RuntimeSet(req, c2SeededContext(seed)));
      expect(new Set(a?.map((q) => q.prompt)).size).toBe(10);
      expect(a?.every((q) => q.data.c2TaskKind === "method_scaling")).toBe(
        true,
      );
      expect(
        a?.every((q) => q.difficulty?.tags.includes("pilot_unclassified")),
      ).toBe(true);
      for (const count of [6, 8, 12, 20])
        expect(
          generateC2RuntimeSet(
            { preset: req.preset, questionCount: count },
            c2SeededContext(seed),
          ),
        ).toBeUndefined();
    }
  });
  it("completes all ten zero-stage sessions and rejects malformed submission atomically", () => {
    let session = createC2PilotSession("scaling", 75);
    expect(session.questions).toHaveLength(10);
    const first = session.questions[0];
    expect(() =>
      submitC2PilotAnswer(
        session,
        response("zero", {
          scalingB0: "0",
          scalingDelta: "1",
          scalingQ0: "1",
        }),
      ),
    ).toThrow();
    expect(session.currentIndex).toBe(0);
    expect(session.questions[0]).toBe(first);
    for (const q of session.questions) {
      const a = Number(q.data.c2ScalingCoreA),
        b = Number(q.data.c2ScalingCoreB);
      // A self-chosen non-identical baseline with a sufficiently close quotient.
      const b0 = b + 1;
      session = submitC2PilotAnswer(
        session,
        response("zero", {
          scalingB0: String(b0),
          scalingDelta: "1",
          scalingQ0: String(a / b0),
          scalingFinal: String(a / b0),
        }),
      );
    }
    expect(session.status).toBe("completed");
    expect(session.attempts).toHaveLength(10);
    expect(c2PilotScore(session)).toBe(10);
    expect(() => submitC2PilotAnswer(session, response("zero"))).toThrow(
      /finished/,
    );
    expect(createC2PilotSession("scaling", 76).questions).not.toEqual(
      session.questions,
    );
  });
});
