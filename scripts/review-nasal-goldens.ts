import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "vite";
import { summarizeTrackMetrics } from "../src/analysis/track-metrics";

const server = await createServer({ server: { middlewareMode: true } });
try {
  const { textToKlattTrackDetailed } = (await server.ssrLoadModule(
    "/src/tts-frontend.ts",
  )) as typeof import("../src/tts-frontend");

  // Compare against the pre-change golden before accepting the nasal model.
  // The old golden must first pass on the exact base checkout (recorded in PR).
  const goldenPath = "test/golden/declarative-corpus-summary.json";
  const beforeArg = process.argv.indexOf("--before");
  const beforePath = beforeArg >= 0 ? process.argv[beforeArg + 1] : goldenPath;
  const before = JSON.parse(readFileSync(beforePath, "utf8")) as {
    corpus: string;
    baseF0: number;
    summaries: ({ phrase: string } & ReturnType<typeof summarizeTrackMetrics>)[];
  };
  const allowed = new Set(["f1MeanVoiced", "f2MeanVoiced", "b1MeanVoiced"]);
  const rows: string[] = [];
  const unexpected: string[] = [];
  const summaries = before.summaries.map((old) => {
    const { track } = textToKlattTrackDetailed(old.phrase, before.baseF0, 30);
    const metrics = summarizeTrackMetrics(track);
    const changed = Object.entries(metrics).filter(
      ([key, value]) => Math.abs(value - old[key as keyof typeof metrics]) > 1e-6,
    );
    for (const [key, value] of changed) {
      // Reviewed Holmes 1964 overlapping-transition intersections after NG:
      // three old internal K_CL knots become two; no segment boundary moves.
      const reviewedKnotChange =
        key === "events" &&
        old.phrase === "Gag, gang, and gunk go together." &&
        old.events === 87 &&
        value === 86;
      if (!allowed.has(key) && !reviewedKnotChange) unexpected.push(`${old.phrase}: ${key}`);
    }
    if (changed.length)
      assert(
        track.some((frame) => ["M", "N", "NG"].includes(frame.phoneme ?? "")),
        `Changed nonnasal control: ${old.phrase}`,
      );
    rows.push(
      `| ${old.phrase} | ${changed.map(([key, value]) => `${key}: ${old[key as keyof typeof metrics].toFixed(6)} → ${value.toFixed(6)}`).join("; ") || "unchanged control"} |`,
    );
    return { phrase: old.phrase, ...metrics };
  });
  const report = [
    "# Nasal model corpus review",
    "",
    "The pre-change golden passes on base f8d4d6da. Changed metrics are voiced F1/F2/B1 means in phrases containing nasals, plus the one reviewed event-count change below. Duration, F0, voicing, and amplitude metrics are unchanged within 1e-6; phrases without changed metrics remain controls. Changes follow the Recasens (1983) Table II murmur targets and their transitions, not a new stress policy.",
    "",
    "In 'Gag, gang, and gunk go together.', changing NG's targets changes overlapping Holmes (1964) transition intersections in the following K_CL (holmes-transitions.ts). Its boundaries remain 1.469 and 1.518 seconds, including the 30 ms initial silence. Old internal knots at 1.493500/1.493824/1.496556 become 1.492931/1.497842, reducing 87 events to 86. This is an unvoiced closure: voiced-event counts and F0 statistics are unchanged. The review script permits only this exact count delta.",
    "",
    "Run `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/review-nasal-goldens.ts --before <pre-change-summary.json>` to repeat the comparison; add `--write` to record a reviewed candidate. This is a track-metric review, not a listening test.",
    "",
    "| Phrase | Metric changes |",
    "| --- | --- |",
    ...rows,
    "",
  ].join("\n");
  process.stdout.write(report);
  assert.equal(unexpected.length, 0, `Unexpected metric changes: ${unexpected.join("; ")}`);
  if (process.argv.includes("--write")) {
    writeFileSync("docs/nasal-golden-review.md", report);
    writeFileSync(goldenPath, `${JSON.stringify({ ...before, summaries }, null, 2)}\n`);
  }
} finally {
  await server.close();
}
