import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { writeWav } from "../src/rendering/write-wav";
import { measureFricatives } from "./frication-spectrum";
import { nodeRuntimeBackend } from "./rendering/backends/node-runtime.ts";

/** Execute through Vitest so the normal Vite resource environment is present. */
export async function renderFricationComparison(
  phrase: string,
  noiseSeed: number,
  outputDir?: string,
) {
  const common = {
    repoRoot: process.cwd(),
    frontendId: "qlatt-english",
    experimentId: "klatt80-baseline",
    engine: "runtime",
    rate: 1,
    transitionMs: 30,
    sampleRate: 22000,
    leadTime: 0.05,
    tailTime: 0.2,
  };
  const runs = [];
  for (const fricationMode of [0, 1]) {
    // Change only the source routing. Geometry, text, timing, and seed stay paired.
    const nodeParameterOverrides = { fricationMode };
    const render = await nodeRuntimeBackend.render({
      ...common,
      phrase,
      includeTrack: true,
      noiseSeed,
      persistWav: false,
      allowBrowserRender: false,
      renderHost: "node",
      nodeParameterOverrides,
    });
    runs.push({
      mode: fricationMode,
      metrics: render.metrics,
      measurements: measureFricatives(render),
    });
    if (outputDir) {
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(join(outputDir, `mode-${fricationMode}.json`), JSON.stringify(render));
      writeWav(join(outputDir, `mode-${fricationMode}.wav`), render.samples, render.sampleRate);
    }
  }
  const report = { phrase, noiseSeed, sampleRate: common.sampleRate, runs };
  if (outputDir)
    writeFileSync(join(outputDir, "comparison.json"), JSON.stringify(report, null, 2) + "\n");
  return report;
}
