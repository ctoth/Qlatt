import { runRuleEngine } from "./engine";
import { QLATT_V11_SLICE_RULEPACK } from "./rule-pack";

type DeclarativeFrontendOptions = {
  includeTrace?: boolean;
  phases?: string[];
  parameters?: Record<string, unknown>;
};

export function runDeclarativeFrontend(
  sequence: Array<Record<string, unknown>>,
  options: DeclarativeFrontendOptions = {}
) {
  const result = runRuleEngine(sequence, QLATT_V11_SLICE_RULEPACK, options);
  if (options.includeTrace) return result;
  return result.sequence;
}

export { runRuleEngine } from "./engine";
export { parseDslSpec } from "./parser";
export { validateDslSpec, validateSyncAxis } from "./validation";
export {
  RANK_LEN,
  compareOrder,
  midpointRank,
  rebalanceRanks,
  finiteOrder,
  startOrder,
  endOrder,
} from "./order";
export {
  TokenStatus,
  normalizeTokenStatus,
  joinTokenStatus,
  isActiveToken,
} from "./model";
export {
  buildPhaseSnapshots,
  explainField,
  whyNotRule,
  diffPhaseState,
} from "./tooling";
