/**
 * render-beauty — render a phrase through the qlatt-beauty voice WITH an
 * emotion. The thin expressive wrapper around the node-runtime render path:
 * assemble the KlattFrame track exactly as `render-phrase.ts` does, compile the
 * named affect preset (`src/input/affect.ts`), apply its voice-quality delta to
 * the track (`src/input/apply-affect.ts`), then render to WAV with the same
 * offline runtime + interpreter + write-wav the shared backend uses.
 *
 * Default (no --affect, or --affect neutral) is the neutral render, which is
 * numerically identical to a plain `render-phrase.ts` render (the (c) base
 * case: NEUTRAL_VQ is the identity transform).
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/render-beauty.ts --phrase "I can't believe you're here" \
 *     --affect tender --degree 0.8 --frontend-id qlatt-beauty \
 *     --experiment-id qlatt-beauty --sample-rate 48000 \
 *     --out-wav design/beauty-synthesis/demo/affect-tender.wav
 *
 * Flags:
 *   --phrase <text>            Text to speak (default "hello world")
 *   --affect <preset>          Affect preset name (default "neutral")
 *   --degree <0..1>            Affect intensity (default 1)
 *   --sex <male|female>        Required for clinical presets (manic/depressive)
 *   --frontend-id <id>         Frontend (default qlatt-beauty)
 *   --experiment-id <id>       Experiment/graph (default qlatt-beauty)
 *   --base-f0 <Hz>             Base F0 override
 *   --transition-ms <ms>       Formant transition duration (default 30)
 *   --rate <x>                 Speaking rate (default 1)
 *   --sample-rate <Hz>         Output sample rate (default 48000)
 *   --lead-time <s>            Silence lead (default 0.05)
 *   --tail-time <s>            Silence tail (default 0.2)
 *   --noise-seed <int>         Deterministic noise seed
 *   --out-wav <path>           Output WAV (required to render audio)
 *   --print-citations          Print the affect's citations
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AudioWorkletNode as NodeAudioWorkletNode,
  OfflineAudioContext,
} from "node-web-audio-api";
import { createKlattInterpreter } from "../src/klatt-interpreter.ts";
import { createKlattRuntime } from "../src/klatt-runtime.ts";
import { textToKlattTrackDetailed } from "../src/tts-frontend.ts";
import { createDiagnostics } from "../src/diagnostics.ts";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config.ts";
import { writeWav } from "../src/rendering/write-wav.ts";
import { createNodeRuntimeAssetLoader } from "../src/runtime-assets/node-loader.ts";
import { compileAffect, neutralAffect } from "../src/input/affect.ts";
import { applyAffectToTrack } from "../src/input/apply-affect.ts";
import type { SpeakerSex } from "../src/input/direction-track.ts";
import { createHash } from "node:crypto";

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  const next = process.argv[i + 1];
  // Allow boolean flags (no value / next token is another flag).
  args.set(key.slice(2), next !== undefined && !next.startsWith("--") ? next : "");
}

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");

const phrase = args.get("phrase") ?? "hello world";
const affectName = args.get("affect") ?? "neutral";
const degree = args.has("degree") ? Number(args.get("degree")) : 1;
const sexArg = args.get("sex");
const sex: SpeakerSex | undefined =
  sexArg === "male" || sexArg === "female" ? sexArg : undefined;
const frontendId = args.get("frontend-id") ?? "qlatt-beauty";
const experimentId = args.get("experiment-id") ?? "qlatt-beauty";
const baseF0 = args.has("base-f0") ? Number(args.get("base-f0")) : undefined;
const transitionMs = Number(args.get("transition-ms") ?? 30);
const rate = Number(args.get("rate") ?? 1);
const sampleRate = Number(args.get("sample-rate") ?? 48000);
const leadTime = Number(args.get("lead-time") ?? 0.05);
const tailTime = Number(args.get("tail-time") ?? 0.2);
const noiseSeed = Number(args.get("noise-seed") ?? 20260214);
const printCitations = args.has("print-citations");
const outWav = args.has("out-wav")
  ? path.resolve(args.get("out-wav") as string)
  : null;

function deriveNodeNoiseSeed(baseSeed: number, nodeId: string): number {
  const seedBytes = createHash("sha256")
    .update(`${Math.trunc(baseSeed)}:${nodeId}`)
    .digest();
  const derived = seedBytes.readUInt32LE(0);
  return derived || 1;
}

function buildWorkletProcessorOptionsByNodeId(
  graph: { nodes: Record<string, { type: string }> },
  baseSeed: number,
): Record<string, Record<string, unknown>> {
  if (!Number.isFinite(baseSeed)) return {};
  const overrides: Record<string, Record<string, unknown>> = {};
  for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
    if (nodeDef.type !== "noise-source") continue;
    overrides[nodeId] = { seed: deriveNodeNoiseSeed(baseSeed, nodeId) };
  }
  return overrides;
}

async function main(): Promise<void> {
  // 1. Assemble the neutral qlatt-beauty track (identical to render-phrase).
  const diagnostics = createDiagnostics({ maxEntries: 1000 });
  const frontend = textToKlattTrackDetailed(phrase, baseF0, transitionMs, {
    frontendId,
    rate,
    diagnostics,
  });

  // 2. Compile the named affect preset + degree into its V/A/D + VQ substrate.
  const isNeutral = affectName === "neutral" || degree === 0;
  const affect = isNeutral ? neutralAffect() : compileAffect(affectName, degree, { sex });

  // 3. Apply the affect delta to the assembled track (NEUTRAL_VQ = identity).
  const { track, citations } = applyAffectToTrack(frontend.track, affect);

  console.log(
    `render-beauty: phrase="${phrase}" affect=${affect.label}@${degree} ` +
      `group=${affect.group}${affect.resolvedSex ? ` sex=${affect.resolvedSex}` : ""} ` +
      `frames=${track.length} ` +
      `duration=${(track.length ? track[track.length - 1].time : 0).toFixed(3)}s`,
  );
  console.log(
    `  vq: rdDelta=${affect.vq.rdDelta} f0Scale=${affect.vq.f0Scale} ` +
      `durationScale=${affect.vq.durationScale} intensityBoost=${affect.vq.intensityBoost} ` +
      `ahBoost=${affect.vq.ahBoost} tilt=${affect.vq.spectralTiltBoost}`,
  );
  if (printCitations) console.log(`  citations: ${citations.join(", ")}`);

  if (!outWav) {
    console.log("  (no --out-wav given; track assembled but not rendered)");
    return;
  }

  // 4. Render the affected track to WAV via the offline node runtime.
  const totalTime =
    (track.length ? track[track.length - 1].time : 0) + leadTime + tailTime;
  const length = Math.max(1, Math.ceil(totalTime * sampleRate));
  const ctx = new OfflineAudioContext(1, length, sampleRate);
  const config = await loadExperimentConfig(experimentId);
  const assetLoader = await createNodeRuntimeAssetLoader(
    path.join(repoRoot, "public", "worklets"),
  );
  try {
    const workletProcessorOptionsByNodeId = buildWorkletProcessorOptionsByNodeId(
      config.graph as { nodes: Record<string, { type: string }> },
      noiseSeed,
    );
    const runtime = await createKlattRuntime({
      audioContext: ctx as unknown as AudioContext,
      graph: config.graph,
      semantics: config.semantics,
      registry: config.registry,
      assetLoader,
      audioWorkletNodeCtor: NodeAudioWorkletNode as unknown as typeof AudioWorkletNode,
      workletProcessorOptionsByNodeId,
    });
    runtime.connectToDestination();
    try {
      const interpreter = createKlattInterpreter({
        audioContext: ctx as unknown as AudioContext,
        runtime,
        semantics: config.semantics,
        bindingMap: runtime.getBindingMap(),
      });
      interpreter.scheduleTrack(track, leadTime);
      const buffer = await ctx.startRendering();
      const channel = new Float32Array(buffer.length);
      buffer.copyFromChannel(channel, 0);
      writeWav(outWav, channel, sampleRate);
      let peak = 0;
      for (let i = 0; i < channel.length; i += 1) {
        const a = Math.abs(channel[i]);
        if (a > peak) peak = a;
      }
      console.log(`  wrote ${outWav} (${length} samples @ ${sampleRate} Hz, peak ${peak.toFixed(4)})`);
    } finally {
      runtime.disconnect();
    }
  } finally {
    await assetLoader.dispose?.();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
