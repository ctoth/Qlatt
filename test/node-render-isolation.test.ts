import { createHash } from "node:crypto";
import { expect, it, vi } from "vitest";
import { createNodeRuntimeBackend } from "../scripts/rendering/backends/node-runtime";
import * as configModule from "../src/experiments/load-experiment-config";
import * as runtimeModule from "../src/klatt-runtime";
import type { RenderPayload, RenderRequest } from "../src/rendering/types";

function audioHash(payload: RenderPayload) {
  return createHash("sha256")
    .update(Buffer.from(new Float32Array(payload.samples).buffer))
    .digest("hex");
}

it("matches fresh renders through concurrent A/B and A replay with isolated runtime state", async () => {
  const config = vi.spyOn(configModule, "loadExperimentConfig");
  const runtime = vi.spyOn(runtimeModule, "createKlattRuntime");
  const timings: Array<Record<string, number>> = [];
  const warm = createNodeRuntimeBackend({
    keepWarm: true,
    onTimings: (_request, stages) => {
      timings.push(stages);
    },
  });
  const fresh = createNodeRuntimeBackend();
  const a: RenderRequest = {
    repoRoot: process.cwd(),
    phrase: "See me.",
    frontendId: "qlatt-english",
    experimentId: "klatt80-baseline",
    engine: "runtime",
    rate: 1,
    transitionMs: 30,
    sampleRate: 22050,
    leadTime: 0.02,
    tailTime: 0.05,
    includeTrack: true,
    noiseSeed: 87,
    persistWav: true,
    allowBrowserRender: false,
    renderHost: "node",
  };
  const b = {
    ...a,
    phrase: "Fish.",
    noiseSeed: 91,
    baseF0: 160,
    rate: 1.2,
    nodeParameterOverrides: { F1: 650 },
  };
  try {
    const [first, other] = await Promise.all([warm.render(a), warm.render(b)]);
    const replay = await warm.render(a);
    expect(config).toHaveBeenCalledTimes(1);
    expect(timings).toHaveLength(3);
    for (const stages of timings) {
      expect(Object.keys(stages)).toEqual(
        expect.arrayContaining([
          "assetsConfig",
          "frontendAndContext",
          "runtimeTotal",
          "scheduling",
          "rendering",
          "payload",
          "runtime.workletRegistration",
          "runtime.nodeCreation",
          "runtime.initialSemantics",
          "runtime.processorReady",
        ]),
      );
      for (const value of Object.values(stages)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
    const calls = runtime.mock.calls.map(([options]) => options);
    expect(new Set(calls.map((options) => options.audioContext)).size).toBe(3);
    expect(new Set(calls.map((options) => options.diagnostics)).size).toBe(3);
    expect(Object.isFrozen((await config.mock.results[0].value).graph.nodes)).toBe(true);
    expect(calls[0].graph).not.toBe(calls[1].graph);
    expect(calls[0].semantics).not.toBe(calls[1].semantics);
    const baselineA = await fresh.render(a);
    const baselineB = await fresh.render(b);
    expect(audioHash(first)).toBe(audioHash(baselineA));
    expect(audioHash(replay)).toBe(audioHash(baselineA));
    expect(audioHash(other)).toBe(audioHash(baselineB));
    expect(audioHash(other)).not.toBe(audioHash(first));
    expect(replay.track).toEqual(baselineA.track);
    expect(other.track).toEqual(baselineB.track);
    // Retaining or changing a returned diagnostic list cannot affect the next request.
    expect(first.diagnostics).not.toBe(replay.diagnostics);
    await expect(warm.render({ ...a, frontendId: "missing" })).rejects.toThrow();
    expect(audioHash(await warm.render(a))).toBe(audioHash(baselineA));
  } finally {
    await warm.dispose();
    await fresh.dispose();
    vi.restoreAllMocks();
  }
}, 60_000);
