import { describe, expect, it } from "vitest";
import { loadYamlSourceSync } from "../src/yaml-loader";
import {
  DEFAULT_BREAK_POLICY_PATH,
  loadBreakPolicySync,
  resolveLongPhraseBreak,
} from "../src/break-policy";


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

});
