#!/usr/bin/env node

/**
 * export-phoneme-fixture.ts
 * =========================
 * Copy DECtalk's phoneme log (`say.exe -lp`) for every corpus entry out of an
 * oracle run directory into one small checked-in fixture, so the phoneme-string
 * gate (test/dectalk-oracle-gate.test.ts) can run without say.exe and without
 * rendering audio.
 *
 * The fixture stores the raw log text exactly as DECtalk printed it. Parsing
 * stays in scripts/oracle/symbolic.ts so a parser change is also under test.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/export-phoneme-fixture.ts \
 *     --oracle-root test/oracle-output/<run>/<corpusId> \
 *     [--corpus test/oracle-corpora/dectalk-us-v1.json] \
 *     [--out test/fixtures/dectalk-oracle/<corpusId>.phonemes.json]
 *
 * Fails if any corpus entry has no phoneme log: a partial fixture would let
 * the gate skip phrases silently.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { OracleCorpusDocument } from "./types";

function parseArgs(argv: string[]): Map<string, string> {
  const out = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const next = argv[i + 1];
    if (next != null && !next.startsWith("--")) {
      out.set(key.slice(2), next);
      i += 1;
    } else {
      out.set(key.slice(2), "true");
    }
  }
  return out;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = parseArgs(process.argv.slice(2));
const oracleRootArg = args.get("oracle-root");
if (!oracleRootArg) {
  throw new Error(
    "Usage: export-phoneme-fixture --oracle-root <run>/<corpusId> [--corpus path] [--out path]",
  );
}
const oracleRoot = path.resolve(oracleRootArg);
const corpusPath = path.resolve(
  args.get("corpus") ?? path.join(repoRoot, "test", "oracle-corpora", "dectalk-us-v1.json"),
);
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8")) as OracleCorpusDocument;
const outPath = path.resolve(
  args.get("out") ??
    path.join(repoRoot, "test", "fixtures", "dectalk-oracle", `${corpus.corpusId}.phonemes.json`),
);

const missing: string[] = [];
const entries: Record<string, { text: string; phonemeLog: string }> = {};
for (const entry of corpus.entries) {
  const logPath = path.join(oracleRoot, entry.id, "oracle", "oracle.phonemes.txt");
  if (!fs.existsSync(logPath)) {
    missing.push(entry.id);
    continue;
  }
  const phonemeLog = fs.readFileSync(logPath, "utf8").replace(/\r?\n/g, "").trimEnd();
  if (phonemeLog.length === 0) {
    missing.push(entry.id);
    continue;
  }
  entries[entry.id] = { text: entry.text, phonemeLog };
}
if (missing.length > 0) {
  throw new Error(`E_ORACLE_PHONEME_LOG_MISSING: ${missing.join(", ")}`);
}

const fixture = {
  schemaVersion: "v1",
  corpusId: corpus.corpusId,
  engine: "DECtalk 4.63 say.exe -lp",
  entries,
};
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
process.stdout.write(`wrote ${outPath} (${Object.keys(entries).length} entries)\n`);
