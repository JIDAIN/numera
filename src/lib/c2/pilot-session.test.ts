import { describe, expect, it } from "vitest";
import {
  c2PilotScore,
  createC2PilotSession,
  submitC2PilotAnswer,
  type C2PilotMode,
} from "./pilot-session";
import { c2PassesTarget, c2Round } from "./math";
import { C2_SPLIT_PILOT_BLOCKS } from "./split-pilot";

function splitAnswer(a: number, b: number) {
  const options = C2_SPLIT_PILOT_BLOCKS.flatMap((v) => [v, -v]);
  const target = a / b;
  let selected: number[] | undefined;
  for (const p of options) {
    if (c2PassesTarget(p / 100, target)) selected = [p];
    if (selected) break;
    for (const q of options) {
      if (c2PassesTarget((p + q) / 100, target)) selected = [p, q];
      if (selected) break;
      for (const r of options) {
        if (c2PassesTarget((p + q + r) / 100, target)) selected = [p, q, r];
        if (selected) break;
      }
      if (selected) break;
    }
    if (selected) break;
  }
  if (!selected) throw new Error("Missing Split witness in candidate group");
  let residual = a;
  const fields: Record<string, number | string> = {
    splitCount: selected.length,
    splitFinalPercent: String(selected.reduce((sum, p) => sum + p, 0)),
  };
  for (const [index, percent] of selected.entries()) {
    const amount = c2Round((percent * b) / 100, 8);
    residual = c2Round(residual - amount, 8);
    fields[`splitPercent${index + 1}`] = String(percent);
    fields[`splitAmount${index + 1}`] = String(amount);
    fields[`splitRemainder${index + 1}`] = String(residual);
  }
  return { kind: "structured" as const, fields };
}

describe("C2 playable support session", () => {
  it("freezes a reproducible set and accepts exactly one response per question", () => {
    const session = createC2PilotSession("r", 121);
    const same = createC2PilotSession("r", 121);
    expect(session.questions).toEqual(same.questions);
    expect(session.status).toBe("active");
    expect(session.questions).toHaveLength(20);
    expect(session.currentIndex).toBe(0);

    const response = {
      kind: "single" as const,
      value: session.questions[0].answer,
    };
    const next = submitC2PilotAnswer(session, response);
    expect(next.questions).toBe(session.questions);
    expect(next.attempts).toHaveLength(1);
    expect(next.attempts[0].questionId).toBe(session.questions[0].id);
    expect(next.attempts[0].grade.isCorrect).toBe(true);
    expect(next.currentIndex).toBe(1);
    expect(session.currentIndex).toBe(0);
    expect(session.attempts).toHaveLength(0);
  });

  it("completes both r and NxR single-stage sessions, scores, and starts fresh", () => {
    for (const mode of ["r", "nxr_first"] as C2PilotMode[]) {
      let session = createC2PilotSession(mode, 712);
      for (const question of session.questions) {
        session = submitC2PilotAnswer(
          session,
          mode === "r"
            ? { kind: "single", value: question.answer }
            : {
                kind: "structured",
                fields: { firstCorrection: String(question.data.c2ExactC1) },
              },
        );
      }

      expect(session.status).toBe("completed");
      expect(session.attempts).toHaveLength(20);
      expect(c2PilotScore(session)).toBe(20);
      expect(() =>
        submitC2PilotAnswer(session, { kind: "single", value: "1" }),
      ).toThrow(/finished/);
      const restarted = createC2PilotSession(mode, 713);
      expect(restarted.status).toBe("active");
      expect(restarted.attempts).toHaveLength(0);
      expect(restarted.questions).not.toEqual(session.questions);
    }
  });

  it("second order grades relative to the user's actual C1, not exact C1", () => {
    let session = createC2PilotSession("nxr_second", 631);
    expect(session.questions).toHaveLength(10);
    const question = session.questions[0];
    const exactC1 = Number(question.data.c2ExactC1);
    const r = Number(question.data.c2R);
    const actualUserC1 = exactC1 * 1.04;
    const userC2 = Math.abs(actualUserC1) * r;
    session = submitC2PilotAnswer(session, {
      kind: "structured",
      fields: {
        firstCorrection: String(actualUserC1),
        secondCorrection: String(userC2),
      },
    });
    expect(session.attempts[0].grade.isCorrect).toBe(true);
    expect(
      session.attempts[0].grade.gradingMetrics?.processExpectedC2,
    ).toBeCloseTo(userC2);
    expect(session.attempts[0].response).toEqual({
      kind: "structured",
      fields: {
        firstCorrection: String(actualUserC1),
        secondCorrection: String(userC2),
      },
    });
  });

  it("rejects missing, nonnumeric and overprecision responses instead of filling fields", () => {
    const r = createC2PilotSession("r", 57);
    for (const value of ["", "oops", "1.23", "Infinity", "2e2"])
      expect(() => submitC2PilotAnswer(r, { kind: "single", value })).toThrow();
    const nxr = createC2PilotSession("nxr_second", 58);
    expect(() =>
      submitC2PilotAnswer(nxr, {
        kind: "structured",
        fields: { firstCorrection: "3" },
      }),
    ).toThrow(/second/);
    expect(() =>
      submitC2PilotAnswer(nxr, {
        kind: "structured",
        fields: { firstCorrection: "", secondCorrection: "3" },
      }),
    ).toThrow(/first/);
  });

  it("never upgrades an inaccurate first-stage result with a compensating second result", () => {
    const start = createC2PilotSession("nxr_second", 809);
    const question = start.questions[0];
    const actualUserC1 = Number(question.data.c2ExactC1) * 1.08;
    const after = submitC2PilotAnswer(start, {
      kind: "structured",
      fields: {
        firstCorrection: String(actualUserC1),
        secondCorrection: String(
          Math.abs(actualUserC1) * Number(question.data.c2R),
        ),
      },
    });
    expect(after.attempts[0].grade.isCorrect).toBe(false);
    expect(after.attempts[0].grade.gradingMetrics?.c1Passed).toBe(false);
    expect(after.attempts[0].grade.gradingMetrics?.c2Passed).toBe(true);
  });

  it("rejects every non-decimal form in either NxR field without consuming frozen questions", () => {
    const invalid = [
      "0x10",
      "0X10",
      "0b10000",
      "0B10000",
      "0o20",
      "0O20",
      "2e2",
      "2E2",
      "1e309",
      "",
      "  ",
      "Infinity",
      "NaN",
      "1,000",
      "25%",
      ".",
      "+",
      "-",
    ];
    for (const mode of ["nxr_first", "nxr_second"] as const) {
      const frozen = createC2PilotSession(mode, 404);
      const question = frozen.questions[0];
      for (const value of invalid) {
        const fields = {
          firstCorrection: value,
          ...(mode === "nxr_second" ? { secondCorrection: "1.25" } : {}),
        };
        expect(() =>
          submitC2PilotAnswer(frozen, { kind: "structured", fields }),
        ).toThrow(/first/);
      }

      if (mode === "nxr_second") {
        for (const value of invalid)
          expect(() =>
            submitC2PilotAnswer(frozen, {
              kind: "structured",
              fields: {
                firstCorrection: String(question.data.c2ExactC1),
                secondCorrection: value,
              },
            }),
          ).toThrow(/second/);
      }

      expect(frozen.currentIndex).toBe(0);
      expect(frozen.status).toBe("active");
      expect(frozen.attempts).toHaveLength(0);
      expect(frozen.questions[0]).toBe(question);
      expect(frozen.questions).toHaveLength(mode === "nxr_first" ? 20 : 10);
    }
  });

  it("accepts signed and fractional decimals in both NxR fields", () => {
    const once = createC2PilotSession("nxr_first", 452);
    for (const input of ["+16", "-16", "+.5", "-.125", "16.", "  +12.50  "]) {
      const next = submitC2PilotAnswer(once, {
        kind: "structured",
        fields: { firstCorrection: input },
      });
      expect(next.currentIndex).toBe(1);
      expect(next.attempts[0].response.kind).toBe("structured");
    }

    const second = createC2PilotSession("nxr_second", 453);
    const exactC1 = Number(second.questions[0].data.c2ExactC1);
    const exactC2 = exactC1 * Number(second.questions[0].data.c2R);
    const next = submitC2PilotAnswer(second, {
      kind: "structured",
      fields: {
        firstCorrection: `+${exactC1}`,
        secondCorrection: `+${exactC2}`,
      },
    });
    expect(next.currentIndex).toBe(1);
    expect(next.attempts[0].grade.isCorrect).toBe(true);
  });

  it("finishes ten Direct questions with dual-axis grading", () => {
    let session = createC2PilotSession("direct", 211);
    expect(session.questions).toHaveLength(10);
    expect(session.questions).toEqual(
      createC2PilotSession("direct", 211).questions,
    );
    const frozen = session.questions;
    for (const question of frozen) {
      session = submitC2PilotAnswer(session, {
        kind: "structured",
        fields: {
          firstQuotientDigit: String(question.data.c2DirectFirstDigit),
          firstDigitProduct: String(question.data.c2DirectFirstProduct),
          remainderAfterFirstDigit: String(
            question.data.c2DirectFirstRemainder,
          ),
          secondQuotientDigit: String(question.data.c2DirectSecondDigit),
          ...(question.data.c2DirectRequestedDigits === 3
            ? { thirdQuotientDigit: String(question.data.c2DirectThirdDigit) }
            : {}),
        },
      });
    }
    expect(session.status).toBe("completed");
    expect(session.questions).toBe(frozen);
    expect(session.attempts).toHaveLength(10);
    expect(c2PilotScore(session)).toBe(10);
    expect(
      session.attempts.every(
        (attempt) =>
          attempt.grade.gradingMetrics?.processConsistency === "consistent",
      ),
    ).toBe(true);
    expect(() =>
      submitC2PilotAnswer(session, { kind: "single", value: "1" }),
    ).toThrow(/finished/);
    const again = createC2PilotSession("direct", 212);
    expect(again.attempts).toHaveLength(0);
    expect(again.questions).not.toEqual(frozen);
  });

  it("does not consume a Direct question on invalid fields", () => {
    const session = createC2PilotSession("direct", 201);
    const question = session.questions[0];
    const valid = {
      firstQuotientDigit: String(question.data.c2DirectFirstDigit),
      firstDigitProduct: String(question.data.c2DirectFirstProduct),
      remainderAfterFirstDigit: String(question.data.c2DirectFirstRemainder),
      secondQuotientDigit: String(question.data.c2DirectSecondDigit),
      ...(question.data.c2DirectRequestedDigits === 3
        ? { thirdQuotientDigit: String(question.data.c2DirectThirdDigit) }
        : {}),
    };
    const invalid = [
      ["firstQuotientDigit", "0x1"],
      ["firstQuotientDigit", "0"],
      ["firstQuotientDigit", "2.3"],
      ["firstDigitProduct", "0b10"],
      ["firstDigitProduct", ""],
      ["remainderAfterFirstDigit", "Infinity"],
      ["remainderAfterFirstDigit", "1e2"],
      ["secondQuotientDigit", "10"],
      ["secondQuotientDigit", "-1"],
      ["secondQuotientDigit", ""],
    ];
    for (const [key, value] of invalid)
      expect(() =>
        submitC2PilotAnswer(session, {
          kind: "structured",
          fields: { ...valid, [key]: value },
        }),
      ).toThrow();
    if (question.data.c2DirectRequestedDigits === 3) {
      expect(() =>
        submitC2PilotAnswer(session, {
          kind: "structured",
          fields: { ...valid, thirdQuotientDigit: "" },
        }),
      ).toThrow(/third/);
    }
    expect(session.questions[0]).toBe(question);
    expect(session.currentIndex).toBe(0);
    expect(session.attempts).toHaveLength(0);
  });

  it("records wrong process values apart from final result", () => {
    const session = createC2PilotSession("direct", 33);
    const question = session.questions[0];
    const result = submitC2PilotAnswer(session, {
      kind: "structured",
      fields: {
        firstQuotientDigit: String(question.data.c2DirectFirstDigit),
        firstDigitProduct: String(
          Number(question.data.c2DirectFirstProduct) + 1,
        ),
        remainderAfterFirstDigit: String(question.data.c2DirectFirstRemainder),
        secondQuotientDigit: String(question.data.c2DirectSecondDigit),
        ...(question.data.c2DirectRequestedDigits === 3
          ? { thirdQuotientDigit: String(question.data.c2DirectThirdDigit) }
          : {}),
      },
    });
    expect(result.currentIndex).toBe(1);
    expect(result.attempts[0].grade.isCorrect).toBe(true);
    expect(result.attempts[0].grade.gradingMetrics?.processConsistency).toBe(
      "review_needed",
    );
  });
  it("finishes ten Split questions with learner-entered variable paths", () => {
    let session = createC2PilotSession("split", 203);
    expect(session.questions).toHaveLength(10);
    const frozen = session.questions;
    expect(frozen).toEqual(createC2PilotSession("split", 203).questions);
    for (const question of frozen) {
      session = submitC2PilotAnswer(
        session,
        splitAnswer(
          Number(question.data.c2SplitCoreA),
          Number(question.data.c2SplitCoreB),
        ),
      );
    }
    expect(session.status).toBe("completed");
    expect(session.questions).toBe(frozen);
    expect(session.attempts).toHaveLength(10);
    expect(c2PilotScore(session)).toBe(10);
    expect(
      session.attempts.every(
        (x) => x.grade.gradingMetrics?.processConsistency === "consistent",
      ),
    ).toBe(true);
    expect(() =>
      submitC2PilotAnswer(session, { kind: "single", value: "50" }),
    ).toThrow(/finished/);
    const next = createC2PilotSession("split", 204);
    expect(next.questions).not.toEqual(frozen);
    expect(next.attempts).toHaveLength(0);
  });

  it("rejects malformed Split stages atomically without consuming questions", () => {
    const session = createC2PilotSession("split", 33);
    const first = session.questions[0];
    const good = splitAnswer(
      Number(first.data.c2SplitCoreA),
      Number(first.data.c2SplitCoreB),
    );
    for (const fields of [
      { ...good.fields, splitPercent1: "0.1" },
      { ...good.fields, splitAmount1: "0x10" },
      { ...good.fields, splitRemainder1: "" },
      { ...good.fields, splitFinalPercent: "1e1" },
      { ...good.fields, splitCount: 0 },
      { ...good.fields, splitCount: 22 },
      { ...good.fields, splitCount: good.fields.splitCount + "1" },
    ]) {
      expect(() =>
        submitC2PilotAnswer(session, { kind: "structured", fields }),
      ).toThrow();
    }
    expect(session.questions[0]).toBe(first);
    expect(session.currentIndex).toBe(0);
    expect(session.attempts).toHaveLength(0);
  });

  it("accepts final-correct Split with contradictory actual block for review", () => {
    const session = createC2PilotSession("split", 11);
    const question = session.questions[0];
    const actual = splitAnswer(
      Number(question.data.c2SplitCoreA),
      Number(question.data.c2SplitCoreB),
    );
    const result = submitC2PilotAnswer(session, {
      ...actual,
      fields: { ...actual.fields, splitAmount1: "99999" },
    });
    expect(result.attempts[0].grade.isCorrect).toBe(true);
    expect(result.attempts[0].grade.gradingMetrics?.processConsistency).toBe(
      "review_needed",
    );
    expect(result.currentIndex).toBe(1);
    expect(result.attempts[0].response.kind).toBe("structured");
  });
});
