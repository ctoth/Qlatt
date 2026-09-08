import { expect, it, vi } from "vitest";
import * as inventoryModule from "../src/declarative-frontend/inventory";
import {
  loadInventorySpecFromPath,
  materializePhonemeTarget,
  parseInventorySpec,
} from "../src/declarative-frontend/inventory";
import * as rulepackModule from "../src/declarative-frontend/rule-pack";
import { createDiagnostics } from "../src/diagnostics";
import { syllabify } from "../src/g2p/syllabify";
import { createProvenanceCollector } from "../src/provenance";
import { transcribeText } from "../src/transcribe-text";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import * as yamlModule from "../src/yaml-loader";

const base = loadInventorySpecFromPath("/rules/frontends/qlatt-english/inventory.yaml");

it("materializes a declared nucleus class and stress suffix with the declared duration", () => {
  const inventory = {
    ...base,
    silence_symbol: "pause",
    nucleus_types: ["nucleus"],
    stress_markers: { 0: "_weak", 1: "_strong", 2: "_secondary" },
    default_duration_ms: 47,
    phoneme_targets: { ə_strong: { type: "nucleus", F1: 420 }, pause: { dur: 60 } },
  };
  expect(materializePhonemeTarget("ə", { stress: 1, inventorySpec: inventory })).toMatchObject({
    phoneme: "ə_strong",
    duration: 47,
    params: { F1: 420 },
  });
});

it("rejects an undeclared cross-stress fallback", () => {
  const inventory = { ...base, phoneme_targets: { AH1: base.phoneme_targets.AH1 } };
  expect(() => materializePhonemeTarget("AH", { stress: 0, inventorySpec: inventory })).toThrow(
    /E_STRESS_TARGET/,
  );
});

it("records and diagnoses a pronunciation symbol rejected by the selected grammar", () => {
  const provenance = createProvenanceCollector();
  const diagnostics = createDiagnostics();
  const tokens = transcribeText("hello", {
    provenance,
    diagnostics,
    dictLookup: () => ["HH", "bad!", "OW1"],
  });
  expect(tokens.map((token) => token.phoneme)).toEqual(["HH", "OW"]);
  const pronunciation = provenance
    .getDecisions()
    .find((d) => d.type === "dictionary_pronunciation_selected");
  const rejection = provenance.getDecisions().find((d) => d.type === "phoneme_symbol_rejected");
  expect(rejection?.parents).toContain(pronunciation?.id);
  expect(rejection?.citations).toContain("/rules/frontends/qlatt-english/inventory.yaml");
  expect(diagnostics.getEntries()).toEqual(
    expect.arrayContaining([expect.objectContaining({ code: "PHONEME_SYMBOL_REJECTED" })]),
  );
});

it("keeps multi-character onset symbols distinct", () => {
  const spy = vi
    .spyOn(yamlModule, "loadYamlDocumentSync")
    .mockReturnValue({ vowels: ["A"], legal_onsets: ["TH R"] });
  try {
    expect(syllabify(["A", "TH", "R", "A"], "/fixture/onset-collision.yaml")).toEqual([
      ["A"],
      ["TH", "R", "A"],
    ]);
    expect(syllabify(["A", "T", "HR", "A"], "/fixture/onset-collision.yaml")).toEqual([
      ["A", "T"],
      ["HR", "A"],
    ]);
  } finally {
    spy.mockRestore();
  }
});

// Rename vocabulary in both inventory and declarative rules, leaving function
// names (e.g. count_word_vowels) intact. This is a fixture frontend, not a
// production compatibility alias.
function renameVocabulary(value: unknown): unknown {
  if (typeof value === "string")
    return value.replace(/\bSIL\b/g, "pause").replace(/\bvowel\b/g, "nucleus");
  if (Array.isArray(value)) return value.map(renameVocabulary);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [renameVocabulary(key), renameVocabulary(entry)]),
    );
  return value;
}

it("preserves prosody and silence edges for a fixture frontend with renamed acoustic vocabulary", () => {
  const phrase = "The little bird sings. A cat sleeps.";
  const control = textToKlattTrackDetailed(phrase);
  const spec = rulepackModule.loadBundledRulepackSpec("qlatt-english");
  const resources = inventoryModule.loadFrontendResources(spec);
  const alternate = renameVocabulary(spec) as typeof spec;
  const alternateInventory = renameVocabulary(resources.inventory) as typeof resources.inventory;
  const specSpy = vi.spyOn(rulepackModule, "loadBundledRulepackSpec").mockReturnValue(alternate);
  const resourceSpy = vi
    .spyOn(inventoryModule, "loadFrontendResources")
    .mockReturnValue({ ...resources, inventory: alternateInventory });
  try {
    const result = textToKlattTrackDetailed(phrase);
    expect(result.track.map(({ time, phoneme, params }) => ({ time, phoneme, params }))).toEqual(
      control.track.map(({ time, phoneme, params }) => ({
        time,
        phoneme: phoneme === "SIL" ? "pause" : phoneme,
        params,
      })),
    );
    expect(result.track.some((frame) => frame.phoneme === "pause")).toBe(true);
    expect(result.track.at(-1)?.phoneme).toBe("pause");
  } finally {
    specSpy.mockRestore();
    resourceSpy.mockRestore();
  }
});

it("transcribes a Unicode alphabet and custom stress markers without altering phone identity", () => {
  const spec = rulepackModule.loadBundledRulepackSpec("qlatt-english");
  const resources = inventoryModule.loadFrontendResources(spec);
  const inventory = {
    ...base,
    silence_symbol: "pause",
    symbol_grammar: "[əŋ]+",
    stress_markers: { 0: "_weak", 1: "_strong", 2: "_secondary" },
  };
  const spy = vi
    .spyOn(inventoryModule, "loadFrontendResources")
    .mockReturnValue({ ...resources, inventory });
  try {
    const result = transcribeText("hello .", { dictLookup: () => ["ə_strong", "ŋ"] });
    expect(result.map(({ phoneme, stress }) => ({ phoneme, stress }))).toEqual([
      { phoneme: "ə", stress: 1 },
      { phoneme: "ŋ", stress: null },
      { phoneme: "pause", stress: null },
    ]);
  } finally {
    spy.mockRestore();
  }
});

it.each([
  ["silence_symbol", "absent"],
  ["nucleus_types", []],
  ["symbol_grammar", "["],
  ["stress_markers", { 0: "0", 1: "0", 2: "2" }],
  ["default_duration_ms", 0],
])("rejects invalid %s declarations at load time", (key, value) => {
  expect(() => parseInventorySpec(JSON.stringify({ ...base, [key]: value }))).toThrow(
    /E_INVENTORY_SCHEMA/,
  );
});

it("loads a renamed silence target without requiring the English silence label", () => {
  const inventory = renameVocabulary(base);
  expect(parseInventorySpec(JSON.stringify(inventory)).silence_symbol).toBe("pause");
});
