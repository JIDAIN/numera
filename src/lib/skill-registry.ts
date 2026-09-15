import {
  canonicalAAbilityMetadata,
  CanonicalAAbilityMetadata,
  getCanonicalAAbilityMetadata,
} from "./a-ability-metadata";
import { SkillId } from "./types";

export type SkillDefinition = CanonicalAAbilityMetadata & { id: SkillId };

/**
 * Runtime registry metadata is keyed only by the eight canonical A abilities.
 * The canonical ID list itself is owned by canonical-a-generate.ts; this module
 * contains metadata, not a second independent ability-ID source.
 */
const definitions = Object.entries(canonicalAAbilityMetadata).map(
  ([id, metadata]) => ({ id: id as SkillId, ...metadata }),
);

export const skillDefinitions = Object.freeze(definitions);
export const skillRegistry = Object.freeze(
  Object.fromEntries(
    definitions.map((definition) => [definition.id, definition]),
  ),
) as Readonly<Record<string, SkillDefinition>>;

export function isRegisteredSkillId(value: unknown): value is SkillId {
  return (
    typeof value === "string" && Boolean(getCanonicalAAbilityMetadata(value))
  );
}

export function getSkillDefinition(skillId: SkillId): SkillDefinition {
  const metadata = getCanonicalAAbilityMetadata(skillId);
  if (!metadata) throw new Error(`Unknown canonical A ability: ${skillId}`);
  return { id: skillId, ...metadata };
}
