/**
 * Golden review for the rules restored by #219.
 *
 * `transition_override` (Stevens & House 1956; Hertz 1991) sets per-class
 * formant transition durations, which moves Holmes (1964) transition knots
 * and therefore event counts and voiced formant means. It must not move
 * segment timing, F0, voicing, or source amplitudes. `stress_spectral_tilt`
 * changes TL, which the corpus summary does not measure; its behaviour is
 * asserted directly in test/restored-rules.test.ts. The DECtalk reset rule
 * is not in these corpora (qlatt-english only).
 *
 * Usage (run against the PRE-change golden, then commit the report):
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/review-restored-rule-goldens.ts [--before <summary.json>] [--write]
 */

import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { summarizeTrackMetrics } from "../src/analysis/track-metrics";
import { textToKlattTrack } from "../src/tts-frontend";

type Metrics = ReturnType<typeof summarizeTrackMetrics>;
type Golden = {
  corpus: string;
  baseF0: number;
  rate?: number;
  summaries: ({ phrase: string } & Metrics)[];
};

const ALLOWED = new Set<keyof Metrics>([
  "events",
  "voicedEvents",
  "f1MeanVoiced",
  "f2MeanVoiced",
  "b1MeanVoiced",
  "f0Mean",
  "avMeanVoiced",
]);
// f0Mean and avMeanVoiced are event-weighted means: new transition knots inside
// voiced segments re-weight them without changing any F0 or AV value. These
// bounds hold the re-weighting near its observed size (1.02 Hz, 0.28 dB) while
// f0Min, f0Max, f0Span, ahMeanVoiced and every timing metric must not move.
const BOUNDS: Partial<Record<keyof Metrics, number>> = { f0Mean: 1.5, avMeanVoiced: 0.5 };
const TOLERANCE = 1e-6;

function argValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : null;
}

function review(goldenPath: string, beforePath: string, title: string) {
  const before = JSON.parse(readFileSync(beforePath, "utf8")) as Golden;
  const rows: string[] = [];
  const unexpected: string[] = [];
  const maxDelta: Partial<Record<keyof Metrics, number>> = {};
  let changedPhrases = 0;
  const summaries = before.summaries.map((old) => {
    const track =
      before.rate == null
        ? textToKlattTrack(old.phrase, before.baseF0)
        : textToKlattTrack(old.phrase, before.baseF0, 30, { rate: before.rate });
    const metrics = summarizeTrackMetrics(track);
    const changed = (Object.keys(metrics) as (keyof Metrics)[]).filter(
      (key) => Math.abs(metrics[key] - old[key]) > TOLERANCE,
    );
    for (const key of changed) {
      if (!ALLOWED.has(key)) unexpected.push(`${old.phrase}: ${key}`);
      const bound = BOUNDS[key];
      const delta = Math.abs(metrics[key] - old[key]);
      if (bound != null && delta > bound) unexpected.push(`${old.phrase}: ${key} moved ${delta}`);
      maxDelta[key] = Math.max(maxDelta[key] ?? 0, delta);
    }
    if (changed.length > 0) changedPhrases += 1;
    rows.push(
      `| ${old.phrase} | ${
        changed
          .map((key) => `${key}: ${old[key].toFixed(6)} → ${metrics[key].toFixed(6)}`)
          .join("; ") || "unchanged control"
      } |`,
    );
    return { phrase: old.phrase, ...metrics };
  });
  return {
    report: [
      `## ${title}`,
      "",
      `${changedPhrases} of ${summaries.length} phrases changed; every change is in ${[...ALLOWED].join(", ")}.`,
      "",
      `Largest absolute change per metric: ${Object.entries(maxDelta)
        .map(([key, delta]) => `${key} ${delta.toFixed(6)}`)
        .join(", ")}.`,
      "",
      "| Phrase | Metric changes |",
      "| --- | --- |",
      ...rows,
      "",
    ].join("\n"),
    unexpected,
    golden: { ...before, summaries },
    goldenPath,
  };
}

const sections = [
  review(
    "test/golden/declarative-corpus-summary.json",
    argValue("--before") ?? "test/golden/declarative-corpus-summary.json",
    "Linguistic baseline corpus (qlatt-english, base F0 110 Hz)",
  ),
  review(
    "test/golden/crystal-tempo-corpus-summary.json",
    argValue("--before-tempo") ?? "test/golden/crystal-tempo-corpus-summary.json",
    "Crystal & House 1982 fast-tempo corpus (rate 111.6/93.4)",
  ),
];

const report = [
  "# Restored-rule golden review (#219)",
  "",
  "`transition_override` was declared with its citations but listed in no phase, so per-class transition durations (30 ms stops, 40 ms fricatives, 50 ms default; Stevens & House 1956, Hertz 1991) never reached lowering, which fell back to the tabulated Holmes durations or the 30 ms default. Restoring it moves Holmes transition knots, so event counts and voiced F1/F2/B1 means change. Because f0Mean and avMeanVoiced are event-weighted, new knots inside voiced segments re-weight them (observed at most 1.02 Hz and 0.28 dB; bounded at 1.5 Hz and 0.5 dB) while no F0 or AV value changes: f0Min, f0Max, f0Span, ahMeanVoiced, and every timing metric (totalTime, voicedTime, silenceTime, unvoicedNonsilenceTime, voicedRatio) are unchanged within 1e-6 on every phrase. The review script fails if any of those move or if the re-weighting exceeds the stated bounds.",
  "",
  "`stress_spectral_tilt` (Sluijter & van Heuven 1996) changes TL on stressed vowels. The corpus summary does not measure TL; test/restored-rules.test.ts asserts the reduction directly. `dectalk_question_glide_reset` is dectalk-english only and is asserted in the same test file.",
  "",
  "The pre-change goldens pass on base 6a2e4e1c. Regenerate with `scripts/review-restored-rule-goldens.ts --before <pre-change summary> --before-tempo <pre-change tempo summary> --write`. This is a track-metric review, not a listening test.",
  "",
  ...sections.map((section) => section.report),
].join("\n");

process.stdout.write(report);
const unexpected = sections.flatMap((section) => section.unexpected);
assert.equal(unexpected.length, 0, `Unexpected metric changes: ${unexpected.join("; ")}`);
if (process.argv.includes("--write")) {
  writeFileSync("docs/restored-rules-golden-review.md", report);
  for (const section of sections) {
    writeFileSync(section.goldenPath, `${JSON.stringify(section.golden, null, 2)}\n`);
  }
}
