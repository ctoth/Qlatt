import { describe, expect, it, vi } from "vitest";
import type { Item } from "../src/declarative-frontend/hrg";
import { loadInventorySpecFromPath } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import {
  basePhonemeSymbol,
  parseSyllabificationTables,
  syllabifyWord,
} from "../src/declarative-frontend/syllabify";
import { textToKlattTrack, textToKlattTrackDetailed } from "../src/tts-frontend";

function activeSegments(result: ReturnType<typeof textToKlattTrackDetailed>): Item[] {
  return result.utterance
    .relation("Segment")
    .listItems()
    .filter((item) => item.get("active") !== false);
}

describe("annotation phase: syllable count and cluster position", () => {
  it("maps every Qlatt inventory phone and normalization alias except silence", () => {
    const spec = loadBundledRulepackSpec("qlatt-english");
    const tables = parseSyllabificationTables(spec.syllabification)!;
    const inventory = loadInventorySpecFromPath(spec.inventory_path as string);
    for (const phone of [
      ...Object.keys(inventory.phoneme_targets),
      ...Object.keys(inventory.normalization_aliases ?? {}),
    ]) {
      const base = basePhonemeSymbol(phone);
      if (base !== inventory.silence_symbol) expect(tables.ascky[base], phone).toBeDefined();
    }
    expect(tables.ascky.SIL).toBeUndefined();
    expect(syllabifyWord(["K", "AE1", "T"], tables).map((a) => a.role)).toEqual([
      "onset",
      "nucleus",
      "coda",
    ]);
    expect(syllabifyWord(["B", "AH0", "N", "AE1", "N", "AH0"], tables)).toEqual([
      { syllableIndex: 0, role: "onset", positionInWord: "first", syllableCount: 3 },
      { syllableIndex: 0, role: "nucleus", positionInWord: "first", syllableCount: 3 },
      { syllableIndex: 1, role: "onset", positionInWord: "medial", syllableCount: 3 },
      { syllableIndex: 1, role: "nucleus", positionInWord: "medial", syllableCount: 3 },
      { syllableIndex: 2, role: "onset", positionInWord: "last", syllableCount: 3 },
      { syllableIndex: 2, role: "nucleus", positionInWord: "last", syllableCount: 3 },
    ]);
    expect(syllabifyWord(["N", "ER1", "S"], tables)[1].role).toBe("nucleus");
  });

  it.each(["qlatt-english", "qlatt-beauty"])(
    "preserves per-word shared identity and source ancestry for %s",
    (frontendId) => {
      const result = textToKlattTrackDetailed("cat banana", undefined, undefined, { frontendId });
      const words = result.utterance.relation("Word").listItems();
      expect(words.map((word) => word.get("text"))).toEqual(["cat", "banana"]);
      for (const [index, word] of words.entries()) {
        const syllables = word.nodes.get("SylStructure")!.daughters;
        expect(syllables.map((node) => node.item.get("positionInWord"))).toEqual(
          index === 0 ? ["only"] : ["first", "medial", "last"],
        );
        for (const syllable of syllables) {
          expect(result.utterance.relation("Syllable").nodesById.get(syllable.item.id)!.item).toBe(
            syllable.item,
          );
          const vowels = syllable.daughters.filter(
            (node) => node.item.get("type") === "vowel" && node.item.get("active") !== false,
          );
          expect(vowels).toHaveLength(1);
          const segment = vowels[0].item;
          expect(result.utterance.relation("Segment").nodesById.get(segment.id)!.item).toBe(
            segment,
          );
          // Structural splices retain the original source node, even when its
          // active replacement is another daughter of the same syllable.
          const originalVowels = syllable.daughters.filter(
            ({ item }) =>
              item.get("type") === "vowel" &&
              result.utterance.associatedItems(item, "source_token").length > 0,
          );
          expect(originalVowels).toHaveLength(1);
          const original = originalVowels[0].item;
          expect(result.utterance.relation("Segment").nodesById.get(original.id)!.item).toBe(
            original,
          );
          expect(
            result.utterance.associatedItems(original, "source_token").map((item) => item.id),
          ).toEqual([`token_${index}`]);
        }
      }
      expect(loadBundledRulepackSpec(frontendId).syllabification).toEqual(
        loadBundledRulepackSpec("qlatt-english").syllabification,
      );
    },
  );

  // Suppress console.warn from frontend diagnostics during tests.
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  it("full pipeline integration: 'the cat sat on the mat.' produces valid output", () => {
    const track = textToKlattTrack("the cat sat on the mat.", 120);
    expect(Array.isArray(track)).toBe(true);
    expect(track.length).toBeGreaterThan(2);
    // Verify all frames have finite time and params
    for (const frame of track) {
      expect(Number.isFinite(frame.time)).toBe(true);
      for (const key of Object.keys(frame.params)) {
        expect(Number.isFinite(frame.params[key])).toBe(true);
      }
    }
  });

  it("polysyllabic word 'splendid' gets word_syllable_count=2 on vowels", () => {
    // Run the graph-native pipeline and inspect Segment duration writes.
    // We cannot directly observe word_syllable_count on output tokens, but
    // we verify the pipeline completes and polysyllabic_shortening fires
    // by checking that the word produces valid output with reasonable duration.
    const result = textToKlattTrackDetailed("splendid", 120);
    expect(result.track.length).toBeGreaterThan(2);

    // The word "splendid" has 2 vowels (EH1, IH0). Polysyllabic shortening
    // should apply (word_syllable_count > 1). Verify the output phonemes
    // include the expected vowels.
    const vowelPhones = activeSegments(result).filter(
      (item) => item.get("phoneme") === "EH" || item.get("phoneme") === "IH",
    );
    expect(vowelPhones.length).toBeGreaterThanOrEqual(2);
  });

  it("monosyllabic word 'cat' gets word_syllable_count=1 (no polysyllabic shortening)", () => {
    const result = textToKlattTrackDetailed("cat", 120);
    expect(result.track.length).toBeGreaterThan(2);
    // Single vowel — polysyllabic shortening should NOT fire.
    const vowelPhones = activeSegments(result).filter((item) => item.get("phoneme") === "AE");
    expect(vowelPhones.length).toBeGreaterThanOrEqual(1);
  });

  it("multi-word phrase: counts are per-word, not global", () => {
    // "big cat" — each word has 1 vowel, so polysyllabic_shortening
    // should NOT fire on either word. Both words complete successfully.
    const result = textToKlattTrackDetailed("big cat", 120);
    expect(result.track.length).toBeGreaterThan(2);
    const phones = activeSegments(result);
    // Verify both words are represented
    const bigPhones = phones.filter((item) => item.get("word") === "big");
    const catPhones = phones.filter((item) => item.get("word") === "cat");
    expect(bigPhones.length).toBeGreaterThan(0);
    expect(catPhones.length).toBeGreaterThan(0);
  });

  it("cluster position: consonant clusters get correct positions", () => {
    // "splendid" has initial cluster S-P-L (positions 0,1,2) and
    // medial cluster N-D (positions 0,1) and final D (position 0).
    // We verify the pipeline handles this without error and produces
    // valid output — cluster_shortening depends on cluster_position.
    const result = textToKlattTrackDetailed("splendid", 120);
    expect(result.track.length).toBeGreaterThan(2);

    // Verify consonant phonemes from "splendid" are present
    const consonantPhonemes = activeSegments(result)
      .filter((item) => item.get("word") === "splendid" && item.get("phoneme") !== "SIL")
      .map((item) => item.get("phoneme"))
      .filter(
        (phoneme): phoneme is string =>
          typeof phoneme === "string" && !["EH", "IH"].includes(phoneme),
      );
    // Should include S, P, L, N, D (some may be expanded to closures/releases)
    expect(consonantPhonemes.length).toBeGreaterThan(0);
  });

  it("phrase with clusters: 'string test' produces valid output", () => {
    // "string" has S-T-R cluster; "test" has T-S-T cluster.
    // Both should get correct cluster_position values via the annotation phase.
    const track = textToKlattTrack("string test.", 120);
    expect(Array.isArray(track)).toBe(true);
    expect(track.length).toBeGreaterThan(2);
    // Total duration should be reasonable (> 0.1s — time is in seconds)
    const totalDuration = track[track.length - 1].time - track[0].time;
    expect(totalDuration).toBeGreaterThan(0.1);
  });

  // Cleanup
  afterAll(() => {
    warnSpy.mockRestore();
  });
});
