# C2 Realistic Numbers / Truncation Calibration V3 (2026-10-09)

> **Engineering mapping, not implemented.** Product source of truth in the Obsidian `JIDAIN/lys-obsidian-note` file `13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/27_C2_真实资料数字与截位核心路线校准_V3.md`. User feedback: prior V2 controlled examples with 500/800/1000 numerators are over-rounded and unlike naturally truncated data-analysis numeric cores. They remain *synthetic algebraic controls only*.

## 1. Preserve source provenance and difficulty/suitability boundaries

The V3 Obsidian document uses:
- **16 `textbook_exercise` inputs**, exact arithmetic expressions visible in attached `27花生资料分析笔记（已更完）`, sections 2.3.1/2.3.2. They are actual exercises but **not provably raw-data truncations**, and the original guide's "等比放缩" is not automatically the same operation as Numera's C2 compensated-Scaling path.
- **4 `raw_data_truncation` constructed ratios** from the statistics table in the same attached lecture notes. They are not the original question or answer; they preserve the original values, first-three-significant-digit truncation and scale-normalized core ratio, plus core-to-raw relative error.

Do NOT claim those 20 form a statistically representative sample of real civil-service test questions; this is a much less contrived **seed review set**, not an empirical distribution.

## 2. Suggested fixture provenance contract (types not yet implemented)

```ts
type CalibrationProvenance = 
  | { kind: "algebraic_control"; pairFamilyId: string; changedVariable: string }
  | { kind: "textbook_exercise"; sourceTitle: string; sourceSection: string; originalExpression: { a:number; b:number } }
  | { kind: "raw_data_truncation"; sourceTitle: string; sourceSection: string;
      rawA: number; rawB: number; truncationMode: "trunc3"; 
      retainedSignificantDigits: 3; coreA: number; coreB: number;
      normalizationScaleA: number; normalizationScaleB: number;
      coreRatioError: number };

type RouteCalibrationEvidence = {
  provenance: CalibrationProvenance;
  approximateGoal: { relativeErrorTolerance: 0.03 };
  quotientProbe: { q: number; verifiedResult: boolean; humanDiscoverability: "unknown" };
  scalingPlan: {
    namedBase: number;
    effectiveNumericalTransform?: { multiplier: number; scale: number };
    baselineQuotientTrace: unknown;
    signedRMentalTrace: unknown;           // named delta * shortcut multiplier
    correctionTrace?: unknown;              // only when actually necessary
    actualFinalEstimate: number;
    finalCoreError: number;
    finalRawError?: number;                 // raw provenance cases
  };
  methodWinnerStatus: "human_unreviewed" | "pending_conflict" | "user_approved";
};
```

Avoid inverting the exact quotient to *invent* a beautifully rounded q and calling it discoverable. A numeric q probe only proves feasibility when its multiplication-back chain and error are validated, not that people naturally think of it.

## 3. Twenty input pairs for trace/calibration regression

### Lecture exercise numerators and denominators (not proven truncations)

| ID | A | B | Named baseline to test | Candidate q probe |
|---|---:|---:|---:|---:|
| H01 | 157 | 354 | 333 | 0.44 |
| H02 | 423 | 866 | 1000 | 0.50 |
| H03 | 117 | 856 | 1000 | 0.14 |
| H04 | 467 | 494 | 500 | 0.95 |
| H05 | 488 | 512 | 500 | 0.95 |
| H06 | 885 | 992 | 1000 | 0.90 |
| H07 | 154 | 508 | 500 | 0.30 |
| H08 | 468 | 372 | 333 | 1.25 |
| H09 | 358 | 188 | 200 | 1.9 |
| H10 | 398 | 289 | 333 | 1.4 |
| H11 | 338 | 303 | 300 | 1.1 |
| H12 | 344 | 5122 | 5000 | 0.067 |
| H13 | 256 | 7342 | 7000 | 0.035 |
| H14 | 174 | 1266 | 1250 | 0.14 |
| H15 | 336 | 2682 | 2500 | 0.125 |
| H16 | 372 | 11122 | 10000 | 0.033 |

### Reconstructed from actual lecture statistics (created ratios, NOT original questions)

| ID | raw A | raw B | truncated normalized A | B | representative base | Probe |
|---|---:|---:|---:|---:|---:|---:|
| T01 | 26748 | 27444 | 267 | 274 | 250 | 1 |
| T02 | 26543 | 23744 | 265 | 237 | 250 | 1.1 |
| T03 | 672.8 | 631.9 | 672 | 631 | 600 | 1.06 |
| T04 | 520.3 | 549.3 | 520 | 549 | 500 | 0.95 |

All 20 were checked for final approximate-result relative error under 3% for both the displayed q probes and theoretical first-order scaling traces, including named-base delta shortcut r for 333. **Nothing here constitutes human-validated fastest-route labels.**

## 4. Required generator/evaluator behavioral tests

1. Store realistic numerator/denominator trailing-digit structure, quotient bands, effective-digit count, multi-order scales, zeros and decimal normalization.
2. Keep two separate tasks: `common_approx` for fair route comparisons (includes truncation error against raw expression) and `direct_exact_digits` for two/optional three accurate significant quotient digits.
3. Avoid synthetic 500/800/1000 numerators as representative natural inputs; use them **only in controlled unit/edge tests** where the reason for artificial simplicity is explicit.
4. For a familiar named base 333, 143, 111 etc., model `Q0=k*A/M` and **mental** `r≈(B_nom−B)*k/M` as one plausible trace. Do not force `kB` or assume the precise theoretical r² applies after intermediate rounding.
5. For ordinary round baselines such as 300, 7000, 900, insist the actual `A/B0` division is truly easy; mere small r is not sufficient.
6. If zero order reaches 3%, stop rather than forcing a correction stage. For one-step correction, compare executable correction against Direct's discoverable quotient-multiple checks; allow ties/unresolved.
7. For raw ratio test fixtures, independently test the truncation strategy and quotient: `error(coreA/coreB,rawA/rawB)`, `error(finalEstimatedValue,rawA/rawB)`, not just `error(finalEstimatedValue,coreA/coreB)`.
8. Calibration corpus label kinds must be preserved when aggregating quality metrics: `algebraic_control`, `textbook_exercise`, `raw_data_truncation`; never derive a "real-world preferred route frequency" from toy/lecture-only examples.
9. Only after user review should a route-cost advantage be allowed into classifier golden labels; weights, naturalness thresholds, L1/2/3 quotas and empirical distribution percentages are still unapproved.

No source code, CI tests, PR merge or Vercel deployment has been performed by this documentation update.
