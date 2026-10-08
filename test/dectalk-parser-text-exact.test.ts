/**
 * Sentences whose reading depends on DECtalk's command text parser, from
 * text, are the stock say.exe's audio sample for sample
 * (test/oracle-corpora/dectalk-us-parser-text-v1.json), through the page's
 * path (scripts/oracle/dectalk-voice-compare.ts):
 *
 *   - texts the parser's rules rewrite: a title before a name ("Dr.", "St."),
 *     brackets;
 *   - texts that end, or are cut, by a clause end and not by a written mark:
 *     no final mark, a tab. The clause end the host sends after a text ends
 *     the words still pending as a period does (PH/ph_task.c:665-676); the
 *     parser's output carries it and the rule tn_parser_clause_end reads it.
 *
 * The fixtures are the say.exe WAVs alone. Regenerate with the instrumented
 * and stock builds (scripts/oracle/export-dectalk-vtm-fixture.ts header):
 *
 *   ... scripts/oracle/export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-parser-text-v1.json \
 *     --out-dir test/fixtures/dectalk-parser-text --wav-only
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
} from "../scripts/oracle/dectalk-voice-compare";
import { normalizeText } from "../src/tts-frontend";

const fixtureDir = path.join("test", "fixtures", "dectalk-parser-text");
const corpus = readVoiceCorpus(
  path.join("test", "oracle-corpora", "dectalk-us-parser-text-v1.json"),
);

describe("DECtalk's text parser, from text to samples", () => {
  it("shows the text as the parser leaves it", () => {
    expect(normalizeText("Dr. Smith is here.", "dectalk-english")).toBe("doctor smith is here .");
    expect(normalizeText("St. John is here.", "dectalk-english")).toBe("saint john is here .");
    // A text with no final mark ends as one with a period does.
    expect(normalizeText("Hello world", "dectalk-english")).toBe("hello world .");
    expect(normalizeText("Hello world.", "dectalk-english")).toBe("hello world .");
    // A frontend without a text parser has neither.
    expect(normalizeText("Hello world", "qlatt-english")).toBe("hello world");
  });

  it.each(corpus.entries.map((entry) => [entry.id, entry] as const))(
    "%s is the say.exe WAV, sample for sample",
    async (_id, entry) => {
      const result = await compareVoiceEntry(entry, corpus.defaults, fixtureDir);
      expect(result.error).toBeUndefined();
      expect(result.problems).toEqual([]);
      expect(result.samplesOracle).toBeGreaterThan(0);
      expect(result.packetsRender).toBe(result.packetsOracle);
      expect(result.firstMismatch).toBe(-1);
      expect(isExact(result)).toBe(true);
    },
    120000,
  );
});
