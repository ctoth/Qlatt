import type { AddDecisionInput, DecisionRecord, ProvenanceCollector } from "../../provenance";
import type { Item } from "./item";
import type { HrgSchema, TransactionJournalEntry } from "./types";
import { Utterance } from "./utterance";

function equalStrings(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): boolean {
  const leftValues = left ?? [];
  const rightValues = right ?? [];
  return (
    leftValues.length === rightValues.length &&
    leftValues.every((value, index) => value === rightValues[index])
  );
}

function createReplayProvenance(decisions: readonly DecisionRecord[]): {
  collector: ProvenanceCollector;
  expect: (decisionIds: readonly string[]) => void;
  assertConsumed: () => void;
} {
  const byId = new Map(decisions.map((decision) => [decision.id, decision]));
  const consumed: DecisionRecord[] = [];
  let expectedIds: readonly string[] = [];
  let cursor = 0;
  return {
    collector: {
      add(input: AddDecisionInput): DecisionRecord {
        const id = expectedIds[cursor];
        if (!id) throw new Error("E_HRG_REPLAY_DECISION_UNEXPECTED");
        const expected = byId.get(id);
        if (!expected) throw new Error(`E_HRG_REPLAY_DECISION_UNKNOWN: '${id}'`);
        if (
          expected.stage !== input.stage ||
          expected.type !== input.type ||
          expected.subject !== input.subject ||
          expected.reason !== input.reason ||
          !equalStrings(expected.citations, input.citations) ||
          !equalStrings(expected.parents, input.parents) ||
          expected.timestampMs !== input.timestampMs
        ) {
          throw new Error(`E_HRG_REPLAY_DECISION_MISMATCH: '${id}'`);
        }
        cursor += 1;
        consumed.push(expected);
        return {
          ...expected,
          citations: [...expected.citations],
          parents: expected.parents ? [...expected.parents] : undefined,
        };
      },
      getDecisions(): DecisionRecord[] {
        return consumed.map((decision) => ({
          ...decision,
          citations: [...decision.citations],
          parents: decision.parents ? [...decision.parents] : undefined,
        }));
      },
    },
    expect(decisionIds: readonly string[]): void {
      if (cursor !== expectedIds.length) throw new Error("E_HRG_REPLAY_DECISION_REMAINDER");
      expectedIds = decisionIds;
      cursor = 0;
    },
    assertConsumed(): void {
      if (cursor !== expectedIds.length) throw new Error("E_HRG_REPLAY_DECISION_MISSING");
    },
  };
}

export function replayJournal(
  schema: HrgSchema,
  entries: readonly TransactionJournalEntry[],
  decisions?: readonly DecisionRecord[],
): Utterance {
  const replayProvenance = decisions ? createReplayProvenance(decisions) : null;
  const utterance = new Utterance(schema, replayProvenance?.collector);
  const items = new Map<string, Item>();

  const requireItem = (itemId: string): Item => {
    const item = items.get(itemId) ?? utterance.getItem(itemId);
    if (!item) throw new Error(`E_HRG_REPLAY_ITEM_UNKNOWN: '${itemId}'`);
    return item;
  };

  for (const entry of entries) {
    replayProvenance?.expect(entry.decisionIds);
    const transaction = utterance.beginTransaction(entry.metadata);
    for (const decisionId of entry.readSet) transaction.dependOn(decisionId);
    for (const operation of entry.operations) {
      switch (operation.kind) {
        case "create_item": {
          const item = transaction.createItem(operation.itemType, operation.itemId);
          items.set(item.id, item);
          break;
        }
        case "set_feature":
          transaction.set(requireItem(operation.itemId), operation.key, operation.value, operation.tag);
          break;
        case "append":
          transaction.append(operation.relationName, requireItem(operation.itemId));
          break;
        case "insert_after":
          transaction.insertAfter(
            operation.relationName,
            requireItem(operation.previousItemId),
            requireItem(operation.itemId),
          );
          break;
        case "add_root":
          transaction.addRoot(operation.relationName, requireItem(operation.itemId));
          break;
        case "add_daughter":
          transaction.addDaughter(
            operation.relationName,
            requireItem(operation.parentItemId),
            requireItem(operation.itemId),
          );
          break;
        case "associate":
          transaction.associate(
            operation.name,
            requireItem(operation.fromItemId),
            requireItem(operation.toItemId),
          );
          break;
        case "disassociate":
          transaction.disassociate(
            operation.name,
            requireItem(operation.fromItemId),
            requireItem(operation.toItemId),
          );
          break;
        case "partition_anchors":
          transaction.partitionAnchors(
            operation.itemIds.map(requireItem),
            operation.leftMarkId,
            operation.rightMarkId,
          );
          break;
        case "anchor_point":
          transaction.anchorPoint(
            requireItem(operation.itemId),
            operation.leftMarkId,
            operation.rightMarkId,
            operation.ratio,
            operation.offsetMs,
          );
          break;
        case "resolve_mark_time":
          transaction.resolveMarkTime(operation.markId, operation.timeMs);
          break;
      }
    }
    const replayed = transaction.commit();
    replayProvenance?.assertConsumed();
    if (replayed.id !== entry.id) {
      throw new Error(`E_HRG_REPLAY_TRANSACTION_ID: expected '${entry.id}', got '${replayed.id}'`);
    }
  }
  return utterance;
}
