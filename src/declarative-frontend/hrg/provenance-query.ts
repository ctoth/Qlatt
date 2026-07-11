/**
 * HRG provenance query — "why is X what it is?"
 *
 * Because every feature-write is a DecisionRecord and overwrites/derivations
 * carry `parents`, the answer is a walk of the provenance DAG starting from the
 * write that produced a value. Two entry points:
 *   - whyFeature(item, key): the chain behind an item's current feature value.
 *   - whyParamAt(track, param, t): the chain behind a lowered frame param.
 *
 * Citations: src/provenance.ts (DecisionRecord DAG);
 * design/beauty-synthesis/11-sota-frontend-architecture.md §4.
 */
import type { DecisionRecord, ProvenanceCollector } from "../../provenance";
import type { Item } from "./item";
import type { Utterance } from "./utterance";
import { frameIndexAt, type LoweredTrack } from "./lowering";

/**
 * Breadth-first walk of the decision DAG from `startId`, following `parents`.
 * Returns the start decision first, then its ancestors, deduplicated.
 */
export function decisionChain(provenance: ProvenanceCollector, startId: string): DecisionRecord[] {
  const byId = new Map(provenance.getDecisions().map((decision) => [decision.id, decision]));
  const ordered: DecisionRecord[] = [];
  const seen = new Set<string>();
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const id = queue.shift();
    if (id == null || seen.has(id)) continue;
    seen.add(id);
    const decision = byId.get(id);
    if (!decision) continue;
    ordered.push(decision);
    for (const parent of decision.parents ?? []) queue.push(parent);
  }
  return ordered;
}

/** The decision chain behind an item's current value for `key` ([] if unwritten). */
export function whyFeature(utterance: Utterance, item: Item, key: string): DecisionRecord[] {
  const write = item.latestWrite(key);
  if (!write) return [];
  return decisionChain(utterance.provenance, write.decisionId);
}

/** The decision chain behind an Item's membership/topology in one relation. */
export function whyRelationMembership(
  utterance: Utterance,
  item: Item,
  relationName: string,
): DecisionRecord[] {
  const relation = utterance.getRelation(relationName);
  const write = relation?.latestWrite(item);
  return write ? decisionChain(utterance.provenance, write.decisionId) : [];
}

/**
 * The decision chain behind a lowered frame parameter at time `timeSec`.
 * Returns [] if no frame covers the time or the param has no provenance there.
 */
export function whyParamAt(track: LoweredTrack, param: string, timeSec: number): DecisionRecord[] {
  const index = frameIndexAt(track, timeSec);
  if (index < 0) return [];
  const decisionId = track.provenanceByFrame[index]?.[param];
  if (!decisionId) return [];
  return decisionChain(track.utterance.provenance, decisionId);
}
