export * from "./contract";
export * from "./math";
export * from "./route-direct";
export * from "./route-split";
export * from "./route-scaling";
export * from "./route-evaluator";
// Explicit live generators only: retired choice factories are NOT public through
// the canonical C2 barrel. Historical grader registration remains via generator.
export {
  generateC2SupportRQuestion,
  generateC2SupportNxrQuestion,
  generateC2SupportNxrSet,
} from "./support";
export {
  generateC2NaturalCore,
  wrapC2NaturalCore,
  generateC2ComprehensiveQuestion,
} from "./generator";
export type { C2NaturalCore } from "./generator";
