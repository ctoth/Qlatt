/**
 * build-dectalk-dict.ts — Convert the DECtalk 4.63 US pronunciation dictionary
 * (`Dic_us.txt`) into the flat word->ARPABET JSON format Qlatt's CMU dictionary
 * uses (`public/cmu-dictionary.json`).
 *
 * This is a BUILD TOOL (like build-cmudict.ts), not pipeline/runtime code. It
 * produces a DATA ASSET (`public/dectalk-dictionary.json`). It does NOT wire
 * anything into the TTS pipeline.
 *
 * ---------------------------------------------------------------------------
 * Conversion: DECtalk single-ASCII phoneme codes -> ARPABET (Qlatt inventory)
 * ---------------------------------------------------------------------------
 * The DECtalk phoneme field is a string of one-ASCII-char-per-phoneme codes
 * with inline stress marks. Two chained DECtalk source tables define the
 * char -> ARPABET mapping; both are transcribed verbatim below:
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
 * The two tables fully determine char -> raw-ARPABET. A small documented FIXUP
 * map then reconciles the raw lowercase DECtalk ARPABET to the exact uppercase
 * symbol set in `public/rules/frontends/dectalk-english/inventory.yaml`
 * (e.g. rr->ER, ax->AX, hx->HH, ll->L, nx->NG, ix->IH, yu->Y+UW).
 *
 * Stress: `'` = primary stress, backtick = secondary stress; both immediately
 * precede the stressed vowel. Primary becomes stress digit 1, secondary digit
 * 2, an unmarked vowel 0. The inventory has no targets named with a 2; its
 * `secondary_stress_fallback` gives a secondary vowel the strong target while
 * the Segment keeps stress 2, which DECtalk's duration and F0 rules read
 * (FSTRESS_2, ph_defs.h). 3,591 of Dic_us.txt's 13,682 lines carry a secondary
 * stress, and some words have nothing stronger ("about" is xb`Wt, "make" m`ek,
 * "many" m`Eni).
 *
 * Boundary/control chars (`~` block-rules, `#` hyphen/compound, `*` morpheme
 * boundary, ` ` word boundary) produce no phoneme and are skipped.
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const DEFAULT_SRC = "C:\\Users\\Q\\src\\dectalk\\463\\dapi\\src\\dic\\Dic_us.txt";
const OUT_PATH = path.join(root, "public", "dectalk-dictionary.json");

// --- Table 2: US_* enum values (l_us_ph.h:59-116) ---------------------------
// Index into usa_arpa[] is exactly this value.
const ENUM_VALUE: Record<string, number> = {
  SIL: 0,
  IY: 1,
  IH: 2,
  EY: 3,
  EH: 4,
  AE: 5,
  AA: 6,
  AY: 7,
  AW: 8,
  AH: 9,
  AO: 10,
  OW: 11,
  OY: 12,
  UH: 13,
  UW: 14,
  RR: 15,
  YU: 16,
  AX: 17,
  IX: 18,
  IR: 19,
  ER: 20,
  AR: 21,
  OR: 22,
  UR: 23,
  W: 24,
  Y: 25,
  R: 26,
  LL: 27,
  HX: 28,
  RX: 29,
  LX: 30,
  M: 31,
  N: 32,
  NX: 33,
  EL: 34,
  DZ: 35,
  EN: 36,
  F: 37,
  V: 38,
  TH: 39,
  DH: 40,
  S: 41,
  Z: 42,
  SH: 43,
  ZH: 44,
  P: 45,
  B: 46,
  T: 47,
  D: 48,
  K: 49,
  G: 50,
  DX: 51,
  TX: 52,
  Q: 53,
  CH: 54,
  JH: 55,
  DF: 56,
};

// --- Table 3: usa_arpa[] (usa_phon.tab:117-174), enum-indexed -----------------
// Each entry is the 2-char ARPABET for the enum value at that index. Trailing
// space ' ' (single-char phonemes) is trimmed. Only indices 0..56 are real.
const USA_ARPA: string[] = [
  "_ ",
  "iy",
  "ih",
  "ey",
  "eh",
  "ae",
  "aa",
  "ay",
  "aw",
  "ah", // 0-9
  "ao",
  "ow",
  "oy",
  "uh",
  "uw",
  "rr",
  "yu",
  "ax",
  "ix",
  "ir", // 10-19
  "er",
  "ar",
  "or",
  "ur",
  "w ",
  "yx",
  "r ",
  "ll",
  "hx",
  "rx", // 20-29
  "lx",
  "m ",
  "n ",
  "nx",
  "el",
  "dz",
  "en",
  "f ",
  "v ",
  "th", // 30-39
  "dh",
  "s ",
  "z ",
  "sh",
  "zh",
  "p ",
  "b ",
  "t ",
  "d ",
  "k ", // 40-49
  "g ",
  "dx",
  "tx",
  "q ",
  "ch",
  "jh",
  "df", // 50-56
];

// --- Table 1: ptab[] (dic.c:96-149), dict-char -> US_* enum name -------------
const PTAB: Record<string, string> = {
  e: "EY",
  a: "AA",
  i: "IY",
  E: "EH",
  A: "AY",
  I: "IH",
  O: "OY",
  o: "OW",
  u: "UW",
  "^": "AH",
  W: "AW",
  Y: "YU",
  R: "RR",
  c: "AO",
  "@": "AE",
  U: "UH",
  "|": "IX",
  x: "AX",
  p: "P",
  t: "T",
  k: "K",
  f: "F",
  T: "TH",
  s: "S",
  S: "SH",
  C: "CH",
  w: "W",
  y: "Y",
  h: "HX",
  l: "LL",
  L: "EL",
  N: "EN",
  b: "B",
  d: "D",
  g: "G",
  v: "V",
  D: "DH",
  z: "Z",
  Z: "ZH",
  J: "JH",
  m: "M",
  n: "N",
  G: "NX",
  r: "R",
  q: "Q",
  Q: "TX",
  "&": "DX",
  F: "DF",
  B: "IR",
  K: "ER",
  P: "AR",
  M: "OR",
  j: "UR",
};

// --- Derived: dict-char -> raw lowercase ARPABET -----------------------------
const CHAR_RAW_ARPA: Record<string, string> = {};
for (const [ch, name] of Object.entries(PTAB)) {
  const idx = ENUM_VALUE[name];
  CHAR_RAW_ARPA[ch] = USA_ARPA[idx].replace(/ /g, "");
}

// Raw lowercase ARPABET symbols that ARE vowels (carry a stress digit).
const VOWEL_RAW = new Set([
  "iy",
  "ih",
  "ey",
  "eh",
  "ae",
  "aa",
  "ay",
  "aw",
  "ah",
  "ao",
  "ow",
  "oy",
  "uh",
  "uw",
  "rr",
  "yu",
  "ax",
  "ix",
  "ir",
  "er",
  "ar",
  "or",
  "ur",
]);

// --- FIXUP: raw lowercase ARPABET -> Qlatt inventory symbol(s) ----------------
// Reconciles DECtalk's raw output to the exact key set in
// dectalk-english/inventory.yaml. Vowels here are returned WITHOUT the stress
// digit; the digit is appended by mapToken.
const FIXUP_VOWEL: Record<string, string> = {
  // rr, ix and yu are inventory phones (RR, IX, YU) and need no fixup. rr and
  // ix were once folded into ER and IH, which are different DECtalk allophones
  // (US_ER is the fused vowel of "air"; US_IH is the full vowel of "bit"), and
  // yu was split into Y + UW.
  ax: "AX", // reduced schwa -> AX (DECtalk US_AX code 17)
};
const FIXUP_CONS: Record<string, string> = {
  yx: "Y", // Y glide (dict char 'y') -> inventory Y
  hx: "HH", // -> inventory HH
  ll: "L", // -> inventory L
  nx: "NG", // -> inventory NG
  rx: "R", // allophonic r -> R
  lx: "L", // allophonic l -> L
  dz: "D", // dentalized d -> D
  // df, dx, tx, q kept as uppercase (all are inventory keys: DX, TX, Q;
  // DF is documented below if it ever appears)
};

/**
 * Map one raw ARPABET token + its stress digit to inventory symbol(s).
 */
function mapToken(raw: string, stress: string): string[] {
  if (VOWEL_RAW.has(raw)) {
    const fixed = FIXUP_VOWEL[raw];
    if (fixed) return [`${fixed}${stress}`];
    return [`${raw.toUpperCase()}${stress}`];
  }
  const fixed = FIXUP_CONS[raw];
  return [fixed ?? raw.toUpperCase()];
}

/**
 * Convert one DECtalk phoneme field to a space-joined ARPABET string, empty
 * if the field yields no phonemes.
 */
export function convertPhonemeField(field: string): string {
  return convertPhonemeFieldDetailed(field).phones.join(" ");
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
export function convertPhonemeFieldDetailed(field: string): {
  phones: string[];
  rulesBlocked: number[];
  boundaryAfter: number[];
  wordBreakAfter: number[];
} {
  const out: string[] = [];
  const rulesBlocked: number[] = [];
  const boundaryAfter: number[] = [];
  const wordBreakAfter: number[] = [];
  let stress = "0";
  let blockNext = false;
  for (const c of field) {
    if (c === "'") {
      stress = "1";
      continue;
    } // primary stress
    if (c === "`") {
      stress = "2";
      continue;
    } // secondary stress
    if (c === "~") {
      blockNext = true;
      continue;
    }
    if (c === "#" || c === "*") {
      if (out.length > 0 && !boundaryAfter.includes(out.length - 1)) {
        boundaryAfter.push(out.length - 1);
      }
      continue;
    }
    if (c === " ") {
      // A word boundary inside an entry.
      if (out.length > 0 && !wordBreakAfter.includes(out.length - 1)) {
        wordBreakAfter.push(out.length - 1);
      }
      continue;
    }
    // Glottal stop (q / US_Q): a juncture marker between abutting vowels (the
    // sole occurrence is "minutiae" = mIn'uSi q`i). The dectalk-english Klatt
    // inventory has no discrete glottal-stop segment, and CMU likewise omits it
    // (minutiae -> "M IH0 N UW1 SH IY0 AH0", vowels simply abut). Drop it so the
    // vowels run together, matching both references.
    if (c === "q") continue;
    const raw = CHAR_RAW_ARPA[c];
    if (raw === undefined) continue; // unknown char: skip (validator reports these)
    if (blockNext) rulesBlocked.push(out.length);
    blockNext = false;
    const tokens = mapToken(raw, stress);
    for (const tok of tokens) out.push(tok);
    // A stress mark stands before its syllable and may have the onset between
    // it and the vowel ("overrun" is `ovR#~'r^n): it waits for the next phone
    // that carries a stress digit.
    if (tokens.some((tok) => /[0-9]$/.test(tok))) stress = "0";
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
 * DECtalk uses for the capitalised word, is not kept.
 */
export function selectDictionaryRows(text: string): {
  best: Map<string, Row>;
  secondary: Map<string, Row>;
  totalRows: number;
  multiRowWords: Set<string>;
} {
  const best = new Map<string, Row>();
  const secondary = new Map<string, Row>();
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
      best.set(key, row);
    }
  }
  for (const [key, row] of best) {
    if ((row.pos === "P" || row.pos === "S") && !secondary.has(key)) {
      throw new Error(`E_HOMOGRAPH_UNPAIRED: '${key}' has a ${row.pos} row and no partner`);
    }
  }
  return { best, secondary, totalRows, multiRowWords };
}

function main(): void {
  const srcPath = process.argv[2] ?? DEFAULT_SRC;
  const text = fs.readFileSync(srcPath, "utf8");

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
