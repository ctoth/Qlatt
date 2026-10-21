import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const SCHEMA = {
  itemTypes: {
    segment: { features: { phoneme: { kind: "string" } } },
    syllable: { features: { stress: { kind: "number" } } },
  },
  relations: {
    Segment: { kind: "list", itemTypes: ["segment"] },
    SylStructure: { kind: "tree", itemTypes: ["syllable", "segment"] },
  },
} as const satisfies HrgSchema;

const META = {
  ruleId: "fixture",
  phase: "structural",
  tag: "structural",
  reason: "fixture",
  citations: ["Taylor, Black & Caley 2001"],
};

describe("positional daughters in a tree relation", () => {
  const build = () => {
    const utterance = new Utterance(SCHEMA);
    const transaction = utterance.beginTransaction(META);
    const syllable = transaction.createItem("syllable", "syl");
    const a = transaction.createItem("segment", "a");
    const c = transaction.createItem("segment", "c");
    transaction.addRoot("SylStructure", syllable);
    transaction.addDaughter("SylStructure", syllable, a);
    transaction.addDaughter("SylStructure", syllable, c);
    transaction.commit();
    return { utterance, syllable, a, c };
  };
  const daughters = (utterance: Utterance, id: string): string[] =>
    (utterance.sylStructure.nodesById.get(id)?.daughters ?? []).map((node) => node.item.id);

  it("inserts after a named daughter and keeps the sibling chain", () => {
    const { utterance, syllable, a, c } = build();
    const transaction = utterance.beginTransaction(META);
    const b = transaction.createItem("segment", "b");
    transaction.addDaughter("SylStructure", syllable, b, a);
    transaction.commit();
    expect(daughters(utterance, "syl")).toEqual(["a", "b", "c"]);
    const node = utterance.sylStructure.node(b);
    expect(node?.prev?.item).toBe(a);
    expect(node?.next?.item).toBe(c);
    expect(utterance.sylStructure.node(c)?.prev?.item).toBe(b);
  });

  it("inserts first when the previous daughter is null", () => {
    const { utterance, syllable, a } = build();
    const transaction = utterance.beginTransaction(META);
    const first = transaction.createItem("segment", "first");
    transaction.addDaughter("SylStructure", syllable, first, null);
    transaction.commit();
    expect(daughters(utterance, "syl")).toEqual(["first", "a", "c"]);
    expect(utterance.sylStructure.node(a)?.prev?.item).toBe(first);
  });

  it("rejects a previous daughter that is not in the relation", () => {
    const { utterance, syllable } = build();
    const transaction = utterance.beginTransaction(META);
    const stray = transaction.createItem("segment", "stray");
    const item = transaction.createItem("segment", "item");
    transaction.addDaughter("SylStructure", syllable, item, stray);
    expect(() => transaction.commit()).toThrowError(/E_HRG_PREVIOUS_RELATION/);
    expect(daughters(utterance, "syl")).toEqual(["a", "c"]);
  });
});

// One named corpus, so this test does not grow with every corpus added to the directory.
const corpus = JSON.parse(
  fs.readFileSync(path.join(__dirname, "oracle-corpora", "dectalk-us-v1.json"), "utf8"),
) as { entries: Array<{ text: string }> };
const corpusTexts = [...new Set(corpus.entries.map((entry) => entry.text))];

describe.each(["dectalk-english", "qlatt-english", "qlatt-beauty"])(
  "the word tree after every rule phase (%s)",
  (frontendId) => {
    it.each(corpusTexts)("agrees with the Segment relation for %j", (text) => {
      const { utterance } = textToKlattTrackDetailed(text, undefined, 30, { frontendId });
      const structure = utterance.sylStructure;
      const ancestor = (item: Parameters<typeof structure.node>[0], type: string) => {
        let node = structure.node(item) ?? null;
        while (node && node.item.type !== type) node = node.parent;
        return node?.item;
      };
      const active = utterance.segments.listItems().filter((item) => item.get("active") !== false);
      const order = new Map(active.map((item, index) => [item, index]));
      const wordRuns: string[] = [];
      for (const item of active) {
        const word = ancestor(item, "word");
        const label = `${String(item.get("phoneme"))} (${item.id})`;
        if (item.get("punctuationSymbol") != null) {
          expect(word, `${label} is punctuation`).toBeUndefined();
          continue;
        }
        const name = item.get("word");
        if (typeof name !== "string" || name === "") continue;
        expect(String(word?.get("text")).toLowerCase(), label).toBe(name.toLowerCase());
        if (word && wordRuns.at(-1) !== word.id) wordRuns.push(word.id);
      }
      // Each Word is one contiguous run of the Segment relation.
      expect(new Set(wordRuns).size).toBe(wordRuns.length);
      // Within a syllable, live daughters are in Segment order.
      for (const node of structure.nodesById.values()) {
        if (node.item.type !== "syllable") continue;
        const positions = node.daughters.flatMap((daughter) => {
          const position = order.get(daughter.item);
          return position === undefined ? [] : [position];
        });
        expect(positions).toEqual([...positions].sort((left, right) => left - right));
      }
    });
  },
);
