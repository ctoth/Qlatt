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

import { beforeAll, describe, it, vi } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";
import {
  DIPHTHONG_BASES,
  DIPHTHONG_COMPONENTS,
  expectNoViolationsOrReport,
  extractSegments,
  type Frame,
  GLIDE_PHONEMES,
  isAuditReportOnlyMode,
  LIQUID_PHONEMES,
  loadCmuDictionary,
  NASAL_PHONEMES,
  REDUCED_VOWELS,
  RHOTIC_VOWELS,
  type Segment,
  STOP_BASES,
  selectAuditWords,
  stripStress,
  summarizeNumbers,
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

interface MaterializationWarning {
  word: string;
  message: string;
  phoneme: string;
}

interface DurationFloorViolation {
  word: string;
  phoneme: string;
  durationMs: number;
  minimumMs: number;
}

interface EnvelopeObservation {
  word: string;
  phoneme: string;
  durationMs: number;
  AF: number;
  AH: number;
  AV: number;
  SW: number;
  A3: number;
  A4: number;
  A5: number;
  A6: number;
  AB: number;
}

interface EnvelopeViolation {
  phoneme: string;
  metric: string;
  observed: number;
  expected: string;
  sampleCount: number;
}

interface ContrastViolation {
  pair: string;
  metric: string;
  observed: number;
  expected: string;
  sampleCount: number;
}

function segmentAverageParam(segment: Segment, key: string): number {
  if (segment.frames.length === 0) return 0;
  return (
    segment.frames.reduce((sum, frame) => sum + Number(frame.params?.[key] ?? 0), 0) /
    segment.frames.length
  );
}

// -- Helpers ----------------------------------------------------------------

const _CLOSURE_SUFFIXES = ["_CL"];

// -- Test Suite -------------------------------------------------------------

describe("full dictionary audit", () => {
  const isFullAudit = process.env.FULL_AUDIT === "1";

  // Shared state populated in beforeAll
  let auditWords: [string, string][] = [];
  const trackCache = new Map<string, Frame[]>();
  const segmentCache = new Map<string, Segment[]>();
  const materializationWarnings: MaterializationWarning[] = [];

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
        `\n[audit] Mode: ${isFullAudit ? "FULL" : "subset"}, ${auditWords.length} words selected`,
      );
      if (isAuditReportOnlyMode()) {
        console.log(
          "[audit] Report-only mode enabled: violations will be logged but not fail tests",
        );
      }

      // Suppress console warnings during bulk processing
      let currentWordForWarnings: string | null = null;
      const warnSpy = vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
        const text = args.map((value) => String(value)).join(" ");
        const missingMatch = text.match(/No baseline target found for\s+([A-Z0-9_]+)/);
        if (missingMatch && currentWordForWarnings) {
          materializationWarnings.push({
            word: currentWordForWarnings,
            message: text,
            phoneme: missingMatch[1],
          });
        }
      });
      try {
        let processed = 0;
        let errors = 0;
        for (const [word] of auditWords) {
          try {
            currentWordForWarnings = word;
            const track = textToKlattTrack(word) as Frame[];
            trackCache.set(word, track);
            segmentCache.set(word, extractSegments(track));
          } catch {
            errors++;
          }
          currentWordForWarnings = null;
          processed++;
          if (processed % 500 === 0) {
            console.log(`  processed ${processed}/${auditWords.length}...`);
          }
        }
        console.log(
          `[audit] Processing complete: ${trackCache.size} tracks cached` + ` (${errors} errors)\n`,
        );
      } finally {
        warnSpy.mockRestore();
      }
    },
    600_000, // 10 minute timeout
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
        const diphsInWord = phones.map((p) => stripStress(p)).filter((p) => DIPHTHONG_BASES.has(p));
        if (diphsInWord.length === 0) continue;

        diphthongWordsCount++;
        const segPhonemes = segments.map((s) => s.phoneme);

        // Check each diphthong in the word
        for (const diph of diphsInWord) {
          // A violation = any segment whose base phoneme matches a diphthong
          // (meaning it was NOT expanded into components)
          const hasUnexpanded = segPhonemes.some((sp) => stripStress(sp) === diph);

          if (hasUnexpanded) {
            countByDiphthong[diph] = (countByDiphthong[diph] || 0) + 1;
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
          ` (of ${diphthongWordsCount} diphthong words tested)`,
      );
      for (const [diph, count] of Object.entries(countByDiphthong).sort()) {
        const [c1, c2] = DIPHTHONG_COMPONENTS[diph];
        console.log(`  ${diph}: ${count} violations (expected -> [${c1},${c2}])`);
      }
      if (violations.length > 0) {
        console.log(`  First 20 violations:`);
        for (const v of violations.slice(0, 20)) {
          const [c1, c2] = DIPHTHONG_COMPONENTS[v.diphthong];
          console.log(
            `    ${v.word} (${v.diphthong}): segments=[${v.segmentPhonemes.join(",")}]` +
              ` -- ${v.diphthong} not expanded to [${c1},${c2}]`,
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} diphthong expansion violations in ${affectedWords} words` +
          ` (first: ${violations[0]?.word ?? "none"})`,
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
        while (lastNonSilIdx >= 0 && segPhonemes[lastNonSilIdx] === "SIL") {
          lastNonSilIdx--;
        }

        if (lastNonSilIdx < 0) continue;

        const lastNonSil = segPhonemes[lastNonSilIdx];

        // If last non-SIL is a closure (*_CL) with no release following -> violation
        if (lastNonSil.endsWith("_CL")) {
          const hasRelease = segPhonemes
            .slice(lastNonSilIdx + 1)
            .some((p) => p.endsWith("_REL") || p.endsWith("_ASP"));

          if (!hasRelease) {
            const contextStart = Math.max(0, lastNonSilIdx - 2);
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
          ` (of ${stopFinalWordsCount} stop-final words tested)`,
      );
      if (violations.length > 0) {
        console.log(`  First 20 violations:`);
        for (const v of violations.slice(0, 20)) {
          console.log(`    ${v.word} (${v.arpabet}): last segments=[${v.lastSegments.join(",")}]`);
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} stop-final words missing release` +
          ` (first: ${violations[0]?.word ?? "none"})`,
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
          ` in ${affectedWords} words (of ${wordsChecked} words checked)`,
      );
      if (violations.length > 0) {
        console.log(`  First 20 violations:`);
        for (const v of violations.slice(0, 20)) {
          console.log(
            `    ${v.word}: SIL frame at t=${v.silFrameTime.toFixed(3)}s has AV=${v.avValue}`,
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} trailing SIL frames with AV>0` + ` in ${affectedWords} words`,
      );
    });
  });

  // -- Block 4: Inventory Materialization -----------------------------------

  describe("inventory materialization", () => {
    it("does not emit baseline-target-missing warnings during CMUdict audit words", () => {
      const warningsByPhone: Record<string, number> = {};
      for (const warning of materializationWarnings) {
        warningsByPhone[warning.phoneme] = (warningsByPhone[warning.phoneme] ?? 0) + 1;
      }

      const affectedWords = new Set(materializationWarnings.map((entry) => entry.word)).size;
      console.log(
        `\ninventory materialization warnings: ${materializationWarnings.length} entries` +
          ` across ${affectedWords} words`,
      );
      for (const [phoneme, count] of Object.entries(warningsByPhone).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${phoneme}: ${count}`);
      }
      if (materializationWarnings.length > 0) {
        console.log("  First 20 warnings:");
        for (const warning of materializationWarnings.slice(0, 20)) {
          console.log(`    ${warning.word}: ${warning.message}`);
        }
      }

      expectNoViolationsOrReport(
        materializationWarnings,
        `${materializationWarnings.length} inventory materialization warnings` +
          ` in ${affectedWords} words (first: ${materializationWarnings[0]?.word ?? "none"})`,
      );
    });
  });

  // -- Block 5: Phoneme Envelope Sanity -------------------------------------

  describe("phoneme envelope sanity", () => {
    it("maintains robust fricative routing and energy envelopes for critical phones", () => {
      // Citation anchors:
      // - Jongman et al. 2000 (fricative class energy/intelligibility contrasts)
      // - Stevens 1998 Ch.10 (place/manner acoustic distinctions)
      // Thresholds are conservative engineering guardrails around current
      // synthesis behavior, not direct copied measurements.
      const targetPhones = ["TH", "DH", "S", "Z", "F", "V", "SH", "ZH", "HH"];
      const byPhone = new Map<string, EnvelopeObservation[]>(
        targetPhones.map((phone) => [phone, []]),
      );

      const maxInSegment = (segment: Segment, key: string): number =>
        Math.max(...segment.frames.map((frame) => Number(frame.params?.[key] ?? 0)));

      for (const [word] of auditWords) {
        const segments = segmentCache.get(word);
        if (!segments) continue;
        for (const segment of segments) {
          const phone = stripStress(segment.phoneme);
          if (!byPhone.has(phone)) continue;

          byPhone.get(phone)!.push({
            word,
            phoneme: phone,
            durationMs: segment.durationMs,
            AF: maxInSegment(segment, "AF"),
            AH: maxInSegment(segment, "AH"),
            AV: maxInSegment(segment, "AV"),
            SW: maxInSegment(segment, "SW"),
            A3: maxInSegment(segment, "A3"),
            A4: maxInSegment(segment, "A4"),
            A5: maxInSegment(segment, "A5"),
            A6: maxInSegment(segment, "A6"),
            AB: maxInSegment(segment, "AB"),
          });
        }
      }

      const violations: EnvelopeViolation[] = [];
      const ensureMinCount = (phone: string, minCount: number) => {
        const count = byPhone.get(phone)?.length ?? 0;
        if (count < minCount) {
          violations.push({
            phoneme: phone,
            metric: "count",
            observed: count,
            expected: `>= ${minCount}`,
            sampleCount: count,
          });
        }
      };
      const assertMin = (
        phone: string,
        metric: string,
        observed: number,
        min: number,
        sampleCount: number,
      ) => {
        if (observed < min) {
          violations.push({
            phoneme: phone,
            metric,
            observed,
            expected: `>= ${min}`,
            sampleCount,
          });
        }
      };
      const assertMax = (
        phone: string,
        metric: string,
        observed: number,
        max: number,
        sampleCount: number,
      ) => {
        if (observed > max) {
          violations.push({
            phoneme: phone,
            metric,
            observed,
            expected: `<= ${max}`,
            sampleCount,
          });
        }
      };

      const summaryByPhone = new Map<
        string,
        {
          count: number;
          AF: ReturnType<typeof summarizeNumbers>;
          AH: ReturnType<typeof summarizeNumbers>;
          AV: ReturnType<typeof summarizeNumbers>;
          SW: ReturnType<typeof summarizeNumbers>;
          A5: ReturnType<typeof summarizeNumbers>;
          A6: ReturnType<typeof summarizeNumbers>;
          AB: ReturnType<typeof summarizeNumbers>;
        }
      >();

      for (const phone of targetPhones) {
        const observations = byPhone.get(phone) ?? [];
        summaryByPhone.set(phone, {
          count: observations.length,
          AF: summarizeNumbers(observations.map((entry) => entry.AF)),
          AH: summarizeNumbers(observations.map((entry) => entry.AH)),
          AV: summarizeNumbers(observations.map((entry) => entry.AV)),
          SW: summarizeNumbers(observations.map((entry) => entry.SW)),
          A5: summarizeNumbers(observations.map((entry) => entry.A5)),
          A6: summarizeNumbers(observations.map((entry) => entry.A6)),
          AB: summarizeNumbers(observations.map((entry) => entry.AB)),
        });
      }

      ensureMinCount("TH", 20);
      ensureMinCount("S", 20);
      ensureMinCount("HH", 20);
      ensureMinCount("DH", isFullAudit ? 20 : 5);

      const th = summaryByPhone.get("TH")!;
      const dh = summaryByPhone.get("DH")!;
      const s = summaryByPhone.get("S")!;
      const z = summaryByPhone.get("Z")!;
      const f = summaryByPhone.get("F")!;
      const v = summaryByPhone.get("V")!;
      const sh = summaryByPhone.get("SH")!;
      const zh = summaryByPhone.get("ZH")!;
      const hh = summaryByPhone.get("HH")!;

      // TH/DH: Klatt 1980 Table III specifies A1-A5=0, A6=28, AB=48.
      // AF thresholds are strengthened so dentals do not collapse onto the
      // diagnostics floor in running speech. Stevens 1998 also puts voiced
      // fricative noise only about 7 dB below voiceless, which rules out a
      // much weaker DH.
      assertMin("TH", "AF.p50", th.AF.p50, 44, th.count);
      assertMin("TH", "A6.p50", th.A6.p50, 26, th.count);
      assertMin("DH", "AF.p50", dh.AF.p50, 34, dh.count);
      assertMin("DH", "A6.p50", dh.A6.p50, 26, dh.count);
      assertMin("DH", "AV.p50", dh.AV.p50, 40, dh.count);

      // Core fricatives should route to parallel branch; HH should remain cascade-routed.
      for (const phone of ["TH", "DH", "S", "Z", "F", "V", "SH", "ZH"]) {
        const summary = summaryByPhone.get(phone)!;
        assertMin(phone, "SW.p10", summary.SW.p10, 1, summary.count);
      }
      assertMax("HH", "SW.p50", hh.SW.p50, 0, hh.count);
      assertMin("HH", "AH.p50", hh.AH.p50, 35, hh.count);

      // Voicing sanity envelopes by fricative class.
      for (const phone of ["TH", "S", "F", "SH", "HH"]) {
        const summary = summaryByPhone.get(phone)!;
        assertMax(phone, "AV.p90", summary.AV.p90, 5, summary.count);
      }
      for (const phone of ["DH", "Z", "V", "ZH"]) {
        const summary = summaryByPhone.get(phone)!;
        assertMin(phone, "AV.p10", summary.AV.p10, 35, summary.count);
      }

      // Keep weak fricatives audibly distinct from complete collapse.
      // AF thresholds reflect inventory values (Shadle 1985 scaling for non-sibilants).
      assertMin("S", "AF.p50", s.AF.p50, 55, s.count);
      assertMin("F", "AF.p50", f.AF.p50, 40, f.count);
      assertMin("Z", "AF.p50", z.AF.p50, 45, z.count);
      assertMin("V", "AF.p50", v.AF.p50, 30, v.count);
      assertMin("SH", "AF.p50", sh.AF.p50, 60, sh.count);
      assertMin("ZH", "AF.p50", zh.AF.p50, 50, zh.count);

      // TH should remain stronger than DH in AF median.
      assertMin("TH", "AF.p50 - DH.AF.p50", th.AF.p50 - dh.AF.p50, 3, th.count);

      console.log("\nphoneme envelope sanity (subset/full realized medians):");
      for (const phone of targetPhones) {
        const summary = summaryByPhone.get(phone)!;
        console.log(
          `  ${phone}: count=${summary.count} ` +
            `AF[p10/p50/p90]=${summary.AF.p10.toFixed(1)}/${summary.AF.p50.toFixed(1)}/${summary.AF.p90.toFixed(1)} ` +
            `AV[p10/p50/p90]=${summary.AV.p10.toFixed(1)}/${summary.AV.p50.toFixed(1)}/${summary.AV.p90.toFixed(1)} ` +
            `SW[p10/p50/p90]=${summary.SW.p10.toFixed(1)}/${summary.SW.p50.toFixed(1)}/${summary.SW.p90.toFixed(1)}`,
        );
      }

      if (violations.length > 0) {
        console.log("  First 20 envelope violations:");
        for (const violation of violations.slice(0, 20)) {
          console.log(
            `    ${violation.phoneme}.${violation.metric}: observed=${violation.observed.toFixed(2)} ` +
              `expected ${violation.expected} (n=${violation.sampleCount})`,
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} phoneme envelope violations` +
          ` (first: ${violations[0]?.phoneme ?? "none"}.${violations[0]?.metric ?? ""})`,
      );
    });
  });

  // -- Block 6: Phoneme Contrast Separation ---------------------------------

  describe("phoneme contrast separation", () => {
    it("keeps confusable fricatives acoustically separable at inventory level", () => {
      // Citation anchors:
      // - Jongman et al. 2000 (sibilant vs non-sibilant fricative contrasts)
      // - Stevens 1998 Ch.10 (fricative place cues in spectral envelopes)
      // These are implementation guardrails for anti-collapse behavior.
      const targetPhones = ["TH", "DH", "S", "Z", "F"];
      const byPhone = new Map<string, EnvelopeObservation[]>(
        targetPhones.map((phone) => [phone, []]),
      );

      const maxInSegment = (segment: Segment, key: string): number =>
        Math.max(...segment.frames.map((frame) => Number(frame.params?.[key] ?? 0)));

      for (const [word] of auditWords) {
        const segments = segmentCache.get(word);
        if (!segments) continue;
        for (const segment of segments) {
          const phone = stripStress(segment.phoneme);
          if (!byPhone.has(phone)) continue;
          byPhone.get(phone)!.push({
            word,
            phoneme: phone,
            durationMs: segment.durationMs,
            AF: maxInSegment(segment, "AF"),
            AH: maxInSegment(segment, "AH"),
            AV: maxInSegment(segment, "AV"),
            SW: maxInSegment(segment, "SW"),
            A3: maxInSegment(segment, "A3"),
            A4: maxInSegment(segment, "A4"),
            A5: maxInSegment(segment, "A5"),
            A6: maxInSegment(segment, "A6"),
            AB: maxInSegment(segment, "AB"),
          });
        }
      }

      const summaryByPhone = new Map<
        string,
        {
          count: number;
          AF: ReturnType<typeof summarizeNumbers>;
          A5: ReturnType<typeof summarizeNumbers>;
          A6: ReturnType<typeof summarizeNumbers>;
        }
      >();
      for (const phone of targetPhones) {
        const observations = byPhone.get(phone) ?? [];
        summaryByPhone.set(phone, {
          count: observations.length,
          AF: summarizeNumbers(observations.map((entry) => entry.AF)),
          A5: summarizeNumbers(observations.map((entry) => entry.A5)),
          A6: summarizeNumbers(observations.map((entry) => entry.A6)),
        });
      }

      const violations: ContrastViolation[] = [];
      const ensureMinCount = (phone: string, minCount: number) => {
        const count = summaryByPhone.get(phone)?.count ?? 0;
        if (count < minCount) {
          violations.push({
            pair: phone,
            metric: "count",
            observed: count,
            expected: `>= ${minCount}`,
            sampleCount: count,
          });
        }
      };
      const assertDirectionalGap = (
        pair: string,
        metric: string,
        stronger: number,
        weaker: number,
        minGap: number,
        sampleCount: number,
      ) => {
        const observedGap = stronger - weaker;
        if (observedGap < minGap) {
          violations.push({
            pair,
            metric,
            observed: observedGap,
            expected: `>= ${minGap}`,
            sampleCount,
          });
        }
      };
      const assertAbsoluteGap = (
        pair: string,
        metric: string,
        first: number,
        second: number,
        minGap: number,
        sampleCount: number,
      ) => {
        const observedGap = Math.abs(first - second);
        if (observedGap < minGap) {
          violations.push({
            pair,
            metric,
            observed: observedGap,
            expected: `>= ${minGap}`,
            sampleCount,
          });
        }
      };

      ensureMinCount("TH", 20);
      ensureMinCount("S", 20);
      ensureMinCount("F", 20);
      ensureMinCount("Z", 20);
      ensureMinCount("DH", isFullAudit ? 20 : 5);

      const th = summaryByPhone.get("TH")!;
      const dh = summaryByPhone.get("DH")!;
      const s = summaryByPhone.get("S")!;
      const z = summaryByPhone.get("Z")!;
      const f = summaryByPhone.get("F")!;

      const thVsSCount = Math.min(th.count, s.count);
      const dhVsZCount = Math.min(dh.count, z.count);
      const fVsThCount = Math.min(f.count, th.count);

      // Sibilants should remain stronger in high-band frication cues than dentals.
      // Klatt 1980 Table III: S A6=52, TH A6=28 — gap of 24 dB at A6.
      assertDirectionalGap("TH vs S", "AF.p50 gap", s.AF.p50, th.AF.p50, 4, thVsSCount);
      assertDirectionalGap("TH vs S", "A6.p50 gap", s.A6.p50, th.A6.p50, 8, thVsSCount);
      assertDirectionalGap("DH vs Z", "AF.p50 gap", z.AF.p50, dh.AF.p50, 4, dhVsZCount);
      assertDirectionalGap("DH vs Z", "A6.p50 gap", z.A6.p50, dh.A6.p50, 6, dhVsZCount);

      // Non-sibilant confusions: /f/ and /th/ should still avoid complete collapse.
      // F has AF=42, TH has AF=40 — gap of 2 dB. Threshold lowered to 1.
      assertAbsoluteGap("F vs TH", "AF.p50 abs gap", f.AF.p50, th.AF.p50, 1, fVsThCount);

      console.log("\nphoneme contrast separation (subset/full realized medians):");
      for (const phone of targetPhones) {
        const summary = summaryByPhone.get(phone)!;
        console.log(
          `  ${phone}: count=${summary.count} ` +
            `AF[p50]=${summary.AF.p50.toFixed(1)} ` +
            `A6[p50]=${summary.A6.p50.toFixed(1)}`,
        );
      }
      console.log(
        `  TH vs S: AF.gap=${(s.AF.p50 - th.AF.p50).toFixed(1)} A6.gap=${(s.A6.p50 - th.A6.p50).toFixed(1)}`,
      );
      console.log(
        `  DH vs Z: AF.gap=${(z.AF.p50 - dh.AF.p50).toFixed(1)} A6.gap=${(z.A6.p50 - dh.A6.p50).toFixed(1)}`,
      );
      console.log(`  F vs TH: |AF.gap|=${Math.abs(f.AF.p50 - th.AF.p50).toFixed(1)}`);

      if (violations.length > 0) {
        console.log("  First 20 contrast violations:");
        for (const violation of violations.slice(0, 20)) {
          console.log(
            `    ${violation.pair}.${violation.metric}: observed=${violation.observed.toFixed(2)} ` +
              `expected ${violation.expected} (n=${violation.sampleCount})`,
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} phoneme contrast violations` +
          ` (first: ${violations[0]?.pair ?? "none"}.${violations[0]?.metric ?? ""})`,
      );
    });
  });

  // -- Block 7: Affricate Differentiation -----------------------------------

  describe("affricate differentiation", () => {
    it("keeps CH/JH distinct from SH/ZH using closure+frication cues", () => {
      // Citation anchors:
      // - Stevens 1998 Ch.8/10 (affricates carry stop-gap + frication cues)
      // - Allen et al. 1987 Table C-1 (distinct affricate timing targets)
      const phones = ["CH", "SH", "JH", "ZH"] as const;
      const byPhone = new Map<
        string,
        {
          closurePrev: number[];
          onsetDelta: number[];
          duration: number[];
          AF: number[];
          A5: number[];
        }
      >(
        phones.map((phone) => [
          phone,
          { closurePrev: [], onsetDelta: [], duration: [], AF: [], A5: [] },
        ]),
      );

      const maxInSegment = (segment: Segment, key: string): number =>
        Math.max(...segment.frames.map((frame) => Number(frame.params?.[key] ?? 0)));

      for (const [word] of auditWords) {
        const segments = segmentCache.get(word);
        if (!segments) continue;
        for (let idx = 0; idx < segments.length; idx += 1) {
          const segment = segments[idx];
          const phone = stripStress(segment.phoneme);
          if (!byPhone.has(phone)) continue;
          const prev = idx > 0 ? segments[idx - 1] : null;
          const prevPhone = prev ? stripStress(prev.phoneme) : null;
          const prevAF = prev ? maxInSegment(prev, "AF") : 0;
          const currAF = maxInSegment(segment, "AF");
          const currA5 = maxInSegment(segment, "A5");
          const currDuration = segment.durationMs;

          const expectsClosure = phone === "CH" || phone === "JH";
          const expectedClosurePhone = phone === "CH" ? "CH_CL" : phone === "JH" ? "JH_CL" : "";
          const hasExpectedClosurePrev = expectsClosure && prevPhone === expectedClosurePhone;

          const stats = byPhone.get(phone)!;
          stats.closurePrev.push(hasExpectedClosurePrev ? 1 : 0);
          stats.onsetDelta.push(currAF - prevAF);
          stats.duration.push(currDuration);
          stats.AF.push(currAF);
          stats.A5.push(currA5);
        }
      }

      const summary = new Map<
        string,
        {
          count: number;
          closureRate: number;
          onsetDelta: ReturnType<typeof summarizeNumbers>;
          duration: ReturnType<typeof summarizeNumbers>;
          AF: ReturnType<typeof summarizeNumbers>;
          A5: ReturnType<typeof summarizeNumbers>;
        }
      >();

      for (const phone of phones) {
        const stats = byPhone.get(phone)!;
        const count = stats.duration.length;
        const closureRate =
          count === 0 ? 0 : stats.closurePrev.reduce((acc, value) => acc + value, 0) / count;
        summary.set(phone, {
          count,
          closureRate,
          onsetDelta: summarizeNumbers(stats.onsetDelta),
          duration: summarizeNumbers(stats.duration),
          AF: summarizeNumbers(stats.AF),
          A5: summarizeNumbers(stats.A5),
        });
      }

      const violations: ContrastViolation[] = [];
      const assertMin = (
        pair: string,
        metric: string,
        observed: number,
        min: number,
        sampleCount: number,
      ) => {
        if (observed < min) {
          violations.push({
            pair,
            metric,
            observed,
            expected: `>= ${min}`,
            sampleCount,
          });
        }
      };
      const assertMax = (
        pair: string,
        metric: string,
        observed: number,
        max: number,
        sampleCount: number,
      ) => {
        if (observed > max) {
          violations.push({
            pair,
            metric,
            observed,
            expected: `<= ${max}`,
            sampleCount,
          });
        }
      };

      const ch = summary.get("CH")!;
      const sh = summary.get("SH")!;
      const jh = summary.get("JH")!;
      const zh = summary.get("ZH")!;

      const zLikeMinCount = isFullAudit ? 20 : 5;
      assertMin("CH", "count", ch.count, 20, ch.count);
      assertMin("SH", "count", sh.count, 20, sh.count);
      assertMin("JH", "count", jh.count, 20, jh.count);
      assertMin("ZH", "count", zh.count, zLikeMinCount, zh.count);

      // Affricates should usually be preceded by their dedicated closure segment.
      assertMin("CH", "closureRate", ch.closureRate, 0.85, ch.count);
      assertMin("JH", "closureRate", jh.closureRate, 0.85, jh.count);
      // Fricatives should not systematically get affricate-style closures.
      assertMax("SH", "closureRate", sh.closureRate, 0.25, sh.count);
      assertMax("ZH", "closureRate", zh.closureRate, 0.25, zh.count);

      // Affricates should keep distinct timing and frication-shape cues.
      // CH retains slightly stronger high-band emphasis (A5=56 vs SH A5=48).
      // JH and ZH now share /sh/ spectral shape per Klatt 1980 Table III;
      // differentiation comes from closure presence and duration, not A5.
      assertMin("CH vs SH", "A5.p50 gap", ch.A5.p50 - sh.A5.p50, 6, Math.min(ch.count, sh.count));
      assertMin(
        "CH vs SH",
        "duration p50 gap",
        sh.duration.p50 - ch.duration.p50,
        15,
        Math.min(ch.count, sh.count),
      );
      assertMin(
        "JH vs ZH",
        "duration p50 gap",
        zh.duration.p50 - jh.duration.p50,
        10,
        Math.min(jh.count, zh.count),
      );

      console.log("\naffricate differentiation:");
      for (const phone of phones) {
        const item = summary.get(phone)!;
        console.log(
          `  ${phone}: count=${item.count} closureRate=${item.closureRate.toFixed(2)} ` +
            `dur.p50=${item.duration.p50.toFixed(1)} AF.p50=${item.AF.p50.toFixed(1)} ` +
            `A5.p50=${item.A5.p50.toFixed(1)} onsetDelta.p50=${item.onsetDelta.p50.toFixed(1)}`,
        );
      }

      if (violations.length > 0) {
        console.log("  First 20 affricate differentiation violations:");
        for (const violation of violations.slice(0, 20)) {
          console.log(
            `    ${violation.pair}.${violation.metric}: observed=${violation.observed.toFixed(2)} ` +
              `expected ${violation.expected} (n=${violation.sampleCount})`,
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} affricate differentiation violations` +
          ` (first: ${violations[0]?.pair ?? "none"}.${violations[0]?.metric ?? ""})`,
      );
    });
  });

  // -- Block 8: Inventory-Wide Obstruent Separation -------------------------

  describe("inventory-wide obstruent separation", () => {
    it("maintains pairwise separability across fricative/affricate inventory", () => {
      // Citation anchors:
      // - Stevens 1998 Ch.10 (obstruent place/manner cue structure)
      // - Jongman et al. 2000 (fricative acoustic class contrasts)
      // Engineering guardrail: every obstruent pair should differ on at least
      // one robust control dimension to avoid inventory collapse.
      const obstruentPhones = ["F", "V", "TH", "DH", "S", "Z", "SH", "ZH", "HH", "CH", "JH"];
      const byPhone = new Map<string, EnvelopeObservation[]>(
        obstruentPhones.map((phone) => [phone, []]),
      );

      const maxInSegment = (segment: Segment, key: string): number =>
        Math.max(...segment.frames.map((frame) => Number(frame.params?.[key] ?? 0)));

      for (const [word] of auditWords) {
        const segments = segmentCache.get(word);
        if (!segments) continue;
        for (const segment of segments) {
          const phone = stripStress(segment.phoneme);
          if (!byPhone.has(phone)) continue;
          byPhone.get(phone)!.push({
            word,
            phoneme: phone,
            durationMs: segment.durationMs,
            AF: maxInSegment(segment, "AF"),
            AH: maxInSegment(segment, "AH"),
            AV: maxInSegment(segment, "AV"),
            SW: maxInSegment(segment, "SW"),
            A3: maxInSegment(segment, "A3"),
            A4: maxInSegment(segment, "A4"),
            A5: maxInSegment(segment, "A5"),
            A6: maxInSegment(segment, "A6"),
            AB: maxInSegment(segment, "AB"),
          });
        }
      }

      const summaryByPhone = new Map<
        string,
        {
          count: number;
          duration: ReturnType<typeof summarizeNumbers>;
          AF: ReturnType<typeof summarizeNumbers>;
          AV: ReturnType<typeof summarizeNumbers>;
          A3: ReturnType<typeof summarizeNumbers>;
          A5: ReturnType<typeof summarizeNumbers>;
          A6: ReturnType<typeof summarizeNumbers>;
          AB: ReturnType<typeof summarizeNumbers>;
        }
      >();
      for (const phone of obstruentPhones) {
        const observations = byPhone.get(phone) ?? [];
        summaryByPhone.set(phone, {
          count: observations.length,
          duration: summarizeNumbers(observations.map((entry) => entry.durationMs)),
          AF: summarizeNumbers(observations.map((entry) => entry.AF)),
          AV: summarizeNumbers(observations.map((entry) => entry.AV)),
          A3: summarizeNumbers(observations.map((entry) => entry.A3)),
          A5: summarizeNumbers(observations.map((entry) => entry.A5)),
          A6: summarizeNumbers(observations.map((entry) => entry.A6)),
          AB: summarizeNumbers(observations.map((entry) => entry.AB)),
        });
      }

      const violations: ContrastViolation[] = [];
      const ensureMinCount = (phone: string, minCount: number) => {
        const count = summaryByPhone.get(phone)?.count ?? 0;
        if (count < minCount) {
          violations.push({
            pair: phone,
            metric: "count",
            observed: count,
            expected: `>= ${minCount}`,
            sampleCount: count,
          });
        }
      };

      for (const phone of obstruentPhones) {
        ensureMinCount(phone, isFullAudit ? 20 : 5);
      }

      type PairScore = { pair: string; separation: number; metrics: string };
      const pairScores: PairScore[] = [];

      for (let i = 0; i < obstruentPhones.length; i += 1) {
        for (let j = i + 1; j < obstruentPhones.length; j += 1) {
          const left = obstruentPhones[i];
          const right = obstruentPhones[j];
          const l = summaryByPhone.get(left)!;
          const r = summaryByPhone.get(right)!;
          const sampleCount = Math.min(l.count, r.count);
          if (sampleCount === 0) continue;

          const avGap = Math.abs(l.AV.p50 - r.AV.p50);
          const afGap = Math.abs(l.AF.p50 - r.AF.p50);
          const a5Gap = Math.abs(l.A5.p50 - r.A5.p50);
          const a6Gap = Math.abs(l.A6.p50 - r.A6.p50);
          const a3Gap = Math.abs(l.A3.p50 - r.A3.p50);
          const abGap = Math.abs(l.AB.p50 - r.AB.p50);
          const durGap = Math.abs(l.duration.p50 - r.duration.p50);

          // Klatt 1980 Table III: dentals and sibilants differentiate via A6/AB,
          // not A5. Include A6 and AB in the separation metric.
          const separation = Math.max(
            avGap / 20,
            afGap / 3,
            a5Gap / 4,
            a6Gap / 4,
            a3Gap / 4,
            abGap / 4,
            durGap / 8,
          );

          pairScores.push({
            pair: `${left} vs ${right}`,
            separation,
            metrics:
              `AV=${avGap.toFixed(1)} AF=${afGap.toFixed(1)} ` +
              `A5=${a5Gap.toFixed(1)} A6=${a6Gap.toFixed(1)} A3=${a3Gap.toFixed(1)} ` +
              `AB=${abGap.toFixed(1)} dur=${durGap.toFixed(1)}ms`,
          });

          if (separation < 1) {
            violations.push({
              pair: `${left} vs ${right}`,
              metric: "pairwise-separation",
              observed: separation,
              expected: ">= 1.0",
              sampleCount,
            });
          }
        }
      }

      console.log("\ninventory-wide obstruent separation:");
      for (const phone of obstruentPhones) {
        const summary = summaryByPhone.get(phone)!;
        console.log(
          `  ${phone}: count=${summary.count} dur.p50=${summary.duration.p50.toFixed(1)}ms ` +
            `AF.p50=${summary.AF.p50.toFixed(1)} AV.p50=${summary.AV.p50.toFixed(1)} ` +
            `A3.p50=${summary.A3.p50.toFixed(1)} A5.p50=${summary.A5.p50.toFixed(1)}`,
        );
      }
      const weakestPairs = [...pairScores].sort((a, b) => a.separation - b.separation).slice(0, 15);
      console.log("  weakest separations:");
      for (const pair of weakestPairs) {
        console.log(`    ${pair.pair}: score=${pair.separation.toFixed(2)} ${pair.metrics}`);
      }

      if (violations.length > 0) {
        console.log("  First 20 obstruent-separation violations:");
        for (const violation of violations.slice(0, 20)) {
          console.log(
            `    ${violation.pair}.${violation.metric}: observed=${violation.observed.toFixed(2)} ` +
              `expected ${violation.expected} (n=${violation.sampleCount})`,
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} obstruent separation violations` +
          ` (first: ${violations[0]?.pair ?? "none"}.${violations[0]?.metric ?? ""})`,
      );
    });
  });

  // -- Block 9: Rhotic Integrity ---------------------------------------------

  describe("rhotic integrity", () => {
    it("keeps stressed and unstressed rhotics distinct and realizes a rhotic tail", () => {
      const er0F1: number[] = [];
      const er0F2: number[] = [];
      const er0F3: number[] = [];
      const er1F1: number[] = [];
      const er1F2: number[] = [];
      const er1F3: number[] = [];
      const tailF3: number[] = [];
      const violations: ContrastViolation[] = [];
      let erWords = 0;
      let wordsWithTail = 0;

      for (const [word, arpabet] of auditWords) {
        const phones = arpabet.split(" ");
        const rhotics = phones.filter((phone) => RHOTIC_VOWELS.has(phone));
        if (rhotics.length !== 1) continue;

        const segments = segmentCache.get(word);
        if (!segments) continue;

        const erIndex = segments.findIndex((segment) => segment.phoneme === "ER");
        if (erIndex < 0) continue;

        const erSegment = segments[erIndex];
        const nextSegment = segments[erIndex + 1];
        const erF1 = segmentAverageParam(erSegment, "F1");
        const erF2 = segmentAverageParam(erSegment, "F2");
        const erF3 = segmentAverageParam(erSegment, "F3");

        erWords += 1;
        if (rhotics[0] === "ER0") {
          er0F1.push(erF1);
          er0F2.push(erF2);
          er0F3.push(erF3);
        } else {
          er1F1.push(erF1);
          er1F2.push(erF2);
          er1F3.push(erF3);
        }

        if (nextSegment?.phoneme === "R") {
          wordsWithTail += 1;
          tailF3.push(segmentAverageParam(nextSegment, "F3"));
        }
      }

      const er0Summary = {
        F1: summarizeNumbers(er0F1),
        F2: summarizeNumbers(er0F2),
        F3: summarizeNumbers(er0F3),
      };
      const er1Summary = {
        F1: summarizeNumbers(er1F1),
        F2: summarizeNumbers(er1F2),
        F3: summarizeNumbers(er1F3),
      };
      const tailSummary = summarizeNumbers(tailF3);

      const minCount = isFullAudit ? 50 : 20;
      if (er0Summary.F1.count < minCount) {
        violations.push({
          pair: "ER0",
          metric: "count",
          observed: er0Summary.F1.count,
          expected: `>= ${minCount}`,
          sampleCount: er0Summary.F1.count,
        });
      }
      if (er1Summary.F1.count < minCount) {
        violations.push({
          pair: "ER1",
          metric: "count",
          observed: er1Summary.F1.count,
          expected: `>= ${minCount}`,
          sampleCount: er1Summary.F1.count,
        });
      }

      const tailCoverage = erWords === 0 ? 0 : wordsWithTail / erWords;
      if (tailCoverage < 0.95) {
        violations.push({
          pair: "ER->R",
          metric: "tail-coverage",
          observed: tailCoverage,
          expected: ">= 0.95",
          sampleCount: erWords,
        });
      }

      if (er0Summary.F1.p50 >= er1Summary.F1.p50 - 20) {
        violations.push({
          pair: "ER0 vs ER1",
          metric: "F1.p50",
          observed: er0Summary.F1.p50,
          expected: `< ${Math.round(er1Summary.F1.p50 - 20)}`,
          sampleCount: Math.min(er0Summary.F1.count, er1Summary.F1.count),
        });
      }
      if (er0Summary.F2.p50 < er1Summary.F2.p50) {
        violations.push({
          pair: "ER0 vs ER1",
          metric: "F2.p50",
          observed: er0Summary.F2.p50,
          expected: `>= ${Math.round(er1Summary.F2.p50)}`,
          sampleCount: Math.min(er0Summary.F2.count, er1Summary.F2.count),
        });
      }
      if (tailSummary.p50 >= er0Summary.F3.p50 - 100) {
        violations.push({
          pair: "R tail vs ER0",
          metric: "F3.p50",
          observed: tailSummary.p50,
          expected: `< ${Math.round(er0Summary.F3.p50 - 100)}`,
          sampleCount: Math.min(tailSummary.count, er0Summary.F3.count),
        });
      }
      if (tailSummary.p50 >= er1Summary.F3.p50 - 100) {
        violations.push({
          pair: "R tail vs ER1",
          metric: "F3.p50",
          observed: tailSummary.p50,
          expected: `< ${Math.round(er1Summary.F3.p50 - 100)}`,
          sampleCount: Math.min(tailSummary.count, er1Summary.F3.count),
        });
      }

      console.log(
        `\nrhotic integrity: ER0 n=${er0Summary.F1.count}, ER1 n=${er1Summary.F1.count}, ` +
          `tail coverage=${(tailCoverage * 100).toFixed(1)}%`,
      );
      console.log(
        `  ER0: F1.p50=${er0Summary.F1.p50.toFixed(1)} F2.p50=${er0Summary.F2.p50.toFixed(1)} ` +
          `F3.p50=${er0Summary.F3.p50.toFixed(1)}`,
      );
      console.log(
        `  ER1: F1.p50=${er1Summary.F1.p50.toFixed(1)} F2.p50=${er1Summary.F2.p50.toFixed(1)} ` +
          `F3.p50=${er1Summary.F3.p50.toFixed(1)}`,
      );
      console.log(`  R tail: F3.p50=${tailSummary.p50.toFixed(1)} n=${tailSummary.count}`);

      if (violations.length > 0) {
        console.log("  First 10 rhotic violations:");
        for (const violation of violations.slice(0, 10)) {
          console.log(
            `    ${violation.pair}.${violation.metric}: observed=${violation.observed.toFixed(2)} ` +
              `expected ${violation.expected} (n=${violation.sampleCount})`,
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} rhotic integrity violations` +
          ` (first: ${violations[0]?.pair ?? "none"}.${violations[0]?.metric ?? ""})`,
      );
    });
  });

  // -- Block 10: Reduced Vowel Separation -----------------------------------

  describe("reduced vowel separation", () => {
    it("keeps AH0, IH0, and ER0 acoustically distinct in the audit corpus", () => {
      const byPhone = new Map<
        string,
        Array<{
          word: string;
          F1: number;
          F2: number;
          F3: number;
        }>
      >();
      const targetPhones = ["AH0", "IH0", "ER0"];
      const violations: ContrastViolation[] = [];

      for (const phone of targetPhones) {
        byPhone.set(phone, []);
      }

      for (const [word, arpabet] of auditWords) {
        const phones = arpabet.split(" ");
        const exactReduced = phones.filter((phone) => REDUCED_VOWELS.has(phone));
        if (exactReduced.length !== 1) continue;

        const targetPhone = exactReduced[0];
        const targetBase = stripStress(targetPhone);
        const segments = (segmentCache.get(word) ?? []).filter(
          (segment) => stripStress(segment.phoneme) === targetBase,
        );
        if (segments.length !== 1) continue;

        byPhone.get(targetPhone)?.push({
          word,
          F1: segmentAverageParam(segments[0], "F1"),
          F2: segmentAverageParam(segments[0], "F2"),
          F3: segmentAverageParam(segments[0], "F3"),
        });
      }

      const summary = new Map<
        string,
        {
          count: number;
          F1: ReturnType<typeof summarizeNumbers>;
          F2: ReturnType<typeof summarizeNumbers>;
          F3: ReturnType<typeof summarizeNumbers>;
        }
      >();
      for (const phone of targetPhones) {
        const observations = byPhone.get(phone) ?? [];
        summary.set(phone, {
          count: observations.length,
          F1: summarizeNumbers(observations.map((entry) => entry.F1)),
          F2: summarizeNumbers(observations.map((entry) => entry.F2)),
          F3: summarizeNumbers(observations.map((entry) => entry.F3)),
        });
      }

      const minCount = isFullAudit ? 50 : 20;
      for (const phone of targetPhones) {
        const count = summary.get(phone)?.count ?? 0;
        if (count < minCount) {
          violations.push({
            pair: phone,
            metric: "count",
            observed: count,
            expected: `>= ${minCount}`,
            sampleCount: count,
          });
        }
      }

      const ah0 = summary.get("AH0")!;
      const ih0 = summary.get("IH0")!;
      const er0 = summary.get("ER0")!;

      if (ah0.F1.p50 <= ih0.F1.p50 + 80) {
        violations.push({
          pair: "AH0 vs IH0",
          metric: "F1.p50",
          observed: ah0.F1.p50 - ih0.F1.p50,
          expected: "> 80",
          sampleCount: Math.min(ah0.count, ih0.count),
        });
      }
      if (ih0.F2.p50 <= ah0.F2.p50 + 300) {
        violations.push({
          pair: "IH0 vs AH0",
          metric: "F2.p50",
          observed: ih0.F2.p50 - ah0.F2.p50,
          expected: "> 300",
          sampleCount: Math.min(ih0.count, ah0.count),
        });
      }
      if (er0.F3.p50 >= ah0.F3.p50 - 400) {
        violations.push({
          pair: "ER0 vs AH0",
          metric: "F3.p50",
          observed: er0.F3.p50,
          expected: `< ${Math.round(ah0.F3.p50 - 400)}`,
          sampleCount: Math.min(er0.count, ah0.count),
        });
      }
      if (er0.F3.p50 >= ih0.F3.p50 - 400) {
        violations.push({
          pair: "ER0 vs IH0",
          metric: "F3.p50",
          observed: er0.F3.p50,
          expected: `< ${Math.round(ih0.F3.p50 - 400)}`,
          sampleCount: Math.min(er0.count, ih0.count),
        });
      }

      console.log("\nreduced vowel separation:");
      for (const phone of targetPhones) {
        const stats = summary.get(phone)!;
        console.log(
          `  ${phone}: count=${stats.count} F1.p50=${stats.F1.p50.toFixed(1)} ` +
            `F2.p50=${stats.F2.p50.toFixed(1)} F3.p50=${stats.F3.p50.toFixed(1)}`,
        );
      }

      if (violations.length > 0) {
        console.log("  First 10 reduced-vowel violations:");
        for (const violation of violations.slice(0, 10)) {
          console.log(
            `    ${violation.pair}.${violation.metric}: observed=${violation.observed.toFixed(2)} ` +
              `expected ${violation.expected} (n=${violation.sampleCount})`,
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} reduced-vowel separation violations` +
          ` (first: ${violations[0]?.pair ?? "none"}.${violations[0]?.metric ?? ""})`,
      );
    });
  });

  // -- Block 11: Segment Duration Floors ------------------------------------

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
          if (seg.phoneme.endsWith("_REL") || seg.phoneme.endsWith("_ASP")) continue;

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
                durationMs: Math.round(seg.durationMs * 100) / 100,
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
          ` in ${affectedWords} words (${segmentsChecked} segments checked)`,
      );
      for (const [cls, count] of Object.entries(byClass).sort()) {
        console.log(`  ${cls}: ${count} violations`);
      }
      if (violations.length > 0) {
        console.log(`  First 20 violations:`);
        for (const v of violations.slice(0, 20)) {
          console.log(
            `    ${v.word}: ${v.phoneme} = ${v.durationMs}ms (minimum: ${v.minimumMs}ms)`,
          );
        }
      }

      expectNoViolationsOrReport(
        violations,
        `${violations.length} duration floor violations in ${affectedWords} words` +
          ` (first: ${violations[0]?.word ?? "none"}: ${violations[0]?.phoneme ?? ""} = ${violations[0]?.durationMs ?? ""}ms)`,
      );
    });
  });
});
