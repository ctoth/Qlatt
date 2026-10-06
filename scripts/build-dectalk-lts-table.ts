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
import { convertPhonemeFieldDetailed, selectDictionaryRows } from "./build-dectalk-dict";

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

// The suffix stripping rules (LTS/l_us_suf.c, the little-endian build's
// table): an index by the word's last letter and the rule byte code that
// LTS/ls_suff.c interprets.
const suffixSource = read("l_us_suf.c");
const suffixIndex = numbers(arrayBody(suffixSource, "suffix_index"));
const suffixTable = numbers(arrayBody(suffixSource, "suffix_table"));
if (suffixIndex.length !== 27) {
  throw new Error(`E_SUFFIX_INDEX_LENGTH: expected 27 entries, read ${suffixIndex.length}`);
}

// Form classes. INCLUDE/fc_def.tab names each bit of a form class word; the
// name here is the define's name in lower case without "FC_". DECtalk's form
// log prints its own strings (LTS/ls_suff.c form_class_strings), which differ
// for a few bits ("char" for character, "intr" for inter, "who" for whow).
const formClassNames: (string | null)[] = Array.from({ length: 32 }, () => null);
const formClassSource = fs.readFileSync(
  path.join(dectalkRoot, "dapi", "src", "INCLUDE", "fc_def.tab"),
  "utf8",
);
for (const match of formClassSource.matchAll(/^#define\s+FC_([A-Z]+)\s+0x([0-9a-fA-F]{8})L/gm)) {
  const bit = Math.log2(Number.parseInt(match[2], 16));
  if (!Number.isInteger(bit)) throw new Error(`E_FORM_CLASS_BIT: FC_${match[1]}`);
  formClassNames[bit] = match[1].toLowerCase();
}
const formClassMask = (names: readonly string[]): number =>
  names.reduce((mask, name) => {
    const bit = formClassNames.indexOf(name);
    if (bit < 0) throw new Error(`E_FORM_CLASS_NAME: '${name}'`);
    return mask + 2 ** bit;
  }, 0);

// Each dictionary word's form class word, from the fourth field of
// dic/Dic_us.txt (one character per bit, bit 0 first). The row kept for a
// homograph is the one the pronunciation dictionary keeps
// (scripts/build-dectalk-dict.ts); DECtalk's choice by context
// (LTS/ls_homo.c) is not reproduced.
const dictionaryText = fs.readFileSync(
  path.join(dectalkRoot, "dapi", "src", "dic", "Dic_us.txt"),
  "utf8",
);
const NAME_BIT = formClassNames.indexOf("name");
const wordFormClasses: Record<string, number> = {};
// For each dictionary word with a `~` in its phoneme field, the indices (in
// the word's phones as public/dectalk-dictionary.json has them) of the phones
// whose allophone rules DECtalk blocks.
const wordRuleBlocks: Record<string, number[]> = {};
for (const [word, row] of [...selectDictionaryRows(dictionaryText).best].sort(([a], [b]) =>
  a < b ? -1 : a > b ? 1 : 0,
)) {
  const { rulesBlocked } = convertPhonemeFieldDetailed(row.phonemes);
  if (rulesBlocked.length > 0) wordRuleBlocks[word] = rulesBlocked;
  let mask = 0;
  [...row.formClass].forEach((char, bit) => {
    // The text marks 3,997 words as names (bit 28); the dictionary
    // say.exe loads reports none of them with it (98 of 98 sampled words in
    // test/fixtures/dectalk-oracle/dectalk-us-form-classes-v1.json). Where
    // the bit is dropped was not found in the source; the running program is
    // followed.
    if (char === "1" && bit !== NAME_BIT) mask += 2 ** bit;
  });
  if (mask !== 0) wordFormClasses[word] = mask;
}
// The words of the mini dictionary sdic[] (LTS/l_us_con.c:1187-1195) take a
// form class written into the lookup itself, by first letter
// (LTS/ls_task.c:1062-1078), whatever the main dictionary says.
const specialWordFormClasses: Record<string, number> = {
  to: formClassMask(["to", "prep", "func"]),
  and: formClassMask(["conj", "verb", "func"]),
  for: formClassMask(["adv", "prep", "neg"]),
};
// Each of those entries begins with PPSTART: the word starts a prepositional
// phrase (LTS/l_us_con.c:1190-1193).
const specialWordPhraseStarts: Record<string, "pp"> = { to: "pp", and: "pp", for: "pp" };

// The phone lists DECtalk speaks numbers from (LTS/l_us_con.c:640-900,
// 1000-1035), used by LTS/l_us_pr1.c without a dictionary lookup. A list
// holds phone codes and the control symbols of INCLUDE/l_com_ph.h (stress
// marks, word boundary, verb-phrase start); its terminating SIL is dropped.
for (const [name, code] of [
  ["S2", 102],
  ["S1", 103],
  ["SEMPH", 104],
  ["SBOUND", 108],
  ["MBOUND", 109],
  ["HYPHEN", 110],
  ["WBOUND", 111],
  ["PPSTART", 112],
  ["VPSTART", 113],
  ["COMMA", 115],
] as const) {
  SYMBOLS.set(name, code);
}
const constantsSource = read("l_us_con.c");
const phoneList = (name: string): number[] => {
  const list = symbolic(arrayBody(constantsSource, name));
  if (list.at(-1) !== 0) throw new Error(`E_PHONE_LIST_END: ${name} does not end with SIL`);
  return list.slice(0, -1);
};
/** A table of ten lists, e.g. `punits[] = { p0, p1, ... }`. */
const phoneListTable = (name: string): number[][] => {
  const names = arrayBody(constantsSource, name)
    .split(",")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);
  if (names.length !== 10) throw new Error(`E_PHONE_LIST_TABLE: ${name} has ${names.length}`);
  return names.map(phoneList);
};
const numberPhones = {
  units: phoneListTable("punits"),
  // "Allow for unstressed digits before hundred, thousand etc." (:733-734).
  unstressedUnits: phoneListTable("upunits"),
  teens: phoneListTable("pteens"),
  tens: phoneListTable("ptens"),
  ordinals: phoneListTable("pordin"),
  hundred: phoneList("phundred"),
  thousand: phoneList("pthousand"),
  million: phoneList("pmillion"),
  billion: phoneList("pbillion"),
  trillion: phoneList("ptrillion"),
  quadrillion: phoneList("pquadrillion"),
  and: phoneList("pand"),
};

// The frontend's spelling of each allophone code (INCLUDE/l_all_ph.h order).
// Four names differ from DECtalk's (as in scripts/build-dectalk-dict.ts).
const FRONTEND_SYMBOLS: Readonly<Record<string, string[]>> = {
  HX: ["HH"],
  NX: ["NG"],
  LL: ["L"],
  Q: ["GS"],
};
const allophoneNames: string[] = ["SIL"];
for (const [name, code] of SYMBOLS) {
  if (name.startsWith("US_") && code < 59) allophoneNames[code] = name.slice(3);
}
const phonemeSymbols = allophoneNames.map((name) => FRONTEND_SYMBOLS[name] ?? [name]);
// The vowels IY..UR (codes 1-23) carry a stress digit in the frontend.
const stressBearing = Array.from({ length: 23 }, (_unused, index) => index + 1);

fs.writeFileSync(
  outPath,
  `${JSON.stringify({
    schemaVersion: "v1",
    format: "lts-table",
    source: `DECtalk 4.63 dapi/src/LTS/${tableFile} (compiled rule tables), LTS/l_us_con.c feats[]`,
    phonemeSymbols,
    stressBearing,
    languageTagged: which === "acna",
    // LTS/ls_rule.h LSBUMP: words per rule record.
    recordWords: which === "acna" ? 5 : 4,
    graphemeFeatures,
    phonemeFeatures,
    prefixes,
    suffixIndex,
    suffixTable,
    formClassNames,
    wordFormClasses,
    wordRuleBlocks,
    specialWordFormClasses,
    specialWordPhraseStarts,
    numberPhones,
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
