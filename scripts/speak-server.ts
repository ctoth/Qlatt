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
 *    "rate"?: 1.0, "baseF0"?: 110, "sampleRate"?: 22050}
 *   {"id": 2, "op": "hello"}      -> capabilities
 *   {"op": "quit"}
 *
 * Responses for a speak request, in order:
 *   {"id": 1, "event": "audio", "sampleRate": 22050, "format": "s16le",
 *    "channels": 1, "samples": N,
 *    "markers": [{"kind": "word", "word": "Hello", "sample": 1102}, ...],
 *    "pcm": "<base64 of N little-endian int16 samples>"}
 *   {"id": 1, "event": "done"}
 * or {"id": 1, "event": "error", "message": "..."}.
 *
 * Word markers are the first frame of each word in the frontend track
 * (KlattFrame.word), offset by the render lead time, so a host can raise
 * word-boundary events as playback passes each sample position.
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
import type { RenderRequest } from "../src/rendering/types.ts";
import { toInt16 } from "../src/rendering/write-wav.ts";
import type { KlattFrame } from "../src/tts-frontend-types.ts";
import { nodeRuntimeBackend } from "./rendering/backends/node-runtime.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

type SpeakRequest = {
  id?: number | string;
  op: "speak";
  text: string;
  frontendId?: string;
  experimentId?: string;
  rate?: number;
  baseF0?: number;
  sampleRate?: number;
};
type Request = SpeakRequest | { id?: number | string; op: "hello" } | { op: "quit" };

export type WordMarker = { kind: "word"; word: string; sample: number };

const DEFAULT_EXPERIMENT_BY_FRONTEND: Readonly<Record<string, string>> = {
  "qlatt-english": "klatt80-baseline",
  "qlatt-beauty": "qlatt-beauty",
  "dectalk-english": "dectalk-english",
};

/** Sample offset of the first frame of every spoken word, in render-output samples. */
export function wordMarkers(
  track: readonly KlattFrame[],
  leadTime: number,
  sampleRate: number,
): WordMarker[] {
  const markers: WordMarker[] = [];
  let previous: string | undefined;
  for (const frame of track) {
    const word = frame.word;
    // Punctuation reaches the track as its own word token; hosts want
    // boundaries of spoken words only.
    if (typeof word === "string" && /[\p{L}\p{N}]/u.test(word) && word !== previous) {
      markers.push({
        kind: "word",
        word,
        sample: Math.round((leadTime + frame.time) * sampleRate),
      });
    }
    previous = word;
  }
  return markers;
}

function write(message: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function speak(request: SpeakRequest): Promise<void> {
  const frontendId = request.frontendId ?? DEFAULT_FRONTEND_ID;
  const experimentId =
    request.experimentId ?? DEFAULT_EXPERIMENT_BY_FRONTEND[frontendId] ?? "klatt80-baseline";
  const sampleRate = request.sampleRate ?? 22050;
  const leadTime = 0.02;
  const renderRequest: RenderRequest = {
    repoRoot,
    phrase: request.text,
    baseF0: request.baseF0,
    frontendId,
    experimentId,
    engine: "runtime",
    rate: request.rate ?? 1,
    transitionMs: 30,
    sampleRate,
    leadTime,
    tailTime: 0.05,
    includeTrack: true,
    noiseSeed: 20260214,
    persistWav: true,
    allowBrowserRender: false,
    renderHost: "node",
  };
  const payload = await nodeRuntimeBackend.render(renderRequest);
  const pcm = toInt16(payload.samples);
  const track = Array.isArray(payload.track) ? (payload.track as KlattFrame[]) : [];
  write({
    id: request.id,
    event: "audio",
    sampleRate,
    format: "s16le",
    channels: 1,
    samples: pcm.length,
    markers: wordMarkers(track, leadTime, sampleRate),
    pcm: Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength).toString("base64"),
  });
  write({ id: request.id, event: "done" });
}

async function main(): Promise<void> {
  const lines = readline.createInterface({
    input: process.stdin,
    crlfDelay: Number.POSITIVE_INFINITY,
  });
  let chain: Promise<void> = Promise.resolve();
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
        speak(current).catch((error: unknown) => {
          write({ id: current.id, event: "error", message: (error as Error).message });
        }),
      );
      continue;
    }
    write({ event: "error", message: `unknown op ${String((request as { op?: unknown }).op)}` });
  }
  await chain;
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
