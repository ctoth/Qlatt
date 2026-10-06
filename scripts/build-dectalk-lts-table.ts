/**
 * build-dectalk-lts-table.ts
 * ==========================
 * Copies DECtalk 4.63's compiled letter-to-sound rule tables out of its source
 * tree into a data file the frontend's table interpreter reads
 * (src/g2p/table-lts.ts). The tables are not decompiled: the interpreter runs
 * the same words and bytes DECtalk's does (LTS/l_us_ru1.c).
 *
 * Two tables exist. DECtalk's US English build defines ACNA
 * (dapi/src/dectalk.dsp), so LTS/ls_rule.h selects `acna_lswtab` and
 * `acna_lsbtab` from LTS/lsa_rta.c, with five words per rule record: language
 * tag, rest of the matched graphemes, replacement, left environment, right
 * environment. Without ACNA it selects `lswtab` and `lsbtab` from
 * LTS/l_us_rta.c with four words per record (no language tag).
 *
 * Also copied: the grapheme feature table `feats[]` (LTS/l_us_con.c:1063).
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/build-dectalk-lts-table.ts [--table acna|plain] \
 *     [--dectalk C:/Users/Q/src/dectalk/463] [--out <file>]
 *
 * Output: public/rules/frontends/dectalk-english/lts-table.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const dectalkRoot = path.resolve(
  flag("dectalk") ?? process.env.DECTALK_SOURCE_ROOT ?? "C:/Users/Q/src/dectalk/463",
);
const which = flag("table") ?? "acna";
if (which !== "acna" && which !== "plain") throw new Error("--table must be acna or plain");
const outPath = path.resolve(
  flag("out") ??
    path.join(repoRoot, "public", "rules", "frontends", "dectalk-english", "lts-table.json"),
);

const ltsDir = path.join(dectalkRoot, "dapi", "src", "LTS");
const read = (file: string): string => fs.readFileSync(path.join(ltsDir, file), "utf8");
const stripComments = (text: string): string =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

/** The initializer of the LAST array definition named `name` (others sit in dead #ifdef arms). */
function arrayBody(source: string, name: string): string {
  const pattern = new RegExp(`\\b${name}\\s*\\[\\]\\s*=\\s*\\{`, "g");
  let start = -1;
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    start = match.index + match[0].length;
  }
  if (start < 0) throw new Error(`E_TABLE_MISSING: ${name}`);
  const end = source.indexOf("};", start);
  return stripComments(source.slice(start, end)).replace(/^\s*#.*$/gm, "");
}

function numbers(body: string): number[] {
  return body
    .split(",")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
    .map((cell) => {
      const value = Number(cell);
      if (!Number.isInteger(value)) throw new Error(`E_TABLE_CELL: '${cell}'`);
      return value;
    });
}

// LTS/ls_defs.h:470-485, grapheme feature bits.
const FEATURE_BITS: Readonly<Record<string, number>> = {
  FSEG: 0x0001,
  FVOC: 0x0002,
  FCONS: 0x0004,
  FHIGH: 0x0008,
  FVOICE: 0x0010,
  FLIQ: 0x0020,
  FSIB: 0x0040,
  FLTSVELAR: 0x0080,
  FNAS: 0x0100,
  FGEM: 0x0200,
  FCOR: 0x0400,
  FC: 0x0800,
  FL: 0x1000,
  FX: 0x2000,
  FR: 0x4000,
  FSYL: 0x8000,
};

function featureWords(body: string): number[] {
  return body
    .split(",")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
    .map((cell) =>
      cell.split("+").reduce((sum, term) => {
        const name = term.trim();
        const value = name === "0" ? 0 : FEATURE_BITS[name];
        if (value === undefined) throw new Error(`E_FEATURE_NAME: '${name}'`);
        return sum + value;
      }, 0),
    );
}

// Symbols the prefix and phoneme-feature tables are written in.
const SYMBOLS = new Map<string, number>([
  // LTS/ls_defs.h:497-505, phoneme feature bits.
  ["PCONS", 0x0001],
  ["PVOC", 0x0002],
  ["PBOTH", 0x0004],
  ["PVOICE", 0x0008],
  ["PSIB", 0x0010],
  ["POBS", 0x0020],
  ["PTD", 0x0040],
  ["PBACK", 0x0080],
  ["PLONG", 0x0100],
  // LTS/ls_acna.h:60-63 and ls_defs.h:616-619, prefix flags.
  ["PCONT", 0x10],
  ["PRCON", 0x20],
  ["PRVOC", 0x40],
  ["P2SYL", 0x80],
  // LTS/ls_acna.h:69-76, language groups.
  ["NAME_ENGLISH", 0],
  ["NAME_FRENCH", 1],
  ["NAME_GERMANIC", 2],
  ["NAME_IRISH", 3],
  ["NAME_ITALIAN", 4],
  ["NAME_JAPANESE", 5],
  ["NAME_SLAVIC", 6],
  ["NAME_SPANISH", 7],
]);
const phonemeHeader = fs.readFileSync(
  path.join(dectalkRoot, "dapi", "src", "INCLUDE", "l_all_ph.h"),
  "utf8",
);
for (const match of phonemeHeader.matchAll(/#define\s+(US_[A-Z]+)\s+(\d+)\b/g)) {
  SYMBOLS.set(match[1], Number(match[2]));
}
SYMBOLS.set("SIL", 0);

/** Cells that are sums of symbols and numbers, e.g. `4+PCONT+P2SYL` or `US_AX`. */
function symbolic(body: string): number[] {
  return body
    .split(",")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
    .map((cell) =>
      cell.split("+").reduce((sum, term) => {
        const name = term.trim();
        const value = /^(0x[0-9a-fA-F]+|\d+)$/.test(name) ? Number(name) : SYMBOLS.get(name);
        if (value === undefined) throw new Error(`E_TABLE_SYMBOL: '${name}'`);
        return sum + value;
      }, 0),
    );
}

const tableFile = which === "acna" ? "lsa_rta.c" : "l_us_rta.c";
const tableSource = read(tableFile);
const words = numbers(arrayBody(tableSource, which === "acna" ? "acna_lswtab" : "lswtab"));
const bytes = numbers(arrayBody(tableSource, which === "acna" ? "acna_lsbtab" : "lsbtab"));
const graphemeFeatures = featureWords(arrayBody(read("l_us_con.c"), "feats"));
if (graphemeFeatures.length !== 31) {
  throw new Error(`E_FEATS_LENGTH: expected 31 grapheme codes, read ${graphemeFeatures.length}`);
}
// pfeat[] (LTS/l_us_con.c:1102), indexed by phoneme code, and the stress
// prefix table preftab[]: LTS/l_ac_con.c:107 in the ACNA build (each entry
// starts with a language tag, 0xff for any), LTS/l_us_con.c:1232 otherwise.
const phonemeFeatures = symbolic(arrayBody(read("l_us_con.c"), "pfeat"));
const prefixes = symbolic(
  arrayBody(read(which === "acna" ? "l_ac_con.c" : "l_us_con.c"), "preftab"),
);

fs.writeFileSync(
  outPath,
  `${JSON.stringify({
    schemaVersion: "v1",
    source: `DECtalk 4.63 dapi/src/LTS/${tableFile} (compiled rule tables), LTS/l_us_con.c feats[]`,
    languageTagged: which === "acna",
    // LTS/ls_rule.h LSBUMP: words per rule record.
    recordWords: which === "acna" ? 5 : 4,
    graphemeFeatures,
    phonemeFeatures,
    prefixes,
    words,
    bytes,
  })}\n`,
);
console.log(
  JSON.stringify({
    table: which,
    words: words.length,
    bytes: bytes.length,
    out: path.relative(repoRoot, outPath),
  }),
);
