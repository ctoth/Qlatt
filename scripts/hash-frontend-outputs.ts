#!/usr/bin/env node

/**
 * hash-frontend-outputs.ts
 * ========================
 * A before-and-after control for a change that must not change what any
 * frontend makes of a text: every text of every corpus in
 * test/oracle-corpora, spoken by each frontend of
 * public/rules/frontends/manifest.json, and for each the SHA-256 of
 *   - the track (every frame, time and parameters),
 *   - the decisions (every field but the wall-clock timestamp),
 *   - the diagnostics (level, code, message, data),
 *   - the frames: the track without the ids of the decisions its frames
 *     name, which a single added decision record renumbers.
 *
 * A corpus entry's own voice and rate are used for the frontend the corpus
 * names (the page's path: rate as a multiple of 180 words per minute, the
 * voice as the speaker); the other frontends speak the text with their
 * defaults. A text a frontend cannot speak is recorded with its error.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/hash-frontend-outputs.ts --out <file> [--jobs 12] [--only <part of a corpus file name>]
 *   ... scripts/hash-frontend-outputs.ts --compare <before> <after>
 *   ... scripts/hash-frontend-outputs.ts --dump <text> [--frontend <id>] [--out <file>]
 *
 * --out writes one line a text and frontend: corpus, id, frontend and the
 * three hashes, sorted. --compare prints the lines that differ and which of
 * the three hashes differ, and exits 1 when any does (a line in one file
 * only is a difference, so compare files made with the same --only).
 *
 * A measurement tool; nothing in the build depends on it.
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const corporaDir = path.join(repoRoot, "test", "oracle-corpora");
const NEUTRAL_RATE_WPM = 180;

type Text = {
  corpus: string;
  id: string;
  text: string;
  frontendId?: string;
  voiceId?: string;
  rate?: number;
  transitionMs?: number;
};

/** The corpus files to read: all, or those `--only <text>` names a part of. */
const onlyAt = process.argv.indexOf("--only");
const only = onlyAt >= 0 ? process.argv[onlyAt + 1] : undefined;

function corpusTexts(): Text[] {
  const texts: Text[] = [];
  for (const name of fs.readdirSync(corporaDir).sort()) {
    const file = path.join(corporaDir, name);
    if (fs.statSync(file).isDirectory()) continue;
    if (only !== undefined && !name.includes(only)) continue;
    if (name.endsWith(".json")) {
      const document = JSON.parse(fs.readFileSync(file, "utf8")) as {
        defaults?: Partial<Text>;
        entries?: (Partial<Text> & { id: string; text: string })[];
      };
      for (const entry of document.entries ?? []) {
        texts.push({
          corpus: name,
          id: entry.id,
          text: entry.text,
          frontendId: entry.frontendId ?? document.defaults?.frontendId,
          voiceId: entry.voiceId ?? document.defaults?.voiceId,
          rate: entry.rate ?? document.defaults?.rate,
          transitionMs: entry.transitionMs ?? document.defaults?.transitionMs,
        });
      }
    } else if (name.endsWith(".txt")) {
      // One text a line; a line that begins with "#" is a comment.
      fs.readFileSync(file, "utf8")
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "" && !line.startsWith("#"))
        .forEach((line, index) => {
          texts.push({ corpus: name, id: `line-${(index + 1).toString()}`, text: line });
        });
    }
  }
  return texts;
}

function frontendIds(): string[] {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "public", "rules", "frontends", "manifest.json"), "utf8"),
  ) as { frontends: { id: string }[] };
  return manifest.frontends.map((frontend) => frontend.id);
}

const sha = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 20);

async function runShard(shard: number, shards: number, out: string): Promise<void> {
  const { textToKlattTrackDetailed } = await import("../src/tts-frontend");
  const { createProvenanceCollector } = await import("../src/provenance");
  const { createDiagnostics } = await import("../src/diagnostics");
  const lines: string[] = [];
  const frontends = frontendIds();
  corpusTexts().forEach((text, index) => {
    if (index % shards !== shard) return;
    for (const frontendId of frontends) {
      const own = (text.frontendId ?? "dectalk-english") === frontendId;
      const provenance = createProvenanceCollector();
      const diagnostics = createDiagnostics({ maxEntries: 1000000 });
      let hashes: string;
      try {
        const result = textToKlattTrackDetailed(text.text, undefined, text.transitionMs ?? 30, {
          frontendId,
          ...(own && text.voiceId !== undefined ? { speaker: text.voiceId } : {}),
          ...(own && text.rate !== undefined ? { rate: text.rate / NEUTRAL_RATE_WPM } : {}),
          provenance,
          diagnostics,
        });
        hashes = [
          sha(result.track),
          sha(
            provenance.getDecisions().map(({ timestampMs: _timestamp, ...decision }) => decision),
          ),
          sha(
            diagnostics
              .getEntries()
              .map(({ level, code, message, data }) => ({ level, code, message, data })),
          ),
          // The track again without the ids of the decisions its frames
          // name: one decision record more or less renumbers them all.
          createHash("sha256")
            .update(JSON.stringify(result.track).replace(/"d[0-9]{6,}"/g, '"d"'))
            .digest("hex")
            .slice(0, 20),
        ].join(" ");
      } catch (error) {
        hashes = `error ${sha(error instanceof Error ? error.message : String(error))} -`;
      }
      lines.push(`${text.corpus}\t${text.id}\t${frontendId}\t${hashes}`);
    }
  });
  fs.writeFileSync(out, lines.join("\n"));
}

function compare(beforePath: string, afterPath: string): number {
  const read = (file: string): Map<string, string[]> =>
    new Map(
      fs
        .readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => line !== "")
        .map((line) => {
          const [corpus, id, frontend, hashes] = line.split("\t");
          return [`${corpus}\t${id}\t${frontend}`, (hashes ?? "").split(" ")] as const;
        }),
    );
  const before = read(beforePath);
  const after = read(afterPath);
  const parts = ["track", "decisions", "diagnostics", "frames"];
  const counts = { track: 0, decisions: 0, diagnostics: 0, frames: 0, missing: 0 };
  let shown = 0;
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const a = before.get(key);
    const b = after.get(key);
    if (!a || !b) {
      counts.missing += 1;
      console.log(`${key}\t${a ? "only before" : "only after"}`);
      continue;
    }
    // A file written before a hash was added has no such column: not compared.
    const differing = parts.filter(
      (_part, index) => a[index] !== undefined && b[index] !== undefined && a[index] !== b[index],
    );
    if (differing.length === 0) continue;
    for (const part of differing) counts[part as "track"] += 1;
    // Every line whose frames differ is shown; of the others the first 60.
    if (shown < 60 || differing.includes("frames")) console.log(`${key}\t${differing.join(", ")}`);
    shown += 1;
  }
  console.log(
    JSON.stringify({ before: before.size, after: after.size, linesDiffering: shown, ...counts }),
  );
  return shown + counts.missing === 0 ? 0 : 1;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const arg = (name: string): string | undefined => {
    const at = argv.indexOf(`--${name}`);
    return at >= 0 ? argv[at + 1] : undefined;
  };
  if (argv.includes("--compare")) {
    const at = argv.indexOf("--compare");
    process.exitCode = compare(argv[at + 1] as string, argv[at + 2] as string);
    return;
  }
  const dump = arg("dump");
  if (dump !== undefined) {
    // What is hashed for one text, written out: to see what a differing hash
    // differs in (run it on both trees and compare the two outputs).
    const { textToKlattTrackDetailed } = await import("../src/tts-frontend");
    const { createProvenanceCollector } = await import("../src/provenance");
    const provenance = createProvenanceCollector();
    const result = textToKlattTrackDetailed(dump, undefined, 30, {
      frontendId: arg("frontend") ?? "dectalk-english",
      provenance,
    });
    const lines = [
      ...result.track.map((frame) => `frame\t${JSON.stringify(frame)}`),
      ...provenance
        .getDecisions()
        .map(({ timestampMs: _timestamp, ...decision }) => `decision\t${JSON.stringify(decision)}`),
    ];
    const dumpOut = arg("out");
    if (dumpOut) fs.writeFileSync(dumpOut, `${lines.join("\n")}\n`);
    else console.log(lines.join("\n"));
    return;
  }
  const out = arg("out");
  if (!out) {
    throw new Error(
      "Usage: --out <file> [--jobs N] | --compare <before> <after> | --dump <text> [--frontend <id>]",
    );
  }
  const shard = arg("shard");
  const jobs = Number(arg("jobs") ?? "12");
  if (shard !== undefined) {
    await runShard(Number(shard), jobs, out);
    return;
  }
  const parts = Array.from({ length: jobs }, (_unused, index) => `${out}.${index.toString()}`);
  await Promise.all(
    parts.map(
      (part, index) =>
        new Promise<void>((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [
              ...process.execArgv,
              fileURLToPath(import.meta.url),
              "--out",
              part,
              "--shard",
              index.toString(),
              "--jobs",
              jobs.toString(),
              ...(only === undefined ? [] : ["--only", only]),
            ],
            { stdio: ["ignore", "ignore", "inherit"] },
          );
          child.on("error", reject);
          child.on("exit", (code) =>
            code === 0
              ? resolve()
              : reject(new Error(`shard ${index.toString()} exited ${String(code)}`)),
          );
        }),
    ),
  );
  const lines = parts
    .flatMap((part) => fs.readFileSync(part, "utf8").split("\n"))
    .filter((line) => line !== "")
    .sort();
  fs.writeFileSync(out, `${lines.join("\n")}\n`);
  for (const part of parts) fs.rmSync(part);
  const errors = lines.filter((line) => line.split("\t")[3]?.startsWith("error")).length;
  console.log(JSON.stringify({ texts: corpusTexts().length, lines: lines.length, errors, out }));
}

await main();
