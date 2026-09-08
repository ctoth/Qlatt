import { expect, it, vi } from "vitest";
import * as inventoryModule from "../src/declarative-frontend/inventory";
import {
  type InventorySpec,
  materializePhonemeTarget,
} from "../src/declarative-frontend/inventory";
import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import { transcribeText } from "../src/transcribe-text";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

it.each([
  ["AH", 1, "AH1", "AH1"],
  ["AH", 0, "AH1", "AH1"],
  ["AH", 1, "AH0", "AH0"],
  ["AH", null, "AH0", "AH0"],
  ["S", 0, "S1", "S"],
  ["S", 1, "S0", "S"],
  ["S", null, "S", "S"],
  ["AX", 1, "SIL", "AX"],
  ["SIL", undefined, "SIL", "SIL"],
] as const)(
  "exposes %s stress %s selecting %s without changing identity",
  (phone, stress, key, identity) => {
    const inventory: InventorySpec = {
      base_params: { F1: 500 },
      normalization_aliases: { AX: "SIL" },
      phoneme_targets: {
        SIL: { dur: 50 },
        [key]: { type: phone === "AH" ? "vowel" : "consonant", F1: 700, dur: 80 },
      },
    };
    const selections: unknown[] = [];
    const result = materializePhonemeTarget(phone, {
      inventorySpec: inventory,
      ...(stress === undefined ? {} : { stress }),
      onSelection: (selection) => selections.push(selection),
    });
    expect(result.phoneme).toBe(identity);
    expect(result.params.F1).toBe(700);
    expect(selections).toEqual([
      expect.objectContaining({ inputPhone: phone, selectedKey: key, stress: stress ?? null }),
    ]);
  },
);

it("warns for invalid supplied parameters, but not base inheritance", () => {
  const diagnostics = createDiagnostics();
  const inventory: InventorySpec = {
    base_params: { F1: 500, F2: 1500 },
    phoneme_targets: { SIL: {}, S: { F1: "bad" } },
  };
  expect(
    materializePhonemeTarget("S", { inventorySpec: inventory, diagnostics }).params,
  ).toMatchObject({ F1: 500, F2: 1500 });
  expect(diagnostics.getEntries()).toEqual([
    expect.objectContaining({
      level: "warn",
      code: "INVENTORY_PARAMETER_FALLBACK",
      data: expect.objectContaining({
        count: 1,
        affected: [
          expect.objectContaining({
            parameter: "F1",
            supplied: "bad",
            applied: 500,
            selectedKey: "S",
          }),
        ],
      }),
    }),
  ]);
  diagnostics.clear();
  materializePhonemeTarget("SIL", { inventorySpec: inventory, diagnostics });
  expect(diagnostics.getEntries()).toEqual([]);
  expect(() =>
    materializePhonemeTarget("UNKNOWN", { inventorySpec: inventory, diagnostics }),
  ).toThrow(/E_INVENTORY_PHONEME_UNKNOWN/);
  expect(diagnostics.getEntries()).toEqual([]);
});

it("bounds expected dictionary misses and retains cited pronunciation decisions", () => {
  const diagnostics = createDiagnostics();
  const provenance = createProvenanceCollector();
  const tokens = transcribeText(Array(250).fill("blorf").join(" "), {
    diagnostics,
    provenance,
    dictionaryMap: {},
    dictLookup: () => null,
  });
  expect(tokens.filter((token) => token.phoneme !== "SIL").length).toBeGreaterThan(250);
  const entries = diagnostics
    .getEntries()
    .filter((entry) => entry.code === "G2P_DICTIONARY_FALLBACK");
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatchObject({
    level: "info",
    data: {
      count: 250,
      affected: expect.arrayContaining([
        expect.objectContaining({ word: "blorf", token: "token_249" }),
      ]),
    },
  });
  expect(
    provenance.getDecisions().filter((d) => d.type === "fallback_pronunciation_selected"),
  ).toHaveLength(250);
});

it("warns when an empty dictionary pronunciation becomes SIL, with an exact lookup control", () => {
  const diagnostics = createDiagnostics();
  const tokens = transcribeText("hello lost", {
    diagnostics,
    dictLookup: (word) => (word === "hello" ? ["HH", "EH1", "L", "OW0"] : []),
  });
  expect(tokens.at(-1)).toMatchObject({
    phoneme: "SIL",
    duration: 50,
    word: "lost",
    sourceTokenId: "token_1",
  });
  expect(diagnostics.getEntries()).toEqual([
    expect.objectContaining({
      level: "warn",
      code: "EMPTY_PRONUNCIATION_SILENCE",
      data: {
        count: 1,
        affected: [{ word: "lost", token: "token_1", applied: "SIL", duration: 50 }],
      },
    }),
  ]);
});

it("records one cited target selection per initial segment and preserves secondary ancestry", () => {
  const provenance = createProvenanceCollector();
  textToKlattTrackDetailed("celebration", undefined, 30, { provenance });
  const decisions = provenance.getDecisions();
  const selections = decisions.filter((d) => d.type === "inventory_target_selected");
  expect(selections.length).toBeGreaterThan(0);
  expect(new Set(selections.map((d) => d.subject)).size).toBe(selections.length);
  for (const selection of selections) {
    expect(selection.inventorySelection?.selectedKey).toBeTruthy();
    expect(selection.reason).toContain("token_0");
    expect(selection.citations.length).toBeGreaterThan(0);
    expect(selection.parents?.length).toBeGreaterThan(0);
  }
  const projections = decisions.filter((d) => d.type === "stress_inventory_projection");
  expect(projections.length).toBeGreaterThan(0);
  for (const projection of projections) {
    expect(selections.find((s) => s.subject === projection.subject)?.parents).toContain(
      projection.id,
    );
  }
});

it("aggregates invalid targets across a frontend run and resets for the next run", () => {
  const original = inventoryModule.materializePhonemeTarget;
  const spy = vi
    .spyOn(inventoryModule, "materializePhonemeTarget")
    .mockImplementation((phone, options) =>
      original(phone, {
        ...options,
        inventorySpec: {
          ...options.inventorySpec,
          phoneme_targets: Object.fromEntries(
            Object.entries(options.inventorySpec.phoneme_targets).map(([key, target]) => [
              key,
              { ...target, F1: "invalid" },
            ]),
          ),
        },
      }),
    );
  const diagnostics = createDiagnostics();
  try {
    const { track } = textToKlattTrackDetailed("hello hello", undefined, 30, { diagnostics });
    expect(track.length).toBeGreaterThan(0);
    const entries = diagnostics
      .getEntries()
      .filter((entry) => entry.code === "INVENTORY_PARAMETER_FALLBACK");
    expect(entries).toHaveLength(1);
    expect(entries[0].data).toMatchObject({
      affected: expect.arrayContaining([
        expect.objectContaining({ token: "token_0", supplied: "invalid", parameter: "F1" }),
        expect.objectContaining({ token: "token_1", supplied: "invalid", parameter: "F1" }),
      ]),
    });
  } finally {
    spy.mockRestore();
  }
  diagnostics.clear();
  textToKlattTrackDetailed("hello hello", undefined, 30, { diagnostics });
  expect(
    diagnostics.getEntries().filter((entry) => entry.code === "INVENTORY_PARAMETER_FALLBACK"),
  ).toEqual([]);
});

it.each([false, true])("reports the real secondary target for an alias (exact=%s)", (exact) => {
  const selections: unknown[] = [];
  const result = materializePhonemeTarget("AX", {
    stress: 2,
    inventorySpec: {
      base_params: { F1: 500 },
      normalization_aliases: { AX: "AH" },
      secondary_stress_fallback: { target: 1, citations: ["test policy"] },
      phoneme_targets: {
        SIL: {},
        AH1: { type: "vowel", F1: 700 },
        ...(exact ? { AH2: { type: "vowel", F1: 800 } } : {}),
      },
    },
    onSelection: (selection) => selections.push(selection),
  });
  expect(result.phoneme).toBe("AX");
  expect(result.params.F1).toBe(exact ? 800 : 700);
  expect(selections).toEqual([
    expect.objectContaining({
      inputPhone: "AX",
      stress: 2,
      lookupKey: "AH",
      selectedKey: exact ? "AH2" : "AH1",
      secondaryStressFallback: !exact,
    }),
  ]);
});
