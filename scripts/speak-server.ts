/**
 * Line-oriented speech server for external hosts (NVDA, speech-dispatcher,
 * anything that can spawn a process).
 *
 * Protocol: one JSON object per line on stdin, one or more JSON objects per
 * line on stdout. Binary audio travels base64-encoded inside JSON so the
 * transport is plain text on every platform.
 *
 * Requests:
 *   {"id": 1, "op": "speak", "text": "Hello world.",
 *    "frontendId"?: "qlatt-english", "experimentId"?: "klatt80-baseline",
 *    "rate"?: 1.0, "pitchScale"?: 1.0, "baseF0"?: 110, "sampleRate"?: 22050,
 *    "leadTime"?: 0.02, "tailTime"?: 0.05,
 *    "indexes"?: [{"index": 5, "offset": 6}]}
 *   {"id": 2, "op": "hello"}      -> capabilities
 *   {"op": "quit"}
 *
 * Pitch: "pitchScale" is a ratio of the frontend's voice's own base pitch
 * (2 is an octave up, 0.5 an octave down), so one value means the same
 * interval on every voice of every frontend. "baseF0" is a base pitch in Hz
 * that replaces the voice's own; when both are given, the base is
 * baseF0 * pitchScale. With neither, the voice keeps its own pitch. The pitch
 * span follows the level (the selected frontend's speaker-profile
 * pitch_composition).
 *
 * Responses for a speak request, in order:
 *   {"id": 1, "event": "audio", "sampleRate": 22050, "format": "s16le",
 *    "channels": 1, "samples": N,
 *    "markers": [{"kind": "word", "word": "Hello", "sample": 1102}, ...],
 *    "pcm": "<base64 of N little-endian int16 samples>"}
 *   {"id": 1, "event": "done"}
 * or {"id": 1, "event": "error", "message": "..."}.
 *
 * Word markers are the first frame of each canonical Word occurrence,
 * offset by the render lead time, so a host can raise
 * word-boundary events as playback passes each sample position.
 * Requested indexes use raw UTF-16 offsets in text and return kind:index markers
 * at the first owned frame starting at/after the offset, or PCM end when none
 * remains. Equal-sample indexes retain request order alongside word markers.
 *
 * Run:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/speak-server.ts
 */

import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_FRONTEND_ID,
  listBundledFrontendIds,
} from "../src/declarative-frontend/rule-pack.ts";
import { createNodeRuntimeBackend } from "../src/rendering/backends/node-runtime.ts";
import type { RenderPayload, RenderRequest, WordOccurrence } from "../src/rendering/types.ts";
import { toInt16 } from "../src/rendering/write-wav.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export type SpeakRequest = {
  id?: number | string;
  op: "speak";
  text: string;
  frontendId?: string;
  experimentId?: string;
  rate?: number;
  pitchScale?: number;
  baseF0?: number;
  sampleRate?: number;
  /** Render padding in seconds; absent values preserve the server defaults. */
  leadTime?: number;
  tailTime?: number;
  /** Positions in the original request text, measured in UTF-16 code units. */
  indexes?: { index: number; offset: number }[];
};
type Request = SpeakRequest | { id?: number | string; op: "hello" } | { op: "quit" };

export type WordMarker = { kind: "word"; word: string; sample: number };
export type IndexMarker = { kind: "index"; index: number; sample: number };

const DEFAULT_EXPERIMENT_BY_FRONTEND: Readonly<Record<string, string>> = {
  "qlatt-english": "klatt80-baseline",
  "qlatt-beauty": "qlatt-beauty",
  "dectalk-english": "dectalk-english",
};

/** Sample offset of the first frame of every spoken word, in render-output samples. */
export function wordMarkers(
  occurrences: readonly WordOccurrence[],
  leadTime: number,
  sampleRate: number,
): WordMarker[] {
  return occurrences.map(({ word, time }) => ({
    kind: "word",
    word,
    sample: Math.round((leadTime + time) * sampleRate),
  }));
}

function write(message: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

/** The first owned frame at/after an offset, or the end of PCM for trailing indexes. */
export function indexMarkers(
  indexes: NonNullable<SpeakRequest["indexes"]>,
  spans: NonNullable<RenderPayload["sourceSpans"]>,
  leadTime: number,
  sampleRate: number,
  samples: number,
): IndexMarker[] {
  return indexes.map(({ index, offset }) => {
    const frame = spans.find((span) => span.start >= offset);
    return {
      kind: "index",
      index,
      sample: frame ? Math.round((leadTime + frame.time) * sampleRate) : samples,
    };
  });
}

/** The render a speak request asks for. */
export function speakRenderRequest(request: SpeakRequest): RenderRequest {
  const frontendId = request.frontendId ?? DEFAULT_FRONTEND_ID;
  const experimentId =
    request.experimentId ?? DEFAULT_EXPERIMENT_BY_FRONTEND[frontendId] ?? "klatt80-baseline";
  return {
    repoRoot,
    phrase: request.text,
    // Absent: the frontend's voice keeps its own base pitch.
    baseF0: request.baseF0,
    ...(request.pitchScale === undefined ? {} : { pitchScale: request.pitchScale }),
    frontendId,
    experimentId,
    engine: "runtime",
    rate: request.rate,
    sampleRate: request.sampleRate ?? 22050,
    leadTime: request.leadTime ?? 0.02,
    tailTime: request.tailTime ?? 0.05,
    includeTrack: true,
    noiseSeed: 20260214,
    persistWav: true,
    allowBrowserRender: false,
    renderHost: "node",
  };
}

async function speak(
  request: SpeakRequest,
  backend: ReturnType<typeof createNodeRuntimeBackend>,
): Promise<void> {
  const renderRequest = speakRenderRequest(request);
  const { sampleRate, leadTime } = renderRequest;
  const payload = await backend.render(renderRequest);
  const pcm = toInt16(payload.samples);
  write({
    id: request.id,
    event: "audio",
    sampleRate,
    format: "s16le",
    channels: 1,
    samples: pcm.length,
    markers: [
      ...wordMarkers(payload.wordOccurrences ?? [], leadTime, sampleRate),
      ...indexMarkers(
        request.indexes ?? [],
        payload.sourceSpans ?? [],
        leadTime,
        sampleRate,
        pcm.length,
      ),
    ].sort((left, right) => left.sample - right.sample),
    pcm: Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength).toString("base64"),
  });
  write({ id: request.id, event: "done" });
}

async function main(): Promise<void> {
  const backend = createNodeRuntimeBackend({
    keepWarm: true,
    ...(process.env.QLATT_RENDER_TIMINGS === "1"
      ? {
          onTimings: (request: RenderRequest, timings: Record<string, number>) => {
            process.stderr.write(
              `QLATT_TIMINGS ${JSON.stringify({ phrase: request.phrase, timings })}\n`,
            );
          },
        }
      : {}),
  });
  const lines = readline.createInterface({
    input: process.stdin,
    crlfDelay: Number.POSITIVE_INFINITY,
  });
  let chain: Promise<void> = Promise.resolve();
  try {
    for await (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      let request: Request;
      try {
        request = JSON.parse(trimmed) as Request;
      } catch (error) {
        write({ event: "error", message: `invalid JSON: ${(error as Error).message}` });
        continue;
      }
      if (request.op === "quit") break;
      if (request.op === "hello") {
        write({
          id: request.id,
          event: "hello",
          frontends: listBundledFrontendIds(),
          defaultFrontendId: DEFAULT_FRONTEND_ID,
          experiments: DEFAULT_EXPERIMENT_BY_FRONTEND,
          format: "s16le",
        });
        continue;
      }
      if (request.op === "speak") {
        const current = request;
        chain = chain.then(() =>
          speak(current, backend).catch((error: unknown) => {
            write({ id: current.id, event: "error", message: (error as Error).message });
          }),
        );
        continue;
      }
      write({ event: "error", message: `unknown op ${String((request as { op?: unknown }).op)}` });
    }
  } finally {
    await chain;
    await backend.dispose();
  }
}

const invokedDirectly =
  process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().then(
    () => process.exit(0),
    (error: unknown) => {
      process.stderr.write(`${(error as Error).stack ?? String(error)}\n`);
      process.exit(1);
    },
  );
}
