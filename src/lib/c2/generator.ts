import { registerCustomCGrader } from "../grader-registry";
import { GenerationContext, productionGenerationContext } from "../generate";
import {
  GeneratedQuestion,
  StructuredResponseValue,
  TrainingResponse,
} from "../types";
import {
  C2_COMPREHENSIVE_GRADING_VERSION,
  C2_GENERATION_VERSION,
  C2_METHOD_CHOICE_DEFAULT_COUNT,
  C2_METHOD_CHOICE_GRADER_ID,
  C2RouteKind,
  encodeC2Preset,
} from "./contract";
import {
  c2FormatNumber,
  c2RelativeError,
  evaluateC2CoreCompression,
} from "./math";
import {
  evaluateC2RouteLandscape,
  type C2RouteLandscape,
} from "./route-evaluator";

const QUOTIENT_BANDS = [
  [0.2, 0.5],
  [0.5, 1],
  [1, 2],
  [2, 5],
] as const;

function randomInteger(context: GenerationContext, min: number, max: number) {
  return Math.floor(context.random() * (max - min + 1)) + min;
}

function randomChoice<T>(context: GenerationContext, values: readonly T[]) {
  return values[randomInteger(context, 0, values.length - 1)];
}

function shuffle<T>(context: GenerationContext, values: readonly T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomInteger(context, 0, index);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function scalarText(value: StructuredResponseValue | undefined) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return undefined;
}

function responseRoute(response: TrainingResponse): C2RouteKind | undefined {
  const value =
    response.kind === "single"
      ? response.value
      : scalarText(response.fields.selectedRoute);
  return value === "direct" || value === "split" || value === "scaling"
    ? value
    : undefined;
}

function profileLevel(landscape: C2RouteLandscape, route: C2RouteKind) {
  return landscape[route].level;
}

export type C2NaturalCore = {
  a: number;
  b: number;
  quotientBand: string;
  landscape: C2RouteLandscape;
};

export function generateC2NaturalCore(
  context: GenerationContext = productionGenerationContext,
): C2NaturalCore {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const [minQ, maxQ] = randomChoice(context, QUOTIENT_BANDS);
    const b = randomInteger(context, 100, 999);
    const minA = Math.max(20, Math.ceil(b * minQ));
    const maxA = Math.max(minA, Math.floor(b * maxQ));
    const a = randomInteger(context, minA, maxA);
    const landscape = evaluateC2RouteLandscape(a, b);
    if (!landscape) continue;

    const levels = [
      landscape.direct.level,
      landscape.split.level,
      landscape.scaling.level,
    ];
    if (levels.every((level) => level === "high")) continue;

    return {
      a,
      b,
      quotientBand: `q_${String(minQ).replace(".", "_")}_${String(maxQ).replace(".", "_")}`,
      landscape,
    };
  }

  throw new Error("Unable to generate a valid natural C2 calculation core.");
}

function frozenLandscapeData(landscape: C2RouteLandscape) {
  return {
    c2DirectLevel: landscape.direct.level,
    c2SplitLevel: landscape.split.level,
    c2ScalingLevel: landscape.scaling.level,
    c2RecommendedRoutes: landscape.recommendedRoutes,
    c2AcceptableRoutes: landscape.acceptableRoutes,
    c2InefficientRoutes: landscape.inefficientRoutes,
  } as const;
}

export function makeC2MethodChoiceQuestion(
  core: C2NaturalCore,
  origin: "targeted" | "number_first",
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion {
  const recommended = core.landscape.recommendedRoutes[0];
  if (!recommended)
    throw new Error("C2 method-choice question needs a recommended route.");
  const allowed = [
    ...core.landscape.recommendedRoutes,
    ...core.landscape.acceptableRoutes,
  ];
  const preset = encodeC2Preset({ mode: "method_choice" });

  return {
    id: context.createId(),
    type: "c_training",
    subtype: "c_task",
    prompt: `${core.a} ÷ ${core.b}`,
    answer: recommended,
    allowedAnswerSet: allowed,
    data: {
      c2TaskKind: "method_choice",
      c2CoreA: core.a,
      c2CoreB: core.b,
      c2GenerationMode: origin,
      c2QuotientBand: core.quotientBand,
      ...frozenLandscapeData(core.landscape),
    },
    difficulty: {
      level: 3,
      tags: [
        "C2",
        "method_choice",
        origin,
        `direct_${profileLevel(core.landscape, "direct")}`,
        `split_${profileLevel(core.landscape, "split")}`,
        `scaling_${profileLevel(core.landscape, "scaling")}`,
      ],
    },
    primaryStructure: "c2_method_choice",
    secondaryTags: [
      `direct_${profileLevel(core.landscape, "direct")}`,
      `split_${profileLevel(core.landscape, "split")}`,
      `scaling_${profileLevel(core.landscape, "scaling")}`,
    ],
    generationRuleVersion: C2_GENERATION_VERSION,
    inputKind: "choice",
    cMeta: {
      project: "C2",
      mode: "method_choice",
      preset,
      grading: {
        kind: "custom",
        graderId: C2_METHOD_CHOICE_GRADER_ID,
        version: C2_METHOD_CHOICE_GRADER_ID,
      },
    },
  };
}

export function generateC2TargetedChoiceQuestion(
  targetRoute: C2RouteKind,
  context: GenerationContext = productionGenerationContext,
) {
  for (let attempt = 0; attempt < 600; attempt += 1) {
    const core = generateC2NaturalCore(context);
    if (!core.landscape.recommendedRoutes.includes(targetRoute)) continue;
    const viableCount =
      core.landscape.recommendedRoutes.length +
      core.landscape.acceptableRoutes.length;
    if (viableCount < 2 && attempt < 420) continue;
    return makeC2MethodChoiceQuestion(core, "targeted", context);
  }
  throw new Error(`Unable to target C2 route ${targetRoute}.`);
}

export function generateC2MethodChoiceSet(
  count = C2_METHOD_CHOICE_DEFAULT_COUNT,
  context: GenerationContext = productionGenerationContext,
) {
  if (count !== C2_METHOD_CHOICE_DEFAULT_COUNT)
    throw new Error("C2 method-choice V1 is locked to 10 questions.");

  const targetedRoutes: C2RouteKind[] = [
    "direct",
    "split",
    "scaling",
    "direct",
    "split",
    "scaling",
  ];
  const targeted = targetedRoutes.map((route) =>
    generateC2TargetedChoiceQuestion(route, context),
  );
  const natural = Array.from({ length: 4 }, () =>
    makeC2MethodChoiceQuestion(
      generateC2NaturalCore(context),
      "number_first",
      context,
    ),
  );
  return shuffle(context, [...targeted, ...natural]);
}

type RawWrappedCore = C2NaturalCore & {
  rawA: number;
  rawB: number;
  coreError: number;
  signedCoreError: number;
  rawQuotient: number;
};

export function wrapC2NaturalCore(
  core: C2NaturalCore,
  context: GenerationContext = productionGenerationContext,
): RawWrappedCore {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const scale = randomChoice(context, [10, 100, 1000] as const);
    const noiseA = randomInteger(context, -45, 45) / 10000;
    const noiseB = randomInteger(context, -45, 45) / 10000;
    const rawA = Math.max(1, Math.round(core.a * scale * (1 + noiseA)));
    const rawB = Math.max(1, Math.round(core.b * scale * (1 + noiseB)));
    const compression = evaluateC2CoreCompression(rawA, rawB, core.a, core.b);
    if (!compression) continue;

    const rawQ = compression.rawQuotient;
    const routeEstimates = [
      core.landscape.direct,
      core.landscape.split,
      core.landscape.scaling,
    ]
      .filter((route) => route.feasible)
      .map((route) => route.finalEstimate);

    if (
      routeEstimates.some(
        (estimate) => c2RelativeError(estimate, rawQ) <= 0.03 + 1e-12,
      )
    )
      return {
        ...core,
        rawA,
        rawB,
        coreError: compression.coreError,
        signedCoreError: compression.signedCoreError,
        rawQuotient: rawQ,
      };
  }

  throw new Error(
    "Unable to wrap C2 natural core into a stable raw expression.",
  );
}

export function generateC2ComprehensiveQuestion(
  context: GenerationContext = productionGenerationContext,
): GeneratedQuestion {
  const wrapped = wrapC2NaturalCore(generateC2NaturalCore(context), context);
  const preset = encodeC2Preset({ mode: "comprehensive" });

  return {
    id: context.createId(),
    type: "c_training",
    subtype: "c_task",
    prompt: `${wrapped.rawA} ÷ ${wrapped.rawB}`,
    answer: c2FormatNumber(wrapped.rawQuotient, 8),
    data: {
      c2TaskKind: "comprehensive",
      c2RawA: wrapped.rawA,
      c2RawB: wrapped.rawB,
      c2CoreA: wrapped.a,
      c2CoreB: wrapped.b,
      c2CoreError: wrapped.coreError,
      c2SignedCoreError: wrapped.signedCoreError,
      c2GenerationMode: "number_first",
      c2QuotientBand: wrapped.quotientBand,
      ...frozenLandscapeData(wrapped.landscape),
    },
    difficulty: {
      level: 3,
      tags: ["C2", "comprehensive", "number_first"],
    },
    primaryStructure: "c2_comprehensive",
    secondaryTags: ["number_first", wrapped.quotientBand],
    generationRuleVersion: C2_GENERATION_VERSION,
    inputKind: "number",
    targetPrecision: "3%",
    cMeta: {
      project: "C2",
      mode: "comprehensive",
      preset,
      grading: {
        kind: "relative_error",
        tolerance: 0.03,
        version: C2_COMPREHENSIVE_GRADING_VERSION,
      },
    },
  };
}

function gradeMethodChoice(
  question: GeneratedQuestion,
  response: TrainingResponse,
) {
  const selected = responseRoute(response);
  const recommended = Array.isArray(question.data.c2RecommendedRoutes)
    ? question.data.c2RecommendedRoutes.map(String)
    : [];
  const acceptable = Array.isArray(question.data.c2AcceptableRoutes)
    ? question.data.c2AcceptableRoutes.map(String)
    : [];

  if (!selected)
    return {
      isCorrect: false,
      accuracyLevel: "wrong" as const,
      gradingMetrics: {
        gradingVersion: C2_METHOD_CHOICE_GRADER_ID,
        invalidResponse: true,
      },
    };

  const routeClass = recommended.includes(selected)
    ? "recommended"
    : acceptable.includes(selected)
      ? "acceptable"
      : "inefficient";
  const isCorrect = routeClass !== "inefficient";

  return {
    isCorrect,
    accuracyLevel: isCorrect ? ("accepted" as const) : ("wrong" as const),
    gradingMetrics: {
      gradingVersion: C2_METHOD_CHOICE_GRADER_ID,
      selectedRoute: selected,
      selectedRouteClass: routeClass,
      recommended: routeClass === "recommended",
    },
  };
}

registerCustomCGrader(C2_METHOD_CHOICE_GRADER_ID, gradeMethodChoice);
