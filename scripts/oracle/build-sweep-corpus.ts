#!/usr/bin/env node

/**
 * build-sweep-corpus.ts
 * =====================
 * Turns a sweep list (the *.txt files of test/oracle-corpora/<corpusId>/, in
 * name order: one utterance per line under `## <group>` headings; a group
 * stays within one file) into the oracle corpus
 * test/oracle-corpora/<corpusId>.json that
 * scripts/oracle/export-dectalk-vtm-fixture.ts and
 * scripts/oracle/compare-dectalk-voices.ts read. Entry ids are
 * `<group>-<three-digit number within the group>`.
 *
 * The list is the source; the JSON is generated and never edited by hand.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/build-sweep-corpus.ts [--corpus dectalk-us-sweep-v1] [--write | --check]
 *
 * Without a flag it prints the entry count per group. --write writes the JSON;
 * --check exits 1 if the JSON is not what the list gives.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { OracleCorpusDocument } from "./types.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const corpusId = flag("corpus") ?? "dectalk-us-sweep-v1";
const corporaDir = path.join(repoRoot, "test", "oracle-corpora");
const listDir = path.join(corporaDir, corpusId);
const jsonPath = path.join(corporaDir, `${corpusId}.json`);

function buildCorpus(): OracleCorpusDocument {
  const entries: OracleCorpusDocument["entries"] = [];
  const seen = new Map<string, string>();
  let group: string | undefined;
  let inGroup = 0;
  const lines = fs
    .readdirSync(listDir)
    .filter((name) => name.endsWith(".txt"))
    .sort()
    .flatMap((name) =>
      fs
        .readFileSync(path.join(listDir, name), "utf8")
        .split(/\r?\n/)
        .map((raw, index) => ({ raw, where: `${path.join(listDir, name)}:${index + 1}` })),
    );
  if (lines.length === 0) throw new Error(`${listDir} has no .txt list`);
  lines.forEach(({ raw, where }) => {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      group = line.slice(3).trim();
      if (!/^[a-z][a-z0-9-]*$/.test(group)) throw new Error(`${where}: bad group name`);
      inGroup = 0;
      return;
    }
    if (line.length === 0 || line.startsWith("#")) return;
    if (!group) throw new Error(`${where}: an utterance before the first group`);
    // A bracket would be read by say.exe as an inline command.
    if (/[[\]]/.test(line)) throw new Error(`${where}: brackets are DECtalk commands`);
    const earlier = seen.get(line);
    if (earlier) throw new Error(`${where}: same utterance as ${earlier}`);
    inGroup += 1;
    const id = `${group}-${String(inGroup).padStart(3, "0")}`;
    seen.set(line, id);
    entries.push({ id, text: line, group });
  });
  return {
    schemaVersion: "v1",
    corpusId,
    defaults: {
      voiceId: "paul",
      rate: 180,
      sampleRate: 11025,
      frontendId: "dectalk-english",
      transitionMs: 30,
    },
    entries,
  };
}

const corpus = buildCorpus();
const rendered = `${JSON.stringify(corpus, null, 2)}\n`;

if (argv.includes("--write")) {
  fs.writeFileSync(jsonPath, rendered);
  console.log(`wrote ${jsonPath} (${corpus.entries.length} entries)`);
} else if (argv.includes("--check")) {
  const current = fs.existsSync(jsonPath) ? fs.readFileSync(jsonPath, "utf8") : "";
  // The repository's formatter may lay the same document out differently.
  const same = current.length > 0 && JSON.stringify(JSON.parse(current)) === JSON.stringify(corpus);
  console.log(same ? `${jsonPath} is current` : `${jsonPath} is stale: run with --write`);
  process.exit(same ? 0 : 1);
} else {
  const counts = new Map<string, number>();
  for (const entry of corpus.entries) counts.set(entry.group, (counts.get(entry.group) ?? 0) + 1);
  for (const [group, count] of counts) console.log(`${group.padEnd(20)} ${count}`);
  console.log(`${"total".padEnd(20)} ${corpus.entries.length}`);
}
