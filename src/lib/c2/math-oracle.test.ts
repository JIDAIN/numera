import { describe, expect, it } from "vitest";
import {
  auditC2DirectDigits,
  auditC2Nxr,
  auditC2RPercent,
  auditC2RawApproximation,
  auditC2SplitBlocks,
  referenceC2ScalingStages,
} from "./math-oracle";

/**
 * Evidence tags describe numerical provenance only; they do NOT certify route
 * winners, true exam distributions, product admission or L1/L2/L3 gold labels.
 */
const sources = {
  directBoundary: "Obsidian C2 research ledger 45 / D02 (study candidate)",
  huasheng: "27花生资料分析笔记 PDF: printed p15, split practice",
  xiaoP: "资料分析理论讲义 + Obsidian C2 teacher practice study",
  constructed:
    "E2 explicitly constructed arithmetic control, not original exam",
} as const;

describe("C2 E2 task-separated mathematical oracle", () => {
  it("Direct two digits are TRUNCATED and exact, not rounded or graded by 3%", () => {
    expect(sources.directBoundary).toContain("study candidate");
    const direct = auditC2DirectDigits(890, 371, 2.3);
    expect(direct?.expected).toBe(2.3);
    expect(direct?.passed).toBe(true);
    expect(direct?.rawRelativeError).toBeGreaterThan(0.03);
    expect(auditC2DirectDigits(890, 371, 2.4)?.passed).toBe(false);
    expect(auditC2RawApproximation(890, 371, 2.3)?.passed).toBe(false);
    expect(auditC2RawApproximation(890, 371, 2.4)?.passed).toBe(true);
    expect(auditC2DirectDigits(890, 371, 2.39, 3)?.passed).toBe(true);
  });

  it("raw/comprehensive evaluates the unmodified raw quotient", () => {
    expect(auditC2RawApproximation(2254.7, 6946.7, 0.32)?.passed).toBe(true);
    expect(auditC2RawApproximation(2254.7, 6946.7, 0.28)?.passed).toBe(false);
  });

  it("Split records first-sufficient step rather than requiring 3 blocks", () => {
    expect(sources.huasheng).toContain("p15");
    const two = auditC2SplitBlocks(157, 354, [0.5, -0.05]);
    expect(two?.steps[0].passed).toBe(false);
    expect(two?.steps[1].passed).toBe(true);
    expect(two?.firstPassingStep).toBe(2);
    expect(auditC2SplitBlocks(388, 1564, [0.25])?.firstPassingStep).toBe(1);
  });

  it("0.1% math may work but this oracle does not authorize a new split block", () => {
    const onlyTwoPercent = auditC2SplitBlocks(223, 10641, [0.02]);
    const plusPointOne = auditC2SplitBlocks(223, 10641, [0.02, 0.001]);
    expect(onlyTwoPercent?.firstPassingStep).toBeUndefined();
    expect(plusPointOne?.firstPassingStep).toBe(2);
    expect(plusPointOne).not.toHaveProperty("admitted");
  });

  it("Scaling zero-order can pass without calculating any correction", () => {
    expect(sources.xiaoP).toContain("讲义");
    const result = referenceC2ScalingStages({
      a: 645,
      b: 122,
      baseline: 125,
      path: "repair_result",
    });
    expect(result?.q0).toBeCloseTo(5.16);
    expect(result?.stage0.passed).toBe(true);
    // Its mathematically available later stages do not mean the learner did them.
  });

  it("Scaling rough-quotient×delta repair needs no r input; no invented second order", () => {
    expect(sources.constructed).toContain("not original exam");
    const rough = referenceC2ScalingStages({
      a: 645,
      b: 119,
      baseline: 125,
      path: "repair_numerator_rough",
      roughQuotient: 5,
    });
    expect(rough?.delta).toBe(6);
    expect(rough?.stage0.passed).toBe(false);
    expect(rough?.firstCorrection).toBe(30);
    expect(rough?.firstNumerator).toBe(675);
    expect(rough?.stage1.passed).toBe(true);
    expect(rough?.stage2).toBeUndefined();
    expect(
      referenceC2ScalingStages({
        a: 645,
        b: 119,
        baseline: 125,
        path: "repair_numerator_rough",
      }),
    ).toBeUndefined();
  });

  it("Scaling standard result and A×r references support a positive second-order correction", () => {
    const result = referenceC2ScalingStages({
      a: 645,
      b: 131,
      baseline: 125,
      path: "repair_result",
    });
    const numerator = referenceC2ScalingStages({
      a: 645,
      b: 131,
      baseline: 125,
      path: "repair_numerator_r",
    });
    expect(result?.signedR).toBeLessThan(0);
    expect(result?.stage2?.value).toBeGreaterThan(result!.stage1.value);
    expect(numerator?.stage2?.value).toBeGreaterThan(numerator!.stage1.value);
  });

  it("strict r rounding vs nominal 333/167-style shortcut remains an unresolved fixture", () => {
    const example = auditC2RPercent(125, 167, 25.2, 25.2);
    expect(example?.displayedPercent).toBe(25.1);
    expect(example?.shortcutConflict).toBe(true);
    expect(example?.passed).toBe(false);
    expect(auditC2RPercent(125, 167, 25.1)?.passed).toBe(true);
  });

  it("second N×r step uses actual C1, never substitutes ideal C1", () => {
    const two = auditC2Nxr({
      n: 856,
      r: 0.042,
      submittedC1: 36,
      variant: "second_order",
      submittedC2: 1.5,
    });
    expect(two?.expectedC1).toBeCloseTo(35.952);
    expect(two?.expectedC2FromUserC1).toBeCloseTo(1.512);
    expect(two?.passed).toBe(true);
    expect(
      auditC2Nxr({
        n: 856,
        r: 0.042,
        submittedC1: 36,
        variant: "second_order",
        submittedC2: 1.7,
      })?.passed,
    ).toBe(false);
    expect(
      auditC2Nxr({
        n: 856,
        r: 0.042,
        submittedC1: 36,
        variant: "second_order",
      })?.passed,
    ).toBe(false);
    expect(
      auditC2Nxr({
        n: 250,
        r: 0.08,
        submittedC1: 20,
        variant: "first_order",
      })?.passed,
    ).toBe(true);
  });

  it("invalid operands are rejected and no L, route win or admission labels are returned", () => {
    expect(auditC2DirectDigits(0, 3, 2.3)).toBeUndefined();
    expect(auditC2RawApproximation(1, 0, 0.5)).toBeUndefined();
    expect(auditC2SplitBlocks(157, 354, [Number.NaN])).toBeUndefined();
    expect(auditC2RPercent(125, 167, Number.NaN)).toBeUndefined();
    const route = referenceC2ScalingStages({
      a: 645,
      b: 119,
      baseline: 125,
      path: "repair_result",
    });
    expect(route).not.toHaveProperty("difficultyBand");
    expect(route).not.toHaveProperty("releaseEligible");
  });
});
