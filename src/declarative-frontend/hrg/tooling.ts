import { replayJournal } from "./replay";
import type {
  FeatureValue,
  FeatureWrite,
  PhaseCheckpoint,
  RuleAttempt,
} from "./types";
import type { Utterance } from "./utterance";

export interface FieldExplanation {
  readonly itemId: string;
  readonly key: string;
  readonly currentValue: FeatureValue | undefined;
  readonly history: readonly FeatureWrite[];
}

export interface WhyNotRuleResult {
  readonly status: "fired" | "not_fired" | "no_attempt";
  readonly rule: string;
  readonly itemId: string;
  readonly attempts: readonly RuleAttempt[];
}

export function explainFeature(
  utterance: Utterance,
  itemId: string,
  key: string,
): FieldExplanation {
  const item = utterance.getItem(itemId);
  if (!item) throw new Error(`E_HRG_TOOLING_ITEM: unknown Item '${itemId}'`);
  const history = item.writes(key);
  return Object.freeze({
    itemId,
    key,
    currentValue: item.get(key),
    history: Object.freeze([...history]),
  });
}

function findCheckpoint(
  utterance: Utterance,
  phase: string,
  boundary: PhaseCheckpoint["boundary"],
): PhaseCheckpoint {
  const checkpoint = utterance.checkpoints().find(
    (candidate) => candidate.phase === phase && candidate.boundary === boundary,
  );
  if (!checkpoint) {
    throw new Error(`E_HRG_TOOLING_CHECKPOINT: no ${boundary} checkpoint for phase '${phase}'`);
  }
  return checkpoint;
}

export function replayPhaseView(
  utterance: Utterance,
  phase: string,
  boundary: PhaseCheckpoint["boundary"] = "after",
): Utterance {
  const checkpoint = findCheckpoint(utterance, phase, boundary);
  const replayed = replayJournal(
    utterance.schemaDefinition(),
    utterance.journal().slice(0, checkpoint.journalLength),
    utterance.provenance.getDecisions(),
  );
  const digest = replayed.graphDigest();
  if (digest !== checkpoint.digest) {
    throw new Error(
      `E_HRG_TOOLING_REPLAY_DIGEST: phase '${phase}' ${boundary} expected '${checkpoint.digest}', got '${digest}'`,
    );
  }
  return replayed;
}

export function whyNotRule(
  utterance: Utterance,
  ruleName: string,
  itemId: string,
): WhyNotRuleResult {
  const attempts = utterance.ruleAttempts().filter(
    (attempt) => attempt.rule === ruleName && attempt.itemIds.includes(itemId),
  );
  return Object.freeze({
    status: attempts.some((attempt) => attempt.status === "fired")
      ? "fired"
      : attempts.length > 0 ? "not_fired" : "no_attempt",
    rule: ruleName,
    itemId,
    attempts: Object.freeze(attempts),
  });
}
