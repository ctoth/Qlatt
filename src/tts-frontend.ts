import {
  PHONEME_TARGETS,
  fillDefaultParams,
  materializePhonemeTarget,
} from "./declarative-frontend/inventory";
import { runDeclarativeFrontend } from "./declarative-frontend";
import { normalizeText } from "./g2p/text-normalize";
import { QLATT_V12_CEL_RULEPACK } from "./declarative-frontend/rule-pack";
import type { ProvenanceCollector } from "./provenance";
import { transcribeText } from "./transcribe-text";

type FrontendToken = Record<string, any>;
type KlattParams = Record<string, number>;
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

function compareAxisMark(left: unknown, right: unknown): number {
  if (left === right) return 0;
  if (typeof left === "number" && typeof right === "number") {
    return left < right ? -1 : 1;
  }
  const a = left == null ? "" : String(left);
  const b = right == null ? "" : String(right);
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function parseTrailingInteger(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/(\d+)$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildF0ContourFromDeclarative(
  sequence: FrontendToken[],
  baseF0: number
): Array<{ time: number; f0: number }> {
  const points = sequence
    .filter(
      (token) =>
        token?.stream === "f0" &&
        token?.status !== 2 &&
        Number.isFinite(token?.value)
    )
    .slice()
    .sort((left: FrontendToken, right: FrontendToken) => {
      const leftTime = Number.isFinite(left?.time) ? Number(left.time) : null;
      const rightTime = Number.isFinite(right?.time) ? Number(right.time) : null;
      if (leftTime != null && rightTime != null && leftTime !== rightTime) {
        return leftTime < rightTime ? -1 : 1;
      }
      const byLeft = compareAxisMark(left?.anchor_left, right?.anchor_left);
      if (byLeft !== 0) return byLeft;
      const byRight = compareAxisMark(left?.anchor_right, right?.anchor_right);
      if (byRight !== 0) return byRight;
      const leftRatio = Number.isFinite(left?.ratio) ? Number(left.ratio) : 0;
      const rightRatio = Number.isFinite(right?.ratio) ? Number(right.ratio) : 0;
      if (leftRatio !== rightRatio) return leftRatio < rightRatio ? -1 : 1;
      const leftIdNum = parseTrailingInteger(left?.id ?? null);
      const rightIdNum = parseTrailingInteger(right?.id ?? null);
      if (leftIdNum != null && rightIdNum != null && leftIdNum !== rightIdNum) {
        return leftIdNum < rightIdNum ? -1 : 1;
      }
      return compareAxisMark(left?.id ?? "", right?.id ?? "");
    });

  if (points.length === 0) {
    return [{ time: 0, f0: baseF0 }];
  }

  const contour = points
    .map((point: FrontendToken) => ({
      time: Number.isFinite(point.time) ? Number(point.time) / 1000 : 0,
      f0: Number(point.value),
    }))
    .filter((point: { time: number; f0: number }) => point.time >= 0 && Number.isFinite(point.f0));

  if (contour.length === 0) return [{ time: 0, f0: baseF0 }];
  if (contour[0].time > 0) {
    contour.unshift({ time: 0, f0: baseF0 });
  }

  const cleaned = [contour[0]];
  for (let i = 1; i < contour.length; i += 1) {
    const prev = cleaned[cleaned.length - 1];
    const curr = contour[i];
    if (curr.time <= prev.time + 1e-6) {
      cleaned[cleaned.length - 1] = {
        time: prev.time,
        f0: curr.f0,
      };
      continue;
    }
    cleaned.push(curr);
  }

  return cleaned;
}

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
  let parameterSequence: FrontendToken[] = transcribeText(normalized, { provenance });

  // --- Prepare Parameter Sequence (Map phonemes to targets, fill params) ---
  parameterSequence = parameterSequence.map((ph: FrontendToken, index: number) => {
    let targetKeyBase = ph.phoneme;
    // Map P, T, K, B, D, G to their closure versions initially
    if (["P", "T", "K", "B", "D", "G"].includes(targetKeyBase)) {
      targetKeyBase += "_CL";
    }

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

  // --- Generate F0 from declarative points ---
  const f0Contour = buildF0ContourFromDeclarative(parameterSequence, baseF0);

  // --- Generate Final Klatt Track (FILTER PARAMS) ---
  const klattTrack: FrontendToken[] = [];
  let currentTime = 0;
  const transitionSec = Math.max(0, transitionMs) / 1000.0;
  const blendFactor = 0.35;
  const smoothTypes = new Set(["vowel", "nasal", "liquid", "glide"]);
  const blendKeys = ["F1", "F2", "F3", "B1", "B2", "B3"];

  function blendParams(baseParams: KlattParams, nextParams?: KlattParams | null): KlattParams {
    if (!nextParams) return { ...baseParams };
    const blended = { ...baseParams };
    for (const key of blendKeys) {
      const a = baseParams[key];
      const b = nextParams[key];
      if (Number.isFinite(a) && Number.isFinite(b)) {
        blended[key] = a + (b - a) * blendFactor;
      }
    }
    return blended;
  }
  function getF0AtTime(time: number): number {
    /* ... (same interpolation) ... */
    if (!f0Contour || f0Contour.length === 0) return 0;
    for (let i = 0; i < f0Contour.length - 1; i++) {
      const p1 = f0Contour[i];
      const p2 = f0Contour[i + 1];
      if (time >= p1.time && time <= p2.time) {
        if (Math.abs(p2.time - p1.time) < 1e-6) return p1.f0;
        const fraction = (time - p1.time) / (p2.time - p1.time);
        return p1.f0 + fraction * (p2.f0 - p1.f0);
      }
    }
    return f0Contour[f0Contour.length - 1].f0;
  }

  // Start silent
  klattTrack.push({
    time: 0,
    params: fillDefaultParams(PHONEME_TARGET_MAP["SIL"]),
  }); // Use filled SIL params directly

  for (let i = 0; i < phoneSequence.length; i++) {
    const ph = phoneSequence[i] as FrontendToken;
    // Stop releases/aspiration must use their fixed MITalk durations (5-25ms)
    const isStopRelease = ph.type === "stop_release" || ph.type === "stop_aspiration";
    const minDuration = isStopRelease ? 5 : 20;
    const targetDur = isStopRelease ? PHONEME_TARGET_MAP[ph.phoneme]?.dur : null;
    const phDurationMs = Number.isFinite(targetDur) ? targetDur : (ph.duration || 100);
    const phDuration = Math.max(minDuration, phDurationMs) / 1000.0;
    const segmentStart = currentTime;

    if (phDuration <= 0) {
      console.warn(
        `[TTS Frontend DEBUG] Calculated duration is non-positive (${phDuration.toFixed(
          4
        )}s) for ${ph.phoneme}. Original duration: ${ph.duration}ms. Skipping.`
      );
      continue; // Explicitly skip if duration is bad
    }
    const targetTime = segmentStart + phDuration;

    // Use the params object directly from the sequence (already filled and potentially modified by rules)
    const finalParams: KlattParams = ph.params
      ? { ...ph.params }
      : fillDefaultParams(PHONEME_TARGET_MAP["SIL"]); // Ensure we have a params object, copy it

    // Determine and set F0.
    const isTargetVoiced = finalParams.AV > 0 || finalParams.AVS > 0;
    const f0FromContour = getF0AtTime(targetTime);
    let calculatedF0 = isTargetVoiced ? f0FromContour : 0;
    if (ph.phoneme === "SIL") calculatedF0 = 0;
    if (isTargetVoiced && calculatedF0 < 1) {
      calculatedF0 = baseF0 / 2;
    }
    finalParams.F0 = calculatedF0; // Set F0 on the copied params

    if (targetTime > segmentStart) {
      const nextPh = phoneSequence[i + 1] as FrontendToken | undefined;
      const canSmooth =
        transitionSec > 0 &&
        smoothTypes.has(ph.type) &&
        smoothTypes.has(nextPh?.type);
      const steadyTime = canSmooth
        ? Math.max(segmentStart + 0.02, targetTime - transitionSec)
        : null;

      klattTrack.push({
        time: segmentStart,
        phoneme: ph.phoneme,
        word: ph.word,
        params: finalParams,
      });

      if (steadyTime && steadyTime > segmentStart && steadyTime < targetTime) {
        const transitionParams = blendParams(finalParams, nextPh?.params);
        const transitionF0 = isTargetVoiced ? getF0AtTime(steadyTime) : 0;
        transitionParams.F0 = ph.phoneme === "SIL" ? 0 : transitionF0;
        klattTrack.push({
          time: steadyTime,
          phoneme: ph.phoneme,
          word: ph.word,
          params: transitionParams,
        });
      }
      currentTime = targetTime;
    }
    // Removed the 'else' block as the non-positive duration case is handled by the 'continue' above
  }
  // Add final silence
  const finalTime = currentTime + 0.1;
  klattTrack.push({
    time: finalTime,
    phoneme: "SIL",
    params: fillDefaultParams(PHONEME_TARGET_MAP["SIL"]),
  });
  return klattTrack;
}
