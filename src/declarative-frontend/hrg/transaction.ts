import type { Item } from "./item";
import type { HrgNode } from "./relation";
import type { Utterance } from "./utterance";
import type {
  FeatureValue,
  JournalOperation,
  TransactionJournalEntry,
  TransactionMetadata,
} from "./types";

type StagedOperation =
  | { kind: "create_item"; item: Item }
  | { kind: "set_feature"; item: Item; key: string; value: unknown; tag?: string }
  | { kind: "append"; relationName: string; item: Item }
  | { kind: "insert_after"; relationName: string; previous: Item; item: Item }
  | { kind: "add_root"; relationName: string; item: Item }
  | { kind: "add_daughter"; relationName: string; parent: Item; item: Item }
  | { kind: "associate"; name: string; from: Item; to: Item }
  | { kind: "disassociate"; name: string; from: Item; to: Item }
  | {
      kind: "partition_anchors";
      items: readonly Item[];
      leftMarkId: string;
      rightMarkId: string;
    }
  | {
      kind: "anchor_point";
      item: Item;
      leftMarkId: string;
      rightMarkId: string;
      ratio: number;
      offsetMs?: number;
    }
  | { kind: "resolve_mark_time"; markId: string; timeMs: number };

type PreparedOperation =
  | { journal: JournalOperation; commit: () => readonly string[] };

function freezeMetadata(metadata: TransactionMetadata): TransactionMetadata {
  if (!metadata.ruleId || !metadata.phase || !metadata.tag || !metadata.reason) {
    throw new Error("E_HRG_TRANSACTION_METADATA: ruleId, phase, tag, and reason are required");
  }
  if (metadata.citations.length === 0) {
    throw new Error("E_HRG_TRANSACTION_CITATIONS: rule transactions require citations");
  }
  return Object.freeze({
    ...metadata,
    citations: Object.freeze([...metadata.citations]),
  });
}

export class HrgTransaction {
  private readonly operations: StagedOperation[] = [];
  private readonly reads = new Set<string>();
  private readonly stagedItems = new Set<Item>();
  private closed = false;

  readonly metadata: TransactionMetadata;

  constructor(
    private readonly utterance: Utterance,
    metadata: TransactionMetadata,
  ) {
    this.metadata = freezeMetadata(metadata);
  }

  private assertOpen(): void {
    if (this.closed) throw new Error("E_HRG_TRANSACTION_CLOSED");
  }

  private assertAvailableItem(item: Item): void {
    if (!this.stagedItems.has(item)) this.utterance._assertOwnedItem(item);
  }

  createItem(type: string, explicitId: string): Item {
    this.assertOpen();
    if ([...this.stagedItems].some((item) => item.id === explicitId)) {
      throw new Error(`E_HRG_DUPLICATE_ITEM: item id '${explicitId}' is staged twice`);
    }
    const item = this.utterance._createDetachedItem(type, explicitId);
    this.stagedItems.add(item);
    this.operations.push({ kind: "create_item", item });
    return item;
  }

  read(item: Item, key: string): FeatureValue | undefined {
    this.assertOpen();
    this.assertAvailableItem(item);
    const write = item.latestWrite(key);
    if (write) this.reads.add(write.decisionId);
    return item.get(key);
  }

  view(item: Item): Readonly<Record<string, unknown>> {
    this.assertAvailableItem(item);
    return new Proxy<Record<string, unknown>>(
      {},
      {
        get: (_target, property) => {
          if (property === "id") return item.id;
          if (property === "itemType") return item.type;
          return typeof property === "string" ? this.read(item, property) : undefined;
        },
        has: (_target, property) => {
          if (property === "id" || property === "itemType") return true;
          if (typeof property !== "string") return false;
          if (item.has(property)) this.read(item, property);
          return item.has(property);
        },
        ownKeys: () => ["id", "itemType", ...item.featureKeys()],
        getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
      },
    );
  }

  set(item: Item, key: string, value: unknown, tag?: string): this {
    this.assertOpen();
    this.operations.push({ kind: "set_feature", item, key, value, ...(tag ? { tag } : {}) });
    return this;
  }

  dependOn(decisionId: string): this {
    this.assertOpen();
    if (decisionId) this.reads.add(decisionId);
    return this;
  }

  append(relationName: string, item: Item): this {
    this.assertOpen();
    this.operations.push({ kind: "append", relationName, item });
    return this;
  }

  insertAfter(relationName: string, previous: Item, item: Item): this {
    this.assertOpen();
    this.operations.push({ kind: "insert_after", relationName, previous, item });
    return this;
  }

  addRoot(relationName: string, item: Item): this {
    this.assertOpen();
    this.operations.push({ kind: "add_root", relationName, item });
    return this;
  }

  addDaughter(relationName: string, parent: Item, item: Item): this {
    this.assertOpen();
    this.operations.push({ kind: "add_daughter", relationName, parent, item });
    return this;
  }

  associate(name: string, from: Item, to: Item): this {
    this.assertOpen();
    this.operations.push({ kind: "associate", name, from, to });
    return this;
  }

  disassociate(name: string, from: Item, to: Item): this {
    this.assertOpen();
    this.operations.push({ kind: "disassociate", name, from, to });
    return this;
  }

  partitionAnchors(
    items: readonly Item[],
    leftMarkId: string,
    rightMarkId: string,
  ): this {
    this.assertOpen();
    this.operations.push({
      kind: "partition_anchors",
      items: Object.freeze([...items]),
      leftMarkId,
      rightMarkId,
    });
    return this;
  }

  anchorPoint(
    item: Item,
    leftMarkId: string,
    rightMarkId: string,
    ratio: number,
    offsetMs?: number,
  ): this {
    this.assertOpen();
    this.operations.push({ kind: "anchor_point", item, leftMarkId, rightMarkId, ratio, offsetMs });
    return this;
  }

  resolveMarkTime(markId: string, timeMs: number): this {
    this.assertOpen();
    this.operations.push({ kind: "resolve_mark_time", markId, timeMs });
    return this;
  }

  private writeInput(tag: string = this.metadata.tag): {
    reason: string;
    ruleId: string;
    tag: string;
    citations: readonly string[];
    parents: string[];
    stage: TransactionMetadata["stage"];
    timestampMs: number | undefined;
  } {
    return {
      reason: this.metadata.reason,
      ruleId: this.metadata.ruleId,
      tag,
      citations: this.metadata.citations,
      parents: [...this.reads],
      stage: this.metadata.stage,
      timestampMs: this.metadata.timestampMs,
    };
  }

  private prepare(): PreparedOperation[] {
    const prepared: PreparedOperation[] = [];
    const plannedMembership = new Set<string>();
    const input = this.writeInput();

    for (const operation of this.operations) {
      if (operation.kind === "associate" || operation.kind === "disassociate") {
        this.assertAvailableItem(operation.from);
        this.assertAvailableItem(operation.to);
        if (!operation.name) throw new Error("E_HRG_ASSOCIATION_NAME: association name is required");
        const active = operation.kind === "associate";
        prepared.push({
          journal: Object.freeze({
            kind: operation.kind,
            name: operation.name,
            fromItemId: operation.from.id,
            toItemId: operation.to.id,
          }),
          commit: () => [this.utterance
            ._writeAssociation(operation.from, operation.name, operation.to, active, input)
            .decisionId],
        });
        continue;
      }
      if (operation.kind === "partition_anchors") {
        if (operation.items.length === 0) throw new Error("E_HRG_TEMPORAL_PARTITION_EMPTY");
        for (const item of operation.items) this.assertAvailableItem(item);
        if (!this.utterance.axis.get(operation.leftMarkId) || !this.utterance.axis.get(operation.rightMarkId)) {
          throw new Error("E_HRG_TEMPORAL_MARK_UNKNOWN");
        }
        if (this.utterance.axis.compare(operation.leftMarkId, operation.rightMarkId) >= 0) {
          throw new Error(
            `E_HRG_TEMPORAL_ORDER: rule '${this.metadata.ruleId}' cannot partition ${operation.leftMarkId}..${operation.rightMarkId}`,
          );
        }
        prepared.push({
          journal: Object.freeze({
            kind: "partition_anchors",
            itemIds: Object.freeze(operation.items.map((item) => item.id)),
            leftMarkId: operation.leftMarkId,
            rightMarkId: operation.rightMarkId,
          }),
          commit: () => this.utterance._partitionAnchors(
            operation.items,
            operation.leftMarkId,
            operation.rightMarkId,
            input,
          ),
        });
        continue;
      }
      if (operation.kind === "anchor_point") {
        this.assertAvailableItem(operation.item);
        if (!this.utterance.axis.get(operation.leftMarkId) || !this.utterance.axis.get(operation.rightMarkId)) {
          throw new Error("E_HRG_TEMPORAL_MARK_UNKNOWN");
        }
        if (this.utterance.axis.compare(operation.leftMarkId, operation.rightMarkId) > 0) {
          throw new Error("E_HRG_TEMPORAL_ORDER");
        }
        if (!Number.isFinite(operation.ratio) || operation.ratio < 0 || operation.ratio > 1) {
          throw new Error("E_HRG_TEMPORAL_RATIO");
        }
        if (operation.offsetMs != null && !Number.isFinite(operation.offsetMs)) {
          throw new Error("E_HRG_TEMPORAL_OFFSET");
        }
        prepared.push({
          journal: Object.freeze({
            kind: "anchor_point",
            itemId: operation.item.id,
            leftMarkId: operation.leftMarkId,
            rightMarkId: operation.rightMarkId,
            ratio: operation.ratio,
            ...(operation.offsetMs != null ? { offsetMs: operation.offsetMs } : {}),
          }),
          commit: () => [this.utterance.anchorPoint(
            operation.item,
            operation.leftMarkId,
            operation.rightMarkId,
            operation.ratio,
            input,
            operation.offsetMs,
          ).decisionId],
        });
        continue;
      }
      if (operation.kind === "resolve_mark_time") {
        if (!this.utterance.axis.get(operation.markId)) {
          throw new Error(`E_HRG_TEMPORAL_MARK_UNKNOWN: '${operation.markId}'`);
        }
        if (!Number.isFinite(operation.timeMs)) throw new Error("E_HRG_TEMPORAL_TIME");
        prepared.push({
          journal: Object.freeze({
            kind: "resolve_mark_time",
            markId: operation.markId,
            timeMs: operation.timeMs,
          }),
          commit: () => [this.utterance.resolveMarkTime(
            operation.markId,
            operation.timeMs,
            input,
          ).decisionId],
        });
        continue;
      }
      this.assertAvailableItem(operation.item);
      if (operation.kind === "create_item") {
        const journal = Object.freeze({
          kind: "create_item" as const,
          itemId: operation.item.id,
          itemType: operation.item.type,
        });
        prepared.push({
          journal,
          commit: () => [this.utterance._commitItemCreation(operation.item, input)],
        });
        continue;
      }
      if (operation.kind === "set_feature") {
        let value: FeatureValue;
        try {
          value = operation.item._validateFeature(operation.key, operation.value);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(
            `${message} (rule '${this.metadata.ruleId}', item '${operation.item.id}')`,
            { cause: error },
          );
        }
        const journal = Object.freeze({
          kind: "set_feature" as const,
          itemId: operation.item.id,
          key: operation.key,
          value,
          ...(operation.tag ? { tag: operation.tag } : {}),
        });
        prepared.push({
          journal,
          commit: () => [operation.item.set(
            operation.key,
            value,
            operation.tag ? this.writeInput(operation.tag) : input,
          ).decisionId],
        });
        continue;
      }

      const relation = this.utterance.relation(operation.relationName);
      const membershipKey = `${operation.relationName}\u0000${operation.item.id}`;
      if (plannedMembership.has(membershipKey)) {
        throw new Error(
          `E_HRG_DUPLICATE_NODE: item '${operation.item.id}' is staged twice for relation '${operation.relationName}'`,
        );
      }
      relation._validateAttach(operation.item);
      plannedMembership.add(membershipKey);

      if (operation.kind === "append") {
        if (relation.kind !== "list") throw new Error("E_HRG_RELATION_KIND: append requires a list relation");
        prepared.push({
          journal: Object.freeze({ kind: "append", relationName: operation.relationName, itemId: operation.item.id }),
          commit: () => [relation.append(operation.item, input).write.decisionId],
        });
        continue;
      }
      if (operation.kind === "insert_after") {
        if (relation.kind !== "list") {
          throw new Error("E_HRG_RELATION_KIND: insertAfter requires a list relation");
        }
        this.assertAvailableItem(operation.previous);
        const previousKey = `${operation.relationName}\u0000${operation.previous.id}`;
        if (!relation.node(operation.previous) && !plannedMembership.has(previousKey)) {
          throw new Error(
            `E_HRG_PREVIOUS_RELATION: previous item '${operation.previous.id}' is not in relation '${operation.relationName}'`,
          );
        }
        prepared.push({
          journal: Object.freeze({
            kind: "insert_after",
            relationName: operation.relationName,
            previousItemId: operation.previous.id,
            itemId: operation.item.id,
          }),
          commit: () => {
            const previousNode = relation.node(operation.previous);
            if (!previousNode) throw new Error("E_HRG_PREVIOUS_RELATION: staged previous was not committed first");
            return [relation.insertAfter(previousNode, operation.item, input).write.decisionId];
          },
        });
        continue;
      }
      if (operation.kind === "add_root") {
        if (relation.kind !== "tree") throw new Error("E_HRG_RELATION_KIND: addRoot requires a tree relation");
        prepared.push({
          journal: Object.freeze({ kind: "add_root", relationName: operation.relationName, itemId: operation.item.id }),
          commit: () => [relation.addRoot(operation.item, input).write.decisionId],
        });
        continue;
      }

      this.assertAvailableItem(operation.parent);
      const parentKey = `${operation.relationName}\u0000${operation.parent.id}`;
      const existingParent = relation.node(operation.parent);
      if (!existingParent && !plannedMembership.has(parentKey)) {
        throw new Error(
          `E_HRG_PARENT_RELATION: parent item '${operation.parent.id}' is not in relation '${operation.relationName}'`,
        );
      }
      prepared.push({
        journal: Object.freeze({
          kind: "add_daughter",
          relationName: operation.relationName,
          parentItemId: operation.parent.id,
          itemId: operation.item.id,
        }),
        commit: () => {
          const parentNode: HrgNode | undefined = relation.node(operation.parent);
          if (!parentNode) throw new Error("E_HRG_PARENT_RELATION: staged parent was not committed first");
          return [relation.addDaughter(parentNode, operation.item, input).write.decisionId];
        },
      });
    }
    return prepared;
  }

  commit(): TransactionJournalEntry {
    this.assertOpen();
    let prepared: PreparedOperation[];
    try {
      prepared = this.prepare();
    } catch (error) {
      this.closed = true;
      this.utterance._recordTransactionRejection(this.metadata, error);
      throw error;
    }

    const decisionIds = prepared.flatMap((operation) => operation.commit());
    const entry = Object.freeze({
      id: this.utterance._nextTransactionId(),
      metadata: this.metadata,
      readSet: Object.freeze([...this.reads]),
      operations: Object.freeze(prepared.map((operation) => operation.journal)),
      decisionIds: Object.freeze(decisionIds),
    });
    this.closed = true;
    this.utterance._recordTransaction(entry);
    return entry;
  }
}
