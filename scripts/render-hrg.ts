/**
 * render-hrg — drive synthesis end-to-end THROUGH the provenance-stamped HRG.
 *
 *   phrase -> buildUtteranceFromPhrase (runs the real frontend, populates an HRG
 *   utterance, stamps every acoustic feature) -> lowerToFrames -> render the HRG
 *   track to a WAV via the node-runtime offline path -> print a whyParamAt()
 *   provenance chain for one rendered frame param.
 *
 * This is ADDITIVE: it imports the existing runtime / interpreter / experiment
 * config exactly as `scripts/rendering/backends/node-runtime.ts` does, but feeds
 * them a track built by the HRG instead of `textToKlattTrackDetailed`. It does
 * not modify the engine, the default render path, or any YAML.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/render-hrg.ts --phrase "she sees a calm blue moon" \
 *       --frontend-id qlatt-beauty --experiment-id qlatt-beauty \
 *       --sample-rate 48000 --out-wav design/beauty-synthesis/demo/hrg-moon.wav
 */
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AudioWorkletNode as NodeAudioWorkletNode,
  OfflineAudioContext,
} from "node-web-audio-api";
import { createKlattInterpreter } from "../src/klatt-interpreter.ts";
import { createKlattRuntime } from "../src/klatt-runtime.ts";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config.ts";
import { summarizeTrack } from "../src/rendering/track-summary.ts";
import { writeWav } from "../src/rendering/write-wav.ts";
import { createNodeRuntimeAssetLoader } from "../src/runtime-assets/node-loader.ts";
import { buildUtteranceFromPhrase } from "../src/declarative-frontend/hrg/bridge.ts";
import { whyParamAt } from "../src/declarative-frontend/hrg/provenance-query.ts";
import { frameIndexAt } from "../src/declarative-frontend/hrg/lowering.ts";

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  const value = process.argv[i + 1];
  args.set(key.slice(2), value);
}

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");

const phrase = args.get("phrase") ?? "she sees a calm blue moon";
const frontendId = args.get("frontend-id") ?? "qlatt-beauty";
const experimentId = args.get("experiment-id") ?? "qlatt-beauty";
const sampleRate = Number(args.get("sample-rate") ?? 48000);
const baseF0 = args.has("base-f0") ? Number(args.get("base-f0")) : undefined;
const transitionMs = Number(args.get("transition-ms") ?? 30);
const leadTime = Number(args.get("lead-time") ?? 0.05);
const tailTime = Number(args.get("tail-time") ?? 0.2);
const noiseSeed = Number(args.get("noise-seed") ?? 20260214);
const whyParam = args.get("why-param") ?? "F0";
const outWav = args.get("out-wav")
  ? path.resolve(args.get("out-wav") as string)
  : path.join(repoRoot, "design", "beauty-synthesis", "demo", "hrg-render.wav");

function deriveNodeNoiseSeed(baseSeed: number, nodeId: string): number {
  const seedBytes = createHash("sha256").update(`${Math.trunc(baseSeed)}:${nodeId}`).digest();
  return seedBytes.readUInt32LE(0) || 1;
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
  // 1. phrase -> HRG -> lowered Klatt frames (provenance intact).
  const bridge = buildUtteranceFromPhrase(phrase, frontendId, { baseF0, transitionMs });
  const track = bridge.lowered.frames;
  if (track.length === 0) throw new Error("HRG lowering produced no frames");

  // 2. Render the HRG track via the node-runtime offline path.
  const totalTime = (track.length ? track[track.length - 1].time : 0) + leadTime + tailTime;
  const length = Math.max(1, Math.ceil(totalTime * sampleRate));
  const ctx = new OfflineAudioContext(1, length, sampleRate);
  const config = await loadExperimentConfig(experimentId);
  const assetLoader = await createNodeRuntimeAssetLoader(
    path.join(repoRoot, "public", "worklets"),
  );

  let rms = 0;
  let peak = 0;
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
      const samples = new Array<number>(channel.length);
      for (let i = 0; i < channel.length; i += 1) {
        const value = channel[i];
        samples[i] = value;
        rms += value * value;
        const absValue = Math.abs(value);
        if (absValue > peak) peak = absValue;
      }
      rms = channel.length ? Math.sqrt(rms / channel.length) : 0;
      writeWav(outWav, samples, sampleRate);
    } finally {
      runtime.disconnect();
    }
  } finally {
    await assetLoader.dispose?.();
  }

  // 3. Report + a provenance chain from a rendered frame param.
  const summary = summarizeTrack(track);
  console.log(
    JSON.stringify(
      {
        phrase,
        frontendId,
        experimentId,
        out: path.relative(repoRoot, outWav),
        sampleRate,
        hrgFrames: track.length,
        segments: bridge.frontendPhones.length,
        paramColumns: bridge.paramKeys.length,
        metrics: { rms, peak },
        trackSummary: summary,
      },
      null,
      2,
    ),
  );

  // Pick a voiced time near the track middle for the whyParamAt trace.
  const midTime = track[Math.floor(track.length / 2)].time;
  const traceIndex = frameIndexAt(bridge.lowered, midTime);
  const chain = whyParamAt(bridge.lowered, whyParam, midTime);
  console.log(
    `\nwhyParamAt(track, "${whyParam}", ${midTime.toFixed(3)}s) — frame ${traceIndex} (${track[traceIndex]?.phoneme ?? "?"}), ${chain.length} decisions:`,
  );
  for (const decision of chain) {
    const cites = decision.citations.length ? ` [${decision.citations.join(", ")}]` : "";
    console.log(`  ${decision.id} ${decision.stage}/${decision.type} ${decision.subject}`);
    console.log(`      reason: ${decision.reason}${cites}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
