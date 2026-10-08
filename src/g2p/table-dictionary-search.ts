/**
 * DECtalk 4.63's main dictionary search, over the words of its compiled
 * dictionary in their compiled order and with their case.
 *
 * A transcription of LTS/ls_dict.c: ls_dict_find_word (the binary search and
 * the capitalised-entry step, lines 500-715), ls_dict_dlook (one entry against
 * the word, 855-1051) and ls_dict_where_to_look (1071-1124).
 *
 * The search is not a plain lookup, and what it finds depends on the order of
 * the entries and on how the word is written:
 *   - a lower-case letter of the word matches only a lower-case letter of an
 *     entry; an upper-case letter matches either (ls_dict.c:960-964), so
 *     "dept." does not find the entry "Dept.";
 *   - a word looked up as an abbreviation also matches an entry that is the
 *     word plus a period (ls_dict.c:916-920), and which of "fig" and "fig."
 *     it lands on is decided by the path of the binary search.
 */

/** What the search found: the entry's index, and whether it is word + ".". */
export type DictionarySearchHit = { index: number; abbreviation: boolean };

type Direction = "higher" | "lower";
type Look = { hit: true; abbreviation: boolean } | { hit: false; direction: Direction };

const isLower = (code: number): boolean => code >= 0x61 && code <= 0x7a;
const isUpper = (code: number): boolean => code >= 0x41 && code <= 0x5a;
// LTS/l_us_cha.c ls_upper[]: lower-case ASCII folded to upper, the rest kept.
const upper = (code: number): number => (isLower(code) ? code - 0x20 : code);
// A string's character code, 0 past its end, as the C strings have it.
const at = (text: string, index: number): number =>
  index < text.length ? text.charCodeAt(index) : 0;

/** ls_dict_where_to_look: which way the word lies from a miscompared entry. */
function whereToLook(word: string, entry: string): Direction {
  let pivot = 0;
  let i = 0;
  for (; at(word, i) !== 0; i += 1) {
    pivot = upper(at(entry, i));
    if (upper(at(word, i)) !== pivot) break;
  }
  if (at(word, i) === 0 && at(entry, i) === 0) return "higher";
  return upper(at(word, i)) > pivot ? "higher" : "lower";
}

/** ls_dict_dlook: the entry at `index` against the word. */
function look(
  words: readonly string[],
  index: number,
  word: string,
  abbreviationLook: boolean,
): Look {
  const limit = words.length - 1;
  if (index < 0) return { hit: false, direction: "higher" };
  if (index > limit) return { hit: false, direction: "lower" };
  const entry = words[index];
  let abbreviation = false;
  let i = 0;
  for (; at(entry, i) !== 0; i += 1) {
    if (at(word, i) === 0) {
      if (abbreviationLook && at(entry, i) === 0x2e && at(entry, i + 1) === 0) {
        abbreviation = true;
        break;
      }
      return { hit: false, direction: "lower" };
    }
    if (at(word, i) === at(entry, i)) continue;
    if (isLower(at(entry, i)) && at(word, i) === upper(at(entry, i))) continue;
    if (index === 0) return { hit: false, direction: "higher" };
    if (index === limit) return { hit: false, direction: "lower" };
    return { hit: false, direction: whereToLook(word, entry) };
  }
  if (at(word, i) === 0) return { hit: true, abbreviation };
  // The entry matched and the word goes on.
  return { hit: false, direction: "higher" };
}

/**
 * ls_dict_find_word: the entry DECtalk's search ends on for `word` as it is
 * written, or null. `abbreviationLook` is the FABBREV context: the word is
 * followed by a period that an entry may take.
 */
export function searchDictionary(
  words: readonly string[],
  word: string,
  abbreviationLook: boolean,
): DictionarySearchHit | null {
  if (words.length === 0 || word.length === 0) return null;
  let offset = words.length >> 1;
  let base = offset;
  let result: Look;
  do {
    offset >>= 1;
    result = look(words, base, word, abbreviationLook);
    if (result.hit) break;
    base += result.direction === "higher" ? offset : -offset;
  } while (offset !== 0);
  // Not found by halving: walk on the way the last entry pointed.
  if (!result.hit) {
    if (result.direction === "higher") {
      while (!result.hit && result.direction === "higher") {
        base += 1;
        result = look(words, base, word, abbreviationLook);
      }
      // "try again one more step, it turns around too soon" (ls_dict.c:603-607).
      if (!result.hit) {
        base += 1;
        result = look(words, base, word, abbreviationLook);
      }
    } else {
      while (!result.hit && result.direction === "lower") {
        base -= 1;
        result = look(words, base, word, abbreviationLook);
      }
    }
  }
  if (!result.hit) return null;

  // A capitalised word on a lower-case entry, or the reverse: the entry of the
  // other case stands next to it (ls_dict.c:640-715).
  const capitalised = isUpper(at(word, 0)) && isLower(at(word, 1));
  const entryFirst = at(words[base], 0);
  if ((capitalised && isLower(entryFirst)) || (!capitalised && isUpper(entryFirst))) {
    let other = capitalised ? base - 1 : base + 1;
    let moved = look(words, other, word, abbreviationLook);
    if (!moved.hit) other = base + 1;
    moved = look(words, other, word, abbreviationLook);
    if (moved.hit) return { index: other, abbreviation: moved.abbreviation };
    const again = look(words, base, word, abbreviationLook);
    return again.hit ? { index: base, abbreviation: again.abbreviation } : null;
  }
  return { index: base, abbreviation: result.abbreviation };
}
