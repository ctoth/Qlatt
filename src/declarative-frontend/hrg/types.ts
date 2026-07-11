/**
 * Provenance-stamped Heterogeneous Relation Graph (HRG) — core types.
 *
 * The HRG is the working intermediate representation of the beautiful-synth
 * frontend: ONE pool of typed items tied together by many named relations
 * (lists and trees). The single adaptation over Festival's HRG is that every
 * feature-write is provenance-stamped, so the relation graph and the
 * provenance DAG are two views of one structure.
 *
 * Citations:
 *  - Taylor, Black & Caley 2001, "Heterogeneous relation graphs as a formalism
 *    for representing linguistic information," Speech Communication — the HRG
 *    item/relation/shared-identity model and feature-function pathnames.
 *  - Hertz 1987 (Delta) — multi-relation relation IR driving a Klatt synthesizer;
 *    existence proof for formant synthesis specifically.
 *  - Festival Utterance structure (Black/Taylor/Caley) — Word/Syllable/Segment
 *    relations + the SylStructure tree backbone.
 *  - design/beauty-synthesis/11-sota-frontend-architecture.md §5 (the verdict:
 *    provenance-stamped HRG) and 12-fe-architecture-recommendation.md §2.
 */
import type { ProvenanceStage } from "../../provenance";
import type { Item } from "./item";
import type { Relation } from "./relation";

export type PrimitiveFeatureValue = string | number | boolean | null;

/** Immutable validated value stored in an Item feature history. */
export type FeatureValue =
  | PrimitiveFeatureValue
  | readonly FeatureValue[]
  | { readonly [key: string]: FeatureValue };

/** Discriminated runtime schema for one Item feature. */
export type FeatureSchema =
  | { kind: "string"; values?: readonly string[] }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "literal"; value: PrimitiveFeatureValue }
  | { kind: "array"; items: FeatureSchema }
  | {
      kind: "object";
      fields: Readonly<Record<string, FeatureSchema>>;
      optional?: readonly string[];
      additional?: FeatureSchema;
    }
  | { kind: "union"; variants: readonly FeatureSchema[] };

export interface ItemTypeSchema {
  features: Readonly<Record<string, FeatureSchema>>;
}

export interface RelationSchema {
  kind: RelationKind;
  itemTypes: readonly string[];
}

/** Complete schema owned and enforced by one Utterance. */
export interface HrgSchema {
  itemTypes: Readonly<Record<string, ItemTypeSchema>>;
  relations: Readonly<Record<string, RelationSchema>>;
}

/** Relations are either flat ordered lists or parent/daughter trees. */
export type RelationKind = "list" | "tree";
export type RelationWriteOperation = "append" | "insert_after" | "add_root" | "add_daughter";

/** One version of a named directed association edge between shared Items. */
export interface AssociationWrite {
  readonly name: string;
  readonly fromItemId: string;
  readonly toItemId: string;
  readonly active: boolean;
  readonly version: number;
  readonly decisionId: string;
  readonly reason: string;
  readonly ruleId?: string;
  readonly tag?: string;
  readonly citations: readonly string[];
  readonly parents: readonly string[];
  readonly stage: ProvenanceStage;
  readonly timestampMs?: number;
}

export interface RelationWriteInput {
  reason: string;
  ruleId?: string;
  tag?: string;
  citations?: readonly string[];
  parents?: readonly string[];
  stage?: ProvenanceStage;
  timestampMs?: number;
}

export type TemporalWriteInput = RelationWriteInput;

export interface TemporalAnchorWrite {
  readonly itemId: string;
  readonly kind: "interval" | "point";
  readonly leftMarkId: string;
  readonly rightMarkId: string;
  readonly ratio?: number;
  readonly version: number;
  readonly decisionId: string;
  readonly reason: string;
  readonly citations: readonly string[];
  readonly parents: readonly string[];
  readonly stage: ProvenanceStage;
  readonly timestampMs?: number;
}

export interface MarkTimeWrite {
  readonly markId: string;
  readonly timeMs: number;
  readonly version: number;
  readonly decisionId: string;
  readonly reason: string;
  readonly citations: readonly string[];
  readonly parents: readonly string[];
  readonly stage: ProvenanceStage;
  readonly timestampMs?: number;
}

export interface TransactionMetadata {
  readonly ruleId: string;
  readonly phase: string;
  readonly tag: string;
  readonly reason: string;
  readonly citations: readonly string[];
  readonly stage?: ProvenanceStage;
  readonly timestampMs?: number;
}

export type JournalOperation =
  | { readonly kind: "create_item"; readonly itemId: string; readonly itemType: string }
  | { readonly kind: "set_feature"; readonly itemId: string; readonly key: string; readonly value: FeatureValue }
  | { readonly kind: "append"; readonly relationName: string; readonly itemId: string }
  | {
      readonly kind: "insert_after";
      readonly relationName: string;
      readonly previousItemId: string;
      readonly itemId: string;
    }
  | { readonly kind: "add_root"; readonly relationName: string; readonly itemId: string }
  | {
      readonly kind: "add_daughter";
      readonly relationName: string;
      readonly parentItemId: string;
      readonly itemId: string;
    }
  | {
      readonly kind: "associate" | "disassociate";
      readonly name: string;
      readonly fromItemId: string;
      readonly toItemId: string;
    }
  | {
      readonly kind: "partition_anchors";
      readonly itemIds: readonly string[];
      readonly leftMarkId: string;
      readonly rightMarkId: string;
    };

export interface TransactionJournalEntry {
  readonly id: string;
  readonly metadata: TransactionMetadata;
  readonly readSet: readonly string[];
  readonly operations: readonly JournalOperation[];
  readonly decisionIds: readonly string[];
}

export interface PhaseCheckpoint {
  readonly phase: string;
  readonly journalLength: number;
  readonly digest: string;
}

export interface RelationWrite {
  readonly relationName: string;
  readonly operation: RelationWriteOperation;
  readonly itemId: string;
  readonly parentItemId?: string;
  readonly previousItemId?: string;
  readonly version: number;
  readonly decisionId: string;
  readonly reason: string;
  readonly ruleId?: string;
  readonly tag?: string;
  readonly citations: readonly string[];
  readonly parents: readonly string[];
  readonly stage: ProvenanceStage;
  readonly timestampMs?: number;
}

/**
 * Input to a stamped feature-write. `reason` is mandatory (explainability is not
 * optional). `parents` carries the read-set decision ids the write was derived
 * from (e.g. the accent decision that justified an F0 write); the prior value's
 * write is linked automatically on overwrite.
 */
export interface FeatureWriteInput {
  reason: string;
  ruleId?: string;
  tag?: string;
  citations?: readonly string[];
  /** Read-set: decision ids this write was derived from. */
  parents?: readonly string[];
  /** Pipeline stage; defaults to "rules". */
  stage?: ProvenanceStage;
  /** Decision type string; defaults to feature_write / feature_overwrite. */
  type?: string;
  timestampMs?: number;
}

/**
 * One append-only versioned write of a single feature. The current value of a
 * feature is the latest write; prior writes are retained so "why did X change?"
 * is answerable. `decisionId` links into the ProvenanceCollector's DAG.
 */
export interface FeatureWrite {
  readonly itemId: string;
  readonly key: string;
  readonly value: FeatureValue;
  /** 0-based version; increments on each overwrite. */
  readonly version: number;
  /** Id of the DecisionRecord created for this write. */
  readonly decisionId: string;
  readonly reason: string;
  readonly ruleId?: string;
  readonly tag?: string;
  readonly citations: readonly string[];
  readonly stage: ProvenanceStage;
  readonly type: string;
  /** Decision-id parents recorded on this write (read-set + prior value). */
  readonly parents: readonly string[];
  readonly timestampMs?: number;
}

/** Records a stamped feature-write into the provenance DAG and the item. */
export type Stamper = (
  item: Item,
  key: string,
  value: FeatureValue,
  input: FeatureWriteInput,
) => FeatureWrite;

export type RelationStamper = (
  relation: Relation,
  operation: RelationWriteOperation,
  item: Item,
  parent: Item | null,
  previous: Item | null,
  input: RelationWriteInput,
) => RelationWrite;
