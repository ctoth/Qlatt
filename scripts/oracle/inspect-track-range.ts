#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

type TrackEvent = {
  time?: number;
  phoneme?: string;
  word?: string;
  params?: Record<string, unknown>;
};

function parseArgs(argv: string[]) {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const next = argv[i + 1];
    if (next != null && !next.startsWith("--")) {
      flags.set(arg.slice(2), next);
      i += 1;
      continue;
    }
    flags.set(arg.slice(2), "true");
  }

  if (flags.has("help") || !flags.has("file")) {
    throw new Error(
      "Usage: inspect-track-range --file payload.json [--start-ms 0] [--end-ms 100] [--fields SW,AF,AH,AV,F0]",
    );
  }

  return {
    file: path.resolve(flags.get("file") as string),
    startMs: Number(flags.get("start-ms") ?? 0),
    endMs: Number(flags.get("end-ms") ?? Number.POSITIVE_INFINITY),
    fields: (flags.get("fields") ?? "SW,AF,AH,AV,F0")
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean),
  };
}

function main(): number {
  try {
    const args = parseArgs(process.argv.slice(2));
    const payload = JSON.parse(fs.readFileSync(args.file, "utf8")) as {
      track?: TrackEvent[];
    };
    const track = Array.isArray(payload.track) ? payload.track : [];
    const startSec = args.startMs / 1000;
    const endSec = Number.isFinite(args.endMs) ? args.endMs / 1000 : Number.POSITIVE_INFINITY;

    const rows = track
      .filter((event) => typeof event?.time === "number")
      .filter((event) => (event.time as number) >= startSec && (event.time as number) <= endSec)
      .map((event) => {
        const params = event.params && typeof event.params === "object" ? event.params : {};
        const values: Record<string, unknown> = {
          timeMs: Math.round((event.time as number) * 1000),
          phoneme: event.phoneme ?? null,
          word: event.word ?? null,
        };
        for (const field of args.fields) {
          values[field] = params[field] ?? null;
        }
        return values;
      });

    process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    return 1;
  }
}

process.exit(main());
