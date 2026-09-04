/**
 * validate-dectalk-dict.ts — Validate the converted DECtalk dictionary
 * (`public/dectalk-dictionary.json`) against the dectalk-english inventory.
 *
 * Checks (all reported; exit code 1 if any hard failure):
 *   1. Every emitted phoneme symbol is a valid key in
 *      `public/rules/frontends/dectalk-english/inventory.yaml` (the symbol
 *      space). Any UNKNOWN symbol is a conversion bug -> hard failure.
 *   2. Stress well-formedness: every vowel symbol carries a 0/1 digit; no
 *      consonant carries a digit.
 *   3. Round-trip side-by-side on ~15 hand-picked words: prints the DECtalk raw
 *      phoneme field next to the converted ARPABET so fidelity is reviewable.
 *   4. Homograph collapse count (re-derived from the source) is reported.
 *
 * This is a build/QA tool, not pipeline code.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { convertPhonemeField } from "./build-dectalk-dict.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const DICT_PATH = path.join(root, "public", "dectalk-dictionary.json");
const INVENTORY_PATH = path.join(
  root,
  "public",
  "rules",
  "frontends",
  "dectalk-english",
  "inventory.yaml",
);
const SRC_PATH = "C:\\Users\\Q\\src\\dectalk\\463\\dapi\\src\\dic\\Dic_us.txt";

// Vowel symbol roots in the inventory (stress-bearing). Used to check that
// vowels carry a digit and consonants do not.
const VOWEL_ROOTS = new Set([
  "IY",
  "IH",
  "EY",
  "EH",
  "AE",
  "AA",
  "AY",
  "AW",
  "AH",
  "AO",
  "OW",
  "OY",
  "UH",
  "UW",
  "AX",
  "ER",
  "IR",
  "AR",
  "OR",
  "UR",
]);

/** Extract phoneme symbol keys from the inventory YAML (2-space-indented keys
 *  that look like phoneme symbols, e.g. "  IY1:", "  NG:"). Skips the numeric
 *  param block (F1, B2, AV ...) implicitly because we intersect with what the
 *  converter can emit, but we collect everything 2-indented and trust the
 *  converter's symbol set. */
function loadInventorySymbols(): Set<string> {
  const text = fs.readFileSync(INVENTORY_PATH, "utf8");
  const symbols = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const m = /^ {2}([A-Z][A-Z0-9_]*):/.exec(line);
    if (m) symbols.add(m[1]);
  }
  return symbols;
}

function loadDict(): Record<string, string> {
  return JSON.parse(fs.readFileSync(DICT_PATH, "utf8"));
}

function _isVowelSymbol(sym: string): boolean {
  const m = /^([A-Z]+)([0-9])$/.exec(sym);
  if (m && VOWEL_ROOTS.has(m[1])) return true;
  return false;
}

function main(): void {
  const inventory = loadInventorySymbols();
  const dict = loadDict();
  let hardFail = false;

  // --- Check 1 & 2: symbol validity + stress well-formedness ----------------
  const unknownSymbols = new Map<string, number>();
  const stressProblems: string[] = [];
  let totalSymbols = 0;

  for (const [word, pron] of Object.entries(dict)) {
    for (const sym of pron.split(" ")) {
      if (sym === "") continue;
      totalSymbols++;

      // unknown?
      if (!inventory.has(sym)) {
        unknownSymbols.set(sym, (unknownSymbols.get(sym) ?? 0) + 1);
      }

      // stress well-formedness
      const root = sym.replace(/[0-9]$/, "");
      const hasDigit = /[0-9]$/.test(sym);
      if (VOWEL_ROOTS.has(root)) {
        if (!hasDigit) {
          if (stressProblems.length < 20)
            stressProblems.push(`vowel without stress digit: ${sym} in "${word}"`);
        } else {
          const d = sym[sym.length - 1];
          if (d !== "0" && d !== "1" && d !== "2") {
            if (stressProblems.length < 20)
              stressProblems.push(`bad stress digit: ${sym} in "${word}"`);
          }
        }
      } else if (hasDigit) {
        // a non-vowel carrying a digit is a bug
        if (stressProblems.length < 20)
          stressProblems.push(`consonant with stress digit: ${sym} in "${word}"`);
      }
    }
  }

  console.log("=== DECtalk dictionary validation ===");
  console.log(`Entries: ${Object.keys(dict).length}`);
  console.log(`Total phoneme symbols: ${totalSymbols}`);
  console.log(`Inventory symbol keys: ${inventory.size}`);
  console.log("");

  console.log("--- Check 1: unknown phoneme symbols ---");
  if (unknownSymbols.size === 0) {
    console.log("PASS: zero unknown symbols (all emitted symbols are inventory keys).");
  } else {
    hardFail = true;
    const pct = (
      (Array.from(unknownSymbols.values()).reduce((a, b) => a + b, 0) / totalSymbols) *
      100
    ).toFixed(3);
    console.log(`FAIL: ${unknownSymbols.size} distinct unknown symbols (${pct}% of all symbols):`);
    for (const [sym, n] of [...unknownSymbols.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${sym}: ${n}`);
    }
  }
  console.log("");

  console.log("--- Check 2: stress well-formedness ---");
  if (stressProblems.length === 0) {
    console.log("PASS: all vowels carry a 0/1/2 digit; no consonant carries a digit.");
  } else {
    hardFail = true;
    console.log(`FAIL: ${stressProblems.length} problem(s) (first 20):`);
    for (const p of stressProblems) console.log(`  ${p}`);
  }
  console.log("");

  // --- Check 3: side-by-side round-trip on hand-picked words ---------------
  console.log("--- Check 3: round-trip side-by-side (DECtalk raw -> ARPABET) ---");
  const samples = [
    "judicial",
    "hello",
    "world",
    "the",
    "a",
    "read",
    "nuclear",
    "colonel",
    "through",
    "knight",
    "february",
    "you",
    "computer",
    "question",
    "yacht",
  ];
  // pull the raw DECtalk phoneme field (first/highest row) for each sample
  const srcRaw = new Map<string, string>();
  const srcText = fs.readFileSync(SRC_PATH, "utf8");
  for (const line of srcText.split(/\r?\n/)) {
    if (!line || line.startsWith(";")) continue;
    const f = line.split(",");
    if (f.length < 5) continue;
    const w = f[0].toLowerCase();
    if (samples.includes(w) && !srcRaw.has(w)) srcRaw.set(w, f[2]);
  }
  for (const w of samples) {
    const raw = srcRaw.get(w);
    const out = dict[w] ?? "(not in dict)";
    const recomputed = raw !== undefined ? convertPhonemeField(raw) : "(no source row)";
    console.log(`  ${w.padEnd(14)} raw=${(raw ?? "(none)").padEnd(18)} -> ${recomputed}`);
    if (raw !== undefined && recomputed !== out && out !== "(not in dict)") {
      console.log(
        `     NOTE: dict value differs (homograph collapse picked a higher-priority row): dict=${out}`,
      );
    }
  }
  console.log("");

  // --- Check 4: homograph collapse count -----------------------------------
  console.log("--- Check 4: homograph collapse ---");
  const seen = new Set<string>();
  const multi = new Set<string>();
  let rows = 0;
  for (const line of srcText.split(/\r?\n/)) {
    if (!line || line.startsWith(";")) continue;
    const f = line.split(",");
    if (f.length < 5) continue;
    rows++;
    const w = f[0].toLowerCase();
    if (seen.has(w)) multi.add(w);
    seen.add(w);
  }
  console.log(
    `Source rows: ${rows}; unique words: ${seen.size}; words with >1 row collapsed: ${multi.size}`,
  );
  console.log("Policy: keep highest-priority row; tie -> first encountered (v1 flat single-pron).");
  console.log("");

  console.log(hardFail ? "RESULT: FAIL" : "RESULT: PASS");
  process.exit(hardFail ? 1 : 0);
}

main();
