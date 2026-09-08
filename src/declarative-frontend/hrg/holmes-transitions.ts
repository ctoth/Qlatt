/** Holmes, Mattingly & Shearme (1964), pp.132–134 and Appendix 1. */
import { isPlainObject } from "../../yaml-loader";
import type { Item } from "./item";
import type { Utterance } from "./utterance";

type Timing = { item: Item; durationMs: number };
type Edge = { value: number; span: number; decisionId: string };
type Curve = { points: { time: number; value: number }[]; decisionId: string };
type Model = {
  rank: number;
  fixed: Record<string, number>;
  proportion: Record<string, number>;
  internal: Record<string, number>;
  external: Record<string, number>;
  citations: string[];
};

function numbers(value: unknown): value is Record<string, number> {
  return (
    isPlainObject(value) &&
    Object.values(value).every((entry) => typeof entry === "number" && Number.isFinite(entry))
  );
}

function model(item: Item, utterance: Utterance): Model | undefined {
  if (!item.has("boundary_fixed")) return undefined;
  const fixed = item.get("boundary_fixed");
  const proportion = item.get("boundary_proportion");
  const internal = item.get("boundary_internal_ms");
  const external = item.get("boundary_external_ms");
  const rank = item.get("boundary_rank");
  const citations = item.get("boundary_citations");
  if (
    numbers(fixed) &&
    numbers(proportion) &&
    numbers(internal) &&
    numbers(external) &&
    typeof rank === "number" &&
    Number.isFinite(rank) &&
    Array.isArray(citations) &&
    citations.length > 0 &&
    citations.every(
      (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
    ) &&
    Object.keys(fixed).length > 0 &&
    Object.keys(fixed).every(
      (key) =>
        proportion[key] >= 0 && proportion[key] <= 1 && internal[key] >= 0 && external[key] >= 0,
    )
  ) {
    return { fixed, proportion, internal, external, rank, citations };
  }
  utterance.diagnostics.error(
    "Invalid Holmes boundary table",
    { itemId: item.id },
    "HRG_LOWER_BOUNDARY_INVALID",
  );
  throw new Error(`E_HRG_LOWER_BOUNDARY_INVALID: ${item.id}`);
}

/** Build piecewise-linear formant curves; no changes to HRG timing or features. */
export function buildHolmesTransitions(timings: readonly Timing[], utterance: Utterance) {
  const models = timings.map(({ item }) => model(item, utterance));
  const covered = new Set<number>();
  const edges = new Map<Item, Map<string, { leading?: Edge; trailing?: Edge }>>();
  const put = (item: Item, key: string, side: "leading" | "trailing", edge: Edge) => {
    const fields = edges.get(item) ?? new Map<string, { leading?: Edge; trailing?: Edge }>();
    const pair = fields.get(key) ?? {};
    pair[side] = edge;
    fields.set(key, pair);
    edges.set(item, fields);
  };
  for (let index = 0; index + 1 < timings.length; index++) {
    const left = timings[index].item;
    const right = timings[index + 1].item;
    if (left.get("type") === "silence" || right.get("type") === "silence") continue;
    const a = models[index];
    const b = models[index + 1];
    const leftDominates = a != null && (b == null || a.rank >= b.rank);
    const dominant = leftDominates ? a : b;
    if (!dominant) continue;
    const owner = leftDominates ? left : right;
    const neighbor = leftDominates ? right : left;
    for (const key of Object.keys(dominant.fixed)) {
      const adjacent = neighbor.get(key);
      if (typeof adjacent !== "number" || typeof owner.get(key) !== "number") continue;
      const value = dominant.fixed[key] + dominant.proportion[key] * adjacent;
      const decision = utterance.provenance.add({
        stage: "frontend",
        type: "holmes_boundary",
        subject: `${left.id}:${right.id}:${key}`,
        reason: `${owner.id} dominates: ${dominant.fixed[key]} + ${dominant.proportion[key]} * ${adjacent} = ${value} Hz`,
        citations: dominant.citations,
        parents: [
          owner.latestWrite("boundary_fixed")?.decisionId,
          neighbor.latestWrite(key)?.decisionId,
        ].filter((id): id is string => id != null),
      });
      put(left, key, "trailing", {
        value,
        span: leftDominates ? dominant.internal[key] : dominant.external[key],
        decisionId: decision.id,
      });
      put(right, key, "leading", {
        value,
        span: leftDominates ? dominant.external[key] : dominant.internal[key],
        decisionId: decision.id,
      });
      covered.add(index);
    }
  }
  const curves = new Map<Item, Map<string, Curve>>();
  for (const { item, durationMs: duration } of timings) {
    const fields = new Map<string, Curve>();
    for (const [key, pair] of edges.get(item) ?? []) {
      const steady = item.get(key);
      if (typeof steady !== "number") continue;
      const leading = pair.leading && pair.leading.span > 0 ? pair.leading : undefined;
      const trailing = pair.trailing && pair.trailing.span > 0 ? pair.trailing : undefined;
      const initial = leading?.value ?? steady;
      const final = trailing?.value ?? steady;
      const leadSpan = leading?.span ?? 0;
      const tailSpan = trailing?.span ?? 0;
      let points: Curve["points"];
      if (leadSpan + tailSpan <= duration) {
        points = [
          { time: 0, value: initial },
          { time: leadSpan, value: steady },
          { time: duration - tailSpan, value: steady },
          { time: duration, value: final },
        ];
      } else {
        const rise = leading ? (steady - initial) / leadSpan : 0;
        const fall = trailing ? (final - steady) / tailSpan : 0;
        const crossing = (steady - fall * (duration - tailSpan) - initial) / (rise - fall);
        const intersects =
          Number.isFinite(crossing) &&
          crossing >= Math.max(0, duration - tailSpan) &&
          crossing <= Math.min(duration, leadSpan);
        points = intersects
          ? [
              { time: 0, value: initial },
              { time: crossing, value: initial + rise * crossing },
              { time: duration, value: final },
            ]
          : [
              { time: 0, value: initial },
              { time: duration, value: final },
            ];
      }
      const decision = utterance.provenance.add({
        stage: "frontend",
        type: "holmes_transition",
        subject: `${item.id}:${key}`,
        reason: `Linear target/transition curve over ${duration} ms; leading ${leadSpan} ms, trailing ${tailSpan} ms`,
        citations: ["Holmes, Mattingly & Shearme 1964 pp.132–134"],
        parents: [
          pair.leading?.decisionId,
          pair.trailing?.decisionId,
          item.latestWrite(key)?.decisionId,
        ].filter((id): id is string => id != null),
      });
      fields.set(key, { points, decisionId: decision.id });
    }
    curves.set(item, fields);
  }
  return { covered, curves };
}

export function sampleHolmesCurve(curve: Curve, offset: number): number {
  const points = curve.points;
  for (let index = 1; index < points.length; index++) {
    const left = points[index - 1];
    const right = points[index];
    if (offset > right.time) continue;
    const fraction =
      right.time === left.time ? 1 : Math.max(0, (offset - left.time) / (right.time - left.time));
    return left.value + (right.value - left.value) * fraction;
  }
  return points[points.length - 1].value;
}
