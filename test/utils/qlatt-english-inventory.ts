/**
 * Shared test fixture: loads the qlatt-english inventory and provides
 * an inventoryResolver for tests that exercise structural rules.
 */
import type { Utterance } from "../../src/declarative-frontend/hrg";
import {
  loadInventorySpecFromPath,
  materializePhonemeTarget,
} from "../../src/declarative-frontend/inventory";

const QLATT_INVENTORY_PATH = "/rules/frontends/qlatt-english/inventory.yaml";

export const QLATT_INVENTORY = loadInventorySpecFromPath(QLATT_INVENTORY_PATH);

export function qlattInventoryResource(utterance: Utterance) {
  const decision = utterance.provenance.add({
    stage: "frontend",
    type: "inventory_selected",
    subject: QLATT_INVENTORY_PATH,
    reason: "Select fixture inventory conventions",
    citations: [QLATT_INVENTORY_PATH],
  });
  return { spec: QLATT_INVENTORY, decisionId: decision.id };
}

export const qlattInventoryResolver = (phoneme: string) =>
  materializePhonemeTarget(phoneme, { inventorySpec: QLATT_INVENTORY });
