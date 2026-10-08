/**
 * An interpreter for the compiled rules of a command text parser: the
 * program DECtalk 4.63 runs over each clause of text before its
 * letter-to-sound stage (CMD/cm_text.c calls par_process_input). A port of
 * CMD/par_pars1.c, the interpreter the build compiles (NEW_BINARY_PARSER),
 * with the codes of CMD/par_bin.h. Line numbers below are par_pars1.c's.
 *
 * It knows the rule language only. The rules, their word lists and the
 * character tables come from a table
 * (scripts/build-dectalk-text-parser.ts); the language and mode that select
 * rules, and the rule section, are the caller's.
 *
 * Left out, each because plain text cannot reach it:
 *   - index marks (positions of in-text commands that every action carries
 *     along in the C; text here has none);
 *   - the dictionary, word and status states (0x1D-0x1F), which stop with an
 *     error until they are ported (:3503-4015);
 *   - `go_until`, the 2/3-of-the-buffer mode of the caller's rolling input.
 */

/** A rule table as scripts/build-dectalk-text-parser.ts writes it. */
export interface TextParserTable {
  sections: readonly number[];
  rules: readonly TextParserRule[];
  dictionaries: readonly (readonly string[])[];
  /** TYPE_ bits per character code (CMD/par_char.c parser_char_types). */
  characterTypes: readonly number[];
  /** Case folding per character code (par_lower). */
  lowerCase: readonly number[];
}

export interface TextParserRule {
  index: number;
  kind: "rule" | "stop" | "return" | "goto" | "call";
  flags: number;
  target?: number;
  number?: number;
  line?: number;
  language?: number;
  mode?: number;
  dictionary?: "hit" | "miss" | "abbreviation";
  hit?: number;
  miss?: number;
  callHit?: number;
  callMiss?: number;
  copyHit?: number;
  /** The compiled entry, hexadecimal. */
  bytes: string;
  /** Offset of the body in `bytes`, in bytes. */
  body?: number;
}

/** What a word's dictionary lookup gave (CMD/par_def1.h DICT_*_VALUE). */
export type DictionaryState = 0 | 1 | 2;

export interface RewriteOptions {
  /** The caller's language bit and mode bit (cm_text.c:845-888). */
  language: number;
  mode: number;
  /** Which rule section to run. */
  section: number;
  /**
   * The dictionary state of the word that starts at `position` of `text`
   * (0 not found, 1 found, 2 found as an abbreviation). Default: not found.
   */
  dictionaryState?: (text: string, position: number) => DictionaryState;
  /** Called for every rule that hits, in order. */
  onHit?: (hit: { rule: TextParserRule; before: string; after: string }) => void;
}

// par_def1.h
const FAIL = 0;
const SUCCESS = 1;
const OPT_FAIL = 2;
const END_OF_STRING = 3;
const FATAL_FAIL = 4;
const PAR_MAX_RETURN_LEVEL = 10;
const PAR_MAX_MATCH_ARRAY = 30;
const TYPE_DIGIT = 0x0001;
const TYPE_WHITE = 0x0020;
const TYPE_CLAUSE = 0x0800;
const DICT_MISS_VALUE = 0;
const DICT_ABBREV_VALUE = 2;

// par_bin.h
const BIN_OPERATION_MASK = 0x1f;
const BIN_END_OF_RULE = 0x00;
const BIN_DIGIT = 0x0f;
const BIN_EXACT = 0x10;
const BIN_HEXADECIMAL = 0x11;
const BIN_RESTORE = 0x12;
const BIN_SETS = 0x13;
const BIN_COPY = 0x14;
const BIN_DELETE = 0x15;
const BIN_OPTIONAL = 0x16;
const BIN_SAVE = 0x17;
const BIN_MACRO = 0x18;
const BIN_REPLACE = 0x19;
const BIN_INSERT = 0x1a;
const BIN_AFTER = 0x1b;
const BIN_BEFORE = 0x1c;
const BIN_DICTIONARY = 0x1d;
const BIN_STATUS = 0x1e;
const BIN_LOOK_FROM_DISABLE = 0x40;
const BIN_DIGIT_RANGE = 0x20;
const BIN_CASE_INSEN = 0x20;
const BIN_CONDITIONAL_REPLACE = 0x80;
const BIN_SIZE_DESC_MASK = 0x3f;
const BIN_COMPLIMENT = 0x80;
const BIN_LARGE_DESC = 0x40;
const BIN_MAX_SMALL_DESC = 0x3f;
const BIN_SMALL_ANY_NUMBER = 0x80;
const BIN_SMALL_CONTINUE = 0x40;
const BIN_MAX_LARGE_DESC = 0x3fff;
const BIN_LARGE_ANY_NUMBER = 0x8000;
const BIN_LARGE_CONTINUE = 0x4000;

/** char_type_table (:288-305): a class operation's TYPE_ bit. */
const CHAR_TYPE_TABLE: readonly number[] = [
  0x0000, 0x1000, 0x0008, 0x0010, 0x0800, 0x0200, 0x0004, 0x0080, 0x0400, 0x4000, 0x0040, 0x0002,
  0x0100, 0x2000, 0x0020, 0x0001,
];

const INT_MAX = 0x7fffffff;

/** return_value_t: where a match stands. */
interface ReturnValue {
  inputPos: number;
  inputOffset: number;
  outputPos: number;
  outputOffset: number;
  rule: number;
  value: number;
  optional: number;
}

/** range_value_t: what a digit range or a set chose, for conditional replacement. */
interface RangeValue {
  rangeSet: number;
  start: number;
  min: number;
  end: number;
}

interface Machine {
  table: TextParserTable;
  compiled: readonly Uint8Array[];
  /** match_array: the saved strings $0 to $9. */
  captures: number[][];
}

const copyReturn = (source: ReturnValue): ReturnValue => ({ ...source });
const at = (bytes: ArrayLike<number>, index: number): number => bytes[index] ?? 0;
const getShort = (bytes: ArrayLike<number>, index: number): number =>
  at(bytes, index) | (at(bytes, index + 1) << 8);

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1)
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

const toBytes = (text: string): number[] => [...text].map((char) => char.charCodeAt(0) & 0xff);
const fromBytes = (bytes: readonly number[]): string => String.fromCharCode(...bytes);

/** par_convert_number (:4534): the number in the first `count` characters. */
function convertNumber(input: readonly number[], from: number, count: number): number {
  let total = 0;
  for (let i = 0; i < count; i += 1) {
    const digit = at(input, from + i) - 48;
    if (digit < 0 || digit > 9) return total;
    total = total * 10 + digit;
  }
  return total;
}

/** par_get_int_length (:4599). */
function intLength(value: number): number {
  if (value < 10) return 1;
  if (value < 100) return 2;
  if (value < 1000) return 3;
  if (value < 10000) return 4;
  return 5;
}

/**
 * Size descriptors of a class, digit or set element (:5212-5265): pairs of
 * minimum and maximum, read one or two bytes at a time.
 */
function readDescriptor(
  rule: Uint8Array,
  ruleP: number,
  large: boolean,
): { min: number; max: number; ruleP: number; used: number } {
  let used = 1;
  let p = ruleP;
  if (large) {
    let word = getShort(rule, p);
    p += 2;
    const min = word & BIN_MAX_LARGE_DESC;
    let max = min;
    if (word & BIN_LARGE_ANY_NUMBER) max = INT_MAX;
    else if (word & BIN_LARGE_CONTINUE) {
      word = getShort(rule, p);
      p += 2;
      used += 1;
      max = word & BIN_MAX_LARGE_DESC;
      if (word & BIN_LARGE_ANY_NUMBER) max = INT_MAX;
    }
    return { min, max, ruleP: p, used };
  }
  let byte = at(rule, p);
  p += 1;
  const min = byte & BIN_MAX_SMALL_DESC;
  let max = min;
  if (byte & BIN_SMALL_ANY_NUMBER) max = INT_MAX;
  else if (byte & BIN_SMALL_CONTINUE) {
    byte = at(rule, p);
    p += 1;
    used += 1;
    max = byte & BIN_MAX_SMALL_DESC;
    if (byte & BIN_SMALL_ANY_NUMBER) max = INT_MAX;
  }
  return { min, max, ruleP: p, used };
}

/** par_match_standard (:5132-5408): a character class with its counts. */
function matchStandard(
  machine: Machine,
  rule: Uint8Array,
  charType: number,
  input: readonly number[],
  ret: ReturnValue,
  lookaheadIn: number,
  breakOnMinMatch: number,
): number {
  const types = machine.table.characterTypes;
  let ruleP = ret.rule;
  const inRuleP = ruleP;
  const ipos = ret.inputPos + ret.inputOffset;
  const newCharType = CHAR_TYPE_TABLE[charType];
  let lookahead = lookaheadIn;
  if (at(rule, ruleP) & BIN_LOOK_FROM_DISABLE) lookahead = 0;
  ruleP += 1;
  const descByte = at(rule, ruleP);
  const complement = (descByte & BIN_COMPLIMENT) !== 0;
  const large = (descByte & BIN_LARGE_DESC) !== 0;
  const numDesc = descByte & BIN_SIZE_DESC_MASK;
  let counter = 0;
  ruleP += 1;
  let nextType = 0;
  if (lookahead !== 0) {
    nextType = at(rule, ruleP);
    ruleP += 1;
  }
  let length = 0;
  let matchIsOver = false;
  let satisfiedMinCond = -1;
  let i = 0;
  while (counter < numDesc && !matchIsOver) {
    const descriptor = readDescriptor(rule, ruleP, large);
    ruleP = descriptor.ruleP;
    counter += descriptor.used;
    const { min, max } = descriptor;
    if (min === 0) {
      satisfiedMinCond = -2;
      if (length === 0 && lookahead) {
        if (lookAhead(machine, rule, input, ipos, nextType, ret) === 1) break;
      }
    }
    for (i = length; i < max; i += 1) {
      const char = at(input, ipos + i);
      const member = (types[char] & newCharType) !== 0;
      if ((complement ? member : !member) || char === 0) {
        matchIsOver = true;
        break;
      }
      const count = i + 1;
      if (count >= min) {
        satisfiedMinCond = count;
        length = count;
        if (breakOnMinMatch === 1) {
          matchIsOver = true;
          break;
        }
        if (lookahead && (counter < numDesc || count < max)) {
          if (lookAhead(machine, rule, input, ipos + count, nextType, ret) === 1) {
            matchIsOver = true;
            break;
          }
        }
      }
    }
  }
  if (satisfiedMinCond === -1) return 0;
  if (satisfiedMinCond === -2) {
    if (length === 0) length = -2;
  } else if (at(input, ipos + i) === 0 && length === 0) {
    return -1;
  }
  if (counter !== numDesc) {
    ruleP = inRuleP + 2 + (lookahead ? 1 : 0) + (large ? numDesc << 1 : numDesc);
  }
  ret.rule = ruleP;
  return length;
}

/** par_match_digits (:5438-5694): digits whose value lies in a range. */
function matchDigits(
  machine: Machine,
  rule: Uint8Array,
  input: readonly number[],
  ret: ReturnValue,
  range: RangeValue,
  lookaheadIn: number,
  breakOnMinMatch: number,
): number {
  const types = machine.table.characterTypes;
  let ruleP = ret.rule;
  const inRuleP = ruleP;
  const ipos = ret.inputPos + ret.inputOffset;
  let lookahead = lookaheadIn;
  if (at(rule, ruleP) & BIN_LOOK_FROM_DISABLE) lookahead = 0;
  ruleP += 1;
  const large = (at(rule, ruleP) & BIN_LARGE_DESC) !== 0;
  const numDesc = at(rule, ruleP) & BIN_SIZE_DESC_MASK;
  let counter = 0;
  ruleP += 1;
  let nextType = 0;
  if (lookahead !== 0) {
    nextType = at(rule, ruleP);
    ruleP += 1;
  }
  let length = 0;
  let matchIsOver = false;
  let satisfiedMinCond = -1;
  let satisfiedStart = -1;
  let tempNum = 0;
  let i = 0;
  while (counter < numDesc && !matchIsOver) {
    const descriptor = readDescriptor(rule, ruleP, large);
    ruleP = descriptor.ruleP;
    counter += descriptor.used;
    const minValue = descriptor.min;
    const maxValue = descriptor.max;
    if (range.rangeSet === 0) {
      range.rangeSet = 1;
      range.start = minValue;
    } else {
      if (range.rangeSet === 2) range.rangeSet = -1;
      if (range.rangeSet === 1) range.start += minValue - range.end - 1;
    }
    range.min = minValue;
    range.end = maxValue;
    const maxLength = intLength(maxValue);
    for (i = 0; ; i += 1) {
      if ((types[at(input, ipos + i)] & TYPE_DIGIT) === 0) break;
      tempNum = convertNumber(input, ipos, i + 1);
      if (!(tempNum <= range.end && i < maxLength)) break;
      if (tempNum >= range.min) {
        const count = i + 1;
        length = count;
        satisfiedMinCond = tempNum;
        satisfiedStart = range.start;
        if (breakOnMinMatch === 1) {
          matchIsOver = true;
          break;
        }
        if (lookahead && (counter < numDesc || count < maxLength)) {
          if (lookAhead(machine, rule, input, ipos + count, nextType, ret) === 1) {
            matchIsOver = true;
            break;
          }
        }
      }
    }
    if (tempNum > range.end && counter === numDesc) break;
  }
  if (counter !== numDesc) {
    ruleP = inRuleP + 2 + (lookahead ? 1 : 0) + (large ? numDesc << 1 : numDesc);
  }
  if (satisfiedMinCond === -1) return 0;
  if (range.start !== satisfiedStart) range.start = satisfiedStart;
  if (at(input, ipos + i) === 0 && length === 0) return -1;
  ret.rule = ruleP;
  return length;
}

/** par_match_set (:6021-6167): one alternative of a set. */
function matchSet(
  machine: Machine,
  rule: Uint8Array,
  input: readonly number[],
  sectionCountP: number,
  sectP: number,
  ipos: number,
  range: RangeValue,
  ret: ReturnValue,
): number {
  let ruleP = sectionCountP;
  let newRet: ReturnValue = {
    inputPos: ipos,
    inputOffset: 0,
    outputPos: 0,
    outputOffset: 0,
    rule: sectP,
    value: SUCCESS,
    optional: ret.optional,
  };
  const saveRet = copyReturn(newRet);
  const numSections = at(rule, ruleP);
  const endOfAllSections = at(rule, ruleP + numSections);
  let length = 0;
  let aSuccess = false;
  let numMatch = 0;
  while (newRet.rule <= endOfAllSections && !aSuccess) {
    let thisSuccess = true;
    length = 0;
    ruleP += 1;
    while (newRet.rule <= at(rule, ruleP) && !aSuccess) {
      const charType = at(rule, newRet.rule) & BIN_OPERATION_MASK;
      if (charType === 0) {
        ret.value = FATAL_FAIL;
        return 0;
      }
      const matched = matchString(machine, rule, charType, input, newRet, range, 0, 0);
      length += matched;
      newRet.inputPos += matched;
      if (matched === -1) return -1;
      if (newRet.value === FAIL) {
        thisSuccess = false;
        newRet.rule = at(rule, ruleP) + 1;
      }
    }
    if (thisSuccess) {
      aSuccess = true;
      if (range.rangeSet === 0) {
        range.rangeSet = 2;
        range.start = numMatch;
      } else {
        range.rangeSet = -1;
      }
    } else if (numMatch !== numSections) {
      newRet = copyReturn(saveRet);
      numMatch += 1;
      newRet.rule = at(rule, ruleP) + 1;
    }
  }
  if (!aSuccess) ret.value = FAIL;
  return length;
}

/** par_match_sets_with_ranges (:5724-5990): a set repeated by its counts. */
function matchSetsWithRanges(
  machine: Machine,
  rule: Uint8Array,
  input: readonly number[],
  ret: ReturnValue,
  range: RangeValue,
  lookahead: number,
  breakOnMinMatch: number,
): number {
  let ruleP = ret.rule;
  let ipos = ret.inputPos + ret.inputOffset;
  ruleP += 1;
  const newRet: ReturnValue = {
    inputPos: ret.inputPos + ret.inputOffset,
    inputOffset: 0,
    outputPos: ret.outputPos + ret.outputOffset,
    outputOffset: 0,
    rule: 0,
    value: SUCCESS,
    optional: 0,
  };
  const sectionP = ruleP;
  const endOfAllTypes = at(rule, sectionP + at(rule, ruleP)) + 1;
  ruleP += at(rule, ruleP) + 1;
  const large = (at(rule, ruleP) & BIN_LARGE_DESC) !== 0;
  // As written (:5794-5803): the whole descriptor byte, flags included, is
  // the multiplier when the descriptors are large.
  const sectP = large ? ruleP + (at(rule, ruleP) << 1) + 1 : ruleP + at(rule, ruleP) + 1;
  const numDesc = at(rule, ruleP) & BIN_SIZE_DESC_MASK;
  let counter = 0;
  ruleP += 1;
  let times = 0;
  let length = 0;
  let totalLength = 0;
  let matchIsOver = false;
  let satisfiedMinCond = -1;
  while (counter < numDesc && !matchIsOver) {
    const descriptor = readDescriptor(rule, ruleP, large);
    ruleP = descriptor.ruleP;
    counter += descriptor.used;
    const { min, max } = descriptor;
    if (min === 0) {
      satisfiedMinCond = -2;
      if (breakOnMinMatch === 1) break;
    }
    for (let i = times; i < max; i += 1) {
      length = matchSet(machine, rule, input, sectionP, sectP, ipos, range, newRet);
      if (length === -1) {
        matchIsOver = true;
        if (satisfiedMinCond > 0) length = totalLength;
        else totalLength = -1;
        break;
      }
      if (length === 0 && newRet.value === SUCCESS && totalLength === 0) {
        satisfiedMinCond = -2;
        matchIsOver = true;
        break;
      }
      if (length > 0) {
        ipos += length;
        totalLength += length;
      }
      if (newRet.value === FAIL) {
        matchIsOver = true;
        break;
      }
      if (i + 1 >= min) {
        satisfiedMinCond = totalLength;
        times = i + 1;
        if (breakOnMinMatch === 1) {
          matchIsOver = true;
          break;
        }
      } else if (length === 0) {
        matchIsOver = true;
        break;
      }
    }
  }
  ruleP = endOfAllTypes;
  if (satisfiedMinCond === -1) return 0;
  if (satisfiedMinCond === -2) {
    if (totalLength === 0) totalLength = -2;
  } else if (at(input, ipos) === 0 && totalLength === 0) {
    return -1;
  }
  ret.rule = ruleP;
  if (totalLength >= 1) {
    // As written (:5980): from input_pos, not from the current position.
    machine.captures[8] = input.slice(ret.inputPos, ret.inputPos + totalLength);
  }
  void lookahead;
  return totalLength;
}

/** par_look_ahead (:4662-4886): does the element at `findIndex` match here? */
function lookAhead(
  machine: Machine,
  rule: Uint8Array,
  input: readonly number[],
  iposIn: number,
  findIndex: number,
  ret: ReturnValue,
): number {
  const lower = machine.table.lowerCase;
  let ipos = iposIn;
  let ruleP = findIndex;
  const charType = at(rule, findIndex) & BIN_OPERATION_MASK;
  const fresh = (): ReturnValue => ({
    inputPos: ipos,
    inputOffset: 0,
    outputPos: 0,
    outputOffset: 0,
    rule: findIndex,
    value: SUCCESS,
    optional: 0,
  });
  const range: RangeValue = { rangeSet: 0, start: 0, min: 0, end: 0 };
  if (charType === BIN_EXACT) {
    ruleP += 1;
    const end = at(rule, ruleP) + ipos;
    ruleP += 1;
    const fold = (at(rule, findIndex) & BIN_CASE_INSEN) !== 0;
    const same = (a: number, b: number): boolean => (fold ? lower[a] === lower[b] : a === b);
    if (!same(at(rule, ruleP), at(input, ipos))) return 0;
    while (ipos < end) {
      if (!same(at(rule, ruleP), at(input, ipos))) return 0;
      ipos += 1;
      ruleP += 1;
    }
    return 1;
  }
  if (charType <= BIN_DIGIT) {
    const newRet = fresh();
    const length =
      at(rule, findIndex) & BIN_DIGIT_RANGE
        ? matchDigits(machine, rule, input, newRet, range, 0, 1)
        : matchStandard(machine, rule, charType, input, newRet, 0, 1);
    return newRet.value === SUCCESS && length > 0 ? 1 : 0;
  }
  if (charType === BIN_HEXADECIMAL) {
    return at(input, ipos) === at(rule, ruleP + 1) ? 1 : 0;
  }
  if (charType === BIN_RESTORE) {
    const saved = machine.captures[at(rule, ruleP + 1)] ?? [];
    for (let i = 0; i < saved.length; i += 1) {
      if (at(input, ipos + i) !== saved[i]) return 0;
    }
    return saved.length > 0 ? 1 : 0;
  }
  if (charType === BIN_SETS) {
    const newRet = fresh();
    const length = matchSetsWithRanges(machine, rule, input, newRet, range, 0, 1);
    return newRet.value === SUCCESS && length > 0 ? 1 : 0;
  }
  void ret;
  throw new Error("E_TEXT_PARSER: look-ahead to a dictionary state is not ported");
}

/** par_match_string (:4250-4460): one matching element. */
function matchString(
  machine: Machine,
  rule: Uint8Array,
  charType: number,
  input: readonly number[],
  ret: ReturnValue,
  range: RangeValue,
  lookahead: number,
  breakOnMinMatch: number,
): number {
  const lower = machine.table.lowerCase;
  let ruleP = ret.rule;
  const ipos = ret.inputPos + ret.inputOffset;
  let length = 0;
  const fail = (): number => {
    ret.value = ret.optional === 1 ? OPT_FAIL : FAIL;
    return 0;
  };
  if (charType <= BIN_DIGIT) {
    length =
      at(rule, ruleP) & BIN_DIGIT_RANGE
        ? matchDigits(machine, rule, input, ret, range, lookahead, breakOnMinMatch)
        : matchStandard(machine, rule, charType, input, ret, lookahead, breakOnMinMatch);
    ruleP = ret.rule;
  } else if (charType === BIN_EXACT) {
    ruleP += 1;
    const count = at(rule, ruleP);
    ruleP += 1;
    if (at(rule, ret.rule) & BIN_CASE_INSEN) {
      while (length < count) {
        if (lower[at(rule, ruleP)] !== lower[at(input, ipos + length)]) return fail();
        length += 1;
        ruleP += 1;
      }
    } else {
      if (at(rule, ruleP) !== at(input, ipos)) return fail();
      for (let i = 0; i < count; i += 1) {
        if (at(input, ipos + i) !== at(rule, ruleP + i)) return fail();
      }
      ruleP += count;
      length = count;
    }
  } else if (charType === BIN_HEXADECIMAL) {
    ruleP += 1;
    if (at(input, ipos) !== at(rule, ruleP)) return fail();
    length = 1;
    ruleP += 1;
  } else if (charType === BIN_RESTORE) {
    ruleP += 1;
    const saved = machine.captures[at(rule, ruleP)] ?? [];
    length = saved.length;
    for (let i = 0; i < length; i += 1) {
      if (at(input, ipos + i) !== saved[i]) return fail();
    }
    ruleP += 1;
  } else {
    length = matchSetsWithRanges(machine, rule, input, ret, range, lookahead, breakOnMinMatch);
    ruleP = ret.rule;
  }
  if (length === 0) ret.value = ret.optional === 1 ? OPT_FAIL : FAIL;
  if (length === -2) length = 0;
  ret.rule = ruleP;
  return length;
}

/** par_build_string_from_rule (:4016-4213): the text an action writes. */
function buildString(
  machine: Machine,
  rule: Uint8Array,
  output: number[],
  ret: ReturnValue,
  range: RangeValue,
  state: number,
  inRuleIndex: number,
): number[] | null {
  let ruleP = ret.rule;
  const endOfAction = at(rule, inRuleIndex + 2);
  let endOfBuild = endOfAction;
  if (at(rule, inRuleIndex) & BIN_CONDITIONAL_REPLACE) {
    let condNum: number;
    const digitAt = (position: number): number => {
      const digit = at(output, position) - 48;
      return digit < 0 || digit > 9 ? 0 : digit;
    };
    if (range.rangeSet === 2) condNum = range.start;
    else if (state === BIN_BEFORE) condNum = digitAt(ret.outputPos);
    else if (state === BIN_AFTER) condNum = digitAt(ret.outputPos + ret.outputOffset - 1);
    else {
      condNum = convertNumber(output, ret.outputPos, ret.outputOffset);
      if (range.rangeSet === 1) condNum -= range.start;
    }
    const alternatives = at(rule, inRuleIndex + 3);
    if (condNum > alternatives) condNum = 0;
    if (condNum === 0) {
      endOfBuild = at(rule, inRuleIndex + 4);
    } else if (condNum === alternatives) {
      ruleP = at(rule, inRuleIndex + 3 + condNum) + 1;
      endOfBuild = at(rule, inRuleIndex + 2);
    } else {
      ruleP = at(rule, inRuleIndex + 3 + condNum) + 1;
      endOfBuild = at(rule, inRuleIndex + 4 + condNum);
    }
  }
  const built: number[] = [];
  while (ruleP <= endOfBuild) {
    switch (at(rule, ruleP) & BIN_OPERATION_MASK) {
      case BIN_EXACT: {
        ruleP += 1;
        const count = at(rule, ruleP);
        ruleP += 1;
        for (let i = 0; i < count; i += 1) built.push(at(rule, ruleP + i));
        ruleP += count;
        break;
      }
      case BIN_RESTORE:
        ruleP += 1;
        built.push(...(machine.captures[at(rule, ruleP)] ?? []));
        ruleP += 1;
        break;
      case BIN_HEXADECIMAL:
        ruleP += 1;
        built.push(at(rule, ruleP));
        ruleP += 1;
        break;
      default:
        ret.value = FATAL_FAIL;
        return null;
    }
  }
  ret.rule = endOfAction + 1;
  return built;
}

/** The actions (:2639-3502), each on the output its state's match wrote. */
function performAction(
  machine: Machine,
  rule: Uint8Array,
  state: number,
  output: number[],
  ret: ReturnValue,
  range: RangeValue,
  saveNum: number,
  inRuleIndex: number,
): void {
  const from = ret.outputPos;
  const count = ret.outputOffset;
  switch (state) {
    case BIN_DELETE:
      // par_delete_string (:2639-2701).
      ret.outputOffset = 0;
      return;
    case BIN_SAVE:
      // par_save_string (:3412-3502).
      if (count >= PAR_MAX_MATCH_ARRAY) {
        ret.value = FATAL_FAIL;
        return;
      }
      machine.captures[saveNum] = output.slice(from, from + count);
      return;
    case BIN_REPLACE: {
      // par_replace_string (:2726-2820).
      const built = buildString(machine, rule, output, ret, range, BIN_REPLACE, inRuleIndex);
      if (!built) return;
      for (let i = 0; i < built.length; i += 1) output[from + i] = built[i];
      ret.outputOffset = built.length;
      return;
    }
    case BIN_INSERT: {
      // par_insert_string (:3102-3200): between each two characters.
      const built = buildString(machine, rule, output, ret, range, BIN_INSERT, inRuleIndex);
      if (!built) return;
      const original = output.slice(from, from + count);
      const spread: number[] = [];
      original.forEach((char, index) => {
        if (index > 0) spread.push(...built);
        spread.push(char);
      });
      // (n - 1) * (length + 1) + 1 characters; a match of nothing gives -length.
      const newLength = (count - 1) * (built.length + 1) + 1;
      for (let i = 0; i < spread.length; i += 1) output[from + i] = spread[i];
      ret.outputOffset = newLength;
      return;
    }
    case BIN_AFTER: {
      // par_insert_string_after (:3231-3317).
      const built = buildString(machine, rule, output, ret, range, BIN_AFTER, inRuleIndex);
      if (!built) return;
      for (let i = 0; i < built.length; i += 1) output[from + count + i] = built[i];
      ret.outputOffset += built.length;
      return;
    }
    case BIN_BEFORE: {
      // par_insert_string_before (:3318-3411).
      const built = buildString(machine, rule, output, ret, range, BIN_BEFORE, inRuleIndex);
      if (!built) return;
      const original = output.slice(from, from + count);
      for (let i = 0; i < built.length; i += 1) output[from + i] = built[i];
      for (let i = 0; i < original.length; i += 1) output[from + built.length + i] = original[i];
      ret.outputOffset += built.length;
      return;
    }
    case BIN_COPY:
    case BIN_OPTIONAL:
    case BIN_MACRO:
      // ERROR_func2 (:649-667): nothing.
      return;
    default:
      throw new Error(
        `E_TEXT_PARSER: state 0x${state.toString(16)} (dictionary, status or word) is not ported`,
      );
  }
}

/** par_match_rule (:2038-2452): one state of a rule body, recursively. */
function matchRule(
  machine: Machine,
  rule: Uint8Array,
  state: number,
  input: readonly number[],
  output: number[],
  ret: ReturnValue,
): void {
  const lengthOfInput = input.length;
  const newRet: ReturnValue = {
    inputPos: ret.inputPos + ret.inputOffset,
    inputOffset: 0,
    outputPos: ret.outputPos + ret.outputOffset,
    outputOffset: 0,
    rule: ret.rule,
    value: SUCCESS,
    optional: state === BIN_OPTIONAL ? 1 : ret.optional,
  };
  const inRuleIndex = ret.rule;
  const range: RangeValue = { rangeSet: 0, start: 0, min: 0, end: 0 };
  let endOfMatch = 0;
  let saveStateNum = 0;
  if (state === BIN_END_OF_RULE) endOfMatch = 255;
  if (state === BIN_SAVE || state === BIN_DICTIONARY) {
    newRet.rule += 1;
    saveStateNum = at(rule, newRet.rule);
  }
  if (state === BIN_MACRO) {
    let ruleP = newRet.rule;
    ruleP += 1;
    const nextRuleNumber = getShort(rule, ruleP);
    ruleP += 2;
    const target = machine.compiled[nextRuleNumber];
    // As written (:2159-2165): the target's head fields are tested on its
    // first byte, where their flags (0x0100 and above) can never be set, so
    // its body is taken to start at offset 12.
    newRet.rule = 12;
    matchRule(machine, target, BIN_END_OF_RULE, input, output, newRet);
    newRet.rule = ruleP;
    if (newRet.inputPos + newRet.inputOffset > lengthOfInput) {
      ret.value = newRet.optional === 1 ? OPT_FAIL : END_OF_STRING;
      return;
    }
    if (newRet.value === FAIL && newRet.optional) {
      ret.value = OPT_FAIL;
      return;
    }
  } else {
    if (state >= BIN_COPY) {
      newRet.rule += 1;
      endOfMatch = at(rule, newRet.rule);
      newRet.rule += 1;
      if (state >= BIN_REPLACE && state <= BIN_BEFORE) {
        newRet.rule += 1;
        if (at(rule, inRuleIndex) & BIN_CONDITIONAL_REPLACE) {
          newRet.rule += at(rule, newRet.rule);
          newRet.rule += 1;
        }
      } else if (state === BIN_DICTIONARY) {
        newRet.rule += 2;
      } else if (state === BIN_STATUS) {
        newRet.rule += 1;
      }
    }
    while (newRet.rule <= endOfMatch && at(rule, newRet.rule) !== 0 && newRet.value === SUCCESS) {
      const operation = at(rule, newRet.rule) & BIN_OPERATION_MASK;
      if (operation <= BIN_SETS) {
        const matched = matchString(machine, rule, operation, input, newRet, range, 1, 0);
        if (matched === -1) {
          if (newRet.optional === 1) {
            newRet.value = OPT_FAIL;
            break;
          }
          ret.value = END_OF_STRING;
          return;
        }
        if (matched === 0 && newRet.optional) {
          newRet.value = OPT_FAIL;
          break;
        }
        // par_copy_string_data (:4488): what matched goes to the output.
        const fromIn = newRet.inputPos + newRet.inputOffset;
        const toOut = newRet.outputPos + newRet.outputOffset;
        for (let i = 0; i < matched; i += 1) output[toOut + i] = at(input, fromIn + i);
        newRet.outputOffset += matched;
        newRet.inputOffset += matched;
      } else {
        matchRule(machine, rule, operation, input, output, newRet);
        // The call above writes newRet.value.
        if ((newRet.value as number) === END_OF_STRING) {
          if (newRet.optional === 1) {
            newRet.value = OPT_FAIL;
            break;
          }
          ret.value = END_OF_STRING;
          return;
        }
      }
      if (newRet.inputPos + newRet.inputOffset > lengthOfInput) {
        if (newRet.optional === 1) {
          newRet.value = OPT_FAIL;
          break;
        }
        newRet.value = END_OF_STRING;
      }
    }
  }
  if (newRet.value === FAIL) {
    ret.value = FAIL;
    return;
  }
  if (newRet.value === END_OF_STRING) {
    ret.value = END_OF_STRING;
    return;
  }
  if (newRet.value !== OPT_FAIL) {
    if (state !== BIN_END_OF_RULE && state !== BIN_MACRO && newRet.rule !== endOfMatch + 1) {
      ret.value = FATAL_FAIL;
      return;
    }
    if (state !== BIN_END_OF_RULE) {
      performAction(machine, rule, state, output, newRet, range, saveStateNum, inRuleIndex);
    }
    if (newRet.value === FATAL_FAIL) {
      ret.value = FATAL_FAIL;
      return;
    }
    if (newRet.value === FAIL) {
      ret.value = FAIL;
      return;
    }
    ret.value = SUCCESS;
    ret.inputOffset += newRet.inputOffset;
    ret.outputOffset += newRet.outputOffset;
  } else {
    if (state === BIN_OPTIONAL) {
      ret.rule = endOfMatch + 1;
      ret.value = SUCCESS;
      return;
    }
    ret.value = OPT_FAIL;
  }
  ret.rule = newRet.rule;
}

/**
 * par_process_input (:1029-1752): rewrite one clause of text with the rules
 * of a section. Characters are bytes (Latin-1), as in the C.
 */
export function rewriteText(table: TextParserTable, text: string, options: RewriteOptions): string {
  const types = table.characterTypes;
  const machine: Machine = {
    table,
    compiled: table.rules.map((rule) => fromHex(rule.bytes)),
    captures: Array.from({ length: 10 }, () => []),
  };
  if (options.section >= table.sections.length) {
    throw new Error(`E_TEXT_PARSER: no rule section ${options.section}`);
  }
  const numRules = table.rules.length;
  const newInput = toBytes(text);
  const dictHit: number[] = newInput.map((_, position) =>
    options.dictionaryState ? options.dictionaryState(text, position) : DICT_MISS_VALUE,
  );
  const output: number[] = [];
  let newRet: ReturnValue = {
    inputPos: 0,
    inputOffset: 0,
    outputPos: 0,
    outputOffset: 0,
    rule: 0,
    value: FAIL,
    optional: 0,
  };
  let hitRet = copyReturn(newRet);
  let saveRet = copyReturn(newRet);
  let doNotCopyNextWord = false;
  const isWhite = (char: number): boolean => (types[char] & TYPE_WHITE) !== 0;

  while (at(newInput, newRet.inputPos + newRet.inputOffset) !== 0) {
    let done = false;
    // par_skip_white_space (:4980-5041): the first white space is copied.
    {
      const ipos = newRet.inputPos + newRet.inputOffset;
      const opos = newRet.outputPos + newRet.outputOffset;
      let i = 0;
      while (isWhite(at(newInput, ipos + i)) && at(newInput, ipos + i) !== 0) {
        if (i === 0) output[opos] = at(newInput, ipos);
        i += 1;
      }
      newRet.inputOffset += i;
      if (i > 0) newRet.outputOffset += 1;
      if (at(newInput, ipos + i) === 0) done = true;
    }
    saveRet = copyReturn(newRet);
    let currentRuleNumber = table.sections[options.section];
    let lastRuleWasHit = 0;
    const returnRule: number[] = [];

    while (!done) {
      const entry = table.rules[currentRuleNumber];
      if (entry.kind !== "rule") {
        if (entry.kind === "stop") {
          done = true;
          returnRule.length = 0;
          if (lastRuleWasHit > 0) newRet = copyReturn(hitRet);
          continue;
        }
        if (entry.kind === "return") {
          // par_get_return_level (:1779): the rule after this one when empty.
          currentRuleNumber = returnRule.pop() ?? currentRuleNumber + 1;
          continue;
        }
        if (entry.kind === "call" && returnRule.length < PAR_MAX_RETURN_LEVEL) {
          returnRule.push(currentRuleNumber + 1);
        }
        currentRuleNumber = entry.target as number;
        continue;
      }
      newRet.value = FAIL;
      const next = (): void => {
        currentRuleNumber += 1;
        if (currentRuleNumber >= numRules) done = true;
      };
      if (lastRuleWasHit === 0 && ((entry.language as number) & options.language) === 0) {
        next();
        continue;
      }
      if (
        lastRuleWasHit === 0 &&
        (entry.mode as number) !== 0xffffffff &&
        ((entry.mode as number) & options.mode) === 0
      ) {
        next();
        continue;
      }
      if (entry.dictionary) {
        const state = at(dictHit, newRet.inputPos + newRet.inputOffset);
        const runs =
          entry.dictionary === "abbreviation"
            ? state === DICT_ABBREV_VALUE
            : entry.dictionary === "hit"
              ? state !== DICT_MISS_VALUE
              : state === DICT_MISS_VALUE;
        if (!runs) {
          next();
          continue;
        }
      }
      const rule = machine.compiled[currentRuleNumber];
      newRet.rule = entry.body as number;
      matchRule(machine, rule, BIN_END_OF_RULE, newInput, output, newRet);

      const push = (value: number): void => {
        if (returnRule.length < PAR_MAX_RETURN_LEVEL) returnRule.push(value);
      };
      const miss = (): void => {
        if (entry.callMiss !== undefined) {
          push(entry.miss !== undefined ? entry.miss : currentRuleNumber + 1);
          currentRuleNumber = entry.callMiss;
          lastRuleWasHit = -1;
        } else if (entry.miss !== undefined) {
          currentRuleNumber = entry.miss;
          lastRuleWasHit = -1;
        } else {
          currentRuleNumber += 1;
          lastRuleWasHit = 0;
        }
      };

      if (newRet.value === SUCCESS) {
        // Did the match leave off at the end of a word? (:1436-1445)
        const position = newRet.inputPos + newRet.inputOffset;
        const here = at(newInput, position);
        const lastWritten = at(output, newRet.outputPos + newRet.outputOffset - 1);
        let atWordEnd =
          here === 0 ||
          isWhite(here) ||
          ((types[here] & TYPE_CLAUSE) !== 0 &&
            (at(newInput, position + 1) === 0 || isWhite(at(newInput, position + 1))));
        if (!atWordEnd && isWhite(lastWritten)) {
          doNotCopyNextWord = true;
          atWordEnd = true;
        }
        if (!atWordEnd) {
          newRet = copyReturn(saveRet);
          miss();
        } else {
          options.onHit?.({
            rule: entry,
            before: fromBytes(
              newInput.slice(
                saveRet.inputPos + saveRet.inputOffset,
                newRet.inputPos + newRet.inputOffset,
              ),
            ),
            after: fromBytes(
              output.slice(
                saveRet.outputPos + saveRet.outputOffset,
                newRet.outputPos + newRet.outputOffset,
              ),
            ),
          });
          if (entry.copyHit !== undefined) {
            lastRuleWasHit = 1;
            currentRuleNumber = entry.copyHit;
            saveRet = copyReturn(newRet);
          } else if (entry.hit !== undefined || entry.callHit !== undefined) {
            // The output takes the place of the matched input (:1558-1673).
            hitRet = copyReturn(newRet);
            const inputSize = newRet.inputOffset - saveRet.inputOffset;
            const outputSize = newRet.outputOffset - saveRet.outputOffset;
            const written = output.slice(
              saveRet.outputPos + saveRet.outputOffset,
              saveRet.outputPos + saveRet.outputOffset + outputSize,
            );
            const wordStart = saveRet.inputPos + saveRet.inputOffset;
            if (outputSize > inputSize) {
              const sizeDiff = outputSize - inputSize;
              if (saveRet.inputOffset > sizeDiff) {
                for (let i = 0; i < outputSize; i += 1)
                  newInput[wordStart - sizeDiff + i] = written[i];
                newRet.inputOffset = saveRet.inputOffset - sizeDiff;
                newRet.outputOffset = saveRet.outputOffset;
                saveRet.inputOffset -= sizeDiff;
              } else {
                const matchEnd = newRet.inputOffset + newRet.inputPos;
                for (let i = newInput.length + sizeDiff; i > matchEnd; i -= 1) {
                  newInput[i] = at(newInput, i - sizeDiff);
                  dictHit[i] = at(dictHit, i - sizeDiff);
                }
                // The C moves the terminating NUL too; here the array ends.
                while (newInput.length > 0 && newInput[newInput.length - 1] === 0) newInput.pop();
                for (let i = 0; i < outputSize; i += 1) newInput[wordStart + i] = written[i];
                hitRet.inputOffset += sizeDiff;
                newRet.inputOffset = saveRet.inputOffset;
                newRet.outputOffset = saveRet.outputOffset;
              }
            } else if (inputSize === outputSize) {
              for (let i = 0; i < inputSize; i += 1) newInput[wordStart + i] = written[i];
              newRet.inputOffset = saveRet.inputOffset;
              newRet.outputOffset = saveRet.outputOffset;
            } else {
              const sizeDiff = inputSize - outputSize;
              for (let i = 0; i < outputSize; i += 1)
                newInput[wordStart + sizeDiff + i] = written[i];
              newRet.inputOffset = saveRet.inputOffset + sizeDiff;
              newRet.outputOffset = saveRet.outputOffset;
            }
            if (entry.callHit !== undefined) {
              push(entry.hit !== undefined ? entry.hit : currentRuleNumber + 1);
              currentRuleNumber = entry.callHit;
            } else {
              currentRuleNumber = entry.hit as number;
            }
            saveRet = copyReturn(newRet);
            lastRuleWasHit = 1;
          } else {
            done = true;
            lastRuleWasHit = 0;
          }
        }
      } else {
        miss();
      }
      if (currentRuleNumber >= numRules || currentRuleNumber < 0) done = true;
    }

    if (doNotCopyNextWord) {
      doNotCopyNextWord = false;
    } else {
      // par_copy_word_to_output (:4911-4954).
      const ipos = newRet.inputPos + newRet.inputOffset;
      const opos = newRet.outputPos + newRet.outputOffset;
      let i = 0;
      while (!isWhite(at(newInput, ipos + i)) && at(newInput, ipos + i) !== 0) {
        output[opos + i] = at(newInput, ipos + i);
        i += 1;
      }
      newRet.inputOffset += i;
      newRet.outputOffset += i;
    }
  }
  return fromBytes(
    output.slice(0, newRet.outputPos + newRet.outputOffset).map((char) => char ?? 0),
  );
}
