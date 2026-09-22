import { describe, expect, it } from "vitest";
import {
  canonicalAAbilityIds as publicCanonicalAAbilityIds,
  canonicalAAbilityDefinitions,
} from "./a-abilities";
import { canonicalAAbilityIds } from "./canonical-a-generate";
import {
  getSkillDefinition,
  isRegisteredSkillId,
  skillDefinitions,
} from "./skill-registry";

describe("canonical A registry", () => {
  it("uses one canonical ID source across public definitions and runtime metadata", () => {
    expect(publicCanonicalAAbilityIds).toBe(canonicalAAbilityIds);
    expect(skillDefinitions.map((ability) => ability.id)).toEqual(
      canonicalAAbilityIds,
    );
    expect(canonicalAAbilityDefinitions.map((ability) => ability.id)).toEqual(
      canonicalAAbilityIds,
    );
    expect(skillDefinitions).toHaveLength(10);
  });

  it("resolves canonical metadata and rejects retired leaf IDs", () => {
    expect(getSkillDefinition("A-MUL-02")).toMatchObject({
      displayName: "逆向乘法口诀",
      masteryProfile: "R",
    });
    expect(isRegisteredSkillId("A-MUL-02")).toBe(true);
    expect(isRegisteredSkillId("A-MUL-04")).toBe(true);
    expect(isRegisteredSkillId("A-MUL-05")).toBe(true);
    expect(isRegisteredSkillId("B-R-03")).toBe(false);
    expect(isRegisteredSkillId("C-DIVSCALE-04")).toBe(false);
  });
});
