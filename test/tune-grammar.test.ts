import { describe, expect, it } from "vitest";
import { loadYamlSourceSync } from "../src/yaml-loader";
import {
  DEFAULT_TUNE_GRAMMAR_PATH,
  classifyTunePhraseType,
  loadTuneGrammarSync,
  selectTuneForPhrase,
} from "../src/tune-grammar";


describe("tune grammar", () => {
  it("declares the canonical tune grammar document", () => {
    const source = loadYamlSourceSync(DEFAULT_TUNE_GRAMMAR_PATH);
    const grammar = loadTuneGrammarSync();

    expect(source).toContain("version: v1");
    expect(grammar.version).toBe("v1");
    expect(Object.keys(grammar.phrase_types)).toEqual(
      expect.arrayContaining(["declarative", "question", "exclamation", "continuation"]),
    );
  });

  it("classifies phrase type from punctuation", () => {
    expect(classifyTunePhraseType("?")).toBe("question");
    expect(classifyTunePhraseType("!")).toBe("exclamation");
    expect(classifyTunePhraseType(",")).toBe("continuation");
    expect(classifyTunePhraseType(".")).toBe("declarative");
    expect(classifyTunePhraseType(null)).toBe("declarative");
  });

  it("selects the current question and declarative tune families", () => {
    const grammar = loadTuneGrammarSync();

    const question = selectTuneForPhrase(grammar, {
      punctuation: "?",
      hasPrenuclearAccent: true,
    });
    expect(question.phraseType).toBe("question");
    expect(question.nuclearAccent).toBe("L*+H");
    expect(question.prenuclearFirstAccent).toBe("L+H*");
    expect(question.prenuclearLaterAccent).toBe("H+!H*");
    expect(question.initialBoundaryTone).toBe("%H");
    expect(question.phraseAccent).toBe("H-");
    expect(question.boundaryTone).toBe("H%");

    const declarative = selectTuneForPhrase(grammar, {
      punctuation: ".",
      hasPrenuclearAccent: true,
    });
    expect(declarative.phraseType).toBe("declarative");
    expect(declarative.nuclearAccent).toBe("H*+L");
    expect(declarative.prenuclearFirstAccent).toBe("L+H*");
    expect(declarative.prenuclearLaterAccent).toBe("H+!H*");
    expect(declarative.initialBoundaryTone).toBeNull();
    expect(declarative.phraseAccent).toBe("L-");
    expect(declarative.boundaryTone).toBe("L%");
  });

  it("selects the current continuation and lone-question variants", () => {
    const grammar = loadTuneGrammarSync();

    const continuation = selectTuneForPhrase(grammar, {
      punctuation: ",",
      hasPrenuclearAccent: true,
    });
    expect(continuation.phraseType).toBe("continuation");
    expect(continuation.nuclearAccent).toBe("H+L*");
    expect(continuation.prenuclearFirstAccent).toBe("H*+H");
    expect(continuation.prenuclearLaterAccent).toBe("H+!H*");
    expect(continuation.phraseAccent).toBe("L-");
    expect(continuation.boundaryTone).toBe("H%");

    const loneQuestion = selectTuneForPhrase(grammar, {
      punctuation: "?",
      hasPrenuclearAccent: false,
    });
    expect(loneQuestion.nuclearAccent).toBe("L*");
  });

});
