import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        type: { kind: "string", values: ["stop", "vowel", "fricative"] },
        duration: { kind: "number" },
        active: { kind: "boolean" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const INPUT = { reason: "fixture", citations: ["Taylor, Black & Caley 2001"] };

function fixture(): Utterance {
  const utterance = new Utterance(SCHEMA);
  for (const [id, type, duration] of [
    ["stop", "stop", 70],
    ["vowel", "vowel", 100],
    ["fricative", "fricative", 80],
  ] as const) {
    const item = utterance.createItem("segment", id);
    item.set("type", type, INPUT);
    item.set("duration", duration, INPUT);
    item.set("active", true, INPUT);
    utterance.relation("Segment").append(item, INPUT);
  }
  return utterance;
}

function patternSpec(rules: Readonly<Record<string, unknown>>, phaseRules: readonly string[]) {
  return compileRuleEngineSpec({
    relations: {
      Segment: {
        type: "base",
        features: { type: ["stop", "vowel", "fricative"], active: [true, false] },
        scalars: { duration: {} },
      },
    },
    patterns: {
      cv: {
        relation: "Segment",
        sequence: [
          { capture: "c", where: "current.type == 'stop'" },
          { capture: "v", where: "current.type == 'vowel'" },
        ],
      },
    },
    rules,
    phases: [{ name: "pattern", rules: phaseRules }],
  });
}

describe("graph-native pattern and association execution", () => {
  it("applies targeted pattern effects through one atomic transaction", () => {
    const utterance = fixture();
    const spec = patternSpec(
      {
        boost_vowel: {
          match: "cv",
          apply: [{ target: "v", field: "duration", op: "add", value: "20", tag: "cv" }],
          citations: ["Klatt 1976"],
        },
      },
      ["boost_vowel"],
    );

    runGraphRuleEngine(utterance, spec);

    expect(utterance.getItem("vowel")?.get("duration")).toBe(120);
    expect(utterance.getItem("stop")?.get("duration")).toBe(70);
    expect(utterance.journal()).toHaveLength(1);
    expect(utterance.journal()[0].operations).toEqual([
      expect.objectContaining({ kind: "set_feature", itemId: "vowel", key: "duration" }),
    ]);
  });

  it("records association and disassociation as versioned provenance writes", () => {
    const utterance = fixture();
    const spec = patternSpec(
      {
        link_cv: {
          match: "cv",
          associate: [{ from: "c", to: "v", assoc_name: "link" }],
          citations: ["Taylor, Black & Caley 2001"],
        },
        boost_linked: {
          select: {
            relation: "Segment",
            where: "size(assoc(current, 'link')) == 1",
          },
          apply: [{ field: "duration", op: "add", value: "10", tag: "association" }],
          citations: ["Klatt 1976"],
        },
        unlink_cv: {
          match: "cv",
          disassociate: [{ from: "c", to: "v", assoc_name: "link" }],
          citations: ["Taylor, Black & Caley 2001"],
        },
      },
      ["link_cv", "boost_linked", "unlink_cv"],
    );

    runGraphRuleEngine(utterance, spec);

    const stop = utterance.getItem("stop");
    const vowel = utterance.getItem("vowel");
    if (!stop || !vowel) throw new Error("missing fixture items");
    expect(stop.get("duration")).toBe(80);
    expect(utterance.associatedItems(stop, "link")).toEqual([]);
    const history = utterance.associationWrites(stop, "link", vowel);
    expect(history.map((write) => [write.version, write.active])).toEqual([
      [0, true],
      [1, false],
    ]);
    expect(history[1].parents).toContain(history[0].decisionId);
    expect(
      utterance.journal().flatMap((entry) => entry.operations.map((operation) => operation.kind)),
    ).toEqual(["associate", "set_feature", "disassociate"]);
  });

  it("suppresses every capture without erasing item identity or topology", () => {
    const utterance = fixture();
    const spec = patternSpec(
      {
        suppress_cv: {
          match: "cv",
          suppress: true,
          citations: ["Taylor, Black & Caley 2001"],
        },
      },
      ["suppress_cv"],
    );

    runGraphRuleEngine(utterance, spec);

    expect(utterance.getItem("stop")?.get("active")).toBe(false);
    expect(utterance.getItem("vowel")?.get("active")).toBe(false);
    expect(utterance.getItem("fricative")?.get("active")).toBe(true);
    expect(
      utterance
        .relation("Segment")
        .listItems()
        .map((item) => item.id),
    ).toEqual(["stop", "vowel", "fricative"]);
  });

  it("rejects an association and invalid feature write without partial mutation", () => {
    const utterance = fixture();
    const spec = patternSpec(
      {
        invalid_link: {
          match: "cv",
          associate: [{ from: "c", to: "v", assoc_name: "link" }],
          apply: [{ target: "v", field: "duration", op: "set", value: "'invalid'", tag: "cv" }],
          citations: ["Taylor, Black & Caley 2001"],
        },
      },
      ["invalid_link"],
    );

    expect(() => runGraphRuleEngine(utterance, spec)).toThrowError(/E_HRG_FEATURE_VALUE/);
    const stop = utterance.getItem("stop");
    const vowel = utterance.getItem("vowel");
    if (!stop || !vowel) throw new Error("missing fixture items");
    expect(vowel.get("duration")).toBe(100);
    expect(utterance.associationWrites(stop, "link", vowel)).toEqual([]);
    expect(utterance.journal()).toEqual([]);
  });
});
