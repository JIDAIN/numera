import { describe, expect, it } from "vitest";
import { evaluateC2Direct } from "./route-direct";
import { evaluateC2Split } from "./route-split";
import { evaluateC2Scaling } from "./route-scaling";
import { evaluateC2RouteLandscape } from "./route-evaluator";

describe("C2 route evaluators", () => {
  it("keeps direct division in the normal two-digit estimation model", () => {
    const route = evaluateC2Direct(877, 327);

    expect(route).toBeDefined();
    expect(route?.firstEstimate).toBe(2);
    expect(route?.secondEstimate).toBe(2.7);
    expect(route?.feasible).toBe(true);
    expect(route?.stopStage).toBe("second");
    expect(route?.relativeError).toBeLessThanOrEqual(0.03);
    expect(["low", "medium", "high"]).toContain(route?.level);
  });

  it("does not require more than three split blocks for an ordinary friendly example", () => {
    const route = evaluateC2Split(492, 689);

    expect(route).toBeDefined();
    expect(route?.feasible).toBe(true);
    expect(route?.blocks.length).toBeLessThanOrEqual(3);
    expect(route?.relativeError).toBeLessThanOrEqual(0.03);
    expect(route?.blocks.every((block) => block.percent !== 0)).toBe(true);
  });

  it("recognizes the relation baseline in 424 divided by 214", () => {
    const route = evaluateC2Scaling(424, 214);

    expect(route).toBeDefined();
    expect(route?.feasible).toBe(true);
    expect(route?.relativeError).toBeLessThanOrEqual(0.03);
    expect([
      route?.baseline,
      ...(route?.alternatives ?? []).map((item) => item.baseline),
    ]).toContain(212);
    const relation = [route!, ...(route?.alternatives ?? [])].find(
      (item) => item.baseline === 212,
    );
    expect(relation?.baselineSource).toBe("relation");
    expect(relation?.stopStage).toBe(0);
  });

  it("keeps route cost separate from the existence of a valid C2 question", () => {
    const landscape = evaluateC2RouteLandscape(424, 214);

    expect(landscape).toBeDefined();
    expect(landscape?.feasibleRoutes.length).toBeGreaterThan(0);
    expect(landscape?.recommendedRoutes.length).toBeGreaterThan(0);
    expect(
      new Set([
        ...landscape!.recommendedRoutes,
        ...landscape!.acceptableRoutes,
        ...landscape!.inefficientRoutes,
      ]),
    ).toEqual(new Set(["direct", "split", "scaling"]));
  });
});
