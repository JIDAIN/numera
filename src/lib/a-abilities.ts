import {
  canonicalAAbilityIds,
  CanonicalAAbilityId,
  isCanonicalAAbilityId,
} from "./canonical-a-generate";
import { getCanonicalAAbilityMetadata } from "./a-ability-metadata";
import { MasteryProfile, StructuredInputKind } from "./types";

export { canonicalAAbilityIds, isCanonicalAAbilityId };
export type { CanonicalAAbilityId };

export type CanonicalAAbilityDefinition = {
  id: CanonicalAAbilityId;
  displayName: string;
  group: string;
  masteryProfile: MasteryProfile;
  inputKind: StructuredInputKind;
  homeSymbol: string;
  homeLabel: string;
  homeDetail: string;
};

const definitions = canonicalAAbilityIds.map((id) => {
  const metadata = getCanonicalAAbilityMetadata(id);
  if (!metadata) throw new Error(`Missing canonical A metadata: ${id}`);
  return { id, ...metadata } satisfies CanonicalAAbilityDefinition;
});

export const canonicalAAbilityDefinitions = Object.freeze(definitions);

const definitionMap = new Map<CanonicalAAbilityId, CanonicalAAbilityDefinition>(
  definitions.map((definition) => [definition.id, definition]),
);

export function getCanonicalAAbilityDefinition(
  abilityId: CanonicalAAbilityId,
): CanonicalAAbilityDefinition {
  const definition = definitionMap.get(abilityId);
  if (!definition) throw new Error(`Unknown canonical A ability: ${abilityId}`);
  return definition;
}
