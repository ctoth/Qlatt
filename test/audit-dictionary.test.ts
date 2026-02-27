/**
 * Full-dictionary audit test -- RED baseline
 *
 * Runs words from the CMU dictionary through textToKlattTrack() and checks
 * 4 correctness categories:
 *   1. Diphthong expansion (diph components should appear as separate segments)
 *   2. Word-final stop release (stops at end of utterance should have release)
 *   3. Voicing bleed (SIL pad frames should have AV === 0)
 *   4. Segment duration floors (manner-class minimums)
 *
 * Default: ~5k word subset ensuring phoneme coverage.
 * Full mode: FULL_AUDIT=1 env var processes all ~135k words.
 */

import { describe, expect, it, vi, beforeAll } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";
import {
  DIPHTHONG_BASES,
  DIPHTHONG_COMPONENTS,
  GLIDE_PHONEMES,
  LIQUID_PHONEMES,
  NASAL_PHONEMES,
  STOP_BASES,
  extractSegments,
  expectNoViolationsOrReport,
  isAuditReportOnlyMode,
  loadCmuDictionary,
  selectAuditWords,
  stripStress,
  type Frame,
  type Segment,
} from "./utils/cmudict-audit";

// -- Types ------------------------------------------------------------------

interface DiphthongViolation {
  word: string;
  arpabet: string;
  diphthong: string;
  segmentPhonemes: string[];
}

interface StopReleaseViolation {
  word: string;
  arpabet: string;
  lastSegments: string[];
}

interface VoicingBleedViolation {
  word: string;
  silFrameTime: number;
  avValue: number;
}

interface DurationFloorViolation {
  word: string;
  phoneme: string;
  durationMs: number;
  minimumMs: number;
}

// -- Helpers ----------------------------------------------------------------

const CLOSURE_SUFFIXES = ["_CL"];

// -- Test Suite -------------------------------------------------------------

describe("full dictionary audit", () => {
  const isFullAudit = process.env.FULL_AUDIT === "1";

  // Shared state populated in beforeAll
  let auditWords: [string, string][] = [];
  const trackCache = new Map<string, Frame[]>();
  const segmentCache = new Map<string, Segment[]>();

  beforeAll(
    async () => {
      // Load CMU dictionary
      const dict = loadCmuDictionary();

      // Select words
      if (isFullAudit) {
        auditWords = Object.entries(dict);
      } else {
        auditWords = selectAuditWords(dict);
      }

      console.log(
        `\n[audit] Mode: ${isFullAudit ? "FULL" : "subset"}, ${auditWords.length} words selected`
      );
      if (isAuditReportOnlyMode()) {
        console.log("[audit] Report-only mode enabled: violations will be logged but not fail tests");
      }

      // Suppress console warnings during bulk processing
      const warnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      try {
        let processed = 0;
        let errors = 0;
        for (const [word] of auditWords) {
          try {
            const track = textToKlattTrack(word) as Frame[];
            trackCache.set(word, track);
            segmentCache.set(word, extractSegments(track));
          } catch {
            errors++;
          }
          processed++;
          if (processed % 5000 === 0) {
            console.log(
              `  processed ${processed}/${auditWords.length}...`
            );
          }
        }
        console.log(
          `[audit] Processing complete: ${trackCache.size} tracks cached` +
            ` (${errors} errors)\n`
        );
      } finally {
        warnSpy.mockRestore();
      }
    },
    600_000 // 10 minute timeout
  );

  // -- Block 1: Diphthong Expansion -----------------------------------------

  describe("diphthong expansion", () => {
    it("diphthongs should be expanded into component sub-segments", () => {
      const violations: DiphthongViolation[] = [];
      const countByDiphthong: Record<string, number> = {};
      let diphthongWordsCount = 0;

      for (const [word, arpabet] of auditWords) {
        const segments = segmentCache.get(word);
        if (!segments) continue;

        // Check if this word contains any diphthong
        const phones = arpabet.split(" ");
        const diphsInWord = phones
          .map((p) => stripStress(p))
          .filter((p) => DIPHTHONG_BASES.has(p));
        if (diphsInWord.length === 0) continue;

        diphthongWordsCount++;
        const segPhonemes = segments.map((s) => s.phoneme);

        // Check each diphthong in the word
        for (const diph of diphsInWord) {
          // A violation = any segment whose base phoneme matches a diphthong
          // (meaning it was NOT expanded into components)
          const hasUnexpanded = segPhonemes.some(
            (sp) => stripStress(sp) === diph
          );

          if (hasUnexpanded) {
            countByDiphthong[diph] =
              (countByDiphthong[diph] || 0) + 1;
            violations.push({
              word,
              arpabet,
              diphthong: diph,
              segmentPhonemes: segPhonemes,
            });
          }
        }
      }

      // Log informative output
      const affectedWords = new Set(violations.map((v) => v.word)).size;
      console.log(
        `\ndiphthong expansion: ${affectedWords} words affected` +
          ` (of ${diphthongWordsCount} diphthong words tested)`
      );
      for (const [diph, count] of Object.entries(
        countByDiphthong
      ).sort()) {
        const [c1, c2] = DIPHTHONG_COMPONENTS[diph];
        console.log(
          `  ${diph}: ${count} violations (expected -> [${c1},${c2}])`
        );
      }
      if (violations.length > 0) {
        console.log(`  First 20 violations:`);
        for (const v of violations.slice(0, 20)) {
          const [c1, c2] = DIPHTHONG_COMPONENTS[v.diphthong];
          console.log(
            `    ${v.word} (${v.diphthong}): segments=[${v.segmentPhonemes.join(",")}]` +
              ` -- ${v.diphthong} not expanded to [${c1},${c2}]`
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} diphthong expansion violations in ${affectedWords} words` +
          ` (first: ${violations[0]?.word ?? "none"})`
      );
    });
  });

  // -- Block 2: Word-Final Stop Release -------------------------------------

  describe("word-final stop release", () => {
    it("words ending in stops should have a release segment", () => {
      const violations: StopReleaseViolation[] = [];
      let stopFinalWordsCount = 0;

      for (const [word, arpabet] of auditWords) {
        const segments = segmentCache.get(word);
        if (!segments) continue;

        // Check if ARPABET ends with a stop
        const phones = arpabet.split(" ");
        const lastBase = stripStress(phones[phones.length - 1]);
        if (!STOP_BASES.has(lastBase)) continue;

        stopFinalWordsCount++;
        const segPhonemes = segments.map((s) => s.phoneme);

        // Find last non-SIL segment
        let lastNonSilIdx = segPhonemes.length - 1;
        while (
          lastNonSilIdx >= 0 &&
          segPhonemes[lastNonSilIdx] === "SIL"
        ) {
          lastNonSilIdx--;
        }

        if (lastNonSilIdx < 0) continue;

        const lastNonSil = segPhonemes[lastNonSilIdx];

        // If last non-SIL is a closure (*_CL) with no release following -> violation
        if (lastNonSil.endsWith("_CL")) {
          const hasRelease = segPhonemes
            .slice(lastNonSilIdx + 1)
            .some(
              (p) => p.endsWith("_REL") || p.endsWith("_ASP")
            );

          if (!hasRelease) {
            const contextStart = Math.max(
              0,
              lastNonSilIdx - 2
            );
            violations.push({
              word,
              arpabet,
              lastSegments: segPhonemes.slice(contextStart),
            });
          }
        }
      }

      // Log informative output
      console.log(
        `\nword-final stop release: ${violations.length} violations` +
          ` (of ${stopFinalWordsCount} stop-final words tested)`
      );
      if (violations.length > 0) {
        console.log(`  First 20 violations:`);
        for (const v of violations.slice(0, 20)) {
          console.log(
            `    ${v.word} (${v.arpabet}): last segments=[${v.lastSegments.join(",")}]`
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} stop-final words missing release` +
          ` (first: ${violations[0]?.word ?? "none"})`
      );
    });
  });

  // -- Block 3: Voicing Bleed -----------------------------------------------

  describe("voicing bleed", () => {
    it("trailing SIL frames should have AV=0", () => {
      const violations: VoicingBleedViolation[] = [];
      let wordsChecked = 0;

      for (const [word] of auditWords) {
        const track = trackCache.get(word);
        if (!track || track.length === 0) continue;

        wordsChecked++;

        // Walk backwards from the end to find trailing SIL frames
        let i = track.length - 1;
        while (i >= 0) {
          const frame = track[i];
          const phoneme = frame.phoneme ?? "SIL";
          if (phoneme !== "SIL") break;

          const av = frame.params?.AV ?? 0;
          if (av > 0) {
            violations.push({
              word,
              silFrameTime: frame.time,
              avValue: av,
            });
          }
          i--;
        }
      }

      // Log informative output
      const affectedWords = new Set(violations.map((v) => v.word)).size;
      console.log(
        `\nvoicing bleed: ${violations.length} SIL frames with AV>0` +
          ` in ${affectedWords} words (of ${wordsChecked} words checked)`
      );
      if (violations.length > 0) {
        console.log(`  First 20 violations:`);
        for (const v of violations.slice(0, 20)) {
          console.log(
            `    ${v.word}: SIL frame at t=${v.silFrameTime.toFixed(3)}s has AV=${v.avValue}`
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} trailing SIL frames with AV>0` +
          ` in ${affectedWords} words`
      );
    });
  });

  // -- Block 4: Segment Duration Floors -------------------------------------

  describe("segment duration floors", () => {
    it("segments should respect manner-class minimum durations", () => {
      const violations: DurationFloorViolation[] = [];
      let segmentsChecked = 0;

      for (const [word] of auditWords) {
        const segments = segmentCache.get(word);
        if (!segments) continue;

        for (const seg of segments) {
          // Skip SIL segments
          if (seg.phoneme === "SIL") continue;
          // Skip stop releases and aspirations
          if (
            seg.phoneme.endsWith("_REL") ||
            seg.phoneme.endsWith("_ASP")
          )
            continue;

          const base = stripStress(seg.phoneme);
          let minimumMs: number | null = null;

          if (NASAL_PHONEMES.has(base)) {
            minimumMs = 40;
          } else if (seg.phoneme.endsWith("_CL")) {
            minimumMs = 20;
          } else if (LIQUID_PHONEMES.has(base)) {
            minimumMs = 30;
          } else if (GLIDE_PHONEMES.has(base)) {
            minimumMs = 30;
          }

          if (minimumMs !== null) {
            segmentsChecked++;
            // Use a small epsilon for floating point comparison
            if (seg.durationMs < minimumMs - 0.01) {
              violations.push({
                word,
                phoneme: seg.phoneme,
                durationMs:
                  Math.round(seg.durationMs * 100) / 100,
                minimumMs,
              });
            }
          }
        }
      }

      // Log informative output
      const affectedWords = new Set(violations.map((v) => v.word)).size;
      const byClass: Record<string, number> = {};
      for (const v of violations) {
        const base = stripStress(v.phoneme);
        let cls = "other";
        if (NASAL_PHONEMES.has(base)) cls = "nasal";
        else if (v.phoneme.endsWith("_CL")) cls = "closure";
        else if (LIQUID_PHONEMES.has(base)) cls = "liquid";
        else if (GLIDE_PHONEMES.has(base)) cls = "glide";
        byClass[cls] = (byClass[cls] || 0) + 1;
      }

      console.log(
        `\nsegment duration floors: ${violations.length} violations` +
          ` in ${affectedWords} words (${segmentsChecked} segments checked)`
      );
      for (const [cls, count] of Object.entries(byClass).sort()) {
        console.log(`  ${cls}: ${count} violations`);
      }
      if (violations.length > 0) {
        console.log(`  First 20 violations:`);
        for (const v of violations.slice(0, 20)) {
          console.log(
            `    ${v.word}: ${v.phoneme} = ${v.durationMs}ms (minimum: ${v.minimumMs}ms)`
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} duration floor violations in ${affectedWords} words` +
          ` (first: ${violations[0]?.word ?? "none"}: ${violations[0]?.phoneme ?? ""} = ${violations[0]?.durationMs ?? ""}ms)`
      );
    });
  });
});
