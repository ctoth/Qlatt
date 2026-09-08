import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { decisionChain, replayJournal, Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import {
  compileRuleEngineSpec,
  loadRulepackSpecFromPath,
  resolveBundledRulepackPath,
} from "../src/declarative-frontend/rule-pack";
import {
  NORMALIZATION_SCHEMA,
  normalizeSourceItems,
  recognizeText,
} from "../src/declarative-frontend/source-recognition";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import * as yamlLoader from "../src/yaml-loader";

function fixture(output: string, text = "Dr.") {
  const spec = compileRuleEngineSpec({
    normalization: {
      phases: ["normalization"],
    },
    transcription: { punctuation_tokens: ["."] },
    text_recognition: {
      rules: [
        {
          id: "source",
          pattern: "Dr\\.",
          flags: "",
          class: "abbreviation",
          captures: {},
          when: "true",
          speak: "current.text",
          vocabulary_keys: "[]",
          citations: ["Issue #143"],
        },
      ],
      unmatched: { speak: "current.text", vocabulary_keys: "[]", citations: ["Issue #143"] },
    },
    relations: { Normalization: { type: "base", features: { text: [], active: [true, false] } } },
    rules: {
      expand: {
        select: { relation: "Normalization", where: "current.text == 'Dr.'" },
        expand_text: { output, allowed_types: ["terminal", "request"], tag: "normalization" },
        citations: ["Issue #143"],
      },
    },
    phases: [{ name: "normalization", rules: ["expand"] }],
  });
  const utterance = new Utterance(NORMALIZATION_SCHEMA);
  recognizeText(text, utterance, spec);
  return { utterance, spec };
}

describe("untimed text expansion", () => {
  it("attributes inherited and overridden vocabulary keys to their actual resources", () => {
    const { utterance, spec } = fixture(
      "['kept', 'changed'].map(key, {'type': 'terminal', 'text': vocabulary('words', key)})",
    );
    const basePath = resolveBundledRulepackPath("qlatt-english");
    const output = loadRulepackSpecFromPath(basePath).output;
    const childPath = "/fixture-vocabulary-origins.yaml";
    const originalLoad = yamlLoader.loadYamlSourceSync;
    const mock = vi.spyOn(yamlLoader, "loadYamlSourceSync").mockImplementation((path) => {
      if (path === basePath)
        return JSON.stringify({
          ...spec,
          output,
          tags: { normalization: "Normalization fixture" },
          maps: { words: { kept: "base", changed: "old" } },
        });
      if (path === childPath)
        return JSON.stringify({ extends: "qlatt-english", maps: { words: { changed: "child" } } });
      return originalLoad(path);
    });
    try {
      runGraphRuleEngine(utterance, loadRulepackSpecFromPath(childPath));
      const lookups = utterance.provenance
        .getDecisions()
        .flatMap((decision) => (decision.vocabularyLookup ? [decision.vocabularyLookup] : []));
      expect(lookups).toEqual([
        expect.objectContaining({ key: "kept", value: "base", resource: basePath }),
        expect.objectContaining({ key: "changed", value: "child", resource: childPath }),
      ]);
    } finally {
      mock.mockRestore();
    }
  });
  it("reports missing vocabulary without changing the graph", () => {
    const { utterance, spec } = fixture(
      "[{'type': 'terminal', 'text': vocabulary('missing', 'word')}]",
    );
    const digest = utterance.graphDigest();
    expect(() => runGraphRuleEngine(utterance, spec)).toThrow(/E_VOCABULARY_LOOKUP/);
    expect(utterance.graphDigest()).toBe(digest);
    expect(utterance.diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        level: "error",
        code: "E_VOCABULARY_LOOKUP",
      }),
    );
  });
  it("selects adjacent matches once and does not recursively expand its output", () => {
    const { utterance, spec } = fixture("[{'type': 'terminal', 'text': 'Dr.'}]", "Dr.Dr.");
    runGraphRuleEngine(utterance, spec);
    const items = utterance.relation("Normalization").listItems();
    expect(items).toHaveLength(4);
    expect(
      items.filter((item) => item.get("active") === true).map((item) => item.get("sourceStart")),
    ).toEqual([0, 3]);
    expect(items.map((item) => item.id)).toEqual([
      "normalization_0",
      "normalization_0:expand:0",
      "normalization_1",
      "normalization_1:expand:0",
    ]);
  });
  it("tracks actual included vocabulary reads through terminal Tokens and pronunciation", () => {
    const path = resolve("test/fixtures/source-recognition/expansion-frontend.yaml").replaceAll(
      "\\",
      "/",
    );
    const { utterance } = textToKlattTrackDetailed("Dr.", 110, 30, { frontendPath: path });
    expect(
      utterance
        .relation("Token")
        .listItems()
        .map((item) => item.get("word")),
    ).toEqual(["doctor", "of", "medicine"]);
    const pronunciation = utterance.provenance
      .getDecisions()
      .find((entry) => entry.type.endsWith("pronunciation_selected"))!;
    const lookup = decisionChain(utterance.provenance, pronunciation.id).find(
      (entry) => entry.vocabularyLookup,
    )!;
    expect(lookup.vocabularyLookup).toMatchObject({
      table: "expansion_abbreviations",
      key: "dr.",
      value: "doctor of medicine",
    });
    expect(lookup.vocabularyLookup?.resource).toMatch(/source-recognition\/expansion.yaml$/);
    const replayed = replayJournal(
      utterance.schemaDefinition(),
      utterance.journal(),
      utterance.provenance.getDecisions(),
    );
    expect(
      replayed.provenance.getDecisions().find((entry) => entry.id === lookup.id)?.vocabularyLookup,
    ).toEqual(lookup.vocabularyLookup);
    const original = loadRulepackSpecFromPath(path);
    const altered = compileRuleEngineSpec({
      ...original,
      maps: {
        ...(original.maps as Record<string, unknown>),
        expansion_abbreviations: { "dr.": "medical practitioner" },
      },
    });
    const graph = new Utterance(NORMALIZATION_SCHEMA);
    recognizeText("Dr.", graph, altered);
    expect(normalizeSourceItems(graph, altered).map((entry) => entry.word)).toEqual([
      "medical",
      "practitioner",
    ]);
  });
  it("expands a CEL list in order and preserves suppressed history and source ancestry on replay", () => {
    const { utterance, spec } = fixture(
      "['doctor', 'smith'].map(w, {'type': 'terminal', 'text': w})",
    );
    runGraphRuleEngine(utterance, spec);
    const items = utterance.relation("Normalization").listItems();
    expect(items.map((item) => item.get("text"))).toEqual(["Dr.", "doctor", "smith"]);
    expect(items[0].get("active")).toBe(false);
    expect(items.slice(1).map((item) => [item.get("sourceStart"), item.get("sourceEnd")])).toEqual([
      [0, 3],
      [0, 3],
    ]);
    expect(items.every((item) => utterance.intervalAnchor(item) === undefined)).toBe(true);
    expect(
      replayJournal(
        utterance.schemaDefinition(),
        utterance.journal(),
        utterance.provenance.getDecisions(),
      ).graphDigest(),
    ).toBe(utterance.graphDigest());
  });

  it("allows an empty expansion without losing source history", () => {
    const { utterance, spec } = fixture("[]");
    runGraphRuleEngine(utterance, spec);
    expect(
      utterance
        .relation("Normalization")
        .listItems()
        .map((item) => item.get("active")),
    ).toEqual([false]);
  });

  it("hands off terminal words and rejects unresolved reading requests", () => {
    const terminal = fixture("[{'type': 'terminal', 'text': 'doctor'}]");
    expect(
      normalizeSourceItems(terminal.utterance, terminal.spec).map((entry) => entry.word),
    ).toEqual(["doctor"]);
    const request = fixture(
      "[{'type': 'request', 'kind': 'cardinal', 'payload': {'value': '42'}}]",
    );
    expect(() => normalizeSourceItems(request.utterance, request.spec)).toThrow(
      /E_NORMALIZATION_UNRESOLVED/,
    );
  });

  it.each([
    "'word'",
    "[{'type': 'terminal', 'text': 4}]",
    "[{'type': 'terminal', 'text': 'two words'}]",
    "[{'type': 'segment', 'text': 'word'}]",
    "[{'type': 'request', 'kind': '', 'payload': {}}]",
  ])("rejects malformed output without mutation: %s", (output) => {
    const { utterance, spec } = fixture(output);
    const digest = utterance.graphDigest();
    expect(() => runGraphRuleEngine(utterance, spec)).toThrow(/E_TEXT_EXPANSION/);
    expect(utterance.graphDigest()).toBe(digest);
  });
});
