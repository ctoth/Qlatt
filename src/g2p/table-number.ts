/**
 * Speaking a number as DECtalk 4.63 does.
 *
 * A transcription of LTS/l_us_pr1.c ls_proc_do_number (integer part) and
 * ls_proc_do_digit_group. DECtalk does not look number words up in its
 * dictionary: it sends phone lists of its own (LTS/l_us_con.c: punits,
 * upunits, pteens, ptens, pordin, phundred, pthousand, ..., pand), joined by
 * word boundaries, and between the groups of a long number a verb-phrase
 * start, "and", or a comma. So "101" is not the words "one hundred and one":
 * its first "one" is unstressed, its "hundred" has AX, and its "and" is EH N D
 * behind a verb-phrase start.
 *
 * The result is a list of DECtalk symbols: phone codes (INCLUDE/l_all_ph.h)
 * and the control symbols of INCLUDE/l_com_ph.h that the lists and the
 * routine use. The phone lists are data, copied from DECtalk's source by
 * scripts/build-dectalk-lts-table.ts.
 */

export interface NumberPhones {
  /** "zero" to "nine", stressed. */
  units: readonly (readonly number[])[];
  /** "zero" to "nine" without stress, for a digit before "hundred". */
  unstressedUnits: readonly (readonly number[])[];
  /** "ten" to "nineteen". */
  teens: readonly (readonly number[])[];
  /** "twenty" to "ninety" at 2..9; 0 and 1 are empty. */
  tens: readonly (readonly number[])[];
  /** "zeroth" to "ninth". */
  ordinals: readonly (readonly number[])[];
  hundred: readonly number[];
  thousand: readonly number[];
  million: readonly number[];
  billion: readonly number[];
  trillion: readonly number[];
  quadrillion: readonly number[];
  /** "and" between a hundred and what follows: a verb-phrase start, EH N D. */
  and: readonly number[];
}

// INCLUDE/l_com_ph.h.
export const NUMBER_S2 = 102;
export const NUMBER_S1 = 103;
export const NUMBER_MBOUND = 109;
export const NUMBER_WBOUND = 111;
export const NUMBER_VPSTART = 113;
export const NUMBER_COMMA = 115;
// INCLUDE/l_all_ph.h.
const US_IX = 18;
const US_TH = 39;

const NUMBER_PPSTART = 112;
const NUMBER_EXCLAIM = 118;

const digit = (char: string): number => char.charCodeAt(0) - 48;

/**
 * A symbol stream as DECtalk's phonetic stage stores it. "Adjust the strength
 * of syntactic markers" (PH/ph_task.c:856-885): when a marker (word boundary
 * up to exclamation mark, PH/ph_defs.h:806) arrives right after another, the
 * weaker of the two is dropped, so the word boundary that the "and" of a
 * number carries ahead of its verb-phrase start is never stored; and a
 * verb-phrase start is dropped when the last boundary was already a phrase
 * start.
 *
 * Not reproduced: the clause that turns a prepositional-phrase start into a
 * verb-phrase start when more than 25 pauses in a row have been seen (:870).
 */
export function storeSyntacticMarkers(symbols: readonly number[]): number[] {
  const isMarker = (symbol: number | undefined): boolean =>
    symbol !== undefined && symbol >= NUMBER_WBOUND && symbol <= NUMBER_EXCLAIM;
  const stored: number[] = [];
  let bound = 0;
  for (const symbol of symbols) {
    const last = stored.at(-1);
    if (isMarker(symbol) && isMarker(last)) {
      if (symbol === NUMBER_VPSTART && (bound === NUMBER_PPSTART || bound === NUMBER_VPSTART)) {
        continue;
      }
      if ((last as number) >= symbol) continue;
      // The first stored symbol is never removed (lastoffs != 0).
      if (stored.length > 1) stored.pop();
    }
    // isbound: word boundary, prepositional- or verb-phrase start.
    if (symbol >= NUMBER_WBOUND && symbol <= NUMBER_VPSTART) bound = symbol;
    stored.push(symbol);
  }
  return stored;
}

/**
 * The symbols DECtalk sends for `text`: decimal digits, optionally grouped
 * with `separator` (ls_proc_do_number's `schar`, a comma in US English).
 * `ordinal` is the routine's `oflag` ("12th"). Null when `text` has no digit
 * or holds anything else.
 */
export function speakNumber(
  text: string,
  lists: NumberPhones,
  options: { ordinal?: boolean; separator?: string } = {},
): number[] | null {
  const separator = options.separator ?? ",";
  const ordinal = options.ordinal === true;
  const chars = [...text];
  if (chars.some((char) => char !== separator && !/^[0-9]$/.test(char))) return null;
  const digits = chars.filter((char) => char !== separator);
  const ndig = digits.length;
  if (ndig === 0) return null;
  const grouped = chars.includes(separator);
  const out: number[] = [];
  const send = (...lists_: (readonly number[])[]): void => {
    for (const list of lists_) out.push(...list);
  };

  // More than 18 digits with the user's own separators: every digit, a pause
  // at each separator (:535-553).
  if (ndig > 18 && grouped) {
    chars.forEach((char, index) => {
      if (char === separator) {
        out.push(NUMBER_COMMA);
        return;
      }
      send(lists.units[digit(char)]);
      const next = chars[index + 1];
      if (next !== undefined && next !== separator) out.push(NUMBER_WBOUND);
    });
    return out;
  }

  // Too long, or a leading zero: digit by digit, in threes with a pause
  // while six or more remain (:556-590).
  if (ndig > 18 || (ndig > 1 && digits[0] === "0")) {
    let at = 0;
    let remaining = ndig;
    while (remaining >= 6) {
      for (let n = 0; n < 3; n += 1) {
        if (n !== 0) out.push(NUMBER_WBOUND);
        send(lists.units[digit(digits[at])]);
        at += 1;
      }
      out.push(NUMBER_COMMA);
      remaining -= 3;
    }
    for (let n = 0; at < ndig; n += 1, at += 1) {
      if (n !== 0) out.push(NUMBER_WBOUND);
      send(lists.units[digit(digits[at])]);
    }
    return out;
  }

  // Right-justified in 18 digits: six groups of three (:594-603).
  const buf = [..."0".repeat(18 - ndig), ...digits];
  const nonZero = (from: number, count: number): boolean =>
    buf.slice(from, from + count).some((char) => char !== "0");

  /** ls_proc_do_digit_group (:422-472): one group of three digits. */
  const digitGroup = (at: number, asOrdinal: boolean): void => {
    const [hundreds, tens, units] = [buf[at], buf[at + 1], buf[at + 2]];
    if (hundreds !== "0") {
      send(lists.unstressedUnits[digit(hundreds)]);
      out.push(NUMBER_WBOUND);
      send(lists.hundred);
      if (tens === "0" && units === "0") {
        if (asOrdinal) out.push(US_TH);
        return;
      }
      send(lists.and);
    }
    if (tens === "1") {
      send(lists.teens[digit(units)]);
      if (asOrdinal) out.push(US_TH);
      return;
    }
    if (tens !== "0") {
      send(lists.tens[digit(tens)]);
      if (units === "0") {
        if (asOrdinal) out.push(US_IX, US_TH);
        return;
      }
      out.push(NUMBER_WBOUND);
    }
    send(asOrdinal ? lists.ordinals[digit(units)] : lists.units[digit(units)]);
  };

  // Quadrillions down to thousands (:604-715). After a group and its name:
  //   nothing but zeros follows                  -> done;
  //   only the very next digit is not zero       -> a verb-phrase start
  //                                                 ("one million ) five hundred thousand");
  //   that next digit is zero                    -> "and" ("one thousand and five");
  //   otherwise                                  -> a pause.
  const named: readonly [number, readonly number[]][] = [
    [0, lists.quadrillion],
    [3, lists.trillion],
    [6, lists.billion],
    [9, lists.million],
    [12, lists.thousand],
  ];
  for (const [at, name] of named) {
    if (!nonZero(at, 3)) continue;
    digitGroup(at, false);
    out.push(NUMBER_WBOUND);
    send(name);
    if (!nonZero(at + 3, 18 - (at + 3))) {
      if (ordinal) out.push(US_TH);
      return out;
    }
    if (!nonZero(at + 4, 18 - (at + 4))) out.push(NUMBER_VPSTART);
    else if (buf[at + 3] === "0") send(lists.and);
    else out.push(NUMBER_COMMA);
  }
  digitGroup(15, ordinal);
  return out;
}

/**
 * ls_util_is_year (LTS/ls_util.c:598-622): exactly four digits, no leading
 * zero, and the two middle digits not both zero. DECtalk reads such a word as
 * a year whether or not it is one.
 */
export function isYear(text: string): boolean {
  return /^[1-9][0-9]{3}$/.test(text) && !(text[1] === "0" && text[2] === "0");
}

/**
 * ls_proc_do_4_digits (LTS/l_us_pr1.c:367-398) with ls_proc_do_2_digits
 * (:297-315): a year in two halves, "ten twenty", "nineteen hundred". A half
 * with a leading zero is spelled digit by digit ("thirteen zero five").
 * `text` must satisfy isYear.
 */
export function speakYear(text: string, lists: NumberPhones): number[] {
  const out: number[] = [];
  const twoDigits = (first: string, second: string): void => {
    if (first === "0") {
      out.push(...lists.units[0], NUMBER_WBOUND, ...lists.units[digit(second)]);
    } else if (first === "1") {
      out.push(...lists.teens[digit(second)]);
    } else {
      out.push(...lists.tens[digit(first)]);
      if (second !== "0") out.push(NUMBER_WBOUND, ...lists.units[digit(second)]);
    }
  };
  if (text[2] === "0" && text[3] === "0") {
    twoDigits(text[0], text[1]);
    out.push(NUMBER_WBOUND, ...lists.hundred);
  } else {
    twoDigits(text[0], text[1]);
    out.push(NUMBER_WBOUND);
    twoDigits(text[2], text[3]);
  }
  return out;
}

/**
 * An all-digit word as DECtalk speaks it (LTS/ls_task.c:3786-3806): a year by
 * the test above, otherwise a number. Null when `text` is not digits (with
 * separators).
 */
export function speakDigits(text: string, lists: NumberPhones): number[] | null {
  return isYear(text) ? speakYear(text, lists) : speakNumber(text, lists);
}
