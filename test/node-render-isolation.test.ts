import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, it, vi } from "vitest";
import * as configModule from "../src/experiments/load-experiment-config";
import * as f0Module from "../src/f0-filters-loader";
import * as runtimeModule from "../src/klatt-runtime";
import { createNodeRuntimeBackend } from "../src/rendering/backends/node-runtime";
import type { RenderPayload, RenderRequest } from "../src/rendering/types";
import * as frontendModule from "../src/tts-frontend";

function audioHash(payload: RenderPayload) {
  return createHash("sha256")
    .update(Buffer.from(new Float32Array(payload.samples).buffer))
    .digest("hex");
}

it("renders through the CLI from a temporary working directory", () => {
  const repoRoot = fileURLToPath(new URL("../", import.meta.url));
  const loader = createRequire(import.meta.url).resolve("ts-node/esm/transpile-only");
  const dir = mkdtempSync(join(tmpdir(), "qlatt-render-root-"));
  const report = join(dir, "render.json");
  const wav = join(dir, "render.wav");
  try {
    const run = spawnSync(
      process.execPath,
      [
        "--loader",
        pathToFileURL(loader).href,
        "--experimental-specifier-resolution=node",
        resolve(repoRoot, "scripts/render-phrase.ts"),
        "--phrase",
        "See me.",
        "--host",
        "node",
        "--frontend-id",
        "qlatt-beauty",
        "--experiment-id",
        "qlatt-beauty",
        "--out-json",
        report,
        "--out-wav",
        wav,
        "--compare-golden",
        "0",
      ],
      {
        cwd: dir,
        encoding: "utf8",
        env: { ...process.env, TS_NODE_PROJECT: resolve(repoRoot, "tsconfig.json") },
      },
    );
    expect(run.status, run.stderr).toBe(0);
    const payload = JSON.parse(readFileSync(report, "utf8")) as RenderPayload;
    expect(payload.frontendId).toBe("qlatt-beauty");
    expect(payload.samples.length).toBeGreaterThan(0);
    expect(payload.samples.every(Number.isFinite)).toBe(true);
    expect(payload.metrics.peak).toBeGreaterThan(0);
    expect(readFileSync(wav).subarray(0, 4).toString()).toBe("RIFF");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 60_000);

it("matches fresh renders through concurrent A/B and A replay with isolated runtime state", async () => {
  const config = vi.spyOn(configModule, "loadExperimentConfig");
  const runtime = vi.spyOn(runtimeModule, "createKlattRuntime");
  const preload = vi.spyOn(f0Module, "preloadF0Filters");
  const frontend = vi.spyOn(frontendModule, "textToKlattTrackDetailed");
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
    expect(first.sourceSpans?.length).toBeGreaterThan(0);
    expect(replay.sourceSpans).toEqual(first.sourceSpans);
    expect(first.sourceSpans?.some((span) => span.start === 0 && span.end === 3)).toBe(true);
    // tn_word_source owns the non-whitespace token, including its final period.
    expect(first.sourceSpans?.some((span) => span.start === 4 && span.end === 7)).toBe(true);
    for (const span of first.sourceSpans ?? []) {
      expect(span.end).toBeLessThanOrEqual(a.phrase.length);
      expect(
        (first.track as frontendModule.TextToKlattTrackDetailedResult["track"]).some(
          (frame) => frame.segmentId === span.segmentId && frame.time === span.time,
        ),
      ).toBe(true);
    }
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
    expect(preload).toHaveBeenCalledTimes(3);
    for (const [index, call] of calls.entries()) {
      expect(preload.mock.calls[index][0]).toBe(call.assetLoader);
      expect(preload.mock.invocationCallOrder[index]).toBeLessThan(
        frontend.mock.invocationCallOrder[index],
      );
    }
    expect(new Set(calls.map((options) => options.audioContext)).size).toBe(3);
    expect(new Set(calls.map((options) => options.diagnostics)).size).toBe(3);
    expect(Object.isFrozen((await config.mock.results[0].value).graph.nodes)).toBe(true);
    expect(calls[0].config.graph).not.toBe(calls[1].config.graph);
    expect(calls[0].config.semantics).not.toBe(calls[1].config.semantics);
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
    const parsed = await fresh.render({
      ...a,
      frontendId: "dectalk-english",
      experimentId: "dectalk-english",
      phrase: "Dr. 25 cats.",
    });
    const detailed = frontend.mock.results.at(-1)?.value;
    expect(detailed.sourceOrigins).toBeDefined();
    expect(parsed.sourceSpans?.some((span) => span.start === 0 && span.end === 3)).toBe(true);
    expect(parsed.sourceSpans?.some((span) => span.start === 4 && span.end === 6)).toBe(true);
    const partFrames = (
      parsed.track as frontendModule.TextToKlattTrackDetailedResult["track"]
    ).filter((frame) => {
      const tokenId = frame.segmentId
        ? detailed.utterance.getItem(frame.segmentId)?.get("sourceTokenId")
        : undefined;
      return typeof tokenId === "string" && tokenId.includes(":");
    });
    expect(partFrames.length).toBeGreaterThan(0);
    for (const frame of partFrames) {
      expect(
        parsed.sourceSpans?.some(
          (span) => span.segmentId === frame.segmentId && span.time === frame.time,
        ),
      ).toBe(true);
    }
  } finally {
    await warm.dispose();
    await fresh.dispose();
    vi.restoreAllMocks();
  }
}, 60_000);
