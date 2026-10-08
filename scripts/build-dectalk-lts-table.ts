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
// dic/Dic_us.txt (one character per bit, bit 0 first). A word with two rows
// (a homograph) has its primary row here and its secondary row in
// `homographs`; the dictionary compiler marks the primary with
// FC_CHARACTER | FC_HOMOGRAPH and the secondary with FC_HOMOGRAPH
// (dic/dic_comm.c:485-501).
const dictionaryText = fs.readFileSync(
  path.join(dectalkRoot, "dapi", "src", "dic", "Dic_us.txt"),
  "utf8",
);
const NAME_BIT = formClassNames.indexOf("name");
const CHARACTER_BIT = formClassNames.indexOf("character");
const HOMOGRAPH_BIT = formClassNames.indexOf("homograph");
const rowFormClass = (formClass: string, pos: string): number => {
  const bits = new Set<number>();
  [...formClass].forEach((char, bit) => {
    // The text marks 3,997 words as names (bit 28); the dictionary
    // say.exe loads reports none of them with it (98 of 98 sampled words in
    // test/fixtures/dectalk-oracle/dectalk-us-form-classes-v1.json). Where
    // the bit is dropped was not found in the source; the running program is
    // followed.
    if (char === "1" && bit !== NAME_BIT) bits.add(bit);
  });
  if (pos === "P") bits.add(CHARACTER_BIT);
  if (pos === "P" || pos === "S") bits.add(HOMOGRAPH_BIT);
  return [...bits].reduce((mask, bit) => mask + 2 ** bit, 0);
};
const byWord = <T>(entries: Map<string, T>): [string, T][] =>
  [...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
const dictionaryRows = selectDictionaryRows(dictionaryText);
const wordFormClasses: Record<string, number> = {};
// For each dictionary word with a `~` in its phoneme field, the indices (in
// the word's phones as public/dectalk-dictionary.json has them) of the phones
// whose allophone rules DECtalk blocks.
const wordRuleBlocks: Record<string, number[]> = {};
// For each dictionary word with a `*` (morpheme boundary) or `#` (compound
// joint) in its phoneme field, the indices of the phones the mark stands
// after.
const wordBoundaries: Record<string, number[]> = {};
for (const [word, row] of byWord(dictionaryRows.best)) {
  const { rulesBlocked, boundaryAfter } = convertPhonemeFieldDetailed(row.phonemes);
  if (rulesBlocked.length > 0) wordRuleBlocks[word] = rulesBlocked;
  if (boundaryAfter.length > 0) wordBoundaries[word] = boundaryAfter;
  const mask = rowFormClass(row.formClass, row.pos);
  if (mask !== 0) wordFormClasses[word] = mask;
}
// The secondary entry of each homograph: its phones as the pronunciation
// dictionary spells them, its class word and its `~`, `*` and `#` marks.
const homographs: Record<
  string,
  { phonemes: string[]; formClass: number; rulesBlockedAt?: number[]; boundaryAfter?: number[] }
> = {};
for (const [word, row] of byWord(dictionaryRows.secondary)) {
  const { phones, rulesBlocked, boundaryAfter } = convertPhonemeFieldDetailed(row.phonemes);
  homographs[word] = {
    phonemes: phones,
    formClass: rowFormClass(row.formClass, row.pos),
    ...(rulesBlocked.length > 0 ? { rulesBlockedAt: rulesBlocked } : {}),
    ...(boundaryAfter.length > 0 ? { boundaryAfter } : {}),
  };
}
// The rules that choose between the two (LTS/ls_homo.h homo_table): four
// class words each, {suffix, context, select, eliminate}.
const homographSource = fs.readFileSync(path.join(ltsDir, "ls_homo.h"), "utf8");
const homographTableText = /homo_table\[MAX_HOMO_RULE\]\s*=\s*\{([^}]*)\}/.exec(homographSource);
if (!homographTableText) throw new Error("E_HOMOGRAPH_TABLE: homo_table not found in ls_homo.h");
const homographWords = [...homographTableText[1].matchAll(/0x([0-9a-fA-F]{8})/g)].map((match) =>
  Number.parseInt(match[1], 16),
);
const homographRuleCount = Number(/#define MAX_HOMO_RULE (\d+)/.exec(homographSource)?.[1]);
if (homographWords.length !== homographRuleCount * 4) {
  throw new Error(
    `E_HOMOGRAPH_TABLE: ${homographWords.length.toString()} words for ${homographRuleCount.toString()} rules`,
  );
}
const homographRules = Array.from({ length: homographRuleCount }, (_unused, index) =>
  homographWords.slice(index * 4, index * 4 + 4),
);
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
// The one-letter word "a" (LTS/ls_task.c:2647-2673): "The default one, from
// the spelling entry in the dictionary, is ['e]. The exception (actually the
// most common case) is [x]. Use [x] if no stripping, and the 'a' is not
// sitting against a punctuation mark ('a box.' vs 'box a.')." The [x] form is
// sent with the class FC_ART alone; the other keeps the dictionary's class.
const wordsByPunctuation = {
  a: {
    apart: { phonemes: ["AX0"], formClass: formClassMask(["art"]) },
    against: { phonemes: ["EY1"] },
  },
};
// The names of the letters. A one-letter word that reaches DECtalk's
// single-letter rules is spelled (LTS/ls_task.c:2760-2775 "Most other single
// letter words get spelled"; 2612-2623 for a capital followed by a period),
// and the spelling routine folds the case and speaks the character's own
// entry (LTS/ls_spel.c ls_spel_spell): the lower-case rows of the typing
// table, in the dictionary's phoneme spelling.
const typingTable = fs.readFileSync(
  path.join(dectalkRoot, "dapi", "src", "INCLUDE", "usa_type.tab"),
  "utf8",
);
const letterPhones: Record<string, string[]> = {};
for (const match of typingTable.matchAll(/"([^"]*)",\s*\/\*\s*Lower case ([A-Z])\s*\*\//g)) {
  letterPhones[(match[2] as string).toLowerCase()] = convertPhonemeFieldDetailed(
    match[1] as string,
  ).phones;
}
if (Object.keys(letterPhones).length !== 26) {
  throw new Error(
    `E_LETTER_NAMES: read ${Object.keys(letterPhones).length.toString()} letter names from usa_type.tab, expected 26`,
  );
}

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
const symbolCode = (name: string): number => {
  const code = SYMBOLS.get(name);
  if (code === undefined) throw new Error(`E_SYMBOL_NAME: '${name}'`);
  return code;
};
/** Phoneme codes whose pfeat[] word satisfies `test`. */
const phonesWith = (test: (features: number) => boolean): number[] =>
  phonemeFeatures.flatMap((features, code) => (test(features) ? [code] : []));
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
  // What the text task adds around a number (LTS/ls_task.c money and plain
  // number processing; LTS/l_us_pr1.c:731-749 fraction digits).
  point: phoneList("ppoint"),
  dollar: phoneList("pdollar"),
  cent: phoneList("pcent"),
  // ls_util_pluralize (LTS/ls_util.c:1442-1466): [IX Z] after a sibilant
  // consonant, [S] after a voiceless consonant, [Z] after anything else.
  plural: {
    afterSibilant: [symbolCode("US_IX"), symbolCode("US_Z")],
    afterVoiceless: [symbolCode("US_S")],
    otherwise: [symbolCode("US_Z")],
    sibilants: phonesWith(
      (features) =>
        (features & (symbolCode("PCONS") | symbolCode("PSIB"))) ===
        (symbolCode("PCONS") | symbolCode("PSIB")),
    ),
    voicelessConsonants: phonesWith(
      (features) =>
        (features & (symbolCode("PCONS") | symbolCode("PVOICE"))) === symbolCode("PCONS"),
    ),
  },
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
    wordBoundaries,
    homographs,
    homographRules,
    specialWordFormClasses,
    specialWordPhraseStarts,
    wordsByPunctuation,
    letterPhones,
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
