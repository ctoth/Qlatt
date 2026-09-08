import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import FFT from "fft.js";
import { writeWav } from "../src/rendering/write-wav";
import { nodeRuntimeBackend } from "./rendering/backends/node-runtime.ts";

// Engineering spectral check: Hann-windowed whole-word power, not a perceptual
// score or a claim to reproduce the subjects in Recasens 1983.
function spectrum(samples: number[]) {
  let size = 1;
  while (size < samples.length) size *= 2;
  const input = new Array<number>(size).fill(0);
  for (let n = 0; n < samples.length; n++) {
    input[n] = samples[n] * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (samples.length - 1)));
  }
  const fft = new FFT(size);
  const out = fft.createComplexArray();
  fft.realTransform(out, input);
  return Array.from({ length: size / 2 + 1 }, (_, k) => out[k * 2] ** 2 + out[k * 2 + 1] ** 2);
}

/** Run via Vitest for the repository's Vite resource environment. */
export async function renderNasalComparison(phrase: string, outputDir?: string) {
  const runs = [];
  const powers: number[][] = [];
  for (const coupled of [false, true]) {
    const render = await nodeRuntimeBackend.render({
      repoRoot: process.cwd(),
      frontendId: "qlatt-english",
      experimentId: "klatt80-baseline",
      engine: "runtime",
      phrase,
      rate: 1,
      transitionMs: 30,
      sampleRate: 22000,
      leadTime: 0.05,
      tailTime: 0.2,
      noiseSeed: 52,
      includeTrack: true,
      persistWav: false,
      allowBrowserRender: false,
      renderHost: "node",
      nodeParameterOverrides: coupled ? {} : { nasalCouplingArea: 0 },
    });
    const power = spectrum(Array.from(render.samples));
    powers.push(power);
    const binHz = render.sampleRate / ((power.length - 1) * 2);
    const band = (low: number, high: number) =>
      power.reduce((sum, p, i) => sum + (i * binHz >= low && i * binHz < high ? p : 0), 0);
    // Feng & Castelli 1996: the low (~300 Hz) and high (~1000 Hz) nasal regions.
    runs.push({
      coupled,
      ...render.metrics,
      lowBandPower: band(200, 500),
      highBandPower: band(800, 1200),
    });
    if (outputDir) {
      mkdirSync(outputDir, { recursive: true });
      writeWav(
        join(outputDir, coupled ? "coupled.wav" : "closed.wav"),
        render.samples,
        render.sampleRate,
      );
    }
  }
  const spectralDifference =
    powers[1].reduce((sum, p, i) => sum + Math.abs(p - powers[0][i]), 0) /
    powers[0].reduce((sum, p) => sum + p, 0);
  const report = { phrase, seed: 52, sampleRate: 22000, spectralDifference, runs };
  if (outputDir)
    writeFileSync(join(outputDir, "comparison.json"), JSON.stringify(report, null, 2) + "\n");
  return report;
}
