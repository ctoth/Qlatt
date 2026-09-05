/**
 * HRG Utterance — the container: one item pool, many relations, one provenance
 * collector. Owns the {@link Stamper} that turns every feature-write into a
 * DecisionRecord, so the relation graph and the provenance DAG are two views of
 * one structure.
 *
 * Citations: design/beauty-synthesis/11-sota-frontend-architecture.md §4-5
 * (write-stamping fuses HRG with the provenance DAG); src/provenance.ts schema.
 */

import { createDiagnostics, type Diagnostics } from "../../diagnostics";
import {
  createProvenanceCollector,
  type DecisionRecord,
  type ProvenanceCollector,
  type ProvenanceStage,
} from "../../provenance";
import { Item } from "./item";
import { Relation } from "./relation";
import { TemporalAxis, type TemporalMark } from "./temporal-axis";
import { HrgTransaction } from "./transaction";
import type {
  AssociationWrite,
  FeatureSchema,
  FeatureValue,
  FeatureWrite,
  FeatureWriteInput,
  HrgSchema,
  MarkTimeWrite,
  PhaseCheckpoint,
  RelationStamper,
  RelationWrite,
  RuleAttempt,
  StampedWrite,
  Stamper,
  TemporalAnchorWrite,
  TemporalWriteInput,
  TransactionJournalEntry,
  TransactionMetadata,
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
      if (optional?.some((name) => !Object.hasOwn(fields, name))) {
        throw new Error(
          "E_HRG_SCHEMA_OPTIONAL_FIELD: optional fields must be declared object fields",
        );
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
      if (!Object.hasOwn(itemTypes, itemType)) {
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
  readonly diagnostics: Diagnostics;
  readonly axis = new TemporalAxis();
  private readonly schema: HrgSchema;
  private readonly items = new Map<string, Item>();
  private readonly relations = new Map<string, Relation>();
  private readonly typeCounters = new Map<string, number>();
  private readonly anchorHistoryByItemId = new Map<string, TemporalAnchorWrite[]>();
  private readonly markTimeHistoryById = new Map<string, MarkTimeWrite[]>();
  private readonly associationHistoryByEdge = new Map<string, AssociationWrite[]>();
  private readonly transactionJournal: TransactionJournalEntry[] = [];
  private transactionCounter = 0;
  private readonly phaseCheckpoints: PhaseCheckpoint[] = [];
  private readonly ruleAttemptHistory: RuleAttempt[] = [];

  constructor(schema: HrgSchema, provenance?: ProvenanceCollector, diagnostics?: Diagnostics) {
    this.provenance = provenance ?? createProvenanceCollector();
    this.diagnostics = diagnostics ?? createDiagnostics();
    this.schema = compileHrgSchema(schema);
  }

  /**
   * Shared engine for the five versioned-write recorders (feature, relation,
   * association, temporal-anchor, mark-time): record ONE provenance
   * DecisionRecord for a write, applying the "rules" stage default. The caller
   * assembles the parent decision-id list and, afterwards, the per-type write
   * object — whose field *order* is load-bearing (see {@link graphDigest}).
   */
  private recordVersionedWrite(request: {
    stage?: ProvenanceStage;
    type: string;
    subject: string;
    reason: string;
    citations?: readonly string[];
    timestampMs?: number;
    parents: readonly string[];
  }): DecisionRecord {
    return this.provenance.add({
      stage: request.stage ?? "rules",
      type: request.type,
      subject: request.subject,
      reason: request.reason,
      citations: [...(request.citations ?? [])],
      parents: request.parents.length > 0 ? [...request.parents] : undefined,
      timestampMs: request.timestampMs,
    });
  }

  /**
   * Assemble a de-duplicated parent decision-id list: the input read-set first,
   * then each supplied structural parent (prior write, boundary marks, …) in
   * order. Falsy ids are skipped. Insertion order and Set de-duplication are
   * both load-bearing for the recorded provenance DAG.
   */
  private static dedupeParents(
    base: readonly string[] | undefined,
    ...extra: readonly (string | null | undefined)[]
  ): string[] {
    const parents = new Set(base ?? []);
    for (const id of extra) if (id) parents.add(id);
    return [...parents];
  }

  /**
   * The trailing fields shared, in identical key order, by relation /
   * association / temporal-anchor / mark-time writes:
   * `version, decisionId, reason, [ruleId?, tag?,] citations, parents, stage,
   * timestampMs`. Spread AFTER the per-type head fields to preserve the exact
   * serialized shape. `ruleId`/`tag` are only carried when passed (temporal
   * writes never carry them, matching prior behavior).
   */
  private stampedTail(
    version: number,
    decision: DecisionRecord,
    tags: { ruleId?: string; tag?: string } = {},
  ): StampedWrite & { ruleId?: string; tag?: string } {
    return {
      version,
      decisionId: decision.id,
      reason: decision.reason,
      ...(tags.ruleId ? { ruleId: tags.ruleId } : {}),
      ...(tags.tag ? { tag: tags.tag } : {}),
      citations: Object.freeze([...decision.citations]),
      parents: Object.freeze(decision.parents ? [...decision.parents] : []),
      stage: decision.stage,
      timestampMs: decision.timestampMs,
    };
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
    // "why did X change?" walks back to the value it replaced. Feature writes
    // preserve duplicates (array, not Set), unlike the other recorders.
    const parents = [...(input.parents ?? [])];
    if (prior) parents.push(prior.decisionId);

    const decision = this.recordVersionedWrite({
      stage: input.stage,
      type: input.type ?? (prior ? "feature_overwrite" : "feature_write"),
      subject: `item:${item.id}.${key}`,
      reason: input.reason,
      citations: input.citations,
      timestampMs: input.timestampMs,
      parents,
    });

    const write: FeatureWrite = Object.freeze({
      itemId: item.id,
      key,
      value,
      version,
      decisionId: decision.id,
      reason: input.reason,
      ...(input.ruleId ? { ruleId: input.ruleId } : {}),
      ...(input.tag ? { tag: input.tag } : {}),
      citations: Object.freeze([...decision.citations]),
      stage: decision.stage,
      type: decision.type,
      parents: Object.freeze(decision.parents ? [...decision.parents] : []),
      timestampMs: decision.timestampMs,
    });
    item._push(write);
    return write;
  };

  private readonly stampRelation: RelationStamper = (
    relation,
    operation,
    item,
    parent,
    previous,
    input,
  ): RelationWrite => {
    const parentDecisionId = parent ? relation.latestWrite(parent)?.decisionId : undefined;
    const previousDecisionId = previous ? relation.latestWrite(previous)?.decisionId : undefined;
    const parents = Utterance.dedupeParents(input.parents, parentDecisionId, previousDecisionId);

    const decision = this.recordVersionedWrite({
      stage: input.stage,
      type: `relation_${operation}`,
      subject: `relation:${relation.name}:${item.id}`,
      reason: input.reason,
      citations: input.citations,
      timestampMs: input.timestampMs,
      parents,
    });
    const write: RelationWrite = Object.freeze({
      relationName: relation.name,
      operation,
      itemId: item.id,
      ...(parent ? { parentItemId: parent.id } : {}),
      ...(previous ? { previousItemId: previous.id } : {}),
      ...this.stampedTail(relation.writes().length, decision, {
        ruleId: input.ruleId,
        tag: input.tag,
      }),
    });
    relation._pushWrite(write);
    return write;
  };

  private associationKey(from: Item, name: string, to: Item): string {
    return JSON.stringify([from.id, name, to.id]);
  }

  _writeAssociation(
    from: Item,
    name: string,
    to: Item,
    active: boolean,
    input: FeatureWriteInput,
  ): AssociationWrite {
    this._assertOwnedItem(from);
    this._assertOwnedItem(to);
    if (!name) throw new Error("E_HRG_ASSOCIATION_NAME: association name is required");
    const key = this.associationKey(from, name, to);
    const history = this.associationHistoryByEdge.get(key) ?? [];
    const prior = history[history.length - 1];
    const parents = Utterance.dedupeParents(input.parents, prior?.decisionId);
    const decision = this.recordVersionedWrite({
      stage: input.stage,
      type: active ? "relation_associate" : "relation_disassociate",
      subject: `association:${name}:${from.id}:${to.id}`,
      reason: input.reason,
      citations: input.citations,
      timestampMs: input.timestampMs,
      parents,
    });
    const write: AssociationWrite = Object.freeze({
      name,
      fromItemId: from.id,
      toItemId: to.id,
      active,
      ...this.stampedTail(history.length, decision, {
        ruleId: input.ruleId,
        tag: input.tag,
      }),
    });
    history.push(write);
    this.associationHistoryByEdge.set(key, history);
    return write;
  }

  associationWrites(from: Item, name: string, to: Item): readonly AssociationWrite[] {
    this._assertOwnedItem(from);
    this._assertOwnedItem(to);
    return Object.freeze([
      ...(this.associationHistoryByEdge.get(this.associationKey(from, name, to)) ?? []),
    ]);
  }

  latestAssociationWrites(from: Item, name: string): readonly AssociationWrite[] {
    this._assertOwnedItem(from);
    const writes: AssociationWrite[] = [];
    for (const history of this.associationHistoryByEdge.values()) {
      const latest = history[history.length - 1];
      if (latest?.fromItemId === from.id && latest.name === name) writes.push(latest);
    }
    return Object.freeze(writes);
  }

  associatedItems(from: Item, name: string): Item[] {
    const targets: Item[] = [];
    for (const latest of this.latestAssociationWrites(from, name)) {
      if (!latest.active) continue;
      const target = this.getItem(latest.toItemId);
      if (target && target.get("active") !== false) targets.push(target);
    }
    return targets;
  }

  /** Create a fresh item with a stable, type-prefixed id. */
  createItem(type: string, explicitId?: string): Item {
    let id = explicitId;
    if (id == null) {
      const next = this.typeCounters.get(type) ?? 0;
      this.typeCounters.set(type, next + 1);
      id = `${type}_${next}`;
    }
    const item = this._createDetachedItem(type, id);
    this.items.set(id, item);
    return item;
  }

  _createDetachedItem(type: string, id: string): Item {
    const itemSchema = this.schema.itemTypes[type];
    if (!itemSchema) {
      throw new Error(`E_HRG_ITEM_TYPE_UNDECLARED: item type '${type}' is not declared`);
    }
    if (!id || this.items.has(id)) {
      throw new Error(`E_HRG_DUPLICATE_ITEM: item id '${id}' already exists`);
    }
    return new Item(id, type, this.stamp, itemSchema);
  }

  _commitItemCreation(item: Item, input: FeatureWriteInput): string {
    if (this.items.has(item.id)) {
      throw new Error(`E_HRG_DUPLICATE_ITEM: item id '${item.id}' already exists`);
    }
    const decision = this.provenance.add({
      stage: input.stage ?? "rules",
      type: "item_create",
      subject: `item:${item.id}`,
      reason: input.reason,
      citations: [...(input.citations ?? [])],
      parents: input.parents ? [...input.parents] : undefined,
      timestampMs: input.timestampMs,
    });
    item._setCreationDecision(decision.id);
    this.items.set(item.id, item);
    return decision.id;
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
    const created = new Relation(
      name,
      relationSchema.kind,
      new Set(relationSchema.itemTypes),
      this.stampRelation,
    );
    this.relations.set(name, created);
    return created;
  }

  getRelation(name: string): Relation | undefined {
    return this.relations.get(name);
  }

  relationNames(): string[] {
    return [...this.relations.keys()];
  }

  schemaDefinition(): HrgSchema {
    return this.schema;
  }

  beginTransaction(metadata: TransactionMetadata): HrgTransaction {
    return new HrgTransaction(this, metadata);
  }

  journal(): readonly TransactionJournalEntry[] {
    return Object.freeze([...this.transactionJournal]);
  }

  graphDigest(): string {
    const items = this.allItems()
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((item) => ({
        id: item.id,
        type: item.type,
        creationDecisionId: item.creationDecisionId(),
        features: item
          .featureKeys()
          .sort()
          .map((key) => ({
            key,
            writes: item.writes(key),
          })),
      }));
    const relations = Object.keys(this.schema.relations)
      .sort()
      .map((name) => {
        const relation = this.relation(name);
        return { name, kind: relation.kind, writes: relation.writes() };
      });
    const marks = [...this.axis.marks.values()]
      .sort((left, right) => this.axis.compare(left.id, right.id))
      .map((mark) => ({
        id: mark.id,
        order: mark.order,
        time: mark.time,
        creationDecisionId: mark.creationDecisionId,
      }));
    const anchors = [...this.anchorHistoryByItemId.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([itemId, writes]) => ({ itemId, writes }));
    const markTimes = [...this.markTimeHistoryById.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([markId, writes]) => ({ markId, writes }));
    const associations = [...this.associationHistoryByEdge.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, writes]) => ({ key, writes }));
    const canonical = JSON.stringify({ items, relations, associations, marks, anchors, markTimes });
    let hash = 2166136261;
    for (let index = 0; index < canonical.length; index += 1) {
      hash ^= canonical.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `hrg-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  checkpoint(phase: string, boundary: "before" | "after" = "after"): PhaseCheckpoint {
    if (!phase) throw new Error("E_HRG_CHECKPOINT_PHASE: phase is required");
    const checkpoint = Object.freeze({
      phase,
      boundary,
      journalLength: this.transactionJournal.length,
      digest: this.graphDigest(),
    });
    this.phaseCheckpoints.push(checkpoint);
    return checkpoint;
  }

  checkpoints(): readonly PhaseCheckpoint[] {
    return Object.freeze([...this.phaseCheckpoints]);
  }

  _recordRuleAttempt(attempt: RuleAttempt): void {
    this.ruleAttemptHistory.push(Object.freeze(attempt));
  }

  ruleAttempts(): readonly RuleAttempt[] {
    return Object.freeze([...this.ruleAttemptHistory]);
  }

  _assertOwnedItem(item: Item): void {
    if (this.items.get(item.id) !== item) {
      throw new Error(`E_HRG_ITEM_OWNER: item '${item.id}' is not owned by this Utterance`);
    }
  }

  _nextTransactionId(): string {
    const id = `tx_${this.transactionCounter.toString().padStart(6, "0")}`;
    this.transactionCounter += 1;
    return id;
  }

  _recordTransaction(entry: TransactionJournalEntry): void {
    this.transactionJournal.push(entry);
  }

  _recordTransactionRejection(metadata: TransactionMetadata, error: unknown): void {
    this.diagnostics.error(
      "Rejected HRG transaction before commit",
      {
        ruleId: metadata.ruleId,
        phase: metadata.phase,
        message: error instanceof Error ? error.message : String(error),
      },
      "HRG_TRANSACTION_REJECTED",
    );
  }

  createMarkBetween(
    leftMarkId: string,
    rightMarkId: string,
    input: TemporalWriteInput,
  ): TemporalMark {
    if (this.axis.compare(leftMarkId, rightMarkId) >= 0) {
      throw new Error("E_HRG_TEMPORAL_ORDER: left mark must precede right mark");
    }
    const decision = this.provenance.add({
      stage: input.stage ?? "rules",
      type: "temporal_mark_insert",
      subject: `axis:${leftMarkId}:${rightMarkId}`,
      reason: input.reason,
      citations: [...(input.citations ?? [])],
      parents: input.parents ? [...input.parents] : undefined,
      timestampMs: input.timestampMs,
    });
    return this.axis.createBetween(leftMarkId, rightMarkId, decision.id);
  }

  _partitionAnchors(
    items: readonly Item[],
    leftMarkId: string,
    rightMarkId: string,
    input: TemporalWriteInput,
  ): readonly string[] {
    if (items.length === 0) throw new Error("E_HRG_TEMPORAL_PARTITION_EMPTY");
    for (const item of items) this._assertOwnedItem(item);
    if (this.axis.compare(leftMarkId, rightMarkId) >= 0) {
      throw new Error("E_HRG_TEMPORAL_ORDER: partition left mark must precede right mark");
    }
    const ranges = this.axis.splitMarkRange(leftMarkId, rightMarkId, items.length);
    const decisionIds: string[] = [];
    const boundaryIds = new Set(ranges.flatMap((range) => [range.leftId, range.rightId]));
    for (const markId of boundaryIds) {
      const mark = this.axis.get(markId);
      if (!mark || mark.creationDecisionId || mark === this.axis.start || mark === this.axis.end)
        continue;
      const decision = this.provenance.add({
        stage: input.stage ?? "rules",
        type: "temporal_mark_insert",
        subject: `axis:${markId}`,
        reason: input.reason,
        citations: [...(input.citations ?? [])],
        parents: input.parents ? [...input.parents] : undefined,
        timestampMs: input.timestampMs,
      });
      mark.creationDecisionId = decision.id;
      decisionIds.push(decision.id);
    }
    for (let index = 0; index < items.length; index += 1) {
      const range = ranges[index];
      if (!range) throw new Error("E_HRG_TEMPORAL_PARTITION_RANGE");
      decisionIds.push(
        this.anchorInterval(items[index], range.leftId, range.rightId, input).decisionId,
      );
    }
    return Object.freeze(decisionIds);
  }

  private stampAnchor(
    item: Item,
    kind: "interval" | "point",
    leftMarkId: string,
    rightMarkId: string,
    ratio: number | undefined,
    offsetMs: number | undefined,
    input: TemporalWriteInput,
  ): TemporalAnchorWrite {
    const left = this.axis.get(leftMarkId);
    const right = this.axis.get(rightMarkId);
    if (!left || !right) throw new Error("E_HRG_TEMPORAL_MARK_UNKNOWN");
    if (this.axis.compare(leftMarkId, rightMarkId) > 0) {
      throw new Error("E_HRG_TEMPORAL_ORDER: anchor left mark must not follow right mark");
    }
    if (kind === "point" && (ratio == null || !Number.isFinite(ratio) || ratio < 0 || ratio > 1)) {
      throw new Error("E_HRG_TEMPORAL_RATIO: point ratio must be finite and within [0, 1]");
    }
    if (offsetMs != null && !Number.isFinite(offsetMs)) {
      throw new Error("E_HRG_TEMPORAL_OFFSET: point offset must be finite");
    }
    const history = this.anchorHistoryByItemId.get(item.id) ?? [];
    const prior = history[history.length - 1];
    const parents = Utterance.dedupeParents(
      input.parents,
      left.creationDecisionId,
      right.creationDecisionId,
      prior?.decisionId,
    );
    const decision = this.recordVersionedWrite({
      stage: input.stage,
      type: prior ? "temporal_anchor_overwrite" : "temporal_anchor_write",
      subject: `item:${item.id}.temporal_anchor`,
      reason: input.reason,
      citations: input.citations,
      timestampMs: input.timestampMs,
      parents,
    });
    const write: TemporalAnchorWrite = Object.freeze({
      itemId: item.id,
      kind,
      leftMarkId,
      rightMarkId,
      ...(ratio != null ? { ratio } : {}),
      ...(offsetMs != null ? { offsetMs } : {}),
      ...this.stampedTail(history.length, decision),
    });
    history.push(write);
    this.anchorHistoryByItemId.set(item.id, history);
    return write;
  }

  anchorInterval(
    item: Item,
    leftMarkId: string,
    rightMarkId: string,
    input: TemporalWriteInput,
  ): TemporalAnchorWrite {
    return this.stampAnchor(item, "interval", leftMarkId, rightMarkId, undefined, undefined, input);
  }

  anchorPoint(
    item: Item,
    leftMarkId: string,
    rightMarkId: string,
    ratio: number,
    input: TemporalWriteInput,
    offsetMs?: number,
  ): TemporalAnchorWrite {
    return this.stampAnchor(item, "point", leftMarkId, rightMarkId, ratio, offsetMs, input);
  }

  temporalAnchor(item: Item): TemporalAnchorWrite | undefined {
    const history = this.anchorHistoryByItemId.get(item.id);
    return history?.[history.length - 1];
  }

  intervalAnchor(item: Item): TemporalAnchorWrite | undefined {
    const anchor = this.temporalAnchor(item);
    return anchor?.kind === "interval" ? anchor : undefined;
  }

  resolveMarkTime(markId: string, timeMs: number, input: TemporalWriteInput): MarkTimeWrite {
    const mark = this.axis.get(markId);
    if (!mark) throw new Error(`E_HRG_TEMPORAL_MARK_UNKNOWN: '${markId}'`);
    if (!Number.isFinite(timeMs)) throw new Error("E_HRG_TEMPORAL_TIME: time must be finite");
    const history = this.markTimeHistoryById.get(markId) ?? [];
    const prior = history[history.length - 1];
    const parents = Utterance.dedupeParents(
      input.parents,
      mark.creationDecisionId,
      prior?.decisionId,
    );
    const decision = this.recordVersionedWrite({
      stage: input.stage,
      type: prior ? "temporal_time_overwrite" : "temporal_time_write",
      subject: `axis:${markId}.time_ms`,
      reason: input.reason,
      citations: input.citations,
      timestampMs: input.timestampMs,
      parents,
    });
    const write: MarkTimeWrite = Object.freeze({
      markId,
      timeMs,
      ...this.stampedTail(history.length, decision),
    });
    history.push(write);
    this.markTimeHistoryById.set(markId, history);
    this.axis.setMarkTime(markId, timeMs);
    return write;
  }

  resolveAnchorTime(item: Item): number | null {
    const anchor = this.temporalAnchor(item);
    if (!anchor) return null;
    const left = this.axis.getMarkTime(anchor.leftMarkId);
    const right = this.axis.getMarkTime(anchor.rightMarkId);
    if (left == null || right == null) return null;
    return anchor.kind === "point"
      ? left + (right - left) * (anchor.ratio ?? 0) + (anchor.offsetMs ?? 0)
      : left;
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
