import { describe, expect, it } from "vitest";
import {
  c2PilotScore,
  createC2PilotSession,
  submitC2PilotAnswer,
  type C2PilotMode,
} from "./pilot-session";

describe("C2 playable support session", () => {
  it("freezes a reproducible set and accepts exactly one response per question", () => {
    const session = createC2PilotSession("r", 121);
    const same = createC2PilotSession("r", 121);
    expect(session.questions).toEqual(same.questions);
    expect(session.status).toBe("active");
    expect(session.questions).toHaveLength(20);
    expect(session.currentIndex).toBe(0);

    const response = { kind: "single" as const, value: session.questions[0].answer };
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
    expect(session.attempts[0].grade.gradingMetrics?.processExpectedC2).toBeCloseTo(userC2);
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
      expect(() =>
        submitC2PilotAnswer(r, { kind: "single", value }),
      ).toThrow();
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
        secondCorrection: String(Math.abs(actualUserC1) * Number(question.data.c2R)),
      },
    });
    expect(after.attempts[0].grade.isCorrect).toBe(false);
    expect(after.attempts[0].grade.gradingMetrics?.c1Passed).toBe(false);
    expect(after.attempts[0].grade.gradingMetrics?.c2Passed).toBe(true);
  });
});
