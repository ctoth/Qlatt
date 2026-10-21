#!/usr/bin/env node

/**
 * rewrite-accessor-idioms-dectalk.ts
 * ==================================
 * Rewrite the longhand accessor idioms in the CEL expressions of the
 * dectalk-english frontend onto functions the rule engine already has:
 *
 *   get      has(x.f) ? x.f : d            ->  get(x, 'f', d)
 *   isTrue   has(x.f) && x.f == true       ->  isTrue(x, 'f')
 *            has(x.f) && x.f               ->  isTrue(x, 'f')
 *   compare  has(x.f) && x.f == <literal>  ->  get(x, 'f', null) == <literal>
 *   minmax   max([a, b]) / min([a, b])     ->  max(a, b) / min(a, b)
 *
 * What is and is not the same:
 *   - get() gives the default for a feature that is present and null, where
 *     the ternary gave null; and it evaluates the default whether or not the
 *     feature is present. A site where either matters is named in
 *     EXCLUDED_SITES and stays as it is.
 *   - a comparison with a literal is rewritten because `null == <literal>` is
 *     false on this CEL surface, as an absent feature was. `!=` and a
 *     comparison with anything but a literal are left alone.
 *   - max/min take one to four arguments (CEL_FUNCTION_CATALOG), so a list of
 *     more than four elements stays a list.
 *
 * A field name is quoted as the strings around it are: with double quotes
 * inside a single-quoted condition string and in an expression that has only
 * double-quoted strings, with single quotes otherwise. Parentheses that held
 * nothing but a rewritten read or test are dropped with it.
 *
 * The expressions are found in the parsed YAML (every string value), where an
 * expression has a beginning and an end; the edits are then made in the file's
 * own text, so comments, quoting and line breaks stay as they are. The edited
 * text is parsed again and every value compared with what the rewrite of the
 * old value gives: nothing else may differ.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/rewrite-accessor-idioms-dectalk.ts [--write] [--only get,isTrue,compare,minmax]
 *
 * Without --write it is a dry run: each site and its replacement, the sites
 * left alone and why, and the counts. Exit code 1 if a file cannot be edited
 * consistently (nothing is written then).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseYamlString } from "../src/yaml-loader";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendDir = path.join(repoRoot, "public", "rules", "frontends", "dectalk-english");

type Kind = "get" | "isTrue" | "compare" | "minmax";
const KINDS: readonly Kind[] = ["get", "isTrue", "compare", "minmax"];

/**
 * Sites the corpus comparison showed are not the same after the rewrite, or
 * that cannot be shown to be. `match` is the site's text without whitespace.
 */
const EXCLUDED_SITES: readonly { file: string; match: string; reason: string }[] = [
  // A rule's decision records list what it read, in the order it first read
  // it. This default is a read of an Item that the rule has not made yet:
  // with get() it comes before the reads that follow it in the longhand.
  // Measured with scripts/hash-frontend-outputs.ts: the tracks were the same
  // and the parents of dectalk_silence_carries_formants' records were in
  // another order in 3020 of the corpus's texts.
  {
    file: "public/rules/frontends/dectalk-english/phases/formant.yaml",
    match: "has(prev.B1)?prev.B1:current.B1",
    reason: "the default is the rule's first read of current.B1: get() would make it earlier",
  },
];

type Site = { kind: Kind; start: number; end: number };
/** Replace value[start, end) with text; start === end is an insertion. */
type Edit = { start: number; end: number; text: string; site?: Site };
type Left = { start: number; end: number; reason: string };
/** `parens` are the opening parentheses an edit already removes. */
type Rewrite = { edits: Edit[]; sites: Site[]; left: Left[]; parens: Set<number> };
type YamlStyle = "plain" | "single" | "double";

const argv = process.argv.slice(2);
const write = argv.includes("--write");
const onlyAt = argv.indexOf("--only");
const only = new Set<Kind>(
  onlyAt >= 0 ? ((argv[onlyAt + 1] ?? "").split(",") as Kind[]) : [...KINDS],
);
for (const kind of only) {
  if (!KINDS.includes(kind)) throw new Error(`--only: unknown kind '${kind}'`);
}

const isWhitespace = (char: string | undefined): boolean =>
  char === " " || char === "\t" || char === "\n" || char === "\r";
const isIdentifierChar = (char: string | undefined): boolean =>
  char !== undefined && /[A-Za-z0-9_]/.test(char);
const stripWhitespace = (text: string): string => text.replace(/\s+/g, "");
const oneLine = (text: string): string => text.replace(/\s+/g, " ").trim();
const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The index just past the string literal that starts at `start`, or -1. */
function stringEnd(text: string, start: number): number {
  const quote = text[start];
  for (let index = start + 1; index < text.length; index += 1) {
    if (text[index] === "\\") index += 1;
    else if (text[index] === quote) return index + 1;
  }
  return -1;
}

/** The text with the inside of every string literal blanked. */
function maskStrings(text: string): string {
  let out = "";
  let index = 0;
  while (index < text.length) {
    const char = text[index] as string;
    if (char === "'" || char === '"') {
      const end = stringEnd(text, index);
      if (end < 0) return out + text.slice(index);
      out += char + "_".repeat(end - index - 2) + char;
      index = end;
    } else {
      out += char;
      index += 1;
    }
  }
  return out;
}

function previousSignificant(masked: string, index: number): string {
  let cursor = index - 1;
  while (cursor >= 0 && isWhitespace(masked[cursor])) cursor -= 1;
  if (cursor < 0) return "";
  const two = masked.slice(Math.max(0, cursor - 1), cursor + 1);
  return two === "&&" || two === "||" ? two : (masked[cursor] as string);
}

function nextSignificant(masked: string, index: number): string {
  let cursor = index;
  while (cursor < masked.length && isWhitespace(masked[cursor])) cursor += 1;
  const two = masked.slice(cursor, cursor + 2);
  return two === "&&" || two === "||" ? two : (masked[cursor] ?? "");
}

/** What may stand before an expression that is the whole of a ternary's condition. */
const BEFORE_CONDITION = new Set(["", "(", ",", "[", "{", "?", ":"]);
/** What may stand before an operand of `&&`. */
const BEFORE_CONJUNCT = new Set([...BEFORE_CONDITION, "&&", "||"]);
/** What may stand after a whole comparison or a whole boolean operand. */
const AFTER_OPERAND = new Set(["", ")", ",", "]", "}", "?", ":", "&&", "||"]);

/** The index of the bracket that closes the one at `open`, or -1. */
function closingBracket(masked: string, open: number): number {
  let depth = 0;
  for (let index = open; index < masked.length; index += 1) {
    const char = masked[index];
    if (char === "(" || char === "[" || char === "{") depth += 1;
    else if (char === ")" || char === "]" || char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

/** Where the else branch that starts at `start` ends: a ternary's else runs as far as it can. */
function elseEnd(masked: string, start: number): number {
  let depth = 0;
  let ternaries = 0;
  let index = start;
  for (; index < masked.length; index += 1) {
    const char = masked[index];
    if (char === "(" || char === "[" || char === "{") depth += 1;
    else if (char === ")" || char === "]" || char === "}") {
      if (depth === 0) break;
      depth -= 1;
    } else if (depth === 0) {
      if (char === ",") break;
      if (char === "?") ternaries += 1;
      if (char === ":") {
        if (ternaries === 0) break;
        ternaries -= 1;
      }
    }
  }
  while (index > start && isWhitespace(masked[index - 1])) index -= 1;
  return index;
}

/**
 * The quote for a field name written where `nested` is the quote of the
 * string literal the expression is inside (null for none), in a YAML scalar
 * of the given style; null when the name could only be written escaped.
 */
function nameQuote(style: YamlStyle, nested: string | null): string | null {
  if (nested === null) return style === "single" ? '"' : "'";
  if (nested === "'") return style === "double" ? null : '"';
  return style === "single" ? null : "'";
}

const HAS = /has\(\s*((?:[A-Za-z_]\w*\.)*[A-Za-z_]\w*)\.([A-Za-z_]\w*)\s*\)/y;
const MINMAX = /(max|min)\(\s*\[/y;
const LITERAL = /\s*==\s*(-?\d+(?:\.\d+)?|'[^'\\]*'|"[^"\\]*")/y;
const IS_TRUE = /\s*==\s*true\b/y;

function matchAt(pattern: RegExp, text: string, index: number): RegExpExecArray | null {
  pattern.lastIndex = index;
  return pattern.exec(text);
}

/** The edits for one expression. `offset` is where `text` starts in the value. */
function rewriteExpression(
  text: string,
  offset: number,
  style: YamlStyle,
  nested: string | null,
  out: Rewrite,
): void {
  const masked = maskStrings(text);
  // An expression that writes its strings with double quotes only keeps to them.
  const doubles =
    nested === null && style === "plain" && masked.includes('"') && !masked.includes("'");
  const quote = doubles ? '"' : nameQuote(style, nested);
  const leave = (start: number, end: number, reason: string): void => {
    out.left.push({ start: offset + start, end: offset + end, reason });
  };
  /**
   * A rewritten read or test is a call, so parentheses that held nothing but
   * the longhand go with it: `(has(x.f) ? x.f : 0) - d` is `get(x, 'f', 0) - d`.
   */
  const ungroup = (start: number, end: number, site: Site): void => {
    let open = start - 1;
    while (open >= 0 && isWhitespace(masked[open])) open -= 1;
    if (masked[open] !== "(" || out.parens.has(offset + open)) return;
    let before = open - 1;
    while (before >= 0 && isWhitespace(masked[before])) before -= 1;
    // The parenthesis of a call or of an index, not of a group.
    if (isIdentifierChar(masked[before]) || masked[before] === ")" || masked[before] === "]") {
      return;
    }
    let close = end;
    while (isWhitespace(masked[close])) close += 1;
    if (closingBracket(masked, open) !== close) return;
    out.edits.push({ start: offset + open, end: offset + open + 1, text: "", site });
    out.edits.push({ start: offset + close, end: offset + close + 1, text: "", site });
    out.parens.add(offset + open);
    site.start = offset + open;
    site.end = offset + close + 1;
  };
  let index = 0;
  while (index < text.length) {
    const char = masked[index] as string;
    if (char === "'" || char === '"') {
      const end = stringEnd(text, index);
      if (end < 0) return;
      const inside = text.slice(index + 1, end - 1);
      // A condition handed to a scan (look_ahead_where and its kin) is an
      // expression inside a string. One level; no escapes.
      if (nested === null && !inside.includes("\\")) {
        rewriteExpression(inside, offset + index + 1, style, char, out);
      }
      index = end;
      continue;
    }
    const startsWord = !isIdentifierChar(masked[index - 1]) && masked[index - 1] !== ".";
    const has = startsWord ? matchAt(HAS, masked, index) : null;
    if (has) {
      const [whole, object, field] = has as unknown as [string, string, string];
      const hasEnd = index + whole.length;
      const member = `${escapeRegExp(object)}\\.${escapeRegExp(field)}(?![\\w.(\\[])`;
      const before = previousSignificant(masked, index);
      const ternary = matchAt(new RegExp(`\\s*\\?\\s*${member}\\s*:`, "y"), masked, hasEnd);
      if (ternary) {
        const colonEnd = hasEnd + ternary[0].length;
        let start = colonEnd;
        while (isWhitespace(masked[start])) start += 1;
        const end = elseEnd(masked, start);
        if (!only.has("get")) {
          // not asked for
        } else if (quote === null) {
          leave(index, end, "the field name could only be written with an escaped quote");
        } else if (!BEFORE_CONDITION.has(before)) {
          leave(index, end, "has() is only part of the ternary's condition");
        } else if (end <= start) {
          leave(index, colonEnd, "no else branch found");
        } else {
          const site: Site = { kind: "get", start: offset + index, end: offset + end };
          out.edits.push({
            start: offset + index,
            end: offset + colonEnd,
            text: `get(${object}, ${quote}${field}${quote},`,
            site,
          });
          if (masked[start] === "(" && closingBracket(masked, start) === end - 1) {
            // An else branch in parentheses of its own: they become get's.
            out.edits.push({ start: offset + start, end: offset + start + 1, text: "", site });
            out.parens.add(offset + start);
          } else {
            out.edits.push({ start: offset + end, end: offset + end, text: ")", site });
          }
          ungroup(index, end, site);
          out.sites.push(site);
          index = colonEnd;
          continue;
        }
        index = hasEnd;
        continue;
      }
      const conjunct = matchAt(new RegExp(`\\s*&&\\s*${member}`, "y"), masked, hasEnd);
      if (conjunct) {
        const memberEnd = hasEnd + conjunct[0].length;
        const isTrue = matchAt(IS_TRUE, masked, memberEnd);
        const literal = matchAt(LITERAL, text, memberEnd);
        const bare = AFTER_OPERAND.has(nextSignificant(masked, memberEnd));
        const end = isTrue
          ? memberEnd + isTrue[0].length
          : literal
            ? memberEnd + literal[0].length
            : memberEnd;
        const kind: Kind = isTrue || bare ? "isTrue" : "compare";
        if (!isTrue && !literal && !bare) {
          leave(index, memberEnd, "continues with a comparison that is not with a literal");
        } else if (!only.has(kind)) {
          // not asked for
        } else if (quote === null) {
          leave(index, end, "the field name could only be written with an escaped quote");
        } else if (!BEFORE_CONJUNCT.has(before)) {
          leave(index, end, `follows '${before}', which binds tighter than &&`);
        } else if (kind === "compare" && !AFTER_OPERAND.has(nextSignificant(masked, end))) {
          leave(index, end, "the comparison's right side is more than a literal");
        } else {
          // A boolean test is replaced whole; of a comparison only the
          // guarded read, the operator and the literal staying as written.
          const site: Site = { kind, start: offset + index, end: offset + end };
          out.edits.push(
            kind === "isTrue"
              ? {
                  start: offset + index,
                  end: offset + end,
                  text: `isTrue(${object}, ${quote}${field}${quote})`,
                  site,
                }
              : {
                  start: offset + index,
                  end: offset + memberEnd,
                  text: `get(${object}, ${quote}${field}${quote}, null)`,
                  site,
                },
          );
          if (kind === "isTrue") ungroup(index, end, site);
          out.sites.push(site);
          index = end;
          continue;
        }
        index = hasEnd;
        continue;
      }
      const other = matchAt(/\s*\?/y, masked, hasEnd);
      if (other && only.has("get")) {
        leave(index, hasEnd + other[0].length, "the then branch is not the field itself");
      }
      index = hasEnd;
      continue;
    }
    const minmax = startsWord && only.has("minmax") ? matchAt(MINMAX, masked, index) : null;
    if (minmax) {
      const open = index + minmax[0].length - 1;
      const close = closingBracket(masked, open);
      const paren = close < 0 ? null : matchAt(/\s*\)/y, masked, close + 1);
      if (close < 0 || !paren) {
        // max([a, b] + c) and the like: the list is not the only argument.
        index = open + 1;
        continue;
      }
      const end = close + 1 + paren[0].length;
      let depth = 0;
      let count = 1;
      for (let cursor = open + 1; cursor < close; cursor += 1) {
        const inner = masked[cursor];
        if (inner === "(" || inner === "[" || inner === "{") depth += 1;
        else if (inner === ")" || inner === "]" || inner === "}") depth -= 1;
        else if (inner === "," && depth === 0) count += 1;
      }
      const last = masked.slice(open + 1, close).trimEnd();
      if (last.trim() === "" || last.endsWith(",") || count < 2 || count > 4) {
        leave(
          index,
          end,
          `a list of ${count.toString()} element(s): max/min take 2 to 4 arguments`,
        );
      } else {
        const site: Site = { kind: "minmax", start: offset + index, end: offset + end };
        out.edits.push({
          start: offset + index,
          end: offset + open + 1,
          text: `${minmax[1] as string}(`,
          site,
        });
        out.edits.push({ start: offset + close, end: offset + end, text: ")", site });
        out.sites.push(site);
      }
      index = open + 1;
      continue;
    }
    index += 1;
  }
}

function rewriteValue(value: string, style: YamlStyle): Rewrite {
  const out: Rewrite = { edits: [], sites: [], left: [], parens: new Set() };
  rewriteExpression(value, 0, style, null, out);
  return out;
}

/** Edits in the order they apply: by start, an insertion before a replacement there. */
function ordered(edits: readonly Edit[]): Edit[] {
  return [...edits].sort((a, b) => a.start - b.start || a.end - b.end);
}

function applyEdits(text: string, edits: readonly Edit[]): string {
  let out = "";
  let index = 0;
  for (const edit of ordered(edits)) {
    if (edit.start < index) throw new Error(`overlapping edits at ${edit.start.toString()}`);
    out += text.slice(index, edit.start) + edit.text;
    index = edit.end;
  }
  return out + text.slice(index);
}

/** Drop a site and the edits that are its own (not those of a site inside it). */
function withoutSite(rewrite: Rewrite, site: Site): void {
  rewrite.edits = rewrite.edits.filter((edit) => edit.site !== site);
  rewrite.sites = rewrite.sites.filter((other) => other !== site);
}

type Leaf = { path: string; value: string };

/**
 * The string values in the order they are written. A node an alias names
 * again (`define: *baseline_clause`) is written once, so it is read once.
 */
function leaves(node: unknown, at: string, out: Leaf[], seen = new Set<object>()): void {
  if (typeof node === "string") out.push({ path: at, value: node });
  else if (node !== null && typeof node === "object") {
    if (seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.forEach((entry, index) => {
        leaves(entry, `${at}[${index.toString()}]`, out, seen);
      });
    } else {
      for (const [key, entry] of Object.entries(node)) leaves(entry, `${at}.${key}`, out, seen);
    }
  }
}

/** Every value that is not a string, and every key: these may not change at all. */
function skeleton(node: unknown): unknown {
  if (typeof node === "string") return "";
  if (Array.isArray(node)) return node.map(skeleton);
  if (node !== null && typeof node === "object") {
    return Object.fromEntries(Object.entries(node).map(([key, entry]) => [key, skeleton(entry)]));
  }
  return node;
}

function yamlFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? yamlFiles(path.join(dir, entry.name))
        : entry.name.endsWith(".yaml")
          ? [path.join(dir, entry.name)]
          : [],
    )
    .sort();
}

const counts: Record<Kind, number> = { get: 0, isTrue: 0, compare: 0, minmax: 0 };
let leftCount = 0;
let failed = false;
// Written only when every file is consistent.
const pending: { file: string; edited: string }[] = [];

for (const file of yamlFiles(frontendDir)) {
  const relative = path.relative(repoRoot, file).replace(/\\/g, "/");
  const source = fs.readFileSync(file, "utf8");
  const document = parseYamlString(source, file);
  const before: Leaf[] = [];
  leaves(document, "", before);

  // The file without whitespace, and where each of its characters is.
  const sourceAt: number[] = [];
  let compact = "";
  for (let index = 0; index < source.length; index += 1) {
    if (!isWhitespace(source[index])) {
      sourceAt.push(index);
      compact += source[index] as string;
    }
  }
  const lineOf = (offset: number): number => source.slice(0, offset).split("\n").length;

  const sourceEdits: Edit[] = [];
  const expected = new Map<string, string>();
  const fileCounts: Record<Kind, number> = { get: 0, isTrue: 0, compare: 0, minmax: 0 };
  let cursor = 0;
  for (const leaf of before) {
    const probe = rewriteValue(leaf.value, "plain");
    if (probe.edits.length === 0 && probe.left.length === 0) continue;

    // Where the value is in the file: its characters, whitespace apart.
    const valueAt: number[] = [];
    for (let index = 0; index < leaf.value.length; index += 1) {
      if (!isWhitespace(leaf.value[index])) valueAt.push(index);
    }
    const found = compact.indexOf(stripWhitespace(leaf.value), cursor);
    if (found < 0) {
      console.log(
        `${relative}: ${leaf.path}: cannot find the value's text in the file (an escaped quote, or a value used twice through an alias); not edited`,
      );
      failed = failed || probe.edits.length > 0;
      continue;
    }
    cursor = found + valueAt.length;
    // Value index -> file offset, for a character that is not whitespace.
    const compactIndex = new Map(valueAt.map((valueIndex, order) => [valueIndex, order]));
    const offsetOf = (valueIndex: number): number =>
      sourceAt[found + (compactIndex.get(valueIndex) as number)] as number;
    const opener = source[(sourceAt[found] as number) - 1];
    const style: YamlStyle = opener === '"' ? "double" : opener === "'" ? "single" : "plain";
    const rewrite = style === "plain" ? probe : rewriteValue(leaf.value, style);

    for (const site of [...rewrite.sites]) {
      const text = stripWhitespace(leaf.value.slice(site.start, site.end));
      const excluded = EXCLUDED_SITES.find(
        (entry) => entry.file === relative && entry.match === text,
      );
      if (!excluded) continue;
      withoutSite(rewrite, site);
      rewrite.left.push({ start: site.start, end: site.end, reason: excluded.reason });
    }

    for (const left of rewrite.left.sort((a, b) => a.start - b.start)) {
      leftCount += 1;
      console.log(
        `${relative}:${lineOf(offsetOf(left.start)).toString()}  LEFT  ${oneLine(leaf.value.slice(left.start, left.end))}\n    (${left.reason})`,
      );
    }
    if (rewrite.edits.length === 0) continue;

    const outer = rewrite.sites.filter(
      (site) =>
        !rewrite.sites.some(
          (other) => other !== site && other.start <= site.start && other.end >= site.end,
        ),
    );
    for (const site of outer) {
      const inside = rewrite.edits
        .filter((edit) => edit.start >= site.start && edit.end <= site.end)
        .map((edit) => ({ ...edit, start: edit.start - site.start, end: edit.end - site.start }));
      const old = leaf.value.slice(site.start, site.end);
      const kinds = rewrite.sites
        .filter((other) => other.start >= site.start && other.end <= site.end)
        .map((other) => other.kind);
      console.log(
        `${relative}:${lineOf(offsetOf(site.start)).toString()}  ${kinds.join("+")}\n    - ${oneLine(old)}\n    + ${oneLine(applyEdits(old, inside))}`,
      );
    }
    for (const site of rewrite.sites) fileCounts[site.kind] += 1;

    expected.set(leaf.path, applyEdits(leaf.value, rewrite.edits));
    for (const edit of rewrite.edits) {
      // An edit starts on a character and ends after one; an insertion
      // stands after the character before it.
      const end = offsetOf(edit.end - 1) + 1;
      sourceEdits.push({
        start: edit.start === edit.end ? end : offsetOf(edit.start),
        end,
        text: edit.text,
      });
    }
  }
  if (sourceEdits.length === 0) continue;

  const edited = applyEdits(source, sourceEdits);
  // Nothing but the rewritten expressions may differ, and each must be what
  // the rewrite of the old value is (line breaks apart).
  const after: Leaf[] = [];
  const reloaded = parseYamlString(edited, file);
  leaves(reloaded, "", after);
  const problems: string[] = [];
  if (JSON.stringify(skeleton(reloaded)) !== JSON.stringify(skeleton(document))) {
    problems.push("the document's keys or non-string values changed");
  }
  if (after.length !== before.length) problems.push("the number of string values changed");
  before.forEach((leaf, index) => {
    const now = after[index];
    if (!now || now.path !== leaf.path) return;
    const want = expected.get(leaf.path);
    if (
      want === undefined
        ? now.value !== leaf.value
        : stripWhitespace(now.value) !== stripWhitespace(want)
    ) {
      problems.push(`${leaf.path} is not the rewrite of what it was`);
    }
  });
  if (problems.length > 0) {
    failed = true;
    for (const problem of problems) console.log(`${relative}: NOT CONSISTENT: ${problem}`);
    continue;
  }
  for (const kind of KINDS) counts[kind] += fileCounts[kind];
  console.log(`${relative}: ${JSON.stringify(fileCounts)}`);
  pending.push({ file, edited });
}

console.log(
  JSON.stringify({ mode: write ? "write" : "dry-run", rewritten: counts, left: leftCount, failed }),
);
if (failed) process.exitCode = 1;
else if (write) for (const { file, edited } of pending) fs.writeFileSync(file, edited);
