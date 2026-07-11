/**
 * HRG Utterance — the container: one item pool, many relations, one provenance
 * collector. Owns the {@link Stamper} that turns every feature-write into a
 * DecisionRecord, so the relation graph and the provenance DAG are two views of
 * one structure.
 *
 * Citations: design/beauty-synthesis/11-sota-frontend-architecture.md §4-5
 * (write-stamping fuses HRG with the provenance DAG); src/provenance.ts schema.
 */
import { createProvenanceCollector, type ProvenanceCollector } from "../../provenance";
import { Item } from "./item";
import { Relation } from "./relation";
import type {
  FeatureValue,
  FeatureWrite,
  FeatureWriteInput,
  FeatureSchema,
  HrgSchema,
  Stamper,
} from "./types";

function cloneFeatureSchema(schema: FeatureSchema): FeatureSchema {
  switch (schema.kind) {
    case "string":
      return Object.freeze({
        kind: "string",
        ...(schema.values ? { values: Object.freeze([...schema.values]) } : {}),
      });
    case "number":
    case "boolean":
    case "null":
      return Object.freeze({ kind: schema.kind });
    case "literal":
      return Object.freeze({ kind: "literal", value: schema.value });
    case "array":
      return Object.freeze({ kind: "array", items: cloneFeatureSchema(schema.items) });
    case "object": {
      const fields: Record<string, FeatureSchema> = {};
      for (const [name, fieldSchema] of Object.entries(schema.fields)) {
        fields[name] = cloneFeatureSchema(fieldSchema);
      }
      const optional = schema.optional ? Object.freeze([...schema.optional]) : undefined;
      if (optional?.some((name) => !Object.prototype.hasOwnProperty.call(fields, name))) {
        throw new Error("E_HRG_SCHEMA_OPTIONAL_FIELD: optional fields must be declared object fields");
      }
      return Object.freeze({
        kind: "object",
        fields: Object.freeze(fields),
        ...(optional ? { optional } : {}),
        ...(schema.additional ? { additional: cloneFeatureSchema(schema.additional) } : {}),
      });
    }
    case "union":
      if (schema.variants.length === 0) {
        throw new Error("E_HRG_SCHEMA_UNION_EMPTY: a feature union requires at least one variant");
      }
      return Object.freeze({
        kind: "union",
        variants: Object.freeze(schema.variants.map(cloneFeatureSchema)),
      });
  }
}

function compileHrgSchema(input: HrgSchema): HrgSchema {
  const itemTypes: Record<string, { features: Readonly<Record<string, FeatureSchema>> }> = {};
  for (const [itemType, itemSchema] of Object.entries(input.itemTypes)) {
    const features: Record<string, FeatureSchema> = {};
    for (const [feature, featureSchema] of Object.entries(itemSchema.features)) {
      features[feature] = cloneFeatureSchema(featureSchema);
    }
    itemTypes[itemType] = Object.freeze({ features: Object.freeze(features) });
  }

  const relations: Record<string, { kind: "list" | "tree"; itemTypes: readonly string[] }> = {};
  for (const [relationName, relationSchema] of Object.entries(input.relations)) {
    if (relationSchema.itemTypes.length === 0) {
      throw new Error(
        `E_HRG_SCHEMA_RELATION_EMPTY: relation '${relationName}' requires an allowed item type`,
      );
    }
    const allowed = Object.freeze([...new Set(relationSchema.itemTypes)]);
    for (const itemType of allowed) {
      if (!Object.prototype.hasOwnProperty.call(itemTypes, itemType)) {
        throw new Error(
          `E_HRG_SCHEMA_RELATION_ITEM_TYPE: relation '${relationName}' references undeclared item type '${itemType}'`,
        );
      }
    }
    relations[relationName] = Object.freeze({ kind: relationSchema.kind, itemTypes: allowed });
  }

  return Object.freeze({
    itemTypes: Object.freeze(itemTypes),
    relations: Object.freeze(relations),
  });
}

export class Utterance {
  readonly provenance: ProvenanceCollector;
  private readonly schema: HrgSchema;
  private readonly items = new Map<string, Item>();
  private readonly relations = new Map<string, Relation>();
  private readonly typeCounters = new Map<string, number>();

  constructor(
    schema: HrgSchema,
    provenance?: ProvenanceCollector,
  ) {
    this.provenance = provenance ?? createProvenanceCollector();
    this.schema = compileHrgSchema(schema);
  }

  /** The stamper recording every feature-write into the provenance DAG. */
  private readonly stamp: Stamper = (
    item: Item,
    key: string,
    value: FeatureValue,
    input: FeatureWriteInput,
  ): FeatureWrite => {
    const prior = item.latestWrite(key);
    const version = prior ? prior.version + 1 : 0;

    // Read-set parents + (on overwrite) the prior value's decision, so
    // "why did X change?" walks back to the value it replaced.
    const parents = [...(input.parents ?? [])];
    if (prior) parents.push(prior.decisionId);

    const decision = this.provenance.add({
      stage: input.stage ?? "rules",
      type: input.type ?? (prior ? "feature_overwrite" : "feature_write"),
      subject: `item:${item.id}.${key}`,
      reason: input.reason,
      citations: input.citations ?? [],
      parents: parents.length > 0 ? parents : undefined,
      timestampMs: input.timestampMs,
    });

    const write: FeatureWrite = {
      itemId: item.id,
      key,
      value,
      version,
      decisionId: decision.id,
      reason: input.reason,
      citations: [...decision.citations],
      stage: decision.stage,
      type: decision.type,
      parents: decision.parents ? [...decision.parents] : [],
      timestampMs: decision.timestampMs,
    };
    item._push(write);
    return write;
  };

  /** Create a fresh item with a stable, type-prefixed id. */
  createItem(type: string, explicitId?: string): Item {
    const itemSchema = this.schema.itemTypes[type];
    if (!itemSchema) {
      throw new Error(`E_HRG_ITEM_TYPE_UNDECLARED: item type '${type}' is not declared`);
    }
    let id = explicitId;
    if (id == null) {
      const next = this.typeCounters.get(type) ?? 0;
      this.typeCounters.set(type, next + 1);
      id = `${type}_${next}`;
    }
    if (this.items.has(id)) {
      throw new Error(`E_HRG_DUPLICATE_ITEM: item id '${id}' already exists`);
    }
    const item = new Item(id, type, this.stamp, itemSchema);
    this.items.set(id, item);
    return item;
  }

  getItem(id: string): Item | undefined {
    return this.items.get(id);
  }

  allItems(): Item[] {
    return [...this.items.values()];
  }

  /** Get or create a relation declared by this Utterance's schema. */
  relation(name: string): Relation {
    const relationSchema = this.schema.relations[name];
    if (!relationSchema) {
      throw new Error(`E_HRG_RELATION_UNDECLARED: relation '${name}' is not declared`);
    }
    const existing = this.relations.get(name);
    if (existing) return existing;
    const created = new Relation(name, relationSchema.kind, new Set(relationSchema.itemTypes));
    this.relations.set(name, created);
    return created;
  }

  getRelation(name: string): Relation | undefined {
    return this.relations.get(name);
  }

  relationNames(): string[] {
    return [...this.relations.keys()];
  }

  // --- Canonical backbone relations (created lazily on first access) ---

  /** Flat list of words. */
  get words(): Relation {
    return this.relation("Word");
  }
  /** Flat list of syllables. */
  get syllables(): Relation {
    return this.relation("Syllable");
  }
  /** Flat list of segments (phones). */
  get segments(): Relation {
    return this.relation("Segment");
  }
  /** Tree: word -> syllables -> segments. The backbone linking the flat lists. */
  get sylStructure(): Relation {
    return this.relation("SylStructure");
  }
}
