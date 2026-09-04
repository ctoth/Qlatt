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

describe("runtime output level", () => {
  it("keeps hello world near full scale without clipping the final render", {
    timeout: 30000,
  }, async () => {
    const payload = await nodeRuntimeBackend.render(makeRequest("hello world"));
    expect(payload.metrics.peak).toBeLessThanOrEqual(1.05);
  });

  it("keeps a fricative-heavy phrase near full scale without clipping the final render", {
    timeout: 30000,
  }, async () => {
    const payload = await nodeRuntimeBackend.render(
      makeRequest(
        "Holy shit! How well is this shit functioning now? Filter fat frogs from fragrant flats.",
      ),
    );
    expect(payload.metrics.peak).toBeLessThanOrEqual(1.05);
  });
});
