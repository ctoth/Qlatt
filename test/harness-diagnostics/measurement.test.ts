import { describe, expect, it } from "vitest";
import {
  readRms,
  readPeak,
  readFftPeakFreq,
  readBandEnergy,
} from "../../src/harness-diagnostics/measurement";

/**
 * Mock AnalyserNode with known buffers for deterministic testing.
 * Only implements the subset of AnalyserNode used by measurement functions.
 */
function mockAnalyser(
  timeDomain: number[],
  frequencyData?: number[],
  fftSize?: number,
) {
  const fft = fftSize ?? timeDomain.length;
  return {
    fftSize: fft,
    frequencyBinCount: fft / 2,
    getFloatTimeDomainData(buf: Float32Array) {
      for (let i = 0; i < buf.length && i < timeDomain.length; i++)
        buf[i] = timeDomain[i];
    },
    getFloatFrequencyData(buf: Float32Array) {
      if (!frequencyData) return;
      for (let i = 0; i < buf.length && i < frequencyData.length; i++)
        buf[i] = frequencyData[i];
    },
  } as unknown as AnalyserNode;
}

describe("readRms", () => {
  it("returns RMS of uniform buffer", () => {
    const analyser = mockAnalyser([0.5, 0.5, 0.5, 0.5]);
    expect(readRms(analyser)).toBeCloseTo(0.5, 6);
  });

  it("returns RMS of mixed-sign buffer", () => {
    // RMS of [0.3, -0.3, 0.3, -0.3] = 0.3
    const analyser = mockAnalyser([0.3, -0.3, 0.3, -0.3]);
    expect(readRms(analyser)).toBeCloseTo(0.3, 6);
  });

  it("returns 0 for silent buffer", () => {
    const analyser = mockAnalyser([0, 0, 0, 0]);
    expect(readRms(analyser)).toBe(0);
  });

  it("handles single-sample buffer", () => {
    const analyser = mockAnalyser([0.7], undefined, 2);
    // fftSize=2, so frequencyBinCount=1, time domain buffer length = fftSize = 2
    // but only 1 sample provided; rest is 0 from Float32Array init
    // RMS = sqrt((0.7^2 + 0) / 2) = sqrt(0.245) ~ 0.4949...
    expect(readRms(analyser)).toBeCloseTo(Math.sqrt(0.49 / 2), 4);
  });
});

describe("readPeak", () => {
  it("returns peak absolute value", () => {
    const analyser = mockAnalyser([0.1, -0.8, 0.3]);
    expect(readPeak(analyser)).toBeCloseTo(0.8, 6);
  });

  it("returns 0 for silent buffer", () => {
    const analyser = mockAnalyser([0, 0, 0]);
    expect(readPeak(analyser)).toBe(0);
  });

  it("finds positive peak", () => {
    const analyser = mockAnalyser([0.1, 0.9, 0.2]);
    expect(readPeak(analyser)).toBeCloseTo(0.9, 6);
  });
});

describe("readFftPeakFreq", () => {
  it("returns frequency of max bin", () => {
    const sampleRate = 48000;
    const fftSize = 2048;
    const binCount = fftSize / 2; // 1024

    // Create frequency data in dB; all -100 except bin 100 which is -10
    const freqData = new Array(binCount).fill(-100);
    const peakBin = 100;
    freqData[peakBin] = -10;

    const analyser = mockAnalyser([0], freqData, fftSize);
    const result = readFftPeakFreq(analyser, sampleRate);

    const expectedFreq = (peakBin * sampleRate) / fftSize;
    expect(result).toBeCloseTo(expectedFreq, 4);
  });

  it("returns frequency of max bin within band", () => {
    const sampleRate = 48000;
    const fftSize = 2048;
    const binCount = fftSize / 2;
    const binWidth = sampleRate / fftSize; // 23.4375 Hz

    // Put a global peak at bin 10 (~234 Hz) and a secondary peak at bin 200 (~4687 Hz)
    const freqData = new Array(binCount).fill(-100);
    freqData[10] = -5; // global peak, outside band
    freqData[200] = -20; // secondary peak, inside band

    const band: [number, number] = [4000, 5000];
    const analyser = mockAnalyser([0], freqData, fftSize);
    const result = readFftPeakFreq(analyser, sampleRate, band);

    const expectedFreq = (200 * sampleRate) / fftSize;
    expect(result).toBeCloseTo(expectedFreq, 4);
  });

  it("returns 0 when band contains no bins", () => {
    const sampleRate = 48000;
    const fftSize = 2048;
    const binCount = fftSize / 2;
    const freqData = new Array(binCount).fill(-100);

    // Band above Nyquist — no bins fall in it
    const band: [number, number] = [25000, 30000];
    const analyser = mockAnalyser([0], freqData, fftSize);
    const result = readFftPeakFreq(analyser, sampleRate, band);
    expect(result).toBe(0);
  });
});

describe("readBandEnergy", () => {
  it("sums linear power only within band", () => {
    const sampleRate = 48000;
    const fftSize = 2048;
    const binCount = fftSize / 2;
    const binWidth = sampleRate / fftSize; // 23.4375 Hz

    // Put -10 dB in bins 40-49 (covering ~937–1171 Hz), -100 dB elsewhere
    const freqData = new Array(binCount).fill(-100);
    for (let i = 40; i < 50; i++) freqData[i] = -10;

    const band: [number, number] = [900, 1200];
    const analyser = mockAnalyser([0], freqData, fftSize);
    const result = readBandEnergy(analyser, sampleRate, band);

    // Count how many bins fall in [900, 1200]
    // bin i covers frequency i * binWidth
    // bin 39: 39 * 23.4375 = 914.0625 — in band but has -100 dB
    // bin 40: 40 * 23.4375 = 937.5 — in band, -10 dB
    // bin 49: 49 * 23.4375 = 1148.4375 — in band, -10 dB
    // bin 50: 50 * 23.4375 = 1171.875 — in band but has -100 dB
    // bin 51: 51 * 23.4375 = 1195.3125 — in band but has -100 dB
    // So bins 40–49 (10 bins) have -10 dB, and some surrounding bins have -100 dB

    // Linear power of -10 dB = 10^(-10/10) = 0.1
    // Linear power of -100 dB = 10^(-100/10) = 1e-10 (negligible)
    // Sum of 10 bins at -10 dB ~ 10 * 0.1 = 1.0
    expect(result).toBeCloseTo(1.0, 1);
  });

  it("returns near-zero for silent band", () => {
    const sampleRate = 48000;
    const fftSize = 2048;
    const binCount = fftSize / 2;
    const freqData = new Array(binCount).fill(-100);

    const band: [number, number] = [1000, 2000];
    const analyser = mockAnalyser([0], freqData, fftSize);
    const result = readBandEnergy(analyser, sampleRate, band);

    // All bins at -100 dB → each contributes 1e-10
    expect(result).toBeLessThan(0.001);
  });

  it("excludes energy outside band", () => {
    const sampleRate = 48000;
    const fftSize = 2048;
    const binCount = fftSize / 2;
    const freqData = new Array(binCount).fill(0); // 0 dB everywhere

    // Only look at a narrow band
    const band: [number, number] = [1000, 1100];
    const analyser = mockAnalyser([0], freqData, fftSize);
    const narrowResult = readBandEnergy(analyser, sampleRate, band);

    // Wider band should have more energy
    const wideBand: [number, number] = [1000, 5000];
    const wideResult = readBandEnergy(analyser, sampleRate, wideBand);

    expect(wideResult).toBeGreaterThan(narrowResult);
  });
});
