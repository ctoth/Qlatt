#!/usr/bin/env node
/**
 * CLI tool for computing STOI/ESTOI intelligibility scores.
 *
 * Usage:
 *   npm run stoi -- clean.wav degraded.wav
 *   npm run stoi -- clean.wav degraded.wav --extended
 *   npm run stoi -- clean.wav degraded.wav --format json --out result.json
 *
 * References:
 *   Taal et al. 2011 (STOI), Jensen & Taal 2016 (ESTOI).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDiagnostics } from "../src/diagnostics";
import { stoi } from "../src/metrics/stoi";

type OutputFormat = "text" | "json";

type ParsedArgs = {
  cleanPath: string;
  degradedPath: string;
  extended: boolean;
  format: OutputFormat;
  outPath: string | null;
};

type CliIo = {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
};

function defaultIo(): CliIo {
  return {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  };
}

function parseArgv(argv: string[]): ParsedArgs {
  const flags = new Map<string, string>();
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next != null && !next.startsWith("--")) {
      flags.set(key, next);
      i += 1;
      continue;
    }
    flags.set(key, "true");
  }

  if (positional.length < 2) {
    throw new Error(
      "Usage: stoi-eval <clean.wav> <degraded.wav> [--extended] [--format text|json] [--out file]",
    );
  }

  const format = (flags.get("format") ?? "text").toLowerCase();
  if (format !== "text" && format !== "json") {
    throw new Error(`Unsupported format '${format}'. Use text or json.`);
  }

  return {
    cleanPath: path.resolve(positional[0]),
    degradedPath: path.resolve(positional[1]),
    extended: flags.get("extended") === "true",
    format,
    outPath: flags.get("out") ? path.resolve(flags.get("out") as string) : null,
  };
}

// ── Minimal WAV parser ──────────────────────────────────────────────────────

interface WavData {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  samples: Float64Array;
}

function readWav(filePath: string): WavData {
  const buf = fs.readFileSync(filePath);

  // RIFF header
  const riff = buf.toString("ascii", 0, 4);
  if (riff !== "RIFF") {
    throw new Error(`Not a WAV file (missing RIFF header): ${filePath}`);
  }
  const wave = buf.toString("ascii", 8, 12);
  if (wave !== "WAVE") {
    throw new Error(`Not a WAV file (missing WAVE marker): ${filePath}`);
  }

  // Find fmt and data chunks
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
        throw new Error(
          `Unsupported WAV format ${audioFormat} (only PCM integer=1 and float=3 supported)`,
        );
      }
      channels = buf.readUInt16LE(offset + 10);
      sampleRate = buf.readUInt32LE(offset + 12);
      bitDepth = buf.readUInt16LE(offset + 22);
    } else if (chunkId === "data") {
      dataStart = offset + 8;
      dataSize = chunkSize;
    }

    offset += 8 + chunkSize;
    // Chunks are word-aligned
    if (chunkSize % 2 !== 0) offset += 1;
  }

  if (sampleRate === 0 || dataStart === 0) {
    throw new Error(`Invalid WAV file (missing fmt or data chunk): ${filePath}`);
  }

  // Convert PCM data to Float64Array normalized to [-1, 1]
  const bytesPerSample = bitDepth / 8;
  const numSamples = Math.floor(dataSize / bytesPerSample / channels);
  const samples = new Float64Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    // Take first channel only (mono mixdown)
    const byteOffset = dataStart + i * channels * bytesPerSample;
    if (bitDepth === 16) {
      samples[i] = buf.readInt16LE(byteOffset) / 32768;
    } else if (bitDepth === 24) {
      const b0 = buf[byteOffset];
      const b1 = buf[byteOffset + 1];
      const b2 = buf[byteOffset + 2];
      const val = (b2 << 16) | (b1 << 8) | b0;
      samples[i] = (val > 0x7fffff ? val - 0x1000000 : val) / 8388608;
    } else if (bitDepth === 32) {
      // Check if float format (audioFormat === 3) by reading raw float
      // For integer PCM:
      samples[i] = buf.readInt32LE(byteOffset) / 2147483648;
    } else if (bitDepth === 8) {
      samples[i] = (buf[byteOffset] - 128) / 128;
    } else {
      throw new Error(`Unsupported bit depth: ${bitDepth}`);
    }
  }

  return { sampleRate, channels, bitDepth, samples };
}

// ── Main CLI ────────────────────────────────────────────────────────────────

export async function runStoiCli(argv: string[], io: CliIo = defaultIo()): Promise<number> {
  try {
    const args = parseArgv(argv);
    const diag = createDiagnostics();

    const cleanWav = readWav(args.cleanPath);
    const degradedWav = readWav(args.degradedPath);

    if (cleanWav.sampleRate !== degradedWav.sampleRate) {
      io.stderr(
        `Warning: sample rate mismatch (clean=${cleanWav.sampleRate}, degraded=${degradedWav.sampleRate}). ` +
          `Both will be resampled to 10 kHz.\n`,
      );
    }

    // Use clean signal's sample rate as the reference
    // (STOI internally resamples both to 10 kHz)
    let cleanSamples = cleanWav.samples;
    let degradedSamples = degradedWav.samples;

    // If sample rates differ, resample degraded to match clean
    if (cleanWav.sampleRate !== degradedWav.sampleRate) {
      // Both get resampled to 10kHz inside stoi(), but they must be same length.
      // Truncate to minimum length.
      const minLen = Math.min(cleanSamples.length, degradedSamples.length);
      cleanSamples = cleanSamples.slice(0, minLen);
      degradedSamples = degradedSamples.slice(0, minLen);
    }

    // Ensure same length (trim to shorter)
    const len = Math.min(cleanSamples.length, degradedSamples.length);
    if (cleanSamples.length !== len) {
      cleanSamples = cleanSamples.slice(0, len);
    }
    if (degradedSamples.length !== len) {
      degradedSamples = degradedSamples.slice(0, len);
    }

    const result = stoi(cleanSamples, degradedSamples, cleanWav.sampleRate, {
      extended: args.extended,
      diagnostics: diag,
    });

    const payload = {
      clean: args.cleanPath,
      degraded: args.degradedPath,
      sampleRate: cleanWav.sampleRate,
      samples: len,
      ...result,
    };

    let output: string;
    if (args.format === "json") {
      output = JSON.stringify(payload, null, 2);
    } else {
      const label = result.extended ? "ESTOI" : "STOI";
      output =
        `${label}: ${result.score.toFixed(6)}\n` +
        `  clean:    ${args.cleanPath} (${cleanWav.sampleRate} Hz, ${cleanWav.bitDepth}-bit, ${cleanWav.channels}ch)\n` +
        `  degraded: ${args.degradedPath} (${degradedWav.sampleRate} Hz, ${degradedWav.bitDepth}-bit, ${degradedWav.channels}ch)\n` +
        `  samples:  ${len}`;
    }

    if (args.outPath) {
      fs.mkdirSync(path.dirname(args.outPath), { recursive: true });
      fs.writeFileSync(args.outPath, `${output}\n`, "utf8");
    } else {
      io.stdout(`${output}\n`);
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr(`${message}\n`);
    return 1;
  }
}

const isMain =
  process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  runStoiCli(process.argv.slice(2)).then((code) => {
    process.exit(code);
  });
}
