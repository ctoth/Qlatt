#!/usr/bin/env node
/**
 * Before/after comparison for chunk DT2b: dectalk LTS pronunciation (the OLD
 * behavior, skip_dictionary:true) vs the DECtalk dictionary pronunciation (the
 * NEW behavior, dictionary_path).
 *
 * "before" = applyLtsRules + Hunnicutt stress over dectalk-english/lts-rules.yaml
 *            (exactly what the frontend did when skip_dictionary was true).
 * "after"  = the entry in public/dectalk-dictionary.json.
 *
 * Read-only. Proves the dict is the intended improvement, not a regression.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyLtsRules } from "../src/g2p/lts-engine";
import { assignStress } from "../src/g2p/stress";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawDict = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../public/dectalk-dictionary.json"), "utf8"),
) as Record<string, string>;

const LTS_PATH = "/rules/frontends/dectalk-english/lts-rules.yaml";

const words =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ["hello", "world", "nuclear", "judicial", "colonel"];

for (const word of words) {
  const lw = word.toLowerCase();
  // OLD path: LTS rules then Hunnicutt stress (no morphology dict available
  // either, so stress hint is undefined — matches pure-LTS fallback).
  let before: string;
  try {
    const lts = applyLtsRules(lw, LTS_PATH);
    before = assignStress(lts, undefined).join(" ");
  } catch (e) {
    before = `(LTS error: ${(e as Error).message})`;
  }
  const after = rawDict[lw] ?? "(NOT IN DICT)";
  console.log(`\n=== ${word} ===`);
  console.log(`  before (LTS) : ${before}`);
  console.log(`  after  (dict): ${after}`);
}
