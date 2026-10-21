import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const directory = process.argv[2] ?? "test/fixtures/frame-foundation";
const read = (name) =>
  JSON.parse(gunzipSync(fs.readFileSync(path.join(directory, `${name}.json.gz`))));

for (const mode of ["node", "browser"]) {
  const before = read(`baseline-${mode}`);
  const after = read(`after-${mode}`);
  console.log(`\n${mode}: ${after.browserVersion ?? after.nodeVersion}`);
  console.log(
    "frontend | tooling | before ms | after ms | ratio | decisions before/after | journal entries before/after | CEL before/after",
  );
  for (const result of after.results) {
    const baseline = before.results.find(
      (entry) =>
        entry.frontendId === result.frontendId && entry.captureTooling === result.captureTooling,
    );
    if (!baseline || baseline.hash !== result.hash)
      throw new Error("Missing or differing baseline");
    const previous = baseline.passes[0];
    const current = result.passes[0];
    console.log(
      [
        result.frontendId,
        result.captureTooling,
        baseline.medianMs.toFixed(1),
        result.medianMs.toFixed(1),
        `${(result.medianMs / baseline.medianMs).toFixed(2)}x`,
        `${previous.decisions}/${current.decisions}`,
        `${previous.journalEntries}/${current.journalEntries}`,
        `${previous.celEvaluations}/${current.celEvaluations}`,
      ].join(" | "),
    );
  }
  console.log(
    "heap snapshots (not retained heap):",
    JSON.stringify({ before: before.heap, after: after.heap }),
  );
  console.log("unavailable metrics:", after.unavailableMetrics.join("; "));
}
