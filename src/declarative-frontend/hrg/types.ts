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

/**
 * Input to a stamped feature-write. `reason` is mandatory (explainability is not
 * optional). `parents` carries the read-set decision ids the write was derived
 * from (e.g. the accent decision that justified an F0 write); the prior value's
 * write is linked automatically on overwrite.
 */
export interface FeatureWriteInput {
  reason: string;
  citations?: string[];
  /** Read-set: decision ids this write was derived from. */
  parents?: string[];
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
  itemId: string;
  key: string;
  value: FeatureValue;
  /** 0-based version; increments on each overwrite. */
  version: number;
  /** Id of the DecisionRecord created for this write. */
  decisionId: string;
  reason: string;
  citations: string[];
  stage: ProvenanceStage;
  type: string;
  /** Decision-id parents recorded on this write (read-set + prior value). */
  parents: string[];
  timestampMs?: number;
}

/** Records a stamped feature-write into the provenance DAG and the item. */
export type Stamper = (
  item: Item,
  key: string,
  value: FeatureValue,
  input: FeatureWriteInput,
) => FeatureWrite;
