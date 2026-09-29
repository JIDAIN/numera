import { C2RouteKind, C2RouteLevel } from "./contract";
import { evaluateC2Direct, type C2DirectEvaluation } from "./route-direct";
import { evaluateC2Scaling, type C2ScalingEvaluation } from "./route-scaling";
import { evaluateC2Split, type C2SplitEvaluation } from "./route-split";

export type C2RouteProfile =
  C2DirectEvaluation | C2SplitEvaluation | C2ScalingEvaluation;

export type C2RouteLandscape = {
  direct: C2DirectEvaluation;
  split: C2SplitEvaluation;
  scaling: C2ScalingEvaluation;
  feasibleRoutes: C2RouteKind[];
  recommendedRoutes: C2RouteKind[];
  acceptableRoutes: C2RouteKind[];
  inefficientRoutes: C2RouteKind[];
};

function levelRank(level: C2RouteLevel) {
  if (level === "low") return 0;
  if (level === "medium") return 1;
  return 2;
}

function routeCost(profile: C2RouteProfile) {
  if (profile.route === "split") return profile.totalCost;
  if (profile.route === "scaling") return profile.totalCost;
  return (
    levelRank(profile.level) * 2 +
    profile.hardCount * 0.7 +
    profile.normalCount * 0.3 +
    (profile.stopStage === "third" ? 0.7 : 0) +
    (profile.stopStage === "beyond" ? 3 : 0)
  );
}

export function evaluateC2RouteLandscape(
  a: number,
  b: number,
): C2RouteLandscape | undefined {
  const direct = evaluateC2Direct(a, b);
  const split = evaluateC2Split(a, b);
  const scaling = evaluateC2Scaling(a, b);
  if (!direct || !split || !scaling) return undefined;

  const profiles: C2RouteProfile[] = [direct, split, scaling];
  const feasible = profiles.filter((profile) => profile.feasible);
  if (!feasible.length) return undefined;

  const bestCost = Math.min(...feasible.map(routeCost));
  const recommendedRoutes = feasible
    .filter((profile) => routeCost(profile) <= bestCost + 0.25)
    .map((profile) => profile.route);
  const acceptableRoutes = feasible
    .filter(
      (profile) =>
        !recommendedRoutes.includes(profile.route) &&
        routeCost(profile) <= bestCost + 1.25,
    )
    .map((profile) => profile.route);
  const inefficientRoutes = profiles
    .filter(
      (profile) =>
        !recommendedRoutes.includes(profile.route) &&
        !acceptableRoutes.includes(profile.route),
    )
    .map((profile) => profile.route);

  return {
    direct,
    split,
    scaling,
    feasibleRoutes: feasible.map((profile) => profile.route),
    recommendedRoutes,
    acceptableRoutes,
    inefficientRoutes,
  };
}

export function c2RouteChoiceClass(
  landscape: C2RouteLandscape,
  route: C2RouteKind,
): "recommended" | "acceptable" | "inefficient" {
  if (landscape.recommendedRoutes.includes(route)) return "recommended";
  if (landscape.acceptableRoutes.includes(route)) return "acceptable";
  return "inefficient";
}
