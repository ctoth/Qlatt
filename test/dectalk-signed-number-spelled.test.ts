/**
 * A sign written on digits that are no number, in plain text, against the
 * stock say.exe's audio sample for sample, through the page's path
 * (scripts/oracle/dectalk-voice-compare.ts). The corpus was written and
 * committed before its export:
 *   test/oracle-corpora/dectalk-us-signed-number-spelled-v1.json (12 texts)
 *
 * DECtalk's number rules take a sign off a word only when they then read
 * the rest (LTS/ls_task.c:3148-3215), and the number reader takes a comma
 * only with three digits after it (:897-1010). A word such as "-4,5" is
 * therefore no number: it is spelled, the sign and the mark by their names,
 * "dash four comma five" (:4118-4150, LTS/ls_spel.c:151-170). "-4.5" is
 * "minus four point five".
 *
 * Before this the lexicon had no reading for such a word: the word was a
 * silence of 50 ms (EMPTY_PRONUNCIATION_SILENCE), which is no whole number
 * of this frontend's frames, and the render of the text failed. The unit
 * test below holds that no text of the corpus has such a word.
 *
 * The fixtures are the say.exe WAVs alone
 * (scripts/oracle/export-dectalk-vtm-fixture.ts --corpus ... --wav-only).
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
} from "../scripts/oracle/dectalk-voice-compare";
import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const fixtureDir = path.join("test", "fixtures", "dectalk-signed-number-spelled");
const corpus = readVoiceCorpus(
  path.join("test", "oracle-corpora", "dectalk-us-signed-number-spelled-v1.json"),
);

describe("a sign on digits that are no number", () => {
  it("is spelled by the lexicon, and no word of the corpus is left without phones", () => {
    for (const entry of corpus.entries) {
      const provenance = createProvenanceCollector();
      const diagnostics = createDiagnostics();
      textToKlattTrackDetailed(entry.text, undefined, 30, {
        frontendId: "dectalk-english",
        speaker: "paul",
        rate: 1,
        provenance,
        diagnostics,
      });
      expect(
        diagnostics.getEntries().filter((event) => event.code === "EMPTY_PRONUNCIATION_SILENCE"),
        entry.id,
      ).toEqual([]);
    }
  });

  it("records the spelling as the word's pronunciation source", () => {
    const provenance = createProvenanceCollector();
    textToKlattTrackDetailed("The lake froze at -4,5 last night.", undefined, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
      rate: 1,
      provenance,
    });
    expect(
      provenance
        .getDecisions()
        .filter((decision) => decision.subject === "word:-4,5")
        .map((decision) => decision.type),
    ).toContain("spelling_pronunciation_selected");
  });
});

describe("dectalk-us-signed-number-spelled-v1", () => {
  it.each(corpus.entries.map((entry) => [entry.id, entry] as const))(
    "%s against the say.exe WAV, sample for sample",
    async (_id, entry) => {
      const result = await compareVoiceEntry(entry, corpus.defaults, fixtureDir);
      expect(result.error).toBeUndefined();
      expect(result.samplesOracle).toBeGreaterThan(0);
      expect(result.problems).toEqual([]);
      expect(result.packetsRender).toBe(result.packetsOracle);
      expect(result.firstMismatch).toBe(-1);
      expect(isExact(result)).toBe(true);
    },
    120000,
  );
});
