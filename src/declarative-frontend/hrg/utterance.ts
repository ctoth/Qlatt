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
import type { FeatureValue, FeatureWrite, FeatureWriteInput, RelationKind, Stamper } from "./types";

export class Utterance {
  readonly provenance: ProvenanceCollector;
  private readonly items = new Map<string, Item>();
  private readonly relations = new Map<string, Relation>();
  private readonly typeCounters = new Map<string, number>();

  constructor(provenance?: ProvenanceCollector) {
    this.provenance = provenance ?? createProvenanceCollector();
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
    let id = explicitId;
    if (id == null) {
      const next = this.typeCounters.get(type) ?? 0;
      this.typeCounters.set(type, next + 1);
      id = `${type}_${next}`;
    }
    if (this.items.has(id)) {
      throw new Error(`E_HRG_DUPLICATE_ITEM: item id '${id}' already exists`);
    }
    const item = new Item(id, type, this.stamp);
    this.items.set(id, item);
    return item;
  }

  getItem(id: string): Item | undefined {
    return this.items.get(id);
  }

  allItems(): Item[] {
    return [...this.items.values()];
  }

  /** Get or create a relation. The kind must be consistent across calls. */
  relation(name: string, kind: RelationKind): Relation {
    const existing = this.relations.get(name);
    if (existing) {
      if (existing.kind !== kind) {
        throw new Error(
          `E_HRG_RELATION_KIND: relation '${name}' already exists as '${existing.kind}', requested '${kind}'`,
        );
      }
      return existing;
    }
    const created = new Relation(name, kind);
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
    return this.relation("Word", "list");
  }
  /** Flat list of syllables. */
  get syllables(): Relation {
    return this.relation("Syllable", "list");
  }
  /** Flat list of segments (phones). */
  get segments(): Relation {
    return this.relation("Segment", "list");
  }
  /** Tree: word -> syllables -> segments. The backbone linking the flat lists. */
  get sylStructure(): Relation {
    return this.relation("SylStructure", "tree");
  }
}
