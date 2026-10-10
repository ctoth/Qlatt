/**
 * DECtalk allophone sequences, from DECtalk's record and from this frontend,
 * in the same names, so the two can be compared.
 *
 * DECtalk's record is test/fixtures/dectalk-oracle/<corpus>.durations.json:
 * one list per clause of the allophones its duration routine timed, after its
 * allophone rules (ph_aloph.c). That is the level this frontend's Segments are
 * at; DECtalk's phoneme log (-lp) is written before those rules.
 */

import type { Utterance } from "../../src/declarative-frontend/hrg";

/**
 * The oracle corpora under test/oracle-corpora that have a DECtalk duration
 * record. dectalk-us-v1 is the corpus the rules were developed against,
 * dectalk-us-heldout-v1 neighbours of its words, dectalk-us-clause-v1
 * sentences that exercise the clause-level rules (helper verbs, phrase
 * starts, the hat pattern).
 */
export const DECTALK_CORPUS_FILES: readonly string[] = [
  "dectalk-us-v1.json",
  "dectalk-us-heldout-v1.json",
  "dectalk-us-clause-v1.json",
];

/**
 * Corpora spoken by a voice other than Paul (`defaults.voiceId`). They have a
 * packet record only (<corpus>.frames.json), for the frame gate: what a voice
 * changes is in the packets.
 */
export const DECTALK_VOICE_CORPUS_FILES: readonly string[] = [
  "dectalk-us-betty-v1.json",
  "dectalk-us-harry-v1.json",
  // One voice for each further path of setspdef() (ph_vset.c): Frank's own
  // block, a voice whose F5 is switched off, and a female voice with an F5.
  "dectalk-us-frank-v1.json",
  "dectalk-us-dennis-v1.json",
  "dectalk-us-ursula-v1.json",
];

/**
 * Paul corpora with a packet record only: sentences added for one rule of the
 * text stage or of the stress rules, where the packets say everything.
 */
export const DECTALK_PACKET_CORPUS_FILES: readonly string[] = [
  // A text of more than 4096 frames: the frame where the pseudojitter phases wrap.
  "dectalk-us-long-text-v1.json",
  // One-letter words and initials; promote_last_2 before a verb phrase.
  "dectalk-us-letters-v1.json",
  // Numbers with an ordinal ending, spoken by the number routine.
  "dectalk-us-ordinals-v1.json",
  // Abbreviations the dictionary holds with their period, by the word's case.
  "dectalk-us-abbrev-v1.json",
  // Words DECtalk's command-stage parser rewrites before letter-to-sound.
  "dectalk-us-parser-words-v1.json",
  // The same word twice in a row: a word is its Word Item, not its spelling.
  "dectalk-us-repeated-words-v1.json",
  // A word-initial AE before T in the word's last rime (ph_aloph.c:801-814).
  "dectalk-us-at-rime-v1.json",
  // One sentence at speaking rates on both sides of 350 words per minute.
  "dectalk-us-rate-frames-v1.json",
  // Texts with no punctuation at their end.
  "dectalk-us-unpunctuated-v1.json",
  // An initial's empty clause after a clause whose third allophone is /k/.
  "dectalk-us-empty-clause-v1.json",
  // Hyphenated words, dictionary words with a slash, punctuation written
  // against an abbreviation, and the letter-to-sound rules' morpheme marks.
  "dectalk-us-word-forms-v1.json",
  // Fractions, part numbers ("10-15") and a dollar amount before "million".
  "dectalk-us-number-forms-v1.json",
  // A word with "?!" on it, and "am" and "pm" after a number: both spelled.
  "dectalk-us-spelled-forms-v1.json",
  // The clause breaks the text stage inserts: where a stretch of words ends,
  // its length at a text's end, and conjunctions of several words.
  "dectalk-us-clause-breaks-v1.json",
  // A slowly spelled part at a word's end, a hyphen at a word's end, a word
  // with a comma and a mark on it, letters and digits in one word, questions
  // that begin with a wh-word, and "Dr." and "St." by what follows them.
  "dectalk-us-odd-words-v1.json",
  // A symbol standing alone that the dictionary names, a decimal with no
  // digit before its point, a path with slashes, and two words written apart.
  "dectalk-us-symbol-words-v1.json",
  // A sign written on a number, and a lone "a" right after a number.
  "dectalk-us-signed-numbers-v1.json",
  // A period standing alone that is a word, a mark after a stripped
  // parenthesis, a period before a comma, words of slashes and hyphens, and
  // a word with two periods on it.
  "dectalk-us-lone-marks-v1.json",
  // Two /w/ across a word boundary, and clauses of more allophones than the
  // feature table has words (duration Rule 9 indexes it by clause position).
  "dectalk-us-long-clauses-v1.json",
  // promote_last_2: which secondary stress a stressed syllabic before a
  // verb phrase makes primary, past stretches that have none.
  "dectalk-us-promotion-v1.json",
  // A prepositional-phrase start with no word boundary before it: "and" or
  // "for" after the text parser's phonemic "dot".
  "dectalk-us-phrase-start-alone-v1.json",
  // A mark after an initial's period, and a question mark or a comma after
  // a parenthesis inside a quotation, for Paul and for Betty. (Recorded
  // ahead of the text rules that speak them, hence the name.)
  "dectalk-us-empty-clause-ahead-v1.json",
  "dectalk-us-betty-empty-clause-ahead-v1.json",
  // A word the text parser leaves an opening quotation mark on: a clause
  // break before it, by the rules for a conjunction.
  "dectalk-us-quote-breaks-v1.json",
  // An initial's periods leave the text stage's first-word state as it was:
  // the question mark of a wh-question and a first auxiliary's stress after one.
  "dectalk-us-initial-sentence-state-v1.json",
  // A written word spelled letter by letter is one word in the count the
  // clause breaks before conjunctions and prepositions are made by.
  "dectalk-us-spelled-word-breaks-v1.json",
  // Labels that end in a colon, one after another.
  "dectalk-us-label-colons-v1.json",
  // Words the dictionary holds capitalised and in lower case with different
  // phones ("New" and "new"), by how the word is written.
  "dectalk-us-capitalised-entries-v1.json",
  // The plural of a letter ("p's"): the text parser writes phonemic z
  // against the letter, with no word boundary before or after it, and a
  // mark right after it is a word.
  "dectalk-us-plural-letters-v1.json",
  // Digits with an apostrophe between them ("5'10"), spelled.
  "dectalk-us-digit-apostrophe-v1.json",
  // A period standing apart with a comma or a semicolon on it (the parser's
  // `Ibid .,`): the word "period", then the mark as its delimiter.
  "dectalk-us-period-word-marks-v1.json",
  // Words with an accented letter: looked up as written, else read by rule
  // with the accent folded away.
  "dectalk-us-accented-letters-v1.json",
  // A text that ends in a mark with an apostrophe on it, or in the word
  // "period" and two clause ends: one period.
  "dectalk-us-text-end-marks-v1.json",
  // A plus sign inside a word (the local part of a mail address): spelled.
  "dectalk-us-address-plus-v1.json",
  // Digits with a colon that are no clock time: spelled, "colon" by name.
  "dectalk-us-digit-colon-v1.json",
  // "2024-03-15": a part number, not a date.
  "dectalk-us-dashed-dates-v1.json",
  // "to", "and", "for" written with an apostrophe on them: the main
  // dictionary's words, with no phrase start.
  "dectalk-us-quoted-special-words-v1.json",
  // A comma or semicolon stripped from its word with an apostrophe: it ends
  // the clause but sends no word's class again.
  "dectalk-us-stripped-comma-v1.json",
  // A /t/ in a word's last rime before a sonorant ("attn"): glottalized.
  "dectalk-us-rime-t-glottal-v1.json",
  // An /l/ after a vowel that absorbed its /r/ ("clearly"): not postvocalic.
  "dectalk-us-lateral-after-r-v1.json",
  // A part number's class is its first run's, when the dictionary has it.
  "dectalk-us-part-number-class-v1.json",
  // A number with a hyphen at its end ("80-", as the parser leaves "$80-$120"):
  // a part number, the hyphen named.
  "dectalk-us-number-hyphen-end-v1.json",
];

/** Every corpus with a packet record. */
export const DECTALK_FRAME_CORPUS_FILES: readonly string[] = [
  ...DECTALK_CORPUS_FILES,
  ...DECTALK_VOICE_CORPUS_FILES,
  ...DECTALK_PACKET_CORPUS_FILES,
];

/**
 * The corpus files a comparison script covers: `all` (Paul's three unless the
 * script has a record of the voice corpora too), or the one named by
 * `--corpus <id>`, which may also be a voice corpus.
 */
export function selectedCorpusFiles(
  argv: readonly string[],
  all: readonly string[] = DECTALK_CORPUS_FILES,
): readonly string[] {
  const index = argv.indexOf("--corpus");
  if (index < 0) return all;
  const file = `${argv[index + 1]}.json`;
  if (!DECTALK_FRAME_CORPUS_FILES.includes(file)) {
    throw new Error(`E_CORPUS_UNKNOWN: '${argv[index + 1]}'`);
  }
  return [file];
}

// DECtalk 4.63 INCLUDE/l_all_ph.h, `#define US_<NAME> <index>`.
export const US_ALLOPHONE_NAMES = [
  "SIL", "IY", "IH", "EY", "EH", "AE", "AA", "AY", "AW", "AH",
  "AO", "OW", "OY", "UH", "UW", "RR", "YU", "AX", "IX", "IR",
  "ER", "AR", "OR", "UR", "W", "Y", "R", "LL", "HX", "RX",
  "LX", "M", "N", "NX", "EL", "DZ", "EN", "F", "V", "TH",
  "DH", "S", "Z", "SH", "ZH", "P", "B", "T", "D", "K",
  "G", "DX", "TX", "Q", "CH", "JH", "DF", "TZ", "CZ",
]; // biome-ignore format: ten per row, as in the header

// This frontend's phone names that differ from DECtalk's.
const PORT_TO_DECTALK: Readonly<Record<string, string>> = {
  HH: "HX",
  NG: "NX",
  L: "LL",
  GS: "Q",
};

/** DECtalk's name for a Segment's phone: stress digit removed, port spelling undone. */
export function dectalkAllophoneName(phoneme: string): string {
  const bare = phoneme.replace(/[0-9]$/, "");
  return PORT_TO_DECTALK[bare] ?? bare;
}

/**
 * The frontend's allophones, one list per clause. A stop is counted once (its
 * release pieces are skipped), the dummy vowel after a final stop is not an
 * allophone of the duration routine, and a punctuation silence ends a clause.
 */
export function qlattAllophoneClauses(utterance: Utterance): string[][] {
  const clauses: string[][] = [[]];
  for (const item of utterance.relation("Segment").listItems()) {
    if (item.get("active") === false) continue;
    const phoneme = String(item.get("phoneme"));
    if (phoneme === "SIL") {
      if (item.get("punctuationSymbol") != null && clauses[clauses.length - 1].length > 0) {
        clauses.push([]);
      }
      continue;
    }
    const type = item.get("type");
    if (type === "stop_release" || type === "stop_aspiration") continue;
    clauses[clauses.length - 1].push(dectalkAllophoneName(phoneme));
  }
  return clauses.filter((clause) => clause.length > 0);
}

/** DECtalk's allophones for one fixture entry, one list per clause, silences left out. */
export function recordedAllophoneClauses(entry: {
  clauses: ReadonlyArray<ReadonlyArray<{ kind: string; ph?: number }>>;
}): string[][] {
  return entry.clauses.map((clause) =>
    clause.flatMap((allophone) =>
      allophone.kind === "phone" || allophone.kind === "fixed"
        ? [US_ALLOPHONE_NAMES[allophone.ph as number] ?? `#${String(allophone.ph)}`]
        : [],
    ),
  );
}

/** The vowels IY..UR (codes 1-23); only these carry a stress level in a log. */
export const US_VOWEL_NAMES: ReadonlySet<string> = new Set(US_ALLOPHONE_NAMES.slice(1, 24));

/** One phone of DECtalk's phoneme log; `stress` is null for a non-vowel. */
export type LoggedPhone = { name: string; stress: number | null };

// The log's spelling of each allophone: lower case, with Y written `yx`.
const LOG_SYMBOLS = new Map(
  US_ALLOPHONE_NAMES.filter((name) => name !== "SIL").map((name) => [
    name === "Y" ? "yx" : name.toLowerCase(),
    name,
  ]),
);
// Morpheme, compound and syllable marks, and the phrase symbols DECtalk
// prints before some words (`)` starts a verb phrase, `(` a prepositional one).
const LOG_SKIPPED = new Set('*#-~=()>/\\+^&"_');

/**
 * Parse DECtalk's phoneme log (`say.exe -lp`) for one word: a run of two- or
 * one-letter phoneme symbols with `'` (primary) or a backtick (secondary)
 * before a stressed vowel.
 */
export function parsePhonemeLog(log: string): LoggedPhone[] {
  const phones: LoggedPhone[] = [];
  let pending = 0;
  for (let i = 0; i < log.length; ) {
    const char = log[i];
    if (/\s/.test(char) || LOG_SKIPPED.has(char)) {
      i += 1;
    } else if (char === "'") {
      pending = 1;
      i += 1;
    } else if (char === "`") {
      pending = 2;
      i += 1;
    } else {
      const two = LOG_SYMBOLS.get(log.slice(i, i + 2));
      const name = two ?? LOG_SYMBOLS.get(char);
      if (!name) throw new Error(`E_LOG_SYMBOL: '${log.slice(i, i + 2)}' in '${log}'`);
      const vowel = US_VOWEL_NAMES.has(name);
      phones.push({ name, stress: vowel ? pending : null });
      if (vowel) pending = 0;
      i += two ? 2 : 1;
    }
  }
  return phones;
}
