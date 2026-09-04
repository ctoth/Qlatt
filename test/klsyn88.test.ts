/**
 * klsyn88 Integration Tests
 * Tests the new primitives added for klsyn88 support
 */

import * as fs from "fs";
import * as path from "path";
import { beforeAll, describe, expect, it } from "vitest";

type WasmNumericFunction = (...args: number[]) => number;
type Klsyn88FunctionName =
  | "fujisaki_resonator_free"
  | "fujisaki_resonator_new"
  | "fujisaki_resonator_process"
  | "fujisaki_resonator_set_params"
  | "impulsive_source_free"
  | "impulsive_source_new"
  | "impulsive_source_process"
  | "oversampled_glottal_source_free"
  | "oversampled_glottal_source_new"
  | "oversampled_glottal_source_process"
  | "pitch_sync_resonator_free"
  | "pitch_sync_resonator_new"
  | "pitch_sync_resonator_process"
  | "square_source_free"
  | "square_source_new"
  | "square_source_process"
  | "tilt_filter_free"
  | "tilt_filter_new"
  | "tilt_filter_process"
  | "tilt_filter_set_tilt"
  | "triangular_source_free"
  | "triangular_source_new"
  | "triangular_source_process";
type Klsyn88Exports = WebAssembly.Exports &
  Record<Klsyn88FunctionName, WasmNumericFunction> & {
    memory: WebAssembly.Memory;
    alloc_f32: (length: number) => number;
    dealloc_f32: (ptr: number, length: number) => number;
  };
type Klsyn88Instance = WebAssembly.Instance & { exports: Klsyn88Exports };

// Helper to load WASM module in Node
async function loadWasmModule(crateName: string): Promise<Klsyn88Instance> {
  const wasmPath = path.join(
    __dirname,
    "..",
    "target",
    "wasm32-unknown-unknown",
    "release",
    `${crateName.replace(/-/g, "_")}.wasm`,
  );

  if (!fs.existsSync(wasmPath)) {
    throw new Error(`WASM file not found: ${wasmPath}`);
  }

  const wasmBuffer = fs.readFileSync(wasmPath);
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const instance = await WebAssembly.instantiate(wasmModule, {});
  return instance as Klsyn88Instance;
}

function allocF32(exports: Klsyn88Exports, length: number) {
  const ptr = exports.alloc_f32(length);
  if (!ptr) throw new Error("alloc_f32 returned null");
  const view = new Float32Array((exports.memory as WebAssembly.Memory).buffer, ptr, length);
  return { ptr, view };
}

function deallocF32(exports: Klsyn88Exports, ptr: number, length: number) {
  exports.dealloc_f32(ptr, length);
}

describe("klsyn88 Primitives", () => {
  describe("oversampled-glottal-source", () => {
    let wasm: Klsyn88Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule("oversampled-glottal-source");
    });

    it("should create and free source without crash", () => {
      const exports = wasm.exports;
      const ptr = exports.oversampled_glottal_source_new(11025);
      expect(ptr).toBeGreaterThan(0);
      exports.oversampled_glottal_source_free(ptr);
    });

    it("should output klsyn88-scale amplitudes", () => {
      // Measure raw glottal source output to understand signal levels
      const exports = wasm.exports;
      const state = exports.oversampled_glottal_source_new(11025);

      const blockSize = 512;
      const f0 = allocF32(exports, 1);
      const av = allocF32(exports, 1);
      const aturb = allocF32(exports, 1);
      const tilt = allocF32(exports, 1);
      const oq = allocF32(exports, 1);
      const skew = allocF32(exports, 1);
      const asym = allocF32(exports, 1);
      const source = allocF32(exports, 1);
      const seed = allocF32(exports, 1);
      const flutter = allocF32(exports, 1);
      const diplophonia = allocF32(exports, 1);
      const voice = allocF32(exports, blockSize);
      const noise = allocF32(exports, blockSize);

      f0.view[0] = 100;
      av.view[0] = 60;
      aturb.view[0] = 0;
      tilt.view[0] = 0;
      oq.view[0] = 50;
      skew.view[0] = 0;
      asym.view[0] = 50;
      source.view[0] = 2;
      seed.view[0] = 1;
      flutter.view[0] = 0;
      diplophonia.view[0] = 0;

      exports.oversampled_glottal_source_process(
        state,
        f0.ptr,
        1,
        av.ptr,
        1,
        aturb.ptr,
        1,
        tilt.ptr,
        1,
        oq.ptr,
        1,
        skew.ptr,
        1,
        asym.ptr,
        1,
        source.ptr,
        1,
        seed.ptr,
        1,
        flutter.ptr,
        1,
        diplophonia.ptr,
        1,
        voice.ptr,
        noise.ptr,
        blockSize,
      );

      let voicePeak = 0;
      let noisePeak = 0;
      for (let i = 0; i < blockSize; i++) {
        voicePeak = Math.max(voicePeak, Math.abs(voice.view[i]));
        noisePeak = Math.max(noisePeak, Math.abs(noise.view[i]));
      }

      // klsyn88 amptable: dbToLinearKlsyn(dB) = amptable[dB] * 0.001
      const klsynAmpTable = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22, 25, 28,
        32, 35, 40, 45, 51, 57, 64, 71, 80, 90, 101, 114, 128, 142, 159, 179, 202, 227, 256, 284,
        318, 359, 405, 455, 512, 568, 638, 719, 811, 911, 1024, 1137, 1276, 1438, 1622, 1823, 2048,
        2273, 2552, 2875, 3244, 3645, 4096, 4547, 5104, 5751, 6488, 7291, 8192, 9093, 10207, 11502,
        12976, 14582, 16384, 18350, 20644, 23429, 26214, 29491, 32767,
      ];

      // Simulate signal chain gains
      const AV = 60;
      const GO = 57;
      const avDb = Math.max(AV - 7, 0); // = 53
      const gain0Db = GO - 3 <= 0 ? 57 : GO - 3; // = 54

      const voiceGain = klsynAmpTable[avDb] * 0.001; // = 0.638
      const gain0Linear = klsynAmpTable[gain0Db] * 0.001; // = 0.719
      const gain0LinearWithFix = gain0Linear / 32768; // = 2.19e-5

      console.log("=== klsyn88 Signal Level Analysis ===");
      console.log(`Raw glottal voice peak: ${voicePeak.toFixed(1)}`);
      console.log(`Raw glottal noise peak: ${noisePeak.toFixed(1)}`);
      console.log(`voiceGain (AV=${AV}): ${voiceGain.toFixed(4)}`);
      console.log(`gain0Linear (GO=${GO}): ${gain0Linear.toFixed(4)}`);
      console.log(`gain0Linear with /32768 fix: ${gain0LinearWithFix.toExponential(3)}`);
      console.log("--- Signal chain estimates (ignoring resonator gain) ---");
      console.log(`After voiceGain: ${(voicePeak * voiceGain).toFixed(1)}`);
      console.log(`After gain0 (no fix): ${(voicePeak * voiceGain * gain0Linear).toFixed(1)}`);
      console.log(
        `After gain0 (with fix): ${(voicePeak * voiceGain * gain0LinearWithFix).toFixed(4)}`,
      );
      console.log("--- For WebAudio [-1,1] output ---");
      console.log(
        `Resonator gain needed to clip (no fix): ${(1 / (voicePeak * voiceGain * gain0Linear)).toFixed(4)}`,
      );
      console.log(
        `Resonator gain needed to clip (with fix): ${(1 / (voicePeak * voiceGain * gain0LinearWithFix)).toFixed(1)}`,
      );

      deallocF32(exports, f0.ptr, 1);
      deallocF32(exports, av.ptr, 1);
      deallocF32(exports, aturb.ptr, 1);
      deallocF32(exports, tilt.ptr, 1);
      deallocF32(exports, oq.ptr, 1);
      deallocF32(exports, skew.ptr, 1);
      deallocF32(exports, asym.ptr, 1);
      deallocF32(exports, source.ptr, 1);
      deallocF32(exports, seed.ptr, 1);
      deallocF32(exports, flutter.ptr, 1);
      deallocF32(exports, diplophonia.ptr, 1);
      deallocF32(exports, voice.ptr, blockSize);
      deallocF32(exports, noise.ptr, blockSize);
      exports.oversampled_glottal_source_free(state);

      expect(voicePeak).toBeGreaterThan(100);
      // Round-2 regression guard: `self.a`/`self.b` (pitch_sync_reset,
      // source==2 branch) drive a double integrator, so an unrescaled or
      // singly-rescaled TICK_RESCALE factor inflates `vwave` by
      // TICK_RESCALE^2 (round-1's delivered code peaked here at ~2,956,782
      // -- a ~309x blowup off this exact f0=100/av=60/oq=50/sampleRate=11025
      // configuration -- and a since-reverted single-rescale diagnostic
      // still overshot to ~1057x native scale with a mistimed pulse). The
      // corrected double-rescale (`self.b = b0 / TICK_RESCALE^2`) should
      // land this near klsyn88's native ~9-10k peak scale for these
      // parameters; 50000 gives ~5x headroom above the expected ~9200 while
      // still catching a >5x regression toward either blowup.
      expect(voicePeak).toBeLessThan(50000);
    });

    it("should generate voice and noise outputs", () => {
      const exports = wasm.exports;
      const state = exports.oversampled_glottal_source_new(11025);

      const blockSize = 128;
      const f0 = allocF32(exports, 1);
      const av = allocF32(exports, 1);
      const aturb = allocF32(exports, 1);
      const tilt = allocF32(exports, 1);
      const oq = allocF32(exports, 1);
      const skew = allocF32(exports, 1);
      const asym = allocF32(exports, 1);
      const source = allocF32(exports, 1);
      const seed = allocF32(exports, 1);
      const flutter = allocF32(exports, 1);
      const diplophonia = allocF32(exports, 1);
      const voice = allocF32(exports, blockSize);
      const noise = allocF32(exports, blockSize);

      f0.view[0] = 100;
      av.view[0] = 60;
      aturb.view[0] = 20;
      tilt.view[0] = 0;
      oq.view[0] = 50;
      skew.view[0] = 0;
      asym.view[0] = 50;
      source.view[0] = 2;
      seed.view[0] = 1;
      flutter.view[0] = 0;
      diplophonia.view[0] = 0;

      exports.oversampled_glottal_source_process(
        state,
        f0.ptr,
        1,
        av.ptr,
        1,
        aturb.ptr,
        1,
        tilt.ptr,
        1,
        oq.ptr,
        1,
        skew.ptr,
        1,
        asym.ptr,
        1,
        source.ptr,
        1,
        seed.ptr,
        1,
        flutter.ptr,
        1,
        diplophonia.ptr,
        1,
        voice.ptr,
        noise.ptr,
        blockSize,
      );

      let voiceNonZero = false;
      let noiseNonZero = false;
      for (let i = 0; i < blockSize; i++) {
        if (Math.abs(voice.view[i]) > 0.0001) voiceNonZero = true;
        if (Math.abs(noise.view[i]) > 0.0001) noiseNonZero = true;
      }

      deallocF32(exports, f0.ptr, 1);
      deallocF32(exports, av.ptr, 1);
      deallocF32(exports, aturb.ptr, 1);
      deallocF32(exports, tilt.ptr, 1);
      deallocF32(exports, oq.ptr, 1);
      deallocF32(exports, skew.ptr, 1);
      deallocF32(exports, asym.ptr, 1);
      deallocF32(exports, source.ptr, 1);
      deallocF32(exports, seed.ptr, 1);
      deallocF32(exports, flutter.ptr, 1);
      deallocF32(exports, diplophonia.ptr, 1);
      deallocF32(exports, voice.ptr, blockSize);
      deallocF32(exports, noise.ptr, blockSize);
      exports.oversampled_glottal_source_free(state);

      expect(voiceNonZero).toBe(true);
      expect(noiseNonZero).toBe(true);
    });

    it("should resume voice after an initial unvoiced span", () => {
      const exports = wasm.exports;
      const state = exports.oversampled_glottal_source_new(22050);

      const blockSize = 128;
      const f0 = allocF32(exports, 1);
      const av = allocF32(exports, 1);
      const aturb = allocF32(exports, 1);
      const tilt = allocF32(exports, 1);
      const oq = allocF32(exports, 1);
      const skew = allocF32(exports, 1);
      const asym = allocF32(exports, 1);
      const source = allocF32(exports, 1);
      const seed = allocF32(exports, 1);
      const flutter = allocF32(exports, 1);
      const diplophonia = allocF32(exports, 1);
      const voice = allocF32(exports, blockSize);
      const noise = allocF32(exports, blockSize);

      av.view[0] = 0;
      aturb.view[0] = 0;
      tilt.view[0] = 0;
      oq.view[0] = 50;
      skew.view[0] = 0;
      asym.view[0] = 50;
      source.view[0] = 2;
      seed.view[0] = 1;
      flutter.view[0] = 0;
      diplophonia.view[0] = 0;

      for (let block = 0; block < 20; block += 1) {
        f0.view[0] = 0;
        exports.oversampled_glottal_source_process(
          state,
          f0.ptr,
          1,
          av.ptr,
          1,
          aturb.ptr,
          1,
          tilt.ptr,
          1,
          oq.ptr,
          1,
          skew.ptr,
          1,
          asym.ptr,
          1,
          source.ptr,
          1,
          seed.ptr,
          1,
          flutter.ptr,
          1,
          diplophonia.ptr,
          1,
          voice.ptr,
          noise.ptr,
          blockSize,
        );
      }

      av.view[0] = 61;
      f0.view[0] = 106;
      let voicedPeak = 0;
      for (let block = 0; block < 40; block += 1) {
        exports.oversampled_glottal_source_process(
          state,
          f0.ptr,
          1,
          av.ptr,
          1,
          aturb.ptr,
          1,
          tilt.ptr,
          1,
          oq.ptr,
          1,
          skew.ptr,
          1,
          asym.ptr,
          1,
          source.ptr,
          1,
          seed.ptr,
          1,
          flutter.ptr,
          1,
          diplophonia.ptr,
          1,
          voice.ptr,
          noise.ptr,
          blockSize,
        );
        for (let i = 0; i < blockSize; i++) {
          voicedPeak = Math.max(voicedPeak, Math.abs(voice.view[i]));
        }
      }

      deallocF32(exports, f0.ptr, 1);
      deallocF32(exports, av.ptr, 1);
      deallocF32(exports, aturb.ptr, 1);
      deallocF32(exports, tilt.ptr, 1);
      deallocF32(exports, oq.ptr, 1);
      deallocF32(exports, skew.ptr, 1);
      deallocF32(exports, asym.ptr, 1);
      deallocF32(exports, source.ptr, 1);
      deallocF32(exports, seed.ptr, 1);
      deallocF32(exports, flutter.ptr, 1);
      deallocF32(exports, diplophonia.ptr, 1);
      deallocF32(exports, voice.ptr, blockSize);
      deallocF32(exports, noise.ptr, blockSize);
      exports.oversampled_glottal_source_free(state);

      expect(voicedPeak).toBeGreaterThan(100);
    });

    it("should generate voice with DECtalk KLGLOTT runtime parameters", () => {
      const exports = wasm.exports;
      const state = exports.oversampled_glottal_source_new(22050);

      const blockSize = 128;
      const f0 = allocF32(exports, 1);
      const av = allocF32(exports, 1);
      const aturb = allocF32(exports, 1);
      const tilt = allocF32(exports, 1);
      const oq = allocF32(exports, 1);
      const skew = allocF32(exports, 1);
      const asym = allocF32(exports, 1);
      const source = allocF32(exports, 1);
      const seed = allocF32(exports, 1);
      const flutter = allocF32(exports, 1);
      const diplophonia = allocF32(exports, 1);
      const voice = allocF32(exports, blockSize);
      const noise = allocF32(exports, blockSize);

      f0.view[0] = 108.24613952636719;
      av.view[0] = 65;
      aturb.view[0] = 0;
      tilt.view[0] = 3;
      oq.view[0] = 50;
      skew.view[0] = 0;
      asym.view[0] = 50;
      source.view[0] = 2;
      seed.view[0] = 305419889;
      flutter.view[0] = 0;
      diplophonia.view[0] = 0;

      exports.oversampled_glottal_source_process(
        state,
        f0.ptr,
        1,
        av.ptr,
        1,
        aturb.ptr,
        1,
        tilt.ptr,
        1,
        oq.ptr,
        1,
        skew.ptr,
        1,
        asym.ptr,
        1,
        source.ptr,
        1,
        seed.ptr,
        1,
        flutter.ptr,
        1,
        diplophonia.ptr,
        1,
        voice.ptr,
        noise.ptr,
        blockSize,
      );

      let voicePeak = 0;
      for (let i = 0; i < blockSize; i++) {
        voicePeak = Math.max(voicePeak, Math.abs(voice.view[i]));
      }

      deallocF32(exports, f0.ptr, 1);
      deallocF32(exports, av.ptr, 1);
      deallocF32(exports, aturb.ptr, 1);
      deallocF32(exports, tilt.ptr, 1);
      deallocF32(exports, oq.ptr, 1);
      deallocF32(exports, skew.ptr, 1);
      deallocF32(exports, asym.ptr, 1);
      deallocF32(exports, source.ptr, 1);
      deallocF32(exports, seed.ptr, 1);
      deallocF32(exports, flutter.ptr, 1);
      deallocF32(exports, diplophonia.ptr, 1);
      deallocF32(exports, voice.ptr, blockSize);
      deallocF32(exports, noise.ptr, blockSize);
      exports.oversampled_glottal_source_free(state);

      expect(voicePeak).toBeGreaterThan(100);
    });

    it("should keep aggregate voice RMS consistent across device sample rates", () => {
      // Regression test for the fixed-virtual-rate/decimation fix: before the
      // fix, `nopen` (glottal open-phase duty cycle) was clamped to a raw
      // 4x-tick count (263/40) calibrated for klsyn88's implicit ~10kHz
      // reference rate and never rescaled, so the open-phase duty cycle
      // collapsed at real browser sample rates (44100/48000Hz) relative to
      // the CLI-only-tested 22050Hz path. See
      // investigations/dectalk-klglott-worklet-voice.md for the full
      // reproduction. This runs the DECtalk KLGLOTT88 runtime parameters
      // (same values as the "should generate voice with DECtalk KLGLOTT
      // runtime parameters" test above) across many render quanta, at each
      // of the sample rates a real WebAudio context can use, and checks that
      // aggregate voice RMS does not collapse at the higher rates relative
      // to 22050Hz.
      const exports = wasm.exports;
      const blockSize = 128;
      const numBlocks = 200; // ~1.16s @ 22050Hz, ~0.58s @ 44100Hz, ~0.53s @ 48000Hz

      function aggregateVoiceRms(sampleRate: number): number {
        const state = exports.oversampled_glottal_source_new(sampleRate);

        const f0 = allocF32(exports, 1);
        const av = allocF32(exports, 1);
        const aturb = allocF32(exports, 1);
        const tilt = allocF32(exports, 1);
        const oq = allocF32(exports, 1);
        const skew = allocF32(exports, 1);
        const asym = allocF32(exports, 1);
        const source = allocF32(exports, 1);
        const seed = allocF32(exports, 1);
        const flutter = allocF32(exports, 1);
        const diplophonia = allocF32(exports, 1);
        const voice = allocF32(exports, blockSize);
        const noise = allocF32(exports, blockSize);

        f0.view[0] = 108.24613952636719;
        av.view[0] = 65;
        aturb.view[0] = 0;
        tilt.view[0] = 3;
        oq.view[0] = 50;
        skew.view[0] = 0;
        asym.view[0] = 50;
        source.view[0] = 2;
        seed.view[0] = 305419889;
        flutter.view[0] = 0;
        diplophonia.view[0] = 0;

        let sumSquares = 0;
        let count = 0;
        for (let block = 0; block < numBlocks; block += 1) {
          exports.oversampled_glottal_source_process(
            state,
            f0.ptr,
            1,
            av.ptr,
            1,
            aturb.ptr,
            1,
            tilt.ptr,
            1,
            oq.ptr,
            1,
            skew.ptr,
            1,
            asym.ptr,
            1,
            source.ptr,
            1,
            seed.ptr,
            1,
            flutter.ptr,
            1,
            diplophonia.ptr,
            1,
            voice.ptr,
            noise.ptr,
            blockSize,
          );
          for (let i = 0; i < blockSize; i++) {
            sumSquares += voice.view[i] * voice.view[i];
            count += 1;
          }
        }

        deallocF32(exports, f0.ptr, 1);
        deallocF32(exports, av.ptr, 1);
        deallocF32(exports, aturb.ptr, 1);
        deallocF32(exports, tilt.ptr, 1);
        deallocF32(exports, oq.ptr, 1);
        deallocF32(exports, skew.ptr, 1);
        deallocF32(exports, asym.ptr, 1);
        deallocF32(exports, source.ptr, 1);
        deallocF32(exports, seed.ptr, 1);
        deallocF32(exports, flutter.ptr, 1);
        deallocF32(exports, diplophonia.ptr, 1);
        deallocF32(exports, voice.ptr, blockSize);
        deallocF32(exports, noise.ptr, blockSize);
        exports.oversampled_glottal_source_free(state);

        return Math.sqrt(sumSquares / count);
      }

      const rms22050 = aggregateVoiceRms(22050);
      const rms44100 = aggregateVoiceRms(44100);
      const rms48000 = aggregateVoiceRms(48000);

      console.log("=== Aggregate voice RMS across device sample rates ===");
      console.log(`22050Hz: ${rms22050.toFixed(2)}`);
      console.log(
        `44100Hz: ${rms44100.toFixed(2)} (ratio vs 22050: ${(rms44100 / rms22050).toFixed(3)})`,
      );
      console.log(
        `48000Hz: ${rms48000.toFixed(2)} (ratio vs 22050: ${(rms48000 / rms22050).toFixed(3)})`,
      );

      // All three rates are driven by the same virtual-rate physics after the
      // fix, so aggregate RMS should be close across rates (allow ~1.4dB of
      // slack for antialiasing-filter/decimation-phase differences). Before
      // the fix this ratio was measured (see investigation doc) at roughly
      // 0.68-0.71 (~-3dB), a real, reproducible, sample-rate-dependent
      // collapse -- this assertion is the regression gate for that collapse.
      expect(rms44100).toBeGreaterThan(rms22050 * 0.85);
      expect(rms48000).toBeGreaterThan(rms22050 * 0.85);
    });
  });

  describe("triangular-source", () => {
    let wasm: Klsyn88Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule("triangular-source");
    });

    it("should create and free source without crash", () => {
      const exports = wasm.exports;
      const ptr = exports.triangular_source_new(11025);
      expect(ptr).toBeGreaterThan(0);
      exports.triangular_source_free(ptr);
    });

    it("should generate non-zero output", () => {
      const exports = wasm.exports;
      const ptr = exports.triangular_source_new(11025);

      let hasNonZero = false;
      for (let i = 0; i < 200; i++) {
        const sample = exports.triangular_source_process(ptr, 100, 0.5, 0.5);
        if (Math.abs(sample) > 0.001) {
          hasNonZero = true;
          break;
        }
      }

      exports.triangular_source_free(ptr);
      expect(hasNonZero).toBe(true);
    });

    it("should produce periodic output", () => {
      const exports = wasm.exports;
      const sampleRate = 11025;
      const f0 = 100; // 100 Hz
      const periodSamples = Math.floor(sampleRate / f0);

      const ptr = exports.triangular_source_new(sampleRate);

      // Generate 3 periods
      const samples: number[] = [];
      for (let i = 0; i < periodSamples * 3; i++) {
        samples.push(exports.triangular_source_process(ptr, f0, 0.5, 0.5));
      }

      exports.triangular_source_free(ptr);

      // Check that period 2 roughly matches period 3 (period 1 may differ due to startup)
      let matchCount = 0;
      for (let i = 0; i < periodSamples; i++) {
        const s2 = samples[periodSamples + i];
        const s3 = samples[periodSamples * 2 + i];
        if (Math.abs(s2 - s3) < 0.1) matchCount++;
      }

      expect(matchCount / periodSamples).toBeGreaterThan(0.9);
    });
  });

  describe("impulsive-source", () => {
    let wasm: Klsyn88Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule("impulsive-source");
    });

    it("should create and free source without crash", () => {
      const exports = wasm.exports;
      const ptr = exports.impulsive_source_new(11025);
      expect(ptr).toBeGreaterThan(0);
      exports.impulsive_source_free(ptr);
    });

    it("should generate non-zero output", () => {
      const exports = wasm.exports;
      const ptr = exports.impulsive_source_new(11025);

      let hasNonZero = false;
      for (let i = 0; i < 200; i++) {
        const sample = exports.impulsive_source_process(ptr, 100, 0.5);
        // Impulsive source is normalized; amplitudes are small before downstream gains.
        if (Math.abs(sample) > 0.00001) {
          hasNonZero = true;
          break;
        }
      }

      exports.impulsive_source_free(ptr);
      expect(hasNonZero).toBe(true);
    });
  });

  describe("square-source", () => {
    let wasm: Klsyn88Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule("square-source");
    });

    it("should create and free source without crash", () => {
      const exports = wasm.exports;
      const ptr = exports.square_source_new(11025);
      expect(ptr).toBeGreaterThan(0);
      exports.square_source_free(ptr);
    });

    it("should produce bipolar output (-1 or 1)", () => {
      const exports = wasm.exports;
      const ptr = exports.square_source_new(11025);

      const values = new Set<number>();
      for (let i = 0; i < 200; i++) {
        const sample = exports.square_source_process(ptr, 100, 0.5);
        // Round to handle float imprecision
        values.add(Math.round(sample * 10) / 10);
      }

      exports.square_source_free(ptr);

      // klsyn88-style source is bipolar; this implementation normalizes to +/-1.
      expect(values.size).toBe(2);
      expect(values.has(-1)).toBe(true);
      expect(values.has(1)).toBe(true);
    });
  });

  describe("tilt-filter", () => {
    let wasm: Klsyn88Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule("tilt-filter");
    });

    it("should create and free filter without crash", () => {
      const exports = wasm.exports;
      const ptr = exports.tilt_filter_new();
      expect(ptr).toBeGreaterThan(0);
      exports.tilt_filter_free(ptr);
    });

    it("should pass through with tilt=0", () => {
      const exports = wasm.exports;
      const ptr = exports.tilt_filter_new();
      exports.tilt_filter_set_tilt(ptr, 0);

      // With tilt=0, output should equal input
      const input = 0.5;
      const output = exports.tilt_filter_process(ptr, input);

      exports.tilt_filter_free(ptr);
      expect(output).toBeCloseTo(input, 3);
    });

    it("should attenuate with high tilt", () => {
      const exports = wasm.exports;
      const ptr = exports.tilt_filter_new();
      exports.tilt_filter_set_tilt(ptr, 30); // High tilt

      // Send impulse and check decay
      const impulseResponse: number[] = [];
      impulseResponse.push(exports.tilt_filter_process(ptr, 1.0));
      for (let i = 0; i < 10; i++) {
        impulseResponse.push(exports.tilt_filter_process(ptr, 0.0));
      }

      exports.tilt_filter_free(ptr);

      // Output should decay
      expect(impulseResponse[0]).toBeLessThan(1.0);
      expect(impulseResponse[5]).toBeLessThan(impulseResponse[0]);
    });
  });

  describe("pitch-sync-mod", () => {
    let wasm: Klsyn88Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule("pitch-sync-mod");
    });

    it("should create and free resonator without crash", () => {
      const exports = wasm.exports;
      const ptr = exports.pitch_sync_resonator_new(11025);
      expect(ptr).toBeGreaterThan(0);
      exports.pitch_sync_resonator_free(ptr);
    });

    it("should filter input signal", () => {
      const exports = wasm.exports;
      const ptr = exports.pitch_sync_resonator_new(11025);

      // Send impulse through resonator
      let hasOutput = false;

      // First sample (impulse)
      let sample = exports.pitch_sync_resonator_process(ptr, 1.0, 100, 50, 500, 80, 0, 0, 0, 2);
      if (Math.abs(sample) > 0.001) hasOutput = true;

      // Subsequent samples (zeros in)
      for (let i = 0; i < 100; i++) {
        sample = exports.pitch_sync_resonator_process(ptr, 0.0, 100, 50, 500, 80, 0, 0, 0, 2);
        if (Math.abs(sample) > 0.001) hasOutput = true;
      }

      exports.pitch_sync_resonator_free(ptr);
      expect(hasOutput).toBe(true);
    });

    it("should respond to delta parameters under sustained excitation", () => {
      const exports = wasm.exports;
      const sampleRate = 11025;

      // Without delta
      const ptr1 = exports.pitch_sync_resonator_new(sampleRate);
      const samples1: number[] = [];
      for (let i = 0; i < 200; i++) {
        samples1.push(
          exports.pitch_sync_resonator_process(ptr1, 1.0, 100, 50, 500, 80, 0, 0, 0, 2),
        );
      }
      exports.pitch_sync_resonator_free(ptr1);

      // With delta
      const ptr2 = exports.pitch_sync_resonator_new(sampleRate);
      const samples2: number[] = [];
      for (let i = 0; i < 200; i++) {
        samples2.push(
          exports.pitch_sync_resonator_process(
            ptr2,
            1.0,
            100,
            50,
            500,
            80,
            100,
            50,
            0,
            2, // dF1=100, dB1=50
          ),
        );
      }
      exports.pitch_sync_resonator_free(ptr2);

      // Outputs should differ
      let diffCount = 0;
      let maxDiff = 0;
      for (let i = 0; i < 200; i++) {
        const diff = Math.abs(samples1[i] - samples2[i]);
        if (diff > 0.01) diffCount++;
        maxDiff = Math.max(maxDiff, diff);
      }

      expect(maxDiff).toBeGreaterThan(0.05);
      expect(diffCount).toBeGreaterThan(20);
    });
  });

  describe("fujisaki-resonator", () => {
    let wasm: Klsyn88Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule("fujisaki-resonator");
    });

    it("should create and free resonator without crash", () => {
      const exports = wasm.exports;
      const ptr = exports.fujisaki_resonator_new();
      expect(ptr).toBeGreaterThan(0);
      exports.fujisaki_resonator_free(ptr);
    });

    it("should filter input signal", () => {
      const exports = wasm.exports;
      const ptr = exports.fujisaki_resonator_new();

      const blockSize = 64;
      const input = allocF32(exports, blockSize);
      const output = allocF32(exports, blockSize);
      input.view.fill(0);
      input.view[0] = 1.0;

      exports.fujisaki_resonator_set_params(ptr, 500, 80, 11025);
      exports.fujisaki_resonator_process(ptr, input.ptr, output.ptr, blockSize);

      let hasOutput = false;
      for (let i = 0; i < blockSize; i++) {
        if (Math.abs(output.view[i]) > 0.0001) {
          hasOutput = true;
          break;
        }
      }

      deallocF32(exports, input.ptr, blockSize);
      deallocF32(exports, output.ptr, blockSize);
      exports.fujisaki_resonator_free(ptr);

      expect(hasOutput).toBe(true);
    });
  });
});
