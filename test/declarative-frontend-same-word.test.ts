import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import {
  compileRuleEngineSpec,
  loadRulepackSpecFromPath,
} from "../src/declarative-frontend/rule-pack";

const root = "public/rules/frontends/dectalk-english";
// Issue #133's convention, kept under Word Item identity: two Segments are in
// the same word only when both are in a word. A Segment in no word (a pause,
// a punctuation silence) is never in the same word as anything, another such
// Segment included. What changed is what "a word" is: the Word Item above the
// Segment in SylStructure, not the spelling the Segment carries, so a word
// said twice ("sip sip") is two words.
const citations = [
  "Taylor, Black & Caley 2001 (heterogeneous relation graphs: a Segment's Word through SylStructure)",
  "Qlatt #133 engineering convention: same word requires both Segments to be in a word",
];
const phases = ["annotation", "duration", "postlexical", "structural"];

const SCHEMA = {
  itemTypes: {
    word: { features: { text: { kind: "string" } } },
    syllable: { features: {} },
    segment: { features: { phoneme: { kind: "string" }, duration: { kind: "number" } } },
  },
  relations: {
    Word: { kind: "list", itemTypes: ["word"] },
    Segment: { kind: "list", itemTypes: ["segment"] },
    SylStructure: { kind: "tree", itemTypes: ["word", "syllable", "segment"] },
  },
} as const satisfies HrgSchema;

// Segment id, the Word it belongs to (null for none), and whether it is in
// the same word as the Segment before it.
const SEGMENTS: readonly [id: string, word: string | null, sameAsPrevious: boolean][] = [
  ["pause1", null, false], // nothing before it
  ["pause2", null, false], // neither is in a word
  ["a1", "A", false], // the one before is in no word
  ["a2", "A", true],
  ["b1", "B", false], // another Word with the same text
  ["b2", "B", true],
  ["c1", "C", false], // another Word with another text
  ["pause3", null, false], // this one is in no word
  ["d1", "D", false],
  ["d2", "D", true], // a Word whose text is empty
  ["e1", "E", false],
  ["e2", "E", true], // a Word with no text at all
];
const WORD_TEXT: Readonly<Record<string, string | undefined>> = {
  A: "sip",
  B: "sip",
  C: "zip",
  D: "",
  E: undefined,
};

describe("bundled DECtalk same-word callers", () => {
  const spec = loadRulepackSpecFromPath("/rules/frontends/dectalk-english/frontend.yaml");
  const callers: { phase: string; rule: string; name: string }[] = [];
  const textComparisons: string[] = [];
  for (const phase of phases) {
    const source = readFileSync(`${root}/phases/${phase}.yaml`, "utf8");
    for (const [index, line] of source.split("\n").entries()) {
      if (/\.word\s*[!=]=\s*\w+\.word\b/.test(line)) textComparisons.push(`${phase}:${index + 1}`);
    }
    const doc = load(source) as { rules: Record<string, { define?: Record<string, unknown> }> };
    for (const [rule, body] of Object.entries(doc.rules)) {
      for (const [name, expression] of Object.entries(body.define ?? {})) {
        if (typeof expression === "string" && expression.includes("dectalk_same_word(")) {
          callers.push({ phase, rule, name });
        }
      }
    }
  }

  it("has no rule that compares the text of two Segments' words", () => {
    expect(textComparisons).toEqual([]);
  });

  it("names every caller, each carrying the macro's citations", () => {
    expect(callers.map(({ phase, rule, name }) => `${phase}:${rule}.${name}`).sort()).toEqual([
      "annotation:dectalk_rime_boundary.alone_ahead",
      "annotation:dectalk_rime_boundary.before_morpheme",
      "annotation:dectalk_rime_boundary.syllabic_first",
      "annotation:dectalk_rime_boundary.word_end_before_rhyme",
      "postlexical:dectalk_at_reduced.before_final_t",
      "postlexical:dectalk_consonant_stress.in1",
      "postlexical:dectalk_consonant_stress.in2",
      "postlexical:dectalk_consonant_stress.in3",
      "postlexical:dectalk_flap_d.next_word_boundary",
      "postlexical:dectalk_flap_t.next_word_boundary",
      "postlexical:dectalk_fuse_vowel_r.r_not_word_initial",
      "postlexical:dectalk_glottalize_t.next_word_boundary",
      "structural:dectalk_insert_voiceless_stop_release_and_aspiration.in_s_cluster",
    ]);
    for (const { rule } of callers) {
      for (const citation of citations) expect(spec.rules[rule].citations).toContain(citation);
    }
  });

  it("answers by Word Item over every word-membership pairing", () => {
    const utterance = new Utterance(SCHEMA);
    const transaction = utterance.beginTransaction({
      ruleId: "fixture",
      phase: "input",
      tag: "fixture",
      reason: "fixture",
      citations: ["Taylor, Black & Caley 2001"],
    });
    const syllables = new Map<string, ReturnType<typeof transaction.createItem>>();
    for (const [name, text] of Object.entries(WORD_TEXT)) {
      const word = transaction.createItem("word", `word_${name}`);
      if (text !== undefined) transaction.set(word, "text", text);
      transaction.append("Word", word);
      transaction.addRoot("SylStructure", word);
      const syllable = transaction.createItem("syllable", `syllable_${name}`);
      transaction.addDaughter("SylStructure", word, syllable);
      syllables.set(name, syllable);
    }
    for (const [id, word] of SEGMENTS) {
      const item = transaction.createItem("segment", id);
      transaction.set(item, "phoneme", word === null ? "SIL" : "S");
      transaction.set(item, "duration", -1);
      transaction.append("Segment", item);
      const syllable = word === null ? undefined : syllables.get(word);
      if (syllable) transaction.addDaughter("SylStructure", syllable, item);
    }
    transaction.commit();

    const { dectalk_word_id, dectalk_same_word } = spec.functions ?? {};
    expect(dectalk_word_id).toBeDefined();
    expect(dectalk_same_word).toBeDefined();
    const engineSpec = compileRuleEngineSpec({
      relations: {
        Word: { type: "span", features: { text: [] } },
        Segment: { type: "base", features: { phoneme: [] }, scalars: { duration: {} } },
        SylStructure: { type: "span" },
      },
      functions: { dectalk_word_id, dectalk_same_word },
      rules: {
        same_word_as_previous: {
          select: { relation: "Segment" },
          define: {
            p: "prev",
            forward: "dectalk_same_word(p, current)",
            backward: "dectalk_same_word(current, p)",
          },
          apply: [
            {
              field: "duration",
              op: "set",
              value: "(forward ? 1 : 0) + (backward ? 10 : 0)",
              tag: "fixture",
            },
          ],
          citations: ["Taylor, Black & Caley 2001"],
        },
      },
      phases: [{ name: "rules", rules: ["same_word_as_previous"] }],
    });
    runGraphRuleEngine(utterance, engineSpec);

    for (const [id, , same] of SEGMENTS) {
      expect(utterance.getItem(id)?.get("duration"), id).toBe(same ? 11 : 0);
    }
  });

  it("propagates the macros and their citations through an inherited DECtalk rulepack", () => {
    const dir = mkdtempSync(join(tmpdir(), "qlatt-same-word-"));
    try {
      const path = join(dir, "frontend.yaml");
      writeFileSync(path, "extends: dectalk-english\n");
      const inherited = loadRulepackSpecFromPath(path.replace(/\\/g, "/"));
      expect(inherited.functions).toHaveProperty("dectalk_same_word");
      expect(inherited.functions).toHaveProperty("dectalk_word_id");
      for (const { rule } of callers) {
        expect(inherited.rules[rule]).toEqual(spec.rules[rule]);
        for (const citation of citations) {
          expect(inherited.rules[rule].citations).toContain(citation);
        }
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps Qlatt named predicates intact through beauty inheritance", () => {
    for (const frontend of ["qlatt-english", "qlatt-beauty"]) {
      const inherited = loadRulepackSpecFromPath(`/rules/frontends/${frontend}/frontend.yaml`);
      expect(inherited.predicates?.prev_same_word).toBe(
        "has(prev.word) && has(current.word) && prev.word == current.word",
      );
      expect(inherited.functions).not.toHaveProperty("dectalk_same_word");
    }
  });
});
