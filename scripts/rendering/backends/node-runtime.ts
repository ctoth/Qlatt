import { createHash } from "node:crypto";
import { AudioWorkletNode as NodeAudioWorkletNode, OfflineAudioContext } from "node-web-audio-api";
import { createDiagnostics } from "../../../src/diagnostics.ts";
import { createKlattInterpreter } from "../../../src/klatt-interpreter.ts";
import { createKlattRuntime } from "../../../src/klatt-runtime.ts";
import { summarizeTrack } from "../../../src/rendering/track-summary.ts";
import type { RenderBackend, RenderPayload, RenderRequest } from "../../../src/rendering/types.ts";
import { textToKlattTrackDetailed } from "../../../src/tts-frontend.ts";
import { createNodeRenderResources, loadNodeRenderResources } from "./node-render-resources.ts";

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
  if (!Number.isFinite(baseSeed)) {
    return {};
  }
  const overrides: Record<string, Record<string, unknown>> = {};
  for (const [nodeId, nodeDef] of Object.entries(graph.nodes)) {
    if (nodeDef.type !== "noise-source" && nodeDef.type !== "frication-source") continue;
    overrides[nodeId] = {
      seed: deriveNodeNoiseSeed(baseSeed, nodeId),
    };
  }
  return overrides;
}

/** The caller owns disposal when retaining assets across renders. */
export function createNodeRuntimeBackend({
  keepWarm = false,
  onTimings,
}: {
  keepWarm?: boolean;
  onTimings?: (request: RenderRequest, timings: Record<string, number>) => void;
} = {}): RenderBackend & { dispose(): Promise<void> } {
  const resources = keepWarm ? createNodeRenderResources() : undefined;
  return {
    id: "node-runtime",
    async dispose() {
      await resources?.dispose();
    },
    supports(request: RenderRequest): boolean {
      if (!request.persistWav) return false;
      if (request.engine !== "runtime") return false;
      return request.renderHost === "auto" || request.renderHost === "node";
    },
    async render(request: RenderRequest): Promise<RenderPayload> {
      const timings: Record<string, number> = {};
      let stageStart = onTimings ? performance.now() : 0;
      const mark = (stage: string) => {
        if (!onTimings) return;
        const now = performance.now();
        timings[stage] = now - stageStart;
        stageStart = now;
      };
      const { config: preparedConfig, assetLoader } = await (resources?.get(request) ??
        loadNodeRenderResources(request));
      // Runtime formant-bank expansion writes graph nodes and realize rules.
      // Keep those writes local to this request, never in the cached template.
      const config = structuredClone(preparedConfig);
      mark("assetsConfig");
      try {
        const diagnostics = createDiagnostics({ maxEntries: 1000 });
        const frontend = textToKlattTrackDetailed(
          request.phrase,
          request.baseF0,
          request.transitionMs,
          {
            frontendId: request.frontendId,
            rate: request.rate,
            diagnostics,
          },
        );
        const track = request.nodeParameterOverrides
          ? frontend.track.map((frame) => ({
              ...frame,
              params: { ...frame.params, ...request.nodeParameterOverrides },
            }))
          : frontend.track;
        const totalTime =
          (track.length ? track[track.length - 1].time : 0) + request.leadTime + request.tailTime;
        const length = Math.max(1, Math.ceil(totalTime * request.sampleRate));

        const ctx = new OfflineAudioContext(1, length, request.sampleRate);
        mark("frontendAndContext");
        const debugLogging = process.env.QLATT_RENDER_DEBUG === "1";
        const workletProcessorOptionsByNodeId = buildWorkletProcessorOptionsByNodeId(
          config.graph as { nodes: Record<string, { type: string }> },
          request.noiseSeed,
        );
        const runtime = await createKlattRuntime({
          diagnostics,
          audioContext: ctx as unknown as AudioContext,
          graph: config.graph,
          semantics: config.semantics,
          registry: config.registry,
          assetLoader,
          audioWorkletNodeCtor: NodeAudioWorkletNode as unknown as typeof AudioWorkletNode,
          workletProcessorOptionsByNodeId,
          ...(onTimings
            ? {
                onTiming: (stage: string, ms: number) => {
                  timings[`runtime.${stage}`] = ms;
                },
              }
            : {}),
          ...(debugLogging
            ? {
                logger: (msg: string) => {
                  process.stderr.write(`${msg}\n`);
                },
              }
            : {}),
        });
        runtime.connectToDestination();
        mark("runtimeTotal");
        try {
          const interpreter = createKlattInterpreter({
            audioContext: ctx as unknown as AudioContext,
            runtime,
            semantics: config.semantics,
            bindingMap: runtime.getBindingMap(),
          });
          interpreter.scheduleTrack(track, request.leadTime);
          mark("scheduling");

          const buffer = await ctx.startRendering();
          mark("rendering");
          const channel = new Float32Array(buffer.length);
          buffer.copyFromChannel(channel, 0);
          let rms = 0;
          let peak = 0;
          const samples = new Array<number>(channel.length);
          for (let i = 0; i < channel.length; i += 1) {
            const value = channel[i];
            samples[i] = value;
            rms += value * value;
            const absValue = Math.abs(value);
            if (absValue > peak) peak = absValue;
          }
          rms = channel.length ? Math.sqrt(rms / channel.length) : 0;

          const payload: RenderPayload = {
            phrase: request.phrase,
            baseF0: request.baseF0,
            engine: request.engine,
            frontendId: request.frontendId,
            experimentId: request.experimentId,
            rate: request.rate,
            transitionMs: request.transitionMs,
            sampleRate: request.sampleRate,
            leadTime: request.leadTime,
            tailTime: request.tailTime,
            length,
            metrics: { rms, peak },
            trackSummary: summarizeTrack(track),
            diagnostics: diagnostics.getEntries(),
            samples,
          };
          if (request.includeTrack) {
            payload.track = track;
          }
          mark("payload");
          onTimings?.(request, timings);
          return payload;
        } finally {
          runtime.disconnect();
        }
      } finally {
        if (!resources) await assetLoader.dispose?.();
      }
    },
  };
}

export const nodeRuntimeBackend = createNodeRuntimeBackend();
