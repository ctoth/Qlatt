/**
 * Golden review for the splice tree-placement fix.
 *
 * A structural or postlexical rule that replaces phones inserts new Segment
 * Items. The engine made every inserted Item a daughter of the first replaced
 * phone's syllable, and always the last daughter. Two things followed:
 *
 *   - A rule that re-emits the following phone (`copy_from: next`) moved that
 *     phone into the previous syllable, and so into the previous word when the
 *     phone began a word. The punctuation silence, which belongs to no word,
 *     was pulled into the last word the same way.
 *   - The pieces of an expanded onset consonant were appended after the
 *     syllable's nucleus and coda, so the tree listed them last.
 *
 * Every rule that reads syllable or word membership (`current.syllable`,
 * `R:SylStructure` paths, the syllable annotations) therefore read the wrong
 * syllable for those phones. The regression test is
 * test/word-tree-integrity.test.ts; scripts/diff-rule-writes.ts names the
 * rules whose writes change.
 *
 * Usage (run against the PRE-change goldens, then commit the report):
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/review-splice-tree-goldens.ts [--write]
 */

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

function review(goldenPath: string, title: string) {
  const before = JSON.parse(readFileSync(goldenPath, "utf8")) as Golden;
  const rows: string[] = [];
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
      maxDelta[key] = Math.max(maxDelta[key] ?? 0, Math.abs(metrics[key] - old[key]));
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
  "# Splice tree-placement fix: golden review",
  "",
  "When a rule replaced phones, the engine attached every inserted Segment under the first replaced phone's syllable, as its last daughter. A re-emitted copy of the following phone therefore moved into the previous syllable (and the previous word, when it began one), the punctuation silence moved into the last word, and the pieces of an expanded onset were listed after the nucleus and coda. The engine now attaches a whole copy where the copied Item sits, attaches nothing for a copy of an Item outside the tree, and inserts every piece at its place in the syllable. The regression test is test/word-tree-integrity.test.ts.",
  "",
  "Rules whose writes change, found with scripts/diff-rule-writes.ts over these corpora and the DECtalk oracle corpus in all three frontends: `cluster_position_annotation` (a foreign phone was counted in the cluster), `syllable_role_annotation`, `syllable_position_annotation`, `syllable_index_annotation` and `syllable_count_annotation` (expanded onsets were read as codas; a copied word-initial phone was read in the previous word), `cluster_shortening`, `pre_boundary_lengthening` and `vowel_shortening` (the final-syllable and phrase-final tests now see the right syllable), and `nasal_windows`. The source and effort contours (`vocal_effort`, `phrase_rd_contour`, `connected_speech_source_contour`) move only because the durations under them move.",
  "",
  'The fix also changes `hertz_nucleus_timing` in qlatt-english, which read `coda.voiced` with `has(...) &&`. A stop closure carries `voiced: null`, so the rule threw on "bite.", "church.", "Clear light glowed." and "Boat boot bought but bite.". It now reads the flag with `isTrue`. In dectalk-english the whole-word entry for "yelled" named a phoneme `LL` that the inventory does not have, so "Young yaks yelled." threw; it now names `L`.',
  "",
  "This review is of track metrics, not a listening test. Regenerate with `scripts/review-splice-tree-goldens.ts --write` against the pre-change goldens.",
  "",
  ...sections.map((section) => section.report),
].join("\n");

process.stdout.write(report);
if (process.argv.includes("--write")) {
  writeFileSync("docs/splice-tree-golden-review.md", report);
  for (const section of sections) {
    writeFileSync(section.goldenPath, `${JSON.stringify(section.golden, null, 2)}\n`);
  }
}
