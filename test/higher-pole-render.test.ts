import { join } from "node:path";
import { expect, it } from "vitest";
import { measureSpectrum } from "../scripts/measure-spectrum";
import { nodeRuntimeBackend } from "../scripts/rendering/backends/node-runtime";
import { writeWav } from "../src/rendering/write-wav";

it("renders the worked HPC at 44.1 kHz and compares legacy and four-pole controls", async () => {
  const reports = [];
  for (const [name, experimentId, NFC, tractLength] of [
    ["legacy10", "klatt80-baseline", 10, 17.5],
    ["four-pole", "klatt80-baseline", 4, 17.5],
    ["laine14", "laine88", 4, 14],
    ["laine17.5", "laine88", 4, 17.5],
    ["laine21", "laine88", 4, 21],
  ] as const) {
    const render = await nodeRuntimeBackend.render({
      repoRoot: process.cwd(),
      frontendId: "qlatt-english",
      experimentId,
      engine: "runtime",
      phrase: "We owe you.",
      rate: 1,
      transitionMs: 30,
      sampleRate: 44100,
      leadTime: 0.05,
      tailTime: 0.2,
      noiseSeed: 55,
      includeTrack: true,
      persistWav: false,
      allowBrowserRender: false,
      renderHost: "node",
      nodeParameterOverrides: { NFC, tractLength },
    });
    expect(render.metrics.rms).toBeGreaterThan(0);
    expect(render.metrics.peak).toBeLessThan(1);
    const spectrum = measureSpectrum(render.samples, render.sampleRate);
    expect(Number.isFinite(spectrum.highToLowDb)).toBe(true);
    reports.push({ name, ...spectrum, ...render.metrics });
    if (process.env.HPC_OUTPUT_DIR)
      writeWav(join(process.env.HPC_OUTPUT_DIR, `${name}.wav`), render.samples, render.sampleRate);
  }
  // The broad zeros must change the rendered spectrum relative to the SAME
  // four-pole control, not merely reflect dropping F5-F10.
  expect(reports[3].highToLowDb!).toBeGreaterThan(reports[1].highToLowDb!);
  expect(reports[2].highToLowDb).not.toBeCloseTo(reports[4].highToLowDb!, 1);
  console.log(JSON.stringify(reports));
}, 120000);
