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
export { evalPath, pathNode, pathFeature, isNavOp, step } from "./path";
export type { PathResult } from "./path";
export {
  lowerToFrames,
  frameIndexAt,
  DEFAULT_KLATT_PARAMS,
} from "./lowering";
export type { LowerOptions, LoweredTrack, SegmentTiming } from "./lowering";
export { decisionChain, whyFeature, whyParamAt } from "./provenance-query";
export type {
  FeatureValue,
  FeatureWrite,
  FeatureWriteInput,
  RelationKind,
  Stamper,
} from "./types";
