/**
 * Tests for the Chalker 1985 two-term radiation filter.
 *
 * Tests the algorithm directly (no AudioWorklet runtime needed) by
 * simulating the difference equation:
 *   y[n] = c1*(x[n] - x[n-1]) + c2*(x[n] - 2*x[n-1] + x[n-2])
 *
 * Citation: Chalker & Mackerras 1985, IEEE Trans. ASSP-33(6), pp. 1606-1609.
 */
import { describe, it, expect } from "vitest";

const C2_WEIGHT = 1 / 24;

/** Compute Chalker filter coefficients for a given sample rate. */
function chalkerCoefficients(sr: number): { c1: number; c2: number } {
  const srRatio = sr / 10000;
  return {
    c1: srRatio,
    c2: -C2_WEIGHT * srRatio * srRatio,
  };
}

/** Run the Chalker two-term filter on an input buffer. */
function chalkerFilter(input: number[], sr: number): number[] {
  const { c1, c2 } = chalkerCoefficients(sr);
  const out: number[] = [];
  let p1 = 0;
  let p2 = 0;
  for (const x of input) {
    out.push(c1 * (x - p1) + c2 * (x - 2 * p1 + p2));
    p2 = p1;
    p1 = x;
  }
  return out;
}

/** Run a simple first-difference filter (existing differentiator). */
function simpleDiff(input: number[], sr: number): number[] {
  const scale = sr / 10000;
  const out: number[] = [];
  let prev = 0;
  for (const x of input) {
    out.push((x - prev) * scale);
    prev = x;
  }
  return out;
}

/** Generate a sine wave at a given frequency and sample rate. */
function sineWave(
  freq: number,
  sr: number,
  samples: number
): number[] {
  const out: number[] = [];
  for (let i = 0; i < samples; i++) {
    out.push(Math.sin((2 * Math.PI * freq * i) / sr));
  }
  return out;
}

/** Compute RMS of a buffer. */
function rms(buf: number[]): number {
  if (buf.length === 0) return 0;
  const sumSq = buf.reduce((s, v) => s + v * v, 0);
  return Math.sqrt(sumSq / buf.length);
}

describe("Chalker 1985 two-term radiation filter", () => {
  describe("impulse response", () => {
    it("produces a 3-sample impulse response", () => {
      const sr = 10000;
      const { c1, c2 } = chalkerCoefficients(sr);
      // Impulse: [1, 0, 0, 0, ...]
      const input = [1, 0, 0, 0, 0];
      const output = chalkerFilter(input, sr);

      // h[0] = c1*(1-0) + c2*(1-0+0) = c1 + c2
      expect(output[0]).toBeCloseTo(c1 + c2, 10);
      // h[1] = c1*(0-1) + c2*(0-2*1+0) = -c1 - 2*c2
      expect(output[1]).toBeCloseTo(-c1 - 2 * c2, 10);
      // h[2] = c1*(0-0) + c2*(0-0+1) = c2
      expect(output[2]).toBeCloseTo(c2, 10);
      // h[3] onwards = 0
      expect(output[3]).toBeCloseTo(0, 10);
      expect(output[4]).toBeCloseTo(0, 10);
    });

    it("at reference rate (10 kHz), c1=1 and c2=-1/24", () => {
      const { c1, c2 } = chalkerCoefficients(10000);
      expect(c1).toBe(1);
      expect(c2).toBeCloseTo(-1 / 24, 10);
    });

    it("coefficients scale with sample rate", () => {
      const c10k = chalkerCoefficients(10000);
      const c44k = chalkerCoefficients(44100);
      // c1 scales linearly
      expect(c44k.c1).toBeCloseTo(44100 / 10000, 6);
      // c2 scales quadratically
      expect(c44k.c2).toBeCloseTo(
        -C2_WEIGHT * (44100 / 10000) ** 2,
        6
      );
      // Verify c2 is larger in magnitude at higher SR
      expect(Math.abs(c44k.c2)).toBeGreaterThan(Math.abs(c10k.c2));
    });
  });

  describe("frequency response shape", () => {
    it("output magnitude increases with frequency (radiation characteristic)", () => {
      const sr = 44100;
      const N = 4410; // 100ms of signal
      // Skip first 128 samples to avoid transient, measure steady-state
      const skip = 128;

      const rms1k = rms(chalkerFilter(sineWave(1000, sr, N), sr).slice(skip));
      const rms3k = rms(chalkerFilter(sineWave(3000, sr, N), sr).slice(skip));
      const rms5k = rms(chalkerFilter(sineWave(5000, sr, N), sr).slice(skip));

      // Radiation filter should boost higher frequencies
      expect(rms3k).toBeGreaterThan(rms1k);
      expect(rms5k).toBeGreaterThan(rms3k);
    });

    it("low-frequency response approximates +6 dB/octave", () => {
      const sr = 44100;
      const N = 4410;
      const skip = 128;

      const rms500 = rms(chalkerFilter(sineWave(500, sr, N), sr).slice(skip));
      const rms1k = rms(chalkerFilter(sineWave(1000, sr, N), sr).slice(skip));

      // +6 dB/octave means doubling frequency doubles amplitude (ratio ~2)
      const ratio = rms1k / rms500;
      // Allow some tolerance for the correction term effect
      expect(ratio).toBeGreaterThan(1.8);
      expect(ratio).toBeLessThan(2.2);
    });
  });

  describe("comparison to simple differentiator", () => {
    it("differs from simple differentiator at high frequencies", () => {
      const sr = 44100;
      const N = 4410;
      const skip = 128;
      const input = sineWave(5000, sr, N);

      const chalkerOut = chalkerFilter(input, sr).slice(skip);
      const diffOut = simpleDiff(input, sr).slice(skip);

      const chalkerRms = rms(chalkerOut);
      const diffRms = rms(diffOut);

      // They should differ — the correction term modifies high-frequency gain
      expect(Math.abs(chalkerRms - diffRms) / diffRms).toBeGreaterThan(0.01);
    });

    it("closely matches simple differentiator at low frequencies", () => {
      const sr = 44100;
      const N = 4410;
      const skip = 128;
      const input = sineWave(200, sr, N);

      const chalkerOut = chalkerFilter(input, sr).slice(skip);
      const diffOut = simpleDiff(input, sr).slice(skip);

      const chalkerRms = rms(chalkerOut);
      const diffRms = rms(diffOut);

      // At 200 Hz the second-order term contribution is small
      const relDiff = Math.abs(chalkerRms - diffRms) / diffRms;
      expect(relDiff).toBeLessThan(0.05);
    });
  });

  describe("zero-input stability", () => {
    it("produces zero output for zero input", () => {
      const input = new Array(128).fill(0);
      const output = chalkerFilter(input, 44100);
      for (const v of output) {
        expect(v).toBe(0);
      }
    });
  });
});
