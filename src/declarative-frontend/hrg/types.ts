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

/**
 * Fields shared by every provenance-stamped, versioned HRG write (feature,
 * relation, association, temporal-anchor, mark-time). Each concrete write
 * interface extends this base.
 *
 * NOTE: the field *order* in the concrete write object literals (utterance.ts)
 * is load-bearing — {@link HrgSchema} digests FNV-hash `JSON.stringify` of the
 * whole graph, so key insertion order must be preserved exactly when these
 * writes are constructed.
 */
export interface StampedWrite {
  readonly version: number;
  readonly decisionId: string;
  readonly reason: string;
  readonly citations: readonly string[];
  readonly parents: readonly string[];
  readonly stage: ProvenanceStage;
  readonly timestampMs?: number;
}

/** One version of a named directed association edge between shared Items. */
export interface AssociationWrite extends StampedWrite {
  readonly name: string;
  readonly fromItemId: string;
  readonly toItemId: string;
  readonly active: boolean;
  readonly ruleId?: string;
  readonly tag?: string;
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

export interface TemporalAnchorWrite extends StampedWrite {
  readonly itemId: string;
  readonly kind: "interval" | "point";
  readonly leftMarkId: string;
  readonly rightMarkId: string;
  readonly ratio?: number;
  readonly offsetMs?: number;
}

export interface MarkTimeWrite extends StampedWrite {
  readonly markId: string;
  readonly timeMs: number;
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
  | {
      readonly kind: "set_feature";
      readonly itemId: string;
      readonly key: string;
      readonly value: FeatureValue;
      readonly tag?: string;
    }
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
    }
  | {
      readonly kind: "anchor_point";
      readonly itemId: string;
      readonly leftMarkId: string;
      readonly rightMarkId: string;
      readonly ratio: number;
      readonly offsetMs?: number;
    }
  | {
      readonly kind: "resolve_mark_time";
      readonly markId: string;
      readonly timeMs: number;
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
  readonly boundary: "before" | "after";
  readonly journalLength: number;
  readonly digest: string;
}

export type ConditionEvidence =
  | {
      readonly kind: "expression";
      readonly expression: string;
      readonly value: unknown;
      readonly matched: boolean;
    }
  | {
      readonly kind: "predicate";
      readonly predicate: string;
      readonly matched: boolean;
      readonly evidence: ConditionEvidence;
    }
  | {
      readonly kind: "all" | "any";
      readonly matched: boolean;
      readonly evaluated: readonly ConditionEvidence[];
      readonly total: number;
    }
  | {
      readonly kind: "not";
      readonly matched: boolean;
      readonly evidence: ConditionEvidence;
    }
  | {
      readonly kind: "constant";
      readonly value: unknown;
      readonly matched: boolean;
    };

type RuleAttemptBase = {
  readonly phase: string;
  readonly rule: string;
  readonly itemIds: readonly string[];
  readonly journalLength: number;
};

export type RuleAttempt =
  | (RuleAttemptBase & {
      readonly status: "fired";
      readonly transactionId: string;
    })
  | (RuleAttemptBase & {
      readonly status: "select_where_failed";
      readonly evidence: ConditionEvidence;
    })
  | (RuleAttemptBase & {
      readonly status: "pattern_step_failed";
      readonly pattern: string;
      readonly stepIndex: number;
      readonly capture: string | null;
      readonly evidence: ConditionEvidence;
    })
  | (RuleAttemptBase & {
      readonly status: "constraint_failed";
      readonly source: "pattern" | "rule";
      readonly evidence: ConditionEvidence;
    })
  | (RuleAttemptBase & {
      readonly status: "missing_target";
      readonly target: string;
    })
  | (RuleAttemptBase & {
      readonly status: "transaction_rejected";
      readonly message: string;
    });

export interface RelationWrite extends StampedWrite {
  readonly relationName: string;
  readonly operation: RelationWriteOperation;
  readonly itemId: string;
  readonly parentItemId?: string;
  readonly previousItemId?: string;
  readonly ruleId?: string;
  readonly tag?: string;
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
export interface FeatureWrite extends StampedWrite {
  readonly itemId: string;
  readonly key: string;
  readonly value: FeatureValue;
  readonly ruleId?: string;
  readonly tag?: string;
  readonly type: string;
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
