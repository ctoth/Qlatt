import { describe, expect, it } from "vitest";
import { createDiagnostics } from "../../src/diagnostics";
import {
  hanningWindow,
  overlapAndAdd,
  removeSilentFrames,
  resampleOct,
  stft,
  stoi,
  thirdOctaveBandMatrix,
} from "../../src/metrics/stoi";

// ── Helper: generate a tone signal ─────────────────────────────────────────

function generateTone(
  freq: number,
  sampleRate: number,
  durationSec: number,
  amplitude = 0.5,
): Float64Array {
  const len = Math.floor(sampleRate * durationSec);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return out;
}

/** White noise signal with seed-based deterministic pseudo-random values. */
function generateNoise(
  sampleRate: number,
  durationSec: number,
  amplitude = 0.1,
  seed = 42,
): Float64Array {
  const len = Math.floor(sampleRate * durationSec);
  const out = new Float64Array(len);
  // Simple LCG for reproducibility
  let state = seed;
  for (let i = 0; i < len; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    out[i] = amplitude * ((state / 0x7fffffff) * 2 - 1);
  }
  return out;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("thirdOctaveBandMatrix", () => {
  it("produces a 15-row matrix with 257 columns", () => {
    const obm = thirdOctaveBandMatrix();
    expect(obm).toHaveLength(15);
    for (const row of obm) {
      expect(row).toHaveLength(257);
    }
  });

  it("has non-overlapping bands (each bin in at most one band)", () => {
    const obm = thirdOctaveBandMatrix();
    for (let k = 0; k < 257; k++) {
      let count = 0;
      for (let j = 0; j < 15; j++) {
        if (obm[j][k] > 0) count++;
      }
      expect(count).toBeLessThanOrEqual(1);
    }
  });

  it("each band has at least one active bin", () => {
    const obm = thirdOctaveBandMatrix();
    for (let j = 0; j < 15; j++) {
      let active = 0;
      for (let k = 0; k < 257; k++) {
        if (obm[j][k] > 0) active++;
      }
      expect(active).toBeGreaterThan(0);
    }
  });

  it("lowest band starts near 150 Hz", () => {
    const obm = thirdOctaveBandMatrix();
    // Find first active bin in band 0
    let firstBin = -1;
    for (let k = 0; k < 257; k++) {
      if (obm[0][k] > 0) {
        firstBin = k;
        break;
      }
    }
    // At 10 kHz, 512 FFT → bin spacing ≈ 19.53 Hz
    const freq = (firstBin * 10000) / 512;
    // Should be near the lower edge of the 150 Hz center band
    // Lower edge = 150 / 2^(1/6) ≈ 133.5 Hz → bin ~7 → ~136.7 Hz
    expect(freq).toBeGreaterThan(100);
    expect(freq).toBeLessThan(200);
  });
});

describe("hanningWindow", () => {
  it("produces window of correct length", () => {
    const w = hanningWindow(256);
    expect(w).toHaveLength(256);
  });

  it("is symmetric", () => {
    const w = hanningWindow(256);
    for (let i = 0; i < 128; i++) {
      expect(w[i]).toBeCloseTo(w[255 - i], 10);
    }
  });

  it("has non-zero values at endpoints (MATLAB convention)", () => {
    const w = hanningWindow(256);
    // np.hanning(258)[1:-1] — first and last are NOT zero
    expect(w[0]).toBeGreaterThan(0);
    expect(w[255]).toBeGreaterThan(0);
  });
});

describe("stft", () => {
  it("returns power spectra with correct dimensions", () => {
    // 1 second at 10 kHz → 10000 samples
    // winSize=256, hop=128 → floor((10000-256)/128) + 1 frames
    const x = generateTone(440, 10000, 1.0);
    const result = stft(x, 256, 512, 2);
    const expectedFrames = Math.floor((x.length - 256) / 128) + 1;
    expect(result.length).toBe(expectedFrames);
    expect(result[0]).toHaveLength(257); // NFFT/2+1
  });

  it("concentrates energy at the signal frequency for a pure tone", () => {
    const freq = 1000; // Hz, easy to resolve at 10 kHz
    const x = generateTone(freq, 10000, 0.5);
    const result = stft(x, 256, 512, 2);

    // Check a middle frame
    const midFrame = result[Math.floor(result.length / 2)];
    // Expected bin for 1000 Hz at 10 kHz, 512 FFT: bin = 1000 * 512 / 10000 = 51.2
    const expectedBin = Math.round((freq * 512) / 10000);
    const peakBin = midFrame.indexOf(Math.max(...midFrame));
    expect(Math.abs(peakBin - expectedBin)).toBeLessThanOrEqual(1);
  });
});

describe("removeSilentFrames", () => {
  it("removes silence from both signals", () => {
    // 1s of tone + 1s of silence + 1s of tone
    const fs = 10000;
    const tone = generateTone(440, fs, 1.0);
    const silence = new Float64Array(fs);
    const x = new Float64Array(3 * fs);
    x.set(tone, 0);
    x.set(silence, fs);
    x.set(tone, 2 * fs);
    const y = new Float64Array(x); // identical

    const [xOut, yOut] = removeSilentFrames(x, y, 40, 256, 128);
    // Output should be shorter — silence removed
    expect(xOut.length).toBeLessThan(x.length);
    expect(xOut.length).toBe(yOut.length);
    expect(xOut.length).toBeGreaterThan(0);
  });

  it("keeps everything for a fully active signal", () => {
    const x = generateTone(440, 10000, 1.0, 0.5);
    const y = new Float64Array(x);
    const [xOut, _yOut] = removeSilentFrames(x, y, 40, 256, 128);
    // Should keep most/all frames
    expect(xOut.length).toBeGreaterThan(x.length * 0.5);
  });
});

describe("overlapAndAdd", () => {
  it("reconstructs from a single frame", () => {
    const frame = new Float64Array([1, 2, 3, 4]);
    const result = overlapAndAdd([frame], 2);
    expect(result).toHaveLength(4);
    expect(result[0]).toBe(1);
    expect(result[3]).toBe(4);
  });

  it("overlaps correctly for two frames", () => {
    const f1 = new Float64Array([1, 2, 3, 4]);
    const f2 = new Float64Array([5, 6, 7, 8]);
    const result = overlapAndAdd([f1, f2], 2);
    // Length = (2-1)*2 + 4 = 6
    expect(result).toHaveLength(6);
    expect(result[0]).toBe(1); // f1[0]
    expect(result[1]).toBe(2); // f1[1]
    expect(result[2]).toBe(3 + 5); // f1[2] + f2[0]
    expect(result[3]).toBe(4 + 6); // f1[3] + f2[1]
    expect(result[4]).toBe(7); // f2[2]
    expect(result[5]).toBe(8); // f2[3]
  });
});

describe("resampleOct", () => {
  it("preserves signal length ratio approximately", () => {
    const x = generateTone(440, 44100, 0.5);
    const y = resampleOct(x, 10000, 44100);
    const expectedLen = Math.ceil((x.length * 10000) / 44100);
    // Allow some tolerance for filter edge effects
    expect(Math.abs(y.length - expectedLen)).toBeLessThan(50);
  });

  it("no-op when p == q", () => {
    const x = generateTone(440, 10000, 0.1);
    const y = resampleOct(x, 10000, 10000);
    expect(y.length).toBe(x.length);
    for (let i = 0; i < x.length; i++) {
      expect(y[i]).toBeCloseTo(x[i], 10);
    }
  });
});

describe("stoi — identity test", () => {
  it("returns score ≈ 1.0 when clean === degraded (10 kHz)", () => {
    // Needs enough samples for ≥30 STFT frames after silence removal.
    // 30 frames * 128 hop + 256 win ≈ 4096 samples → 0.41s at 10 kHz
    const x = generateTone(440, 10000, 1.0);
    const result = stoi(x, x, 10000);
    expect(result.extended).toBe(false);
    expect(result.score).toBeGreaterThan(0.95);
  });

  it("returns score ≈ 1.0 for ESTOI when clean === degraded", () => {
    const x = generateTone(440, 10000, 1.0);
    const result = stoi(x, x, 10000, { extended: true });
    expect(result.extended).toBe(true);
    // ESTOI with row-col normalization may not be exactly 1.0
    // but should be very high for identical signals
    expect(result.score).toBeGreaterThan(0.9);
  });
});

describe("stoi — degraded signals", () => {
  it("returns lower score when noise is added", () => {
    const clean = generateTone(440, 10000, 1.0, 0.5);
    const noise = generateNoise(10000, 1.0, 0.3);
    const degraded = new Float64Array(clean.length);
    for (let i = 0; i < clean.length; i++) {
      degraded[i] = clean[i] + noise[i];
    }
    const result = stoi(clean, degraded, 10000);
    expect(result.score).toBeLessThan(1.0);
    // STOI range is [-1, 1]; a pure tone + heavy noise can produce
    // slightly negative scores, so just check it's less than identity.
    expect(result.score).toBeLessThan(0.95);
    expect(result.score).toBeGreaterThan(-1.0);
  });
});

describe("stoi — edge cases", () => {
  it("throws on mismatched signal lengths", () => {
    const x = new Float64Array(10000);
    const y = new Float64Array(10001);
    expect(() => stoi(x, y, 10000)).toThrow("same length");
  });

  it("returns sentinel 1e-5 when signal is too short", () => {
    // Very short signal → < 30 STFT frames after silence removal
    const x = generateTone(440, 10000, 0.1); // ~1000 samples → ~5 frames
    const result = stoi(x, x, 10000);
    expect(result.score).toBeCloseTo(1e-5, 8);
  });

  it("handles resampling from 44100 Hz", () => {
    const x = generateTone(440, 44100, 2.0);
    const result = stoi(x, x, 44100);
    expect(result.score).toBeGreaterThan(0.9);
  });
});

describe("stoi — diagnostics integration", () => {
  it("emits diagnostics when provided", () => {
    const diag = createDiagnostics();
    const x = generateTone(440, 10000, 1.0);
    stoi(x, x, 10000, { diagnostics: diag });
    const entries = diag.getEntries();
    expect(entries.length).toBeGreaterThan(0);
    // Should have at least "silence removal" and "score" entries
    const messages = entries.map((e) => e.message);
    expect(messages.some((m) => m.includes("silence removal"))).toBe(true);
    expect(messages.some((m) => m.includes("score"))).toBe(true);
  });
});
