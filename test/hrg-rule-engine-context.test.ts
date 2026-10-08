import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";
import { qlattInventoryResource } from "./utils/qlatt-english-inventory";

/**
 * The rule engine builds its navigation functions once for a transaction and
 * makes a context for each Item it looks at from that one scope. These tests
 * fail if a context sees another's state: the Item a nested evaluation was
 * about, a scan's own names, or another match's definitions.
 */
const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        word: { kind: "string" },
        stress: { kind: "number" },
        duration: { kind: "number" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const INPUT = { reason: "fixture", citations: ["Taylor, Black & Caley 2001"] };
const CITATIONS = ["Taylor, Black & Caley 2001"];

// "cat" has a primary stress, "dog" has none.
const SEGMENTS = [
  ["sil0", "SIL", "", 0],
  ["k", "K", "cat", 0],
  ["ae", "AE", "cat", 1],
  ["t", "T", "cat", 0],
  ["sil1", "SIL", "", 0],
  ["d", "D", "dog", 0],
  ["ao", "AO", "dog", 0],
  ["g", "G", "dog", 0],
  ["sil2", "SIL", "", 0],
] as const;

function utteranceOfTwoWords(): Utterance {
  const utterance = new Utterance(SCHEMA);
  for (const [id, phoneme, word, stress] of SEGMENTS) {
    const item = utterance.createItem("segment", id);
    item.set("phoneme", phoneme, INPUT);
    item.set("word", word, INPUT);
    item.set("stress", stress, INPUT);
    item.set("duration", 0, INPUT);
    utterance.relation("Segment").append(item, INPUT);
  }
  return utterance;
}

function specWith(rules: Record<string, unknown>) {
  return compileRuleEngineSpec({
    relations: {
      Segment: {
        type: "base",
        features: { phoneme: [], word: [], stress: [] },
        scalars: { duration: {} },
      },
    },
    rules,
    phases: [{ name: "rules", rules: Object.keys(rules) }],
  });
}

function durations(utterance: Utterance): Record<string, unknown> {
  return Object.fromEntries(SEGMENTS.map(([id]) => [id, utterance.getItem(id)?.get("duration")]));
}

describe("evaluation contexts of one scope", () => {
  it("answers 'the current Item' for the Item being evaluated, inside a scan and after it", () => {
    const utterance = utteranceOfTwoWords();
    const spec = specWith({
      // From /k/ of "cat": the scan's condition is evaluated at each
      // candidate, where the word run is the candidate's; afterwards the same
      // function must again be about /k/.
      probe: {
        select: { relation: "Segment", where: "current.phoneme == 'K'" },
        apply: [
          {
            field: "duration",
            op: "add",
            value:
              "(look_ahead_where(current, 8, \"candidate.phoneme == 'G' && !word_run_has_primary_stress()\") != null ? 1 : 0)" +
              " + (word_run_has_primary_stress() ? 10 : 0)" +
              " + (look_ahead_where(current, 8, \"candidate.phoneme == 'T' && word_run_has_primary_stress()\") != null ? 100 : 0)" +
              " + (word_run_has_primary_stress() ? 1000 : 0)",
            tag: "navigation",
          },
        ],
        citations: CITATIONS,
      },
    });
    runGraphRuleEngine(utterance, spec, { inventory: qlattInventoryResource(utterance) });
    expect(utterance.getItem("k")?.get("duration")).toBe(1111);
  });

  it("gives a scan's result the view the context itself has of that Item", () => {
    const utterance = utteranceOfTwoWords();
    const spec = specWith({
      probe: {
        select: { relation: "Segment", where: "current.phoneme == 'K'" },
        define: {
          vowel: 'look_ahead_where(current, 8, "candidate.stress == 1")',
        },
        apply: [
          {
            field: "duration",
            op: "add",
            value:
              "(vowel == next ? 1 : 0) + (vowel != current ? 10 : 0) + (ahead(current, 1) == vowel ? 100 : 0)",
            tag: "navigation",
          },
        ],
        citations: CITATIONS,
      },
    });
    runGraphRuleEngine(utterance, spec);
    expect(utterance.getItem("k")?.get("duration")).toBe(111);
  });

  it("keeps each match's definitions to that match", () => {
    const utterance = utteranceOfTwoWords();
    const spec = specWith({
      probe: {
        select: { relation: "Segment", where: "current.phoneme != 'SIL'" },
        define: {
          name: "current.phoneme",
          stressed: "current.stress == 1",
          // A later definition sees the earlier ones of its own match.
          score: "(stressed ? 100 : 0) + (name == current.phoneme ? 1 : 0)",
        },
        apply: [{ field: "duration", op: "add", value: "score", tag: "navigation" }],
        citations: CITATIONS,
      },
    });
    runGraphRuleEngine(utterance, spec);
    expect(durations(utterance)).toEqual({
      sil0: 0,
      k: 1,
      ae: 101,
      t: 1,
      sil1: 0,
      d: 1,
      ao: 1,
      g: 1,
      sil2: 0,
    });
  });

  it("keeps a scan's own names apart from the names of the context that ran it", () => {
    const utterance = utteranceOfTwoWords();
    const spec = specWith({
      probe: {
        select: { relation: "Segment", where: "current.phoneme == 'K'" },
        define: {
          // The rule's own `scan_offset`; a scan has one of its own.
          scan_offset: "7",
          // /t/ is two Items after /k/: inside the scan the name is the
          // scan's, whatever the rule defined.
          two_on: 'look_ahead_where(current, 8, "scan_offset == 2")',
        },
        apply: [
          {
            field: "duration",
            op: "add",
            // After the scan the rule's value is still there.
            value: "(two_on.phoneme == 'T' ? 1 : 0) + (scan_offset == 7 ? 10 : 0)",
            tag: "navigation",
          },
        ],
        citations: CITATIONS,
      },
    });
    runGraphRuleEngine(utterance, spec);
    expect(utterance.getItem("k")?.get("duration")).toBe(11);
  });
});
