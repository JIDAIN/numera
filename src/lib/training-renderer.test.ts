import { describe, expect, it } from "vitest";
import { resolveTrainingRenderer } from "./training-renderer";
import { GeneratedQuestion } from "./types";

function c2Question(): GeneratedQuestion {
  return {
    id: "c2-renderer",
    type: "c_training",
    subtype: "c_task",
    prompt: "424 ÷ 214",
    answer: "1.98",
    data: { c2TaskKind: "comprehensive" },
    difficulty: { level: 3, tags: ["C2"] },
    primaryStructure: "c2_comprehensive",
    secondaryTags: [],
    generationRuleVersion: "c2-v1",
    inputKind: "number",
    cMeta: {
      project: "C2",
      mode: "comprehensive",
      preset: "v1;mode=comprehensive",
      grading: {
        kind: "relative_error",
        tolerance: 0.03,
        version: "c2-comprehensive-relative-error-v1",
      },
    },
  };
}

describe("training renderer registry", () => {
  it("routes every C2 question through the dedicated project renderer", () => {
    expect(resolveTrainingRenderer(c2Question())).toBe("c2");
    expect(
      resolveTrainingRenderer({
        ...c2Question(),
        inputKind: "choice",
      }),
    ).toBe("c2");
  });
});
