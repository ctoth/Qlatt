import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

/**
 * Unit tests for the phrase-domain `scan` primitive (Phase 5.3 Stage 1).
 *
 * The primitive exposes a `phrase` namespace over the selected matches grouped
 * into phrases by `reset_break_index`. These tests exercise the exact operations
 * the deferred prosody passes need:
 *  - phrase-domain selection with index / count / is_first / is_last
 *  - "last item matching a predicate in phrase" (nuclear accent)
 *  - index-within-phrase with boundary reset (accent index / downstep)
 *  - phrase length / midpoint (long-phrase break insertion)
 *  - provenance: writes derived from `phrase.*` depend on the breakIndex decisions
 *    that defined the grouping.
 */

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        duration: { kind: "number" },
        breakIndex: { kind: "number" },
        carrier: { kind: "boolean" },
        idx: { kind: "number" },
        cnt: { kind: "number" },
        first: { kind: "boolean" },
        last: { kind: "boolean" },
        mid: { kind: "number" },
        isMid: { kind: "boolean" },
        nuclear: { kind: "boolean" },
        active: { kind: "boolean" },
        punctuationSymbol: { kind: "string" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const META = {
  ruleId: "fixture",
  phase: "input",
  tag: "fixture",
  reason: "fixture",
  citations: ["Taylor, Black & Caley 2001"],
};

const RELATION_SPEC = {
  Segment: {
    type: "base" as const,
    features: {
      phoneme: [],
      breakIndex: [],
      carrier: [true, false],
      first: [true, false],
      last: [true, false],
      isMid: [true, false],
      nuclear: [true, false],
      active: [true, false],
    },
    scalars: { duration: {}, idx: {}, cnt: {}, mid: {} },
  },
};

type Row = readonly [id: string, phoneme: string, breakIndex: number, carrier: boolean];

function buildUtterance(rows: readonly Row[]): Utterance {
  const utterance = new Utterance(SCHEMA);
  const transaction = utterance.beginTransaction(META);
  const items = rows.map(([id]) => transaction.createItem("segment", id));
  for (let index = 0; index < items.length; index += 1) {
    const [id, phoneme, breakIndex, carrier] = rows[index];
    const item = items[index];
    if (item.id !== id) throw new Error("fixture id mismatch");
    transaction.set(item, "phoneme", phoneme);
    transaction.set(item, "duration", 100);
    transaction.set(item, "breakIndex", breakIndex);
    transaction.set(item, "carrier", carrier);
    transaction.set(item, "active", true);
    transaction.append("Segment", item);
  }
  transaction.partitionAnchors(items, utterance.axis.start.id, utterance.axis.end.id);
  transaction.commit();
  return utterance;
}

describe("phrase-domain scan primitive", () => {
  it("exposes index / count / is_first / is_last per phrase, reset at the declared break", () => {
    const utterance = buildUtterance([
      ["a", "AA", 0, true],
      ["b", "L", 0, true],
      ["brk", "SIL", 4, false],
      ["c", "IY", 0, true],
      ["d", "N", 0, true],
    ]);
    const spec = compileRuleEngineSpec({
      relations: RELATION_SPEC,
      rules: {
        phrase_position: {
          select: { relation: "Segment", where: "current.phoneme != 'SIL'" },
          scan: { domain: "phrase", reset_break_index: 4 },
          apply: [
            { field: "idx", op: "set", value: "phrase.index", tag: "prosody" },
            { field: "cnt", op: "set", value: "phrase.count", tag: "prosody" },
            { field: "first", op: "set", value: "phrase.is_first", tag: "prosody" },
            { field: "last", op: "set", value: "phrase.is_last", tag: "prosody" },
          ],
          citations: ["Ladd 2008"],
        },
      },
      phases: [{ name: "prosody", rules: ["phrase_position"] }],
    });

    runGraphRuleEngine(utterance, spec);

    // Group 1: [a, b]   Group 2: [c, d]  (SIL brk with breakIndex 4 resets).
    expect(utterance.getItem("a")?.get("idx")).toBe(0);
    expect(utterance.getItem("b")?.get("idx")).toBe(1);
    expect(utterance.getItem("c")?.get("idx")).toBe(0);
    expect(utterance.getItem("d")?.get("idx")).toBe(1);

    expect(utterance.getItem("a")?.get("cnt")).toBe(2);
    expect(utterance.getItem("d")?.get("cnt")).toBe(2);

    expect(utterance.getItem("a")?.get("first")).toBe(true);
    expect(utterance.getItem("b")?.get("first")).toBe(false);
    expect(utterance.getItem("b")?.get("last")).toBe(true);
    expect(utterance.getItem("c")?.get("first")).toBe(true);
    expect(utterance.getItem("d")?.get("last")).toBe(true);
    expect(utterance.getItem("a")?.get("last")).toBe(false);

    // The SIL boundary item was not selected — it receives nothing.
    expect(utterance.getItem("brk")?.get("idx")).toBeUndefined();
  });

  it("marks the last matching item in each phrase (nuclear accent = last accent carrier)", () => {
    const utterance = buildUtterance([
      ["k", "AA", 0, true],
      ["l", "EY", 0, true],
      ["sil", "SIL", 3, false],
      ["m", "IY", 0, true],
    ]);
    const spec = compileRuleEngineSpec({
      relations: RELATION_SPEC,
      rules: {
        nuclear_accent: {
          select: { relation: "Segment", where: "current.carrier == true" },
          scan: { domain: "phrase", reset_break_index: 3 },
          apply: [{ field: "nuclear", op: "set", value: "phrase.is_last", tag: "prosody" }],
          citations: ["Ladd 2008"],
        },
      },
      phases: [{ name: "prosody", rules: ["nuclear_accent"] }],
    });

    runGraphRuleEngine(utterance, spec);

    // clause break (index 3) splits [k, l] | [m]; last carrier of each is nuclear.
    expect(utterance.getItem("k")?.get("nuclear")).toBe(false);
    expect(utterance.getItem("l")?.get("nuclear")).toBe(true);
    expect(utterance.getItem("m")?.get("nuclear")).toBe(true);
  });

  it("counts index-within-phrase, resetting only at the IP boundary (break >= 4)", () => {
    const utterance = buildUtterance([
      ["a", "AA", 0, true],
      ["s1", "SIL", 3, false],
      ["b", "IY", 0, true],
      ["s2", "SIL", 4, false],
      ["c", "EY", 0, true],
      ["d", "OW", 0, true],
    ]);
    const spec = compileRuleEngineSpec({
      relations: RELATION_SPEC,
      rules: {
        accent_index: {
          select: { relation: "Segment", where: "current.carrier == true" },
          scan: { domain: "phrase", reset_break_index: 4 },
          apply: [{ field: "idx", op: "set", value: "phrase.index", tag: "prosody" }],
          citations: ["Pierrehumbert 1980"],
        },
      },
      phases: [{ name: "prosody", rules: ["accent_index"] }],
    });

    runGraphRuleEngine(utterance, spec);

    // break=3 (s1) does NOT reset; break=4 (s2) does.
    expect(utterance.getItem("a")?.get("idx")).toBe(0);
    expect(utterance.getItem("b")?.get("idx")).toBe(1);
    expect(utterance.getItem("c")?.get("idx")).toBe(0);
    expect(utterance.getItem("d")?.get("idx")).toBe(1);
  });

  it("identifies the pre-midpoint member of a long phrase", () => {
    const rows: Row[] = [];
    for (let i = 0; i < 7; i += 1) rows.push([`w${i}`, "AA", 0, true] as const);
    const utterance = buildUtterance(rows);
    const spec = compileRuleEngineSpec({
      relations: RELATION_SPEC,
      rules: {
        long_phrase_break: {
          select: { relation: "Segment", where: "current.carrier == true" },
          scan: { domain: "phrase", reset_break_index: 3 },
          apply: [
            { field: "mid", op: "set", value: "phrase.midpoint_index", tag: "prosody" },
            { field: "isMid", op: "set", value: "phrase.is_midpoint", tag: "prosody" },
            {
              field: "cnt",
              op: "set",
              value: "phrase.count >= 7 && phrase.is_midpoint ? 2 : 0",
              tag: "prosody",
            },
          ],
          citations: ["O'Shaughnessy 1976"],
        },
      },
      phases: [{ name: "prosody", rules: ["long_phrase_break"] }],
    });

    runGraphRuleEngine(utterance, spec);

    // count 7 -> midpoint_index = floor(7/2) - 1 = 2  (matches resolveLongPhraseBreak).
    for (let i = 0; i < 7; i += 1) {
      expect(utterance.getItem(`w${i}`)?.get("mid")).toBe(2);
    }
    expect(utterance.getItem("w2")?.get("isMid")).toBe(true);
    expect(utterance.getItem("w2")?.get("cnt")).toBe(2);
    expect(utterance.getItem("w0")?.get("isMid")).toBe(false);
    expect(utterance.getItem("w6")?.get("isMid")).toBe(false);
    expect(utterance.getItem("w6")?.get("cnt")).toBe(0);
  });

  it("has no midpoint for a singleton phrase (midpoint_index = -1)", () => {
    const utterance = buildUtterance([["only", "AA", 0, true]]);
    const spec = compileRuleEngineSpec({
      relations: RELATION_SPEC,
      rules: {
        solo: {
          select: { relation: "Segment", where: "current.carrier == true" },
          scan: { domain: "phrase", reset_break_index: 3 },
          apply: [
            { field: "mid", op: "set", value: "phrase.midpoint_index", tag: "prosody" },
            { field: "isMid", op: "set", value: "phrase.is_midpoint", tag: "prosody" },
          ],
          citations: ["O'Shaughnessy 1976"],
        },
      },
      phases: [{ name: "prosody", rules: ["solo"] }],
    });

    runGraphRuleEngine(utterance, spec);

    expect(utterance.getItem("only")?.get("mid")).toBe(-1);
    expect(utterance.getItem("only")?.get("isMid")).toBe(false);
  });

  it("groups on a reset_where predicate (punctuation SIL), mirroring identifyPhrases", () => {
    // Two clauses joined by a plain (non-punctuation) SIL that must NOT split,
    // then a punctuation SIL that must split — exactly the identifyPhrases basis
    // used by the nuclear-accent and long-phrase passes, which run before break
    // indices are assigned (so breakIndex is still 0 everywhere here).
    const utterance = new Utterance(SCHEMA);
    const transaction = utterance.beginTransaction(META);
    const rows: Array<[string, string, string | null]> = [
      ["a", "AA", null],
      ["b", "L", null],
      ["plain", "SIL", null],
      ["c", "IY", null],
      ["dot", "SIL", "."],
      ["d", "OW", null],
      ["e", "N", null],
    ];
    const items = rows.map(([id]) => transaction.createItem("segment", id));
    for (let i = 0; i < items.length; i += 1) {
      const [, phoneme, punct] = rows[i];
      transaction.set(items[i], "phoneme", phoneme);
      transaction.set(items[i], "duration", 100);
      transaction.set(items[i], "breakIndex", 0);
      transaction.set(items[i], "carrier", true);
      transaction.set(items[i], "active", true);
      if (punct != null) transaction.set(items[i], "punctuationSymbol", punct);
      transaction.append("Segment", items[i]);
    }
    transaction.partitionAnchors(items, utterance.axis.start.id, utterance.axis.end.id);
    transaction.commit();

    const spec = compileRuleEngineSpec({
      relations: {
        Segment: {
          type: "base" as const,
          features: { phoneme: [], breakIndex: [], carrier: [true, false], active: [true, false] },
          scalars: { idx: {}, cnt: {} },
        },
      },
      rules: {
        phrase_position: {
          select: { relation: "Segment", where: "current.phoneme != 'SIL'" },
          scan: {
            domain: "phrase",
            reset_where: "current.phoneme == 'SIL' && has(current.punctuationSymbol)",
          },
          apply: [
            { field: "idx", op: "set", value: "phrase.index", tag: "prosody" },
            { field: "cnt", op: "set", value: "phrase.count", tag: "prosody" },
          ],
          citations: ["Ladd 2008"],
        },
      },
      phases: [{ name: "prosody", rules: ["phrase_position"] }],
    });

    runGraphRuleEngine(utterance, spec);

    // Group 1: [a, b, c] (plain SIL does not split), Group 2: [d, e].
    expect(utterance.getItem("a")?.get("idx")).toBe(0);
    expect(utterance.getItem("b")?.get("idx")).toBe(1);
    expect(utterance.getItem("c")?.get("idx")).toBe(2);
    expect(utterance.getItem("a")?.get("cnt")).toBe(3);
    expect(utterance.getItem("d")?.get("idx")).toBe(0);
    expect(utterance.getItem("e")?.get("idx")).toBe(1);
    expect(utterance.getItem("d")?.get("cnt")).toBe(2);
  });

  it("links writes derived from phrase.* to the breakIndex boundary decision (provenance)", () => {
    const utterance = buildUtterance([
      ["a", "AA", 0, true],
      ["b", "L", 0, true],
      ["brk", "SIL", 4, false],
      ["c", "IY", 0, true],
    ]);
    const spec = compileRuleEngineSpec({
      relations: RELATION_SPEC,
      rules: {
        phrase_position: {
          select: { relation: "Segment", where: "current.phoneme != 'SIL'" },
          scan: { domain: "phrase", reset_break_index: 4 },
          apply: [{ field: "idx", op: "set", value: "phrase.index", tag: "prosody" }],
          citations: ["Ladd 2008"],
        },
      },
      phases: [{ name: "prosody", rules: ["phrase_position"] }],
    });

    runGraphRuleEngine(utterance, spec);

    const boundaryDecision = utterance.getItem("brk")?.latestWrite("breakIndex")?.decisionId;
    expect(boundaryDecision).toBeTruthy();
    const write = utterance.getItem("a")?.latestWrite("idx");
    expect(write?.parents).toContain(boundaryDecision);
    // The rule's citation flows onto the write via the rule transaction.
    expect(write?.citations).toContain("Ladd 2008");
  });
});
