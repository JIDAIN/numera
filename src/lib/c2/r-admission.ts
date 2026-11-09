import { c2Round } from "./math";

/**
 * Nominal reciprocal approximations are *not* interchangeable with the
 * strict 0.1-percentage-point answer required by the current r exercise.
 * Hold back the disagreement pairs rather than silently accept two outputs.
 */
const NOMINAL_PERCENT_PER_DELTA = new Map<number, number>([
  [111, 0.9],
  [125, 0.8],
  [143, 0.7],
  [167, 0.6],
  [250, 0.4],
  [333, 0.3],
]);

export function c2RNominalDisplayConflict(b: number, b0: number): boolean {
  const multiplier = NOMINAL_PERCENT_PER_DELTA.get(b0);
  if (multiplier === undefined) return false;
  if (![b, b0].every((number) => Number.isFinite(number) && number > 0))
    return true;
  const delta = Math.abs(b - b0);
  const exactDisplay = c2Round((delta / b0) * 100, 1);
  const nominalDisplay = c2Round(delta * multiplier, 1);
  return exactDisplay !== nominalDisplay;
}
