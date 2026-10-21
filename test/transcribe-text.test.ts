import { afterAll, describe, expect, it, vi } from "vitest";
import { loadFrontendResources } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { createDiagnostics } from "../src/diagnostics";
import {
  getDiagnosticSymbolPronunciation,
  isPunctuationToken,
  shouldUseDiagnosticSymbolMode,
  transcribeText,
} from "../src/transcribe-text";

const compiledSpec = loadBundledRulepackSpec("qlatt-english");
const transcriptionConfig = compiledSpec.transcription;
const resources = loadFrontendResources(compiledSpec);
const selected = {
  frontendId: "qlatt-english",
  compiledSpec,
  dictionaryMap: resources.lexicon?.dictionary,
};

describe("transcribe-text", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  afterAll(() => {
    warnSpy.mockRestore();
  });

  describe("transcribeText", () => {
    it("uses explicitly selected punctuation and diagnostic symbol configuration", () => {
      const config = {
        ...transcriptionConfig,
        punctuation_tokens: ["~"],
        diagnostic_symbols: { custom: ["K"] },
      };
      expect(isPunctuationToken("~", config)).toBe(true);
      expect(isPunctuationToken(".", config)).toBe(false);
      expect(getDiagnosticSymbolPronunciation("/custom/", config)).toEqual(["K"]);
      expect(getDiagnosticSymbolPronunciation("/b/", config)).toBeNull();
      expect(shouldUseDiagnosticSymbolMode(["/custom/", "~"], config)).toBe(true);
    });

    it("uses each frontend's declared lexicon and inherits Qlatt's selection", () => {
      const beauty = loadFrontendResources(loadBundledRulepackSpec("qlatt-beauty"));
      const dectalk = loadFrontendResources(loadBundledRulepackSpec("dectalk-english"));
      expect(resources.lexicon?.path).toBe("/rules/languages/english/cmu-dictionary.json");
      expect(beauty.lexicon?.dictionary).toBe(resources.lexicon?.dictionary);
      expect(dectalk.lexicon?.path).toBe("/dectalk-dictionary.json");
      expect(dectalk.lexicon?.dictionary).not.toBe(resources.lexicon?.dictionary);
    });

    it("uses LTS without an implicit CMU lookup when no lexicon is supplied", () => {
      const diagnostics = createDiagnostics();
      const noLexicon = {
        ...compiledSpec,
        resources: { ...compiledSpec.resources, lexicon: null },
        skip_dictionary: true,
      };
      expect(loadFrontendResources(noLexicon).lexicon).toBeUndefined();
      const options = { compiledSpec: noLexicon, frontendId: "no-lexicon" };
      const tokens = transcribeText("adl tabatabai", { ...options, diagnostics });
      expect(tokens).toEqual(transcribeText("adl tabatabai", { ...options, dictionaryMap: {} }));
      expect(new Set(tokens.map((token) => token.word))).toEqual(new Set(["adl", "tabatabai"]));
      expect(diagnostics.getEntries()).toContainEqual(
        expect.objectContaining({
          code: "I_FRONTEND_NO_LEXICON",
          data: { frontendId: "no-lexicon" },
        }),
      );
    });

    it("uses the supplied map for compound recovery and preserves lookup overrides", () => {
      const options = { ...selected, dictionaryMap: { "adl-tabatabai": "K AE1 T" } };
      const tokens = transcribeText("adl tabatabai", options);
      expect(new Set(tokens.map((token) => token.word))).toEqual(new Set(["adl-tabatabai"]));
      expect(tokens.map((token) => token.phoneme)).toEqual(["K", "AE", "T"]);
      const overridden = transcribeText("hello", {
        ...options,
        dictLookup: () => ["B", "IY1"],
      });
      expect(overridden.map((token) => token.phoneme)).toEqual(["B", "IY"]);
    });

    it("rejects a declared lexicon that cannot load instead of using CMU", () => {
      expect(() =>
        loadFrontendResources({
          ...compiledSpec,
          resources: { ...compiledSpec.resources, lexicon: "/missing-declared-lexicon.json" },
        }),
      ).toThrow("E_FRONTEND_CONFIG: lexicon could not load '/missing-declared-lexicon.json'");
    });

    it("transcribes a simple word into phoneme tokens", () => {
      const result = transcribeText("hello", selected);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      for (const token of result) {
        expect(typeof token.phoneme).toBe("string");
        expect(token.phoneme.length).toBeGreaterThan(0);
        expect(token.stress === null || typeof token.stress === "number").toBe(true);
        expect(token.word).toBe("hello");
      }
    });

    it("handles punctuation tokens", () => {
      for (const punct of [".", ",", "?", "!", ";", ":"]) {
        const result = transcribeText(punct, selected);
        expect(result.length).toBe(1);
        const token = result[0];
        expect(token.phoneme).toBe("SIL");
        expect(token.stress).toBeNull();
        expect(token.isPunctuation).toBe(true);
        expect(token.symbol).toBe(punct);
        expect(token.word).toBe(punct);
      }
    });

    it("handles diagnostic symbol mode", () => {
      const result = transcribeText("/b/", selected);
      expect(result.length).toBe(1);
      expect(result[0].phoneme).toBe("B");
      expect(result[0].stress).toBeNull();
    });

    it("rejects missing transcription tables instead of falling back to TS defaults", () => {
      expect(() =>
        transcribeText("/b/", {
          ...selected,
          transcriptionConfig: {
            diagnostic_symbols: {},
            letter_names: {},
            punctuation_tokens: [],
          },
        }),
      ).toThrow("E_TRANSCRIPTION_CONFIG_REQUIRED");
    });

    it("handles empty/whitespace input", () => {
      expect(transcribeText("", selected)).toEqual([]);
      expect(transcribeText("   ", selected)).toEqual([]);
    });

    it("associates tokens with their source words", () => {
      const result = transcribeText("hello world", selected);
      const helloTokens = result.filter((t) => t.word === "hello");
      const worldTokens = result.filter((t) => t.word === "world");
      expect(helloTokens.length).toBeGreaterThan(0);
      expect(worldTokens.length).toBeGreaterThan(0);
    });

    it("produces tokens with correct TranscriptionToken shape", () => {
      const result = transcribeText("cat", selected);
      for (const token of result) {
        // Required fields
        expect("phoneme" in token).toBe(true);
        expect("stress" in token).toBe(true);
        expect("word" in token).toBe(true);
      }
    });

    it("handles mixed words and punctuation", () => {
      const result = transcribeText("hello , world .", selected);
      const punctTokens = result.filter((t) => t.isPunctuation === true);
      const wordTokens = result.filter((t) => !t.isPunctuation);
      expect(punctTokens.length).toBe(2);
      expect(wordTokens.length).toBeGreaterThan(0);
    });

    it("recovers hyphenated CMUdict entries split by normalization", () => {
      warnSpy.mockClear();
      const result = transcribeText("adl tabatabai", selected);
      expect(result.length).toBeGreaterThan(0);
      expect(new Set(result.map((t) => t.word))).toEqual(new Set(["adl-tabatabai"]));
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes("not found in dictionary"),
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("recovers multi-token hyphenated compounds", () => {
      warnSpy.mockClear();
      const result = transcribeText("kebab n kurry", selected);
      expect(result.length).toBeGreaterThan(0);
      expect(new Set(result.map((t) => t.word))).toEqual(new Set(["kebab-n-kurry"]));
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes("not found in dictionary"),
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("recovers longer multi-token hyphenated compounds", () => {
      warnSpy.mockClear();
      const result = transcribeText("trente et quarante", selected);
      expect(result.length).toBeGreaterThan(0);
      expect(new Set(result.map((t) => t.word))).toEqual(new Set(["trente-et-quarante"]));
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes("not found in dictionary"),
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("recovers apostrophe-linked compounds split by normalization", () => {
      warnSpy.mockClear();
      const result = transcribeText("rock'n roll", selected);
      expect(result.length).toBeGreaterThan(0);
      expect(new Set(result.map((t) => t.word))).toEqual(new Set(["rock'n'roll"]));
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes("not found in dictionary"),
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("supports elided dictionary entries without leading apostrophe in input", () => {
      warnSpy.mockClear();
      const result = transcribeText("cuse", selected);
      expect(result.length).toBeGreaterThan(0);
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes('Word "cuse" not found in dictionary'),
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("supports colloquial trailing-elision forms without apostrophe in input", () => {
      warnSpy.mockClear();
      const result = transcribeText("comin", selected);
      expect(result.length).toBeGreaterThan(0);
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes('Word "comin" not found in dictionary'),
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("recovers dictionary entries that keep trailing periods", () => {
      warnSpy.mockClear();
      const result = transcribeText("cr", selected);
      expect(result.length).toBeGreaterThan(0);
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes('Word "cr" not found in dictionary'),
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("recovers tokens with trailing apostrophe by stripping when needed", () => {
      warnSpy.mockClear();
      const result = transcribeText("s'", selected);
      expect(result.length).toBeGreaterThan(0);
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes('Word "s\'" not found in dictionary'),
      );
      expect(missWarnings).toHaveLength(0);
    });
  });

  describe("isPunctuationToken", () => {
    it("returns true for punctuation marks", () => {
      for (const p of [",", ".", "?", "!", ";", ":"]) {
        expect(isPunctuationToken(p, transcriptionConfig)).toBe(true);
      }
    });

    it("returns false for non-punctuation", () => {
      expect(isPunctuationToken("hello", transcriptionConfig)).toBe(false);
      expect(isPunctuationToken("", transcriptionConfig)).toBe(false);
      expect(isPunctuationToken("a", transcriptionConfig)).toBe(false);
    });
  });

  describe("getDiagnosticSymbolPronunciation", () => {
    it("maps /b/ to ['B']", () => {
      expect(getDiagnosticSymbolPronunciation("/b/", transcriptionConfig)).toEqual(["B"]);
    });

    it("maps /th/ to ['TH']", () => {
      expect(getDiagnosticSymbolPronunciation("/th/", transcriptionConfig)).toEqual(["TH"]);
    });

    it("returns null for unknown symbols", () => {
      expect(getDiagnosticSymbolPronunciation("/xyz/", transcriptionConfig)).toBeNull();
      expect(getDiagnosticSymbolPronunciation("hello", transcriptionConfig)).toBeNull();
    });

    it("strips leading/trailing slashes and lowercases", () => {
      expect(getDiagnosticSymbolPronunciation("///B///", transcriptionConfig)).toEqual(["B"]);
    });
  });

  describe("shouldUseDiagnosticSymbolMode", () => {
    it("returns true when all non-punctuation words are diagnostic symbols", () => {
      expect(shouldUseDiagnosticSymbolMode(["/b/", "/d/"], transcriptionConfig)).toBe(true);
    });

    it("returns false when any word is not a diagnostic symbol", () => {
      expect(shouldUseDiagnosticSymbolMode(["/b/", "hello"], transcriptionConfig)).toBe(false);
    });

    it("returns false for empty input", () => {
      expect(shouldUseDiagnosticSymbolMode([], transcriptionConfig)).toBe(false);
    });

    it("ignores punctuation tokens when checking", () => {
      expect(shouldUseDiagnosticSymbolMode(["/b/", "."], transcriptionConfig)).toBe(true);
    });
  });

  describe("bundled YAML transcription helpers", () => {
    it("uses the selected bundled YAML punctuation table", () => {
      for (const p of [",", ".", "?", "!", ";", ":"]) {
        expect(isPunctuationToken(p, transcriptionConfig)).toBe(true);
      }
      expect(isPunctuationToken("/b/", transcriptionConfig)).toBe(false);
    });

    it("uses the selected bundled YAML diagnostic symbol table", () => {
      expect(getDiagnosticSymbolPronunciation("/b/", transcriptionConfig)).toEqual(["B"]);
      expect(getDiagnosticSymbolPronunciation("/zh/", transcriptionConfig)).toEqual(["ZH"]);
    });
  });
});
