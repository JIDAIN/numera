import {
  gradeTrainingResponse,
  type TrainingGradeResult,
} from "../grader-registry";
import type { GenerationContext } from "../generate";
import type { GeneratedQuestion, TrainingResponse } from "../types";
import { generateC2RuntimeSet } from "./runtime";

export type C2PilotMode = "r" | "nxr_first" | "nxr_second";

export type C2PilotAttempt = {
  questionId: string;
  response: TrainingResponse;
  grade: TrainingGradeResult;
};

export type C2PilotSession = {
  id: string;
  seed: number;
  mode: C2PilotMode;
  questions: GeneratedQuestion[];
  attempts: C2PilotAttempt[];
  currentIndex: number;
  status: "active" | "completed";
};

/** Reproducible numeric generation without consuming random draws for IDs. */
export function c2SeededContext(seed: number): GenerationContext {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new Error("C2 seed must be an unsigned 32-bit integer.");
  let state = seed >>> 0;
  let serial = 0;
  return {
    random: () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    createId: () => `c2-${seed}-${serial++}`,
  };
}

function launchRequest(mode: C2PilotMode) {
  if (mode === "r")
    return {
      preset: { mode: "support" as const, support: "r" as const },
      questionCount: 20,
      // Existing generator categorization is pilot-only, NOT a signed L quota.
      difficultyBand: "L2" as const,
    };
  return {
    preset: {
      mode: "support" as const,
      support: "nxr" as const,
      variant:
        mode === "nxr_first"
          ? ("ordinary" as const)
          : ("second_order" as const),
    },
    questionCount: mode === "nxr_first" ? 20 : 10,
  };
}

export function createC2PilotSession(
  mode: C2PilotMode,
  seed: number,
): C2PilotSession {
  const questions = generateC2RuntimeSet(
    launchRequest(mode),
    c2SeededContext(seed),
  );
  if (!questions) throw new Error("C2 pilot mode is not launchable.");
  return {
    id: `c2-pilot-${seed}-${mode}`,
    seed,
    mode,
    questions,
    attempts: [],
    currentIndex: 0,
    status: "active",
  };
}

function isNumericAnswer(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value.trim())) &&
    !/[eE]/.test(value)
  );
}

/**
 * One atomic submission consumes exactly one frozen question. No answer or
 * process field is inferred; duplicate/late submissions are rejected.
 */
export function submitC2PilotAnswer(
  session: C2PilotSession,
  response: TrainingResponse,
): C2PilotSession {
  if (session.status !== "active") throw new Error("C2 session has finished.");
  const question = session.questions[session.currentIndex];
  if (!question) throw new Error("C2 session has no current question.");

  if (session.mode === "r") {
    if (response.kind !== "single" || !isNumericAnswer(response.value))
      throw new Error("Enter a finite percentage.");
    const user = response.value.trim();
    if (!/^[-+]?\d+(?:\.\d)?$/.test(user))
      throw new Error(
        "r must be entered to at most one decimal place (0.1pp).",
      );
  } else {
    if (
      response.kind !== "structured" ||
      !isNumericAnswer(response.fields.firstCorrection)
    )
      throw new Error("Enter your actual first correction.");
    if (
      session.mode === "nxr_second" &&
      !isNumericAnswer(response.fields.secondCorrection)
    )
      throw new Error("Enter the second correction based on your first.");
  }

  const grade = gradeTrainingResponse(question, response);
  const attempts = [
    ...session.attempts,
    { questionId: question.id, response, grade },
  ];
  const currentIndex = session.currentIndex + 1;
  return {
    ...session,
    attempts,
    currentIndex,
    status: currentIndex === session.questions.length ? "completed" : "active",
  };
}

export function c2PilotScore(session: C2PilotSession) {
  return session.attempts.filter((attempt) => attempt.grade.isCorrect).length;
}
