import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createServer } from "vite";

// Capture in each checkout, then compare the captures to review a table's
// segment-level effects before regenerating the aggregate corpus golden.
// node --experimental-strip-types scripts/review-duration-tables.ts capture <root> <output>
// node --experimental-strip-types scripts/review-duration-tables.ts golden <root> <output>
// node --experimental-strip-types scripts/review-duration-tables.ts compare <before> <after> <report>
type Segment = { phoneme: string; duration: number };
type Snapshot = { frontendId: string; phrase: string; segments: Segment[] }[];

const [mode, first, second, third] = process.argv.slice(2);
assert(first && second, "Expected capture <root> <output> or compare <before> <after> <report>");
if (mode === "capture" || mode === "golden") {
  const root = resolve(first);
  const output = resolve(second);
  const originalCwd = process.cwd();
  // Node resource loaders resolve YAML and dictionaries from cwd/public.
  // A Vite root alone changes source imports but not those asset reads.
  process.chdir(root);
  const server = await createServer({ root, server: { middlewareMode: true, hmr: false } });
  try {
    const { textToKlattTrackDetailed } = (await server.ssrLoadModule(
      "/src/tts-frontend.ts",
    )) as typeof import("../src/tts-frontend");
    const { summarizeTrackMetrics } = (await server.ssrLoadModule(
      "/src/analysis/track-metrics.ts",
    )) as typeof import("../src/analysis/track-metrics");
    const corpus = JSON.parse(
      readFileSync(resolve(root, "test/phrase-sets/linguistic.json"), "utf8"),
    ) as {
      name: string;
      baseF0: number;
      phrases: string[];
    };
    const cases = [
      ...corpus.phrases.map((phrase) => ({ frontendId: "qlatt-english", phrase })),
      ...["qlatt-english", "qlatt-beauty", "dectalk-english"].flatMap((frontendId) =>
        ["The cat sat.", "Did Bob buy a blue balloon?", "Gag, gang; go!", "sip sip."].map(
          (phrase) => ({ frontendId, phrase }),
        ),
      ),
    ];
    const snapshot: Snapshot =
      mode === "capture"
        ? cases.map(({ frontendId, phrase }) => ({
            frontendId,
            phrase,
            segments: textToKlattTrackDetailed(phrase, corpus.baseF0, 30, { frontendId })
              .utterance.segments.listItems()
              .filter((item) => item.get("active") !== false)
              .map((item) => ({
                phoneme: String(item.get("phoneme")),
                duration: Number(item.get("duration")),
              })),
          }))
        : [];
    const result =
      mode === "capture"
        ? snapshot
        : {
            corpus: corpus.name,
            baseF0: corpus.baseF0,
            summaries: corpus.phrases.map((phrase) => ({
              phrase,
              ...summarizeTrackMetrics(textToKlattTrackDetailed(phrase, corpus.baseF0).track),
            })),
          };
    writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await server.close();
    process.chdir(originalCwd);
  }
} else if (mode === "compare") {
  assert(third, "Expected a report path");
  const before = JSON.parse(readFileSync(first, "utf8")) as Snapshot;
  const after = JSON.parse(readFileSync(second, "utf8")) as Snapshot;
  assert.equal(before.length, after.length, "Corpus size changed");
  const rows = before.map((old, i) => {
    const current = after[i];
    assert.equal(old.phrase, current.phrase, "Corpus order changed");
    assert.equal(old.frontendId, current.frontendId, "Frontend changed");
    assert.deepEqual(
      old.segments.map((s) => s.phoneme),
      current.segments.map((s) => s.phoneme),
      `Segment inventory changed: ${old.phrase}`,
    );
    const changes = old.segments.flatMap((segment, j) =>
      segment.duration === current.segments[j].duration
        ? []
        : [`${j}:${segment.phoneme} ${segment.duration} → ${current.segments[j].duration} ms`],
    );
    if (old.frontendId === "dectalk-english")
      assert.deepEqual(current, old, "DECtalk control changed");
    return `| ${old.frontendId} | ${old.phrase} | ${changes.join("; ") || "unchanged"} |`;
  });
  writeFileSync(
    third,
    [
      "# Duration table corpus review",
      "",
      "Active Segment indices are zero-based. All changed segment durations are listed; phoneme sequences are unchanged.",
      "",
      "| Frontend | Phrase | Duration changes |",
      "| --- | --- | --- |",
      ...rows,
      "",
    ].join("\n"),
  );
} else {
  throw new Error(`Unknown mode: ${mode}`);
}
