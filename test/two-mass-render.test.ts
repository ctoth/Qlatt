import { expect, it } from "vitest";
import { nodeRuntimeBackend } from "../scripts/rendering/backends/node-runtime";

it("renders mode 3 through the experiment graph and responds to pressure removal", async () => {
  const rms: number[] = [];
  for (const subglottalPressure of [8, 0]) {
    const render = await nodeRuntimeBackend.render({
      repoRoot: process.cwd(),
      frontendId: "qlatt-english",
      experimentId: "steinecke95",
      engine: "runtime",
      phrase: "We owe you.",
      rate: 1,
      transitionMs: 30,
      sampleRate: 44100,
      leadTime: 0.05,
      tailTime: 0.2,
      noiseSeed: 58,
      includeTrack: false,
      persistWav: false,
      allowBrowserRender: false,
      renderHost: "node",
      nodeParameterOverrides: { sourceMode: 3, subglottalPressure, AH: 0, AF: 0, AVS: 0 },
    });
    expect(render.samples.every(Number.isFinite)).toBe(true);
    expect(render.metrics.peak).toBeLessThan(1);
    rms.push(render.metrics.rms);
  }
  expect(rms[0]).toBeGreaterThan(1e-5);
  expect(rms[1]).toBeLessThan(rms[0] * 0.01);
}, 60000);
