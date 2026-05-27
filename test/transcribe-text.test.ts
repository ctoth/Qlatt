import { afterAll, describe, expect, it, vi } from "vitest";
import {
  transcribeText,
  isPunctuationToken,
  getDiagnosticSymbolPronunciation,
  shouldUseDiagnosticSymbolMode,
} from "../src/transcribe-text";
import type { TranscriptionToken } from "../src/tts-frontend-types";

describe("transcribe-text", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  afterAll(() => {
    warnSpy.mockRestore();
  });

  describe("transcribeText", () => {
    it("transcribes a simple word into phoneme tokens", () => {
      const result = transcribeText("hello");
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
        const result = transcribeText(punct);
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
      const result = transcribeText("/b/");
      expect(result.length).toBe(1);
      expect(result[0].phoneme).toBe("B");
      expect(result[0].stress).toBeNull();
    });

    it("rejects missing transcription tables instead of falling back to TS defaults", () => {
      expect(() =>
        transcribeText("/b/", {
          transcriptionConfig: {
            diagnostic_symbols: {},
            letter_names: {},
            punctuation_tokens: [],
          },
        })
      ).toThrow("E_TRANSCRIPTION_CONFIG_REQUIRED");
    });

    it("handles empty/whitespace input", () => {
      expect(transcribeText("")).toEqual([]);
      expect(transcribeText("   ")).toEqual([]);
    });

    it("associates tokens with their source words", () => {
      const result = transcribeText("hello world");
      const helloTokens = result.filter((t) => t.word === "hello");
      const worldTokens = result.filter((t) => t.word === "world");
      expect(helloTokens.length).toBeGreaterThan(0);
      expect(worldTokens.length).toBeGreaterThan(0);
    });

    it("produces tokens with correct TranscriptionToken shape", () => {
      const result = transcribeText("cat");
      for (const token of result) {
        // Required fields
        expect("phoneme" in token).toBe(true);
        expect("stress" in token).toBe(true);
        expect("word" in token).toBe(true);
      }
    });

    it("handles mixed words and punctuation", () => {
      const result = transcribeText("hello , world .");
      const punctTokens = result.filter((t) => t.isPunctuation === true);
      const wordTokens = result.filter((t) => !t.isPunctuation);
      expect(punctTokens.length).toBe(2);
      expect(wordTokens.length).toBeGreaterThan(0);
    });

    it("recovers hyphenated CMUdict entries split by normalization", () => {
      warnSpy.mockClear();
      const result = transcribeText("adl tabatabai");
      expect(result.length).toBeGreaterThan(0);
      expect(new Set(result.map((t) => t.word))).toEqual(new Set(["adl-tabatabai"]));
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes('not found in dictionary')
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("recovers multi-token hyphenated compounds", () => {
      warnSpy.mockClear();
      const result = transcribeText("kebab n kurry");
      expect(result.length).toBeGreaterThan(0);
      expect(new Set(result.map((t) => t.word))).toEqual(new Set(["kebab-n-kurry"]));
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes('not found in dictionary')
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("recovers longer multi-token hyphenated compounds", () => {
      warnSpy.mockClear();
      const result = transcribeText("trente et quarante");
      expect(result.length).toBeGreaterThan(0);
      expect(new Set(result.map((t) => t.word))).toEqual(new Set(["trente-et-quarante"]));
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes('not found in dictionary')
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("recovers apostrophe-linked compounds split by normalization", () => {
      warnSpy.mockClear();
      const result = transcribeText("rock'n roll");
      expect(result.length).toBeGreaterThan(0);
      expect(new Set(result.map((t) => t.word))).toEqual(new Set(["rock'n'roll"]));
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes('not found in dictionary')
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("supports elided dictionary entries without leading apostrophe in input", () => {
      warnSpy.mockClear();
      const result = transcribeText("cuse");
      expect(result.length).toBeGreaterThan(0);
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes('Word \"cuse\" not found in dictionary')
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("supports colloquial trailing-elision forms without apostrophe in input", () => {
      warnSpy.mockClear();
      const result = transcribeText("comin");
      expect(result.length).toBeGreaterThan(0);
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes('Word \"comin\" not found in dictionary')
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("recovers dictionary entries that keep trailing periods", () => {
      warnSpy.mockClear();
      const result = transcribeText("cr");
      expect(result.length).toBeGreaterThan(0);
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes('Word \"cr\" not found in dictionary')
      );
      expect(missWarnings).toHaveLength(0);
    });

    it("recovers tokens with trailing apostrophe by stripping when needed", () => {
      warnSpy.mockClear();
      const result = transcribeText("s'");
      expect(result.length).toBeGreaterThan(0);
      const missWarnings = warnSpy.mock.calls.filter((args) =>
        String(args[0]).includes('Word \"s\'\" not found in dictionary')
      );
      expect(missWarnings).toHaveLength(0);
    });
  });

  describe("isPunctuationToken", () => {
    it("returns true for punctuation marks", () => {
      for (const p of [",", ".", "?", "!", ";", ":"]) {
        expect(isPunctuationToken(p)).toBe(true);
      }
    });

    it("returns false for non-punctuation", () => {
      expect(isPunctuationToken("hello")).toBe(false);
      expect(isPunctuationToken("")).toBe(false);
      expect(isPunctuationToken("a")).toBe(false);
    });
  });

  describe("getDiagnosticSymbolPronunciation", () => {
    it("maps /b/ to ['B']", () => {
      expect(getDiagnosticSymbolPronunciation("/b/")).toEqual(["B"]);
    });

    it("maps /th/ to ['TH']", () => {
      expect(getDiagnosticSymbolPronunciation("/th/")).toEqual(["TH"]);
    });

    it("returns null for unknown symbols", () => {
      expect(getDiagnosticSymbolPronunciation("/xyz/")).toBeNull();
      expect(getDiagnosticSymbolPronunciation("hello")).toBeNull();
    });

    it("strips leading/trailing slashes and lowercases", () => {
      expect(getDiagnosticSymbolPronunciation("///B///")).toEqual(["B"]);
    });
  });

  describe("shouldUseDiagnosticSymbolMode", () => {
    it("returns true when all non-punctuation words are diagnostic symbols", () => {
      expect(shouldUseDiagnosticSymbolMode(["/b/", "/d/"])).toBe(true);
    });

    it("returns false when any word is not a diagnostic symbol", () => {
      expect(shouldUseDiagnosticSymbolMode(["/b/", "hello"])).toBe(false);
    });

    it("returns false for empty input", () => {
      expect(shouldUseDiagnosticSymbolMode([])).toBe(false);
    });

    it("ignores punctuation tokens when checking", () => {
      expect(shouldUseDiagnosticSymbolMode(["/b/", "."])).toBe(true);
    });
  });

  describe("bundled YAML transcription helpers", () => {
    it("uses the bundled YAML punctuation table by default", () => {
      for (const p of [",", ".", "?", "!", ";", ":"]) {
        expect(isPunctuationToken(p)).toBe(true);
      }
      expect(isPunctuationToken("/b/")).toBe(false);
    });

    it("uses the bundled YAML diagnostic symbol table by default", () => {
      expect(getDiagnosticSymbolPronunciation("/b/")).toEqual(["B"]);
      expect(getDiagnosticSymbolPronunciation("/zh/")).toEqual(["ZH"]);
    });
  });
});
