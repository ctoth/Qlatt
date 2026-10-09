/**
 * Phonemic text in brackets ("[m'uwn]", "[ae<400,150>]"), read as DECtalk's
 * command stage reads it once the phoneme mode is on (DECtalk 4.63
 * CMD/cm_phon.c cm_phon_match :438-634, cm_phon_param_check :225-330), with
 * the two alphabets of the frontend's text parser table
 * (`commandTable.phonemes`, generated from INCLUDE/usa_phon.tab).
 *
 * The arpabet: a symbol is two characters, or one where the table writes it
 * with a space ("k "), in either case of letters. A character waits for the
 * next one; if the two are a symbol, both are used; if not and the first
 * alone is a symbol, it is one, and the second waits in its turn. So a space
 * after a one-letter name belongs to the name, and any other space is the
 * word boundary: "[k ae t]" is K, AE, a word boundary, T. Two digits are a
 * symbol by its number.
 *
 * The one-character alphabet ("asky"): each character is a symbol, the first
 * the table has for it, capitals and small letters apart.
 *
 * After a symbol "<" opens its parameters: whole numbers with commas
 * between, a minus allowed first, ">" at the end. The first is a duration in
 * milliseconds, the second a pitch (in hertz, or a note number up to 37);
 * what the phonemic stage does with them is not this file's.
 *
 * A character or pair that is no symbol is an error: what was read before it
 * stands, and the rest of the bracket is passed over.
 *
 * Not ported: a language prefix before a symbol ("us_", cm_phon.c:457-486),
 * more than three parameters (a tone packet, :333-378), and a colon inside
 * the bracket, which starts a command there (:505-515, :603-605): it ends
 * the phonemic text here and what follows it in the bracket is passed over.
 */

/**
 * How the symbols of a bracket are written into the frontend's phonemic text
 * (between the table's two marks): each symbol as the private-use character
 * at this code plus its own code, so that none is lost on the way (the
 * one-character alphabet has the same letter for several symbols), and its
 * parameters, when it has any, between the next two characters as decimal
 * numbers with commas. engineering choice: the characters are from Unicode's
 * private use area and are no text.
 */
export const PHONEME_SYMBOL_BASE = 0xe000;
export const PHONEME_SYMBOL_LIMIT = 0xe100;
export const PHONEME_PARAMETERS_OPEN = "";
export const PHONEME_PARAMETERS_CLOSE = "";

/** The symbols as they stand inside phonemic text. */
export function phonemeCharacters(phonemes: readonly ReadPhoneme[]): string {
  return phonemes
    .map(
      (phoneme) =>
        String.fromCharCode(PHONEME_SYMBOL_BASE + phoneme.symbol) +
        (phoneme.parameters.length > 0
          ? PHONEME_PARAMETERS_OPEN + phoneme.parameters.join(",") + PHONEME_PARAMETERS_CLOSE
          : ""),
    )
    .join("");
}

export interface PhonemeAlphabets {
  /** For each symbol by its code, its two characters; "" where it has none. */
  arpabet: string[];
  /** For each symbol by its code, its one character; "" where it has none. */
  ascky: string[];
}

export interface ReadPhoneme {
  /** The symbol's code: a phone, or a mark (stress, boundary). */
  symbol: number;
  /** The numbers between "<" and ">" after it. */
  parameters: number[];
}

export interface ReadPhonemes {
  phonemes: ReadPhoneme[];
  /** A character or pair was no symbol, or a parameter was not a number. */
  error: boolean;
}

/** The phonemic text of one bracket; `body` is what stands between "[" and "]". */
export function readPhonemes(
  alphabets: PhonemeAlphabets,
  body: string,
  ascky: boolean,
): ReadPhonemes {
  const phonemes: ReadPhoneme[] = [];
  const pairs = new Map<string, number>();
  alphabets.arpabet.forEach((pair, symbol) => {
    if (pair !== "" && !pairs.has(pair)) pairs.set(pair, symbol);
  });
  // 2: both characters are the symbol; 1: the first alone is; 0: neither.
  const lookUp = (first: string, second: string): { found: 0 | 1 | 2; symbol: number } => {
    const a = first.toLowerCase();
    const b = second.toLowerCase();
    const both = pairs.get(a + b);
    if (both !== undefined) return { found: 2, symbol: both };
    const alone = pairs.get(`${a} `);
    return alone !== undefined ? { found: 1, symbol: alone } : { found: 0, symbol: -1 };
  };
  const failed = (): ReadPhonemes => ({ phonemes, error: true });
  let pending = "";
  let at = 0;
  // The parameters of the symbol read last, when "<" follows it. False when
  // they cannot be read: the symbol goes with them, since a symbol is handed
  // on only once its parameters are read (measured: "[uw<400,x>n]" speaks
  // the error text and no UW).
  const parameters = (): boolean => {
    if (readParameters()) return true;
    phonemes.pop();
    return false;
  };
  const readParameters = (): boolean => {
    if (body[at] !== "<") return true;
    const last = phonemes.at(-1);
    if (!last) return false;
    at += 1;
    let value = 0;
    let negative = false;
    let digits = 0;
    for (; at < body.length; at += 1) {
      const char = body[at] as string;
      if (char >= "0" && char <= "9") {
        value = value * 10 + (char.charCodeAt(0) - 48);
        digits += 1;
      } else if (char === "%") {
        value += 900;
      } else if (char === "-" && digits === 0 && !negative) {
        negative = true;
      } else if (char === "," || char === ">") {
        last.parameters.push(negative ? -value : value);
        value = 0;
        negative = false;
        digits = 0;
        if (char === ">") {
          at += 1;
          return true;
        }
        if (last.parameters.length === 5) return false;
      } else {
        return false;
      }
    }
    // The bracket ended inside the parameters: they are dropped.
    last.parameters.length = 0;
    return true;
  };
  while (at < body.length) {
    const char = body[at] as string;
    if (char === "\r" || char === "\n") {
      at += 1;
      continue;
    }
    if (char === ":") break;
    if (ascky) {
      const symbol = alphabets.ascky.indexOf(char);
      if (symbol < 0) return failed();
      phonemes.push({ symbol, parameters: [] });
      at += 1;
      if (!parameters()) return failed();
      continue;
    }
    if (pending === "") {
      pending = char;
      at += 1;
      continue;
    }
    if (pending >= "0" && pending <= "9" && char >= "0" && char <= "9") {
      phonemes.push({ symbol: Number(pending + char), parameters: [] });
      pending = "";
      at += 1;
      if (!parameters()) return failed();
      continue;
    }
    const { found, symbol } = lookUp(pending, char);
    if (found === 0) return failed();
    phonemes.push({ symbol, parameters: [] });
    pending = "";
    if (found === 2) {
      at += 1;
      if (!parameters()) return failed();
    } else if (char === "<") {
      if (!parameters()) return failed();
    }
    // found 1 and no "<": the second character waits in its turn.
  }
  // What still waits when the bracket ends is looked up with a space
  // (:488-503); a space that waits is nothing.
  if (!ascky && pending !== "" && pending !== " ") {
    const { found, symbol } = lookUp(pending, " ");
    if (found === 0) return failed();
    phonemes.push({ symbol, parameters: [] });
  }
  return { phonemes, error: false };
}
