import { describe, expect, it } from "vitest";
import { GenerationContext, generateSet } from "./generate";
import {
  createCTrainingSession,
  createTrainingSession,
  recreateTrainingSession,
} from "./session";
import { generateC1Set } from "./c1-training";
import { encodeC4Preset, generateC4Set } from "./c4-training";
import { generateC3Set } from "./c3-training";

function varyingContext(prefix: string): GenerationContext {
  let id = 0;
  let state = 0.371;
  return {
    random: () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    },
    createId: () => `${prefix}-question-${id++}`,
  };
}

function deterministicContext(prefix: string): GenerationContext {
  let id = 0;
  return {
    random: () => 0.42,
    createId: () => `${prefix}-question-${id++}`,
  };
}

describe("createTrainingSession", () => {
  it("keeps newly generated classic training outside the A ability model", () => {
    const session = createTrainingSession({
      userId: "fish",
      questionType: "two_digit_add_subtract",
      subtype: "standard",
      questionCount: 10,
      now: 10_000,
      createSessionId: () => "classic-session",
      generationContext: deterministicContext("classic"),
    });

    expect(session).toMatchObject({
      id: "classic-session",
      userId: "fish",
      questionType: "two_digit_add_subtract",
      subtype: "standard",
      questionCount: 10,
      status: "active",
      schemaVersion: 2,
      trainingMode: "legacy",
    });
    expect(session.questions).toHaveLength(10);
    expect(
      session.questions.every((question) => question.skillId === undefined),
    ).toBe(true);
    expect(session.primarySkillId).toBeUndefined();
  });

  it("creates a canonical A drill from the ability and difficulty encoded in subtype", () => {
    const session = createTrainingSession({
      userId: "fish",
      questionType: "skill_drill",
      subtype: "skill:A-MUL-02:L3",
      questionCount: 10,
      generationContext: deterministicContext("a-drill"),
    });

    expect(session).toMatchObject({
      questionType: "skill_drill",
      subtype: "skill:A-MUL-02:L3",
      schemaVersion: 2,
      trainingMode: "skill",
      primarySkillId: "A-MUL-02",
      difficultyBand: "L3",
    });
    expect(session.questions).toHaveLength(10);
    expect(
      session.questions.every(
        (question) =>
          question.skillId === "A-MUL-02" &&
          question.difficultyBand === "L3" &&
          question.inputKind === "choice",
      ),
    ).toBe(true);
  });

  it("creates a frozen schema-v3 C session without inventing an A ability", () => {
    const questions = Array.from({ length: 10 }, (_, index) => ({
      id: `c-question-${index}`,
      type: "c_training" as const,
      subtype: "c_task" as const,
      prompt: "1/2 ? 2/3",
      answer: "<",
      data: {},
      difficulty: { level: 2 as const, tags: [] },
      primaryStructure: "ratio_compare",
      secondaryTags: [],
      generationRuleVersion: "c3-generator-v1",
      difficultyBand: "L1" as const,
      structureTags: ["s2_strong"],
      cMeta: {
        project: "C3" as const,
        mode: "specialty" as const,
        preset: "fraction_compare",
        grading: {
          kind: "exact" as const,
          version: "c3-grading-v1",
          normalize: "comparison" as const,
        },
      },
    }));

    const session = createCTrainingSession({
      userId: "fish",
      project: "C3",
      mode: "specialty",
      preset: "fraction_compare",
      difficultyBand: "L1",
      questionCount: 10,
      questions,
      createSessionId: () => "c3-session",
    });

    expect(session).toMatchObject({
      id: "c3-session",
      questionType: "c_training",
      subtype: "c_task",
      schemaVersion: 3,
      trainingMode: "c_task",
      difficultyBand: "L1",
      cProject: "C3",
      cTrainingMode: "specialty",
      cPreset: "fraction_compare",
      gradingRuleVersion: "c3-grading-v1",
      primarySkillId: undefined,
    });
  });

  it("recreates normal C1 training as a fresh structured-response set", () => {
    const questions = generateC1Set("L2", 20, varyingContext("c1"));
    const source = createCTrainingSession({
      userId: "fish",
      project: "C1",
      mode: "specialty",
      difficultyBand: "L2",
      questionCount: 20,
      questions,
      createSessionId: () => "c1-source",
    });

    const replacement = recreateTrainingSession(source);

    expect(replacement).toMatchObject({
      questionType: "c_training",
      subtype: "c_task",
      questionCount: 20,
      cProject: "C1",
      cTrainingMode: "specialty",
      difficultyBand: "L2",
      status: "active",
      currentIndex: 0,
      currentResponse: undefined,
    });
    expect(replacement.questions).toHaveLength(20);
    expect(replacement.questions[0].id).not.toBe(source.questions[0].id);
    expect(
      replacement.questions.every(
        (question) =>
          question.cMeta?.project === "C1" &&
          question.inputKind === "structured",
      ),
    ).toBe(true);
  });

  it("recreates normal C3 training as a fresh quota-valid set", () => {
    const questions = generateC3Set("L3", 20, varyingContext("c3"));
    const source = createCTrainingSession({
      userId: "fish",
      project: "C3",
      mode: "specialty",
      difficultyBand: "L3",
      questionCount: 20,
      questions,
      createSessionId: () => "c3-source",
    });

    const replacement = recreateTrainingSession(source);

    expect(replacement).toMatchObject({
      questionType: "c_training",
      subtype: "c_task",
      questionCount: 20,
      cProject: "C3",
      cTrainingMode: "specialty",
      difficultyBand: "L3",
      status: "active",
      currentIndex: 0,
    });
    expect(replacement.questions).toHaveLength(20);
    expect(replacement.questions[0].id).not.toBe(source.questions[0].id);
    expect(
      replacement.questions.every(
        (question) =>
          question.cMeta?.project === "C3" &&
          ["S2", "S3"].includes(String(question.data.c3StructureLevel)),
      ),
    ).toBe(true);
    expect(
      replacement.questions.filter((question) => question.answer === ">"),
    ).toHaveLength(10);
    expect(
      replacement.questions.filter((question) => question.answer === "<"),
    ).toHaveLength(10);
  });

  it("recreates normal C4 training as a fresh set from the frozen launch contract", () => {
    const config = {
      difficultyBand: "L2" as const,
      anchor: 286 as const,
      operation: "divide" as const,
    };
    const questions = generateC4Set(config, 20, deterministicContext("c4"));
    const source = createCTrainingSession({
      userId: "fish",
      project: "C4",
      mode: "specialty",
      preset: encodeC4Preset(config),
      difficultyBand: "L2",
      questionCount: 20,
      questions,
      createSessionId: () => "c4-source",
    });

    const replacement = recreateTrainingSession(source);

    expect(replacement).toMatchObject({
      questionType: "c_training",
      subtype: "c_task",
      questionCount: 20,
      cProject: "C4",
      cTrainingMode: "specialty",
      difficultyBand: "L2",
      status: "active",
      currentIndex: 0,
    });
    expect(replacement.questions).toHaveLength(20);
    expect(replacement.questions[0].id).not.toBe(source.questions[0].id);
    expect(
      replacement.questions.every(
        (question) =>
          question.data.c4BaseAnchor === 286 &&
          question.data.c4Operation === "divide",
      ),
    ).toBe(true);
  });

  it("keeps unfinished C task ids reserved but not executable", () => {
    expect(() =>
      createTrainingSession({
        userId: "fish",
        questionType: "skill_drill",
        subtype: "skill:C-DIV-01:L2",
        questionCount: 10,
        generationContext: deterministicContext("reserved-c"),
      }),
    ).toThrow("canonical A ability");
  });

  it("creates an independent replacement instead of retaining old progress", () => {
    const original = createTrainingSession({
      userId: "cat",
      questionType: "skill_drill",
      subtype: "skill:A-ADD-01:L2",
      questionCount: 20,
      now: 1_000,
      createSessionId: () => "old-session",
      generationContext: deterministicContext("old"),
    });
    original.currentIndex = 4;
    original.currentAnswer = "123";
    original.currentRestartCount = 3;
    original.accumulatedMs = 8_000;

    const replacement = createTrainingSession({
      userId: original.userId,
      questionType: original.questionType,
      subtype: original.subtype,
      questionCount: original.questionCount,
      now: 20_000,
      createSessionId: () => "new-session",
      generationContext: deterministicContext("new"),
    });

    expect(replacement.id).toBe("new-session");
    expect(replacement.questions[0].id).not.toBe(original.questions[0].id);
    expect(replacement).toMatchObject({
      currentIndex: 0,
      records: [],
      currentAnswer: "",
      currentRestartCount: 0,
      accumulatedMs: 0,
      runningSince: 20_000,
    });
  });

  it("preserves a frozen legacy 30-question PK set byte-for-byte", () => {
    const frozen = generateSet(
      "two_digit_add_subtract",
      "standard",
      30,
      deterministicContext("legacy"),
    );
    const pk = createTrainingSession({
      userId: "cat",
      questionType: "two_digit_add_subtract",
      subtype: "standard",
      questionCount: 30,
      questions: frozen,
      pkChallengeId: "legacy-challenge",
      createSessionId: () => "legacy-pk",
    });

    expect(pk.questions).toEqual(frozen);
    expect(pk.questions[0].skillId).toBeUndefined();
    expect(pk.questionCount).toBe(30);
    expect(pk.trainingSource).toBe("pk");
    expect(pk.trainingMode).toBe("legacy");
  });

  it("preserves a frozen canonical A question set for PK response sessions", () => {
    const source = createTrainingSession({
      userId: "fish",
      questionType: "skill_drill",
      subtype: "skill:A-FRA-01:L2",
      questionCount: 10,
      generationContext: deterministicContext("source-a"),
    });
    const pk = createTrainingSession({
      userId: "cat",
      questionType: source.questionType,
      subtype: source.subtype,
      questionCount: source.questionCount,
      questions: source.questions,
      pkChallengeId: "a-challenge",
      createSessionId: () => "a-pk",
    });

    expect(pk.questions).toEqual(source.questions);
    expect(pk.questions[0].skillId).toBe("A-FRA-01");
    expect(pk.questions[0].data.choiceValues).toEqual(
      source.questions[0].data.choiceValues,
    );
    expect(pk).toMatchObject({
      trainingSource: "pk",
      pkChallengeId: "a-challenge",
      primarySkillId: "A-FRA-01",
      difficultyBand: "L2",
    });
  });
});
