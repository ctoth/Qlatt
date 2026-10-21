/**
 * build-dectalk-dict.ts — Convert the DECtalk 4.63 US pronunciation dictionary
 * (`Dic_us.txt`) into the flat word->ARPABET JSON format Qlatt's CMU dictionary
 * uses (the English frontend's declared CMU lexicon).
 *
 * This is a BUILD TOOL (like build-cmudict.ts), not pipeline/runtime code. It
 * produces the frontend's declared lexicon DATA ASSET. It does NOT wire
 * anything into the TTS pipeline.
 *
 * ---------------------------------------------------------------------------
 * Conversion: DECtalk single-ASCII phoneme codes -> ARPABET (Qlatt inventory)
 * ---------------------------------------------------------------------------
 * The DECtalk phoneme field is a string of one-ASCII-char-per-phoneme codes
 * with inline stress marks. Three chained DECtalk source tables define the
 * char -> ARPABET mapping in the frontend's dictionary-phoneme-map.yaml:
 *
 *   1. ptab[]  (char -> US_* enum name)
 *      C:\Users\Q\src\dectalk\463\dapi\src\dic\dic.c:96-149  (ENGLISH_US block)
 *
 *   2. US_* enum values
 *      C:\Users\Q\src\dectalk\463\dapi\src\INCLUDE\l_us_ph.h:59-116 (SIL=0..DF=56)
 *
 *   3. usa_arpa[]  (US_* enum index -> 2-char ARPABET)
 *      C:\Users\Q\src\dectalk\463\dapi\src\INCLUDE\usa_phon.tab:117-250
 *      Positionally indexed by the enum value from (2). Verified: idx0 SIL=`_`,
 *      idx1 IY=`iy`, idx9 AH=`ah`, idx33 NX=`nx`, idx56 DF=`df`.
 *
 * The tables fully determine char -> raw-ARPABET. A documented compatibility
 * map then reconciles the raw lowercase DECtalk ARPABET to the exact uppercase
 * symbol set in `public/rules/frontends/dectalk-english/inventory.yaml`
 * (e.g. ax->AX, hx->HH, ll->L, nx->NG). RR, IX and YU remain distinct phones.
 *
 * Stress: `'` = primary stress, backtick = secondary stress; marks wait across
 * onset consonants for the next vowel. Primary becomes stress digit 1, secondary digit
 * 2, an unmarked vowel 0. The inventory has no targets named with a 2; its
 * `secondary_stress_fallback` gives a secondary vowel the strong target while
 * the Segment keeps stress 2, which DECtalk's duration and F0 rules read
 * (FSTRESS_2, ph_defs.h). 3,591 of Dic_us.txt's 13,682 lines carry a secondary
 * stress, and some words have nothing stronger ("about" is xb`Wt, "make" m`ek,
 * "many" m`Eni).
 *
 * Boundary/control chars (`~` block-rules, `#` hyphen/compound, `*` morpheme
 * boundary, ` ` word boundary) produce metadata rather than phonemes.
 * Declared skip characters remain omitted; unknown characters emit diagnostics.
 *
 * Homographs: 254 words have two rows, marked `P` (primary) and `S`
 * (secondary) in the second field. The output is a flat map with the primary
 * row's pronunciation; the secondary rows go into the frontend's table
 * (scripts/build-dectalk-lts-table.ts), and src/g2p/table-homograph.ts
 * chooses between the two by context, as LTS/ls_homo.c does.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDiagnostics, type Diagnostics } from "../src/diagnostics";
import { loadYamlDocumentSync } from "../src/yaml-loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const DEFAULT_SRC = "C:\\Users\\Q\\src\\dectalk\\463\\dapi\\src\\dic\\Dic_us.txt";
// Read only the declaration so a missing output can still be built.
const frontend = loadYamlDocumentSync<{ resources: { lexicon: string } }>(
  path.join(root, "public", "rules", "frontends", "dectalk-english", "frontend.yaml"),
);
const OUT_PATH = path.resolve(root, "public", frontend.resources.lexicon.replace(/^\/+/, ""));

interface Cited {
  citations: string[];
}
interface DictionaryPhonemeMap {
  enum: Cited & { values: Record<string, number> };
  arpa: Cited & { values: string[] };
  characters: Cited & { values: Record<string, string> };
  vowels: Cited & { values: string[] };
  fixups: Record<string, Cited & { symbol: string; reason: string }>;
  stress: Cited & { default: string; marks: Record<string, string> };
  controls: Cited & { block_rules: string; morpheme_boundary: string[]; word_boundary: string };
  skip: Array<Cited & { character: string; reason: string }>;
}

const mapping = loadYamlDocumentSync<DictionaryPhonemeMap>(
  path.join(root, "public/rules/frontends/dectalk-english/dictionary-phoneme-map.yaml"),
);
for (const declaration of [
  mapping.enum,
  mapping.arpa,
  mapping.characters,
  mapping.vowels,
  mapping.stress,
  mapping.controls,
  ...Object.values(mapping.fixups),
  ...mapping.skip,
]) {
  if (
    !Array.isArray(declaration.citations) ||
    !declaration.citations.length ||
    !declaration.citations.every((citation) => typeof citation === "string" && citation.trim())
  )
    throw new Error("E_DICT_MAPPING: every mapping declaration requires citations");
}
for (const entry of [...Object.values(mapping.fixups), ...mapping.skip]) {
  if (typeof entry.reason !== "string" || !entry.reason.trim())
    throw new Error("E_DICT_MAPPING: compatibility mappings require a reason");
}
const CHAR_RAW_ARPA: Record<string, string> = {};
for (const [character, name] of Object.entries(mapping.characters.values)) {
  const index = mapping.enum.values[name];
  const raw = mapping.arpa.values[index];
  if (!Number.isInteger(index) || typeof raw !== "string" || !raw.trim())
    throw new Error(
      `E_DICT_MAPPING: character '${character}' references invalid table entry '${name}'`,
    );
  CHAR_RAW_ARPA[character] = raw.replace(/ /g, "");
}
const VOWEL_RAW = new Set(mapping.vowels.values);
const skipped = new Set(mapping.skip.map((entry) => entry.character));
const buildDiagnostics = createDiagnostics();
buildDiagnostics.subscribe((entry) => {
  if (entry) console.warn(`${entry.code}: ${entry.message} ${JSON.stringify(entry.data)}`);
});

/** Map a raw token to the declared inventory spelling, retaining vowel stress. */
function mapToken(raw: string, stress: string): string[] {
  const symbol = mapping.fixups[raw]?.symbol ?? raw.toUpperCase();
  return [VOWEL_RAW.has(raw) ? `${symbol}${stress}` : symbol];
}

/**
 * Convert one DECtalk phoneme field to a space-joined ARPABET string, empty
 * if the field yields no phonemes.
 */
export function convertPhonemeField(field: string, diagnostics = buildDiagnostics): string {
  return convertPhonemeFieldDetailed(field, diagnostics).phones.join(" ");
}

/**
 * The phones of a DECtalk phoneme field, and the indices of the phones that a
 * `~` stands before. `~` is BLOCK_RULES (INCLUDE/phonlist.h:191): DECtalk
 * gives the next phone FBLOCK and skips its allophone rules for that phone
 * (PH/ph_sort.c:1611-1612, PH/ph_aloph.c:563-567).
 *
 * `boundaryAfter` holds the indices of the phones that a `*` (MBOUND, a
 * morpheme boundary) or a `#` (HYPHEN, the joint of a compound) stands after
 * (INCLUDE/phonlist.h). Both give the rime before them the morpheme boundary
 * type (PH/ph_romi.c bounftab).
 *
 * `wordBreakAfter` holds the indices of the phones that a space stands after:
 * a word boundary inside the entry ("#" is `n'^mbR s`An`, two words).
 */
export function convertPhonemeFieldDetailed(
  field: string,
  diagnostics: Diagnostics = buildDiagnostics,
): {
  phones: string[];
  rulesBlocked: number[];
  boundaryAfter: number[];
  wordBreakAfter: number[];
} {
  const out: string[] = [];
  const rulesBlocked: number[] = [];
  const boundaryAfter: number[] = [];
  const wordBreakAfter: number[] = [];
  let stress = mapping.stress.default;
  let blockNext = false;
  let offset = 0;
  for (const c of field) {
    const at = offset;
    offset += c.length;
    const markedStress = mapping.stress.marks[c];
    if (markedStress !== undefined) {
      stress = markedStress;
      continue;
    }
    if (c === mapping.controls.block_rules) {
      blockNext = true;
      continue;
    }
    if (mapping.controls.morpheme_boundary.includes(c)) {
      if (out.length > 0 && !boundaryAfter.includes(out.length - 1)) {
        boundaryAfter.push(out.length - 1);
      }
      continue;
    }
    if (c === mapping.controls.word_boundary) {
      // A word boundary inside an entry.
      if (out.length > 0 && !wordBreakAfter.includes(out.length - 1)) {
        wordBreakAfter.push(out.length - 1);
      }
      continue;
    }
    if (skipped.has(c)) continue;
    const raw = CHAR_RAW_ARPA[c];
    if (raw === undefined) {
      diagnostics.warn(
        "Skipped unknown dictionary phoneme character",
        { field, character: c, offset: at },
        "DICT_UNKNOWN_CHARACTER",
      );
      continue;
    }
    if (blockNext) rulesBlocked.push(out.length);
    blockNext = false;
    const tokens = mapToken(raw, stress);
    for (const tok of tokens) out.push(tok);
    // A stress mark stands before its syllable and may have the onset between
    // it and the vowel ("overrun" is `ovR#~'r^n): it waits for the next phone
    // that carries a stress digit.
    if (tokens.some((tok) => /[0-9]$/.test(tok))) stress = mapping.stress.default;
  }
  return {
    phones: out,
    rulesBlocked,
    boundaryAfter,
    // A space after the last phone divides nothing.
    wordBreakAfter: wordBreakAfter.filter((index) => index < out.length - 1),
  };
}

export interface Row {
  word: string;
  pos: string;
  phonemes: string;
  /**
   * The form class field: one character per bit of the entry's form class
   * word, bit 0 first ("1" set), in the order of INCLUDE/fc_def.tab.
   */
  formClass: string;
  priority: number;
}

function parseLine(line: string): Row | null {
  if (!line || line.startsWith(";")) return null;
  // In the word, a backslash stands before a character that is taken as
  // written (dic/dic_comm.c:445-469): `\,` is the comma, `\;` the semicolon
  // and `\\` the backslash.
  let word = "";
  let at = 0;
  for (; at < line.length && line[at] !== ","; at += 1) {
    if (line[at] === "\\") at += 1;
    word += line[at] ?? "";
  }
  const f = line.slice(at + 1).split(",");
  if (f.length < 4) return null;
  const pos = f[0];
  const phonemes = f[1];
  const formClass = f[2];
  const priority = Number.parseInt(f[3], 10);
  if (!word || !phonemes) return null;
  return { word, pos, phonemes, formClass, priority: Number.isNaN(priority) ? 0 : priority };
}

/**
 * The rows of a `Dic_us.txt` text by lower-cased word.
 *
 * The second field says whether the word has two entries: `P` the primary
 * one, `S` the secondary, `N` neither (dic/dic_comm.c:485-501). `best` holds
 * the primary of such a pair and `secondary` the other; DECtalk chooses
 * between them by context (LTS/ls_homo.c, src/g2p/table-homograph.ts).
 *
 * The fifth field is not a preference between rows: the dictionary compiler
 * leaves out rows above a size limit given on its command line
 * (dic/dic_comm.c:646-664).
 *
 * Five words have two `N` rows that differ in case ("New" n`uw and "new"
 * n'uw). The keys here are lower case, so the lower-case row is kept: it is
 * the one DECtalk speaks for the word written in lower case ("a new car" has
 * primary stress on "new", "baton" is b@t'an). The capitalised row, which
 * DECtalk uses for the capitalised word (LTS/ls_dict.c:641-718), is in
 * `capitalised`.
 */
export function selectDictionaryRows(text: string): {
  best: Map<string, Row>;
  secondary: Map<string, Row>;
  capitalised: Map<string, Row>;
  totalRows: number;
  multiRowWords: Set<string>;
} {
  const best = new Map<string, Row>();
  const secondary = new Map<string, Row>();
  const capitalised = new Map<string, Row>();
  let totalRows = 0;
  const multiRowWords = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const row = parseLine(line);
    if (!row) continue;
    totalRows++;
    const key = row.word.toLowerCase();
    const existing = best.get(key);
    if (existing === undefined) {
      best.set(key, row);
      continue;
    }
    multiRowWords.add(key);
    if (row.pos === "S" && existing.pos === "P") {
      secondary.set(key, row);
    } else if (row.pos === "P" && existing.pos === "S") {
      secondary.set(key, existing);
      best.set(key, row);
    } else if (row.word === key && existing.word !== key) {
      capitalised.set(key, existing);
      best.set(key, row);
    } else if (row.word !== key && existing.word === key && row.pos === "N") {
      capitalised.set(key, row);
    }
  }
  for (const [key, row] of best) {
    if ((row.pos === "P" || row.pos === "S") && !secondary.has(key)) {
      throw new Error(`E_HOMOGRAPH_UNPAIRED: '${key}' has a ${row.pos} row and no partner`);
    }
  }
  return { best, secondary, capitalised, totalRows, multiRowWords };
}

/**
 * The dictionary's text, one character per byte ("exposé" has the byte E9,
 * which is the character U+00E9 here): a byte above 127 is what say.exe is
 * handed for an accented letter typed on its command line, and the
 * dictionary is searched for the word as it was written (LTS/ls_task.c:697,
 * 2040-2160). The compiled dictionary's words are read the same way
 * (scripts/build-dectalk-lts-table.ts), so the two agree and a word's place
 * in the search order is its bytes'. Bytes 80 to 9F are not mapped to the
 * characters the Windows code page gives them (the entry for byte 80, the
 * euro sign there, is under U+0080).
 */
export function readDictionaryText(srcPath: string): string {
  return fs.readFileSync(srcPath, "latin1");
}

function main(): void {
  const srcPath = process.argv[2] ?? DEFAULT_SRC;
  const text = readDictionaryText(srcPath);

  // One row per word: a homograph's primary row.
  const { best, totalRows, multiRowWords } = selectDictionaryRows(text);
  const collapsedWords = multiRowWords.size;

  const dict: Record<string, string> = {};
  for (const [key, row] of best) {
    const pron = convertPhonemeField(row.phonemes);
    if (pron.length > 0) dict[key] = pron;
  }

  // Sort keys for stable, reviewable output (cmu dict is insertion-ordered;
  // a deterministic sort keeps diffs clean).
  const sorted: Record<string, string> = {};
  for (const k of Object.keys(dict).sort()) sorted[k] = dict[k];

  const payload = `${JSON.stringify(sorted)}\n`;
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, payload, "utf8");

  console.log(`Source rows parsed:        ${totalRows}`);
  console.log(`Words with multiple rows:  ${collapsedWords} (one kept; see selectDictionaryRows)`);
  console.log(`Dictionary entries written: ${Object.keys(sorted).length}`);
  console.log(`Output: ${OUT_PATH}`);
}

// Only run the build when this file is executed directly, not when imported
// (the validator imports convertPhonemeField).
const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) main();
