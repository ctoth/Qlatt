import fs from "node:fs";

export type WavData = {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  samples: Float64Array;
};

export function readWav(filePath: string): WavData {
  const buf = fs.readFileSync(filePath);
  const riff = buf.toString("ascii", 0, 4);
  const wave = buf.toString("ascii", 8, 12);
  if (riff !== "RIFF" || wave !== "WAVE") {
    throw new Error(`E_WAV_FORMAT: '${filePath}' is not a RIFF/WAVE file`);
  }

  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitDepth = 0;
  let dataStart = 0;
  let dataSize = 0;

  while (offset < buf.length - 8) {
    const chunkId = buf.toString("ascii", offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    if (chunkId === "fmt ") {
      const audioFormat = buf.readUInt16LE(offset + 8);
      if (audioFormat !== 1 && audioFormat !== 3) {
        throw new Error(`E_WAV_FORMAT: unsupported audio format ${audioFormat}`);
      }
      channels = buf.readUInt16LE(offset + 10);
      sampleRate = buf.readUInt32LE(offset + 12);
      bitDepth = buf.readUInt16LE(offset + 22);
    } else if (chunkId === "data") {
      dataStart = offset + 8;
      dataSize = chunkSize;
    }
    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset += 1;
  }

  if (sampleRate <= 0 || channels <= 0 || bitDepth <= 0 || dataStart <= 0) {
    throw new Error(`E_WAV_FORMAT: '${filePath}' is missing fmt/data chunks`);
  }

  const bytesPerSample = bitDepth / 8;
  const sampleCount = Math.floor(dataSize / bytesPerSample / channels);
  const samples = new Float64Array(sampleCount);

  for (let i = 0; i < sampleCount; i += 1) {
    const byteOffset = dataStart + i * channels * bytesPerSample;
    if (bitDepth === 16) {
      samples[i] = buf.readInt16LE(byteOffset) / 32768;
    } else if (bitDepth === 24) {
      const b0 = buf[byteOffset];
      const b1 = buf[byteOffset + 1];
      const b2 = buf[byteOffset + 2];
      const value = (b2 << 16) | (b1 << 8) | b0;
      samples[i] = (value > 0x7fffff ? value - 0x1000000 : value) / 8388608;
    } else if (bitDepth === 32) {
      samples[i] = buf.readInt32LE(byteOffset) / 2147483648;
    } else if (bitDepth === 8) {
      samples[i] = (buf[byteOffset] - 128) / 128;
    } else {
      throw new Error(`E_WAV_FORMAT: unsupported bit depth ${bitDepth}`);
    }
  }

  return { sampleRate, channels, bitDepth, samples };
}

export function durationSeconds(data: WavData): number {
  return data.sampleRate > 0 ? data.samples.length / data.sampleRate : 0;
}

export function resampleLinear(
  samples: Float64Array,
  fromRate: number,
  toRate: number,
): Float64Array {
  if (fromRate === toRate) return samples.slice();
  if (fromRate <= 0 || toRate <= 0 || samples.length === 0) return new Float64Array(0);
  const ratio = toRate / fromRate;
  const outLength = Math.max(1, Math.round(samples.length * ratio));
  const out = new Float64Array(outLength);
  for (let i = 0; i < outLength; i += 1) {
    const sourcePos = i / ratio;
    const left = Math.floor(sourcePos);
    const right = Math.min(left + 1, samples.length - 1);
    const frac = sourcePos - left;
    const a = samples[Math.min(left, samples.length - 1)];
    const b = samples[right];
    out[i] = a + (b - a) * frac;
  }
  return out;
}

export function trimSilence(
  samples: Float64Array,
  thresholdRatio: number,
  minWindowSamples: number,
): Float64Array {
  if (samples.length === 0) return new Float64Array(0);
  let maxAbs = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.abs(samples[i]);
    if (value > maxAbs) maxAbs = value;
  }
  if (maxAbs <= 0) return samples.slice();

  const threshold = maxAbs * Math.max(0, thresholdRatio);
  const window = Math.max(1, minWindowSamples);

  let start = 0;
  while (start < samples.length) {
    let hit = false;
    for (let i = start; i < Math.min(start + window, samples.length); i += 1) {
      if (Math.abs(samples[i]) >= threshold) {
        hit = true;
        break;
      }
    }
    if (hit) break;
    start += 1;
  }

  let end = samples.length;
  while (end > start) {
    let hit = false;
    for (let i = Math.max(start, end - window); i < end; i += 1) {
      if (Math.abs(samples[i]) >= threshold) {
        hit = true;
        break;
      }
    }
    if (hit) break;
    end -= 1;
  }

  return samples.slice(start, end);
}

export function normalizeRms(
  samples: Float64Array,
  targetRms: number,
): { samples: Float64Array; originalRms: number; scale: number } {
  if (samples.length === 0) {
    return { samples: new Float64Array(0), originalRms: 0, scale: 1 };
  }

  let sum = 0;
  let maxAbs = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const value = samples[i];
    sum += value * value;
    const abs = Math.abs(value);
    if (abs > maxAbs) maxAbs = abs;
  }
  const originalRms = Math.sqrt(sum / samples.length);
  if (originalRms <= 0 || targetRms <= 0) {
    return { samples: samples.slice(), originalRms, scale: 1 };
  }

  let scale = targetRms / originalRms;
  if (maxAbs > 0 && scale * maxAbs > 0.99) {
    scale = 0.99 / maxAbs;
  }
  const out = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    out[i] = samples[i] * scale;
  }
  return { samples: out, originalRms, scale };
}

export function estimateLag(
  reference: Float64Array,
  candidate: Float64Array,
  maxLagSamples: number,
): number {
  const maxLag = Math.max(
    0,
    Math.min(maxLagSamples, Math.min(reference.length, candidate.length) - 1),
  );
  let bestLag = 0;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let lag = -maxLag; lag <= maxLag; lag += 1) {
    let sum = 0;
    let count = 0;
    if (lag >= 0) {
      const limit = Math.min(reference.length, candidate.length - lag);
      for (let i = 0; i < limit; i += 1) {
        sum += reference[i] * candidate[i + lag];
        count += 1;
      }
    } else {
      const offset = -lag;
      const limit = Math.min(reference.length - offset, candidate.length);
      for (let i = 0; i < limit; i += 1) {
        sum += reference[i + offset] * candidate[i];
        count += 1;
      }
    }
    const score = count > 0 ? sum / count : Number.NEGATIVE_INFINITY;
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  return bestLag;
}

export function alignByLag(
  reference: Float64Array,
  candidate: Float64Array,
  lagSamples: number,
): { reference: Float64Array; candidate: Float64Array } {
  if (lagSamples >= 0) {
    const length = Math.min(reference.length, candidate.length - lagSamples);
    return {
      reference: reference.slice(0, Math.max(0, length)),
      candidate: candidate.slice(
        lagSamples,
        Math.max(lagSamples, lagSamples + length),
      ),
    };
  }

  const offset = -lagSamples;
  const length = Math.min(reference.length - offset, candidate.length);
  return {
    reference: reference.slice(offset, Math.max(offset, offset + length)),
    candidate: candidate.slice(0, Math.max(0, length)),
  };
}

export function rmsError(left: Float64Array, right: Float64Array): number {
  const length = Math.min(left.length, right.length);
  if (length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < length; i += 1) {
    const delta = left[i] - right[i];
    sum += delta * delta;
  }
  return Math.sqrt(sum / length);
}

export function maxAbsError(left: Float64Array, right: Float64Array): number {
  const length = Math.min(left.length, right.length);
  let max = 0;
  for (let i = 0; i < length; i += 1) {
    const delta = Math.abs(left[i] - right[i]);
    if (delta > max) max = delta;
  }
  return max;
}

export function correlation(left: Float64Array, right: Float64Array): number {
  const length = Math.min(left.length, right.length);
  if (length === 0) return 0;

  let sumL = 0;
  let sumR = 0;
  for (let i = 0; i < length; i += 1) {
    sumL += left[i];
    sumR += right[i];
  }
  const meanL = sumL / length;
  const meanR = sumR / length;

  let num = 0;
  let denL = 0;
  let denR = 0;
  for (let i = 0; i < length; i += 1) {
    const a = left[i] - meanL;
    const b = right[i] - meanR;
    num += a * b;
    denL += a * a;
    denR += b * b;
  }

  if (denL <= 0 || denR <= 0) return 0;
  return num / Math.sqrt(denL * denR);
}
