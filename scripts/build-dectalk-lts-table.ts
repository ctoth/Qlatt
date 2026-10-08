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
import { searchDictionary } from "../src/g2p/table-dictionary-search";
import { stripSuffixes } from "../src/g2p/table-suffix";
import { convertPhonemeFieldDetailed, selectDictionaryRows } from "./build-dectalk-dict";
import { conjunctionSequences } from "./dectalk-proverbs";

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
// For each dictionary word with a space in its phoneme field ("#" is
// `n'^mbR s`An`), the indices of the phones a word boundary stands after: the
// entry is spoken as several words.
const wordBreaks: Record<string, number[]> = {};
for (const [word, row] of byWord(dictionaryRows.best)) {
  const { rulesBlocked, boundaryAfter, wordBreakAfter } = convertPhonemeFieldDetailed(row.phonemes);
  if (rulesBlocked.length > 0) wordRuleBlocks[word] = rulesBlocked;
  if (boundaryAfter.length > 0) wordBoundaries[word] = boundaryAfter;
  if (wordBreakAfter.length > 0) wordBreaks[word] = wordBreakAfter;
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
// The names of the marks the spelling routine speaks when one stands inside
// a spelled word (LTS/ls_spel.c:158-170: a digit from the number lists, any
// other character from this table): the same table's rows, each name a list
// of words (a space in the row is a word boundary).
const characterNames: Record<string, string[][]> = {};
for (const [character, comment] of [
  ["!", "Exclaimation point"],
  ["?", "Question Mark"],
  [",", "Comma"],
  ["-", "Minus sign"],
  ["/", "Forward slash"],
  ["_", "Underscore"],
] as const) {
  const row = new RegExp(`"([^"]*)",\\s*/\\*\\s*${comment}\\s*\\*/`).exec(typingTable);
  if (!row) throw new Error(`E_CHARACTER_NAMES: no row '${comment}' in usa_type.tab`);
  characterNames[character] = (row[1] as string)
    .split(" ")
    .map((word) => convertPhonemeFieldDetailed(word).phones);
}

// The words of the compiled dictionary DECtalk loads, in its order and with
// their case: the main dictionary search is a binary search whose result
// depends on both (LTS/ls_dict.c, src/g2p/table-dictionary-search.ts). The
// file (dic/dic_comm.c): the entry count, the size of the entries, one offset
// per entry, then the entries, each a form class word and the word's text.
const compiledDictionary = fs.readFileSync(
  path.join(dectalkRoot, "dapi", "src", "dic", "dtalk_us.dic"),
);
const dictionaryEntryCount = compiledDictionary.readUInt32LE(0);
const dictionaryEntriesAt = 8 + 4 * dictionaryEntryCount;
if (dictionaryEntriesAt + compiledDictionary.readUInt32LE(4) !== compiledDictionary.length) {
  throw new Error("E_COMPILED_DICTIONARY: dtalk_us.dic does not have the size its header gives");
}
const dictionaryWords: string[] = [];
for (let entry = 0; entry < dictionaryEntryCount; entry += 1) {
  let at = dictionaryEntriesAt + compiledDictionary.readUInt32LE(8 + 4 * entry) + 4;
  let word = "";
  while (compiledDictionary[at] !== 0) {
    word += String.fromCharCode(compiledDictionary[at] as number);
    at += 1;
  }
  dictionaryWords.push(word);
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
/**
 * The names an array of pointers lists, e.g. `pmonths[] = { pjan, pfeb, ... }`.
 * The declaration may be written twice around an #if, the body once after it.
 */
const nameList = (name: string, count: number): string[] => {
  const body = arrayBody(constantsSource, name);
  const names = body
    .slice(body.lastIndexOf("{") + 1)
    .replace(/^\s*#.*$/gm, "")
    .split(",")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);
  if (names.length !== count) {
    throw new Error(`E_NAME_LIST: ${name} has ${names.length} names, expected ${count}`);
  }
  return names;
};
/** A string constant, e.g. `m_jan[] = "jan";`. */
const stringConstant = (name: string): string => {
  const match = new RegExp(`\\b${name}\\s*\\[\\s*\\]\\s*=\\s*"([^"]*)"`).exec(constantsSource);
  if (!match) throw new Error(`E_STRING_CONSTANT: l_us_con.c has no string ${name}`);
  return match[1];
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
  // The date reader's lists (LTS/l_us_pr1.c:815-961): the three letters a
  // month is known by (months[], l_us_con.c:570-600), what each month is
  // spoken as (pmonths[], :910-975), and the "oh" of "twenty oh one" (pOH,
  // :638).
  monthNames: nameList("months", 12).map(stringConstant),
  months: nameList("pmonths", 12).map(phoneList),
  oh: phoneList("pOH"),
  // A fraction's denominator 2 (LTS/l_us_pr1.c:1034-1067).
  half: phoneList("phalf"),
  halves: phoneList("phalves"),
  // The words that take "dollars" behind them when they follow a dollar
  // amount, nwdtab[] (LTS/l_us_con.c:539-567; LTS/ls_task.c:3227-3290): each
  // entry is its length, the letters, EOS and the phones up to SIL; a 0 ends
  // the table.
  quantityWords: (() => {
    const cells = arrayBody(read("l_us_con.c"), "nwdtab")
      .split(",")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
    const words: Record<string, number[]> = {};
    let at = 0;
    while (cells[at] !== "0") {
      if (!/^\d+$/.test(cells[at] ?? "")) throw new Error(`E_NWDTAB: no length at cell ${at}`);
      at += 1;
      let key = "";
      for (; cells[at] !== "EOS"; at += 1) {
        const letter = /^'([a-z])'$/.exec(cells[at] ?? "");
        if (!letter) throw new Error(`E_NWDTAB: '${String(cells[at])}' is not a letter`);
        key += letter[1];
      }
      at += 1;
      const list: number[] = [];
      for (; cells[at] !== "SIL"; at += 1) {
        if (at >= cells.length) throw new Error("E_NWDTAB: a phone list does not end with SIL");
        list.push(symbolCode(cells[at] as string));
      }
      at += 1;
      words[key] = list;
    }
    return words;
  })(),
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

// The abbreviations of units read after a number, nabtab[] (LTS/l_us_con.c:366):
// each entry is its length, the letters, EOS, the phones of the singular up to
// SIL and the phones of the plural up to SIL; a 0 ends the table. LTS/ls_task.c
// looks a word that is followed by a period up here before the dictionary
// while a number stands at most two words back (lines 3772, 634, 2125-2152),
// and takes the plural when the number routine says the number is plural.
const numberAbbreviations: Record<string, { singular: number[]; plural: number[] }> = {};
{
  const cells = arrayBody(constantsSource, "nabtab")
    .split(",")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);
  let at = 0;
  const symbolsToSil = (): number[] => {
    const list: number[] = [];
    for (; cells[at] !== "SIL"; at += 1) {
      if (at >= cells.length) throw new Error("E_NABTAB: a phone list does not end with SIL");
      list.push(symbolCode(cells[at] as string));
    }
    at += 1;
    return list;
  };
  while (cells[at] !== "0") {
    if (!/^\d+$/.test(cells[at] ?? "")) throw new Error(`E_NABTAB: no length at cell ${at}`);
    at += 1;
    let key = "";
    for (; cells[at] !== "EOS"; at += 1) {
      const letter = /^'([a-z])'$/.exec(cells[at] ?? "");
      if (!letter) throw new Error(`E_NABTAB: '${String(cells[at])}' is not a letter`);
      key += letter[1];
    }
    at += 1;
    numberAbbreviations[key] = { singular: symbolsToSil(), plural: symbolsToSil() };
  }
}

// The characters of phonemic text: usa_ascky_rev[] (INCLUDE/usa_phon.tab:70),
// by character code, the symbol each stands for; null for a character that
// stands for none (NULL_ASCKY) or for the pitch command. The control symbols
// are INCLUDE/l_com_ph.h's.
for (const match of fs
  .readFileSync(path.join(dectalkRoot, "dapi", "src", "INCLUDE", "l_com_ph.h"), "latin1")
  .matchAll(/^#define\s+([A-Z0-9_]+)\s+\(100(?:\s*\+\s*(\d+))?\)/gm)) {
  const code = 100 + Number(match[2] ?? 0);
  const known = SYMBOLS.get(match[1]);
  if (known !== undefined && known !== code) {
    throw new Error(`E_SYMBOL_CODE: ${match[1]} is ${code} in l_com_ph.h, ${known} here`);
  }
  SYMBOLS.set(match[1], code);
}
const characterTable = /usa_ascky_rev\s*\[\s*\]\s*=\s*\{([\s\S]*?)\};/.exec(
  fs.readFileSync(path.join(dectalkRoot, "dapi", "src", "INCLUDE", "usa_phon.tab"), "latin1"),
);
if (!characterTable) throw new Error("E_PHONEME_CHARACTERS: usa_phon.tab has no usa_ascky_rev");
const phonemeCharacters = characterTable[1]
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split(",")
  .map((cell) => cell.trim())
  .filter((cell) => cell.length > 0)
  .map((cell) => {
    const symbol = /^PUSA\((\w+)\)$/.exec(cell)?.[1];
    if (symbol !== undefined) return symbolCode(symbol);
    if (cell === "NULL_ASCKY" || cell === "PITCH_CHANGE") return null;
    throw new Error(`E_PHONEME_CHARACTERS: unknown cell '${cell}'`);
  });
if (phonemeCharacters.length !== 128) {
  throw new Error(`E_PHONEME_CHARACTERS: ${phonemeCharacters.length} entries, expected 128`);
}
// The two characters DECtalk's text parser puts around phonemic text
// (CMD/par_def1.h PAR_PHONES_ON_D, PAR_PHONES_OFF_D; CMD/cm_text.c:1088-1145).
const parserDefinitions = fs.readFileSync(
  path.join(dectalkRoot, "dapi", "src", "CMD", "par_def1.h"),
  "latin1",
);
const phonemicMarks = ["PAR_PHONES_ON_D", "PAR_PHONES_OFF_D"].map((name) => {
  const match = new RegExp(`^#define\\s+${name}\\s+(0x[0-9A-Fa-f]+)`, "m").exec(parserDefinitions);
  if (!match) throw new Error(`E_PHONEMIC_MARKS: par_def1.h does not define ${name}`);
  return Number(match[1]);
});

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
    wordBreaks,
    homographs,
    homographRules,
    specialWordFormClasses,
    specialWordPhraseStarts,
    wordsByPunctuation,
    letterPhones,
    characterNames,
    // The word sequences the text stage's sentence parse takes as one
    // conjunction, in the table's order (LTS/proverbs.h conj_words, read by
    // LTS/ls_task.c ls_task_search_for_conj).
    conjunctionSequences: conjunctionSequences(read("proverbs.h")),
    dictionaryWords,
    numberAbbreviations,
    numberPhones,
    phonemeCharacters,
    phonemicMarks,
    words,
    bytes,
  })}\n`,
);
// The dictionary's abbreviations, for the text rules: each entry that ends in
// a period, by its lower-case text, with the ways of writing the word that
// DECtalk's search finds it as an abbreviation by: `l` all lower case, `C`
// the first letter a capital, `U` no lower-case letter. The search is run
// here on each form (src/g2p/table-dictionary-search.ts): "Dept." is found
// by "Dept" and "DEPT" and not by "dept"; "fig." by "fig" and "FIG" and not
// by "Fig", which lands on the entry "fig".
const abbreviationForms: Record<string, string> = {};
for (const entry of dictionaryWords) {
  if (!entry.endsWith(".") || entry.length < 2) continue;
  const key = entry.toLowerCase();
  const stem = key.slice(0, -1);
  const forms: Array<[string, string]> = [
    ["l", stem],
    ["C", stem.charAt(0).toUpperCase() + stem.slice(1)],
    ["U", stem.toUpperCase()],
  ];
  const found = forms
    .filter(([, written], index) => {
      // A stem with no letter to change is one form, not three.
      if (index > 0 && written === stem) return false;
      const hit = searchDictionary(dictionaryWords, written, true);
      return hit?.abbreviation === true && dictionaryWords[hit.index]?.toLowerCase() === key;
    })
    .map(([form]) => form);
  // Two entries may differ only in case ("Ft." and "ft."): one key, the union.
  const known = abbreviationForms[key] ?? "";
  const union = ["l", "C", "U"].filter((form) => found.includes(form) || known.includes(form));
  if (union.length > 0) abbreviationForms[key] = union.join("");
}

// Words of capitals that DECtalk spells: ls_spel_say_it (LTS/l_us_sp1.c:63-99)
// looks only at a word of 2 or more letters A-Z that the dictionary search,
// with its suffix stripping, did not find (LTS/ls_task.c:697 before 746). It
// spells the word when every letter is a vowel (A E I O U Y,
// INCLUDE/ls_feat.tab CFEAT_vowel), and, for a word of at most 4 letters,
// when spell_it[first][second] has SPELL_BEGIN (2) or spell_it[last][last but
// one] has SPELL_END (1) (LTS/l_us_spe.c:44, LTS/ls_defs.h:692-698).
// Written out for the text rules: the letter pairs, in the order they are
// written, and the words that meet the test but that the dictionary search
// finds, which are therefore spoken.
const spellSource = read("l_us_spe.c");
const spellAt = spellSource.indexOf("spell_it[26][26] = {");
if (spellAt < 0) throw new Error("E_TABLE_MISSING: spell_it[26][26]");
const spellIt = numbers(
  spellSource.slice(spellSource.indexOf("{", spellAt) + 1, spellSource.indexOf("};", spellAt)),
);
if (spellIt.length !== 26 * 26) {
  throw new Error(`E_SPELL_IT: ${spellIt.length.toString()} cells, expected 676`);
}
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const spellBeginPairs: string[] = [];
const spellEndPairs: string[] = [];
for (let first = 0; first < 26; first += 1) {
  for (let second = 0; second < 26; second += 1) {
    const cell = spellIt[first * 26 + second] as number;
    if (cell & 2) spellBeginPairs.push(`${LETTERS[first]}${LETTERS[second]}`);
    // The end pair is indexed last letter first.
    if (cell & 1) spellEndPairs.push(`${LETTERS[second]}${LETTERS[first]}`);
  }
}
const spelledByTest = (word: string): boolean =>
  /^[AEIOUY]+$/.test(word) ||
  (word.length <= 4 &&
    (spellBeginPairs.includes(word.slice(0, 2)) || spellEndPairs.includes(word.slice(-2))));
const dictionaryPhones = (spelling: string): readonly string[] | null => {
  const row = dictionaryRows.best.get(spelling);
  return row ? convertPhonemeFieldDetailed(row.phonemes).phones : null;
};
const capitalsSpoken: string[] = [];
const capitalWords = function* (length: number, prefix = ""): Generator<string> {
  if (prefix.length === length) yield prefix;
  else for (const letter of LETTERS) yield* capitalWords(length, prefix + letter);
};
for (const length of [2, 3, 4]) {
  for (const word of capitalWords(length)) {
    if (!spelledByTest(word)) continue;
    const lower = word.toLowerCase();
    const found =
      dictionaryPhones(lower) !== null ||
      stripSuffixes(lower, dictionaryPhones, {
        suffixIndex,
        suffixTable,
        phonemeFeatures,
        phonemeSymbols,
        stressBearing,
      }).phonemes !== null;
    if (found) capitalsSpoken.push(word);
  }
}
const abbreviationsPath = path.join(path.dirname(outPath), "dictionary-abbreviations.yaml");
fs.writeFileSync(
  abbreviationsPath,
  [
    "# Generated by scripts/build-dectalk-lts-table.ts from DECtalk 4.63",
    "# dapi/src/dic/dtalk_us.dic; do not edit. Each dictionary entry that ends in a",
    "# period, with the written forms DECtalk's dictionary search (LTS/ls_dict.c)",
    "# finds it by as an abbreviation: l lower case, C capitalised, U upper case.",
    "maps:",
    "  tn_dictionary_abbreviations:",
    ...Object.keys(abbreviationForms)
      .sort()
      .map((key) => `    ${JSON.stringify(key)}: ${JSON.stringify(abbreviationForms[key])}`),
    "  # The unit abbreviations read after a number, in any case: the keys of",
    "  # nabtab[] (DECtalk 4.63 LTS/l_us_con.c:366); their phones are in",
    "  # lts-table.json, numberAbbreviations.",
    "  tn_number_abbreviations:",
    ...Object.keys(numberAbbreviations)
      .sort()
      .map((key) => `    ${JSON.stringify(key)}: "unit"`),
    "  # Words of capitals that are spelled: the first two letters of a word of",
    "  # at most 4 (spell_it SPELL_BEGIN), its last two (SPELL_END), from DECtalk",
    "  # 4.63 LTS/l_us_spe.c:44, and the words that meet that test or are all",
    "  # vowels but that the dictionary search finds, so that they are spoken.",
    "  tn_spell_begin_pairs:",
    ...spellBeginPairs.map((pair) => `    ${JSON.stringify(pair)}: "spell"`),
    "  tn_spell_end_pairs:",
    ...spellEndPairs.sort().map((pair) => `    ${JSON.stringify(pair)}: "spell"`),
    "  tn_capitals_in_dictionary:",
    ...capitalsSpoken.map((word) => `    ${JSON.stringify(word)}: "word"`),
    "  # The dictionary's entries with a slash in them, in lower case: a word",
    "  # written so is the dictionary's word.",
    "  tn_slash_words:",
    ...[
      ...new Set(
        dictionaryWords.filter((word) => word.includes("/")).map((word) => word.toLowerCase()),
      ),
    ]
      .sort()
      .map((word) => `    ${JSON.stringify(word)}: "word"`),
    "  # The dictionary's entries with no letter and no digit in them: a word",
    "  # written so, standing alone, is the dictionary's word (DECtalk 4.63",
    "  # LTS/ls_task.c:697 and 746, the dictionary search comes before any",
    "  # punctuation is stripped).",
    "  tn_symbol_words:",
    ...[...new Set(dictionaryWords.filter((word) => !/[A-Za-z0-9]/.test(word)))]
      .sort()
      .map((word) => `    ${JSON.stringify(word)}: "word"`),
    "",
  ].join("\n"),
);
console.log(
  JSON.stringify({
    table: which,
    words: words.length,
    bytes: bytes.length,
    out: path.relative(repoRoot, outPath),
    abbreviations: Object.keys(abbreviationForms).length,
    abbreviationsOut: path.relative(repoRoot, abbreviationsPath),
  }),
);
