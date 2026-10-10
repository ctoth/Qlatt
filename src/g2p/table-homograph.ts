/**
 * The choice between a dictionary word's two entries (a homograph: "house"
 * the noun and "house" the verb), from the classes of the words around it.
 *
 * A port of DECtalk 4.63 LTS/ls_homo.c ls_homo_homo (:89-628) as the US
 * build compiles it, with the rule table of LTS/ls_homo.h as data. The
 * choices forced by an in-text command (`pronflag`, :207-334) are not ported.
 *
 * DECtalk reads the words up to a punctuation mark twice (LTS/ls_task.c
 * :383-401): once to find their classes, once to speak them. Only the second
 * reading has the rule for the first word.
 */

/** The name of each bit of a form class word, and the rules that use them. */
export interface HomographTable {
  formClassNames?: readonly (string | null)[];
  /** The primary entry's class word, by word. */
  wordFormClasses?: Readonly<Record<string, number>>;
  /** The secondary entry of each word that has two. */
  homographs?: Readonly<Record<string, HomographEntry>>;
  /** `[suffix, context, select, eliminate]` class words, in order. */
  homographRules?: readonly (readonly number[])[];
}

export interface HomographEntry {
  phonemes: readonly string[];
  formClass: number;
  /** Indices of the phones whose allophone rules are blocked. */
  rulesBlockedAt?: readonly number[];
  /** Indices of the phones a morpheme boundary or compound joint stands after. */
  boundaryAfter?: readonly number[];
}

/** Where a word stands among the words up to the next punctuation mark. */
export interface ClauseContext {
  /**
   * The class words of the earlier words, in order. A homograph writes
   * `noun` over an unknown class (zero) of the word before it, as DECtalk
   * does (ls_homo.c:411-412), so this array is changed in place.
   */
  before: number[];
  /**
   * Whether a later word has the class `verb`, as found by the first
   * reading; null during that reading.
   */
  laterVerb: boolean | null;
  /** Whether the word is the last one before the punctuation mark. */
  atPunctuation: boolean;
  /**
   * The word is looked up for its class alone, as DECtalk's text stage looks
   * every word of a sentence up before it speaks any (LTS/ls_task.c:5109-5113):
   * the fixed classes its mini dictionary gives a word when the word is
   * spoken (LTS/ls_task.c:1062-1078) are not given here.
   */
  classLookup?: boolean;
  /**
   * The number word that stands one or two words before this one, as written
   * ("5", "1,000", "1.5"); absent when none does. A unit abbreviation is read
   * by it (table-lts-pronounce.ts numberAbbreviations).
   */
  numberBefore?: string;
  /**
   * The punctuation mark the word stands against, when it is the last one
   * before a mark and the mark is known.
   */
  markAfter?: string;
  /**
   * The word was written with a capital first letter and a lower-case second
   * one: DECtalk's dictionary search calls it capitalised (LTS/ls_dict.c:665).
   */
  capitalised?: boolean;
  /**
   * The word was written with an apostrophe at an end that was stripped
   * before this lookup ("'and"). DECtalk's mini dictionary is searched for
   * the word as written, before anything is stripped (LTS/ls_task.c:686-697,
   * 1900-1917), so such a word is not one of its words.
   */
  edgeStripped?: boolean;
  /**
   * The word is a dollar amount and the next one is a word that takes
   * "dollars" behind it ("$2 million").
   */
  quantityAfter?: boolean;
  /** The word is such a word and stands right after a dollar amount. */
  moneyBefore?: boolean;
  /**
   * The word right before this one is a plain number, a clock time or a
   * number with an ordinal ending: "am" and "pm" are spelled after the first
   * two, and a lone "a" is the letter after the first and the last. `part` is
   * a part number whose first character is a digit ("80-120", "80-"): the
   * plain-number routine was entered for it, and "a" is the letter after it
   * too.
   */
  afterNumber?: "plain" | "time" | "ordinal" | "part";
}

/** The context of a word spoken alone. */
export const loneWordContext = (): ClauseContext => ({
  before: [],
  laterVerb: false,
  atPunctuation: true,
});

const shares = (a: number, b: number): boolean => (BigInt(a) & BigInt(b)) !== 0n;
const contains = (a: number, b: number): boolean => (BigInt(a) & BigInt(b)) === BigInt(b);

function bit(table: HomographTable, name: string): number {
  const index = (table.formClassNames ?? []).indexOf(name);
  if (index < 0) throw new Error(`E_FORM_CLASS_NAME: '${name}'`);
  return 2 ** index;
}

/**
 * Which entry of `word` is spoken, or null when the word has one entry.
 *
 * `classSoFar` is the class the word has when its dictionary entry is
 * reached: zero for the word itself, a suffix's class for the root of a
 * suffixed word. `bySuffixRule` says the deciding rule was one that reads
 * that class; the word then takes the chosen entry's class whole
 * (ls_homo.c:529-538).
 */
export function chooseHomograph(
  table: HomographTable,
  word: string,
  classSoFar: number,
  context: ClauseContext,
): { secondary: boolean; bySuffixRule: boolean } | null {
  const other = table.homographs?.[word];
  const rules = table.homographRules;
  if (!other || !rules) return null;
  const primaryClass = table.wordFormClasses?.[word] ?? 0;
  const place = context.before.length + 1;
  const noun = bit(table, "noun");
  const verb = bit(table, "verb");
  const adverb = bit(table, "adv");
  // :411-412. "Set the previous wordclass to noun if it is unknown."
  if (place > 1 && context.before[place - 2] === 0) context.before[place - 2] = noun;
  const previous = place > 1 ? context.before[place - 2] : 0;
  const beforePrevious = place >= 3 ? context.before[place - 3] : 0;

  // :421-516. The first rule that decides, wins.
  let secondary = false;
  let decidedBy = -1;
  for (let index = 0; index < rules.length && decidedBy < 0; index += 1) {
    const [suffix, near, select, eliminate] = rules[index];
    if (suffix !== 0 && !contains(classSoFar, suffix)) continue;
    const inContext =
      near === 0 ||
      (place > 1 && shares(near, previous)) ||
      (place >= 3 && shares(adverb, previous) && shares(near, beforePrevious));
    if (!inContext) continue;
    const [first, second] = [primaryClass, other.formClass];
    if (select !== 0) {
      if (shares(select, first)) decidedBy = index;
      else if (shares(select, second)) {
        secondary = true;
        decidedBy = index;
      }
    }
    if (decidedBy < 0 && eliminate !== 0) {
      if (shares(eliminate, second)) decidedBy = index;
      else if (shares(eliminate, first)) {
        secondary = true;
        decidedBy = index;
      }
    }
  }
  if (decidedBy >= 0 && rules[decidedBy][0] !== 0) return { secondary, bySuffixRule: true };

  // :540-623. The first word, on the second reading: with no verb after it,
  // the entry that is a verb.
  if (place === 1 && context.laterVerb === false) {
    const chosen = secondary ? other.formClass : primaryClass;
    const unchosen = secondary ? primaryClass : other.formClass;
    if (!shares(chosen, verb) && shares(unchosen, verb)) secondary = !secondary;
  }
  return { secondary, bySuffixRule: false };
}
