import path from "node:path";
import { describe, expect, it } from "vitest";
import { nodeRuntimeBackend } from "../scripts/rendering/backends/node-runtime";
import type { RenderRequest } from "../src/rendering/types";

function request(overrides: Partial<RenderRequest> = {}): RenderRequest {
  return {
    repoRoot: path.resolve(__dirname, ".."),
    phrase: "fee",
    baseF0: 110,
    frontendId: "dectalk-english",
    experimentId: "dectalk-english",
    engine: "runtime",
    rate: 1,
    transitionMs: 30,
    sampleRate: 48000,
    leadTime: 0.05,
    tailTime: 0.2,
    includeTrack: false,
    noiseSeed: 140,
    persistWav: true,
    allowBrowserRender: false,
    renderHost: "node",
    ...overrides,
  };
}

describe("frontend vocabulary in the real renderer", () => {
  it("rejects the incompatible pair before synthesis", async () => {
    await expect(
      nodeRuntimeBackend.render(request({ experimentId: "klatt80-baseline" })),
    ).rejects.toThrow(/E_FRONTEND_VOCABULARY.*breathiness/);
  });

  it("each DECtalk high-frequency amplitude changes rendered audio", {
    timeout: 30000,
  }, async () => {
    const baseline = await nodeRuntimeBackend.render(
      request({ nodeParameterOverrides: { A9: 0, A10: 0 } }),
    );
    for (const amplitudes of [
      { A9: 42, A10: 0 },
      { A9: 0, A10: 35 },
    ]) {
      const active = await nodeRuntimeBackend.render(
        request({ nodeParameterOverrides: amplitudes }),
      );
      expect(active.samples.length).toBe(baseline.samples.length);
      expect(active.samples.every(Number.isFinite)).toBe(true);
      const differenceEnergy = active.samples.reduce(
        (sum, value, index) => sum + (value - baseline.samples[index]) ** 2,
        0,
      );
      expect(differenceEnergy).toBeGreaterThan(0);
    }
  });

  it("cascade count changes audio while the high-frequency branches stay off", {
    timeout: 30000,
  }, async () => {
    const five = await nodeRuntimeBackend.render(
      request({ nodeParameterOverrides: { NFC: 5, A9: 0, A10: 0 } }),
    );
    const eight = await nodeRuntimeBackend.render(
      request({ nodeParameterOverrides: { NFC: 8, A9: 0, A10: 0 } }),
    );
    expect(five.samples.length).toBe(eight.samples.length);
    expect(five.samples.every(Number.isFinite)).toBe(true);
    const differenceEnergy = five.samples.reduce(
      (sum, value, index) => sum + (value - eight.samples[index]) ** 2,
      0,
    );
    expect(differenceEnergy).toBeGreaterThan(0);
  });
});
