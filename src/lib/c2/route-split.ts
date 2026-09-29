import { C2RouteLevel, C2_TARGET_PRECISION } from "./contract";
import {
  c2LocalCostBand,
  c2NumberMentalCost,
  c2RelativeError,
  c2Round,
  type C2LocalCostBand,
} from "./math";

export type C2SplitBlock = {
  percent: number;
  amount: number;
  remainder: number;
  accumulatedPercent: number;
  percentCost: C2LocalCostBand;
  amountCost: C2LocalCostBand;
  remainderCost: C2LocalCostBand;
  numericCost: number;
};

export type C2SplitEvaluation = {
  route: "split";
  feasible: boolean;
  level: C2RouteLevel;
  stopStage: number;
  finalEstimate: number;
  relativeError: number;
  blocks: C2SplitBlock[];
  hardCount: number;
  normalCount: number;
  totalCost: number;
};

type SplitState = {
  accumulatedPercent: number;
  blocks: C2SplitBlock[];
  cost: number;
};

const BASE_PERCENT_BLOCKS = [
  500, 400, 300, 200, 100, 50, 25, 20, 10, 5, 2, 1, 0.5,
] as const;

function percentCostBand(percent: number): C2LocalCostBand {
  const value = Math.abs(percent);
  if ([500, 400, 300, 200, 100, 50, 25, 20, 10, 5, 2, 1].includes(value))
    return "easy";
  if (value === 0.5) return "normal";
  return "hard";
}

function bandPenalty(band: C2LocalCostBand) {
  if (band === "easy") return 0;
  if (band === "normal") return 0.7;
  return 1.6;
}

function blockFacts(
  a: number,
  b: number,
  accumulatedPercent: number,
  percent: number,
): C2SplitBlock {
  const nextPercent = c2Round(accumulatedPercent + percent, 6);
  const amount = c2Round((b * percent) / 100, 8);
  const remainder = c2Round(a - (b * nextPercent) / 100, 8);
  const pBand = percentCostBand(percent);
  const amountBand = c2LocalCostBand(Math.abs(amount));
  const remainderBand = c2LocalCostBand(Math.abs(remainder));

  return {
    percent,
    amount,
    remainder,
    accumulatedPercent: nextPercent,
    percentCost: pBand,
    amountCost: amountBand,
    remainderCost: remainderBand,
    numericCost:
      0.55 +
      bandPenalty(pBand) +
      0.16 * c2NumberMentalCost(Math.abs(amount)) +
      0.12 * c2NumberMentalCost(Math.abs(remainder)) +
      bandPenalty(amountBand) * 0.45 +
      bandPenalty(remainderBand) * 0.35,
  };
}

function stateError(state: SplitState, quotient: number) {
  return c2RelativeError(state.accumulatedPercent / 100, quotient);
}

function stateRanking(state: SplitState, quotient: number) {
  const error = stateError(state, quotient);
  return state.cost + Math.min(4, error * 8);
}

function classifyLevel(blocks: C2SplitBlock[]): {
  level: C2RouteLevel;
  hardCount: number;
  normalCount: number;
} {
  const bands = blocks.flatMap((block) => [
    block.percentCost,
    block.amountCost,
    block.remainderCost,
  ]);
  const hardCount = bands.filter((band) => band === "hard").length;
  const normalCount = bands.filter((band) => band === "normal").length;

  let level: C2RouteLevel;
  if (blocks.length <= 3 && hardCount === 0 && normalCount <= 2) {
    level = "low";
  } else if (
    (blocks.length <= 3 && hardCount <= 1) ||
    (blocks.length === 4 && hardCount === 0)
  ) {
    level = "medium";
  } else {
    level = "high";
  }

  return { level, hardCount, normalCount };
}

export function evaluateC2Split(
  a: number,
  b: number,
  options: { maxDepth?: number; beamWidth?: number } = {},
): C2SplitEvaluation | undefined {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0)
    return undefined;

  const quotient = a / b;
  const maxDepth = options.maxDepth ?? 4;
  const beamWidth = options.beamWidth ?? 12;
  const targetPercent = quotient * 100;
  const maxPercent = Math.max(550, Math.ceil(targetPercent / 100) * 100 + 100);

  let beam: SplitState[] = [{ accumulatedPercent: 0, blocks: [], cost: 0 }];
  const successes: SplitState[] = [];

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const nextByPercent = new Map<string, SplitState>();

    for (const state of beam) {
      for (const base of BASE_PERCENT_BLOCKS) {
        for (const sign of [1, -1] as const) {
          const percent = base * sign;
          const block = blockFacts(a, b, state.accumulatedPercent, percent);
          if (
            block.accumulatedPercent < -50 ||
            block.accumulatedPercent > maxPercent
          )
            continue;

          const next: SplitState = {
            accumulatedPercent: block.accumulatedPercent,
            blocks: [...state.blocks, block],
            cost: state.cost + block.numericCost,
          };

          const key = block.accumulatedPercent.toFixed(3);
          const previous = nextByPercent.get(key);
          if (!previous || next.cost < previous.cost)
            nextByPercent.set(key, next);
        }
      }
    }

    const candidates = [...nextByPercent.values()];
    for (const state of candidates) {
      if (stateError(state, quotient) <= C2_TARGET_PRECISION + 1e-12)
        successes.push(state);
    }

    beam = candidates
      .sort(
        (left, right) =>
          stateRanking(left, quotient) - stateRanking(right, quotient),
      )
      .slice(0, beamWidth);
  }

  if (!successes.length) {
    const best = beam
      .slice()
      .sort(
        (left, right) =>
          stateError(left, quotient) - stateError(right, quotient),
      )[0];
    const blocks = best?.blocks ?? [];
    const classification = classifyLevel(blocks);
    return {
      route: "split",
      feasible: false,
      level: "high",
      stopStage: blocks.length,
      finalEstimate: (best?.accumulatedPercent ?? 0) / 100,
      relativeError: best
        ? stateError(best, quotient)
        : Number.POSITIVE_INFINITY,
      blocks,
      hardCount: classification.hardCount,
      normalCount: classification.normalCount,
      totalCost: best?.cost ?? Number.POSITIVE_INFINITY,
    };
  }

  const best = successes.sort(
    (left, right) =>
      left.cost - right.cost ||
      left.blocks.length - right.blocks.length ||
      stateError(left, quotient) - stateError(right, quotient),
  )[0];
  const classification = classifyLevel(best.blocks);

  return {
    route: "split",
    feasible: true,
    level: classification.level,
    stopStage: best.blocks.length,
    finalEstimate: best.accumulatedPercent / 100,
    relativeError: stateError(best, quotient),
    blocks: best.blocks,
    hardCount: classification.hardCount,
    normalCount: classification.normalCount,
    totalCost: best.cost,
  };
}
