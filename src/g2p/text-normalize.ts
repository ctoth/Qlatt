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
  replacement: string;
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
}

interface NormalizationPipeline {
  steps: PipelineStep[];
}

// ---------------------------------------------------------------------------
// YAML loading (cached, following morphology.ts pattern)
// ---------------------------------------------------------------------------

const TABLES_PATH = "/rules/frontends/qlatt-english/normalization-tables.yaml";
const PIPELINE_PATH = "/rules/frontends/qlatt-english/normalization-pipeline.yaml";

let tablesCache: NormalizationTables | null = null;
let pipelineCache: NormalizationPipeline | null = null;

function getTables(): NormalizationTables {
  if (!tablesCache) {
    tablesCache = loadYamlDocumentSync<NormalizationTables>(TABLES_PATH);
  }
  return tablesCache;
}

function getPipeline(): NormalizationPipeline {
  if (!pipelineCache) {
    pipelineCache = loadYamlDocumentSync<NormalizationPipeline>(PIPELINE_PATH);
  }
  return pipelineCache;
}

// ---------------------------------------------------------------------------
// Accessor shorthands (read from YAML tables)
// ---------------------------------------------------------------------------

function ONES(): string[] {
  return getTables().ones;
}
function TEENS(): string[] {
  return getTables().teens;
}
function TENS(): string[] {
  return getTables().tens;
}
function ORDINAL_ONES(): Record<number, string> {
  return getTables().ordinal_ones;
}
function ORDINAL_TENS(): Record<number, string> {
  return getTables().ordinal_tens;
}
function ABBREVIATIONS(): Record<string, string> {
  return getTables().abbreviations;
}
function DIGIT_WORDS(): Record<string, string> {
  return getTables().digit_words;
}
function MONTH_NAMES(): string[] {
  return getTables().month_names;
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

// ---------------------------------------------------------------------------
// Pipeline step dispatchers
// ---------------------------------------------------------------------------

function executeRegexReplace(result: string, step: PipelineStep): string {
  let text = result;
  for (const rule of step.rules ?? []) {
    if (rule.replacement === "__initialism__") {
      // Special handler for initialism expansion
      const re = new RegExp(rule.pattern, rule.flags);
      text = text.replace(re, (match: string) =>
        match
          .replace(/\./g, "")
          .split("")
          .join(" ")
      );
    } else {
      const re = new RegExp(rule.pattern, rule.flags);
      text = text.replace(re, rule.replacement);
    }
  }
  if (step.post === "trim") {
    text = text.trim();
  }
  return text;
}

function executeTableReplace(result: string, step: PipelineStep): string {
  const tableName = step.table;
  if (!tableName) return result;

  const tables = getTables();
  const table = (tables as Record<string, unknown>)[tableName] as Record<string, string> | undefined;
  if (!table) return result;

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
export function normalizeText(text: string): string {
  if (!text) return "";

  const pipeline = getPipeline();
  let result = text;

  for (const step of pipeline.steps) {
    result = executeStep(result, step);
  }

  return result;
}
