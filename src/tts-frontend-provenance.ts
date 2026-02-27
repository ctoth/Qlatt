/**
 * Provenance middleware for the TTS frontend pipeline.
 *
 * Collects decision records at key pipeline stages:
 * - Inventory target selection (after transcription)
 * - Rule trace decisions (after each rule phase)
 *
 * This module is orthogonal to the core pipeline: disabling provenance
 * has zero effect on the generated Klatt frames.
 */

import type { ProvenanceCollector } from "./provenance";
import { QLATT_V12_CEL_RULEPACK } from "./declarative-frontend/rule-pack";
import { runDeclarativeFrontend } from "./declarative-frontend";

/**
 * Loose token/event type for pipeline intermediates and trace events.
 * Provenance code reads dynamic fields defensively (typeof checks)
 * so the `any` index is safe here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PipelineRecord = Record<string, any>;
type RuleSpec = { citation?: string };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const INVENTORY_CITATION = "public/rules/inventory.yaml";

/**
 * Map from rule name to its citation strings, built from the loaded rulepack.
 * Used to attach scholarly citations to provenance decision records.
 */
export const RULE_CITATIONS = new Map<string, string[]>(
  Object.entries((QLATT_V12_CEL_RULEPACK?.rules ?? {}) as Record<string, RuleSpec>).map(
    ([ruleName, ruleDef]) => {
      const citation = typeof ruleDef?.citation === "string" ? ruleDef.citation.trim() : "";
      return [ruleName, citation.length > 0 ? [citation] : []];
    }
  )
);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extract unique token IDs from a rule-trace event, considering both
 * the `token` field and any named captures.
 */
export function collectTraceTokenIds(event: PipelineRecord): string[] {
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

/**
 * Walk a rule-phase trace array and emit one provenance decision per
 * match / rewrite event, linking back to the originating token via
 * `tokenDecisionIds`.
 */
export function emitRuleTraceDecisions(
  trace: PipelineRecord[],
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

// ---------------------------------------------------------------------------
// Inventory provenance
// ---------------------------------------------------------------------------

/**
 * Record an inventory-target-selection decision for a single phoneme token.
 *
 * Returns the decision ID (or undefined when provenance is disabled).
 */
export function recordInventoryDecision(
  provenance: ProvenanceCollector | null,
  tokenIndex: number,
  targetKeyBase: string,
  sourcePhoneme: string,
  pronDecisionId: string | undefined,
): string | undefined {
  if (!provenance) return undefined;

  const decision = provenance.add({
    stage: "transcribe",
    type: "inventory_target_selected",
    subject: `token:${tokenIndex}:${targetKeyBase}`,
    reason: `Selected inventory target '${targetKeyBase}' for source phoneme '${sourcePhoneme}'`,
    citations: [INVENTORY_CITATION],
    parents:
      typeof pronDecisionId === "string" && pronDecisionId.length > 0
        ? [pronDecisionId]
        : undefined,
  });

  return decision.id;
}

// ---------------------------------------------------------------------------
// Phase runner with provenance
// ---------------------------------------------------------------------------

/**
 * Run declarative-frontend rule phases, optionally collecting a trace for
 * provenance. When `provenance` is null the trace is skipped and the
 * lightweight (array-only) code path is used.
 */
export function runPhasesWithProvenance(
  sequence: PipelineRecord[],
  phases: string[],
  inventoryResolver: (phoneme: string, opts?: Record<string, any>) => any,
  provenance: ProvenanceCollector | null,
  tokenDecisionIds: Map<string, string>,
  parameters?: Record<string, unknown>,
): PipelineRecord[] {
  const declarativeInventory = { inventoryResolver };

  if (!provenance) {
    return runDeclarativeFrontend(sequence, {
      ...declarativeInventory,
      phases,
      parameters,
    }) as PipelineRecord[];
  }

  const result = runDeclarativeFrontend(sequence, {
    ...declarativeInventory,
    phases,
    parameters,
    includeTrace: true as const,
  }) as { sequence: PipelineRecord[]; trace?: PipelineRecord[] };

  if (Array.isArray(result.trace)) {
    emitRuleTraceDecisions(result.trace, provenance, tokenDecisionIds);
  }

  return result.sequence;
}
