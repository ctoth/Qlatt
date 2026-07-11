import { Utterance } from "./utterance";
import type { Item } from "./item";
import type { HrgSchema, TransactionJournalEntry } from "./types";

export function replayJournal(
  schema: HrgSchema,
  entries: readonly TransactionJournalEntry[],
): Utterance {
  const utterance = new Utterance(schema);
  const items = new Map<string, Item>();

  const requireItem = (itemId: string): Item => {
    const item = items.get(itemId) ?? utterance.getItem(itemId);
    if (!item) throw new Error(`E_HRG_REPLAY_ITEM_UNKNOWN: '${itemId}'`);
    return item;
  };

  for (const entry of entries) {
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
          transaction.set(requireItem(operation.itemId), operation.key, operation.value);
          break;
        case "append":
          transaction.append(operation.relationName, requireItem(operation.itemId));
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
      }
    }
    const replayed = transaction.commit();
    if (replayed.id !== entry.id) {
      throw new Error(`E_HRG_REPLAY_TRANSACTION_ID: expected '${entry.id}', got '${replayed.id}'`);
    }
  }
  return utterance;
}
