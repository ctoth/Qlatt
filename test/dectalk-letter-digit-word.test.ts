/**
 * A word of letters and digits after a decimal number, in plain text,
 * against the stock say.exe's audio sample for sample, through the page's
 * path (scripts/oracle/dectalk-voice-compare.ts). The corpus was written and
 * committed before its export:
 *   test/oracle-corpora/dectalk-us-letter-digit-word-v1.json (8 texts)
 *
 * DECtalk's text parser writes a decimal number out ("2.5e3" becomes
 * " 2 point 5 e3") and leaves what stood against it as one word. Its text
 * task reads a word of letters, digits, hyphens and slashes that has a digit
 * or a slash as a part number (LTS/ls_task.c:4118-4178; the word needs no
 * hyphen): each run of digits a number, each run of letters the dictionary's
 * word when it has three letters or more and the dictionary has it, and
 * letter by letter otherwise (LTS/l_us_pr1.c:161-255). "e3" is "e three",
 * "ml4" "m l four", "b12c" "b twelve c", "gig8" "g i g eight".
 *
 * The lexicon's part-number reader asked for a hyphen beside the digit, so
 * such a word was read by the letter-to-sound rules ("e3" was EH).
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
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const fixtureDir = path.join("test", "fixtures", "dectalk-letter-digit-word");
const corpus = readVoiceCorpus(
  path.join("test", "oracle-corpora", "dectalk-us-letter-digit-word-v1.json"),
);

describe("a word of letters and digits after a decimal number", () => {
  it("is read by the number reader, not by the letter-to-sound rules", () => {
    const provenance = createProvenanceCollector();
    textToKlattTrackDetailed("The gain was 2.5e3 at most.", undefined, 30, {
      frontendId: "dectalk-english",
      speaker: "paul",
      rate: 1,
      provenance,
    });
    expect(
      provenance
        .getDecisions()
        .filter((decision) => decision.subject === "word:e3")
        .map((decision) => decision.type),
    ).toEqual(["number_pronunciation_selected"]);
  });
});

describe("dectalk-us-letter-digit-word-v1", () => {
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
