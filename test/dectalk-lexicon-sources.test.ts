/**
 * The decision record of a word names the lexicon source that spoke it.
 *
 * dectalk-english has its own dictionary and letter-to-sound tables and
 * declares what they are under `transcription.sources`; its records must not
 * name the shared English sources (the CMU dictionary, the Elovitz rules, the
 * Hayes stress policy), which it does not use. A frontend that keeps the
 * shared lexicon keeps the shared names.
 */

import { describe, expect, it } from "vitest";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { createProvenanceCollector, type DecisionRecord } from "../src/provenance";
import { transcribeText } from "../src/transcribe-text";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

// A dictionary word, a suffixed word, two letter-to-sound words, a spelled
// letter, a number and an initial.
const TEXT = "Plan c is walking unhappily, 42 zorblat. A.";

function decisions(frontendId: string): DecisionRecord[] {
  const provenance = createProvenanceCollector();
  textToKlattTrackDetailed(TEXT, undefined, 30, { frontendId, provenance });
  return provenance.getDecisions();
}

function wordRecord(records: readonly DecisionRecord[], word: string): DecisionRecord {
  const record = records.find(
    (entry) => entry.type.endsWith("pronunciation_selected") && entry.subject === `word:${word}`,
  );
  if (!record) throw new Error(`no pronunciation record for '${word}'`);
  return record;
}

describe("lexicon sources in decision records", () => {
  it("names no source dectalk-english did not use", () => {
    const records = decisions("dectalk-english");
    const foreign = records.filter((entry) =>
      /CMU|Elovitz|NRL 7948|Hayes/.test(`${entry.reason} ${(entry.citations ?? []).join(" ")}`),
    );
    expect(foreign.map((entry) => `${entry.type} ${entry.subject}: ${entry.reason}`)).toEqual([]);
  });

  it("records each dectalk-english source under its own name and citation", () => {
    const records = decisions("dectalk-english");
    const is = wordRecord(records, "is");
    expect(is.type).toBe("dictionary_pronunciation_selected");
    expect(is.reason).toBe("Used DECtalk dictionary pronunciation for 'is'");
    expect(is.citations?.[0]).toContain("Dic_us.txt");

    const walking = wordRecord(records, "walking");
    expect(walking.type).toBe("morphology_pronunciation_selected");
    expect(walking.reason).toContain("(root: walk)");
    expect(walking.citations?.[0]).toContain("LTS/ls_suff.c");

    const zorblat = wordRecord(records, "zorblat");
    expect(zorblat.type).toBe("fallback_pronunciation_selected");
    expect(zorblat.reason).toBe(
      "Word 'zorblat' not in dictionary; used DECtalk letter-to-sound rules",
    );
    expect(zorblat.citations?.[0]).toContain("LTS/lsa_rta.c");

    // The spelled letter has a record of its own, not the letter-to-sound one.
    const letter = wordRecord(records, "c");
    expect(letter.type).toBe("spelling_pronunciation_selected");
    expect(letter.reason).toContain("DECtalk letter names");
    expect(letter.citations?.[0]).toContain("INCLUDE/usa_type.tab");
  });

  it("keeps the shared names in a frontend with the shared lexicon", () => {
    const records = decisions("qlatt-english");
    expect(wordRecord(records, "is").reason).toBe("Used CMU dictionary pronunciation for 'is'");
    expect(wordRecord(records, "is").citations).toEqual(["CMU Pronouncing Dictionary"]);
    expect(wordRecord(records, "zorblat").reason).toBe(
      "Word 'zorblat' not in dictionary; used Elovitz LTS + configured lexical stress",
    );
  });

  it("refuses a frontend with its own lexicon files and no declared sources", () => {
    const spec = loadBundledRulepackSpec("dectalk-english");
    const transcription = { ...(spec.transcription as Record<string, unknown>) };
    delete transcription.sources;
    expect(() =>
      transcribeText("is", {
        compiledSpec: spec,
        transcriptionConfig: transcription,
      }),
    ).toThrow(/transcription\.sources\.dictionary, transcription\.sources\.lts-rules/);
  });
});
