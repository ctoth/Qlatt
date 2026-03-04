/**
 * Shared test fixture: loads the qlatt-english inventory and provides
 * an inventoryResolver for tests that exercise structural rules.
 */
import {
  loadInventorySpecFromPath,
  materializePhonemeTarget,
} from "../../src/declarative-frontend/inventory";

const QLATT_INVENTORY_PATH = "/rules/frontends/qlatt-english/inventory.yaml";

export const QLATT_INVENTORY = loadInventorySpecFromPath(QLATT_INVENTORY_PATH);

export const qlattInventoryResolver = (phoneme: string) =>
  materializePhonemeTarget(phoneme, { inventorySpec: QLATT_INVENTORY });
