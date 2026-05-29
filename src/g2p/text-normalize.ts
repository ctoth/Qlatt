/**
 * Extended text normalization for TTS frontend.
 *
 * Handles:
 * - Number-to-words conversion (0 through 999,999,999)
 * - Ordinal expansion (1st, 2nd, 3rd, ...)
 * - Common abbreviation expansion (Dr., Mr., Mrs., etc.)
 * - Case normalization (lowercase)
 * - Punctuation handling: pause-generating marks (, . ? ! ; :) kept as tokens;
 *   other punctuation stripped; apostrophes in contractions preserved
 * - Whitespace collapse
 *
 * Pipeline order and lookup tables are declared in YAML:
 *   normalization-tables.yaml  — all lookup data
 *   normalization-pipeline.yaml — ordered step definitions
 *
 * Citations:
 *   Allen, Hunnicutt & Klatt 1987 Ch.3 (MITalk text analysis)
 *   Ebden & Sproat 2015 (Kestrel TN framework)
 */

import { loadYamlDocumentSync } from "../yaml-loader";

// ---------------------------------------------------------------------------
// Types for YAML data
// ---------------------------------------------------------------------------

interface NormalizationTables {
  ones: string[];
  teens: string[];
  tens: string[];
  ordinal_ones: Record<number, string>;
  ordinal_tens: Record<number, string>;
  abbreviations: Record<string, string>;
  digit_words: Record<string, string>;
  month_names: string[];
}

interface RegexRule {
  pattern: string;
  replacement?: string;
  handler?: string;
  flags?: string;
}

interface PipelineStep {
  name: string;
  type: "builtin" | "regex_replace" | "table_replace";
  handler?: string;
  pattern?: string;
  flags?: string;
  table?: string;
  rules?: RegexRule[];
  post?: string;
  /** Year-detection/speaking policy for the readYearInline builtin (data-driven). */
  year_policy?: YearPolicy;
  /** Fraction-reading policy for the readFractionInline builtin (data-driven). */
  fraction_policy?: FractionPolicy;
}

interface NormalizationPipeline {
  steps: PipelineStep[];
}

/**
 * Fraction-reading policy, supplied as DATA by a frontend's normalization step.
 * The handler is generic; this is the only DECtalk-specific knowledge.
 *
 * Mirrors DECtalk 4.63 `ls_proc_is_frac` / `ls_proc_do_frac`
 * (l_us_pr1.c:980-1069): numerator 1-2 digits (no leading 0), '/', denominator
 * 1-3 digits (no leading 0; if 3 digits it must be exactly the value in
 * `max_3digit_denominator`, i.e. 100), optional trailing '%'. The numerator is
 * spoken cardinal; the denominator is spoken as an ordinal, except denominators
 * listed in `special_denominators` (DECtalk special-cases only "2" -> half/halves).
 * When the numerator is plural (value != 1) the ordinal denominator takes a
 * trailing plural marker ("fourth" -> "fourths").
 */
interface FractionPolicy {
  /**
   * Denominators with irregular spoken words, keyed by the denominator digit
   * string (DECtalk: only "2"). Each maps the singular and plural spoken forms.
   */
  special_denominators?: Record<string, { singular: string; plural: string }>;
  /** Word spoken for a trailing '%' (DECtalk: "percent"). */
  percent_word?: string;
  /**
   * The only 3-digit denominator DECtalk accepts (100). A 3-digit denominator
   * other than this value is not treated as a fraction.
   */
  max_3digit_denominator?: number;
}

// ---------------------------------------------------------------------------
// YAML loading (cached, following morphology.ts pattern)
// ---------------------------------------------------------------------------

const DEFAULT_TABLES_PATH = "/rules/frontends/qlatt-english/normalization-tables.yaml";
const DEFAULT_PIPELINE_PATH = "/rules/frontends/qlatt-english/normalization-pipeline.yaml";

/**
 * Per-frontend normalization config. A frontend may declare its own tables and
 * pipeline YAML paths (generic data — no per-frontend branch in this module).
 * When omitted, the qlatt-english defaults are used, so any frontend that does
 * not opt in keeps byte-identical normalization behavior.
 */
export interface NormalizationConfig {
  tablesPath?: string;
  pipelinePath?: string;
}

// Caches keyed by resolved YAML path so distinct frontends (e.g. qlatt-english
// vs dectalk-english) never share a cache entry.
const tablesCacheByPath = new Map<string, NormalizationTables>();
const pipelineCacheByPath = new Map<string, NormalizationPipeline>();

function getTables(tablesPath: string = DEFAULT_TABLES_PATH): NormalizationTables {
  let cached = tablesCacheByPath.get(tablesPath);
  if (!cached) {
    cached = loadYamlDocumentSync<NormalizationTables>(tablesPath);
    tablesCacheByPath.set(tablesPath, cached);
  }
  return cached;
}

function getPipeline(
  pipelinePath: string = DEFAULT_PIPELINE_PATH,
  tablesPath: string = DEFAULT_TABLES_PATH,
): NormalizationPipeline {
  let cached = pipelineCacheByPath.get(pipelinePath);
  if (!cached) {
    cached = loadYamlDocumentSync<NormalizationPipeline>(pipelinePath);
    validateNormalizationPipelineConfig(cached, getTables(tablesPath));
    pipelineCacheByPath.set(pipelinePath, cached);
  }
  return cached;
}

// ---------------------------------------------------------------------------
// Accessor shorthands (read from YAML tables)
// ---------------------------------------------------------------------------

// The tables path active for the current normalizeText() invocation. Builtin
// handlers (numberToWords, convertOrdinal, table_replace, ...) read tables via
// the accessors below, which resolve against this path. Defaults to the
// qlatt-english tables so any code calling the accessors outside a
// normalizeText run keeps its historical behavior.
let activeTablesPath: string = DEFAULT_TABLES_PATH;

function activeTables(): NormalizationTables {
  return getTables(activeTablesPath);
}

function ONES(): string[] {
  return activeTables().ones;
}
function TEENS(): string[] {
  return activeTables().teens;
}
function TENS(): string[] {
  return activeTables().tens;
}
function ORDINAL_ONES(): Record<number, string> {
  return activeTables().ordinal_ones;
}
function ORDINAL_TENS(): Record<number, string> {
  return activeTables().ordinal_tens;
}
function ABBREVIATIONS(): Record<string, string> {
  return activeTables().abbreviations;
}
function DIGIT_WORDS(): Record<string, string> {
  return activeTables().digit_words;
}
function MONTH_NAMES(): string[] {
  return activeTables().month_names;
}

// ---------------------------------------------------------------------------
// numberToWords
// ---------------------------------------------------------------------------

/**
 * Convert a non-negative integer (0 through 999,999,999) to English words.
 *
 * Examples:
 *   numberToWords(0)       -> "zero"
 *   numberToWords(42)      -> "forty two"
 *   numberToWords(1234)    -> "one thousand two hundred thirty four"
 *   numberToWords(1000000) -> "one million"
 */
export function numberToWords(num: number): string {
  if (num === 0) return "zero";
  if (num < 0 || num > 999_999_999 || !Number.isFinite(num)) {
    return String(num);
  }
  return convertChunk(num).trim();
}

/**
 * Recursively convert a number to words using the standard English
 * grouping: millions, thousands, hundreds.
 */
function convertChunk(n: number): string {
  if (n === 0) return "";

  if (n < 10) {
    return ONES()[n];
  }

  if (n < 20) {
    return TEENS()[n - 10];
  }

  if (n < 100) {
    const remainder = n % 10;
    return TENS()[Math.floor(n / 10)] + (remainder !== 0 ? " " + ONES()[remainder] : "");
  }

  if (n < 1000) {
    const remainder = n % 100;
    return (
      ONES()[Math.floor(n / 100)] +
      " hundred" +
      (remainder !== 0 ? " " + convertChunk(remainder) : "")
    );
  }

  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    return (
      convertChunk(thousands) +
      " thousand" +
      (remainder !== 0 ? " " + convertChunk(remainder) : "")
    );
  }

  // millions (up to 999,999,999)
  const millions = Math.floor(n / 1_000_000);
  const remainder = n % 1_000_000;
  return (
    convertChunk(millions) +
    " million" +
    (remainder !== 0 ? " " + convertChunk(remainder) : "")
  );
}

// ---------------------------------------------------------------------------
// ordinalToWords
// ---------------------------------------------------------------------------

/**
 * Convert a string like "1st", "2nd", "3rd", "21st" to words like
 * "first", "second", "third", "twenty first".
 *
 * Returns the original string unchanged if it's not an ordinal pattern.
 */
export function ordinalToWords(s: string): string {
  const match = s.match(/^(\d+)(?:st|nd|rd|th)$/i);
  if (!match) return s;

  const num = parseInt(match[1], 10);
  if (num <= 0 || !Number.isFinite(num)) return s;

  return convertOrdinal(num);
}

/**
 * Convert a number to its ordinal English words.
 */
function convertOrdinal(n: number): string {
  // Direct lookup for 1-19
  if (ORDINAL_ONES()[n]) return ORDINAL_ONES()[n];

  // Exact tens (20, 30, ...)
  if (n < 100 && n % 10 === 0 && ORDINAL_TENS()[n]) return ORDINAL_TENS()[n];

  // Two-digit with remainder (21st, 32nd, etc.)
  if (n < 100) {
    const tensDigit = Math.floor(n / 10) * 10;
    const onesDigit = n % 10;
    return TENS()[Math.floor(n / 10)] + " " + (ORDINAL_ONES()[onesDigit] ?? numberToWords(onesDigit) + "th");
  }

  // For numbers >= 100, use cardinal for the prefix and ordinal for the last part
  // e.g. 100th -> "one hundredth", 121st -> "one hundred twenty first"
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    if (remainder === 0) {
      return ONES()[hundreds] + " hundredth";
    }
    return ONES()[hundreds] + " hundred " + convertOrdinal(remainder);
  }

  // For larger numbers, use cardinal prefix + ordinal suffix
  return numberToWords(n) + "th";
}

// ---------------------------------------------------------------------------
// readYear (generic, config-driven 4-digit "year" reading)
// ---------------------------------------------------------------------------

/**
 * Year-detection / speaking policy, supplied as DATA by a frontend's
 * normalization pipeline step. This module hardcodes no frontend name and no
 * specific year range — the predicate is entirely parameterized by these flags.
 *
 * Mirrors DECtalk 4.63 `ls_util_is_year` (ls_util.c:598-622): a digit string is
 * a year iff it is exactly `min_digits` long, its first digit is not '0' (when
 * `reject_leading_zero`), and its middle two digits are not both '0' (when
 * `reject_middle_00`). The speaking form mirrors `ls_proc_do_4_digits`
 * (l_us_pr1.c:367-398): two 2-digit halves, with a "hundred" form for X00 and
 * digit-spelling for a leading-zero half.
 */
interface YearPolicy {
  /** Exact digit count that qualifies as a year (DECtalk: 4). */
  min_digits?: number;
  /** Reject a leading-zero digit string (DECtalk: true; 0100 is not a year). */
  reject_leading_zero?: boolean;
  /** Reject a string whose middle two digits are both '0' (DECtalk: true; 2000/2005 not years). */
  reject_middle_00?: boolean;
}

const DEFAULT_YEAR_POLICY: Required<YearPolicy> = {
  min_digits: 4,
  reject_leading_zero: true,
  reject_middle_00: true,
};

/**
 * True iff `digits` qualifies as a year under `policy`. `digits` is expected to
 * be an all-digit string (the calling pipeline step's regex guarantees this).
 */
export function isYear(digits: string, policy: YearPolicy = {}): boolean {
  const minDigits = policy.min_digits ?? DEFAULT_YEAR_POLICY.min_digits;
  const rejectLeadingZero = policy.reject_leading_zero ?? DEFAULT_YEAR_POLICY.reject_leading_zero;
  const rejectMiddle00 = policy.reject_middle_00 ?? DEFAULT_YEAR_POLICY.reject_middle_00;

  if (!/^\d+$/.test(digits)) return false;
  if (digits.length !== minDigits) return false;
  if (rejectLeadingZero && digits[0] === "0") return false;
  if (rejectMiddle00 && digits[1] === "0" && digits[2] === "0") return false;
  return true;
}

/**
 * Read a 2-digit string `XY` per DECtalk `ls_proc_do_2_digits` (l_us_pr1.c:297):
 *   - X == '0' -> spell both digits ("05" -> "zero five")
 *   - X == '1' -> teen ("ten".."nineteen")
 *   - else     -> tens word, plus units word when Y != '0'
 */
function read2Digits(pair: string): string {
  const x = pair[0];
  const y = pair[1];
  if (x === "0") {
    return `${DIGIT_WORDS()[x] ?? x} ${DIGIT_WORDS()[y] ?? y}`;
  }
  if (x === "1") {
    return TEENS()[Number(y)];
  }
  const tensWord = TENS()[Number(x)];
  if (y === "0") return tensWord;
  return `${tensWord} ${ONES()[Number(y)]}`;
}

/**
 * Speak a (validated) 4-digit year `ABCD` per DECtalk `ls_proc_do_4_digits`
 * (l_us_pr1.c:367-398), generic and config-table-driven:
 *   - A == '0'           -> spell all digits (cannot occur for a valid year)
 *   - CD == '00', B == '0' -> "A thousand" (e.g. 1000; not a valid year)
 *   - CD == '00', B != '0' -> read AB as 2 digits + "hundred"  (1900 -> "nineteen hundred")
 *   - else                 -> read AB + read CD                (1984 -> "nineteen eighty four")
 */
export function readYear(digits: string): string {
  const a = digits[0];
  const b = digits[1];
  const cd = digits.slice(2);
  const ab = digits.slice(0, 2);

  if (a === "0") {
    return digits
      .split("")
      .map((d) => DIGIT_WORDS()[d] ?? d)
      .join(" ");
  }
  if (cd === "00") {
    if (b === "0") {
      return `${ONES()[Number(a)]} thousand`;
    }
    return `${read2Digits(ab)} hundred`;
  }
  return `${read2Digits(ab)} ${read2Digits(cd)}`;
}

// ---------------------------------------------------------------------------
// readFraction (generic, config-driven "N/D" fraction reading)
// ---------------------------------------------------------------------------

const DEFAULT_FRACTION_MAX_3DIGIT_DENOM = 100;

/**
 * True iff `numerator`/`denominator` qualify as a fraction under `policy`,
 * mirroring DECtalk `ls_proc_is_frac` (l_us_pr1.c:980-1015). Both strings are
 * expected to be all-digit (the calling pipeline step's regex guarantees this).
 *   - numerator: 1-2 digits, no leading '0'
 *   - denominator: 1-3 digits, no leading '0'; a 3-digit denominator must equal
 *     `max_3digit_denominator` (DECtalk: 100).
 */
export function isFraction(
  numerator: string,
  denominator: string,
  policy: FractionPolicy = {},
): boolean {
  const max3 = policy.max_3digit_denominator ?? DEFAULT_FRACTION_MAX_3DIGIT_DENOM;
  if (!/^[1-9]\d?$/.test(numerator)) return false; // 1-2 digits, no leading 0
  if (!/^[1-9]\d{0,2}$/.test(denominator)) return false; // 1-3 digits, no leading 0
  if (denominator.length === 3 && Number(denominator) !== max3) return false;
  return true;
}

/**
 * Speak a (validated) "N/D" fraction with an optional trailing '%', per DECtalk
 * `ls_proc_do_frac` (l_us_pr1.c:1034-1069), generic and config-table-driven:
 *   - numerator spoken cardinal (numberToWords)
 *   - denominator: if listed in `special_denominators` (DECtalk: only "2" ->
 *     half/halves) use that word, choosing plural when the numerator is plural
 *     (value != 1); otherwise speak the denominator as an ordinal (convertOrdinal)
 *     and append a plural "s" when the numerator is plural.
 *   - trailing '%' -> `percent_word`.
 *
 * NOTE on parity: DECtalk only special-cases denominator "2"; "3/4" reads
 * "three fourths" (ordinal), NOT the colloquial "three quarters". This mirrors
 * the actual 4.63 source (l_us_pr1.c:1050-1063), not the colloquial form.
 */
export function readFraction(
  numerator: string,
  denominator: string,
  percent: boolean,
  policy: FractionPolicy = {},
): string {
  const numValue = parseInt(numerator, 10);
  const plural = numValue !== 1; // DECtalk pflag: TRUE unless numerator is exactly 1
  const numWords = numberToWords(numValue);

  const special = policy.special_denominators?.[denominator];
  let denomWords: string;
  if (special) {
    denomWords = plural ? special.plural : special.singular;
  } else {
    const ordinal = convertOrdinal(parseInt(denominator, 10));
    denomWords = plural ? `${ordinal}s` : ordinal;
  }

  const percentSuffix = percent ? ` ${policy.percent_word ?? "percent"}` : "";
  return `${numWords} ${denomWords}${percentSuffix}`;
}

function decimalToWords(integerPartRaw: string, fractionalPartRaw: string): string {
  const integerPart = integerPartRaw.replace(/,/g, "");
  const integerValue = parseInt(integerPart, 10);
  const lhs = Number.isFinite(integerValue) ? numberToWords(integerValue) : integerPartRaw;
  const rhs = fractionalPartRaw
    .split("")
    .map((digit) => DIGIT_WORDS()[digit] ?? digit)
    .join(" ");
  return `${lhs} point ${rhs}`;
}

function currencyToWords(integerPartRaw: string, fractionalPartRaw?: string): string {
  const integerPart = integerPartRaw.replace(/,/g, "");
  const dollars = parseInt(integerPart, 10);
  if (!Number.isFinite(dollars) || dollars < 0) {
    return `$${integerPartRaw}${fractionalPartRaw != null ? `.${fractionalPartRaw}` : ""}`;
  }

  if (fractionalPartRaw == null) {
    const unit = dollars === 1 ? "dollar" : "dollars";
    return `${numberToWords(dollars)} ${unit}`;
  }

  const centsValue = parseInt(fractionalPartRaw.padEnd(2, "0").slice(0, 2), 10);
  const cents = Number.isFinite(centsValue) ? centsValue : 0;
  if (dollars === 0) {
    const centUnit = cents === 1 ? "cent" : "cents";
    return `${numberToWords(cents)} ${centUnit}`;
  }

  if (cents === 0) {
    const unit = dollars === 1 ? "dollar" : "dollars";
    return `${numberToWords(dollars)} ${unit}`;
  }

  const dollarUnit = dollars === 1 ? "dollar" : "dollars";
  const centUnit = cents === 1 ? "cent" : "cents";
  return `${numberToWords(dollars)} ${dollarUnit} and ${numberToWords(cents)} ${centUnit}`;
}

function timeToWords(hourRaw: string, minuteRaw: string, meridiemRaw?: string): string {
  const hours = parseInt(hourRaw, 10);
  const minutes = parseInt(minuteRaw, 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return `${hourRaw}:${minuteRaw}${meridiemRaw ? ` ${meridiemRaw}` : ""}`;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return `${hourRaw}:${minuteRaw}${meridiemRaw ? ` ${meridiemRaw}` : ""}`;
  }

  let spokenHour = hours;
  let meridiem = meridiemRaw?.toLowerCase().replace(/\./g, "");
  if (!meridiem) {
    meridiem = hours < 12 ? "am" : "pm";
    spokenHour = hours % 12;
    if (spokenHour === 0) {
      spokenHour = 12;
    }
  } else if (spokenHour === 0) {
    spokenHour = 12;
  } else if (spokenHour > 12) {
    spokenHour -= 12;
  }

  const minuteWords =
    minutes === 0
      ? "o'clock"
      : minutes < 10
        ? `oh ${numberToWords(minutes)}`
        : numberToWords(minutes);
  const meridiemWords = meridiem === "pm" ? "p m" : "a m";
  return `${numberToWords(spokenHour)} ${minuteWords} ${meridiemWords}`;
}

function dateToWords(monthRaw: string, dayRaw: string, yearRaw: string): string {
  const month = parseInt(monthRaw, 10);
  const day = parseInt(dayRaw, 10);
  const year = parseInt(yearRaw, 10);
  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) {
    return `${monthRaw}/${dayRaw}/${yearRaw}`;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 0 || year > 999_999_999) {
    return `${monthRaw}/${dayRaw}/${yearRaw}`;
  }
  return `${MONTH_NAMES()[month - 1]} ${convertOrdinal(day)} ${numberToWords(year)}`;
}

function isoDateToWords(yearRaw: string, monthRaw: string, dayRaw: string): string {
  const month = parseInt(monthRaw, 10);
  const day = parseInt(dayRaw, 10);
  const year = parseInt(yearRaw, 10);
  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) {
    return `${yearRaw}-${monthRaw}-${dayRaw}`;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 0 || year > 999_999_999) {
    return `${yearRaw}-${monthRaw}-${dayRaw}`;
  }
  return `${MONTH_NAMES()[month - 1]} ${convertOrdinal(day)} ${numberToWords(year)}`;
}

// ---------------------------------------------------------------------------
// Builtin step handlers (registered by name for YAML pipeline dispatch)
// ---------------------------------------------------------------------------

/**
 * Map of handler name → function for builtin pipeline steps.
 * The YAML pipeline references these by name in the `handler` field.
 */
const BUILTIN_HANDLERS: Record<string, (result: string, step: PipelineStep) => string> = {
  lowercase: (result) => result.toLowerCase(),

  dateToWords: (result, step) => {
    const re = new RegExp(step.pattern!, step.flags);
    return result.replace(re, (_m: string, month: string, day: string, year: string) =>
      dateToWords(month, day, year)
    );
  },

  isoDateToWords: (result, step) => {
    const re = new RegExp(step.pattern!, step.flags);
    return result.replace(re, (_m: string, year: string, month: string, day: string) =>
      isoDateToWords(year, month, day)
    );
  },

  timeToWords: (result, step) => {
    const re = new RegExp(step.pattern!, step.flags);
    // replace() passes (match, g1, g2, [g3], offset, string) — for 2-group
    // regexes the 4th arg is `offset` (a number), not a capture group.
    return result.replace(re, (_m: string, hour: string, minute: string, meridiemOrOffset?: string | number) =>
      timeToWords(hour, minute, typeof meridiemOrOffset === "string" ? meridiemOrOffset : undefined)
    );
  },

  currencyToWords: (result, step) => {
    const re = new RegExp(step.pattern!, step.flags);
    // The cents group is optional — when absent, replace() passes offset (number) instead.
    return result.replace(re, (_m: string, dollars: string, centsOrOffset?: string | number) =>
      currencyToWords(dollars, typeof centsOrOffset === "string" ? centsOrOffset : undefined)
    );
  },

  decimalToWords: (result, step) => {
    const re = new RegExp(step.pattern!, step.flags);
    return result.replace(re, (_m: string, lhs: string, rhs: string) =>
      decimalToWords(lhs, rhs)
    );
  },

  ordinalToWordsInline: (result, step) => {
    const re = new RegExp(step.pattern!, step.flags);
    return result.replace(re, (_match: string, digits: string) => {
      return convertOrdinal(parseInt(digits, 10));
    });
  },

  numberToWordsInline: (result, step) => {
    const re = new RegExp(step.pattern!, step.flags);
    return result.replace(re, (_match: string, digits: string) => {
      return numberToWords(parseInt(digits, 10));
    });
  },

  // Reads bare 4-digit (year_policy.min_digits) tokens that satisfy the
  // configured year predicate as a two-halves "year" form; tokens that do NOT
  // qualify are left verbatim for a later number step to read as cardinals.
  // Entirely data-driven: the predicate parameters and the digit tables come
  // from config, so this handler carries no per-frontend logic.
  readYearInline: (result, step) => {
    const re = new RegExp(step.pattern!, step.flags);
    const policy = step.year_policy ?? {};
    return result.replace(re, (match: string, digits: string) => {
      return isYear(digits, policy) ? readYear(digits) : match;
    });
  },

  // Reads "N/D" (and "N/D%") fractions matched by the step regex. Tokens that
  // do NOT satisfy the configured fraction predicate (e.g. a 3-digit denominator
  // other than 100) are left verbatim for later number steps. Entirely
  // data-driven: special-denominator words, the percent word, and the predicate
  // bound come from `fraction_policy`, so this handler carries no per-frontend logic.
  readFractionInline: (result, step) => {
    const re = new RegExp(step.pattern!, step.flags);
    const policy = step.fraction_policy ?? {};
    return result.replace(
      re,
      (match: string, numerator: string, denominator: string, percentOrOffset?: string | number) => {
        if (!isFraction(numerator, denominator, policy)) return match;
        const percent = percentOrOffset === "%";
        return readFraction(numerator, denominator, percent, policy);
      },
    );
  },

  punctuationCleanup: (result) => {
    const PLACEHOLDER = "\x00";
    let text = result;
    // Protect lexical apostrophes (fixed-point loop for multiple internal apostrophes)
    let previous = "";
    while (previous !== text) {
      previous = text;
      text = text.replace(/([a-z])'([a-z])/gi, `$1${PLACEHOLDER}$2`);
    }
    // Preserve trailing apostrophes for colloquial elision spellings
    text = text.replace(/([a-z])'(?=\s|$|[,.\?!;:])/gi, `$1${PLACEHOLDER}`);
    // Surround pause-generating punctuation with spaces
    text = text.replace(/([,.\?!;:])/g, " $1 ");
    // Strip all remaining punctuation
    text = text.replace(/[^\w\s\x00,.\?!;:]/g, " ");
    text = text.replace(new RegExp(PLACEHOLDER, "g"), "'");
    return text;
  },
};

const REGEX_REPLACE_HANDLERS: Record<string, (match: string) => string> = {
  expandInitialism: (match) =>
    match
      .replace(/\./g, "")
      .split("")
      .join(" "),
};

export function validateNormalizationPipelineConfig(
  pipeline: NormalizationPipeline,
  tables: NormalizationTables,
): void {
  if (!pipeline || !Array.isArray(pipeline.steps)) {
    throw new Error("E_NORMALIZE_CONFIG: normalization pipeline must define steps");
  }

  for (const step of pipeline.steps) {
    if (step.type === "builtin") {
      if (!step.handler || !BUILTIN_HANDLERS[step.handler]) {
        throw new Error(`E_NORMALIZE_CONFIG: builtin step '${step.name}' references unknown handler`);
      }
      continue;
    }

    if (step.type === "table_replace") {
      if (!step.table || !(step.table in tables)) {
        throw new Error(`E_NORMALIZE_CONFIG: table_replace step '${step.name}' references missing table`);
      }
      continue;
    }

    if (step.type === "regex_replace") {
      for (const rule of step.rules ?? []) {
        if (rule.handler && !REGEX_REPLACE_HANDLERS[rule.handler]) {
          throw new Error(`E_NORMALIZE_CONFIG: regex_replace step '${step.name}' references unknown handler`);
        }
        if (!rule.handler && typeof rule.replacement !== "string") {
          throw new Error(
            `E_NORMALIZE_CONFIG: regex_replace step '${step.name}' must define replacement or handler`,
          );
        }
      }
      continue;
    }

    throw new Error(`E_NORMALIZE_CONFIG: step '${step.name}' has unknown type '${step.type}'`);
  }
}

// ---------------------------------------------------------------------------
// Pipeline step dispatchers
// ---------------------------------------------------------------------------

function executeRegexReplace(result: string, step: PipelineStep): string {
  let text = result;
  for (const rule of step.rules ?? []) {
    if (rule.handler) {
      const handler = REGEX_REPLACE_HANDLERS[rule.handler];
      if (!handler) {
        throw new Error(`E_NORMALIZE: unknown regex_replace handler '${rule.handler}'`);
      }
      const re = new RegExp(rule.pattern, rule.flags);
      text = text.replace(re, handler);
      continue;
    }
    if (typeof rule.replacement !== "string") {
      throw new Error(`E_NORMALIZE: regex_replace rule in step '${step.name}' must define replacement or handler`);
    }
    const re = new RegExp(rule.pattern, rule.flags);
    text = text.replace(re, rule.replacement);
  }
  if (step.post === "trim") {
    text = text.trim();
  }
  return text;
}

function executeTableReplace(result: string, step: PipelineStep): string {
  const tableName = step.table;
  if (!tableName) {
    throw new Error(`E_NORMALIZE_CONFIG: table_replace step '${step.name}' must define table`);
  }

  const tables = activeTables();
  const table = (tables as unknown as Record<string, unknown>)[tableName] as Record<string, string> | undefined;
  if (!table) {
    throw new Error(`E_NORMALIZE_CONFIG: table_replace step '${step.name}' references missing table '${tableName}'`);
  }

  let text = result;
  for (const [key, expansion] of Object.entries(table)) {
    const escaped = key.replace(/\./g, "\\.");
    const re = new RegExp("\\b" + escaped, "gi");
    text = text.replace(re, expansion);
  }
  return text;
}

function executeStep(result: string, step: PipelineStep): string {
  switch (step.type) {
    case "builtin": {
      const handler = BUILTIN_HANDLERS[step.handler!];
      if (!handler) {
        throw new Error(`E_NORMALIZE: unknown builtin handler '${step.handler}'`);
      }
      return handler(result, step);
    }
    case "regex_replace":
      return executeRegexReplace(result, step);
    case "table_replace":
      return executeTableReplace(result, step);
    default:
      throw new Error(`E_NORMALIZE: unknown step type '${step.type}'`);
  }
}

// ---------------------------------------------------------------------------
// normalizeText
// ---------------------------------------------------------------------------

/**
 * Normalize text for TTS consumption.
 *
 * Pipeline order and lookup tables are loaded from YAML configuration:
 *   normalization-pipeline.yaml — step sequence
 *   normalization-tables.yaml   — lookup data
 *
 * Algorithmic functions (numberToWords, convertOrdinal, etc.) remain as
 * TypeScript implementations registered as named builtin handlers.
 *
 * Citation: Allen, Hunnicutt & Klatt 1987 Ch.3; Ebden & Sproat 2015
 */
export function normalizeText(text: string, config: NormalizationConfig = {}): string {
  if (!text) return "";

  const tablesPath = config.tablesPath ?? DEFAULT_TABLES_PATH;
  const pipelinePath = config.pipelinePath ?? DEFAULT_PIPELINE_PATH;

  const pipeline = getPipeline(pipelinePath, tablesPath);

  // Builtin handlers resolve tables via the active path; set it for the
  // duration of this call and restore afterward (single-threaded JS — no
  // interleaving).
  const previousTablesPath = activeTablesPath;
  activeTablesPath = tablesPath;
  try {
    let result = text;
    for (const step of pipeline.steps) {
      result = executeStep(result, step);
    }
    return result;
  } finally {
    activeTablesPath = previousTablesPath;
  }
}
