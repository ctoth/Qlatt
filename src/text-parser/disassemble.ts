/**
 * A readable listing of a text parser table's compiled rules: one line per
 * element of a rule's body, named as DECtalk 4.63's CMD/par_bin.h names the
 * codes. The layout read here is the one the interpreter walks
 * (interpreter.ts, a port of CMD/par_pars1.c); a body the listing cannot
 * account for byte by byte is a body the interpreter does not know either.
 */

import type { TextParserRule, TextParserTable } from "./interpreter";

/** One element of a body: where it is, how many bytes are its own, what it is. */
export interface ListedElement {
  /** Offset in the entry's bytes. */
  offset: number;
  /** Bytes that are this element's own (a state's header, not its body). */
  length: number;
  /** Nesting: 0 in the rule's body, one more inside each state or set. */
  depth: number;
  text: string;
}

const CLASS_NAMES = [
  "END_OF_RULE",
  "ALPHANUMERIC",
  "ANY_ALPHABET",
  "ANY_CHARACTER",
  "CLAUSE",
  "CONSONANT",
  "LOWER",
  "NON_ALPHABET",
  "NUMBER",
  "PUNCT_SOME",
  "PUNCTUATION",
  "UPPER",
  "VOWEL",
  "VOWEL_NON_Y",
  "WHITESPACE",
  "DIGIT",
] as const;
const STATE_NAMES: Readonly<Record<number, string>> = {
  20: "COPY",
  21: "DELETE",
  22: "OPTIONAL",
  23: "SAVE",
  24: "MACRO",
  25: "REPLACE",
  26: "INSERT",
  27: "COMP_BREAK",
  28: "(0x1C, no action)",
  29: "DICTIONARY",
  30: "STATUS",
  31: "WORD",
};
const OPERATION_MASK = 0x1f;
const EXACT = 0x10;
const HEXADECIMAL = 0x11;
const RESTORE = 0x12;
const SETS = 0x13;
const SAVE = 0x17;
const MACRO = 0x18;
const REPLACE = 0x19;
const INSERT = 0x1a;
const DICTIONARY = 0x1d;
const STATUS = 0x1e;

const hex = (byte: number): string => `0x${byte.toString(16).padStart(2, "0")}`;
const printable = (bytes: readonly number[]): string =>
  bytes
    .map((byte) =>
      byte >= 0x20 && byte < 0x7f && byte !== 0x27 && byte !== 0x5c
        ? String.fromCharCode(byte)
        : `\\x${byte.toString(16).padStart(2, "0")}`,
    )
    .join("");

class Listing {
  readonly elements: ListedElement[] = [];
  constructor(
    private readonly bytes: readonly number[],
    private readonly table: TextParserTable,
  ) {}

  private at(index: number): number {
    const byte = this.bytes[index];
    if (byte === undefined)
      throw new Error(`E_TEXT_PARSER_LISTING: offset ${index} is past the entry`);
    return byte;
  }

  private add(offset: number, length: number, depth: number, text: string): void {
    this.elements.push({ offset, length, depth, text });
  }

  /** The counts of a class, a digit range or a set: `units` units from `p`. */
  private counts(p: number, large: boolean, units: number): { text: string; next: number } {
    const anyNumber = large ? 0x8000 : 0x80;
    const more = large ? 0x4000 : 0x40;
    const mask = large ? 0x3fff : 0x3f;
    const read = (index: number): number =>
      large ? this.at(index) | (this.at(index + 1) << 8) : this.at(index);
    const step = large ? 2 : 1;
    const parts: string[] = [];
    let used = 0;
    let next = p;
    while (used < units) {
      const first = read(next);
      next += step;
      used += 1;
      const min = first & mask;
      if (first & anyNumber) parts.push(`${min}-any`);
      else if (first & more && used < units) {
        const second = read(next);
        next += step;
        used += 1;
        parts.push(second & anyNumber ? `${min}-any` : `${min}-${second & mask}`);
      } else parts.push(`${min}`);
    }
    return { text: `<${parts.join(",")}>`, next };
  }

  /** A class of characters or a digit range, at `p`. */
  private classElement(p: number, depth: number, inSet: boolean): number {
    const head = this.at(p);
    const operation = head & OPERATION_MASK;
    const description = this.at(p + 1);
    const large = (description & 0x40) !== 0;
    let next = p + 2;
    const flags: string[] = [];
    if (description & 0x80) flags.push("not");
    if (head & 0x80) flags.push("no look-ahead to it");
    if (head & 0x40) flags.push("no look-ahead from it");
    // In a rule or a state the element names what follows it, for the
    // look-ahead that ends its match; in a set it does not.
    if (!inSet && !(head & 0x40)) {
      flags.push(`look ahead to ${this.at(next)}`);
      next += 1;
    }
    const counts = this.counts(next, large, description & 0x3f);
    const name = operation === 0x0f && head & 0x20 ? "DIGIT value in" : CLASS_NAMES[operation];
    this.add(
      p,
      counts.next - p,
      depth,
      `${name} ${counts.text}${flags.length > 0 ? ` (${flags.join("; ")})` : ""}`,
    );
    return counts.next;
  }

  /** The literal, saved-string and byte elements an action builds its text from. */
  private stringElements(from: number, to: number, depth: number): void {
    let p = from;
    while (p <= to) p = this.element(p, depth, true);
    if (p !== to + 1) throw new Error(`E_TEXT_PARSER_LISTING: a string runs past ${to}`);
  }

  /** The elements from `from` to `to`, both included. */
  private body(from: number, to: number, depth: number, inSet: boolean): void {
    let p = from;
    while (p <= to) p = this.element(p, depth, inSet);
    if (p !== to + 1) {
      throw new Error(`E_TEXT_PARSER_LISTING: the element before ${p} runs past its end ${to}`);
    }
  }

  /** One element at `p`; the offset after it and all it holds. */
  element(p: number, depth: number, inSet: boolean): number {
    const head = this.at(p);
    const operation = head & OPERATION_MASK;
    if (operation === 0)
      throw new Error(`E_TEXT_PARSER_LISTING: END_OF_RULE inside a body at ${p}`);
    if (operation <= 0x0f) return this.classElement(p, depth, inSet);
    if (operation === EXACT) {
      const count = this.at(p + 1);
      const text = printable(this.bytes.slice(p + 2, p + 2 + count));
      this.add(p, 2 + count, depth, `EXACT '${text}'${head & 0x20 ? " (any case)" : ""}`);
      return p + 2 + count;
    }
    if (operation === HEXADECIMAL) {
      this.add(p, 2, depth, `HEXADECIMAL ${hex(this.at(p + 1))}`);
      return p + 2;
    }
    if (operation === RESTORE) {
      this.add(p, 2, depth, `RESTORE $${this.at(p + 1)}`);
      return p + 2;
    }
    if (operation === SETS) {
      const sections = this.at(p + 1);
      const ends = Array.from({ length: sections }, (_, index) => this.at(p + 2 + index));
      const descriptionAt = p + 2 + sections;
      const description = this.at(descriptionAt);
      const counts = this.counts(descriptionAt + 1, (description & 0x40) !== 0, description & 0x3f);
      this.add(p, counts.next - p, depth, `SETS of ${sections} ${counts.text}`);
      let start = counts.next;
      ends.forEach((end, index) => {
        this.add(start, 0, depth + 1, `alternative ${index + 1}${end < start ? " (empty)" : ""}`);
        if (end >= start) this.body(start, end, depth + 2, true);
        start = Math.max(start, end + 1);
      });
      return start;
    }
    const name = STATE_NAMES[operation];
    if (operation === MACRO) {
      const entry = this.at(p + 1) | (this.at(p + 2) << 8);
      const target = this.table.rules[entry];
      this.add(p, 3, depth, `MACRO entry ${entry}${target?.number ? ` (R${target.number})` : ""}`);
      return p + 3;
    }
    if (operation === SAVE) {
      const end = this.at(p + 2);
      this.add(p, 3, depth, `SAVE as $${this.at(p + 1)}`);
      this.body(p + 3, end, depth + 1, false);
      return end + 1;
    }
    if (operation === REPLACE || operation === INSERT || operation === STATUS) {
      const endOfMatch = this.at(p + 1);
      const endOfAction = this.at(p + 2);
      let bodyAt = p + 3;
      let alternatives: number[] = [];
      const conditional = operation !== STATUS && (head & 0x80) !== 0;
      if (conditional) {
        const count = this.at(bodyAt);
        alternatives = Array.from({ length: count }, (_, index) => this.at(bodyAt + 1 + index));
        bodyAt += 1 + count;
      }
      const flags: string[] = [];
      if (operation === INSERT && head & 0x40) flags.push("after");
      else if (operation === INSERT && head & 0x20) flags.push("before");
      else if (operation === INSERT) flags.push("between the characters");
      if (conditional) flags.push(`one of ${alternatives.length + 1} by the number matched`);
      this.add(p, bodyAt - p, depth, `${name}${flags.length > 0 ? ` (${flags.join("; ")})` : ""}`);
      this.body(bodyAt, endOfMatch, depth + 1, false);
      this.add(endOfMatch + 1, 0, depth + 1, operation === STATUS ? "the status:" : "with:");
      this.stringElements(endOfMatch + 1, endOfAction, depth + 2);
      return endOfAction + 1;
    }
    if (operation === DICTIONARY) {
      const endOfMatch = this.at(p + 2);
      const endOfHit = this.at(p + 3);
      const endOfMiss = this.at(p + 4);
      const flags: string[] = [];
      if (head & 0x80) flags.push("a word found fails");
      if (head & 0x40) flags.push("a word not found fails");
      this.add(
        p,
        5,
        depth,
        `DICTIONARY list ${this.at(p + 1)}${flags.length > 0 ? ` (${flags.join("; ")})` : ""}`,
      );
      this.body(p + 5, endOfMatch, depth + 1, false);
      this.add(endOfMatch + 1, 0, depth + 1, "when found:");
      if (endOfHit > endOfMatch) this.body(endOfMatch + 1, endOfHit, depth + 2, false);
      const missAt = Math.max(endOfHit, endOfMatch) + 1;
      this.add(missAt, 0, depth + 1, "when not found:");
      if (endOfMiss >= missAt) this.body(missAt, endOfMiss, depth + 2, false);
      return Math.max(endOfMiss, endOfHit, endOfMatch) + 1;
    }
    if (name === undefined)
      throw new Error(`E_TEXT_PARSER_LISTING: no element ${hex(head)} at ${p}`);
    // COPY, DELETE, OPTIONAL, WORD and the two codes with no action here.
    const end = this.at(p + 1);
    this.add(p, 2, depth, name);
    this.body(p + 2, end, depth + 1, false);
    return end + 1;
  }
}

/**
 * The elements of a rule's body, in order. Throws when a byte cannot be
 * accounted for. A stop, return, goto or call entry has no body.
 */
export function listRule(table: TextParserTable, rule: TextParserRule): ListedElement[] {
  if (rule.kind !== "rule" || rule.body === undefined) return [];
  const bytes = (rule.bytes.match(/../g) ?? []).map((pair) => Number.parseInt(pair, 16));
  const listing = new Listing(bytes, table);
  let p = rule.body;
  // The body runs to its first END_OF_RULE (par_pars1.c par_match_rule).
  while (p < bytes.length && (bytes[p] & OPERATION_MASK) !== 0) p = listing.element(p, 0, false);
  if (p >= bytes.length) throw new Error("E_TEXT_PARSER_LISTING: the body has no END_OF_RULE");
  const padding = bytes.slice(p);
  if (padding.some((byte) => byte !== 0)) {
    throw new Error(`E_TEXT_PARSER_LISTING: bytes after END_OF_RULE at ${p} are not zero`);
  }
  listing.elements.push({ offset: p, length: padding.length, depth: 0, text: "END_OF_RULE" });
  return listing.elements;
}

/** The bytes of the body that no listed element owns; empty for a table the listing knows whole. */
export function unlistedBytes(rule: TextParserRule, elements: readonly ListedElement[]): number[] {
  if (rule.kind !== "rule" || rule.body === undefined) return [];
  const size = rule.bytes.length / 2;
  const owners = new Array<number>(size).fill(0);
  for (const element of elements) {
    for (let index = element.offset; index < element.offset + element.length; index += 1) {
      owners[index] += 1;
    }
  }
  const wrong: number[] = [];
  for (let index = rule.body; index < size; index += 1) {
    if (owners[index] !== 1) wrong.push(index);
  }
  return wrong;
}
