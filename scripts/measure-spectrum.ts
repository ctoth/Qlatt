import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import FFT from "fft.js";
import { readWav } from "./oracle/wav.ts";

/** Engineering comparison: whole-record Hann periodogram, no pre-emphasis.
 * Bands above 4 kHz test issue #55; this is not a perceptual quality score.
 */
export function measureSpectrum(samples: ArrayLike<number>, sampleRate: number) {
  if (samples.length < 2 || !Number.isFinite(sampleRate) || sampleRate <= 0)
    throw new Error("Expected audio samples and a positive sample rate");
  let size = 2;
  while (size < samples.length) size *= 2;
  const input = new Array<number>(size).fill(0);
  for (let n = 0; n < samples.length; n++) {
    if (!Number.isFinite(samples[n])) throw new Error("Nonfinite audio sample");
    input[n] = samples[n] * (0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (samples.length - 1)));
  }
  const fft = new FFT(size);
  const spectrum = fft.createComplexArray();
  fft.realTransform(spectrum, input);
  const ranges = [
    [0, 4000],
    [4000, 8000],
    [8000, sampleRate / 2],
  ];
  const powers = ranges.map(([low, high]) => {
    let sum = 0;
    for (let k = 0; k <= size / 2; k++) {
      const hz = (k * sampleRate) / size;
      if (hz >= low && hz < high) sum += spectrum[2 * k] ** 2 + spectrum[2 * k + 1] ** 2;
    }
    return sum;
  });
  const total = powers.reduce((sum, value) => sum + value, 0);
  if (!(total > 0) || !Number.isFinite(total)) throw new Error("Silent or invalid spectrum");
  const high = powers[1] + powers[2];
  return {
    sampleRate,
    durationSeconds: samples.length / sampleRate,
    highToLowDb: high > 0 && powers[0] > 0 ? 10 * Math.log10(high / powers[0]) : null,
    bands: ranges.map(([lowHz, highHz], i) => ({ lowHz, highHz, fraction: powers[i] / total })),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const files = process.argv.slice(2);
    if (!files.length) throw new Error("Usage: npm run measure -- <mono-pcm16.wav> [...wav]");
    const reports = files.map((file) => {
      const wav = readWav(file);
      if (wav.channels !== 1 || wav.bitDepth !== 16)
        throw new Error("Spectral comparison requires mono PCM16 WAV files");
      return { file, ...measureSpectrum(wav.samples, wav.sampleRate) };
    });
    process.stdout.write(`${JSON.stringify(reports, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
