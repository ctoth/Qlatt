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
 */

// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------

const ONES = [
  "", "one", "two", "three", "four", "five",
  "six", "seven", "eight", "nine",
];

const TEENS = [
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
];

const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty",
  "sixty", "seventy", "eighty", "ninety",
];

/** Special ordinal forms for numbers 1-19 and the tens. */
const ORDINAL_ONES: Record<number, string> = {
  1: "first",
  2: "second",
  3: "third",
  4: "fourth",
  5: "fifth",
  6: "sixth",
  7: "seventh",
  8: "eighth",
  9: "ninth",
  10: "tenth",
  11: "eleventh",
  12: "twelfth",
  13: "thirteenth",
  14: "fourteenth",
  15: "fifteenth",
  16: "sixteenth",
  17: "seventeenth",
  18: "eighteenth",
  19: "nineteenth",
};

const ORDINAL_TENS: Record<number, string> = {
  20: "twentieth",
  30: "thirtieth",
  40: "fortieth",
  50: "fiftieth",
  60: "sixtieth",
  70: "seventieth",
  80: "eightieth",
  90: "ninetieth",
};

/** Common abbreviations → full word expansions. */
const ABBREVIATIONS: Record<string, string> = {
  "dr.": "doctor",
  "mr.": "mister",
  "mrs.": "missus",
  "ms.": "miss",
  "st.": "saint",
  "ave.": "avenue",
  "blvd.": "boulevard",
  "rd.": "road",
  "sr.": "senior",
  "jr.": "junior",
  "prof.": "professor",
  "gen.": "general",
  "sgt.": "sergeant",
  "cpl.": "corporal",
  "pvt.": "private",
  "capt.": "captain",
  "lt.": "lieutenant",
  "col.": "colonel",
  "govt.": "government",
  "dept.": "department",
  "univ.": "university",
  "assn.": "association",
  "bros.": "brothers",
  "inc.": "incorporated",
  "corp.": "corporation",
  "co.": "company",
  "no.": "number",
  "approx.": "approximately",
  "vs.": "versus",
  "etc.": "etcetera",
};

const DIGIT_WORDS: Record<string, string> = {
  "0": "zero",
  "1": "one",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
};

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
    return ONES[n];
  }

  if (n < 20) {
    return TEENS[n - 10];
  }

  if (n < 100) {
    const remainder = n % 10;
    return TENS[Math.floor(n / 10)] + (remainder !== 0 ? " " + ONES[remainder] : "");
  }

  if (n < 1000) {
    const remainder = n % 100;
    return (
      ONES[Math.floor(n / 100)] +
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
  if (ORDINAL_ONES[n]) return ORDINAL_ONES[n];

  // Exact tens (20, 30, ...)
  if (n < 100 && n % 10 === 0 && ORDINAL_TENS[n]) return ORDINAL_TENS[n];

  // Two-digit with remainder (21st, 32nd, etc.)
  if (n < 100) {
    const tensDigit = Math.floor(n / 10) * 10;
    const onesDigit = n % 10;
    return TENS[Math.floor(n / 10)] + " " + (ORDINAL_ONES[onesDigit] ?? numberToWords(onesDigit) + "th");
  }

  // For numbers >= 100, use cardinal for the prefix and ordinal for the last part
  // e.g. 100th -> "one hundredth", 121st -> "one hundred twenty first"
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    if (remainder === 0) {
      return ONES[hundreds] + " hundredth";
    }
    return ONES[hundreds] + " hundred " + convertOrdinal(remainder);
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
    .map((digit) => DIGIT_WORDS[digit] ?? digit)
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

// ---------------------------------------------------------------------------
// normalizeText
// ---------------------------------------------------------------------------

/**
 * Normalize text for TTS consumption:
 * 1. Lowercase
 * 2. Expand abbreviations (Dr., Mr., etc.)
 * 3. Convert ordinals to words (1st -> first)
 * 4. Convert numbers to words (42 -> forty two)
 * 5. Preserve pause-generating punctuation (, . ? ! ; :) as separate tokens
 * 5b. Strip other punctuation (except apostrophes in contractions)
 * 6. Collapse whitespace
 */
export function normalizeText(text: string): string {
  if (!text) return "";

  let result = text.toLowerCase();

  // Expand abbreviations (must happen before punctuation stripping so we can
  // detect the trailing dot). We use a word-boundary-aware replacement to
  // avoid false positives inside longer words.
  for (const [abbrev, expansion] of Object.entries(ABBREVIATIONS)) {
    // Build a regex that matches the abbreviation as a standalone token.
    // Escape the dot for regex.
    const escaped = abbrev.replace(/\./g, "\\.");
    const re = new RegExp("\\b" + escaped, "gi");
    result = result.replace(re, expansion);
  }

  // Convert currency forms like $12, $12.34
  result = result.replace(/\$([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)(?:\.([0-9]{1,2}))?/g, (_m, dollars, cents) =>
    currencyToWords(dollars, cents)
  );

  // Convert decimal numbers before integer conversion so 3.14 does not become "three . fourteen".
  result = result.replace(/\b([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\.([0-9]+)\b/g, (_m, lhs, rhs) =>
    decimalToWords(lhs, rhs)
  );

  // Convert ordinals BEFORE numbers so "21st" doesn't become "twenty onest"
  result = result.replace(/\b(\d+)(?:st|nd|rd|th)\b/gi, (_match, digits) => {
    return convertOrdinal(parseInt(digits, 10));
  });

  // Convert numbers to words
  result = result.replace(/\b(\d+)\b/g, (_match, digits) => {
    return numberToWords(parseInt(digits, 10));
  });

  // Strip punctuation EXCEPT:
  // 1. Apostrophes inside words (contractions: it's, don't)
  // 2. Pause-generating punctuation (, . ? ! ; :) which become separate tokens
  //    so that transcribeText() can convert them to SIL pauses.
  // Strategy: protect contractions with placeholder, separate pause punctuation
  // with spaces, strip remaining punctuation, then restore.
  const PLACEHOLDER = "\x00";
  result = result.replace(/([a-z])'([a-z])/gi, `$1${PLACEHOLDER}$2`);
  // Surround pause-generating punctuation with spaces so they become separate tokens
  result = result.replace(/([,.\?!;:])/g, " $1 ");
  // Strip all remaining punctuation (quotes, parens, brackets, etc.)
  result = result.replace(/[^\w\s\x00,.\?!;:]/g, " ");
  result = result.replace(new RegExp(PLACEHOLDER, "g"), "'");

  // Collapse whitespace and trim
  result = result.replace(/\s+/g, " ").trim();

  return result;
}
