import { describe, expect, it } from "vitest";
import {
  loadBreakPolicySync,
  resolvePunctuationBreakIndex,
} from "../src/break-policy";

/**
 * Tests for punctuation_break_indices in break-policy.yaml.
 *
 * Verifies that hardcoded TERMINAL_PUNCTUATION / CLAUSE_PUNCTUATION sets
 * have been replaced by the declarative punctuation_break_indices table
 * in break-policy.yaml.
 *
 * Citation: Silverman et al. 1992 (ToBI break index tier)
 */


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
