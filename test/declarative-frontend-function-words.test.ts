import { describe, expect, it } from "vitest";
import { loadYamlDocumentSync } from "../src/yaml-loader";
import { evaluateExpression } from "../src/declarative-frontend/cel-expressions";

/**
 * Phase 5.3 Stage 2: function-word membership is now declared once, in
 * pipeline.yaml `string_sets.function_words`, and consumed by the
 * `mark_function_words` annotation rule via
 * `lower(current.word) in sets.function_words`.
 *
 * These assertions replace the former accent-policy.test.ts coverage of
 * `function_words` / `classifyWordProsody` (same data, same classification
 * outcome — relocated to the declarative source of truth, not weakened).
 */
const PIPELINE_PATH = "/rules/frontends/qlatt-english/pipeline.yaml";

function loadFunctionWords(): string[] {
  const doc = loadYamlDocumentSync(PIPELINE_PATH) as {
    string_sets?: { function_words?: unknown };
  };
  const set = doc.string_sets?.function_words;
  if (!Array.isArray(set)) throw new Error("function_words not declared in pipeline.yaml");
  return set as string[];
}

describe("declarative function-word set", () => {
  it("declares the canonical function-word list in pipeline.yaml string_sets", () => {
    const functionWords = loadFunctionWords();
    expect(functionWords.length).toBeGreaterThanOrEqual(100);
    // Every entry is already lower-cased (the rule folds the key, not the set).
    for (const word of functionWords) {
      expect(word).toBe(word.toLowerCase());
    }
  });

  it("classifies function vs content words the way classifyWordProsody did", () => {
    const sets = { function_words: loadFunctionWords() };
    const isFunction = (word: string): boolean =>
      evaluateExpression("lower(w) in sets.function_words", { w: word, sets }) === true;

    // Case-insensitive membership (the rule lower()s the un-lowercased word).
    expect(isFunction("the")).toBe(true);
    expect(isFunction("The")).toBe(true);
    expect(isFunction("THE")).toBe(true);
    expect(isFunction("don't")).toBe(true);
    // Content words are absent.
    expect(isFunction("cat")).toBe(false);
    expect(isFunction("Cake")).toBe(false);
  });
});
