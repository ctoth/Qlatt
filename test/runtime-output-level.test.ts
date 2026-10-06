import path from "node:path";
import { describe, expect, it } from "vitest";
import { nodeRuntimeBackend } from "../scripts/rendering/backends/node-runtime";
import type { RenderRequest } from "../src/rendering/types";

const repoRoot = path.resolve(__dirname, "..");

function makeRequest(phrase: string): RenderRequest {
  return {
    repoRoot,
    phrase,
    baseF0: 110,
    frontendId: "qlatt-english",
    experimentId: "klatt80-baseline",
    engine: "runtime",
    rate: 1,
    transitionMs: 30,
    sampleRate: 22050,
    leadTime: 0.05,
    tailTime: 0.2,
    includeTrack: false,
    noiseSeed: 20260214,
    persistWav: true,
    allowBrowserRender: false,
    renderHost: "node",
  };
}

// The klatt80-baseline output stage (masterGain, outputCompressor, outputGain)
// sets the final peak. Measured 2026-10-05 on both phrases below: 0.127 and
// 0.130 (about -18 dBFS), which is 18 dB under full scale.
// engineering estimate: a +/-3 dB band around that measurement, so the test
// fails on clipping, on a collapse toward silence, and on an unreviewed change
// to the output stage. Re-measure and move the band when the stage is retuned.
const PEAK_FLOOR = 0.09;
const PEAK_CEILING = 0.18;

describe("runtime output level", () => {
  it("renders hello world inside the measured output peak band", {
    timeout: 30000,
  }, async () => {
    const payload = await nodeRuntimeBackend.render(makeRequest("hello world"));
    expect(payload.metrics.peak).toBeGreaterThanOrEqual(PEAK_FLOOR);
    expect(payload.metrics.peak).toBeLessThanOrEqual(PEAK_CEILING);
  });

  it("renders a fricative-heavy phrase inside the measured output peak band", {
    timeout: 30000,
  }, async () => {
    const payload = await nodeRuntimeBackend.render(
      makeRequest(
        "Holy shit! How well is this shit functioning now? Filter fat frogs from fragrant flats.",
      ),
    );
    expect(payload.metrics.peak).toBeGreaterThanOrEqual(PEAK_FLOOR);
    expect(payload.metrics.peak).toBeLessThanOrEqual(PEAK_CEILING);
  });
});
