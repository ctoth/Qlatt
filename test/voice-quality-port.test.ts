import { createHash } from "node:crypto";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { nodeRuntimeBackend } from "../scripts/rendering/backends/node-runtime";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { textToKlattTrack } from "../src/tts-frontend";

const experiments = ["klatt80-baseline", "qlatt-beauty"];
// Captured before the port at 66b4c375, with the same seeded runtime request.
const defaultHashes: Record<string, string> = {
  // #54: cited accent/phrase effort; the zero-effort control below preserves #64.
  "klatt80-baseline": "e5ff0f3fe5ef974cc7c2445706fcc4b5a36f0432343778ddde865271da5d109a",
  // #53: beauty requests jitter=0.25, now percent CV (Schoentgen Model II).
  "qlatt-beauty": "ba317188dbbc5842fd0e2599e24ff61c1b2af3cde7c84f22efdf453a9d7072d4",
};
// Captured with jitter explicitly disabled on unchanged #53 base 32c63af5.
const zeroJitterHashes: Record<string, string> = {
  // #54: default effort contour, with jitter disabled.
  "klatt80-baseline": "e5ff0f3fe5ef974cc7c2445706fcc4b5a36f0432343778ddde865271da5d109a",
  "qlatt-beauty": "5166a1079ff878146d9863a4f41b1b2c0dbb008a949073f0fc0b820701b80eed",
};
const frontend = (experiment: string) =>
  experiment === "qlatt-beauty" ? "qlatt-beauty" : "qlatt-english";
const cueCases: Record<string, number>[] = [
  { FTP: 1650, FTZ: 1800 },
  { BTP: 180, BTZ: 300 },
  { DF1: 50 },
  { DB1: 200 },
  { TL: 24 },
];
async function render(experimentId: string, nodeParameterOverrides?: Record<string, number>) {
  return nodeRuntimeBackend.render({
    repoRoot: path.resolve(__dirname, ".."),
    phrase: "hello world",
    baseF0: 110,
    frontendId: frontend(experimentId),
    experimentId,
    engine: "runtime",
    rate: 1,
    transitionMs: 30,
    sampleRate: 22050,
    leadTime: 0.05,
    tailTime: 0.2,
    includeTrack: false,
    noiseSeed: 56,
    persistWav: true,
    allowBrowserRender: false,
    renderHost: "node",
    nodeParameterOverrides,
  });
}
function hash(samples: number[]) {
  return createHash("sha256")
    .update(Buffer.from(new Float32Array(samples).buffer))
    .digest("hex");
}

describe.each(experiments)("%s Klatt 1990 voice quality", (experimentId) => {
  it("preserves the pre-effort audio at explicit zero effort", async () => {
    const output = await render(experimentId, { effort: 0, jitter: 0 });
    expect(hash(output.samples)).toBe(
      experimentId === "klatt80-baseline"
        ? "22f83e98339c5a08bce2efb5131cce43bd833bf68f460be463ae20d43336fed7"
        : zeroJitterHashes[experimentId],
    );
  }, 30000);
  it("matches the render baseline with jitter disabled", async () => {
    const output = await render(experimentId, { jitter: 0 });
    expect(hash(output.samples)).toBe(zeroJitterHashes[experimentId]);
  }, 30000);

  it("preserves the default render", async () => {
    const output = await render(experimentId);
    expect(hash(output.samples)).toBe(defaultHashes[experimentId]);
    expect(output.metrics.rms).toBeGreaterThan(0);
  }, 30000);

  it.each(cueCases)(
    "changes rendered samples for %j",
    async (params) => {
      const baseline = await render(experimentId);
      const enabled = await render(experimentId, params);
      expect(enabled.samples.every(Number.isFinite)).toBe(true);
      expect(enabled.metrics.rms).toBeGreaterThan(0);
      expect(hash(enabled.samples)).not.toBe(hash(baseline.samples));
    },
    30000,
  );

  it("bypasses any coincident tracheal pair exactly", async () => {
    const baseline = await render(experimentId);
    const coincident = await render(experimentId, { FTP: 1650, FTZ: 1650, BTP: 300, BTZ: 300 });
    expect(hash(coincident.samples)).toBe(hash(baseline.samples));
  }, 30000);

  it("applies the standalone tilt filter to the impulse source", async () => {
    const flat = await render(experimentId, { sourceMode: 0, TL: 0 });
    const tilted = await render(experimentId, { sourceMode: 0, TL: 24 });
    expect(tilted.samples.every(Number.isFinite)).toBe(true);
    expect(tilted.metrics.rms).toBeGreaterThan(0);
    expect(hash(tilted.samples)).not.toBe(hash(flat.samples));
  }, 30000);

  it("keeps DF1/DB1 off when the cascade count is zero", async () => {
    const baseline = await render(experimentId, { NFC: 0 });
    const modulated = await render(experimentId, { NFC: 0, DF1: 50, DB1: 200 });
    expect(hash(modulated.samples)).toBe(hash(baseline.samples));
  }, 30000);

  it("declares the ported primitives and cited parameter ranges", async () => {
    const { registry, semantics } = await loadExperimentConfig(
      experimentId,
      frontend(experimentId),
    );
    expect(registry.primitives["tilt-filter"]).toBeDefined();
    expect(registry.primitives["pitch-sync-mod"]).toBeDefined();
    expect(semantics.params?.DF1?.range).toEqual([0, 100]);
    expect(semantics.params?.DB1?.range).toEqual([0, 400]);
  });
});

it.each(["qlatt-english", "qlatt-beauty"])(
  "%s projects the cited breathy cues into frames",
  (frontendId) => {
    const track = textToKlattTrack("hello", 110, 30, { voiceQuality: "breathy", frontendId });
    const frames = track.filter((frame) => frame.phoneme && frame.phoneme !== "SIL");
    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) {
      expect(frame.params).toMatchObject({
        FTP: 1650,
        FTZ: 1800,
        BTP: 180,
        BTZ: 180,
        DF1: 50,
        DB1: 200,
        TL: 24,
      });
    }
  },
);
