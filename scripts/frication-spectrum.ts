import FFT from "fft.js";
import type { RenderPayload } from "../src/rendering/types";

export type Moments = [number, number, number, number];
// Jongman, Wayland & Wong (2000), Table I: pooled speakers, voicing, vowels/windows.
export const TARGETS = {
  S: [6133, 2.92, -0.229, 2.36],
  SH: [4229, 3.38, 0.693, 0.42],
  F: [5108, 6.37, 0.077, 2.11],
} satisfies Record<string, Moments>;
export type Fricative = keyof typeof TARGETS;

/** Hz, million Hz squared, standardized skewness, and excess kurtosis. */
export function momentsFromPower(power: number[], binHz: number): Moments {
  if (!(binHz > 0) || power.some((value) => !Number.isFinite(value) || value < 0))
    throw new Error("Invalid spectrum");
  const total = power.reduce((sum, value) => sum + value, 0);
  if (!(total > 0) || !Number.isFinite(total)) throw new Error("Silent or invalid spectrum");
  const probability = power.map((value) => value / total);
  const mean = probability.reduce((sum, value, index) => sum + value * index * binHz, 0);
  const central = (order: number) =>
    probability.reduce((sum, value, index) => sum + value * (index * binHz - mean) ** order, 0);
  const variance = central(2);
  if (!(variance > 0)) throw new Error("Degenerate spectrum");
  return [mean, variance / 1e6, central(3) / variance ** 1.5, central(4) / variance ** 2 - 3];
}

export function measureFricatives(render: RenderPayload) {
  if (render.sampleRate !== 22000 || !Array.isArray(render.track))
    throw new Error("Expected a 22 kHz render with track");
  const track = render.track.map((frame: unknown) => {
    if (
      typeof frame !== "object" ||
      frame === null ||
      !("time" in frame) ||
      typeof frame.time !== "number"
    )
      throw new Error("Invalid timed frame");
    return {
      time: frame.time,
      phone: "phoneme" in frame && typeof frame.phoneme === "string" ? frame.phoneme : "",
    };
  });
  const windows: Record<Fricative, Moments[]> = { S: [], SH: [], F: [] };
  const size = 4096;
  const width = 880; // Jongman et al.: 40 ms at 22 kHz.
  const fft = new FFT(size);
  for (let index = 0; index < track.length; index++) {
    const frame = track[index];
    if (!(frame.phone in TARGETS) || track[index - 1]?.phone === frame.phone) continue;
    const phone = frame.phone as Fricative;
    const next = track.slice(index + 1).find((item) => item.phone !== phone);
    if (!next || next.time - frame.time < 0.04)
      throw new Error(`Insufficient frication interval: ${phone}`);
    // First/middle/last 40 ms, then last 20 ms of frication plus first 20 ms of vowel.
    for (const time of [
      frame.time,
      (frame.time + next.time) / 2 - 0.02,
      next.time - 0.04,
      next.time - 0.02,
    ]) {
      const offset = Math.round((time + render.leadTime) * render.sampleRate);
      if (offset < 1 || offset + width > render.samples.length)
        throw new Error("Window outside render");
      const input = new Array<number>(size).fill(0);
      for (let n = 0; n < width; n++) {
        const hamming = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (width - 1));
        input[n] = (render.samples[offset + n] - 0.98 * render.samples[offset + n - 1]) * hamming;
      }
      const spectrum = fft.createComplexArray();
      fft.realTransform(spectrum, input);
      // Power weighting is the declared evaluation convention; Table I is a population reference.
      const power = Array.from(
        { length: size / 2 + 1 },
        (_, bin) => spectrum[2 * bin] ** 2 + spectrum[2 * bin + 1] ** 2,
      );
      windows[phone].push(momentsFromPower(power, render.sampleRate / size));
    }
  }
  return (Object.keys(TARGETS) as Fricative[]).map((phone) => {
    const values = windows[phone];
    if (values.length === 0) throw new Error(`Missing required fricative: ${phone}`);
    const moments = [0, 1, 2, 3].map(
      (dimension) => values.reduce((sum, row) => sum + row[dimension], 0) / values.length,
    ) as Moments;
    // Fixed engineering comparison scale: kHz, million Hz², skewness, excess kurtosis.
    const distance = Math.hypot(
      ...moments.map(
        (value, dimension) => (value - TARGETS[phone][dimension]) / (dimension === 0 ? 1000 : 1),
      ),
    );
    return { phone, tokens: values.length / 4, moments, distance };
  });
}
