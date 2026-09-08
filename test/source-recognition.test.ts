import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  decisionChain,
  replayJournal,
  Utterance,
  whyFeature,
} from "../src/declarative-frontend/hrg";
import {
  compileRuleEngineSpec,
  loadBundledRulepackSpec,
  loadRulepackSpecFromPath,
} from "../src/declarative-frontend/rule-pack";
import {
  NORMALIZATION_SCHEMA,
  normalizeSourceItems,
  recognizeText,
} from "../src/declarative-frontend/source-recognition";
import { transcribeText } from "../src/transcribe-text";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const fixturePath = resolve("test/fixtures/source-recognition/frontend.yaml").replaceAll("\\", "/");
const resources = {
  normalization: {},
  transcription: { punctuation_tokens: [".", ",", "!", "?", ":", ";"] },
};
const unmatched = {
  speak: "current.text",
  vocabulary_keys: "[]",
  citations: ["Issue #142: preserve unmatched spans"],
};
const rule = (id: string, pattern: string, when = "true") => ({
  id,
  pattern,
  flags: "u",
  class: id,
  captures: {},
  when,
  speak: "current.text",
  vocabulary_keys: "[]",
  citations: ["Issue #142: precedence contract"],
});
function specFor(rules: unknown[]) {
  return compileRuleEngineSpec({ ...resources, text_recognition: { rules, unmatched } });
}
function recognize(text: string, rules: unknown[]) {
  const utterance = new Utterance(NORMALIZATION_SCHEMA);
  recognizeText(text, utterance, specFor(rules));
  return utterance;
}

describe("source-backed recognition", () => {
  it("uses the caller's Utterance collector at the direct pronunciation handoff", () => {
    const spec = loadRulepackSpecFromPath(fixturePath);
    const schema = textToKlattTrackDetailed("", 110, 30, {
      frontendPath: fixturePath,
    }).utterance.schemaDefinition();
    const utterance = new Utterance(schema);
    recognizeText("hello", utterance, spec);
    transcribeText(normalizeSourceItems(utterance, spec), {
      utterance,
      compiledSpec: spec,
      dictionaryMap: { hello: "HH EH1 L OW0" },
    });
    const pronunciation = utterance.provenance
      .getDecisions()
      .find((entry) => entry.type === "dictionary_pronunciation_selected");
    expect(pronunciation).toBeDefined();
    expect(
      decisionChain(utterance.provenance, pronunciation!.id).some((entry) => entry.recognition),
    ).toBe(true);
  });
  it("partitions original UTF-16 text including whitespace, case, punctuation and unmatched Unicode", () => {
    const text = "😀 HéLLo, 12:30 pm!\t尾";
    const utterance = new Utterance(NORMALIZATION_SCHEMA);
    recognizeText(text, utterance, loadRulepackSpecFromPath(fixturePath));
    const items = utterance.relation("Normalization").listItems();
    expect(items.map((item) => item.get("text")).join("")).toBe(text);
    expect(items.map((item) => [item.get("sourceStart"), item.get("sourceEnd")])).toEqual([
      [0, 3],
      [3, 8],
      [8, 10],
      [10, 18],
      [18, 20],
      [20, 21],
    ]);
    expect(items[3].get("features")).toEqual({ hour: "12", minute: "30", period: "pm" });
    expect(items[3].get("class")).toBe("time");
    expect(utterance.relation("SourceText").listItems()[0].get("text")).toBe(text);
    expect(utterance.axis.marks.size).toBe(2);
    const decision = utterance.provenance
      .getDecisions()
      .find((entry) => entry.recognition?.outcome === "accepted");
    expect(decision?.recognition).toMatchObject({
      ruleId: "time",
      sourceStart: 10,
      sourceEnd: 18,
      vocabularyKeys: ["maps.clock_words.12", "maps.clock_words.30", "maps.period_words.pm"],
    });
    expect(items[3].latestWrite("text")?.parents).toContain(decision?.id);
    expect(decision?.recognition?.captures.hour).toEqual({ text: "12", start: 10, end: 12 });
  });

  it("uses declared order, then left-to-right non-overlap, without longest-match preference", () => {
    const utterance = recognize("123 123", [
      rule("short", "12"),
      rule("long", "123"),
      rule("number", "[0-9]+"),
    ]);
    expect(
      utterance
        .relation("Normalization")
        .listItems()
        .map((item) => [item.get("text"), item.get("class")]),
    ).toEqual([
      ["12", "short"],
      ["3", "number"],
      [" ", null],
      ["12", "short"],
      ["3", "number"],
    ]);
  });

  it("leaves rejected candidates available, including overlapping candidates of the same recognizer", () => {
    const utterance = recognize("123", [
      rule("pair", "[0-9]{2}", 'current.text == "23"'),
      rule("number", "[0-9]"),
    ]);
    expect(
      utterance
        .relation("Normalization")
        .listItems()
        .map((item) => [item.get("text"), item.get("class")]),
    ).toEqual([
      ["1", "number"],
      ["23", "pair"],
    ]);
    expect(
      utterance.provenance
        .getDecisions()
        .some((entry) => entry.recognition?.outcome === "ineligible"),
    ).toBe(true);
  });

  it("recognizes overlapping dates, fractions, decimals, currency and bare numbers in YAML order", () => {
    const utterance = new Utterance(NORMALIZATION_SCHEMA);
    recognizeText("2026-09-08 1/2 3.14 $4.50 42", utterance, loadRulepackSpecFromPath(fixturePath));
    expect(
      utterance
        .relation("Normalization")
        .listItems()
        .filter((item) => item.get("class") !== null)
        .map((item) => item.get("class")),
    ).toEqual(["date", "fraction", "decimal", "currency", "number"]);
  });

  it.each(["", "\t 😀 !\n"])("preserves unmatched input %j", (text) => {
    const utterance = recognize(text, []);
    expect(utterance.relation("SourceText").listItems()[0].get("text")).toBe(text);
    expect(
      utterance
        .relation("Normalization")
        .listItems()
        .map((item) => item.get("text"))
        .join(""),
    ).toBe(text);
  });

  it.each([
    { ...rule("bad", "(") },
    { ...rule("bad", "a*") },
    { ...rule("bad", "a"), flags: "g" },
    { ...rule("bad", "(?<number>[0-9]+)"), captures: { value: "missing" } },
    { ...rule("bad", "a"), when: "missing_variable == 1" },
    { ...rule("bad", "a"), speak: "(" },
    { ...rule("bad", "a"), citations: [] },
  ])("rejects invalid declarations before execution: %j", (bad) => {
    expect(() => specFor([bad])).toThrow(/E_RECOGNITION_CONFIG/);
  });

  it("rejects duplicate rule IDs and missing selected-frontend resources", () => {
    expect(() => specFor([rule("same", "a"), rule("same", "b")])).toThrow(/E_RECOGNITION_CONFIG/);
    expect(() => compileRuleEngineSpec({ text_recognition: { rules: [], unmatched } })).toThrow(
      /E_RECOGNITION_CONFIG/,
    );
  });

  it("bounds context-dependent empty matches and rejects non-boolean eligibility", () => {
    expect(() => recognize("a", [rule("empty", "(?=a)")])).toThrow(/E_RECOGNITION_EMPTY_MATCH/);
    expect(() => recognize("a", [rule("wrong_type", "a", "1")])).toThrow(/E_RECOGNITION_RESULT/);
  });

  it("uses the selected normalization resources when handing off source items", () => {
    const spec = loadBundledRulepackSpec("dectalk-english");
    const utterance = new Utterance(NORMALIZATION_SCHEMA);
    recognizeText("123", utterance, spec);
    expect(normalizeSourceItems(utterance, spec).map((entry) => entry.word)).toContain(
      "hundredand",
    );
  });

  it("runs the opt-in fixture through one Utterance and traces Token ancestry to the multi-token source", () => {
    const result = textToKlattTrackDetailed("Meet 12:30 pm!", 110, 30, {
      frontendPath: fixturePath,
    });
    const item = result.utterance
      .relation("Normalization")
      .listItems()
      .find((entry) => entry.get("class") === "time");
    const tokens = result.utterance
      .relation("Token")
      .listItems()
      .filter((entry) =>
        whyFeature(result.utterance, entry, "word").some(
          (decision) => decision.recognition?.ruleId === "time",
        ),
      );
    expect(tokens.map((entry) => entry.get("word"))).toEqual(["twelve", "thirty", "p", "m"]);
    expect(result.track.length).toBeGreaterThan(0);
    expect(
      tokens.every((entry) =>
        whyFeature(result.utterance, entry, "word").some(
          (decision) => decision.id === item!.latestWrite("text")!.decisionId,
        ),
      ),
    ).toBe(true);
  });

  it("retains typed recognition ancestry through journal replay and existing explanation tooling", () => {
    const utterance = recognize("123", [rule("number", "[0-9]+")]);
    const replayed = replayJournal(
      utterance.schemaDefinition(),
      utterance.journal(),
      utterance.provenance.getDecisions(),
    );
    expect(replayed.graphDigest()).toBe(utterance.graphDigest());
    const item = replayed.relation("Normalization").listItems()[0];
    expect(
      whyFeature(replayed, item, "text").some((entry) => entry.recognition?.outcome === "accepted"),
    ).toBe(true);
  });

  it("keeps repeated source identities distinct through pronunciation, Segment and Syllable construction", () => {
    const { utterance } = textToKlattTrackDetailed("😀 12:30 pm hello hello.", 110, 30, {
      frontendPath: fixturePath,
    });
    const tokens = utterance
      .relation("Token")
      .listItems()
      .filter((entry) => entry.get("word") === "hello");
    expect(tokens).toHaveLength(2);
    expect(tokens[0].get("sourceNormalizationId")).not.toBe(tokens[1].get("sourceNormalizationId"));
    const sources = tokens.map(
      (token) => utterance.getItem(String(token.get("sourceNormalizationId")))!,
    );
    expect(sources.map((item) => item.get("sourceStart"))).toEqual([12, 18]);
    for (const [index, token] of tokens.entries()) {
      const chain = whyFeature(utterance, token, "word").filter((entry) => entry.recognition);
      expect(chain.map((entry) => entry.recognition?.sourceStart)).toEqual([
        sources[index].get("sourceStart"),
      ]);
      const decisions = utterance.provenance
        .getDecisions()
        .filter(
          (entry) =>
            entry.type === "dictionary_pronunciation_selected" && entry.subject === "word:hello",
        );
      expect(
        decisionChain(utterance.provenance, decisions[index].id).some(
          (entry) => entry.recognition?.sourceStart === sources[index].get("sourceStart"),
        ),
      ).toBe(true);
      const segments = utterance
        .relation("Segment")
        .listItems()
        .filter((segment) => segment.get("sourceTokenId") === token.id);
      expect(segments.length).toBeGreaterThan(0);
      expect(
        segments.every((segment) =>
          whyFeature(utterance, segment, "phoneme").some(
            (entry) => entry.recognition?.sourceStart === sources[index].get("sourceStart"),
          ),
        ),
      ).toBe(true);
    }
    const syllables = utterance.relation("Syllable").listItems();
    expect(
      syllables.every((syllable) =>
        whyFeature(utterance, syllable, "stress").some((entry) => entry.recognition),
      ),
    ).toBe(true);
  });

  it("preserves selected pronunciation/stress output and connects any declared metrical policy at the existing boundary", () => {
    const text = "😀 12:30 pm celebrationness celebrationness celebration.";
    const { utterance } = textToKlattTrackDetailed(text, 110, 30, { frontendPath: fixturePath });
    const control = textToKlattTrackDetailed(
      "twelve thirty p m celebrationness celebrationness celebration.",
      110,
    ).utterance;
    const projection = (graph: Utterance) =>
      graph
        .relation("Segment")
        .listItems()
        .map((item) => [item.get("phoneme"), item.get("stress"), item.get("word")]);
    expect(projection(utterance)).toEqual(projection(control));
    const pronunciations = utterance.provenance
      .getDecisions()
      .filter(
        (entry) =>
          entry.type.endsWith("pronunciation_selected") && entry.subject === "word:celebrationness",
      );
    expect(pronunciations).toHaveLength(2);
    for (const [index, pronunciation] of pronunciations.entries()) {
      const chain = decisionChain(utterance.provenance, pronunciation.id);
      expect(
        chain.filter((entry) => entry.recognition).map((entry) => entry.recognition?.sourceStart),
      ).toEqual([index === 0 ? 12 : 28]);
    }
    // #150 is independently delivered. This same test exercises its stronger
    // contract on an integration tree and automatically once that policy lands.
    if (Object.hasOwn(loadBundledRulepackSpec("qlatt-english"), "stress_policy_path")) {
      const stress = utterance.provenance
        .getDecisions()
        .filter(
          (entry) =>
            entry.type.startsWith("stress_") && entry.type !== "stress_inventory_projection",
        );
      expect(stress.length).toBeGreaterThan(0);
      for (const decision of stress) {
        const chain = decisionChain(utterance.provenance, decision.id);
        expect(chain.some((entry) => entry.type.endsWith("pronunciation_selected"))).toBe(true);
        expect(chain.filter((entry) => entry.recognition)).toHaveLength(1);
      }
      expect(
        utterance
          .relation("Segment")
          .listItems()
          .some((item) => item.get("stress") === 2),
      ).toBe(true);
      expect(
        utterance
          .relation("Syllable")
          .listItems()
          .some((item) => item.get("stress") === 2),
      ).toBe(true);
    }
  });

  it.each(["hello world.", "can't John's dogs'", "/b/", "celebration"])(
    "retains dictionary, clitic and explicit-pronunciation controls: %s",
    (text) => {
      const actual = textToKlattTrackDetailed(text, 110, 30, {
        frontendPath: fixturePath,
      }).utterance;
      const expected = textToKlattTrackDetailed(text, 110).utterance;
      const phones = (graph: Utterance) =>
        graph
          .relation("Segment")
          .listItems()
          .map((item) => [item.get("phoneme"), item.get("stress")]);
      expect(phones(actual)).toEqual(phones(expected));
    },
  );
});
