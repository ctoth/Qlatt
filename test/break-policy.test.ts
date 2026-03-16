import { describe, expect, it } from "vitest";
import { loadYamlSourceSync } from "../src/yaml-loader";
import { annotateProsody } from "../src/prosodic-annotator";
import { createProvenanceCollector } from "../src/provenance";
import {
  DEFAULT_BREAK_POLICY_PATH,
  loadBreakPolicySync,
  resolveLongPhraseBreak,
} from "../src/break-policy";

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

describe("break policy", () => {
  it("declares the canonical long-phrase break policy document", () => {
    const source = loadYamlSourceSync(DEFAULT_BREAK_POLICY_PATH);
    const policy = loadBreakPolicySync();

    expect(source).toContain("version: v1");
    expect(policy.version).toBe("v1");
    expect(policy.long_phrase_breaking.minimum_content_words).toBe(7);
    expect(policy.long_phrase_breaking.break_index).toBe(2);
    expect(policy.long_phrase_breaking.placement).toBe("pre_midpoint_content_word_end");
  });

  it("resolves the current threshold and midpoint placement", () => {
    const policy = loadBreakPolicySync();

    expect(resolveLongPhraseBreak(policy, [1, 2, 3, 4, 5, 6])).toEqual({
      contentWordCount: 6,
      breakTokenIndex: null,
      breakIndex: 2,
    });

    expect(resolveLongPhraseBreak(policy, [1, 2, 3, 4, 5, 6, 7, 8])).toEqual({
      contentWordCount: 8,
      breakTokenIndex: 4,
      breakIndex: 2,
    });
  });

  it("preserves current long-phrase breaking behavior in the annotator", () => {
    const words = ["big", "red", "dog", "jumped", "past", "old", "stone", "wall"];
    const tokens: MinimalToken[] = [sil()];
    for (const word of words) {
      tokens.push(phone("AH", word, 1));
    }
    tokens.push(sil("."));

    const result = annotateProsody(tokens);

    const break2Tokens = result.filter((token: any) => token.breakIndex === 2);
    expect(break2Tokens.length).toBe(1);
    expect(result[4].breakIndex).toBe(2);
  });

  it("records the selected long-phrase break in provenance", () => {
    const provenance = createProvenanceCollector();
    const words = ["big", "red", "dog", "jumped", "past", "old", "stone", "wall"];
    const tokens: MinimalToken[] = [sil()];
    for (const word of words) {
      tokens.push(phone("AH", word, 1));
    }
    tokens.push(sil("."));

    annotateProsody(tokens, { provenance });

    const decision = provenance.getDecisions().find((entry) => entry.type === "phrase_break_selected");
    expect(decision).toBeDefined();
    expect(decision?.subject).toBe("phrase:0");
    expect(decision?.citations).toContain(DEFAULT_BREAK_POLICY_PATH);
    expect(decision?.reason).toContain("contentWordCount=8");
  });
});
