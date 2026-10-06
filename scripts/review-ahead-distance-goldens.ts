/**
 * Golden review for the `ahead(item, n)` distance fix.
 *
 * `ahead(item, n)` ignored `n` whenever `n` was an integer literal: a CEL
 * integer reaches the navigation function as a bigint, and the engine accepted
 * only a number, falling back to a distance of 1. Every rule that asked for the
 * item two or more steps ahead therefore read the next item instead. In the
 * qlatt-english frontend, which both corpora below use, that is:
 *
 *   phases/duration.yaml  vowel_shortening   `ahead(current, 2)` decides
 *       "phrase-final" (Klatt 1976). It was true only for a vowel directly
 *       before silence, never for a vowel followed by one consonant.
 *   phases/formant.yaml   place locus rules  `ahead(current, 2)` finds the
 *       vowel after a stop's release. It found the release itself, so the
 *       front/back choice for a released stop never applied.
 *   phases/orthography.yaml                  a run of three spelled letters.
 *
 * Observed on these two corpora: only the voiced formant means move (F1 by at
 * most 2.8 Hz, F2 by at most 10.5 Hz, and F0 mean by event re-weighting below
 * 0.002 Hz); no timing, voicing or amplitude metric moves. ALLOWED and BOUNDS
 * hold the review to that.
 *
 * Usage (run against the PRE-change goldens, then commit the report):
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/review-ahead-distance-goldens.ts [--write]
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

const TOLERANCE = 1e-6;
// engineering estimate: bounds a little above the largest observed change, so a
// later run that moves more than this review saw fails instead of passing.
const BOUNDS: Partial<Record<keyof Metrics, number>> = {
  f1MeanVoiced: 3,
  f2MeanVoiced: 11,
  f0Mean: 0.002,
};
const ALLOWED = new Set(Object.keys(BOUNDS));

function review(goldenPath: string, title: string) {
  const before = JSON.parse(readFileSync(goldenPath, "utf8")) as Golden;
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
      const delta = Math.abs(metrics[key] - old[key]);
      const bound = BOUNDS[key];
      if (!ALLOWED.has(key)) unexpected.push(`${old.phrase}: ${key}`);
      else if (bound != null && delta > bound) {
        unexpected.push(`${old.phrase}: ${key} moved ${delta}`);
      }
      maxDelta[key] = Math.max(maxDelta[key] ?? 0, delta);
    }
    if (changed.length > 0) changedPhrases += 1;
    const cells = changed.map(
      (key) => `${key}: ${old[key].toFixed(4)} → ${metrics[key].toFixed(4)}`,
    );
    rows.push(`| ${old.phrase} | ${cells.join("; ") || "unchanged control"} |`);
    return { phrase: old.phrase, ...metrics };
  });
  const largest = Object.entries(maxDelta)
    .map(([key, delta]) => `${key} ${(delta as number).toFixed(4)}`)
    .join(", ");
  return {
    report: [
      `## ${title}`,
      "",
      `${changedPhrases} of ${summaries.length} phrases changed.`,
      "",
      `Largest absolute change per metric: ${largest || "none"}.`,
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
    "Linguistic baseline corpus (qlatt-english, base F0 110 Hz)",
  ),
  review(
    "test/golden/crystal-tempo-corpus-summary.json",
    "Crystal & House 1982 fast-tempo corpus (rate 111.6/93.4)",
  ),
];

const report = [
  "# `ahead(item, n)` distance fix: golden review",
  "",
  "`ahead(item, n)` returned the item one step ahead for every integer literal `n`. A CEL integer literal reaches the navigation function as a bigint and the engine accepted only a number. `behind` was not affected. The regression test is `moves ahead and behind by a literal integer distance` in test/hrg-rule-engine-navigation.test.ts.",
  "",
  "Rule sites in qlatt-english that asked for a distance of two or more and now get it: `vowel_shortening` in phases/duration.yaml (phrase-final test), the place locus rules in phases/formant.yaml (the vowel after a stop's release), and the spelled-letter run test in phases/orthography.yaml.",
  "",
  "On both corpora only the voiced formant means move, which is the place locus rules finding the vowel after a release. No timing, voicing or amplitude metric moves; `f0Mean` moves below 0.002 Hz because it is an event-weighted mean.",
  "",
  "Regenerate with `scripts/review-ahead-distance-goldens.ts --write` against the pre-change goldens.",
  "",
  ...sections.map((section) => section.report),
].join("\n");

process.stdout.write(report);
const unexpected = sections.flatMap((section) => section.unexpected);
assert.equal(unexpected.length, 0, `Unexpected metric changes: ${unexpected.join("; ")}`);
if (process.argv.includes("--write")) {
  writeFileSync("docs/ahead-distance-golden-review.md", report);
  for (const section of sections) {
    writeFileSync(section.goldenPath, `${JSON.stringify(section.golden, null, 2)}\n`);
  }
}
