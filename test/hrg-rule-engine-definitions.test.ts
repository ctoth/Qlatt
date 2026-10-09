/**
 * A rule's constraint is tried first with its `define:` entries computed only
 * when read (rule-engine.ts, constraintFailsOnTrial). These pin that a
 * constraint that fails does not pay for the definitions it does not read,
 * and that a rule that fires commits what it always did.
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

function spec(constraint: string | undefined) {
  return compileRuleEngineSpec({
    relations: {
      Segment: { type: "base", scalars: { duration: {} }, features: { active: [true, false] } },
    },
    rules: {
      lengthen: {
        kind: "scalar",
        select: { relation: "Segment", where: "current.id != 'third'" },
        define: { own: OWN, before: BEFORE, unread: UNREAD },
        ...(constraint === undefined ? {} : { constraint }),
        apply: [{ field: "duration", op: "set", value: "own + before", tag: "fixture" }],
        citations: ["Klatt 1976"],
      },
    },
    phases: [{ name: "duration", rules: ["lengthen"] }],
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

describe("a rule's definitions and its constraint", () => {
  it("a constraint that fails does not evaluate the definitions it does not read", () => {
    const utterance = fixture();
    // Holds for `first` (100), fails for `second` (50); `third` is not selected.
    const counts = counted(() => runGraphRuleEngine(utterance, spec("own > 60.0")));
    // `first` fires: tried, then evaluated in full. `second` is only tried.
    expect(counts.get(OWN)?.count).toBe(3);
    expect(counts.get("own > 60.0")?.count).toBe(3);
    // The other two are evaluated once, for the Item whose rule fires.
    expect(counts.get(BEFORE)?.count).toBe(1);
    expect(counts.get(UNREAD)?.count).toBe(1);
    expect(utterance.getItem("first")?.get("duration")).toBe(100);
    expect(utterance.getItem("second")?.get("duration")).toBe(50);
  });

  it("a rule without a constraint evaluates each definition once", () => {
    const utterance = fixture();
    const counts = counted(() => runGraphRuleEngine(utterance, spec(undefined)));
    expect(counts.get(OWN)?.count).toBe(2);
    expect(counts.get(BEFORE)?.count).toBe(2);
    expect(counts.get(UNREAD)?.count).toBe(2);
    expect(utterance.getItem("second")?.get("duration")).toBe(150);
  });

  it("a rule that fires still depends on what every definition read", () => {
    const utterance = fixture();
    const second = utterance.getItem("second");
    const secondWrite = second?.latestWrite("duration")?.decisionId;
    expect(secondWrite).toBeDefined();
    runGraphRuleEngine(utterance, spec("own > 60.0"));
    const first = utterance.getItem("first");
    const fired = utterance.provenance
      .getDecisions()
      .find((decision) => decision.id === first?.latestWrite("duration")?.decisionId);
    expect(fired?.reason).toContain("lengthen");
    // `unread` read the next Item's duration, and nothing else of the rule did.
    expect(fired?.parents).toContain(secondWrite);
    // And not on what nothing read.
    const thirdWrite = utterance.getItem("third")?.latestWrite("duration")?.decisionId;
    expect(thirdWrite).toBeDefined();
    expect(fired?.parents).not.toContain(thirdWrite);
  });

  it("the trial leaves no decision behind when the constraint fails", () => {
    const utterance = fixture();
    const before = utterance.provenance.size;
    runGraphRuleEngine(utterance, spec("own > 1000.0"));
    expect(utterance.provenance.size).toBe(before);
    expect(utterance.journal().filter((entry) => entry.metadata.ruleId === "lengthen")).toEqual([]);
  });
});
