import { describe, expect, it } from "vitest";
import { loadYamlSourceSync } from "../src/yaml-loader";
import { annotateProsody } from "../src/prosodic-annotator";
import { createProvenanceCollector } from "../src/provenance";
import {
  DEFAULT_TUNE_GRAMMAR_PATH,
  classifyTunePhraseType,
  loadTuneGrammarSync,
  selectTuneForPhrase,
} from "../src/tune-grammar";

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

  it("records the selected tune as a declarative provenance decision", () => {
    const provenance = createProvenanceCollector();
    const tokens = [
      sil(),
      phone("IH", "is", 0),
      phone("Z", "is"),
      phone("DH", "the"),
      phone("AH", "the", 0),
      phone("K", "cat"),
      phone("AE", "cat", 1),
      phone("T", "cat"),
      phone("HH", "here"),
      phone("IY", "here", 1),
      phone("R", "here"),
      sil("?"),
    ];

    annotateProsody(tokens, { provenance });

    const decisions = provenance.getDecisions();
    const tuneDecision = decisions.find((decision) => decision.type === "tune_selected");

    expect(tuneDecision).toBeDefined();
    expect(tuneDecision?.subject).toBe("phrase:0");
    expect(tuneDecision?.reason).toContain("question");
    expect(tuneDecision?.citations).toContain(DEFAULT_TUNE_GRAMMAR_PATH);
  });
});
