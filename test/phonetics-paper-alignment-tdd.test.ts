import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";
import { annotateProsody } from "../src/prosodic-annotator";
import { loadTuneGrammarSync } from "../src/tune-grammar";
import { qlattInventoryResolver } from "./utils/qlatt-english-inventory";

type MinimalToken = Record<string, unknown>;

function phone(
  phoneme: string,
  word: string,
  stress: number | null = null,
  type: string = "vowel",
): MinimalToken {
  return { phoneme, word, stress, type, params: {} };
}

function sil(punctuation?: string): MinimalToken {
  return {
    phoneme: "SIL",
    word: "",
    stress: null,
    type: "silence",
    punctuationSymbol: punctuation ?? null,
    params: {},
  };
}

function getActivePhoneTokens(result: Record<string, unknown>[]) {
  return result.filter((token) => (token.stream === "phone" || token.stream == null) && token.status !== 2);
}

describe("phonetics paper-alignment TDDs", () => {
  it("restricts tune-grammar pitch accents to the MAE-ToBI core inventory", () => {
    const grammar = loadTuneGrammarSync();
    const allowedAccents = new Set(["H*", "L*", "L+H*", "L*+H", "H+!H*"]);

    const configuredAccents = new Set<string>();
    for (const spec of Object.values(grammar.phrase_types)) {
      configuredAccents.add(spec.prenuclear.first);
      configuredAccents.add(spec.prenuclear.later);
      configuredAccents.add(spec.nuclear.with_prenuclear);
      configuredAccents.add(spec.nuclear.without_prenuclear);
    }

    expect([...configuredAccents].sort()).toEqual([...allowedAccents].sort());
  });

  it("emits only MAE-ToBI accent labels during prosodic annotation", () => {
    const allowedAccents = new Set(["H*", "L*", "L+H*", "L*+H", "H+!H*"]);
    const phrases: MinimalToken[][] = [
      [
        sil(),
        phone("HH", "high", 1, "glide"),
        phone("AY", "high", 1),
        phone("T", "tea", null, "stop"),
        phone("IY", "tea", 1),
        sil("."),
      ],
      [
        sil(),
        phone("K", "cat", null, "stop"),
        phone("AE", "cat", 1),
        phone("T", "cat", null, "stop"),
        phone("S", "sat", null, "fricative"),
        phone("AE", "sat", 1),
        phone("T", "sat", null, "stop"),
        sil(","),
      ],
    ];

    for (const tokens of phrases) {
      const annotated = annotateProsody(tokens);
      const accentTypes = annotated
        .map((token) => (typeof token.accentType === "string" ? token.accentType : null))
        .filter((value): value is string => value != null);

      for (const accentType of accentTypes) {
        expect(allowedAccents.has(accentType)).toBe(true);
      }
    }
  });

  it("uses voiced stop release durations no shorter than the Zue 1976 means", () => {
    const cases = [
      { stop: "B", vowel: "IY", release: "B_REL", minDurationMs: 13 },
      { stop: "D", vowel: "IY", release: "D_REL", minDurationMs: 19 },
      { stop: "G", vowel: "IY", release: "G_REL", minDurationMs: 30 },
    ] as const;

    for (const testCase of cases) {
      const sequence = [
        { phoneme: testCase.stop, stress: 1, word: "bead", type: "stop" },
        { phoneme: testCase.vowel, stress: 1, word: "bead", type: "vowel" },
        { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence" },
      ];

      const out = runDeclarativeFrontend(sequence, {
        phases: ["structural"],
        inventoryResolver: qlattInventoryResolver,
      });
      const active = getActivePhoneTokens(out);
      const release = active.find((token) => token.phoneme === testCase.release);

      expect(release).toBeTruthy();
      expect(Number(release?.duration)).toBeGreaterThanOrEqual(testCase.minDurationMs);
    }
  });
});
