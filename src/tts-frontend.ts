import {
  PHONEME_TARGETS,
  materializePhonemeTarget,
} from "./declarative-frontend/inventory";
import { runDeclarativeFrontend } from "./declarative-frontend";
import { normalizeText } from "./g2p/text-normalize";
import { QLATT_V12_CEL_RULEPACK } from "./declarative-frontend/rule-pack";
import type { ProvenanceCollector } from "./provenance";
import { transcribeText } from "./transcribe-text";
import { assembleKlattTrack } from "./track-assembler";
import type { OutputConfig } from "./track-assembler";
import type { TranscriptionConfig } from "./tts-frontend-types";

type FrontendToken = Record<string, any>;
type RuleSpec = { citation?: string };

export type TextToKlattTrackOptions = {
  provenance?: ProvenanceCollector | null;
};

const INVENTORY_CITATION = "public/rules/inventory.yaml";

const PHONEME_TARGET_MAP = PHONEME_TARGETS as Record<string, Record<string, any> | undefined>;
const RULE_CITATIONS = new Map<string, string[]>(
  Object.entries((QLATT_V12_CEL_RULEPACK?.rules ?? {}) as Record<string, RuleSpec>).map(
    ([ruleName, ruleDef]) => {
      const citation = typeof ruleDef?.citation === "string" ? ruleDef.citation.trim() : "";
      return [ruleName, citation.length > 0 ? [citation] : []];
    }
  )
);

// Extract output and transcription configuration from the loaded YAML rulepack.
// These override hardcoded defaults in track-assembler and transcribe-text.
const RULEPACK_OUTPUT_CONFIG: OutputConfig | undefined =
  (QLATT_V12_CEL_RULEPACK as any)?.output ?? undefined;
const RULEPACK_TRANSCRIPTION_CONFIG: TranscriptionConfig | undefined =
  (QLATT_V12_CEL_RULEPACK as any)?.transcription ?? undefined;

function collectTraceTokenIds(event: FrontendToken): string[] {
  const ids: string[] = [];
  if (typeof event?.token === "string" && event.token.length > 0) {
    ids.push(event.token);
  }
  if (event?.captures && typeof event.captures === "object") {
    ids.push(
      ...Object.values(event.captures).filter(
        (value): value is string => typeof value === "string" && value.length > 0
      )
    );
  }
  return [...new Set(ids)];
}

function emitRuleTraceDecisions(
  trace: FrontendToken[],
  provenance: ProvenanceCollector,
  tokenDecisionIds: Map<string, string>
): void {
  for (const event of trace) {
    if (event?.type !== "match" && event?.type !== "rewrite") continue;

    const ruleName = typeof event?.rule === "string" && event.rule.length > 0
      ? event.rule
      : "<unknown-rule>";
    const phaseName = typeof event?.phase === "string" && event.phase.length > 0
      ? event.phase
      : "<unknown-phase>";
    const citations = RULE_CITATIONS.get(ruleName) ?? [];
    const decisionType = event.type === "match" ? "rule_matched" : "rule_rewrite_applied";
    const traceTokenIds = collectTraceTokenIds(event);

    let subject = `rule:${ruleName}`;
    if (typeof event?.token === "string" && event.token.length > 0) {
      subject = `token:${event.token}`;
    } else if (event?.captures && typeof event.captures === "object") {
      const captureIds = Object.values(event.captures)
        .filter((value): value is string => typeof value === "string" && value.length > 0);
      if (captureIds.length > 0) {
        subject = `captures:${captureIds.join(",")}`;
      }
    }

    const parentIds = [...new Set(
      traceTokenIds
        .map((tokenId) => tokenDecisionIds.get(tokenId))
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )];

    const decision = provenance.add({
      stage: "rules",
      type: decisionType,
      subject,
      reason: `${ruleName} ${event.type} in phase ${phaseName}`,
      citations,
      parents: parentIds.length > 0 ? parentIds : undefined,
    });

    for (const tokenId of traceTokenIds) {
      tokenDecisionIds.set(tokenId, decision.id);
    }
  }
}

// Re-export normalizeText from g2p/text-normalize
export { normalizeText } from "./g2p/text-normalize";

// Re-export transcribeText from transcribe-text (backward compatibility)
export { transcribeText } from "./transcribe-text";

// --- Main Pipeline ---
export function textToKlattTrack(
  inputText: string,
  baseF0 = 110,
  transitionMs = 30,
  options: TextToKlattTrackOptions = {}
): FrontendToken[] {
  const provenance = options.provenance ?? null;
  const tokenDecisionIds = new Map<string, string>();
  const normalized = normalizeText(inputText);
  // Transcribe returns a flat list of phoneme objects with word info
  let parameterSequence: FrontendToken[] = transcribeText(normalized, {
    provenance,
    transcriptionConfig: RULEPACK_TRANSCRIPTION_CONFIG,
  });

  // --- Prepare Parameter Sequence (Map phonemes to targets, fill params) ---
  parameterSequence = parameterSequence.map((ph: FrontendToken, index: number) => {
    let targetKeyBase = ph.phoneme;

    // Delegate stress-aware inventory lookup to materializePhonemeTarget
    const materialized = materializePhonemeTarget(targetKeyBase, { stress: ph.stress });

    // Warn if phoneme was not found (materialized falls back to SIL internally)
    if (!PHONEME_TARGET_MAP[materialized.phoneme] && !PHONEME_TARGET_MAP[targetKeyBase]) {
      console.warn(
        `[TTS Frontend] No baseline target found for ${targetKeyBase} (Stress: ${ph.stress}, Word: ${ph.word}). Using SIL.`
      );
    }

    const tokenId = `ph_${index}`;
    const inventoryDecision = provenance?.add({
      stage: "transcribe",
      type: "inventory_target_selected",
      subject: `token:${index}:${targetKeyBase}`,
      reason: `Selected inventory target '${targetKeyBase}' for source phoneme '${ph.phoneme}'`,
      citations: [INVENTORY_CITATION],
      parents:
        typeof ph._pronDecisionId === "string" && ph._pronDecisionId.length > 0
          ? [ph._pronDecisionId]
          : undefined,
    });
    if (inventoryDecision?.id) {
      tokenDecisionIds.set(tokenId, inventoryDecision.id);
    }

    // Return the enriched phoneme data object for the sequence.
    // Spread materialized (params, duration, inherentDuration, type, boolean flags,
    // inventorySW) then override phoneme with the base key (stress suffix stripped).
    return {
      id: tokenId,
      ...materialized,
      phoneme: targetKeyBase,
      stress: ph.stress,
      punctuationSymbol: ph.isPunctuation ? ph.symbol : null,
      word: ph.word,
    };
  });

  // --- Apply Rules (Rules operate on the enriched parameterSequence) ---
  const declarativeInventory = { inventoryResolver: materializePhonemeTarget };

  function runPhases(
    sequence: FrontendToken[],
    phases: string[],
    parameters?: Record<string, unknown>,
  ): FrontendToken[] {
    if (!provenance) {
      return runDeclarativeFrontend(sequence, {
        ...declarativeInventory,
        phases,
        parameters,
      }) as FrontendToken[];
    }

    const result = runDeclarativeFrontend(sequence, {
      ...declarativeInventory,
      phases,
      parameters,
      includeTrace: true as const,
    }) as { sequence: FrontendToken[]; trace?: FrontendToken[] };

    if (Array.isArray(result.trace)) {
      emitRuleTraceDecisions(result.trace, provenance, tokenDecisionIds);
    }

    return result.sequence;
  }

  parameterSequence = runPhases(parameterSequence, ["structural"]);
  // Run postlexical rules (t-flapping, the-reduction) after structural
  // so T_CL exists for t_flapping to match, but before duration assignment.
  // Citation: Miller 1998, Pronunciation Modeling in Speech Synthesis
  parameterSequence = runPhases(parameterSequence, ["postlexical"]);
  parameterSequence = runPhases(parameterSequence, ["duration"]);
  parameterSequence = parameterSequence.map((token: FrontendToken, index: number) => ({
    ...token,
    id: token.id ?? `ph_${index}`,
    stream: "phone",
    status: token.status ?? 1,
  }));
  parameterSequence = runPhases(parameterSequence, ["prosody", "finalize"], {
    policy: {
      f0: {
        base_hz: baseF0,
        fall_rate_hz: 20,
        stress_rise: 1.15,
        question_rise_hz: 30,
      },
    },
  });
  const phoneSequence = parameterSequence.filter(
    (token: FrontendToken) => token?.stream !== "f0" && token?.status !== 2
  );

  // --- Assemble final Klatt track (delegated to track-assembler) ---
  return assembleKlattTrack(phoneSequence, parameterSequence, {
    baseF0,
    transitionMs,
    outputConfig: RULEPACK_OUTPUT_CONFIG,
  });
}
