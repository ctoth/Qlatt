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

describe('klsyn88 Primitives', () => {
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
        ptr, 1.0, 100, 0.5, 500, 80, 0, 0
      );
      if (Math.abs(sample) > 0.001) hasOutput = true;

      // Subsequent samples (zeros in)
      for (let i = 0; i < 100; i++) {
        sample = exports.pitch_sync_resonator_process(
          ptr, 0.0, 100, 0.5, 500, 80, 0, 0
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
          ptr1, i === 0 ? 1.0 : 0.0, 100, 0.5, 500, 80, 0, 0
        ));
      }
      exports.pitch_sync_resonator_free(ptr1);

      // With delta
      const ptr2 = exports.pitch_sync_resonator_new(sampleRate);
      const samples2: number[] = [];
      for (let i = 0; i < 200; i++) {
        samples2.push(exports.pitch_sync_resonator_process(
          ptr2, i === 0 ? 1.0 : 0.0, 100, 0.5, 500, 80, 100, 50 // dF1=100, dB1=50
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
});
