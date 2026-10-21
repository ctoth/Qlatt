/**
 * Renders a `dectalk-vtm` frame track through the experiment's graph on the
 * Node host: track frames -> interpreter -> AudioParams of the `dectalk-vtm`
 * node -> audio. This is the path a frontend's track takes; nothing here
 * calls the synthesizer directly.
 */

import path from "node:path";
import { AudioWorkletNode as NodeAudioWorkletNode, OfflineAudioContext } from "node-web-audio-api";
import { DECTALK_SAMPLE_RATE, FRAME_SAMPLES, RUN_PARAM } from "../../src/dectalk-vtm-track.ts";
import { createDiagnostics, type DiagnosticEntry } from "../../src/diagnostics.ts";
import { loadExperimentConfig } from "../../src/experiments/load-experiment-config.ts";
import { createKlattInterpreter, type KlattFrame } from "../../src/klatt-interpreter.ts";
import { createKlattRuntime } from "../../src/klatt-runtime.ts";
import type { ProvenanceCollector } from "../../src/provenance.ts";
import { createNodeRuntimeAssetLoader } from "../../src/runtime-assets/node-loader.ts";

export const DECTALK_VTM_EXPERIMENT = "dectalk-vtm";

/**
 * The node's delay in output samples, as `crates/dectalk-vtm/src/backend.rs`
 * defines it: `LATCH_GUARD + ceil(lookahead * rate / 11025)`, with a lookahead
 * of 0 at 11025 Hz and `HALF_WIDTH` (16) input samples otherwise. The render
 * checks this against the delay the node itself reports.
 */
export function dectalkVtmDelaySamples(sampleRate: number): number {
  const lookahead = sampleRate === DECTALK_SAMPLE_RATE ? 0 : 16;
  return 2 + Math.ceil((lookahead * sampleRate) / DECTALK_SAMPLE_RATE);
}

export interface DectalkVtmRender {
  /** The context's output, starting at context time 0. */
  samples: Float32Array;
  sampleRate: number;
  /** The output sample at which the track's time 0 falls (the run starts). */
  startSample: number;
  /** Output samples from the run's start to its first DECtalk sample. */
  delaySamples: number;
  /** Packets in the track. */
  frames: number;
  diagnostics: DiagnosticEntry[];
}

export interface DectalkVtmRenderOptions {
  repoRoot: string;
  track: KlattFrame[];
  sampleRate: number;
  /** Receives a decision record for each choice the node reports. */
  provenance?: ProvenanceCollector;
  /**
   * The frontend the track came from. The experiment is then loaded as the
   * page loads it, with the frontend/experiment vocabulary check
   * (`loadExperimentConfig(experimentId, frontendId)`).
   */
  frontendId?: string;
  /** Default: `dectalk-vtm`. */
  experimentId?: string;
  /** Context time of the track's time 0, in seconds. Default 0. */
  startTime?: number;
}

/**
 * Packets in a track: the time of the frame that ends the run (`run` 0 after
 * frames with `run` 1), in frame periods. A track built from recorded packets
 * has one frame per packet; a frontend's track has an event wherever a
 * parameter changes, so its frames cannot be counted.
 */
export function packetCount(track: readonly KlattFrame[]): number {
  let running = false;
  for (const frame of track) {
    const run = frame.params[RUN_PARAM];
    if (run === 1) running = true;
    else if (run === 0 && running) {
      const packets = (frame.time * DECTALK_SAMPLE_RATE) / FRAME_SAMPLES;
      if (Math.abs(packets - Math.round(packets)) > 1e-6) {
        throw new Error(`The run ends at ${frame.time} s, which is not a whole number of frames`);
      }
      return Math.round(packets);
    }
  }
  throw new Error("The track has no frame that ends the run (run: 0 after run: 1)");
}

export async function renderDectalkVtmTrack(
  options: DectalkVtmRenderOptions,
): Promise<DectalkVtmRender> {
  const { repoRoot, track, sampleRate, provenance } = options;
  const startTime = options.startTime ?? 0;
  // Only for the length of the render; where the run really starts is the
  // host's rounding of the start time, which the node reports (below).
  const latestStartSample = Math.ceil(startTime * sampleRate);
  const frames = packetCount(track);
  const delaySamples = dectalkVtmDelaySamples(sampleRate);
  // Every DECtalk sample, resampled, plus the node's delay and the same again
  // for the interpolation kernel's tail after the last frame.
  const length =
    latestStartSample +
    Math.ceil((frames * FRAME_SAMPLES * sampleRate) / DECTALK_SAMPLE_RATE) +
    2 * delaySamples;

  const config = structuredClone(
    await loadExperimentConfig(options.experimentId ?? DECTALK_VTM_EXPERIMENT, options.frontendId),
  );
  const assetLoader = await createNodeRuntimeAssetLoader(path.join(repoRoot, "public", "worklets"));
  const diagnostics = createDiagnostics({ maxEntries: 1000 });
  try {
    const ctx = new OfflineAudioContext(1, length, sampleRate);
    const runtime = await createKlattRuntime({
      diagnostics,
      audioContext: ctx as unknown as AudioContext,
      graph: config.graph,
      semantics: config.semantics,
      registry: config.registry,
      assetLoader,
      audioWorkletNodeCtor: NodeAudioWorkletNode as unknown as typeof AudioWorkletNode,
      ...(process.env.QLATT_RENDER_DEBUG === "1"
        ? {
            logger: (msg: string) => {
              process.stderr.write(`${msg}\n`);
            },
          }
        : {}),
    });
    runtime.connectToDestination();
    try {
      const interpreter = createKlattInterpreter({
        audioContext: ctx as unknown as AudioContext,
        runtime,
        semantics: config.semantics,
        bindingMap: runtime.getBindingMap(),
      });
      interpreter.scheduleTrack(track, startTime);
      const buffer = await ctx.startRendering();
      const samples = new Float32Array(buffer.length);
      buffer.copyFromChannel(samples, 0);
      // Worklet messages are delivered on a later turn of the event loop.
      await new Promise((resolve) => setTimeout(resolve, 0));

      const entries = diagnostics.getEntries();
      if (provenance) recordNodeDecisions(entries, provenance);
      // The node says at which context sample its run started.
      const started = entries.find((entry) => entry.code === "dectalk-vtm.run_started");
      const startSample = (started?.data as { startFrame?: unknown } | undefined)?.startFrame;
      if (typeof startSample !== "number") {
        throw new Error("The dectalk-vtm node did not report where its run started");
      }
      return { samples, sampleRate, startSample, delaySamples, frames, diagnostics: entries };
    } finally {
      runtime.disconnect();
    }
  } finally {
    await assetLoader.dispose?.();
  }
}

/**
 * Turns the node's reports of its own choices into decision records: which
 * sample-rate conversion a run used, each speaker definition it loaded, and
 * each fault it answered with silence.
 */
export function recordNodeDecisions(
  entries: readonly DiagnosticEntry[],
  provenance: ProvenanceCollector,
): void {
  const dectalk = "DECtalk 4.63 VTM/vtmiont.c:656-1351";
  let run: string | undefined;
  for (const entry of entries) {
    if (!entry.code?.startsWith("dectalk-vtm.")) continue;
    const data = (entry.data ?? {}) as Record<string, unknown>;
    const subject = `node:${String(data.node ?? "dectalk-vtm")}`;
    const code = entry.code.slice("dectalk-vtm.".length);
    if (code === "run_started") {
      const citations = Array.isArray(data.citations) ? data.citations.map(String) : [];
      run = provenance.add({
        stage: "runtime",
        type: "dectalk_vtm_run_started",
        subject,
        reason: `${entry.message}; delay ${String(data.delaySamples)} samples at ${String(data.sampleRate)} Hz`,
        citations: [dectalk, ...citations],
      }).id;
    } else if (code === "speaker_loaded") {
      provenance.add({
        stage: "runtime",
        type: "dectalk_vtm_speaker_loaded",
        subject,
        reason: `${entry.message} (speaker_epoch ${String(data.epoch)}, last_voice ${String(data.lastVoice)})`,
        citations: ["DECtalk 4.63 VTM/vtmiont.c:1616-1645"],
        parents: run ? [run] : [],
      });
    } else if (entry.level === "error" || entry.level === "warn") {
      provenance.add({
        stage: "runtime",
        type: "dectalk_vtm_fallback",
        subject,
        reason: `${entry.message} (${entry.code}${data.frame === undefined ? "" : `, frame ${String(data.frame)}`})`,
        citations: ["crates/dectalk-vtm/src/backend.rs (Faults)"],
        parents: run ? [run] : [],
      });
    }
  }
}

/**
 * The run's audio as 16-bit samples, for a render at 11025 Hz, where the node
 * does not resample: undoes the node's delay and its 1/32768 scaling, which
 * are both exact. Throws if a sample is not a 16-bit value, since then the
 * render was not DECtalk's samples.
 */
export function renderToInt16(render: DectalkVtmRender): Int16Array {
  if (render.sampleRate !== DECTALK_SAMPLE_RATE) {
    throw new Error("renderToInt16 needs an 11025 Hz render");
  }
  const count = render.frames * FRAME_SAMPLES;
  const out = new Int16Array(count);
  for (let i = 0; i < count; i += 1) {
    const value = render.samples[render.startSample + render.delaySamples + i] * 32768;
    if (!Number.isInteger(value) || value < -32768 || value > 32767) {
      throw new Error(`Sample ${i} (${value}) is not a 16-bit value`);
    }
    out[i] = value;
  }
  return out;
}
