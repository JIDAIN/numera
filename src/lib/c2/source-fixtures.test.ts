import { describe, expect, it } from "vitest";
import cases from "./fixtures/e2-source-cases.json";
import {
  auditC2DirectDigits,
  auditC2RawApproximation,
  auditC2SplitBlocks,
  referenceC2ScalingStages,
} from "./math-oracle";

const xp = cases.teacher.filter((item) => item.source === "xiao_p_handout");
const fs = cases.teacher.filter(
  (item) => item.source === "huasheng_compilation",
);
const exams = cases.completedExam;

function findCase(id: string) {
  const item = cases.teacher.find((caseItem) => caseItem.id === id);
  if (!item) throw new Error(`Missing traceable teacher fixture: ${id}`);
  return item;
}

function findExam(id: string) {
  const item = exams.find((caseItem) => caseItem.id === id);
  if (!item) throw new Error(`Missing completed-review fixture: ${id}`);
  return item;
}

describe("C2 E2 source-level evidence fixtures", () => {
  it("keeps original, compilation, and completed-exam review provenance separate", () => {
    expect(cases.schemaVersion).toBe(1);
    expect(cases.sourceContract).toBe(
      "research_evidence_only_no_question_admission",
    );
    expect(xp).toHaveLength(10);
    expect(fs).toHaveLength(12);
    expect(exams).toHaveLength(6);
    expect(
      new Set([...cases.teacher, ...exams].map((item) => item.id)).size,
    ).toBe(28);
    expect(
      xp.every(
        (item) =>
          item.pdfPage === 30 &&
          item.printedPage === 29 &&
          item.evidenceLevel === "bare_fraction_unanswered" &&
          item.document === "资料分析理论讲义.pdf",
      ),
    ).toBe(true);
    expect(
      fs.every(
        (item) =>
          item.pdfPage === 20 &&
          item.printedPage === 15 &&
          item.evidenceLevel === "annotated_compilation_not_video_transcript",
      ),
    ).toBe(true);
    expect(
      exams.every(
        (item) =>
          item.reviewPath.startsWith(
            "13_Projects/gongkao/资料分析/04_真题研究/",
          ) && item.evidenceLevel === "review_record_not_unseen_exam_corpus",
      ),
    ).toBe(true);
  });

  it("verifies all 22 source numbers separately from their Numera-only numeric probes", () => {
    for (const item of cases.teacher) {
      expect(item.a).toBeGreaterThan(0);
      expect(item.b).toBeGreaterThan(0);
      expect(item.probe.owner).toBe("numera_math_probe_not_teacher_answer");
      const checked = auditC2RawApproximation(item.a, item.b, item.probe.value);
      expect(checked, item.id).toBeDefined();
      expect(checked?.passed, item.id).toBe(true);
    }
  });

  it("preserves the documented teaching-example vs V1 0.2–5 domain conflict", () => {
    const currentStudyDomain = (a: number, b: number) => {
      const q = a / b;
      return q >= 0.2 && q <= 5;
    };
    expect(xp.filter((item) => item.a / item.b > 5)).toHaveLength(8);
    expect(fs.filter((item) => item.a / item.b < 0.2)).toHaveLength(7);
    expect(
      cases.teacher.filter((item) => currentStudyDomain(item.a, item.b)),
    ).toHaveLength(7);
    // This is a historical source audit, not a generator-band modification.
  });

  it("distinguishes a one-block warmup from a useful signed two-block chain", () => {
    const one = findCase("FS02");
    const single = auditC2SplitBlocks(one.a, one.b, [0.5]);
    expect(single?.firstPassingStep).toBe(1);
    const source = findCase("FS01");
    const two = auditC2SplitBlocks(source.a, source.b, [0.5, -0.05]);
    expect(two?.steps[0].passed).toBe(false);
    expect(two?.firstPassingStep).toBe(2);
    expect(two?.steps[1].remaining).toBeCloseTo(
      source.a - (0.5 - 0.05) * source.b,
    );
    const negative = findCase("FS11");
    expect(
      auditC2SplitBlocks(negative.a, negative.b, [1, -0.05])?.firstPassingStep,
    ).toBe(2);
  });

  it("does not turn mathematically useful 0.1% or 0.2% blocks into approved actions", () => {
    const fine = findCase("FS09");
    expect(
      auditC2SplitBlocks(fine.a, fine.b, [0.02])?.firstPassingStep,
    ).toBeUndefined();
    const mathematical = auditC2SplitBlocks(fine.a, fine.b, [0.02, 0.001]);
    expect(mathematical?.firstPassingStep).toBe(2);
    expect(mathematical).not.toHaveProperty("methodAdmission");
    expect(mathematical).not.toHaveProperty("difficultyBand");

    const long = findCase("FS12");
    expect(
      auditC2SplitBlocks(long.a, long.b, [0.05, 0.02])?.firstPassingStep,
    ).toBeUndefined();
    expect(
      auditC2SplitBlocks(long.a, long.b, [0.05, 0.02, -0.002])
        ?.firstPassingStep,
    ).toBe(3);
  });

  it("keeps Xiao P printed exercises distinct from later teacher-work explanations", () => {
    const large = findCase("XP-L01");
    expect(large.a).toBe(35139);
    expect(large.b).toBe(112);
    expect(
      auditC2RawApproximation(large.a, large.b, large.probe.value)?.passed,
    ).toBe(true);
    expect(large.evidenceLevel).toBe("bare_fraction_unanswered");
    const underOne = findCase("XP-L10");
    expect(auditC2DirectDigits(underOne.a, underOne.b, 0.38)?.passed).toBe(
      true,
    );
  });

  it("does not confuse exam option-driven 10% with standalone 3% acceptance", () => {
    const source = findExam("R07");
    expect(source.expressionStatus).toBe("review_approximated_expression");
    const approximateChoice = auditC2RawApproximation(source.a, source.b, 0.1);
    expect(approximateChoice?.relativeError).toBeGreaterThan(0.03);
    expect(approximateChoice?.passed).toBe(false);
    expect(auditC2RawApproximation(source.a, source.b, 0.105)?.passed).toBe(
      true,
    );
  });

  it("tracks raw exam expression vs research-only truncated calculation core", () => {
    const source = findExam("R06");
    expect(source.expressionStatus).toBe("recorded_review_expression");
    expect(source.core?.kind).toBe("research_truncation_not_teacher_execution");
    if (!source.core) throw new Error("Missing R06 research core");
    const coreQuotient = (source.core.a / source.core.b) * source.core.scale;
    expect(coreQuotient).not.toBeCloseTo(source.a / source.b, 7);
    expect(
      auditC2RawApproximation(source.a, source.b, coreQuotient)?.passed,
    ).toBe(true);
    expect(auditC2RawApproximation(source.a, source.b, 0.7)?.passed).toBe(true);
    // A short option-based estimate is not the Direct specialty's exact digits.
    expect(auditC2DirectDigits(source.a, source.b, 0.7)?.passed).toBe(false);
  });

  it("marks a composite problem's subexpression as an extraction", () => {
    const source = findExam("R08");
    expect(source.expressionStatus).toBe("extracted_composite_subexpression");
    expect(source.core?.kind).toBe("research_truncation_not_teacher_execution");
    expect(auditC2RawApproximation(source.a, source.b, 0.82)?.passed).toBe(
      true,
    );
  });

  it("retains original exam-derived scaling references without winner labels", () => {
    const source = findExam("R05");
    const r = referenceC2ScalingStages({
      a: source.a,
      b: source.b,
      baseline: 800,
      path: "repair_result",
    });
    expect(r?.stage0.passed).toBe(false);
    expect(r?.stage1.passed).toBe(true);
    expect(r?.stage1.value).toBeCloseTo(0.27);
    expect(r).not.toHaveProperty("routeWinner");
    expect(r).not.toHaveProperty("releaseEligible");
    expect(exams.every((e) => !("L" in e))).toBe(true);
  });
});
