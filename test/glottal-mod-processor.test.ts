/**
 * Tests for GlottalModProcessor pulsatile aspiration envelope.
 *
 * Verifies the sinusoidal OQ-shaped glottal modulation:
 * - Open phase: 0.5 + 0.5 * sin(pi * phase / (oq * period))
 * - Closed phase: 0.5
 *
 * Citations: Klatt 1980 COEWAV.FOR lines 116-122, Gobl 1988, Fant 1995
 */
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Inline simulation of the GlottalModProcessor envelope logic
// (AudioWorkletProcessor is not available in Node.js test environment)
// ---------------------------------------------------------------------------

function generateGlottalModEnvelope(
  f0: number,
  oq: number,
  sampleRate: number,
  numSamples: number
): Float32Array {
  const out = new Float32Array(numSamples);
  const period = sampleRate / f0;
  let phase = 0;

  for (let i = 0; i < numSamples; i++) {
    if (f0 <= 0) {
      out[i] = 0.5;
      continue;
    }
    if (period > 1) {
      if (phase >= period) {
        phase %= period;
      }
      const openDuration = oq * period;
      if (phase < openDuration) {
        // Open phase: sinusoidal envelope
        out[i] = 0.5 + 0.5 * Math.sin(Math.PI * phase / openDuration);
      } else {
        // Closed phase: half amplitude
        out[i] = 0.5;
      }
      phase += 1;
    } else {
      out[i] = 1.0;
    }
  }
  return out;
}

describe("GlottalModProcessor pulsatile envelope", () => {
  const sampleRate = 48000;

  it("produces smooth (non-binary) envelope with default OQ=0.5", () => {
    const f0 = 110;
    const oq = 0.5;
    const numSamples = Math.ceil(sampleRate / f0) * 2; // 2 full periods
    const envelope = generateGlottalModEnvelope(f0, oq, sampleRate, numSamples);

    // Collect unique values (binary would only have 2)
    const uniqueValues = new Set<number>();
    for (let i = 0; i < envelope.length; i++) {
      uniqueValues.add(Math.round(envelope[i] * 1000) / 1000);
    }
    // Smooth envelope should have many distinct values, not just 0.5 and 1.0
    expect(uniqueValues.size).toBeGreaterThan(2);
  });

  it("peaks during open phase and returns to 0.5 during closed phase", () => {
    const f0 = 110;
    const oq = 0.5;
    const period = sampleRate / f0;
    const numSamples = Math.ceil(period);
    const envelope = generateGlottalModEnvelope(f0, oq, sampleRate, numSamples);

    // Open phase peak should be 1.0 (at midpoint of open phase)
    const openDuration = oq * period;
    const peakIndex = Math.floor(openDuration / 2);
    expect(envelope[peakIndex]).toBeCloseTo(1.0, 2);

    // Closed phase should be 0.5
    const closedIndex = Math.floor(openDuration + (period - openDuration) / 2);
    if (closedIndex < numSamples) {
      expect(envelope[closedIndex]).toBeCloseTo(0.5, 5);
    }
  });

  it("OQ=0.7 produces a wider open phase than OQ=0.3", () => {
    const f0 = 110;
    const numSamples = Math.ceil(sampleRate / f0);

    const envWide = generateGlottalModEnvelope(f0, 0.7, sampleRate, numSamples);
    const envNarrow = generateGlottalModEnvelope(f0, 0.3, sampleRate, numSamples);

    // Count samples above 0.5 (in the open phase)
    let wideOpen = 0;
    let narrowOpen = 0;
    for (let i = 0; i < numSamples; i++) {
      if (envWide[i] > 0.501) wideOpen++;
      if (envNarrow[i] > 0.501) narrowOpen++;
    }
    expect(wideOpen).toBeGreaterThan(narrowOpen);
  });

  it("envelope values stay within [0.5, 1.0] range", () => {
    const f0 = 200;
    const oq = 0.6;
    const numSamples = Math.ceil(sampleRate / f0) * 3;
    const envelope = generateGlottalModEnvelope(f0, oq, sampleRate, numSamples);

    for (let i = 0; i < envelope.length; i++) {
      expect(envelope[i]).toBeGreaterThanOrEqual(0.5 - 1e-6);
      expect(envelope[i]).toBeLessThanOrEqual(1.0 + 1e-6);
    }
  });

  it("outputs 0.5 when f0 is 0 (unvoiced)", () => {
    const envelope = generateGlottalModEnvelope(0, 0.5, sampleRate, 128);
    for (let i = 0; i < envelope.length; i++) {
      expect(envelope[i]).toBe(0.5);
    }
  });
});
