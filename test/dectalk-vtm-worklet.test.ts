/**
 * The `dectalk-vtm` AudioWorklet processor driven block by block, as a host
 * drives it: parameter arrays in, 128-sample blocks out.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { load } from "js-yaml";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readVtmFixture } from "../scripts/oracle/dectalk-vtm-fixture";
import {
  F0_TRACK_KEY,
  FRAME_SAMPLES,
  NODE_PARAMS,
  PACKET_TRACK_KEYS,
  SPEAKER_WORDS,
  TRACK_PARAMS,
  type VtmEvent,
  vtmEventsToTrack,
} from "../src/dectalk-vtm-track";
import type { KlattFrame } from "../src/klatt-interpreter";

interface Message {
  type: string;
  level?: string;
  code?: string;
  message?: string;
  node?: string;
  data?: Record<string, unknown>;
}

interface Processor {
  port: { onmessage: ((event: { data: { type: string } }) => void) | null; close(): void };
  messages: Message[];
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    params: Record<string, Float32Array>,
  ): boolean;
}

interface ProcessorClass {
  new (options: unknown): Processor;
  parameterDescriptors: { name: string; defaultValue?: number; automationRate?: string }[];
}

const fixtureDir = path.join("crates", "dectalk-vtm", "tests", "fixtures");
const BLOCK = 128;
const NODE_PARAM_OF_TRACK_KEY = new Map(
  Object.entries(PACKET_TRACK_KEYS).map(([node, key]) => [key, node]),
);

let Constructor: ProcessorClass;
const live: Processor[] = [];

async function loadProcessor(rate: number): Promise<void> {
  vi.resetModules();
  class MockProcessor {
    messages: Message[] = [];
    port = {
      onmessage: null,
      postMessage: (message: Message) => this.messages.push(message),
      close: vi.fn(),
    };
  }
  vi.stubGlobal("AudioWorkletProcessor", MockProcessor);
  vi.stubGlobal("registerProcessor", (_name: string, ctor: ProcessorClass) => {
    Constructor = ctor;
  });
  vi.stubGlobal("sampleRate", rate);
  await import("../src/worklets/dectalk-vtm-processor.ts");
}

async function create(): Promise<Processor> {
  const processor = new Constructor({
    processorOptions: {
      wasmBytes: readFileSync("public/worklets/dectalk-vtm.wasm"),
      nodeId: "vtm",
    },
  });
  live.push(processor);
  await vi.waitFor(() =>
    expect(processor.messages).toContainEqual(expect.objectContaining({ type: "ready" })),
  );
  return processor;
}

/**
 * Plays a track the way a host does with step automation: a frame's values
 * hold from the first sample at or after its time. `startSample` is where the
 * track's time 0 falls. Returns `blocks` blocks of output.
 */
function play(
  processor: Processor,
  track: KlattFrame[],
  rate: number,
  blocks: number,
  startSample = 0,
): Float32Array {
  const descriptors = Constructor.parameterDescriptors;
  const current = new Map(descriptors.map((d) => [d.name, d.defaultValue ?? 0]));
  const starts = track.map((frame) => startSample + Math.ceil(frame.time * rate - 1e-9));
  let next = 0;
  const out = new Float32Array(blocks * BLOCK);
  for (let block = 0; block < blocks; block += 1) {
    const params: Record<string, Float32Array> = {};
    for (const { name } of descriptors) params[name] = new Float32Array(BLOCK);
    for (let i = 0; i < BLOCK; i += 1) {
      const sample = block * BLOCK + i;
      while (next < track.length && starts[next] <= sample) {
        for (const [key, value] of Object.entries(track[next].params)) {
          // What the experiment's graph and semantics do: bind each track key
          // to its node parameter and form OUT_T0 from F0.
          if (key === F0_TRACK_KEY) current.set("OUT_T0", Math.round(value * 10));
          else current.set(NODE_PARAM_OF_TRACK_KEY.get(key) ?? key, value);
        }
        next += 1;
      }
      for (const [name, value] of current) params[name][i] = value;
    }
    const channel = new Float32Array(BLOCK);
    expect(processor.process([], [[channel]], params)).toBe(true);
    out.set(channel, block * BLOCK);
  }
  return out;
}

const diagnostics = (processor: Processor) =>
  processor.messages.filter((message) => message.type === "diagnostic");
const problems = (processor: Processor) =>
  diagnostics(processor).filter((message) => message.level !== "info");

beforeEach(() => {
  live.length = 0;
});

afterEach(() => {
  for (const processor of live) processor.port.onmessage?.({ data: { type: "dispose" } });
  vi.unstubAllGlobals();
});

describe("dectalk-vtm processor parameters", () => {
  it("declares exactly the track's parameters, a-rate, and the registry's defaults", async () => {
    await loadProcessor(11025);
    const descriptors = Constructor.parameterDescriptors;
    expect(descriptors.map((d) => d.name)).toEqual(NODE_PARAMS);
    expect(descriptors.every((d) => d.automationRate === "a-rate")).toBe(true);

    const registry = load(readFileSync("public/experiments/dectalk-vtm/registry.yaml", "utf8")) as {
      primitives: Record<string, { params: Record<string, { default: number }> }>;
    };
    const registryParams = registry.primitives["dectalk-vtm"].params;
    expect(Object.keys(registryParams)).toEqual(NODE_PARAMS);
    for (const descriptor of descriptors) {
      expect(descriptor.defaultValue, descriptor.name).toBe(
        registryParams[descriptor.name].default,
      );
    }

    const graph = load(readFileSync("public/experiments/dectalk-vtm/graph.yaml", "utf8")) as {
      nodes: Record<string, { params: Record<string, { bind: string }> }>;
    };
    expect(
      Object.entries(graph.nodes.vtm.params).map(([param, spec]) => [param, spec.bind]),
    ).toEqual(NODE_PARAMS.map((name) => [name, PACKET_TRACK_KEYS[name] ?? name]));

    const semantics = load(
      readFileSync("public/experiments/dectalk-vtm/semantics.yaml", "utf8"),
    ) as {
      defaultScheduling: string;
      params: Record<string, { default: number }>;
      realize: Record<string, { expr: string; step: boolean }>;
    };
    expect(Object.keys(semantics.params)).toEqual(TRACK_PARAMS);
    expect(semantics.defaultScheduling).toBe("step");
    // The one word the track does not carry as such: F0 is in Hz.
    expect(semantics.realize).toEqual({
      OUT_T0: { expr: "round(F0 * 10.0)", deps: [F0_TRACK_KEY], step: true },
    });

    // The semantics' default speaker is Perfect Paul as DECtalk sends it.
    const paul = readVtmFixture(fixtureDir, "paul-cat").events[0];
    if (paul.kind !== "speaker") throw new Error("fixture");
    for (const [name, index] of SPEAKER_WORDS) {
      expect(semantics.params[name].default, name).toBe(paul.spdef[index]);
    }
    expect(semantics.params.last_voice.default).toBe(paul.lastVoice);
    expect(semantics.params.NOM_Open_Quo.default).toBe(paul.nomOpenQuo);
    expect(semantics.params.Tiltm.default).toBe(paul.tiltm);
    for (const key of [F0_TRACK_KEY, ...Object.values(PACKET_TRACK_KEYS)]) {
      expect(semantics.params[key].default, key).toBe(0);
    }
  });
});

describe("dectalk-vtm processor at 11025 Hz", () => {
  it("is silent until run goes high, then plays DECtalk's samples after its 2-sample delay", async () => {
    await loadProcessor(11025);
    const processor = await create();
    const fixture = readVtmFixture(fixtureDir, "paul-cat");
    const track = vtmEventsToTrack(fixture.events);
    // Start the track 300 samples into the stream, off any block boundary.
    const blocks = Math.ceil((300 + fixture.samples.length + 2) / BLOCK) + 2;
    const out = play(processor, track, 11025, blocks, 300);

    expect(problems(processor)).toEqual([]);
    expect(out.subarray(0, 302).every((value) => value === 0)).toBe(true);
    for (let i = 0; i < fixture.samples.length; i += 1) {
      if (out[302 + i] * 32768 !== fixture.samples[i]) {
        throw new Error(`sample ${i}: node ${out[302 + i] * 32768} DECtalk ${fixture.samples[i]}`);
      }
    }
    expect(out.subarray(302 + fixture.samples.length).every((value) => value === 0)).toBe(true);

    expect(diagnostics(processor).map((message) => message.code)).toEqual([
      "dectalk-vtm.run_started",
      "dectalk-vtm.speaker_loaded",
      "dectalk-vtm.run_ended",
    ]);
    expect(diagnostics(processor)[0].data).toMatchObject({
      sampleRate: 11025,
      delaySamples: 2,
      resampling: "none",
      citations: [],
    });
    expect(diagnostics(processor)[2].data).toMatchObject({ frames: 169 });
  });

  it("gives the same samples whatever block the track starts in", async () => {
    await loadProcessor(11025);
    const fixture = readVtmFixture(fixtureDir, "betty-she");
    const track = vtmEventsToTrack(fixture.events);
    const reference = play(await create(), track, 11025, 100, 0);
    for (const start of [1, 126, 127, 128, 129, 200]) {
      const shifted = play(await create(), track, 11025, 100, start);
      expect(shifted.subarray(start, start + 11000)).toEqual(reference.subarray(0, 11000));
    }
  });

  it("starts a second run from DECtalk's start-up state", async () => {
    await loadProcessor(11025);
    const processor = await create();
    const fixture = readVtmFixture(fixtureDir, "paul-moon");
    const track = vtmEventsToTrack(fixture.events);
    const blocks = Math.ceil((fixture.samples.length + 2) / BLOCK) + 1;
    const first = play(processor, track, 11025, blocks);
    const second = play(processor, track, 11025, blocks);
    expect(second).toEqual(first);
    expect(problems(processor)).toEqual([]);
  });

  it("reloads the speaker definition where speaker_epoch changes", async () => {
    await loadProcessor(11025);
    const processor = await create();
    const fixture = readVtmFixture(fixtureDir, "paul-harry-switch");
    const out = play(
      processor,
      vtmEventsToTrack(fixture.events),
      11025,
      Math.ceil((fixture.samples.length + 2) / BLOCK) + 1,
    );
    for (let i = 0; i < fixture.samples.length; i += 1) {
      if (out[2 + i] * 32768 !== fixture.samples[i]) throw new Error(`sample ${i} differs`);
    }
    const loads = diagnostics(processor).filter(
      (message) => message.code === "dectalk-vtm.speaker_loaded",
    );
    // The second S line of the fixture precedes its 155th packet.
    const secondSpeaker = fixture.events.findIndex(
      (event, index) => index > 0 && event.kind === "speaker",
    );
    expect(loads.map((message) => message.data)).toEqual([
      { frame: 0, epoch: 1, lastVoice: 0 },
      { frame: secondSpeaker - 1, epoch: 2, lastVoice: 2 },
    ]);
  });
});

describe("dectalk-vtm processor faults", () => {
  // The speaker definition and the first 60 packets of "cat". Packets 40 and
  // 41 are inside the vowel, where the stock WAV peaks near 10000.
  const speakerAndPackets = (): VtmEvent[] =>
    readVtmFixture(fixtureDir, "paul-cat").events.slice(0, 61);
  const BLOCKS = 40;
  const from = 2 + 40 * FRAME_SAMPLES;
  const to = 2 + 42 * FRAME_SAMPLES;
  const silent = (samples: Float32Array) => samples.every((value) => value === 0);

  it("silences a frame whose packet faults and reports it once, with a summary", async () => {
    await loadProcessor(11025);
    const events = speakerAndPackets();
    const clean = play(await create(), vtmEventsToTrack(events), 11025, BLOCKS);
    expect(silent(clean.subarray(from, to))).toBe(false);

    // F2 of 6000 Hz in packets 40 and 41 is beyond the cosine table of the
    // parallel second formant, which is set on every frame (vtm3.c:1033).
    const faulty = events.map((event, index) =>
      event.kind === "packet" && (index === 41 || index === 42)
        ? { ...event, words: event.words.map((word, i) => (i === 11 ? 6000 : word)) }
        : event,
    );
    const processor = await create();
    const out = play(processor, vtmEventsToTrack(faulty), 11025, BLOCKS);

    expect(silent(out.subarray(from, to))).toBe(true);
    // Before the faulted frames the audio is the clean run's, and the frames
    // after them sound again.
    expect(out.subarray(0, from)).toEqual(clean.subarray(0, from));
    expect(silent(out.subarray(to, to + 2 * FRAME_SAMPLES))).toBe(false);
    expect(out.every(Number.isFinite)).toBe(true);

    expect(problems(processor)).toEqual([
      {
        type: "diagnostic",
        level: "error",
        code: "dectalk-vtm.frame_fault.cosine_table_index",
        node: "vtm",
        message: "Frame fault: cosine_table index out of bounds; the frame is silent",
        data: { code: -3, detail: expect.any(Number), fallback: "silent frame", frame: 40 },
      },
      {
        type: "diagnostic",
        level: "warn",
        code: "dectalk-vtm.run_fault_summary",
        node: "vtm",
        message: "Faults repeated after their first report in this run",
        data: { repeats: { "frame_fault.cosine_table_index": 1 }, frames: 60 },
      },
    ]);
  });

  it("silences a frame with a value that is not a packet word", async () => {
    await loadProcessor(11025);
    const events = speakerAndPackets().map((event, index) =>
      event.kind === "packet" && index === 41
        ? { ...event, words: event.words.map((word, i) => (i === 9 ? 70000 : word)) }
        : event,
    );
    const processor = await create();
    const out = play(processor, vtmEventsToTrack(events), 11025, BLOCKS);
    expect(silent(out.subarray(from, from + FRAME_SAMPLES))).toBe(true);
    expect(silent(out.subarray(from + FRAME_SAMPLES, to))).toBe(false);
    expect(problems(processor)).toEqual([
      expect.objectContaining({
        level: "error",
        code: "dectalk-vtm.invalid_packet_word",
        data: { param: "OUT_T0", fallback: "silent frame", frame: 40 },
      }),
    ]);
  });

  it("rounds a non-integer word and says so", async () => {
    await loadProcessor(11025);
    const events = speakerAndPackets();
    const clean = play(await create(), vtmEventsToTrack(events), 11025, BLOCKS);
    const fractional = events.map((event) =>
      event.kind === "packet"
        ? { ...event, words: event.words.map((word, i) => (i === 1 ? word + 0.25 : word)) }
        : event,
    );
    const processor = await create();
    const out = play(processor, vtmEventsToTrack(fractional), 11025, BLOCKS);
    expect(out).toEqual(clean);
    expect(silent(out)).toBe(false);
    expect(problems(processor)).toEqual([
      expect.objectContaining({
        level: "warn",
        code: "dectalk-vtm.noninteger_word.OUT_F1",
        data: { param: "OUT_F1", value: 279.25, fallback: 279, frame: 0 },
      }),
      expect.objectContaining({ code: "dectalk-vtm.run_fault_summary" }),
    ]);
  });

  it("does not load an out-of-table speaker definition and silences its frames", async () => {
    await loadProcessor(11025);
    const events = speakerAndPackets().map((event) =>
      event.kind === "speaker"
        ? { ...event, spdef: event.spdef.map((word, i) => (i === 11 ? 88 : word)) }
        : event,
    );
    const processor = await create();
    const out = play(processor, vtmEventsToTrack(events), 11025, BLOCKS);
    expect(silent(out)).toBe(true);
    expect(problems(processor).map((message) => [message.code, message.data?.detail])).toEqual([
      ["dectalk-vtm.speaker_fault.amptable_index", 88],
      ["dectalk-vtm.frame_fault.no_speaker", 0],
      ["dectalk-vtm.run_fault_summary", undefined],
    ]);
  });
});

describe("dectalk-vtm processor at other rates", () => {
  it("delays by 72 samples at 48000 Hz and keeps the signal's level", async () => {
    await loadProcessor(48000);
    const processor = await create();
    const fixture = readVtmFixture(fixtureDir, "paul-cat");
    const length = Math.ceil((fixture.samples.length * 48000) / 11025);
    const out = play(
      processor,
      vtmEventsToTrack(fixture.events),
      48000,
      Math.ceil((length + 144) / BLOCK) + 1,
    );
    expect(problems(processor)).toEqual([]);
    expect(diagnostics(processor)[0].data).toMatchObject({
      sampleRate: 48000,
      delaySamples: 72,
      resampling: "kaiser-windowed-sinc",
    });
    const rms = (values: ArrayLike<number>, scale: number) => {
      let sum = 0;
      for (let i = 0; i < values.length; i += 1) sum += (values[i] / scale) ** 2;
      return Math.sqrt(sum / values.length);
    };
    const expected = rms(fixture.samples, 32768);
    const actual = rms(out.subarray(72, 72 + length), 1);
    expect(Math.abs(actual / expected - 1)).toBeLessThan(0.01);
  });

  it("is silent and says why at a rate below DECtalk's", async () => {
    await loadProcessor(8000);
    const processor = await create();
    const fixture = readVtmFixture(fixtureDir, "paul-cat");
    const out = play(processor, vtmEventsToTrack(fixture.events), 8000, 20);
    expect(out.every((value) => value === 0)).toBe(true);
    expect(problems(processor)).toEqual([
      expect.objectContaining({
        level: "error",
        code: "dectalk-vtm.unsupported_sample_rate",
        data: { sampleRate: 8000, fallback: "silence" },
      }),
    ]);
  });
});
