/**
 * The DECtalk 4.63 synthesizer port, compiled to wasm32, against DECtalk.
 *
 * Loads `target/wasm32-unknown-unknown/release/dectalk_vtm.wasm` (built by
 * build.ps1 / build.sh), feeds it the PH packets and speaker definitions of
 * each fixture in `crates/dectalk-vtm/tests/fixtures`, and requires
 *
 *   - the frame the vocal tract model read for every packet to equal the one
 *     DECtalk's read (`F` lines), which checks hlsyn and the vtmiont overrides;
 *   - every 11025 Hz sample to equal the stock say.exe WAV.
 *
 * `cargo test -p dectalk-vtm` makes the same comparison natively; this is the
 * wasm32 build of the same code, whose float code is generated separately.
 */

import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { listVtmFixtures, readVtmFixture } from "../scripts/oracle/dectalk-vtm-fixture";
import { FRAME_SAMPLES, SPDEF_PARS, VOICE_PARS } from "../src/dectalk-vtm-track";

interface BackendExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
  dectalk_vtm_alloc_i16(len: number): number;
  dectalk_vtm_dealloc_i16(ptr: number, len: number): void;
  dectalk_backend_new(sampleRate: number): number;
  dectalk_backend_free(ptr: number): void;
  dectalk_backend_delay(ptr: number): number;
  dectalk_backend_start(ptr: number): void;
  dectalk_backend_stop(ptr: number): void;
  dectalk_backend_samples_until_frame(ptr: number): number;
  dectalk_backend_speaker(
    ptr: number,
    words: number,
    len: number,
    lastVoice: number,
    nomOpenQuo: number,
    tiltm: number,
  ): number;
  dectalk_backend_frame(
    ptr: number,
    packet: number,
    len: number,
    langCurr: number,
    volAtt: number,
  ): number;
  dectalk_backend_silent_frame(ptr: number): number;
  dectalk_backend_fault_detail(ptr: number): number;
  dectalk_backend_frame_samples(ptr: number, out: number, len: number): number;
  dectalk_backend_frame_words(ptr: number, out: number, len: number): number;
  dectalk_backend_render(ptr: number, out: number, len: number): number;
}

const fixtureDir = path.join("crates", "dectalk-vtm", "tests", "fixtures");
const wasmPath = path.join("target", "wasm32-unknown-unknown", "release", "dectalk_vtm.wasm");

let wasm: BackendExports;

beforeAll(async () => {
  if (!fs.existsSync(wasmPath)) {
    throw new Error(`${wasmPath} is missing: run build.ps1 or build.sh first`);
  }
  const { instance } = await WebAssembly.instantiate(fs.readFileSync(wasmPath), {});
  wasm = instance.exports as unknown as BackendExports;
});

interface Replay {
  frames: number;
  exactFrames: number;
  firstFrameMismatch: string | null;
  samples: number;
  oracleSamples: number;
  exactSamples: number;
  firstSampleMismatch: string | null;
  maxAbsSampleDiff: number;
  faults: string[];
}

/** Runs one fixture through the wasm chain at 11025 Hz, one call per event. */
function replay(id: string): Replay {
  const fixture = readVtmFixture(fixtureDir, id);
  const backend = wasm.dectalk_backend_new(11025);
  const spdefPtr = wasm.dectalk_vtm_alloc_i16(SPDEF_PARS);
  const packetPtr = wasm.dectalk_vtm_alloc_i16(VOICE_PARS);
  const samplesPtr = wasm.dectalk_vtm_alloc_i16(FRAME_SAMPLES);
  const i16 = (ptr: number, len: number) => new Int16Array(wasm.memory.buffer, ptr, len);
  const result: Replay = {
    frames: 0,
    exactFrames: 0,
    firstFrameMismatch: null,
    samples: 0,
    oracleSamples: fixture.samples.length,
    exactSamples: 0,
    firstSampleMismatch: null,
    maxAbsSampleDiff: 0,
    faults: [],
  };
  try {
    wasm.dectalk_backend_start(backend);
    for (const event of fixture.events) {
      if (event.kind === "speaker") {
        i16(spdefPtr, SPDEF_PARS).set(event.spdef);
        const code = wasm.dectalk_backend_speaker(
          backend,
          spdefPtr,
          SPDEF_PARS,
          event.lastVoice,
          event.nomOpenQuo,
          event.tiltm,
        );
        if (code !== 0) result.faults.push(`speaker definition: code ${code}`);
        continue;
      }
      const frameIndex = result.frames;
      i16(packetPtr, VOICE_PARS).set(event.words);
      const code = wasm.dectalk_backend_frame(
        backend,
        packetPtr,
        VOICE_PARS,
        event.langCurr,
        event.volAtt,
      );
      if (code !== FRAME_SAMPLES) result.faults.push(`frame ${frameIndex}: code ${code}`);

      // Stage 1: hlsyn and the vtmiont overrides, against DECtalk's F record.
      expect(wasm.dectalk_backend_frame_words(backend, packetPtr, VOICE_PARS)).toBe(VOICE_PARS);
      const words = i16(packetPtr, VOICE_PARS);
      const expected = fixture.frames[frameIndex];
      const word = expected.findIndex((value, index) => words[index] !== value);
      if (word < 0) result.exactFrames += 1;
      else if (result.firstFrameMismatch === null) {
        result.firstFrameMismatch = `frame ${frameIndex} word ${word}: wasm ${words[word]} DECtalk ${expected[word]}`;
      }

      // Stage 2: the vocal tract model, against the WAV.
      expect(wasm.dectalk_backend_frame_samples(backend, samplesPtr, FRAME_SAMPLES)).toBe(
        FRAME_SAMPLES,
      );
      const samples = i16(samplesPtr, FRAME_SAMPLES);
      for (let i = 0; i < FRAME_SAMPLES; i += 1) {
        const position = frameIndex * FRAME_SAMPLES + i;
        if (position >= fixture.samples.length) continue;
        const diff = Math.abs(samples[i] - fixture.samples[position]);
        if (diff === 0) result.exactSamples += 1;
        else if (result.firstSampleMismatch === null) {
          result.firstSampleMismatch = `frame ${frameIndex} sample ${i} (${position}): wasm ${samples[i]} DECtalk ${fixture.samples[position]}; frame words ${word < 0 ? "equal DECtalk's, so the vocal tract model diverges" : "already differ, so hlsyn/vtmio diverges"}`;
        }
        result.maxAbsSampleDiff = Math.max(result.maxAbsSampleDiff, diff);
      }
      result.frames += 1;
      result.samples += FRAME_SAMPLES;
    }
  } finally {
    wasm.dectalk_vtm_dealloc_i16(spdefPtr, SPDEF_PARS);
    wasm.dectalk_vtm_dealloc_i16(packetPtr, VOICE_PARS);
    wasm.dectalk_vtm_dealloc_i16(samplesPtr, FRAME_SAMPLES);
    wasm.dectalk_backend_free(backend);
  }
  return result;
}

describe("dectalk-vtm on wasm32 against DECtalk 4.63", () => {
  const ids = listVtmFixtures(fixtureDir);

  it("has the checked-in fixtures", () => {
    expect(ids).toEqual([
      "betty-she",
      "paul-cat",
      "paul-harry-switch",
      "paul-jitter",
      "paul-judge",
      "paul-moon",
      "paul-volume-att",
      "wendy-hello",
    ]);
  });

  it.each(ids)("%s: frames and samples equal DECtalk's exactly", (id) => {
    const result = replay(id);
    console.log(`${id}: ${JSON.stringify(result)}`);
    expect(result.faults).toEqual([]);
    expect(result.frames).toBeGreaterThan(0);
    expect(result.firstFrameMismatch).toBeNull();
    expect(result.exactFrames).toBe(result.frames);
    expect(result.firstSampleMismatch).toBeNull();
    expect(result.samples).toBe(result.oracleSamples);
    expect(result.exactSamples).toBe(result.samples);
    expect(result.maxAbsSampleDiff).toBe(0);
  });

  it("reports a packet before a speaker definition and a table fault by code", () => {
    const fixture = readVtmFixture(fixtureDir, "paul-cat");
    const speaker = fixture.events.find((event) => event.kind === "speaker");
    const packet = fixture.events.find((event) => event.kind === "packet");
    if (speaker?.kind !== "speaker" || packet?.kind !== "packet") throw new Error("fixture");
    const backend = wasm.dectalk_backend_new(11025);
    const spdefPtr = wasm.dectalk_vtm_alloc_i16(SPDEF_PARS);
    const packetPtr = wasm.dectalk_vtm_alloc_i16(VOICE_PARS);
    const i16 = (ptr: number, len: number) => new Int16Array(wasm.memory.buffer, ptr, len);
    try {
      i16(packetPtr, VOICE_PARS).set(packet.words);
      // Outside a run.
      expect(wasm.dectalk_backend_frame(backend, packetPtr, VOICE_PARS, 0, 100)).toBe(-10);
      wasm.dectalk_backend_start(backend);
      // Before a speaker definition.
      expect(wasm.dectalk_backend_frame(backend, packetPtr, VOICE_PARS, 0, 100)).toBe(-9);
      // A wrong length is refused without taking the frame.
      expect(wasm.dectalk_backend_frame(backend, packetPtr, VOICE_PARS - 1, 0, 100)).toBe(-1);

      // amptable has 88 entries: a cascade gain of 88 dB is VtmError::AmplitudeIndex.
      const bad = speaker.spdef.slice();
      bad[11] = 88;
      i16(spdefPtr, SPDEF_PARS).set(bad);
      expect(wasm.dectalk_backend_speaker(backend, spdefPtr, SPDEF_PARS, 0, 0, 0)).toBe(-2);
      expect(wasm.dectalk_backend_fault_detail(backend)).toBe(88);

      i16(spdefPtr, SPDEF_PARS).set(speaker.spdef);
      expect(wasm.dectalk_backend_speaker(backend, spdefPtr, SPDEF_PARS, 0, 0, 0)).toBe(0);
      expect(wasm.dectalk_backend_frame(backend, packetPtr, VOICE_PARS, 0, 100)).toBe(
        FRAME_SAMPLES,
      );
    } finally {
      wasm.dectalk_vtm_dealloc_i16(spdefPtr, SPDEF_PARS);
      wasm.dectalk_vtm_dealloc_i16(packetPtr, VOICE_PARS);
      wasm.dectalk_backend_free(backend);
    }
  });

  it("refuses output rates it does not support", () => {
    expect(wasm.dectalk_backend_new(8000)).toBe(0);
    expect(wasm.dectalk_backend_new(44100.5)).toBe(0);
    const backend = wasm.dectalk_backend_new(48000);
    expect(backend).not.toBe(0);
    expect(wasm.dectalk_backend_delay(backend)).toBe(72);
    wasm.dectalk_backend_free(backend);
  });
});
