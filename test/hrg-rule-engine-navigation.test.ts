import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        stress: { kind: "number" },
        duration: { kind: "number" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const INPUT = { reason: "fixture", citations: ["Taylor, Black & Caley 2001"] };

const TREE_SCHEMA = {
  itemTypes: {
    word: { features: { text: { kind: "string" } } },
    syllable: { features: {} },
    segment: {
      features: {
        phoneme: { kind: "string" },
        type: { kind: "string", values: ["stop", "vowel"] },
        duration: { kind: "number" },
      },
    },
  },
  relations: {
    Word: { kind: "list", itemTypes: ["word"] },
    Segment: { kind: "list", itemTypes: ["segment"] },
    SylStructure: { kind: "tree", itemTypes: ["word", "syllable", "segment"] },
  },
} as const satisfies HrgSchema;

describe("graph-native predicate navigation", () => {
  it("scans tracked relation Items through expression and named predicates", () => {
    const utterance = new Utterance(SCHEMA);
    for (const [id, phoneme, stress] of [
      ["p", "P", 0],
      ["eh", "EH", 1],
      ["ih", "IH", 0],
      ["k", "K", 0],
    ] as const) {
      const item = utterance.createItem("segment", id);
      item.set("phoneme", phoneme, INPUT);
      item.set("stress", stress, INPUT);
      item.set("duration", 10, INPUT);
      utterance.relation("Segment").append(item, INPUT);
    }
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: {
          type: "base",
          features: { phoneme: [], stress: [] },
          scalars: { duration: {} },
        },
      },
      predicates: { is_stressed: "has(current.stress) && current.stress == 1" },
      rules: {
        scan: {
          select: { relation: "Segment", where: "current.phoneme == 'K'" },
          define: {
            expression_hit: "look_back_where(current, 4, 'candidate.stress == 1')",
            predicate_hit: "look_back_pred(current, 4, 'is_stressed')",
          },
          apply: [
            {
              field: "duration",
              op: "add",
              value: "expression_hit.id == predicate_hit.id ? 10 : 0",
              tag: "navigation",
            },
          ],
          citations: ["Taylor, Black & Caley 2001"],
        },
      },
      phases: [{ name: "rules", rules: ["scan"] }],
    });

    runGraphRuleEngine(utterance, spec);

    const k = utterance.getItem("k");
    const eh = utterance.getItem("eh");
    const ih = utterance.getItem("ih");
    if (!k || !eh || !ih) throw new Error("missing fixture Items");
    expect(k.get("duration")).toBe(20);
    expect(k.latestWrite("duration")?.parents).toEqual(
      expect.arrayContaining([
        eh.latestWrite("stress")?.decisionId,
        ih.latestWrite("stress")?.decisionId,
        utterance.relation("Segment").node(eh)?.write.decisionId,
        utterance.relation("Segment").node(ih)?.write.decisionId,
      ]),
    );
  });

  it("derives word, syllable, role, position, and span queries from shared tree identity", () => {
    const utterance = new Utterance(TREE_SCHEMA);
    const transaction = utterance.beginTransaction({
      ruleId: "fixture",
      phase: "input",
      tag: "fixture",
      ...INPUT,
    });
    const word = transaction.createItem("word", "word");
    const firstSyllable = transaction.createItem("syllable", "s1");
    const secondSyllable = transaction.createItem("syllable", "s2");
    const segments = [
      transaction.createItem("segment", "b"),
      transaction.createItem("segment", "eh"),
      transaction.createItem("segment", "t"),
      transaction.createItem("segment", "er"),
    ];
    transaction.set(word, "text", "better");
    transaction.append("Word", word);
    transaction.addRoot("SylStructure", word);
    transaction.addDaughter("SylStructure", word, firstSyllable);
    transaction.addDaughter("SylStructure", word, secondSyllable);
    for (const [index, item] of segments.entries()) {
      const phonemes = ["B", "EH", "T", "ER"];
      transaction.set(item, "phoneme", phonemes[index]);
      transaction.set(item, "type", index === 1 || index === 3 ? "vowel" : "stop");
      transaction.set(item, "duration", 10);
      transaction.append("Segment", item);
      transaction.addDaughter("SylStructure", index < 2 ? firstSyllable : secondSyllable, item);
    }
    transaction.commit();
    const spec = compileRuleEngineSpec({
      relations: {
        Word: { type: "span", features: { text: [] } },
        Segment: {
          type: "base",
          features: { phoneme: [], syllable: [], type: ["stop", "vowel"] },
          scalars: { duration: {} },
        },
        SylStructure: { type: "span" },
      },
      rules: {
        graph_queries: {
          select: { relation: "Segment", where: "current.id == 'er'" },
          define: {
            first: "find_within_word(current, \"current.phoneme == 'B'\", 'behind')",
            word_text: "path(current, 'R:SylStructure.parent.parent.R:Word.text')",
          },
          apply: [
            {
              field: "duration",
              op: "set",
              value: [
                "word_count()",
                "count_word_vowels()",
                "syllable_index() * 10",
                "(syllable_role() == 'nucleus' ? 20 : 0)",
                "(syllable_position_in_word() == 'final' ? 30 : 0)",
                "(current.syllable.id == 's2' ? 40 : 0)",
                "(first != null ? span_ms(first, current) : 0)",
                "(first != null ? 50 : 0)",
                "(word_text == 'better' ? 60 : 0)",
              ].join(" + "),
              tag: "graph_navigation",
            },
          ],
          citations: ["Taylor, Black & Caley 2001"],
        },
      },
      phases: [{ name: "rules", rules: ["graph_queries"] }],
    });

    runGraphRuleEngine(utterance, spec);

    expect(utterance.getItem("er")?.get("duration")).toBe(253);
    expect(utterance.getItem("er")?.latestWrite("duration")?.parents).toContain(
      utterance.relation("SylStructure").node(secondSyllable)?.write.decisionId,
    );
    expect(utterance.getItem("er")?.latestWrite("duration")?.parents).toContain(
      word.latestWrite("text")?.decisionId,
    );
  });

  it("parents target materialization to the selected inventory resource decision", () => {
    const utterance = new Utterance(SCHEMA);
    const item = utterance.createItem("segment", "source");
    item.set("phoneme", "T", INPUT);
    item.set("stress", 0, INPUT);
    item.set("duration", 10, INPUT);
    utterance.relation("Segment").append(item, INPUT);
    const resource = utterance.provenance.add({
      stage: "frontend",
      type: "inventory_resource",
      subject: "inventory:test",
      reason: "selected test inventory",
      citations: ["Klatt 1980"],
    });
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: { type: "base", scalars: { duration: {} }, features: { phoneme: [] } },
      },
      rules: {
        target_duration: {
          select: { relation: "Segment", where: "current.id == 'source'" },
          apply: [
            { field: "duration", op: "set", value: "target('REL').duration", tag: "inventory" },
          ],
          citations: ["Klatt 1980"],
        },
      },
      phases: [{ name: "structural", rules: ["target_duration"] }],
    });

    runGraphRuleEngine(utterance, spec, {
      inventory: {
        decisionId: resource.id,
        spec: {
          base_params: { F0: 0 },
          phoneme_targets: {
            REL: { type: "stop_release", dur: 20, F0: 0 },
            SIL: { type: "silence", dur: 30, F0: 0 },
          },
        },
      },
    });

    expect(item.get("duration")).toBe(20);
    expect(item.latestWrite("duration")?.parents).toContain(resource.id);
  });
});
