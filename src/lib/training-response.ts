import { StructuredResponseValue, TrainingResponse } from "./types";

export function singleTrainingResponse(value: string): TrainingResponse {
  return { kind: "single", value };
}

export function structuredTrainingResponse(
  fields: Record<string, StructuredResponseValue>,
): TrainingResponse {
  return { kind: "structured", fields };
}

export function trainingResponseToLegacyAnswer(response: TrainingResponse) {
  return response.kind === "single"
    ? response.value
    : JSON.stringify(response.fields);
}

export function responseScalarValue(response: TrainingResponse) {
  return response.kind === "single" ? response.value : undefined;
}

export function trainingResponseHasValue(
  response: TrainingResponse | undefined,
) {
  if (!response) return false;
  if (response.kind === "single") return response.value.trim().length > 0;
  return Object.keys(response.fields).length > 0;
}
