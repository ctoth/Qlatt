import { materializePhonemeTarget } from "./inventory";
import { runRuleEngine, type InventoryResolver } from "./engine";
import {
  QLATT_ENGLISH_RULEPACK,
  loadBundledRulepackSpec,
  loadRulepackSpecFromPath,
} from "./rule-pack";

type DeclarativeFrontendOptions = {
  includeTrace?: boolean;
  phases?: string[];
  parameters?: Record<string, unknown>;
  inventoryResolver?: InventoryResolver;
  frontendId?: string;
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
      : typeof options.frontendId === "string" && options.frontendId.length > 0
        ? loadBundledRulepackSpec(options.frontendId)
        : QLATT_ENGLISH_RULEPACK);
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
export { validateDslSpec } from "./validation";
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
