/**
 * klsyn88 Integration Tests
 * Tests the new primitives added for klsyn88 support
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Helper to load WASM module in Node
async function loadWasmModule(crateName: string): Promise<WebAssembly.Instance> {
  const wasmPath = path.join(
    __dirname,
    '..',
    'target',
    'wasm32-unknown-unknown',
    'release',
    `${crateName.replace(/-/g, '_')}.wasm`
  );

  if (!fs.existsSync(wasmPath)) {
    throw new Error(`WASM file not found: ${wasmPath}`);
  }

  const wasmBuffer = fs.readFileSync(wasmPath);
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const instance = await WebAssembly.instantiate(wasmModule, {});
  return instance;
}

function allocF32(exports: any, length: number) {
  const ptr = exports.alloc_f32(length);
  if (!ptr) throw new Error('alloc_f32 returned null');
  const view = new Float32Array((exports.memory as WebAssembly.Memory).buffer, ptr, length);
  return { ptr, view };
}

function deallocF32(exports: any, ptr: number, length: number) {
  exports.dealloc_f32(ptr, length);
}

describe('klsyn88 Primitives', () => {
  describe('oversampled-glottal-source', () => {
    let wasm: WebAssembly.Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule('oversampled-glottal-source');
    });

    it('should create and free source without crash', () => {
      const exports = wasm.exports as any;
      const ptr = exports.oversampled_glottal_source_new(11025);
      expect(ptr).toBeGreaterThan(0);
      exports.oversampled_glottal_source_free(ptr);
    });

    it('should output klsyn88-scale amplitudes', () => {
      // Measure raw glottal source output to understand signal levels
      const exports = wasm.exports as any;
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

      exports.oversampled_glottal_source_process(
        state,
        f0.ptr, 1, av.ptr, 1, aturb.ptr, 1, tilt.ptr, 1,
        oq.ptr, 1, skew.ptr, 1, asym.ptr, 1, source.ptr, 1, seed.ptr, 1,
        voice.ptr, noise.ptr, blockSize
      );

      let voicePeak = 0;
      let noisePeak = 0;
      for (let i = 0; i < blockSize; i++) {
        voicePeak = Math.max(voicePeak, Math.abs(voice.view[i]));
        noisePeak = Math.max(noisePeak, Math.abs(noise.view[i]));
      }

      // klsyn88 amptable: dbToLinearKlsyn(dB) = amptable[dB] * 0.001
      const klsynAmpTable = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 6, 7, 8, 9, 10, 11, 13,
        14, 16, 18, 20, 22, 25, 28, 32, 35, 40,
        45, 51, 57, 64, 71, 80, 90, 101, 114, 128,
        142, 159, 179, 202, 227, 256, 284, 318, 359, 405,
        455, 512, 568, 638, 719, 811, 911, 1024, 1137, 1276,
        1438, 1622, 1823, 2048, 2273, 2552, 2875, 3244, 3645, 4096,
        4547, 5104, 5751, 6488, 7291, 8192, 9093, 10207, 11502, 12976,
        14582, 16384, 18350, 20644, 23429, 26214, 29491, 32767
      ];

      // Simulate signal chain gains
      const AV = 60;
      const GO = 57;
      const avDb = Math.max(AV - 7, 0); // = 53
      const gain0Db = (GO - 3) <= 0 ? 57 : (GO - 3); // = 54

      const voiceGain = klsynAmpTable[avDb] * 0.001; // = 0.638
      const gain0Linear = klsynAmpTable[gain0Db] * 0.001; // = 0.719
      const gain0LinearWithFix = gain0Linear / 32768; // = 2.19e-5

      console.log('=== klsyn88 Signal Level Analysis ===');
      console.log(`Raw glottal voice peak: ${voicePeak.toFixed(1)}`);
      console.log(`Raw glottal noise peak: ${noisePeak.toFixed(1)}`);
      console.log(`voiceGain (AV=${AV}): ${voiceGain.toFixed(4)}`);
      console.log(`gain0Linear (GO=${GO}): ${gain0Linear.toFixed(4)}`);
      console.log(`gain0Linear with /32768 fix: ${gain0LinearWithFix.toExponential(3)}`);
      console.log('--- Signal chain estimates (ignoring resonator gain) ---');
      console.log(`After voiceGain: ${(voicePeak * voiceGain).toFixed(1)}`);
      console.log(`After gain0 (no fix): ${(voicePeak * voiceGain * gain0Linear).toFixed(1)}`);
      console.log(`After gain0 (with fix): ${(voicePeak * voiceGain * gain0LinearWithFix).toFixed(4)}`);
      console.log('--- For WebAudio [-1,1] output ---');
      console.log(`Resonator gain needed to clip (no fix): ${(1 / (voicePeak * voiceGain * gain0Linear)).toFixed(4)}`);
      console.log(`Resonator gain needed to clip (with fix): ${(1 / (voicePeak * voiceGain * gain0LinearWithFix)).toFixed(1)}`);

      deallocF32(exports, f0.ptr, 1);
      deallocF32(exports, av.ptr, 1);
      deallocF32(exports, aturb.ptr, 1);
      deallocF32(exports, tilt.ptr, 1);
      deallocF32(exports, oq.ptr, 1);
      deallocF32(exports, skew.ptr, 1);
      deallocF32(exports, asym.ptr, 1);
      deallocF32(exports, source.ptr, 1);
      deallocF32(exports, seed.ptr, 1);
      deallocF32(exports, voice.ptr, blockSize);
      deallocF32(exports, noise.ptr, blockSize);
      exports.oversampled_glottal_source_free(state);

      expect(voicePeak).toBeGreaterThan(100);
    });

    it('should generate voice and noise outputs', () => {
      const exports = wasm.exports as any;
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
        voice.ptr,
        noise.ptr,
        blockSize
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
      deallocF32(exports, voice.ptr, blockSize);
      deallocF32(exports, noise.ptr, blockSize);
      exports.oversampled_glottal_source_free(state);

      expect(voiceNonZero).toBe(true);
      expect(noiseNonZero).toBe(true);
    });
  });

  describe('triangular-source', () => {
    let wasm: WebAssembly.Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule('triangular-source');
    });

    it('should create and free source without crash', () => {
      const exports = wasm.exports as any;
      const ptr = exports.triangular_source_new(11025);
      expect(ptr).toBeGreaterThan(0);
      exports.triangular_source_free(ptr);
    });

    it('should generate non-zero output', () => {
      const exports = wasm.exports as any;
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

    it('should produce periodic output', () => {
      const exports = wasm.exports as any;
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

  describe('impulsive-source', () => {
    let wasm: WebAssembly.Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule('impulsive-source');
    });

    it('should create and free source without crash', () => {
      const exports = wasm.exports as any;
      const ptr = exports.impulsive_source_new(11025);
      expect(ptr).toBeGreaterThan(0);
      exports.impulsive_source_free(ptr);
    });

    it('should generate non-zero output', () => {
      const exports = wasm.exports as any;
      const ptr = exports.impulsive_source_new(11025);

      let hasNonZero = false;
      for (let i = 0; i < 200; i++) {
        const sample = exports.impulsive_source_process(ptr, 100, 0.5);
        if (Math.abs(sample) > 0.001) {
          hasNonZero = true;
          break;
        }
      }

      exports.impulsive_source_free(ptr);
      expect(hasNonZero).toBe(true);
    });
  });

  describe('square-source', () => {
    let wasm: WebAssembly.Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule('square-source');
    });

    it('should create and free source without crash', () => {
      const exports = wasm.exports as any;
      const ptr = exports.square_source_new(11025);
      expect(ptr).toBeGreaterThan(0);
      exports.square_source_free(ptr);
    });

    it('should produce binary output (0 or 1)', () => {
      const exports = wasm.exports as any;
      const ptr = exports.square_source_new(11025);

      const values = new Set<number>();
      for (let i = 0; i < 200; i++) {
        const sample = exports.square_source_process(ptr, 100, 0.5);
        // Round to handle float imprecision
        values.add(Math.round(sample * 10) / 10);
      }

      exports.square_source_free(ptr);

      // Should only contain 0 and 1 (within rounding)
      expect(values.size).toBe(2);
      expect(values.has(0)).toBe(true);
      expect(values.has(1)).toBe(true);
    });
  });

  describe('tilt-filter', () => {
    let wasm: WebAssembly.Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule('tilt-filter');
    });

    it('should create and free filter without crash', () => {
      const exports = wasm.exports as any;
      const ptr = exports.tilt_filter_new();
      expect(ptr).toBeGreaterThan(0);
      exports.tilt_filter_free(ptr);
    });

    it('should pass through with tilt=0', () => {
      const exports = wasm.exports as any;
      const ptr = exports.tilt_filter_new();
      exports.tilt_filter_set_tilt(ptr, 0);

      // With tilt=0, output should equal input
      const input = 0.5;
      const output = exports.tilt_filter_process(ptr, input);

      exports.tilt_filter_free(ptr);
      expect(output).toBeCloseTo(input, 3);
    });

    it('should attenuate with high tilt', () => {
      const exports = wasm.exports as any;
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

  describe('pitch-sync-mod', () => {
    let wasm: WebAssembly.Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule('pitch-sync-mod');
    });

    it('should create and free resonator without crash', () => {
      const exports = wasm.exports as any;
      const ptr = exports.pitch_sync_resonator_new(11025);
      expect(ptr).toBeGreaterThan(0);
      exports.pitch_sync_resonator_free(ptr);
    });

    it('should filter input signal', () => {
      const exports = wasm.exports as any;
      const ptr = exports.pitch_sync_resonator_new(11025);

      // Send impulse through resonator
      let hasOutput = false;

      // First sample (impulse)
      let sample = exports.pitch_sync_resonator_process(
        ptr, 1.0, 100, 50, 500, 80, 0, 0, 0, 2
      );
      if (Math.abs(sample) > 0.001) hasOutput = true;

      // Subsequent samples (zeros in)
      for (let i = 0; i < 100; i++) {
        sample = exports.pitch_sync_resonator_process(
          ptr, 0.0, 100, 50, 500, 80, 0, 0, 0, 2
        );
        if (Math.abs(sample) > 0.001) hasOutput = true;
      }

      exports.pitch_sync_resonator_free(ptr);
      expect(hasOutput).toBe(true);
    });

    it('should respond to delta parameters', () => {
      const exports = wasm.exports as any;
      const sampleRate = 11025;

      // Without delta
      const ptr1 = exports.pitch_sync_resonator_new(sampleRate);
      const samples1: number[] = [];
      for (let i = 0; i < 200; i++) {
        samples1.push(exports.pitch_sync_resonator_process(
          ptr1, i === 0 ? 1.0 : 0.0, 100, 50, 500, 80, 0, 0, 0, 2
        ));
      }
      exports.pitch_sync_resonator_free(ptr1);

      // With delta
      const ptr2 = exports.pitch_sync_resonator_new(sampleRate);
      const samples2: number[] = [];
      for (let i = 0; i < 200; i++) {
        samples2.push(exports.pitch_sync_resonator_process(
          ptr2, i === 0 ? 1.0 : 0.0, 100, 50, 500, 80, 100, 50, 0, 2 // dF1=100, dB1=50
        ));
      }
      exports.pitch_sync_resonator_free(ptr2);

      // Outputs should differ
      let diffCount = 0;
      for (let i = 0; i < 200; i++) {
        if (Math.abs(samples1[i] - samples2[i]) > 0.01) diffCount++;
      }

      expect(diffCount).toBeGreaterThan(10);
    });
  });

  describe('fujisaki-resonator', () => {
    let wasm: WebAssembly.Instance;

    beforeAll(async () => {
      wasm = await loadWasmModule('fujisaki-resonator');
    });

    it('should create and free resonator without crash', () => {
      const exports = wasm.exports as any;
      const ptr = exports.fujisaki_resonator_new();
      expect(ptr).toBeGreaterThan(0);
      exports.fujisaki_resonator_free(ptr);
    });

    it('should filter input signal', () => {
      const exports = wasm.exports as any;
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
