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
  | { kind: "set_feature"; item: Item; key: string; value: unknown }
  | { kind: "append"; relationName: string; item: Item }
  | { kind: "add_root"; relationName: string; item: Item }
  | { kind: "add_daughter"; relationName: string; parent: Item; item: Item };

type PreparedOperation =
  | { journal: JournalOperation; commit: () => string };

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

  set(item: Item, key: string, value: unknown): this {
    this.assertOpen();
    this.operations.push({ kind: "set_feature", item, key, value });
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

  private writeInput(): {
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
      tag: this.metadata.tag,
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
      this.assertAvailableItem(operation.item);
      if (operation.kind === "create_item") {
        const journal = Object.freeze({
          kind: "create_item" as const,
          itemId: operation.item.id,
          itemType: operation.item.type,
        });
        prepared.push({
          journal,
          commit: () => this.utterance._commitItemCreation(operation.item, input),
        });
        continue;
      }
      if (operation.kind === "set_feature") {
        const value = operation.item._validateFeature(operation.key, operation.value);
        const journal = Object.freeze({
          kind: "set_feature" as const,
          itemId: operation.item.id,
          key: operation.key,
          value,
        });
        prepared.push({
          journal,
          commit: () => operation.item.set(operation.key, value, input).decisionId,
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
          commit: () => relation.append(operation.item, input).write.decisionId,
        });
        continue;
      }
      if (operation.kind === "add_root") {
        if (relation.kind !== "tree") throw new Error("E_HRG_RELATION_KIND: addRoot requires a tree relation");
        prepared.push({
          journal: Object.freeze({ kind: "add_root", relationName: operation.relationName, itemId: operation.item.id }),
          commit: () => relation.addRoot(operation.item, input).write.decisionId,
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
          return relation.addDaughter(parentNode, operation.item, input).write.decisionId;
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

    const decisionIds = prepared.map((operation) => operation.commit());
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
