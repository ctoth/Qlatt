#!/usr/bin/env node

/**
 * build-dectalk-text-parser.ts
 * ============================
 * Writes the rule table of DECtalk 4.63's command text parser as data: the
 * program that rewrites text (phone numbers, dates, some abbreviations,
 * punctuation) before the letter-to-sound stage reads it.
 *
 * Source. The build compiles CMD/par_rule2.h (NEW_BINARY_PARSER,
 * dectalkf.h:99; CMD/par_rule.c:54-65), which a rule compiler generated from
 * CMD/par_rule2.par. The compiler source in the tree (CMD/par_comp.c) is older
 * than that rule file and rejects two of its head tags, so the compiled
 * header is decoded here, not the rule text. The rule text is read only to
 * find each rule's line, as its citation.
 *
 * What is decoded (CMD/par_pars1.c:1171-1369, CMD/par_bin.h):
 *   - each entry's 16-bit flag word; for a special entry (stop, return, goto,
 *     call) its target; for a rule its number, language mask, mode mask and
 *     the targets its flags announce, in the order hit, miss, call-on-hit,
 *     call-on-miss, copy-hit;
 *   - the rule's body, kept as the bytes the interpreter reads
 *     (src/text-parser, a port of par_pars1.c);
 *   - the section starts and the word lists.
 * Nothing is filtered: which rules run is decided when the table is used, by
 * the language and mode a frontend's policy gives.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/build-dectalk-text-parser.ts [--dectalk C:/Users/Q/src/dectalk/463] [--out <file>]
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
const dectalkRoot = path.resolve(flag("dectalk") ?? "C:/Users/Q/src/dectalk/463");
const cmdDir = path.join(dectalkRoot, "dapi", "src", "CMD");
const outPath = path.resolve(
  flag("out") ??
    path.join(
      repoRoot,
      "public",
      "rules",
      "frontends",
      "dectalk-english",
      "text-parser-table.json",
    ),
);
const HEADER = "par_rule2.h";
const RULE_TEXT = "par_rule2.par";

const header = fs.readFileSync(path.join(cmdDir, HEADER), "latin1");

/** The numbers of `name[...] = { ... };` in the header. */
function arrayOf(name: string): number[] {
  const match = new RegExp(`\\b${name}\\s*\\[[^\\]]*\\]\\s*=\\s*\\{([\\s\\S]*?)\\};`).exec(header);
  if (!match) throw new Error(`E_PARSER_TABLE: ${HEADER} has no array ${name}`);
  return (match[1].match(/0x[0-9A-Fa-f]+|\d+/g) ?? []).map(Number);
}
function scalarOf(name: string): number {
  const match = new RegExp(`\\b${name}\\s*=\\s*(\\d+)\\s*;`).exec(header);
  if (!match) throw new Error(`E_PARSER_TABLE: ${HEADER} has no value ${name}`);
  return Number(match[1]);
}

const ruleSections = arrayOf("rule_sections");
const ruleIndexTable = arrayOf("rule_index_table");
const ruleData = arrayOf("rule_data_table");
const numRules = scalarOf("num_rules");
if (ruleIndexTable.length !== numRules) {
  throw new Error(`E_PARSER_TABLE: ${ruleIndexTable.length} rule offsets, num_rules ${numRules}`);
}
if (ruleSections.length !== scalarOf("num_rule_sections")) {
  throw new Error("E_PARSER_TABLE: rule_sections does not match num_rule_sections");
}

// CMD/par_bin.h, the rule flag word.
const BIN_SPECIAL_RULE_MASK = 0xe000;
const SPECIAL: ReadonlyMap<number, string> = new Map([
  [0x2000, "stop"],
  [0x4000, "return"],
  [0xa000, "goto"],
  [0xc000, "call"],
]);
const BIN_NEXT_HIT = 0x1000;
const BIN_NEXT_MISS = 0x0800;
const BIN_GORET_HIT = 0x0400;
const BIN_GORET_MISS = 0x0200;
const BIN_COPY_HIT = 0x0100;
const BIN_DICT_HIT = 0x0080;
const BIN_DICT_MISS = 0x0040;

const u16 = (bytes: readonly number[], at: number): number => bytes[at] | (bytes[at + 1] << 8);
const u32 = (bytes: readonly number[], at: number): number =>
  (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0;
const hex = (bytes: readonly number[]): string =>
  bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");

/** Line of each rule number in the rule text: `...:R<n>` in a head, or `STOP,R<n>`. */
const lineOfRule = new Map<number, number>();
fs.readFileSync(path.join(cmdDir, RULE_TEXT), "latin1")
  .split(/\r?\n/)
  .forEach((line, index) => {
    if (line.startsWith(";")) return;
    const head = /^(?:0x[0-9A-Fa-f]{8}-0x[0-9A-Fa-f]{8}:([^,]*)|[A-Z]+[0-9]*),/.exec(line);
    if (!head) return;
    const number = /(?:^|[;,:])R(\d+)/.exec(head[1] ?? line.slice(0, line.indexOf(",") + 12));
    if (number && !lineOfRule.has(Number(number[1]))) lineOfRule.set(Number(number[1]), index + 1);
  });

interface RuleEntry {
  /** Position in the table; targets are positions. */
  index: number;
  kind: "rule" | "stop" | "return" | "goto" | "call";
  /** The 16-bit flag word (par_bin.h). */
  flags: number;
  /** goto and call: the entry to continue at. */
  target?: number;
  /** The rule's R number in the rule text. */
  number?: number;
  /** Its line in the rule text, when the number is found there. */
  line?: number;
  language?: number;
  mode?: number;
  /** The word's dictionary state the rule needs (par_pars1.c:1280-1317). */
  dictionary?: "hit" | "miss" | "abbreviation";
  hit?: number;
  miss?: number;
  callHit?: number;
  callMiss?: number;
  copyHit?: number;
  /** The whole compiled entry, as hexadecimal. */
  bytes: string;
  /** Offset of the body inside `bytes`, in bytes. */
  body?: number;
}

const rules: RuleEntry[] = ruleIndexTable.map((start, index) => {
  const end = index + 1 < ruleIndexTable.length ? ruleIndexTable[index + 1] : ruleData.length;
  const bytes = ruleData.slice(start, end);
  const flags = u16(bytes, 0);
  if (flags & BIN_SPECIAL_RULE_MASK) {
    const kind = SPECIAL.get(flags & BIN_SPECIAL_RULE_MASK);
    if (!kind) throw new Error(`E_PARSER_TABLE: entry ${index} has special flags ${flags}`);
    return {
      index,
      kind: kind as RuleEntry["kind"],
      flags,
      ...(kind === "goto" || kind === "call" ? { target: u16(bytes, 2) } : {}),
      bytes: hex(bytes),
    };
  }
  const number = u16(bytes, 2);
  let at = 12;
  const field = (bit: number): number | undefined => {
    if (!(flags & bit)) return undefined;
    const value = u16(bytes, at);
    at += 2;
    return value;
  };
  const hit = field(BIN_NEXT_HIT);
  const miss = field(BIN_NEXT_MISS);
  const callHit = field(BIN_GORET_HIT);
  const callMiss = field(BIN_GORET_MISS);
  const copyHit = field(BIN_COPY_HIT);
  const dictionary =
    flags & BIN_DICT_HIT && flags & BIN_DICT_MISS
      ? "abbreviation"
      : flags & BIN_DICT_HIT
        ? "hit"
        : flags & BIN_DICT_MISS
          ? "miss"
          : undefined;
  const line = lineOfRule.get(number);
  return {
    index,
    kind: "rule",
    flags,
    number,
    ...(line !== undefined ? { line } : {}),
    language: u32(bytes, 4),
    mode: u32(bytes, 8),
    ...(dictionary ? { dictionary } : {}),
    ...(hit !== undefined ? { hit } : {}),
    ...(miss !== undefined ? { miss } : {}),
    ...(callHit !== undefined ? { callHit } : {}),
    ...(callMiss !== undefined ? { callMiss } : {}),
    ...(copyHit !== undefined ? { copyHit } : {}),
    bytes: hex(bytes),
    body: at,
  };
});

// The word lists: dict_point[k] = { first, last } entries of dict_index_table,
// each an offset into dict_data_table.
const dictPoint = arrayOf("dict_point");
const dictIndex = arrayOf("dict_index_table");
const dictData = arrayOf("dict_data_table");
const dictionaries: string[][] = [];
for (let k = 0; k + 1 < dictPoint.length; k += 2) {
  const [first, last] = [dictPoint[k], dictPoint[k + 1]];
  const entries: string[] = [];
  for (let entry = first; entry <= last; entry += 1) {
    const start = dictIndex[entry];
    const end = entry + 1 < dictIndex.length ? dictIndex[entry + 1] : dictData.length;
    entries.push(hex(dictData.slice(start, end)));
  }
  dictionaries.push(entries);
}

// The character classes the rules test: parser_char_types[] of CMD/par_char.c,
// one TYPE_ expression per character code, with the bit of each name from
// CMD/par_def1.h.
const TYPE_BITS = new Map<string, number>();
for (const match of fs
  .readFileSync(path.join(cmdDir, "par_def1.h"), "latin1")
  .matchAll(/^#define\s+(TYPE_[a-z_]+)\s+(0x[0-9A-Fa-f]+)/gm)) {
  TYPE_BITS.set(match[1], Number(match[2]));
}
const charSource = fs.readFileSync(path.join(cmdDir, "par_char.c"), "latin1");
const typeTable = /parser_char_types\s*\[\s*\]\s*=\s*\{([\s\S]*?)\};/.exec(charSource);
if (!typeTable) throw new Error("E_PARSER_TABLE: par_char.c has no parser_char_types");
const characterTypes = typeTable[1]
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split(",")
  .map((cell) => cell.trim())
  .filter((cell) => cell.length > 0)
  .map((cell) =>
    cell.split("|").reduce((bits, name) => {
      const bit = TYPE_BITS.get(name.trim());
      if (bit === undefined) throw new Error(`E_PARSER_TABLE: unknown character type '${name}'`);
      return bits | bit;
    }, 0),
  )
  // The table has one entry after code 255 that no character reaches.
  .slice(0, 256);
if (characterTypes.length !== 256) {
  throw new Error(`E_PARSER_TABLE: ${characterTypes.length} character types, expected 256`);
}
// par_lower[] (CMD/par_char.c:337) is INCLUDE/ls_lower.tab: the case folding
// of case-insensitive literals.
const lowerCase = (
  fs
    .readFileSync(path.join(dectalkRoot, "dapi", "src", "INCLUDE", "ls_lower.tab"), "latin1")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    // Entries are hexadecimal numbers or character constants ('a').
    .match(/0x[0-9A-Fa-f]+|'[^'\\]'/g) ?? []
).map((cell) => (cell.startsWith("'") ? cell.charCodeAt(1) : Number(cell)));
if (lowerCase.length !== 256) {
  throw new Error(`E_PARSER_TABLE: ${lowerCase.length} case folding entries, expected 256`);
}

// What cuts text into clauses before the rules run (CMD/cm_text.c
// cm_text_getclause, CMD/cm_pars.c cm_pars_loop): char_types[] of
// CMD/cm_char.c with the MARK_ bits of CMD/cm_defs.h, and the constants those
// two functions use.
const defsSource = fs.readFileSync(path.join(cmdDir, "cm_defs.h"), "latin1");
const MARK_BITS = new Map<string, number>();
for (const match of defsSource.matchAll(/^#define\s+(MARK_[a-z_]+)\s+(0x[0-9A-Fa-f]+)/gm)) {
  MARK_BITS.set(match[1], Number(match[2]));
}
const defined = (source: string, name: string, file: string): number => {
  const match = new RegExp(`^#define\\s+${name}\\s+(0x[0-9A-Fa-f]+|\\d+)`, "m").exec(source);
  if (!match) throw new Error(`E_PARSER_TABLE: ${file} does not define ${name}`);
  return Number(match[1]);
};
const markBit = (name: string): number => {
  const bit = MARK_BITS.get(name);
  if (bit === undefined) throw new Error(`E_PARSER_TABLE: unknown character mark '${name}'`);
  return bit;
};
const markTable = /\bchar_types\s*\[\s*\]\s*=\s*\{([\s\S]*?)\};/.exec(
  fs.readFileSync(path.join(cmdDir, "cm_char.c"), "latin1"),
);
if (!markTable) throw new Error("E_PARSER_TABLE: cm_char.c has no char_types");
const marks = markTable[1]
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split(",")
  .map((cell) => cell.trim())
  .filter((cell) => cell.length > 0)
  .map((cell) => cell.split("+").reduce((bits, name) => bits | markBit(name.trim()), 0))
  // The table has two entries after code 255 that no character reaches.
  .slice(0, 256);
if (marks.length !== 256) {
  throw new Error(`E_PARSER_TABLE: ${marks.length} character marks, expected 256`);
}
// par_def1.h gives PAR_MIN_INPUT_SIZE and the buffer sizes once per platform;
// the build is WIN32 and not MSDOS.
const parDefs = fs.readFileSync(path.join(cmdDir, "par_def1.h"), "latin1");
const minimumLength =
  /#ifdef MSDOS\s+#define PAR_MIN_INPUT_SIZE\s+\d+\s+#else\s+#define PAR_MIN_INPUT_SIZE\s+(\d+)/.exec(
    parDefs,
  );
const rollingStop = /#ifdef WIN32[\s\S]*?#define PAR_ROLLING_STOP_VALUE\s+(\d+)/.exec(parDefs);
if (!minimumLength || !rollingStop) {
  throw new Error("E_PARSER_TABLE: par_def1.h has no clause sizes where expected");
}
const typeBit = (name: string): number => {
  const bit = TYPE_BITS.get(name);
  if (bit === undefined) throw new Error(`E_PARSER_TABLE: unknown character type '${name}'`);
  return bit;
};
const clauses = {
  marks,
  spaceMark: markBit("MARK_space"),
  clauseMark: markBit("MARK_clause"),
  punctuationMark: markBit("MARK_punct"),
  // cm_text.c:413-435: in the punctuation mode "some" a character of the
  // quote type arrives as a space, these six excepted.
  quoteType: typeBit("TYPE_quot"),
  quoteMode: 1 << defined(defsSource, "PUNCT_some", "cm_defs.h"),
  keptQuotes: [")", "]", "}", '"', "\\", ">"].map((char) => char.charCodeAt(0)),
  // cm_text.c:636: a clause shorter than this goes by the rules, except in
  // the punctuation mode "all".
  minimumLength: Number(minimumLength[1]),
  wholeMode: 1 << defined(defsSource, "PUNCT_all", "cm_defs.h"),
  // cm_text.c:599: a clause this long is handed on in part.
  rollingStop: Number(rollingStop[1]),
  // cm_pars.c:1336: this many white space characters in a row end a clause.
  whiteSpaceRun: 40,
  // cm_cmd.c:168, :288: every command but the index commands has the clause
  // before it finished.
  markingCommands: ["index"],
  // The character that ends a clause (cm_text.c:471) and the marks around
  // phonemic text (par_def1.h).
  clauseEnd: 0x0b,
  phonesOn: defined(parDefs, "PAR_PHONES_ON_D", "par_def1.h"),
  phonesOff: defined(parDefs, "PAR_PHONES_OFF_D", "par_def1.h"),
  indexMark: defined(parDefs, "PAR_INDEX_DUMMY_CHAR", "par_def1.h"),
};

// The dictionary the parser asks about words (CMD/par_dict.c) is the
// pronunciation dictionary, dic/Dic_us.txt. A capital in an entry matches a
// capital only (par_dict_dlook, par_dict.c:531-542), and the dictionary asset
// (scripts/build-dectalk-dict.ts) has its words in lower case, so the entries
// with a capital are listed here: every spelling of a word that has one.
const spellings = new Map<string, string[]>();
for (const line of fs
  .readFileSync(path.join(dectalkRoot, "dapi", "src", "dic", "Dic_us.txt"), "latin1")
  .split(/\r?\n/)) {
  if (line.length === 0 || line.startsWith(";")) continue;
  // A word is the text before ",<one letter>,": the word itself may be a comma.
  const word = /^(.+?),[A-Z],/.exec(line)?.[1];
  if (word === undefined) continue;
  const key = word.toLowerCase();
  spellings.set(key, [...(spellings.get(key) ?? []), word]);
}
const capitalSpellings = Object.fromEntries(
  [...spellings].filter(([key, list]) => list.some((word) => word !== key)),
);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  `${JSON.stringify({
    schemaVersion: "v1",
    source: `DECtalk 4.63 CMD/${HEADER} (compiled from CMD/${RULE_TEXT}), CMD/par_char.c, INCLUDE/ls_lower.tab, CMD/cm_char.c, CMD/cm_defs.h, CMD/par_def1.h, CMD/cm_text.c, CMD/cm_pars.c; decoded by scripts/build-dectalk-text-parser.ts`,
    ruleText: `CMD/${RULE_TEXT}`,
    sections: ruleSections,
    rules,
    dictionaries,
    characterTypes,
    lowerCase,
    clauses,
    capitalSpellings,
  })}\n`,
);
const kinds = new Map<string, number>();
for (const rule of rules) kinds.set(rule.kind, (kinds.get(rule.kind) ?? 0) + 1);
console.log(
  JSON.stringify({
    entries: rules.length,
    kinds: Object.fromEntries(kinds),
    withLine: rules.filter((rule) => rule.line !== undefined).length,
    dictionaries: dictionaries.length,
    out: path.relative(repoRoot, outPath),
  }),
);
