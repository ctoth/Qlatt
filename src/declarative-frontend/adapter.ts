import { runRuleEngine } from "./engine";
import { QLATT_V11_SLICE_RULEPACK } from "./rule-pack";

export function runDeclarativeFrontend(sequence, options = {}) {
  const result = runRuleEngine(sequence, QLATT_V11_SLICE_RULEPACK, options);
  if (options.includeTrace) return result;
  return result.sequence;
}
