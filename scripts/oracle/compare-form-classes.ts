#!/usr/bin/env node

/**
 * compare-form-classes.ts
 * =======================
 * Compares the form classes the dectalk-english g2p path gives each word of
 * test/fixtures/dectalk-oracle/dectalk-us-form-classes-v1.json with DECtalk's
 * (scripts/oracle/export-form-class-fixture.ts) and prints every difference
 * with the layer that pronounced the word.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-form-classes.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pronounce } from "../../src/g2p";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const readJson = <T>(...parts: string[]): T =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, ...parts), "utf8")) as T;

const recorded = readJson<{ entries: Record<string, string> }>(
  "test",
  "fixtures",
  "dectalk-oracle",
  "dectalk-us-form-classes-v1.json",
).entries;
const names = readJson<{ formClassNames: (string | null)[] }>(
  "public",
  "rules",
  "frontends",
  "dectalk-english",
  "lts-table.json",
).formClassNames;
const dictionary = readJson<Record<string, string>>("public", "dectalk-dictionary.json");
const lookup = (word: string): string[] | null => dictionary[word]?.split(" ") ?? null;
const options = {
  ltsPath: "/rules/frontends/dectalk-english/lts-table.json",
  morphologyPath: "/rules/frontends/qlatt-english/morphology.yaml",
  stressPolicyPath: "/rules/frontends/qlatt-english/stress-policy.yaml",
};
const named = (bits: string): string =>
  bits === ""
    ? "unknown"
    : bits
        .split(" ")
        .map((bit) => names[Number(bit)] ?? `bit${bit}`)
        .join(" ");

const bySource: Record<string, { words: number; wrong: number }> = {};
for (const [word, bits] of Object.entries(recorded)) {
  const result = pronounce(word, lookup, options);
  const mine = (result.formClasses ?? []).map((name) => names.indexOf(name).toString()).join(" ");
  bySource[result.source] ??= { words: 0, wrong: 0 };
  bySource[result.source].words += 1;
  if (mine === bits) continue;
  bySource[result.source].wrong += 1;
  console.log(`${word} (${result.source}): DECtalk [${named(bits)}] | frontend [${named(mine)}]`);
}
console.log(JSON.stringify(bySource));
