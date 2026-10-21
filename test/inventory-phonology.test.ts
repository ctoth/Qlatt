/**
 * An inventory layered over a phonology document (`phonology_path`):
 * docs/inventory-conventions.md, "Layering an inventory over a phonology
 * document". The phonology document is the language's phoneme class table and
 * symbol conventions; the inventory is a voice's acoustic targets.
 */

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inventoryPhonologyPath, parseInventorySpec } from "../src/declarative-frontend/inventory";
import {
  loadBundledRulepackSpec,
  loadFrontendResources,
  loadInventorySpecFromPath,
  preloadInventorySpecFromPath,
} from "../src/declarative-frontend/rule-pack";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const PHONOLOGY_PATH = "/fixture/phonology.yaml";

const phonology = {
  version: "v1",
  silence_symbol: "SIL",
  nucleus_types: ["vowel"],
  symbol_grammar: "[A-Z]+",
  stress_markers: { 0: "0", 1: "1", 2: "2" },
  phoneme_targets: {
    SIL: { type: "silence" },
    AA1: { type: "vowel", low: true, back: true, dac: 2 },
    S: { type: "fricative", voiceless: true, alveolar: true },
  },
};

const voice = {
  version: "v1",
  target_feature_exclusions: ["dur", "SW", "type"],
  phonology_path: PHONOLOGY_PATH,
  default_duration_ms: 30,
  citations: ["Fixture voice"],
  base_params: { F1: 500, AV: 0 },
  phoneme_targets: {
    SIL: { dur: 50 },
    AA1: { F1: 768, AV: 64, dur: 240 },
    S: { F1: 320, dur: 100 },
  },
};

type Doc = Record<string, unknown>;
const parse = (inventory: Doc, phonologyDoc: Doc = phonology) =>
  parseInventorySpec(JSON.stringify(inventory), JSON.stringify(phonologyDoc));
/** The same inventory written as one document, the form without the key. */
const flat = (): Doc => {
  const { phonology_path: _path, ...own } = voice;
  const { version: _version, phoneme_targets: classes, ...conventions } = phonology;
  return {
    ...own,
    ...conventions,
    phoneme_targets: Object.fromEntries(
      Object.entries(voice.phoneme_targets).map(([key, target]) => [
        key,
        { ...target, ...classes[key as keyof typeof classes] },
      ]),
    ),
  };
};

describe("inventory layered over a phonology document", () => {
  it("gives each target its own fields and the phonology document's", () => {
    const spec = parse(voice);
    expect(spec.phoneme_targets.AA1).toEqual({
      F1: 768,
      AV: 64,
      dur: 240,
      type: "vowel",
      low: true,
      back: true,
      dac: 2,
    });
    expect(spec.silence_symbol).toBe("SIL");
    expect(spec.nucleus_types).toEqual(["vowel"]);
    expect(spec.symbol_grammar).toBe("[A-Z]+");
    expect(spec.stress_markers).toEqual({ 0: "0", 1: "1", 2: "2" });
    expect(spec.base_params).toEqual({ F1: 500, AV: 0 });
    expect(inventoryPhonologyPath(spec)).toBe(PHONOLOGY_PATH);
  });

  it("is the inventory the two documents make written as one", () => {
    const single = parseInventorySpec(JSON.stringify(flat()));
    expect(parse(voice)).toEqual(single);
    expect(Object.keys(single)).not.toContain("phonology_path");
    expect(Object.keys(parse(voice))).toEqual(Object.keys(single));
    expect(inventoryPhonologyPath(single)).toBeUndefined();
  });

  it("rejects a field both documents give a target", () => {
    const both = {
      ...voice,
      phoneme_targets: { ...voice.phoneme_targets, S: { F1: 320, dur: 100, voiceless: true } },
    };
    expect(() => parse(both)).toThrow(
      /E_INVENTORY_PHONOLOGY_CONFLICT.*phoneme_targets\.S\.voiceless/,
    );
  });

  it("rejects a convention key both documents declare", () => {
    expect(() => parse({ ...voice, silence_symbol: "SIL" })).toThrow(
      /E_INVENTORY_PHONOLOGY_CONFLICT.*silence_symbol/,
    );
  });

  it("rejects an inventory target the phonology document does not declare", () => {
    const extra = {
      ...voice,
      phoneme_targets: { ...voice.phoneme_targets, ZZ: { F1: 300, dur: 80 } },
    };
    expect(() => parse(extra)).toThrow(/E_INVENTORY_PHONOLOGY_TARGET.*ZZ/);
  });

  it("leaves a phoneme the inventory gives no target out of the inventory", () => {
    const { S: _fricative, ...targets } = voice.phoneme_targets;
    const spec = parse({ ...voice, phoneme_targets: targets });
    expect(Object.keys(spec.phoneme_targets).sort()).toEqual(["AA1", "SIL"]);
  });

  it("rejects a phonology document that holds anything but conventions and classes", () => {
    expect(() => parse(voice, { ...phonology, base_params: { F1: 500 } })).toThrow(
      /E_INVENTORY_PHONOLOGY_SCHEMA.*base_params/,
    );
    expect(() => parse(voice, { ...phonology, phoneme_targets: { SIL: "silence" } })).toThrow(
      /E_INVENTORY_PHONOLOGY_SCHEMA.*phoneme_targets\.SIL/,
    );
    const { phoneme_targets: _classes, ...conventionsOnly } = phonology;
    expect(() => parse(voice, conventionsOnly)).toThrow(/E_INVENTORY_PHONOLOGY_SCHEMA/);
  });

  it("rejects an invalid phonology_path or missing supplied phonology source", () => {
    expect(() => parse({ ...voice, phonology_path: 7 })).toThrow(/E_INVENTORY_PHONOLOGY_PATH/);
    expect(() => parseInventorySpec(JSON.stringify(voice))).toThrow(
      /E_INVENTORY_PHONOLOGY_PATH.*\/fixture\/phonology\.yaml.*supplied phonology source/,
    );
  });

  it("still requires the conventions from one of the two documents", () => {
    const { silence_symbol: _silence, ...withoutSilence } = phonology;
    expect(() => parse(voice, withoutSilence)).toThrow(/E_INVENTORY_SCHEMA: silence_symbol/);
  });
});

describe("the inventory loaders read the phonology document", () => {
  const withFiles = async (
    phonologyDoc: Doc | null,
    run: (inventoryPath: string, phonologyPath: string) => void | Promise<void>,
  ) => {
    const directory = mkdtempSync(join(tmpdir(), "qlatt-inventory-phonology-"));
    const phonologyPath = join(directory, "phonology.yaml");
    const inventoryPath = join(directory, "inventory.yaml");
    try {
      if (phonologyDoc) writeFileSync(phonologyPath, JSON.stringify(phonologyDoc));
      writeFileSync(inventoryPath, JSON.stringify({ ...voice, phonology_path: phonologyPath }));
      await run(inventoryPath, phonologyPath);
    } finally {
      rmSync(directory, { recursive: true });
    }
  };

  it("synchronously, by the inventory's path", () =>
    withFiles(phonology, (inventoryPath, phonologyPath) => {
      const spec = loadInventorySpecFromPath(inventoryPath);
      expect(spec.phoneme_targets.S).toEqual({
        F1: 320,
        dur: 100,
        type: "fricative",
        voiceless: true,
        alveolar: true,
      });
      expect(inventoryPhonologyPath(spec)).toBe(phonologyPath);
    }));

  it("asynchronously, to the same inventory", () =>
    withFiles(phonology, async (inventoryPath, phonologyPath) => {
      const spec = await preloadInventorySpecFromPath(inventoryPath);
      expect(spec).toEqual(parse(voice));
      expect(inventoryPhonologyPath(spec)).toBe(phonologyPath);
      // The synchronous loader then returns the preloaded inventory.
      expect(loadInventorySpecFromPath(inventoryPath)).toBe(spec);
    }));

  it("and fail when the phonology document is missing", () =>
    withFiles(null, async (inventoryPath) => {
      expect(() => loadInventorySpecFromPath(inventoryPath)).toThrow(/E_INVENTORY_PHONOLOGY_PATH/);
      await expect(preloadInventorySpecFromPath(inventoryPath)).rejects.toThrow(
        /E_INVENTORY_PHONOLOGY_PATH/,
      );
    }));
});

describe("the bundled inventories", () => {
  const ENGLISH_PHONOLOGY = "/rules/languages/english/phonology.yaml";
  const resources = (frontendId: string) =>
    loadFrontendResources(loadBundledRulepackSpec(frontendId));
  // The fields the phonology document holds: the class of a phoneme, never a
  // target value of a voice.
  const PHONOLOGICAL = [
    "type",
    "voiced",
    "voiceless",
    "is_obstruent",
    "is_stop_base",
    "is_back_rounded",
    "hi",
    "mid",
    "low",
    "front",
    "central",
    "back",
    "rhotic",
    "diph",
    "bilabial",
    "labiodental",
    "dental",
    "alveolar",
    "postalveolar",
    "palatal",
    "velar",
    "labiovelar",
    "glottal",
    "nasal_segment",
    "nasal_place",
    "nasal_place_index",
    "dac",
  ];

  it("qlatt-english and qlatt-beauty layer their targets over one phonology document", () => {
    const english = resources("qlatt-english");
    const beauty = resources("qlatt-beauty");
    expect(inventoryPhonologyPath(english.inventory)).toBe(ENGLISH_PHONOLOGY);
    expect(inventoryPhonologyPath(beauty.inventory)).toBe(ENGLISH_PHONOLOGY);
    expect(english.inventoryDocuments).toEqual([english.inventoryPath, ENGLISH_PHONOLOGY]);
    expect(beauty.inventoryDocuments).toEqual([beauty.inventoryPath, ENGLISH_PHONOLOGY]);
    expect(Object.keys(beauty.inventory.phoneme_targets).sort()).toEqual(
      Object.keys(english.inventory.phoneme_targets).sort(),
    );
    for (const [key, target] of Object.entries(english.inventory.phoneme_targets)) {
      const other = beauty.inventory.phoneme_targets[key];
      expect(typeof target.type).toBe("string");
      for (const field of PHONOLOGICAL)
        expect(other[field], `${key}.${field}`).toEqual(target[field]);
    }
  });

  it("qlatt-beauty takes none of qlatt-english's own target data", () => {
    const beauty = resources("qlatt-beauty").inventory;
    const english = resources("qlatt-english").inventory;
    const englishOnly = [
      "boundary_rank",
      "boundary_fixed",
      "boundary_proportion",
      "boundary_external_ms",
      "boundary_internal_ms",
      "boundary_citations",
      "Ac",
      "Ug",
      "fricPressureExponent",
      "fricAreaExponent",
      "fricFrontCavityCm",
      "fricCavityQ",
      "fricReferenceDb",
      "fricParallelReferenceDb",
      "F4",
      "duration_model",
    ];
    for (const field of englishOnly) {
      const has = (targets: Record<string, Record<string, unknown>>) =>
        Object.values(targets).filter((target) => Object.hasOwn(target, field)).length;
      expect(has(english.phoneme_targets), `qlatt-english ${field}`).toBeGreaterThan(0);
      expect(has(beauty.phoneme_targets), `qlatt-beauty ${field}`).toBe(0);
    }
  });

  it("dectalk-english names no phonology document and is one document", () => {
    const dectalk = resources("dectalk-english");
    expect(inventoryPhonologyPath(dectalk.inventory)).toBeUndefined();
    expect(dectalk.inventoryDocuments).toEqual([dectalk.inventoryPath]);
  });

  it.each([
    ["qlatt-english", [ENGLISH_PHONOLOGY]],
    ["qlatt-beauty", [ENGLISH_PHONOLOGY]],
    ["dectalk-english", []],
  ])("%s: inventory decisions cite every document the targets come from", (frontendId, extra) => {
    const provenance = createProvenanceCollector();
    textToKlattTrackDetailed("See.", undefined, 30, { frontendId, provenance });
    const { inventoryPath } = resources(frontendId);
    const decisions = provenance.getDecisions();
    const selected = decisions.find((decision) => decision.type === "inventory_selected");
    expect(selected?.citations?.slice(0, 1 + extra.length)).toEqual([inventoryPath, ...extra]);
    const targets = decisions.filter((decision) => decision.type === "inventory_target_selected");
    expect(targets.length).toBeGreaterThan(0);
    for (const decision of targets) {
      expect(decision.citations?.slice(0, 1 + extra.length)).toEqual([inventoryPath, ...extra]);
      if (extra.length === 0) expect(decision.citations).not.toContain(ENGLISH_PHONOLOGY);
    }
    const silence = decisions.find((decision) => decision.type === "silence_resource_selected");
    expect(silence?.citations).toEqual([inventoryPath, ...extra]);
  });
});
