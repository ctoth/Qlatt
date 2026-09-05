import { describe, expect, it } from "vitest";
import { normalizeText, validateNormalizationPipelineConfig } from "../src/g2p/text-normalize";
import { transcribeText } from "../src/transcribe-text";
import type { TranscriptionConfig } from "../src/tts-frontend-types";
import { loadYamlDocumentSync } from "../src/yaml-loader";

interface NormalizationTables {
  ones: string[];
  teens: string[];
  tens: string[];
  ordinal_ones: Record<number, string>;
  ordinal_tens: Record<number, string>;
  abbreviations: Record<string, string>;
  digit_words: Record<string, string>;
  month_names: string[];
}

interface RegexRule {
  pattern: string;
  replacement?: string;
  handler?: string;
  flags?: string;
}

interface PipelineStep {
  name: string;
  type: string;
  handler?: string;
  pattern?: string;
  table?: string;
  rules?: RegexRule[];
  punctuation_policy?: {
    preserved_character_pattern: string;
    strip_unlisted: boolean;
    lexical_apostrophe: {
      symbol: string;
      word_character_pattern: string;
      preserve_between_word_characters: boolean;
      preserve_trailing_after_word_character: boolean;
    };
  };
  citations: string[];
}

interface NormalizationPipeline {
  steps: PipelineStep[];
}

describe("text normalization YAML tables", () => {
  const tables = loadYamlDocumentSync<NormalizationTables>(
    "/rules/frontends/qlatt-english/normalization-tables.yaml",
  );

  it("loads abbreviations with 30+ entries", () => {
    expect(Object.keys(tables.abbreviations).length).toBeGreaterThanOrEqual(30);
  });

  it("loads month_names with 12 entries", () => {
    expect(tables.month_names).toHaveLength(12);
    expect(tables.month_names[0]).toBe("january");
    expect(tables.month_names[11]).toBe("december");
  });

  it("loads ones with 10 entries", () => {
    expect(tables.ones).toHaveLength(10);
    expect(tables.ones[0]).toBe("");
    expect(tables.ones[1]).toBe("one");
  });

  it("loads teens with 10 entries", () => {
    expect(tables.teens).toHaveLength(10);
    expect(tables.teens[0]).toBe("ten");
    expect(tables.teens[9]).toBe("nineteen");
  });

  it("loads tens with 10 entries", () => {
    expect(tables.tens).toHaveLength(10);
    expect(tables.tens[2]).toBe("twenty");
  });

  it("loads ordinal_ones with 19 entries", () => {
    expect(Object.keys(tables.ordinal_ones).length).toBe(19);
    expect(tables.ordinal_ones[1]).toBe("first");
    expect(tables.ordinal_ones[19]).toBe("nineteenth");
  });

  it("loads ordinal_tens with 8 entries", () => {
    expect(Object.keys(tables.ordinal_tens).length).toBe(8);
    expect(tables.ordinal_tens[20]).toBe("twentieth");
    expect(tables.ordinal_tens[90]).toBe("ninetieth");
  });

  it("loads digit_words with 10 entries", () => {
    expect(Object.keys(tables.digit_words).length).toBe(10);
    expect(tables.digit_words["0"]).toBe("zero");
    expect(tables.digit_words["9"]).toBe("nine");
  });
});

describe("text normalization YAML pipeline", () => {
  const tables = loadYamlDocumentSync<NormalizationTables>(
    "/rules/frontends/qlatt-english/normalization-tables.yaml",
  );
  const pipeline = loadYamlDocumentSync<NormalizationPipeline>(
    "/rules/frontends/qlatt-english/normalization-pipeline.yaml",
  );

  it("defines steps in correct order", () => {
    const names = pipeline.steps.map((s) => s.name);
    expect(names).toEqual([
      "lowercase",
      "normalize_quotes",
      "expand_abbreviations",
      "expand_initialisms",
      "expand_dates_slash",
      "expand_dates_iso",
      "expand_time_meridiem",
      "expand_time_24h",
      "expand_currency",
      "expand_decimals",
      "expand_ordinals",
      "expand_numbers",
      "punctuation_cleanup",
      "collapse_whitespace",
    ]);
  });

  it("every step has citations", () => {
    for (const step of pipeline.steps) {
      expect(step.citations, `step ${step.name} missing citations`).toBeDefined();
      expect(step.citations.length, `step ${step.name} has empty citations`).toBeGreaterThan(0);
    }
  });

  it("every step has a valid type", () => {
    const validTypes = new Set(["builtin", "regex_replace", "table_replace"]);
    for (const step of pipeline.steps) {
      expect(validTypes.has(step.type), `step ${step.name} has invalid type '${step.type}'`).toBe(
        true,
      );
    }
  });

  it("uses named regex handlers instead of magic replacement sentinels", () => {
    const regexRules = pipeline.steps.flatMap((step) => step.rules ?? []);
    expect(regexRules.map((rule) => rule.replacement)).not.toContain("__initialism__");

    const initialismStep = pipeline.steps.find((step) => step.name === "expand_initialisms");
    expect(initialismStep?.rules?.[0]).toMatchObject({ handler: "expandInitialism" });
  });

  it("uses one punctuation inventory for normalization and transcription", () => {
    const punctuationStep = pipeline.steps.find((step) => step.name === "punctuation_cleanup");
    expect(punctuationStep?.punctuation_policy).toMatchObject({
      preserved_character_pattern: "[\\w\\s]",
      strip_unlisted: true,
      lexical_apostrophe: {
        symbol: "'",
        word_character_pattern: "[a-z]",
        preserve_between_word_characters: true,
        preserve_trailing_after_word_character: true,
      },
    });

    const frontend = loadYamlDocumentSync<{ transcription: TranscriptionConfig }>(
      "/rules/frontends/qlatt-english/frontend.yaml",
    );
    const transcription = {
      ...frontend.transcription,
      punctuation_tokens: ["~"],
    };

    const normalized = normalizeText("hello~world!", {
      punctuationTokens: transcription.punctuation_tokens,
    });
    expect(normalized).toBe("hello ~ world");

    const tokens = transcribeText(normalized, { transcriptionConfig: transcription });
    expect(tokens.filter((token) => token.isPunctuation).map((token) => token.symbol)).toEqual([
      "~",
    ]);
  });

  it("rejects table_replace steps that reference missing tables", () => {
    expect(() =>
      validateNormalizationPipelineConfig(
        {
          steps: [
            {
              name: "bad_table",
              type: "table_replace",
              table: "missing_table",
              citations: ["test"],
            },
          ],
        },
        tables,
      ),
    ).toThrow("E_NORMALIZE_CONFIG");
  });
});

describe("normalizeText parity after declarativization", () => {
  it("handles mixed semiotic classes", () => {
    expect(normalizeText("Dr. Smith ordered 3 items on 12/25/2024 for $42.50")).toBe(
      "doctor smith ordered three items on december twenty fifth two thousand twenty four for forty two dollars and fifty cents",
    );
  });

  it("handles ordinals", () => {
    expect(normalizeText("1st 2nd 3rd")).toBe("first second third");
  });

  it("handles initialisms", () => {
    expect(normalizeText("U.S.A.")).toBe("u s a");
  });
});

describe("dectalk-english normalization policy", () => {
  const dectalkConfig = {
    tablesPath: "/rules/frontends/dectalk-english/normalization-tables.yaml",
    pipelinePath: "/rules/frontends/dectalk-english/normalization-pipeline.yaml",
  };

  it("keeps default hundreds style but uses DECtalk's numeric hundreds compound", () => {
    expect(normalizeText("room 101.")).toBe("room one hundred one .");
    expect(normalizeText("room 101.", dectalkConfig)).toBe("room one hundredand one .");
  });
});
