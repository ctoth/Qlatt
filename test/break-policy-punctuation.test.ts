import { describe, expect, it, vi, afterAll } from "vitest";
import {
  loadBreakPolicySync,
  resolvePunctuationBreakIndex,
} from "../src/break-policy";
import { annotateProsody } from "../src/prosodic-annotator";

/**
 * Tests for punctuation_break_indices in break-policy.yaml.
 *
 * Verifies that hardcoded TERMINAL_PUNCTUATION / CLAUSE_PUNCTUATION sets
 * have been replaced by the declarative punctuation_break_indices table
 * in break-policy.yaml.
 *
 * Citation: Silverman et al. 1992 (ToBI break index tier)
 */

// Suppress console.warn from the pipeline
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
afterAll(() => warnSpy.mockRestore());

// ---------------------------------------------------------------------------
// Unit tests: loadBreakPolicySync returns punctuation_break_indices
// ---------------------------------------------------------------------------

describe("break-policy punctuation_break_indices", () => {
  it("loadBreakPolicySync() returns a policy with punctuation_break_indices entries", () => {
    const policy = loadBreakPolicySync();
    expect(policy.punctuation_break_indices).toBeDefined();
    expect(policy.punctuation_break_indices.terminal).toBeDefined();
    expect(policy.punctuation_break_indices.clause).toBeDefined();
    expect(policy.punctuation_break_indices.word_boundary).toBeDefined();
    expect(policy.punctuation_break_indices.default).toBeDefined();
  });

  it('resolvePunctuationBreakIndex(policy, ".") returns 4', () => {
    const policy = loadBreakPolicySync();
    expect(resolvePunctuationBreakIndex(policy, ".")).toBe(4);
  });

  it('resolvePunctuationBreakIndex(policy, ",") returns 3', () => {
    const policy = loadBreakPolicySync();
    expect(resolvePunctuationBreakIndex(policy, ",")).toBe(3);
  });

  it("resolvePunctuationBreakIndex(policy, null) returns 0 (default)", () => {
    const policy = loadBreakPolicySync();
    expect(resolvePunctuationBreakIndex(policy, null)).toBe(0);
  });

  it('resolvePunctuationBreakIndex(policy, "unknown_symbol") returns 0 (default)', () => {
    const policy = loadBreakPolicySync();
    expect(resolvePunctuationBreakIndex(policy, "unknown_symbol")).toBe(0);
  });

  // Additional coverage for all declared symbols
  it('resolves "?" and "!" as terminal (break index 4)', () => {
    const policy = loadBreakPolicySync();
    expect(resolvePunctuationBreakIndex(policy, "?")).toBe(4);
    expect(resolvePunctuationBreakIndex(policy, "!")).toBe(4);
  });

  it('resolves ";" and ":" as clause (break index 3)', () => {
    const policy = loadBreakPolicySync();
    expect(resolvePunctuationBreakIndex(policy, ";")).toBe(3);
    expect(resolvePunctuationBreakIndex(policy, ":")).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Integration test: annotateProsody produces identical break indices
// ---------------------------------------------------------------------------

type MinimalToken = Record<string, unknown>;

function phone(
  phoneme: string,
  word: string,
  stress: number | null = null,
): MinimalToken {
  return { phoneme, word, stress, type: "vowel", params: {} };
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

describe("break-policy punctuation — integration", () => {
  it("annotateProsody produces breakIndex=4 at period, breakIndex=3 at comma, breakIndex=1 at word boundary", () => {
    // Multi-sentence: "The cat sat , and it ran ."
    const tokens = [
      sil(),                            // 0: leading SIL
      phone("DH", "the"),               // 1
      phone("AH", "the", 0),            // 2
      phone("K", "cat"),                 // 3
      phone("AE", "cat", 1),            // 4
      phone("T", "cat"),                 // 5
      phone("S", "sat"),                 // 6
      phone("AE", "sat", 1),            // 7
      phone("T", "sat"),                 // 8
      sil(","),                          // 9: comma SIL
      phone("AE", "and", 0),            // 10
      phone("N", "and"),                 // 11
      phone("D", "and"),                 // 12
      phone("IH", "it", 0),             // 13
      phone("T", "it"),                  // 14
      phone("R", "ran"),                 // 15
      phone("AE", "ran", 1),            // 16
      phone("N", "ran"),                 // 17
      sil("."),                          // 18: period SIL
    ];

    const result = annotateProsody(tokens);

    // Comma SIL → breakIndex=3 (intermediate phrase boundary)
    expect(result[9].breakIndex).toBe(3);
    // Period SIL → breakIndex=4 (intonation phrase boundary)
    expect(result[18].breakIndex).toBe(4);
    // Last phone of "the" (index 2) → breakIndex=1
    expect(result[2].breakIndex).toBe(1);
    // Last phone of "cat" (index 5) → breakIndex=1
    expect(result[5].breakIndex).toBe(1);
    // Mid-word phone → breakIndex=0
    expect(result[1].breakIndex).toBe(0);
  });
});
