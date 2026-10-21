/**
 * Suffix stripping against the dictionary, as DECtalk 4.63 does it.
 *
 * A transcription of LTS/ls_suff.c (ls_suff_suffix_find, ls_suff_append_pron).
 * DECtalk calls it when a word of more than two letters is not in its
 * dictionary (LTS/ls_dict.c:440-466): it tries to strip a suffix, optionally
 * putting letters back (a dropped "e", "i" back to "y"), finds what is left in
 * the dictionary, and appends the suffix's phonemes, chosen by the last
 * phoneme of the root. The rules are a byte code compiled into
 * LTS/l_us_suf.c and are run here as data.
 *
 * One rule record: U32 next, U32 form class, then
 *   suffix letters, last letter first
 *   SF_STRIP                       (or SF_FC: the rule only tags a form class)
 *   alternatives, each:
 *     SF_REPLACE  more letters to strip
 *     SF_REPLACE_WITH  letters to put back  SF_REPLACE_END
 *     SF_RECURSE (strip again) or nothing (look the result up)
 *     pronunciations, each: SF_PHONES mask test phone... SF_PHONES_END
 *   SF_END
 */

export interface SuffixTables {
  /** Offset of the first rule for each last letter a-z; entry 26 is any other character. */
  suffixIndex: readonly number[];
  suffixTable: readonly number[];
  /** `pfeat[]`, indexed by phoneme code. */
  phonemeFeatures: readonly number[];
  /** The frontend's symbols for each phoneme code. */
  phonemeSymbols: readonly (readonly string[])[];
  /** Phoneme codes that carry a stress digit. */
  stressBearing: readonly number[];
}

// LTS/ls_suff.c:91-99.
const SF_END = 0xff;
const SF_STRIP = 0xfe;
const SF_FC = 0xfd;
const SF_REPLACE = 0xfc;
const SF_REPLACE_WITH = 0xfb;
const SF_REPLACE_END = 0xfa;
const SF_RECURSE = 0xf9;
const SF_PHONES = 0xf8;
const SF_PHONES_END = 0xf7;
/** End of a rule chain in `next` and in the index. */
const NO_RULE = 0xffff;

// Stress symbols a suffix pronunciation may contain (INCLUDE/l_com_ph.h).
const S2 = 102;
const S1 = 103;

/** INCLUDE/ls_feat.tab: the letters with CFEAT_vowel. */
const isVowelLetter = (char: string): boolean => "aeiouy".includes(char);

export interface SuffixResult {
  /** Dictionary root plus suffixes, or null when no rule leads to a dictionary word. */
  phonemes: string[] | null;
  /**
   * The form class word the search leaves on the word (INCLUDE/fc_def.tab
   * bits): the class of the rule that found the root, or of a rule that only
   * tags a class; 0 when there is none.
   */
  formClass: number;
  /** The spelling of the dictionary root that was found, or null. */
  root: string | null;
}

/**
 * The pronunciation of `word` as a dictionary root plus suffixes, and the form
 * class the suffix gives it. `lookup` returns the dictionary's phonemes for a
 * spelling, in the frontend's symbols.
 */
export function stripSuffixes(
  word: string,
  lookup: (spelling: string) => readonly string[] | null,
  tables: SuffixTables,
): SuffixResult {
  // ls_dict.c:451: only words of more than two letters.
  if (word.length <= 2) return { phonemes: null, formClass: 0, root: null };
  // fc_struct[fc_index]: the word's form class as the search goes.
  let formClass = 0;
  let rootSpelling: string | null = null;
  const table = tables.suffixTable;
  const u32 = (at: number): number =>
    (table[at] | (table[at + 1] << 8) | (table[at + 2] << 16) | (table[at + 3] << 24)) >>> 0;
  const codeOfSymbol = new Map<string, number>();
  tables.phonemeSymbols.forEach((symbols, code) => {
    if (symbols.length === 1) codeOfSymbol.set(symbols[0], code);
  });
  const stressBearing = new Set(tables.stressBearing);

  // comp_str: the word being rewritten. str_vowel: its first vowel letter,
  // which no suffix may reach.
  let comp = [...word.toLowerCase()];
  const firstVowel = comp.findIndex(isVowelLetter);
  const strVowel = firstVowel < 0 ? Number.NaN : firstVowel;

  /** ls_suff_append_pron: the suffix's phonemes for the last phoneme so far. */
  const appendPronunciation = (start: number, phonemes: string[]): void => {
    const last = (phonemes[phonemes.length - 1] ?? "").replace(/[0-9]$/, "");
    const features = tables.phonemeFeatures[codeOfSymbol.get(last) ?? 0] ?? 0;
    let pb = start;
    while (table[pb] !== SF_END) {
      if (table[pb++] !== SF_PHONES) continue;
      const masked = table[pb++] & features;
      if (masked !== table[pb++]) continue;
      let pending = 0;
      for (; table[pb] !== SF_PHONES_END; pb += 1) {
        const code = table[pb];
        if (code === S1) pending = 1;
        else if (code === S2) pending = 2;
        const symbols = tables.phonemeSymbols[code];
        if (!symbols) continue;
        if (stressBearing.has(code)) {
          phonemes.push(...symbols.slice(0, -1), `${symbols[symbols.length - 1]}${pending}`);
          pending = 0;
        } else {
          phonemes.push(...symbols);
        }
      }
      break;
    }
  };

  /** ls_suff_suffix_find, with `end` the index of the last character considered. */
  const suffixFind = (end: number): string[] | null => {
    const lastChar = comp[end] ?? "";
    let si =
      lastChar >= "a" && lastChar <= "z"
        ? tables.suffixIndex[lastChar.charCodeAt(0) - 97]
        : tables.suffixIndex[26];
    while (si !== NO_RULE && si !== undefined) {
      const next = u32(si);
      let sp = si + 8;
      let bp = end;
      while (table[sp] !== SF_STRIP && table[sp] !== SF_FC) {
        if ((comp[bp] ?? "").charCodeAt(0) !== table[sp] || bp === strVowel) break;
        bp -= 1;
        sp += 1;
      }
      // A rule that only tags a form class ends the search (ls_suff.c:174-182).
      if (table[sp] === SF_FC) {
        formClass = u32(si + 4);
        return null;
      }
      if (table[sp++] === SF_STRIP) {
        const saved = [...comp];
        const sbp = bp;
        while (table[sp] !== SF_END) {
          if (table[sp++] !== SF_REPLACE) continue;
          while (table[sp] === (comp[bp] ?? "").charCodeAt(0)) {
            sp += 1;
            bp -= 1;
          }
          if (table[sp++] === SF_REPLACE_WITH) {
            let np = bp + 1;
            while (table[sp] !== SF_REPLACE_END) comp[np++] = String.fromCharCode(table[sp++]);
            comp.length = np;
            sp += 1;
            let found: string[] | null;
            if (table[sp] === SF_RECURSE) {
              sp += 1;
              // The C passes np-1 after writing the terminator, which is the
              // terminator's own position.
              found = suffixFind(np);
            } else {
              // The rule's class goes on the word before the root is looked
              // up; the dictionary leaves a class that is already set
              // (ls_suff.c:245-249, ls_dict.c:749-750).
              formClass = u32(si + 4);
              const root = lookup(comp.join(""));
              found = root ? [...root] : null;
              if (root) rootSpelling = comp.join("");
            }
            if (found) {
              appendPronunciation(sp, found);
              return found;
            }
            // ls_suff.c:299-307.
            formClass = 0;
            comp = [...saved];
          }
          bp = sbp;
        }
      }
      si = next;
    }
    return null;
  };

  const phonemes = suffixFind(comp.length - 1);
  return { phonemes, formClass, root: phonemes ? rootSpelling : null };
}
