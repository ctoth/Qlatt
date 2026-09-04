/**
 * Provenance-stamped Heterogeneous Relation Graph (HRG) — the working IR of the
 * beautiful-synth frontend. Public surface.
 *
 * See design/beauty-synthesis/11-sota-frontend-architecture.md and
 * 12-fe-architecture-recommendation.md for the architecture.
 */
export { Item } from "./item";
export type {
  LayeredF0ModelConfig,
  LowerContext,
  LoweredTrack,
  LowerOptions,
  SegmentTiming,
} from "./lowering";
export {
  frameIndexAt,
  lowerToFrames,
  readLowerOptions,
} from "./lowering";
export type { PathHooks, PathResult } from "./path";
export { evalPath, isNavOp, pathFeature, pathNode, step } from "./path";
export {
  decisionChain,
  whyFeature,
  whyParamAt,
  whyRelationMembership,
} from "./provenance-query";
export { HrgNode, Relation } from "./relation";
export { replayJournal } from "./replay";
export type { TemporalMark, TemporalOrder } from "./temporal-axis";
export {
  END_ORDER,
  START_ORDER,
  TemporalAxis,
} from "./temporal-axis";
export type { FieldExplanation, WhyNotRuleResult } from "./tooling";
export {
  explainFeature,
  replayPhaseView,
  whyNotRule,
} from "./tooling";
export { HrgTransaction } from "./transaction";
export type {
  ConditionEvidence,
  FeatureSchema,
  FeatureValue,
  FeatureWrite,
  FeatureWriteInput,
  HrgSchema,
  ItemTypeSchema,
  JournalOperation,
  MarkTimeWrite,
  PhaseCheckpoint,
  RelationKind,
  RelationSchema,
  RelationStamper,
  RelationWrite,
  RelationWriteInput,
  RelationWriteOperation,
  RuleAttempt,
  Stamper,
  TemporalAnchorWrite,
  TemporalWriteInput,
  TransactionJournalEntry,
  TransactionMetadata,
} from "./types";
export { Utterance } from "./utterance";
