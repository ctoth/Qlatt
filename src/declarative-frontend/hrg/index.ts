/**
 * Provenance-stamped Heterogeneous Relation Graph (HRG) — the working IR of the
 * beautiful-synth frontend. Public surface.
 *
 * See design/beauty-synthesis/11-sota-frontend-architecture.md and
 * 12-fe-architecture-recommendation.md for the architecture.
 */
export { Item } from "./item";
export { Relation, HrgNode } from "./relation";
export { Utterance } from "./utterance";
export { HrgTransaction } from "./transaction";
export { replayJournal } from "./replay";
export {
  TemporalAxis,
  START_ORDER,
  END_ORDER,
  buildInitialBoundaryOrders,
  compareTemporalOrder,
} from "./temporal-axis";
export type { TemporalMark, TemporalOrder } from "./temporal-axis";
export { evalPath, pathNode, pathFeature, isNavOp, step } from "./path";
export type { PathResult } from "./path";
export {
  lowerToFrames,
  frameIndexAt,
} from "./lowering";
export type {
  LayeredF0ModelConfig,
  LowerContext,
  LowerOptions,
  LoweredTrack,
  SegmentTiming,
} from "./lowering";
export {
  decisionChain,
  whyFeature,
  whyParamAt,
  whyRelationMembership,
} from "./provenance-query";
export type {
  FeatureValue,
  FeatureSchema,
  FeatureWrite,
  FeatureWriteInput,
  HrgSchema,
  ItemTypeSchema,
  MarkTimeWrite,
  PhaseCheckpoint,
  RelationSchema,
  RelationKind,
  RelationStamper,
  RelationWrite,
  RelationWriteInput,
  RelationWriteOperation,
  Stamper,
  TemporalAnchorWrite,
  TemporalWriteInput,
  TransactionJournalEntry,
  TransactionMetadata,
  JournalOperation,
} from "./types";
