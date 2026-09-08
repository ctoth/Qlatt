import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";
import { evaluateExpression } from "../src/declarative-frontend/cel-expressions";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const ruleId = "assign_long_phrase_break";
const citations = ["O'Shaughnessy 1976", "Silverman et al. 1992"];
const words = ["cat", "dog", "bird", "fish", "horse", "cow", "pig", "sheep", "goat"];

function phraseWrites(text: string) {
  return textToKlattTrackDetailed(text, 120)
    .utterance.relation("Segment")
    .listItems()
    .flatMap((item) =>
      item
        .writes("breakIndex")
        .filter((write) => write.ruleId === ruleId)
        .map((write) => ({ item, write })),
    );
}

describe("long-phrase midpoint policy", () => {
  it.each([1, 2, 5, 6, 7, 8, 9])("owns the arithmetic for %i content words", (count) => {
    const document = load(
      readFileSync("public/rules/frontends/qlatt-english/phases/annotation.yaml", "utf8"),
    ) as { rules: Record<string, { apply: { value: string }[] }> };
    const expression = document.rules[ruleId].apply[0].value;
    // No engine-derived midpoint fields: count and index must suffice.
    const actual = Array.from({ length: count }, (_, index) =>
      evaluateExpression(expression, { phrase: { count, index } }),
    );
    const expected = Array<number>(count).fill(0);
    if (count >= 7) expected[Math.floor(count / 2) - 1] = 2;
    expect(actual).toEqual(expected);
  });

  it.each([5, 6, 7, 8, 9])("preserves frontend breaks for %i content words", (count) => {
    const writes = phraseWrites(`${words.slice(0, count).join(" ")}.`);
    expect(writes.map(({ item }) => item.get("word"))).toEqual(words.slice(0, count));
    expect(
      writes.filter(({ write }) => write.value === 2).map(({ item }) => item.get("word")),
    ).toEqual(count < 7 ? [] : [words[Math.floor(count / 2) - 1]]);
    for (const { write } of writes) {
      expect(write.citations).toEqual(citations);
      expect(write.tag).toBe("boundary");
    }
  });

  it("resets at internal punctuation and excludes function words", () => {
    const writes = phraseWrites(
      "the cat and dog bird fish horse cow pig, the sheep and goat cat dog bird fish horse cow.",
    );
    expect(writes.map(({ item }) => item.get("word"))).toEqual([
      ...words.slice(0, 7),
      "sheep",
      "goat",
      ...words.slice(0, 6),
    ]);
    expect(
      writes.filter(({ write }) => write.value === 2).map(({ item }) => item.get("word")),
    ).toEqual(["bird", "dog"]);
    for (const { item, write } of writes) {
      const grouping = item.writes("isContentWord").map((entry) => entry.decisionId);
      expect(grouping.length).toBeGreaterThan(0);
      expect(write.parents.some((parent) => grouping.includes(parent))).toBe(true);
    }
  });
});
