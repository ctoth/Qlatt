import fs from "node:fs";
import path from "node:path";
import type { Diagnostics } from "../diagnostics.ts";
import type { WavEncodingStats } from "./types.ts";

function encode(samples: ArrayLike<number>, diagnostics?: Diagnostics, filePath?: string) {
  const stats: WavEncodingStats = { finitePeak: 0, clippedSamples: 0, invalidSamples: 0 };
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const value = samples[i];
    if (!Number.isFinite(value)) {
      stats.invalidSamples += 1;
      continue;
    }
    stats.finitePeak = Math.max(stats.finitePeak, Math.abs(value));
    if (Math.abs(value) > 1) stats.clippedSamples += 1;
    const s = Math.max(-1, Math.min(1, value));
    out[i] = Math.round(s * 32767);
  }
  if (stats.invalidSamples > 0) {
    const message = `PCM encoding rejected ${stats.invalidSamples} nonfinite samples (${stats.clippedSamples} finite clipped samples)`;
    diagnostics?.error(message, { path: filePath, ...stats }, "E_PCM_NONFINITE");
    throw new Error(`E_PCM_NONFINITE: ${message}`);
  }
  return { pcm: out, stats };
}

export function toInt16(samples: ArrayLike<number>): Int16Array {
  return encode(samples).pcm;
}

export function writeWav(
  filePath: string,
  samples: ArrayLike<number>,
  sampleRate: number,
  diagnostics?: Diagnostics,
): WavEncodingStats {
  const { pcm, stats } = encode(samples, diagnostics, filePath);
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataSize = pcm.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < pcm.length; i += 1) {
    buffer.writeInt16LE(pcm[i], 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  if (stats.clippedSamples > 0) {
    diagnostics?.warn(
      "Finite samples clipped to [-1, 1] during PCM encoding",
      { path: filePath, ...stats },
      "W_PCM_CLIPPING",
    );
  }
  return stats;
}
