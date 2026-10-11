/**
 * A rule's `define:` entries are computed when an expression of the match
 * first reads them (rule-engine.ts, declareRuleDefinitions). These pin that an
 * entry nothing reads is not evaluated, that one that is read is evaluated
 * once, and that the decision a firing rule commits depends on what the rule
 * read and on nothing else its block could have read.
 */

import { describe, expect, it } from "vitest";
import {
  getCelExpressionProfile,
  resetCelCounters,
  setCelTimingEnabled,
} from "../src/declarative-frontend/cel-expressions";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        duration: { kind: "number" },
        active: { kind: "boolean" },
      },
    },
  },
  relations: {
    Segment: { kind: "list", itemTypes: ["segment"] },
  },
} as const satisfies HrgSchema;

const META = {
  ruleId: "fixture",
  phase: "input",
  tag: "fixture",
  reason: "fixture",
  citations: ["Taylor, Black & Caley 2001"],
};

/** Three segments, each written by a transaction of its own. */
function fixture(): Utterance {
  const utterance = new Utterance(SCHEMA);
  const items = [];
  for (const [id, duration] of [
    ["first", 100],
    ["second", 50],
    ["third", 70],
  ] as const) {
    const transaction = utterance.beginTransaction(META);
    const item = transaction.createItem("segment", id);
    transaction.set(item, "duration", duration);
    transaction.set(item, "active", true);
    transaction.append("Segment", item);
    transaction.commit();
    items.push(item);
  }
  const anchors = utterance.beginTransaction(META);
  anchors.partitionAnchors(items, utterance.axis.start.id, utterance.axis.end.id);
  anchors.commit();
  return utterance;
}

const OWN = "current.duration";
const BEFORE = "prev == null ? 0.0 : prev.duration";
// Read by neither the constraint nor the effect.
const UNREAD = "next == null ? 0.0 : next.duration + 1.0";

function specOf(rule: Record<string, unknown>) {
  return compileRuleEngineSpec({
    relations: {
      Segment: { type: "base", scalars: { duration: {} }, features: { active: [true, false] } },
    },
    rules: {
      lengthen: {
        kind: "scalar",
        select: { relation: "Segment", where: "current.id != 'third'" },
        apply: [{ field: "duration", op: "set", value: "own + before", tag: "fixture" }],
        citations: ["Klatt 1976"],
        ...rule,
      },
    },
    phases: [{ name: "duration", rules: ["lengthen"] }],
  });
}

function spec(constraint: string | undefined) {
  return specOf({
    define: { own: OWN, before: BEFORE, unread: UNREAD },
    ...(constraint === undefined ? {} : { constraint }),
  });
}

function counted(run: () => void): ReadonlyMap<string, { count: number }> {
  resetCelCounters();
  setCelTimingEnabled(true);
  try {
    run();
  } finally {
    setCelTimingEnabled(false);
  }
  return new Map(getCelExpressionProfile());
}

function decisionOf(utterance: Utterance, decisionId: string | undefined) {
  return utterance.provenance.getDecisions().find((decision) => decision.id === decisionId);
}

describe("a rule's definitions", () => {
  it("a definition nothing reads is not evaluated", () => {
    const utterance = fixture();
    // Holds for `first` (100), fails for `second` (50); `third` is not selected.
    const counts = counted(() => runGraphRuleEngine(utterance, spec("own > 60.0")));
    // The constraint reads `own`, for each of the two.
    expect(counts.get("own > 60.0")?.count).toBe(2);
    expect(counts.get(OWN)?.count).toBe(2);
    // The effect reads `before`, for the one whose rule fires.
    expect(counts.get(BEFORE)?.count).toBe(1);
    expect(counts.has(UNREAD)).toBe(false);
    expect(utterance.getItem("first")?.get("duration")).toBe(100);
    expect(utterance.getItem("second")?.get("duration")).toBe(50);
  });

  it("a definition is evaluated once however often it is read", () => {
    const utterance = fixture();
    const counts = counted(() =>
      runGraphRuleEngine(
        utterance,
        specOf({
          select: { relation: "Segment", where: "current.id == 'first'" },
          define: { own: OWN, twice: "own + own" },
          constraint: "own > 60.0 && own < 1000.0",
          apply: [{ field: "duration", op: "set", value: "own + twice + own", tag: "fixture" }],
        }),
      ),
    );
    expect(counts.get(OWN)?.count).toBe(1);
    expect(counts.get("own + own")?.count).toBe(1);
    expect(utterance.getItem("first")?.get("duration")).toBe(400);
  });

  it("a rule without a constraint evaluates what its effects read", () => {
    const utterance = fixture();
    const counts = counted(() => runGraphRuleEngine(utterance, spec(undefined)));
    expect(counts.get(OWN)?.count).toBe(2);
    expect(counts.get(BEFORE)?.count).toBe(2);
    expect(counts.has(UNREAD)).toBe(false);
    expect(utterance.getItem("second")?.get("duration")).toBe(150);
  });

  it("a rule that fires depends on what it read and on nothing else", () => {
    const utterance = fixture();
    const writeOf = (id: string): string => {
      const decisionId = utterance.getItem(id)?.latestWrite("duration")?.decisionId;
      if (!decisionId) throw new Error(`missing ${id} fixture write`);
      return decisionId;
    };
    const firstWrite = writeOf("first");
    const secondWrite = writeOf("second");
    const thirdWrite = writeOf("third");
    runGraphRuleEngine(utterance, spec(undefined));

    // `first`: `own` read its duration; `before` found no Item before it.
    const first = decisionOf(utterance, writeOf("first"));
    expect(first?.reason).toContain("lengthen");
    expect(first?.parents).toContain(firstWrite);
    // Only `unread` would have read the next Item's duration.
    expect(first?.parents).not.toContain(secondWrite);
    expect(first?.parents).not.toContain(thirdWrite);

    // `second`: `own` read its duration and `before` the one `first` now has.
    const second = decisionOf(utterance, writeOf("second"));
    expect(second?.parents).toContain(secondWrite);
    expect(second?.parents).toContain(first?.id);
    expect(second?.parents).not.toContain(firstWrite);
    expect(second?.parents).not.toContain(thirdWrite);
  });

  it("a definition that would fail fails the rule only when it is read", () => {
    const failing = "params.absent.scale * 2.0";
    const unread = fixture();
    runGraphRuleEngine(unread, specOf({ define: { own: OWN, before: BEFORE, unread: failing } }));
    expect(unread.getItem("second")?.get("duration")).toBe(150);

    const read = fixture();
    expect(() =>
      runGraphRuleEngine(
        read,
        specOf({
          define: { own: OWN, before: failing },
        }),
      ),
    ).toThrowError();
    expect(read.journal().filter((entry) => entry.metadata.ruleId === "lengthen")).toEqual([]);
  });

  it("a definition may read one written after it, but not itself", () => {
    const utterance = fixture();
    runGraphRuleEngine(
      utterance,
      specOf({
        select: { relation: "Segment", where: "current.id == 'first'" },
        define: { before: "own * 2.0", own: OWN },
      }),
    );
    expect(utterance.getItem("first")?.get("duration")).toBe(300);

    for (const define of [
      { own: "own + 1.0", before: BEFORE },
      { own: "before", before: "own" },
    ]) {
      const looping = fixture();
      expect(() => runGraphRuleEngine(looping, specOf({ define }))).toThrowError(
        /Unknown variable/,
      );
      expect(looping.journal().filter((entry) => entry.metadata.ruleId === "lengthen")).toEqual([]);
    }
  });

  it("a constraint that fails leaves no decision behind", () => {
    const utterance = fixture();
    const before = utterance.provenance.size;
    runGraphRuleEngine(utterance, spec("own > 1000.0"));
    expect(utterance.provenance.size).toBe(before);
    expect(utterance.journal().filter((entry) => entry.metadata.ruleId === "lengthen")).toEqual([]);
  });
});
