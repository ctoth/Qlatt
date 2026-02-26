/// <reference path="./external-modules.d.ts" />

import { parseDslSpec } from "./parser";
import rulePackYaml from "./rule-pack.yaml?raw";

// Canonical rulepack source is YAML (see rule-pack.yaml).
export const QLATT_V12_CEL_RULEPACK = (() => {
  const spec = parseDslSpec(rulePackYaml);
  for (const rule of Object.values(spec.rules ?? {})) {
    if (rule && typeof rule === "object" && (rule as Record<string, unknown>).op == null) {
      delete (rule as Record<string, unknown>).op;
    }
  }
  return spec;
})();
export const QLATT_V11_SLICE_RULEPACK = QLATT_V12_CEL_RULEPACK;
