import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import {
  explainFeature,
  replayPhaseView,
  whyNotRule,
} from "../src/declarative-frontend/hrg/tooling";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        eligible: { kind: "boolean" },
        duration: { kind: "number" },
        active: { kind: "boolean" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const INPUT = {
  reason: "tooling fixture",
  citations: ["Taylor, Black & Caley 2001"],
};

function fixture() {
  const utterance = new Utterance(SCHEMA);
  const create = utterance.beginTransaction({
    ruleId: "fixture",
    phase: "input",
    tag: "input",
    ...INPUT,
  });
  const segment = create.createItem("segment", "s1");
  create.set(segment, "eligible", false);
  create.set(segment, "duration", 100);
  create.set(segment, "active", true);
  create.append("Segment", segment);
  create.commit();

  const spec = compileRuleEngineSpec({
    relations: {
      Segment: {
        type: "base",
        features: { eligible: [true, false], active: [true, false] },
        scalars: { duration: {} },
      },
    },
    rules: {
      enable: {
        kind: "scalar",
        select: { relation: "Segment", where: "current.eligible == false" },
        apply: [{ field: "eligible", op: "set", value: "true", tag: "state" }],
        citations: ["Taylor, Black & Caley 2001"],
      },
      should_not_fire: {
        kind: "scalar",
        select: { relation: "Segment", where: "current.eligible == false" },
        apply: [{ field: "duration", op: "set", value: "200", tag: "duration" }],
        citations: ["Klatt 1976"],
      },
      disable_later: {
        kind: "scalar",
        select: { relation: "Segment", where: "current.eligible == true" },
        apply: [{ field: "eligible", op: "set", value: "false", tag: "state" }],
        citations: ["Taylor, Black & Caley 2001"],
      },
    },
    phases: [
      { name: "enable", rules: ["enable"] },
      { name: "target", rules: ["should_not_fire"] },
      { name: "later", rules: ["disable_later"] },
    ],
  });
  runGraphRuleEngine(utterance, spec);
  return { utterance, spec };
}

describe("graph-native tooling", () => {
  it("replays exact phase boundaries and explains versioned feature writes", () => {
    const { utterance } = fixture();
    const beforeTarget = replayPhaseView(utterance, "target", "before");
    expect(beforeTarget.getItem("s1")?.get("eligible")).toBe(true);
    expect(beforeTarget.graphDigest()).toBe(
      utterance
        .checkpoints()
        .find((checkpoint) => checkpoint.phase === "target" && checkpoint.boundary === "before")
        ?.digest,
    );

    const explanation = explainFeature(utterance, "s1", "eligible");
    expect(explanation.currentValue).toBe(false);
    expect(explanation.history.map((write) => write.ruleId)).toEqual([
      "fixture",
      "enable",
      "disable_later",
    ]);
  });

  it("reports the exact failed select against the pre-phase state", () => {
    const { utterance } = fixture();
    const result = whyNotRule(utterance, "should_not_fire", "s1");
    expect(result.status).toBe("not_fired");
    expect(result.attempts).toHaveLength(1);
    const attempt = result.attempts[0];
    expect(attempt.status).toBe("select_where_failed");
    if (attempt.status !== "select_where_failed") throw new Error("expected select failure");
    expect(attempt.phase).toBe("target");
    expect(attempt.evidence.kind).toBe("expression");
    expect(attempt.evidence.matched).toBe(false);
    expect(attempt.evidence).toEqual(
      expect.objectContaining({
        expression: "current.eligible == false",
        value: false,
      }),
    );
  });

  it("distinguishes fired, pattern-step, constraint, and missing-target outcomes", () => {
    const { utterance } = fixture();
    expect(whyNotRule(utterance, "enable", "s1")).toEqual(
      expect.objectContaining({
        status: "fired",
        rule: "enable",
      }),
    );

    const initial = new Utterance(SCHEMA);
    const create = initial.beginTransaction({
      ruleId: "fixture",
      phase: "input",
      tag: "input",
      ...INPUT,
    });
    const segment = create.createItem("segment", "s1");
    create.set(segment, "eligible", false);
    create.set(segment, "duration", 100);
    create.set(segment, "active", true);
    create.append("Segment", segment);
    create.commit();
    const evidenceSpec = compileRuleEngineSpec({
      relations: {
        Segment: {
          type: "base",
          features: { eligible: [true, false], active: [true, false] },
          scalars: { duration: {} },
        },
      },
      patterns: {
        pair: {
          relation: "Segment",
          sequence: [
            { capture: "first", where: "current.eligible == false" },
            { capture: "second", where: "true" },
          ],
        },
      },
      rules: {
        missing_pair: {
          kind: "scalar",
          match: "pair",
          apply: [{ field: "duration", op: "set", value: "90", tag: "duration" }],
          citations: ["Klatt 1976"],
        },
        blocked: {
          kind: "scalar",
          select: { relation: "Segment", where: "current.eligible == false" },
          constraint: "false",
          apply: [{ field: "duration", op: "set", value: "90", tag: "duration" }],
          citations: ["Klatt 1976"],
        },
        missing_effect_target: {
          kind: "scalar",
          select: { relation: "Segment", where: "current.eligible == false" },
          apply: [{ target: "ghost", field: "duration", op: "set", value: "90", tag: "duration" }],
          citations: ["Klatt 1976"],
        },
        short_circuit: {
          kind: "scalar",
          select: {
            relation: "Segment",
            where: {
              all: ["current.eligible == true", "current.missing.deep == 1"],
            },
          },
          apply: [{ field: "duration", op: "set", value: "90", tag: "duration" }],
          citations: ["Klatt 1976"],
        },
      },
      phases: [
        {
          name: "target",
          rules: ["missing_pair", "blocked", "short_circuit", "missing_effect_target"],
        },
      ],
    });
    expect(() => runGraphRuleEngine(initial, evidenceSpec)).toThrowError(/E_EFFECT_TARGET_UNKNOWN/);

    const pair = whyNotRule(initial, "missing_pair", "s1");
    expect(pair.status).toBe("not_fired");
    expect(pair.attempts).toContainEqual(
      expect.objectContaining({
        status: "pattern_step_failed",
        stepIndex: 1,
        capture: "second",
      }),
    );
    const blocked = whyNotRule(initial, "blocked", "s1");
    expect(blocked.attempts).toContainEqual(
      expect.objectContaining({
        status: "constraint_failed",
        source: "rule",
      }),
    );
    const missingTarget = whyNotRule(initial, "missing_effect_target", "s1");
    expect(missingTarget.attempts).toContainEqual(
      expect.objectContaining({
        status: "missing_target",
        target: "ghost",
      }),
    );
    const shortCircuit = whyNotRule(initial, "short_circuit", "s1");
    expect(shortCircuit.status).toBe("not_fired");
    const shortCircuitAttempt = shortCircuit.attempts[0];
    expect(shortCircuitAttempt.status).toBe("select_where_failed");
    if (shortCircuitAttempt.status !== "select_where_failed")
      throw new Error("expected select failure");
    expect(shortCircuitAttempt.evidence).toEqual(
      expect.objectContaining({
        kind: "all",
        matched: false,
        total: 2,
      }),
    );
    if (shortCircuitAttempt.evidence.kind !== "all") throw new Error("expected all evidence");
    expect(shortCircuitAttempt.evidence.evaluated).toHaveLength(1);
  });

  it("reports rejected transaction validation from the graph diagnostic history", () => {
    const utterance = new Utterance(SCHEMA);
    const create = utterance.beginTransaction({
      ruleId: "fixture",
      phase: "input",
      tag: "input",
      ...INPUT,
    });
    const segment = create.createItem("segment", "s1");
    create.set(segment, "eligible", false);
    create.set(segment, "duration", 100);
    create.set(segment, "active", true);
    create.append("Segment", segment);
    create.commit();
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: {
          type: "base",
          features: { eligible: [true, false], active: [true, false] },
          scalars: { duration: {} },
        },
      },
      rules: {
        invalid_duration: {
          kind: "scalar",
          select: { relation: "Segment", where: "current.eligible == false" },
          apply: [{ field: "duration", op: "set", value: "'bad'", tag: "duration" }],
          citations: ["Klatt 1976"],
        },
      },
      phases: [{ name: "reject", rules: ["invalid_duration"] }],
    });
    expect(() => runGraphRuleEngine(utterance, spec)).toThrowError(/E_HRG_FEATURE_VALUE/);
    const result = whyNotRule(utterance, "invalid_duration", "s1");
    expect(result.status).toBe("not_fired");
    expect(result.attempts).toContainEqual(
      expect.objectContaining({
        status: "transaction_rejected",
        rule: "invalid_duration",
      }),
    );
  });

  it("records why-not after earlier rules in the same phase have committed", () => {
    const utterance = new Utterance(SCHEMA);
    const create = utterance.beginTransaction({
      ruleId: "fixture",
      phase: "input",
      tag: "input",
      ...INPUT,
    });
    const segment = create.createItem("segment", "s1");
    create.set(segment, "eligible", false);
    create.set(segment, "duration", 100);
    create.set(segment, "active", true);
    create.append("Segment", segment);
    create.commit();
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: {
          type: "base",
          features: { eligible: [true, false], active: [true, false] },
          scalars: { duration: {} },
        },
      },
      rules: {
        enable_first: {
          kind: "scalar",
          select: { relation: "Segment", where: "current.eligible == false" },
          apply: [{ field: "eligible", op: "set", value: "true", tag: "state" }],
          citations: ["Taylor, Black & Caley 2001"],
        },
        later_requires_false: {
          kind: "scalar",
          select: { relation: "Segment", where: "current.eligible == false" },
          apply: [{ field: "duration", op: "set", value: "90", tag: "duration" }],
          citations: ["Klatt 1976"],
        },
      },
      phases: [{ name: "same_phase", rules: ["enable_first", "later_requires_false"] }],
    });
    runGraphRuleEngine(utterance, spec);

    const result = whyNotRule(utterance, "later_requires_false", "s1");
    expect(result.status).toBe("not_fired");
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0]).toEqual(
      expect.objectContaining({
        status: "select_where_failed",
        journalLength: 2,
      }),
    );
    if (result.attempts[0].status !== "select_where_failed")
      throw new Error("expected select failure");
    expect(result.attempts[0].evidence).toEqual(expect.objectContaining({ value: false }));
  });
});
