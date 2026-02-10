import { runRuleEngine } from "./engine.js";
import { QLATT_V11_SLICE_RULEPACK } from "./rule-pack.js";

export function runDeclarativeFrontend(sequence, options = {}) {
  const result = runRuleEngine(sequence, QLATT_V11_SLICE_RULEPACK, options);
  if (options.includeTrace) return result;
  return result.sequence;
}
