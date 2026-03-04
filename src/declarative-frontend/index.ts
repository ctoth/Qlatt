import { runRuleEngine } from "./engine";
import {
  QLATT_ENGLISH_RULEPACK,
  loadBundledRulepackSpec,
  loadRulepackSpecFromPath,
} from "./rule-pack";
import { loadInventorySpecFromPath, materializePhonemeTarget } from "./inventory";
import type { InventoryResolver } from "./engine";

let _defaultResolver: InventoryResolver | undefined;
function defaultInventoryResolver(): InventoryResolver {
  if (!_defaultResolver) {
    const spec = loadInventorySpecFromPath('/rules/frontends/qlatt-english/inventory.yaml');
    _defaultResolver = (phoneme: string) => materializePhonemeTarget(phoneme, { inventorySpec: spec });
  }
  return _defaultResolver;
}

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
    inventoryResolver: options.inventoryResolver ?? defaultInventoryResolver(),
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
