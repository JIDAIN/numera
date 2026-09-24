import {
  GenerationContext,
  productionGenerationContext,
} from "./generate";
import {
  DifficultyBand,
  GeneratedQuestion,
  QuestionRecord,
  TrainingSession,
} from "./types";

export const C4_GENERATION_VERSION = "c4-v1";
export const C4_GRADING_VERSION = "c4-relative-error-v1";
export const C4_TOLERANCE = 0.02;
export const C4_QUESTION_COUNT = 20;

export const C4_L1_ANCHORS = [5, 25, 125, 333, 167, 143, 111] as const;
export const C4_L2_ANCHORS = [
  667, 286, 9, 11, 222, 444, 555, 666, 777, 888,
] as const;
export const C4_ALL_ANCHORS = [...C4_L1_ANCHORS, ...C4_L2_ANCHORS] as const;
export const C4_SCALE_EXPONENTS = [-2, -1, 1, 2] as const;

export type C4Operation = "multiply" | "divide";
export type C4OperationMode = C4Operation | "mixed";
export type C4AnchorSelection = number | "all";

export type C4TrainingConfig = {
  difficultyBand: DifficultyBand;
  anchor: C4AnchorSelection;
  operation: C4OperationMode;
};

export type C4BreakdownRow = {
  key: string;
  label: string;
  questionCount: number;
  correctCount: number;
  accuracy: number;
  averageMs: number;
};

function randomInteger(
  context: GenerationContext,
  min: number,
  max: number,
) {
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

function roundStable(value: number) {
  return Number(value.toPrecision(12));
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(roundStable(value));
}

function anchorsForBand(difficultyBand: DifficultyBand) {
  if (difficultyBand === "L1") return [...C4_L1_ANCHORS];
  if (difficultyBand === "L2") return [...C4_L2_ANCHORS];
  return [...C4_ALL_ANCHORS];
}

export function isValidC4Anchor(
  difficultyBand: DifficultyBand,
  anchor: C4AnchorSelection,
) {
  if (difficultyBand === "L3") return anchor === "all";
  if (anchor === "all") return true;
  return anchorsForBand(difficultyBand).includes(anchor);
}

export function normalizeC4Config(
  config: C4TrainingConfig,
): C4TrainingConfig {
  const normalized: C4TrainingConfig =
    config.difficultyBand === "L3"
      ? { ...config, anchor: "all" }
      : config;
  if (!isValidC4Anchor(normalized.difficultyBand, normalized.anchor)) {
    throw new Error("C4 anchor does not belong to the selected difficulty");
  }
  return normalized;
}

export function encodeC4Preset(config: C4TrainingConfig) {
  const normalized = normalizeC4Config(config);
  return `anchor=${normalized.anchor};operation=${normalized.operation}`;
}

export function decodeC4Preset(
  difficultyBand: DifficultyBand,
  preset: string | undefined,
): C4TrainingConfig | undefined {
  if (!preset) return undefined;
  const fields = Object.fromEntries(
    preset
      .split(";")
      .map((part) => part.split("="))
      .filter((entry) => entry.length === 2),
  );
  const operation = fields.operation;
  if (
    operation !== "multiply" &&
    operation !== "divide" &&
    operation !== "mixed"
  )
    return undefined;
  const anchor =
    fields.anchor === "all" ? "all" : Number(fields.anchor);
  if (anchor !== "all" && !Number.isFinite(anchor)) return undefined;
  try {
    return normalizeC4Config({
      difficultyBand,
      anchor,
      operation,
    });
  } catch {
    return undefined;
  }
}

function coverageAnchors(
  config: C4TrainingConfig,
  count: number,
  context: GenerationContext,
) {
  const normalized = normalizeC4Config(config);
  if (normalized.difficultyBand !== "L3" && normalized.anchor !== "all") {
    return Array.from({ length: count }, () => normalized.anchor as number);
  }

  const pool = anchorsForBand(normalized.difficultyBand);
  const result = [...pool];
  while (result.length < count) result.push(randomChoice(context, pool));
  return shuffle(context, result.slice(0, count));
}

function operationSequence(
  operation: C4OperationMode,
  count: number,
  context: GenerationContext,
): C4Operation[] {
  if (operation !== "mixed")
    return Array.from({ length: count }, () => operation);
  const multiplyCount = Math.floor(count / 2);
  return shuffle(context, [
    ...Array.from({ length: multiplyCount }, () => "multiply" as const),
    ...Array.from(
      { length: count - multiplyCount },
      () => "divide" as const,
    ),
  ]);
}

function exponentSequence(
  difficultyBand: DifficultyBand,
  count: number,
  context: GenerationContext,
) {
  if (difficultyBand !== "L3")
    return Array.from({ length: count }, () => 0);
  const values = Array.from({ length: count }, (_, index) => {
    return C4_SCALE_EXPONENTS[index % C4_SCALE_EXPONENTS.length];
  });
  return shuffle(context, values);
}

function operandForIndex(
  index: number,
  context: GenerationContext,
  used: Set<string>,
  displayedAnchor: number,
  operation: C4Operation,
) {
  const digits = 3 + (index % 3);
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const candidate = randomInteger(context, min, max);
    const key = `${operation}:${displayedAnchor}:${candidate}`;
    if (!used.has(key)) {
      used.add(key);
      return candidate;
    }
  }
  const fallback = Math.min(max, min + index * 37 + Math.round(displayedAnchor));
  used.add(`${operation}:${displayedAnchor}:${fallback}`);
  return fallback;
}

function questionFor(
  config: C4TrainingConfig,
  anchor: number,
  scaleExponent: number,
  operation: C4Operation,
  operand: number,
  context: GenerationContext,
): GeneratedQuestion {
  const displayedAnchor = roundStable(anchor * 10 ** scaleExponent);
  const result =
    operation === "multiply"
      ? operand * displayedAnchor
      : operand / displayedAnchor;
  const prompt =
    operation === "multiply"
      ? `${operand} × ${formatNumber(displayedAnchor)} = ?`
      : `${operand} ÷ ${formatNumber(displayedAnchor)} = ?`;
  const repeatAnchor = C4_L2_ANCHORS.includes(
    anchor as (typeof C4_L2_ANCHORS)[number],
  ) && [222, 444, 555, 666, 777, 888].includes(anchor);

  return {
    id: context.createId(),
    type: "c_training",
    subtype: "c_task",
    prompt,
    answer: formatNumber(roundStable(result)),
    data: {
      c4BaseAnchor: anchor,
      c4DisplayedAnchor: displayedAnchor,
      c4Operation: operation,
      c4ScaleExponent: scaleExponent,
      c4OtherOperand: operand,
      c4AnchorGroup: repeatAnchor ? "repeat_digits" : "single_anchor",
    },
    difficulty: {
      level:
        config.difficultyBand === "L1"
          ? 1
          : config.difficultyBand === "L2"
            ? 3
            : 5,
      tags: [
        config.difficultyBand,
        operation,
        repeatAnchor ? "repeat_digits" : "single_anchor",
        ...(scaleExponent ? ["magnitude_migration"] : []),
      ],
    },
    primaryStructure:
      config.difficultyBand === "L3"
        ? "magnitude_migration"
        : repeatAnchor
          ? "repeat_digits_anchor"
          : "special_anchor",
    secondaryTags: [
      `anchor_${anchor}`,
      operation,
      ...(scaleExponent ? [`scale_${scaleExponent}`] : []),
    ],
    generationRuleVersion: C4_GENERATION_VERSION,
    difficultyBand: config.difficultyBand,
    structureTags: [
      `anchor_${anchor}`,
      operation,
      ...(scaleExponent ? ["magnitude_migration"] : []),
    ],
    generatorParams: {
      anchor,
      displayedAnchor,
      operation,
      scaleExponent,
      operandDigits: String(operand).length,
    },
    inputKind: "number",
    cMeta: {
      project: "C4",
      mode: "specialty",
      preset: encodeC4Preset(config),
      grading: {
        kind: "relative_error",
        tolerance: C4_TOLERANCE,
        version: C4_GRADING_VERSION,
      },
    },
  };
}

export function generateC4Set(
  config: C4TrainingConfig,
  questionCount = C4_QUESTION_COUNT,
  context: GenerationContext = productionGenerationContext,
) {
  if (questionCount !== C4_QUESTION_COUNT) {
    throw new RangeError("C4 formal training blocks require 20 questions");
  }
  const normalized = normalizeC4Config(config);
  const anchors = coverageAnchors(normalized, questionCount, context);
  const operations = operationSequence(
    normalized.operation,
    questionCount,
    context,
  );
  const exponents = exponentSequence(
    normalized.difficultyBand,
    questionCount,
    context,
  );
  const used = new Set<string>();

  return Array.from({ length: questionCount }, (_, index) => {
    const anchor = anchors[index];
    const operation = operations[index];
    const scaleExponent = exponents[index];
    const displayedAnchor = roundStable(anchor * 10 ** scaleExponent);
    const operand = operandForIndex(
      index,
      context,
      used,
      displayedAnchor,
      operation,
    );
    return questionFor(
      normalized,
      anchor,
      scaleExponent,
      operation,
      operand,
      context,
    );
  });
}

function groupRows(
  records: QuestionRecord[],
  keyFor: (record: QuestionRecord) => string | undefined,
  labelFor: (record: QuestionRecord) => string,
): C4BreakdownRow[] {
  const groups = new Map<string, { label: string; records: QuestionRecord[] }>();
  records.forEach((record) => {
    const key = keyFor(record);
    if (!key) return;
    const current = groups.get(key) ?? {
      label: labelFor(record),
      records: [],
    };
    current.records.push(record);
    groups.set(key, current);
  });
  return [...groups.entries()]
    .map(([key, group]) => {
      const correctCount = group.records.filter((record) => record.isCorrect)
        .length;
      const totalMs = group.records.reduce(
        (sum, record) => sum + record.timeUsedMs,
        0,
      );
      return {
        key,
        label: group.label,
        questionCount: group.records.length,
        correctCount,
        accuracy: group.records.length
          ? correctCount / group.records.length
          : 0,
        averageMs: group.records.length
          ? totalMs / group.records.length
          : 0,
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label, "zh-CN"));
}

export function summarizeC4Session(
  session: Pick<TrainingSession, "cProject" | "records">,
) {
  if (session.cProject !== "C4") return undefined;
  return {
    byAnchor: groupRows(
      session.records,
      (record) => {
        const value = record.question.data.c4BaseAnchor;
        return typeof value === "number" ? String(value) : undefined;
      },
      (record) => String(record.question.data.c4BaseAnchor),
    ),
    byOperation: groupRows(
      session.records,
      (record) => {
        const value = record.question.data.c4Operation;
        return value === "multiply" || value === "divide" ? value : undefined;
      },
      (record) =>
        record.question.data.c4Operation === "multiply" ? "乘法" : "除法",
    ),
    byScale: groupRows(
      session.records,
      (record) => {
        const value = record.question.data.c4ScaleExponent;
        return typeof value === "number" && value !== 0
          ? String(value)
          : undefined;
      },
      (record) => {
        const value = record.question.data.c4ScaleExponent;
        return typeof value === "number"
          ? `10^${value}`
          : "数量级";
      },
    ),
  };
}
