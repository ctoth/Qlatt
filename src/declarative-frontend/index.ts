import { materializePhonemeTarget } from "./inventory";
import { runRuleEngine, type InventoryResolver } from "./engine";
import { QLATT_V12_CEL_RULEPACK, loadRulepackSpecFromPath } from "./rule-pack";

type DeclarativeFrontendOptions = {
  includeTrace?: boolean;
  phases?: string[];
  parameters?: Record<string, unknown>;
  inventoryResolver?: InventoryResolver;
  specSource?: unknown;
  specPath?: string;
};

type RuleEngineResult = ReturnType<typeof runRuleEngine>;
type DeclarativeFrontendSequence = RuleEngineResult["sequence"];

export function runDeclarativeFrontend(
  sequence: Array<Record<string, unknown>>,
  options: DeclarativeFrontendOptions & { includeTrace: true }
): RuleEngineResult;
export function runDeclarativeFrontend(
  sequence: Array<Record<string, unknown>>,
  options?: DeclarativeFrontendOptions & { includeTrace?: false | undefined }
): DeclarativeFrontendSequence;
export function runDeclarativeFrontend(
  sequence: Array<Record<string, unknown>>,
  options: DeclarativeFrontendOptions = {}
): RuleEngineResult | DeclarativeFrontendSequence {
  const specSource =
    options.specSource ??
    (typeof options.specPath === "string" && options.specPath.length > 0
      ? loadRulepackSpecFromPath(options.specPath)
      : QLATT_V12_CEL_RULEPACK);
  const result = runRuleEngine(sequence, specSource, {
    phases: options.phases,
    parameters: options.parameters,
    inventoryResolver: options.inventoryResolver ?? materializePhonemeTarget,
  });
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
export type {
  PhoneToken,
  F0PointToken,
  EngineToken,
  KlattFrame,
} from "../tts-frontend-types";
export {
  isPhoneToken,
  isF0PointToken,
} from "../tts-frontend-types";
