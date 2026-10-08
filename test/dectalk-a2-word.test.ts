/**
 * The OUT_A2 packet word carries two things. Where PH's frication rules
 * apply it is a code (ph_draw.c:2037-2394); elsewhere PH leaves the generic
 * A2 amplitude in it, a small number that ramps across a phone boundary.
 *
 * DECtalk's synthesizer front end uses the incoming word in one way only: it
 * compares it for equality with the codes (VTM/vtmiont.c:797, 803, 820, 830,
 * 843, 856, 926, 940, 1041, 1054, 1067, 1147), then overwrites it with
 * hlsyn's own A2 (vtmiont.c:1303) before the vocal tract model runs. The port
 * does the same: crates/dectalk-vtm/src/vtmio.rs:354 reads it, 358-509
 * compare it with the same eleven codes, 554 overwrites it.
 *
 * So a value that is not a code cannot change a sample. This test shows it on
 * DECtalk's own recorded packets: with every non-code value set to 0 the
 * render is still DECtalk's WAV, sample for sample; with the codes set to 0
 * instead, it is not.
 */

import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { listVtmFixtures, readVtmFixture } from "../scripts/oracle/dectalk-vtm-fixture";
import { FRAME_SAMPLES, SPDEF_PARS, VOICE_PARS } from "../src/dectalk-vtm-track";

/** Index of the word in a packet (PH/ph_defs.h OUT_A2; crates/dectalk-vtm/src/lib.rs:107). */
const OUT_A2 = 2;
/** Every value VTM/vtmiont.c:797-1147 compares the word with. */
const A2_CODES = new Set([1000, 1100, 1200, 1300, 2000, 2100, 3000, 3100, 3200, 3300, 4000]);

interface BackendExports {
  memory: WebAssembly.Memory;
  dectalk_vtm_alloc_i16(len: number): number;
  dectalk_vtm_dealloc_i16(ptr: number, len: number): void;
  dectalk_backend_new(sampleRate: number): number;
  dectalk_backend_free(ptr: number): void;
  dectalk_backend_start(ptr: number): void;
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
  dectalk_backend_frame_samples(ptr: number, out: number, len: number): number;
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

/** Render a fixture's packets at 11025 Hz with its A2 words passed through `a2`. */
function render(id: string, a2: (word: number) => number): { samples: number[]; changed: number } {
  const fixture = readVtmFixture(fixtureDir, id);
  const backend = wasm.dectalk_backend_new(11025);
  const spdefPtr = wasm.dectalk_vtm_alloc_i16(SPDEF_PARS);
  const packetPtr = wasm.dectalk_vtm_alloc_i16(VOICE_PARS);
  const samplesPtr = wasm.dectalk_vtm_alloc_i16(FRAME_SAMPLES);
  const i16 = (ptr: number, len: number) => new Int16Array(wasm.memory.buffer, ptr, len);
  const samples: number[] = [];
  let changed = 0;
  try {
    wasm.dectalk_backend_start(backend);
    for (const event of fixture.events) {
      if (event.kind === "speaker") {
        i16(spdefPtr, SPDEF_PARS).set(event.spdef);
        expect(
          wasm.dectalk_backend_speaker(
            backend,
            spdefPtr,
            SPDEF_PARS,
            event.lastVoice,
            event.nomOpenQuo,
            event.tiltm,
          ),
        ).toBe(0);
        continue;
      }
      const words = Array.from(event.words);
      const before = words[OUT_A2] as number;
      const after = a2(before);
      if (after !== before) changed += 1;
      words[OUT_A2] = after;
      i16(packetPtr, VOICE_PARS).set(words);
      expect(
        wasm.dectalk_backend_frame(backend, packetPtr, VOICE_PARS, event.langCurr, event.volAtt),
      ).toBe(FRAME_SAMPLES);
      expect(wasm.dectalk_backend_frame_samples(backend, samplesPtr, FRAME_SAMPLES)).toBe(
        FRAME_SAMPLES,
      );
      samples.push(...i16(samplesPtr, FRAME_SAMPLES));
    }
  } finally {
    wasm.dectalk_vtm_dealloc_i16(spdefPtr, SPDEF_PARS);
    wasm.dectalk_vtm_dealloc_i16(packetPtr, VOICE_PARS);
    wasm.dectalk_vtm_dealloc_i16(samplesPtr, FRAME_SAMPLES);
    wasm.dectalk_backend_free(backend);
  }
  return { samples, changed };
}

describe("the A2 packet word outside its codes", () => {
  const ids = listVtmFixtures(fixtureDir);

  // In the checked-in fixtures every A2 word is a code or 0 (none of their
  // phrases has the amplitude ramp), so the test puts amplitudes in: the
  // values DECtalk sends in "dog." and "Many men make money." (39 down to 8,
  // 50 down to 12) and values next to each code.
  const AMPLITUDES = [
    39, 38, 37, 25, 17, 8, 50, 49, 48, 36, 24, 12, 1, 999, 1001, 2999, 3999, 4001, -1,
  ];

  it("changes no sample of DECtalk's render, whatever non-code value it holds", () => {
    let replaced = 0;
    for (const id of ids) {
      const fixture = readVtmFixture(fixtureDir, id);
      let next = 0;
      const { samples, changed } = render(id, (word) => {
        if (A2_CODES.has(word)) return word;
        next += 1;
        return AMPLITUDES[next % AMPLITUDES.length] as number;
      });
      expect(samples.slice(0, fixture.samples.length), id).toEqual(Array.from(fixture.samples));
      replaced += changed;
    }
    console.log(
      `non-code A2 words given an amplitude: ${replaced} packets in ${ids.length} fixtures`,
    );
    expect(replaced).toBeGreaterThan(0);
  });

  it("changes the render when a code is set to 0 instead (the control)", () => {
    const differing: string[] = [];
    let replaced = 0;
    for (const id of ids) {
      const fixture = readVtmFixture(fixtureDir, id);
      const { samples, changed } = render(id, (word) => (A2_CODES.has(word) ? 0 : word));
      replaced += changed;
      const expected = Array.from(fixture.samples);
      const differs = samples
        .slice(0, expected.length)
        .reduce((count, sample, index) => count + (sample === expected[index] ? 0 : 1), 0);
      if (differs > 0) differing.push(`${id}: ${differs} samples (${changed} packets)`);
    }
    console.log(
      `codes set to 0: ${replaced} packets; renders that differ: ${differing.join(", ")}`,
    );
    expect(replaced).toBeGreaterThan(0);
    expect(differing.length).toBeGreaterThan(0);
  });
});
