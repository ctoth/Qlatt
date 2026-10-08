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
  /** "point" before fraction digits. */
  point: readonly number[];
  /** "dollar", with the word boundary before it. */
  dollar: readonly number[];
  /** "cent". */
  cent: readonly number[];
  /** The three letters each month is known by in a date word, "jan" to "dec". */
  monthNames?: readonly string[];
  /** "January" to "December". */
  months?: readonly (readonly number[])[];
  /** The "oh" of "twenty oh one". */
  oh?: readonly number[];
  /** "half" and "halves", a fraction's denominator 2. */
  half?: readonly number[];
  halves?: readonly number[];
  /**
   * The words that take "dollars" behind them after a dollar amount
   * ("million"), each with its phones.
   */
  quantityWords?: Readonly<Record<string, readonly number[]>>;
  /**
   * ls_util_pluralize (LTS/ls_util.c:1442-1466): the plural ending by the
   * phone before it.
   */
  plural: {
    afterSibilant: readonly number[];
    afterVoiceless: readonly number[];
    otherwise: readonly number[];
    sibilants: readonly number[];
    voicelessConsonants: readonly number[];
  };
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
  if (text[2] === "0" && text[3] === "0") {
    out.push(...twoDigits(text[0], text[1], lists), NUMBER_WBOUND, ...lists.hundred);
  } else {
    out.push(
      ...twoDigits(text[0], text[1], lists),
      NUMBER_WBOUND,
      ...twoDigits(text[2], text[3], lists),
    );
  }
  return out;
}

/**
 * ls_proc_do_4_digits whole (LTS/l_us_pr1.c:367-398), for four digits that
 * need not be a year by isYear: "two thousand" for X000, else as speakYear.
 * Null for a leading zero, which DECtalk spells digit by digit (:369-370).
 */
function fourDigits(text: string, lists: NumberPhones): number[] | null {
  if (text[0] === "0") return null;
  if (text[1] === "0" && text[2] === "0" && text[3] === "0") {
    return [...lists.unstressedUnits[digit(text[0])], NUMBER_WBOUND, ...lists.thousand];
  }
  return speakYear(text, lists);
}

/**
 * A date word, as ls_proc_is_date accepts it and ls_proc_do_date speaks it
 * (LTS/l_us_pr1.c:815-961): a day of one or two digits, a hyphen, the three
 * letters of a month, and maybe a hyphen and a year of two or four digits.
 *
 *   23-Aug        August twenty third
 *   01-Jan        January first
 *   23-Aug-84     August twenty third, eighty four
 *   23-Aug-1984   August twenty third, nineteen eighty four
 *   2-Apr-2001    April second, twenty oh one
 *   1-Jan-2000    January first, two thousand
 *
 * The day is not checked against the month ("32-Jan" is "January thirty
 * second"). Not here: the day-first order of DECtalk's European mode
 * (:907-919), and a four-digit year with a leading zero, which DECtalk
 * spells. Null for those and for anything that is not such a word.
 */
export function speakDate(text: string, lists: NumberPhones): number[] | null {
  if (!lists.monthNames || !lists.months || !lists.oh) return null;
  const match = /^([0-9]{1,2})-([a-z]{3})(?:-([0-9]{2}|[0-9]{4}))?$/i.exec(text);
  if (!match) return null;
  const [, day, name, year] = match;
  const month = lists.monthNames.indexOf(name.toLowerCase());
  if (month < 0) return null;
  // "Get 01-Jan-84 ok" (:924-927): a two-digit day loses its leading zero.
  const spokenDay = speakNumber(day.length === 2 && day[0] === "0" ? day.slice(1) : day, lists, {
    ordinal: true,
  });
  if (!spokenDay) return null;
  const symbols = [...lists.months[month], NUMBER_WBOUND, ...spokenDay];
  if (year === undefined) return symbols;
  symbols.push(NUMBER_COMMA);
  if (year.length === 2) {
    symbols.push(...twoDigits(year[0], year[1], lists));
  } else if (year[0] !== "0" && year[1] === "0" && year[2] === "0" && year[3] !== "0") {
    // "A 200X date" (:944-954): no word boundary between "oh" and the digit.
    symbols.push(
      ...twoDigits(year[0], year[1], lists),
      NUMBER_WBOUND,
      ...lists.oh,
      ...lists.units[digit(year[3])],
    );
  } else {
    const spokenYear = fourDigits(year, lists);
    if (!spokenYear) return null;
    symbols.push(...spokenYear);
  }
  return symbols;
}

/**
 * Digits as the functions below accept them: bare, or in groups of three
 * with a comma between. DECtalk speaks any other grouping ("1,00", "12,34")
 * sign by sign, the comma by name; that reading is the caller's.
 */
const INTEGER = "[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+";
const DECIMAL = new RegExp(`^(${INTEGER})?(?:\\.([0-9]+))?$`);
const PLURAL = new RegExp(`^(${INTEGER})'?s$`);

/** ls_proc_do_2_digits (LTS/l_us_pr1.c:297-315): "zero five", "fifteen", "thirty one". */
function twoDigits(first: string, second: string, lists: NumberPhones): number[] {
  if (first === "0") return [...lists.units[0], NUMBER_WBOUND, ...lists.units[digit(second)]];
  if (first === "1") return [...lists.teens[digit(second)]];
  return [
    ...lists.tens[digit(first)],
    ...(second !== "0" ? [NUMBER_WBOUND, ...lists.units[digit(second)]] : []),
  ];
}

/**
 * A number with fraction digits after a period, as ls_proc_do_number speaks
 * it (LTS/l_us_pr1.c:497-749): the integer part as a number, "point", and
 * each fraction digit by its name. `plural` is the routine's return value,
 * which the text task uses to pick "dollar" or "dollars": false only for the
 * integer one with no fraction, and for a text with no digit before a
 * missing fraction (:518, 605-606, 748). Null when `text` is not such a
 * number.
 */
export function speakDecimal(
  text: string,
  lists: NumberPhones,
): { symbols: number[]; plural: boolean } | null {
  const match = DECIMAL.exec(text);
  if (!match || (match[1] === undefined && match[2] === undefined)) return null;
  const [, integer, fraction] = match;
  const symbols: number[] = [];
  let plural = false;
  if (integer !== undefined) {
    const spoken = speakNumber(integer, lists);
    if (!spoken) return null;
    symbols.push(...spoken);
    // "Watch for 1" (:605-606); a long or zero-led digit string is plural (:553, 590).
    plural = integer.replaceAll(",", "") !== "1";
  }
  if (fraction !== undefined) {
    if (integer !== undefined) symbols.push(NUMBER_WBOUND);
    symbols.push(...lists.point);
    for (const char of fraction) symbols.push(NUMBER_WBOUND, ...lists.units[digit(char)]);
    plural = true;
  }
  return { symbols, plural };
}

/**
 * A currency amount after its dollar sign, as the text task speaks it
 * (LTS/ls_task.c:3312-3513):
 *
 *   $3      three dollars
 *   $3.00   three dollars
 *   $3.24   three dollars and twenty four cents
 *   $.50    fifty cents
 *   $3.240  three point two four zero dollars
 *
 * Not here, because each needs more than the word: a sign after the dollar
 * sign (:3192-3215), and a following "million" that moves "dollars" behind it
 * (:3234-3309). Null for those and for anything that is not a number.
 */
export function speakMoney(amount: string, lists: NumberPhones): number[] | null {
  const match = DECIMAL.exec(amount);
  if (!match || (match[1] === undefined && match[2] === undefined)) return null;
  const [, integer, fraction] = match;
  const [voicedPlural] = lists.plural.otherwise;
  const [voicelessPlural] = lists.plural.afterVoiceless;
  // Any fraction but one of exactly two digits: a decimal number of dollars (:3464-3513).
  if (fraction !== undefined && fraction.length !== 2) {
    const whole = speakDecimal(amount, lists);
    if (!whole) return null;
    return [...whole.symbols, ...lists.dollar, ...(whole.plural ? [voicedPlural] : [])];
  }
  const symbols: number[] = [];
  if (integer !== undefined) {
    const dollars = speakDecimal(integer, lists);
    if (!dollars) return null;
    symbols.push(...dollars.symbols, ...lists.dollar, ...(dollars.plural ? [voicedPlural] : []));
    if (fraction === undefined || fraction === "00") return symbols;
    symbols.push(...lists.and);
  }
  if (fraction === undefined) return symbols;
  // "Just after the '.'": one leading zero is passed over (:3410-3412).
  const cents = speakDecimal(fraction[0] === "0" ? fraction.slice(1) : fraction, lists);
  if (!cents) return null;
  symbols.push(
    ...cents.symbols,
    NUMBER_WBOUND,
    ...lists.cent,
    ...(cents.plural ? [voicelessPlural] : []),
  );
  return symbols;
}

/**
 * A dollar amount that stands before one of the words that take "dollars"
 * behind them ("$2 million"): only the amount is spoken here, as a number
 * ("$2.50 million" is "two point five zero"), and the word that follows
 * speaks itself and "dollars" (speakQuantityAfterMoney). DECtalk 4.63
 * LTS/ls_task.c:3227-3290. Null when `amount` is not a number.
 */
export function speakMoneyBeforeQuantity(amount: string, lists: NumberPhones): number[] | null {
  return speakDecimal(amount, lists)?.symbols ?? null;
}

/**
 * The word after such an amount: its phones from the table, then "dollars",
 * plural whatever the amount (:3243-3285; "$1 million" is "one million
 * dollars"). Null when `word` is not in the table.
 */
export function speakQuantityAfterMoney(word: string, lists: NumberPhones): number[] | null {
  const phones = lists.quantityWords?.[word];
  if (!phones) return null;
  return [...phones, ...lists.dollar, ...lists.plural.otherwise];
}

/**
 * ls_proc_is_frac (LTS/l_us_pr1.c:980-1015): one or two digits not starting
 * with 0, a slash, then one to three digits not starting with 0, three only
 * as "100". (The routine also lets a "%" end it; DECtalk's parser has cut
 * that off the word before this point, so it is not read here.)
 */
export function isFraction(text: string): boolean {
  const match = /^([1-9][0-9]?)\/([1-9][0-9]{0,2})$/.exec(text);
  return match !== null && (match[2].length < 3 || match[2] === "100");
}

/**
 * A fraction as ls_proc_do_frac speaks it (LTS/l_us_pr1.c:1034-1067): the
 * numerator as a number, a word boundary, and the denominator as an ordinal,
 * in the plural unless the numerator is the one digit 1: [Z] after a last
 * digit 2 or 3 that is not a teen's ("thirds", "twenty seconds"), [S]
 * otherwise ("eighths", "thirteenths"). The denominator 2 is "half" or
 * "halves". Null when `text` is not a fraction by the test above, or the
 * table has no "half".
 */
export function speakFraction(text: string, lists: NumberPhones): number[] | null {
  if (!isFraction(text) || !lists.half || !lists.halves) return null;
  const [numerator, denominator] = text.split("/") as [string, string];
  const top = speakNumber(numerator, lists);
  if (!top) return null;
  const plural = numerator !== "1";
  const symbols = [...top, NUMBER_WBOUND];
  if (denominator === "2") {
    symbols.push(...(plural ? lists.halves : lists.half));
  } else {
    const bottom = speakNumber(denominator, lists, { ordinal: true });
    if (!bottom) return null;
    symbols.push(...bottom);
    if (plural) {
      const last = denominator.at(-1) as string;
      const teen = denominator.length > 1 && denominator.at(-2) === "1";
      const [voiced] = lists.plural.otherwise;
      const [voiceless] = lists.plural.afterVoiceless;
      symbols.push(!teen && (last === "2" || last === "3") ? voiced : voiceless);
    }
  }
  return symbols;
}

/**
 * A run of digits inside a part number (LTS/l_us_pr1.c:183-208): two digits
 * by ls_proc_do_2_digits (:297-315), three by ls_proc_do_3_digits (:333-349:
 * the first digit without stress, then "hundred" or the last two), four by
 * ls_proc_do_4_digits (:367-398: "one thousand", "nineteen hundred",
 * "nineteen ninety"). Null for a run of any other length and for one that
 * starts with 0: those are spelled digit by digit, which is the caller's.
 */
export function speakPartDigits(run: string, lists: NumberPhones): number[] | null {
  if (!/^[1-9][0-9]{1,3}$/.test(run)) return null;
  if (run.length === 2) return twoDigits(run[0], run[1], lists);
  if (run.length === 3) {
    return [
      ...lists.unstressedUnits[digit(run[0])],
      NUMBER_WBOUND,
      ...(run[1] === "0" && run[2] === "0" ? lists.hundred : twoDigits(run[1], run[2], lists)),
    ];
  }
  if (run[2] === "0" && run[3] === "0") {
    return run[1] === "0"
      ? [...lists.unstressedUnits[digit(run[0])], NUMBER_WBOUND, ...lists.thousand]
      : [...twoDigits(run[0], run[1], lists), NUMBER_WBOUND, ...lists.hundred];
  }
  return [...twoDigits(run[0], run[1], lists), NUMBER_WBOUND, ...twoDigits(run[2], run[3], lists)];
}

/**
 * A clock time, as ls_proc_do_time speaks it (LTS/l_us_pr1.c:1182-1209): the
 * hour, a verb-phrase start, the minutes unless they are "00", and seconds
 * after another verb-phrase start. Only the forms hour:minutes and
 * hour:minutes:seconds; DECtalk's test (ls_proc_is_time, :1090-1129) also
 * admits a fraction, which its recorded output reads another way, so that is
 * left to the caller. Null for anything else.
 */
export function speakTime(text: string, lists: NumberPhones): number[] | null {
  const match = /^([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?$/.exec(text);
  if (!match) return null;
  const [, hour, minutes, seconds] = match;
  const symbols: number[] =
    hour.length === 1 ? [...lists.units[digit(hour)]] : twoDigits(hour[0], hour[1], lists);
  symbols.push(NUMBER_VPSTART);
  if (minutes !== "00") symbols.push(...twoDigits(minutes[0], minutes[1], lists));
  if (seconds !== undefined) {
    symbols.push(NUMBER_VPSTART, ...twoDigits(seconds[0], seconds[1], lists));
  }
  return symbols;
}

/**
 * A number with a plural ending, "60s" or "60's" (LTS/ls_task.c:3936-3962,
 * 4031-4046): a year by ls_util_is_year in its two halves, any other as a
 * number, then the ending ls_util_pluralize picks from the last phone
 * (LTS/ls_util.c:1442-1466). Null for anything else.
 */
export function speakPluralNumber(text: string, lists: NumberPhones): number[] | null {
  const match = PLURAL.exec(text);
  if (!match) return null;
  const symbols = isYear(match[1]) ? speakYear(match[1], lists) : speakNumber(match[1], lists);
  if (!symbols) return null;
  const last = symbols.findLast((symbol) => symbol < NUMBER_S2);
  const ending =
    last !== undefined && lists.plural.sibilants.includes(last)
      ? lists.plural.afterSibilant
      : last !== undefined && lists.plural.voicelessConsonants.includes(last)
        ? lists.plural.afterVoiceless
        : lists.plural.otherwise;
  return [...symbols, ...ending];
}

/**
 * A whole number with the ending that goes with its last digit, "1st", "42nd",
 * "3rd", "11th" (LTS/ls_util.c:517-553 ls_util_is_ordinal: "st" after 1, "nd"
 * after 2, "rd" after 3, "th" after anything else and after any digit that
 * follows a 1): the number routine speaks it with its ordinal flag
 * (LTS/ls_task.c:3967-3972). Null for anything else, a number with the wrong
 * ending included.
 */
export function speakOrdinalNumber(text: string, lists: NumberPhones): number[] | null {
  const match = /^([0-9]+)(st|nd|rd|th)$/.exec(text);
  if (!match) return null;
  const digits = match[1] as string;
  const unit = digits.length > 1 && digits.at(-2) === "1" ? "0" : (digits.at(-1) as string);
  const ending = unit === "1" ? "st" : unit === "2" ? "nd" : unit === "3" ? "rd" : "th";
  return match[2] === ending ? speakNumber(digits, lists, { ordinal: true }) : null;
}

/**
 * A number-like word that DECtalk's text task reads whole, in the order the
 * task tries its rules (LTS/ls_task.c: money :3181, date :3612, time :3622,
 * plain numbers :3747): a dollar amount, a date word, a clock time, a plural
 * number, an ordinal, or a number with separators or fraction digits. Null
 * when `text` is none of these; the caller then reads it as it reads any
 * other word.
 */
export function speakNumberToken(text: string, lists: NumberPhones): number[] | null {
  if (text.startsWith("$")) return speakMoney(text.slice(1), lists);
  return (
    speakDate(text, lists) ??
    speakTime(text, lists) ??
    speakPluralNumber(text, lists) ??
    speakOrdinalNumber(text, lists) ??
    (/[,.]/.test(text) ? (speakDecimal(text, lists)?.symbols ?? null) : null)
  );
}

/**
 * An all-digit word as DECtalk speaks it (LTS/ls_task.c:3786-3806): a year by
 * the test above, otherwise a number. Null when `text` is not digits (with
 * separators).
 */
export function speakDigits(text: string, lists: NumberPhones): number[] | null {
  return isYear(text) ? speakYear(text, lists) : speakNumber(text, lists);
}

/** One word of a spoken number, in a frontend's phone symbols. */
export interface NumberWord {
  /** Phones with a stress digit on each stress-bearing one. */
  phonemes: string[];
  /** The word is entered with a verb-phrase start in place of a word boundary. */
  phraseStart?: "vp";
  /** A pause stands before the word. */
  pauseBefore?: boolean;
  /**
   * Indices of the phones after which a morpheme boundary stands ("nine|teen").
   * DECtalk's structure word records it on the rime before it.
   */
  morphemeAfter?: number[];
}

/**
 * The words of a symbol stream as the phonetic stage stores it: cut at each
 * word boundary, verb-phrase start and pause, the phones written in the
 * frontend's symbols (`phonemeSymbols`, by phone code) with the stress mark
 * that precedes a stress-bearing phone as its digit. A morpheme boundary
 * inside a word is kept as the index of the phone before it.
 */
export function numberWords(
  symbols: readonly number[],
  table: {
    phonemeSymbols: readonly (readonly string[])[];
    stressBearing: readonly number[];
  },
): NumberWord[] {
  const stressBearing = new Set(table.stressBearing);
  const words: NumberWord[] = [];
  let current: NumberWord = { phonemes: [] };
  let pending = 0;
  const close = (next: NumberWord): void => {
    if (current.phonemes.length > 0) words.push(current);
    // A marker with no phones before it passes its effect on.
    else if (current.pauseBefore) next.pauseBefore = true;
    current = next;
    pending = 0;
  };
  for (const symbol of storeSyntacticMarkers(symbols)) {
    if (symbol === NUMBER_WBOUND) close({ phonemes: [] });
    else if (symbol === NUMBER_VPSTART) close({ phonemes: [], phraseStart: "vp" });
    else if (symbol === NUMBER_COMMA) close({ phonemes: [], pauseBefore: true });
    else if (symbol === NUMBER_S1) pending = 1;
    else if (symbol === NUMBER_S2) pending = 2;
    else if (symbol === NUMBER_MBOUND) {
      if (current.phonemes.length > 0) {
        current.morphemeAfter = [...(current.morphemeAfter ?? []), current.phonemes.length - 1];
      }
    } else {
      const names = table.phonemeSymbols[symbol];
      if (!names) {
        throw new Error(`E_NUMBER_SYMBOL: symbol ${symbol.toString()} has no phone`);
      }
      if (stressBearing.has(symbol)) {
        current.phonemes.push(...names.slice(0, -1), `${names[names.length - 1]}${pending}`);
        pending = 0;
      } else {
        current.phonemes.push(...names);
      }
    }
  }
  if (current.phonemes.length > 0) words.push(current);
  return words;
}
