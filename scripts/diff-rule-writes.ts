#!/usr/bin/env node

/**
 * diff-rule-writes.ts
 * ===================
 * Attributes a change in frontend output to the rules whose writes changed.
 *
 * `--dump <file>` runs each phrase through each frontend and records, for
 * every Segment and feature, the ordered list of writes as `ruleId=value`.
 * `--compare <before> <after>` reads two such dumps and, for every
 * (frontend, phrase, segment, feature) whose write list differs, names the
 * rule at the first differing write. It prints per-rule counts with up to
 * three examples each.
 *
 * Phrases come from the two golden summaries and every DECtalk oracle corpus.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/diff-rule-writes.ts --dump before.json
 *   (change the engine or the rules)
 *   ... scripts/diff-rule-writes.ts --dump after.json
 *   ... scripts/diff-rule-writes.ts --compare before.json after.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrackDetailed } from "../src/tts-frontend.ts";

type Dump = Record<string, Record<string, Record<string, string[]> | { threw: string }>>;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRONTENDS = ["qlatt-english", "qlatt-beauty", "dectalk-english"];

function phrases(): string[] {
  const out = new Set<string>();
  for (const file of ["declarative-corpus-summary.json", "crystal-tempo-corpus-summary.json"]) {
    const golden = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "test", "golden", file), "utf8"),
    ) as { summaries: Array<{ phrase: string }> };
    for (const summary of golden.summaries) out.add(summary.phrase);
  }
  const corpora = path.join(repoRoot, "test", "oracle-corpora");
  for (const file of fs.readdirSync(corpora).filter((name) => name.endsWith(".json"))) {
    const corpus = JSON.parse(fs.readFileSync(path.join(corpora, file), "utf8")) as {
      entries: Array<{ text: string }>;
    };
    for (const entry of corpus.entries) out.add(entry.text);
  }
  return [...out];
}

function dump(): Dump {
  const result: Dump = {};
  for (const frontendId of FRONTENDS) {
    result[frontendId] = {};
    for (const phrase of phrases()) {
      try {
        const { utterance } = textToKlattTrackDetailed(phrase, undefined, 30, { frontendId });
        const writes: Record<string, string[]> = {};
        for (const item of utterance.relation("Segment").listItems()) {
          for (const key of item.featureKeys()) {
            writes[`${item.id} ${key}`] = item
              .writes(key)
              .map((write) => `${write.ruleId ?? "-"}=${JSON.stringify(write.value)}`);
          }
        }
        result[frontendId][phrase] = writes;
      } catch (error) {
        const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
        result[frontendId][phrase] = { threw: message };
      }
    }
  }
  return result;
}

function compare(before: Dump, after: Dump): void {
  const byRule = new Map<string, { count: number; phrases: Set<string>; examples: string[] }>();
  const note = (rule: string, phrase: string, example: string) => {
    const entry = byRule.get(rule) ?? { count: 0, phrases: new Set<string>(), examples: [] };
    entry.count += 1;
    entry.phrases.add(phrase);
    if (entry.examples.length < 3) entry.examples.push(example);
    byRule.set(rule, entry);
  };
  let phrasesChanged = 0;
  let phrasesTotal = 0;
  for (const frontendId of Object.keys(after)) {
    for (const [phrase, afterWrites] of Object.entries(after[frontendId])) {
      phrasesTotal += 1;
      const beforeWrites = before[frontendId]?.[phrase];
      const label = `${frontendId}: ${JSON.stringify(phrase)}`;
      if (!beforeWrites) continue;
      if ("threw" in beforeWrites || "threw" in afterWrites) {
        const was = "threw" in beforeWrites ? `threw (${String(beforeWrites.threw)})` : "ran";
        const now = "threw" in afterWrites ? `threw (${String(afterWrites.threw)})` : "ran";
        if (was !== now) {
          phrasesChanged += 1;
          note(`${frontendId} (whole phrase)`, phrase, `${label}: ${was} -> ${now}`);
        }
        continue;
      }
      let changed = false;
      const keys = new Set([...Object.keys(beforeWrites), ...Object.keys(afterWrites)]);
      for (const key of keys) {
        const left = (beforeWrites as Record<string, string[]>)[key] ?? [];
        const right = (afterWrites as Record<string, string[]>)[key] ?? [];
        const length = Math.max(left.length, right.length);
        let index = 0;
        while (index < length && left[index] === right[index]) index += 1;
        if (index === length) continue;
        changed = true;
        const rule = (right[index] ?? left[index]).split("=")[0];
        note(
          `${frontendId} ${rule}`,
          phrase,
          `${label} ${key}: ${left[index] ?? "(no write)"} -> ${right[index] ?? "(no write)"}`,
        );
      }
      if (changed) phrasesChanged += 1;
    }
  }
  console.log(`${phrasesChanged} of ${phrasesTotal} frontend-phrase pairs changed.`);
  const rows = [...byRule.entries()].sort((left, right) => right[1].count - left[1].count);
  for (const [rule, entry] of rows) {
    console.log(`\n${rule}: ${entry.count} writes in ${entry.phrases.size} phrases`);
    for (const example of entry.examples) console.log(`  ${example}`);
  }
}

const args = process.argv.slice(2);
if (args[0] === "--dump" && args[1]) {
  fs.writeFileSync(args[1], JSON.stringify(dump()));
} else if (args[0] === "--compare" && args[1] && args[2]) {
  compare(
    JSON.parse(fs.readFileSync(args[1], "utf8")) as Dump,
    JSON.parse(fs.readFileSync(args[2], "utf8")) as Dump,
  );
} else {
  console.error("usage: diff-rule-writes.ts --dump <file> | --compare <before> <after>");
  process.exit(2);
}
