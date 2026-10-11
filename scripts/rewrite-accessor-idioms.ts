#!/usr/bin/env node

/**
 * rewrite-accessor-idioms.ts
 * ==========================
 * Rewrites verbose CEL guard idioms in a frontend's rule YAML onto the
 * accessors `get` and `isTrue` (src/declarative-frontend/cel-expressions.ts)
 * and the multi-argument `max` / `min`:
 *
 *   has(x.f) ? x.f : D                 ->  get(x, 'f', D)
 *   has(x.f) && x.f == true            ->  isTrue(x, 'f')
 *   has(x.f) && x.f   (bare boolean)   ->  isTrue(x, 'f')
 *   has(x.f) ? x.f == true : false     ->  isTrue(x, 'f')
 *   has(x.f) ? x.f != true : true      ->  !isTrue(x, 'f')
 *   max([a, b]) / min([a, b])          ->  max(a, b) / min(a, b)   (inline list of 2-4 items)
 *
 * Whole files are scanned, so a site may span lines. With --write, parentheses
 * that wrap a single `get` / `isTrue` call are dropped afterwards.
 *
 * What it does NOT rewrite (it reports these as LEFT or MANUAL, or does not see them):
 *  - `has(x.f) && x.f <op> ...` where the field continues in a comparison, a
 *    membership test or a member access: not a boolean test.
 *  - A `has(x.f) ? x.f : D` whose default D is not obviously safe (LEFT). `get`
 *    evaluates D eagerly, so D must be a literal, a `params.` path, or a `get`
 *    call; anything else (a field read such as `current.duration`, arithmetic
 *    on a field) could throw where the longhand would not.
 *  - A site inside a nested CEL string literal or a YAML single-quoted scalar
 *    (different quoting is needed): MANUAL.
 *  - `max(listVariable)` and one-item lists.
 *
 * `get` returns D for a present null value where the longhand returns null, so
 * the `get` rewrite is only behaviour-preserving for a field that is never
 * present-null (or when D is null); judge that per field and with
 * scripts/hash-frontend-outputs.ts.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/rewrite-accessor-idioms.ts <frontend-id>... [--write] [--only get|bool|minmax]
 *
 * Without --write it only prints each site and its replacement (one pass, so a
 * site nested inside another shows up only with --write).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontendsDir = path.join(repoRoot, "public", "rules", "frontends");

const args = process.argv.slice(2);
const write = args.includes("--write");
const onlyAt = args.indexOf("--only");
const only = onlyAt >= 0 ? args[onlyAt + 1] : undefined;
const frontendIds = args.filter((arg, at) => !arg.startsWith("--") && args[at - 1] !== "--only");
if (frontendIds.length === 0) {
  console.error(
    "usage: rewrite-accessor-idioms.ts <frontend-id>... [--write] [--only get|bool|minmax]",
  );
  process.exit(2);
}

type Kind = "get" | "bool" | "minmax";
const counts: Record<Kind, number> = { get: 0, bool: 0, minmax: 0 };
let manual = 0;
let left = 0;
const reported = new Set<string>();

const PATH = String.raw`([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)`;

/** Position of the bracket closing the one at `open`, skipping string literals. */
function closing(text: string, open: number): number {
  const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const stack: string[] = [];
  let quote = "";
  for (let at = open; at < text.length; at++) {
    const ch = text[at] as string;
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === "'") quote = ch;
    else if (pairs[ch]) stack.push(pairs[ch] as string);
    else if (ch === ")" || ch === "]" || ch === "}") {
      if (stack.pop() !== ch) return -1;
      if (stack.length === 0) return at;
    }
  }
  return -1;
}

/** Split on commas outside brackets and string literals. */
function splitTopLevel(text: string): string[] {
  const items: string[] = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let at = 0; at < text.length; at++) {
    const ch = text[at] as string;
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === "'") quote = ch;
    else if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      items.push(text.slice(start, at));
      start = at + 1;
    }
  }
  items.push(text.slice(start));
  return items;
}

function lineOf(text: string, at: number): number {
  return text.slice(0, at).split("\n").length;
}

function lineText(text: string, at: number): string {
  const from = text.lastIndexOf("\n", at - 1) + 1;
  const to = text.indexOf("\n", at);
  return text.slice(from, to < 0 ? text.length : to);
}

/** Whether the site sits inside a CEL string literal opened earlier on its line. */
function insideStringLiteral(text: string, at: number): boolean {
  const before = text.slice(text.lastIndexOf("\n", at - 1) + 1, at).replace(/\\"/g, "");
  return ((before.match(/'/g) ?? []).length & 1) === 1;
}

/** Whether the line's value is a YAML single-quoted scalar (CEL quotes would be doubled). */
function inSingleQuotedScalar(line: string): boolean {
  return /^\s*(-\s+)?([\w.-]+:\s+)?'/.test(line);
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

/** End of the default expression that starts at `from`: the first depth-0 closer, comma or YAML quote, or the end of the scalar. */
function defaultEnd(text: string, from: number): number {
  let depth = 0;
  let quote = "";
  for (let at = from; at < text.length; at++) {
    const ch = text[at] as string;
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === "'") quote = ch;
    else if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") {
      if (depth === 0) return at;
      depth--;
    } else if (depth === 0 && (ch === "," || ch === '"')) return at;
    else if (ch === "\n") {
      const next = text
        .slice(at + 1)
        .split("\n")
        .find((line) => line.trim() !== "");
      if (next === undefined || indentOf(next) < indentOf(lineText(text, at - 1))) return at;
    }
  }
  return text.length;
}

/** A default `get` may evaluate eagerly: a literal, a `params.` path or a `get` call. */
function safeDefault(expression: string): boolean {
  let text = expression.trim();
  while (text.startsWith("(") && closing(text, 0) === text.length - 1)
    text = text.slice(1, -1).trim();
  if (/^(null|true|false|-?\d+(\.\d+)?|'[^']*')$/.test(text)) return true;
  if (/^params(\.[A-Za-z_][A-Za-z0-9_]*)+$/.test(text)) return true;
  return text.startsWith("get(") && closing(text, 3) === text.length - 1;
}

type Edit = { from: number; to: number; text: string; kind: Kind; before: string; count: boolean };

function collectEdits(text: string, rel: string): Edit[] {
  const edits: Edit[] = [];
  const consider = (kind: Kind, from: number, to: number, replacement: string) => {
    if (only && only !== kind) return;
    const before = text.slice(from, to);
    if (insideStringLiteral(text, from) || inSingleQuotedScalar(lineText(text, from))) {
      manual++;
      console.log(
        `MANUAL ${rel}:${lineOf(text, from)}: ${before.replace(/\s+/g, " ")}  =>  ${replacement}`,
      );
      return;
    }
    edits.push({ from, to, text: replacement, kind, before, count: true });
  };

  // has(x.f) ? x.f : D
  for (const match of text.matchAll(new RegExp(String.raw`has\(${PATH}\) \? \1\.\2 :\s*`, "g"))) {
    const from = match.index as number;
    const start = from + match[0].length;
    const end = defaultEnd(text, start);
    const fallback = text.slice(start, end).replace(/\s+/g, " ").trim();
    if (!safeDefault(fallback)) {
      // A later pass sees the same site again; report it once.
      const report = `LEFT   ${rel}:${lineOf(text, from)}: default is not obviously safe: ${fallback}`;
      if (!reported.has(report)) {
        reported.add(report);
        left++;
        console.log(report);
      }
      continue;
    }
    const to = start + text.slice(start, end).trimEnd().length;
    consider("get", from, to, `get(${match[1]}, '${match[2]}', ${fallback})`);
  }

  const bools: [RegExp, (m: RegExpMatchArray) => string][] = [
    [
      new RegExp(String.raw`has\(${PATH}\) \? \1\.\2 != true : true(?![A-Za-z0-9_])`, "g"),
      (m) => `!isTrue(${m[1]}, '${m[2]}')`,
    ],
    [
      new RegExp(String.raw`has\(${PATH}\) \? \1\.\2 == true : false(?![A-Za-z0-9_])`, "g"),
      (m) => `isTrue(${m[1]}, '${m[2]}')`,
    ],
    [
      new RegExp(String.raw`has\(${PATH}\) && \1\.\2 == true(?![A-Za-z0-9_.])`, "g"),
      (m) => `isTrue(${m[1]}, '${m[2]}')`,
    ],
    [
      // A bare boolean test: not continued by an operator, member access or index.
      new RegExp(
        String.raw`has\(${PATH}\) && \1\.\2(?![A-Za-z0-9_.\[])(?! *(==|!=|<=|>=|<|>|in\b|\+|-|\*|/|%))`,
        "g",
      ),
      (m) => `isTrue(${m[1]}, '${m[2]}')`,
    ],
  ];
  for (const [pattern, replace] of bools) {
    for (const match of text.matchAll(pattern)) {
      const from = match.index as number;
      consider("bool", from, from + match[0].length, replace(match));
    }
  }

  // max([a, b]) / min([a, b]) with an inline list: drop the list's brackets.
  if (!only || only === "minmax") {
    for (const match of text.matchAll(/\b(max|min)\(\[/g)) {
      const open = (match.index as number) + match[0].length - 1;
      const close = closing(text, open);
      if (close < 0 || text[close + 1] !== ")") continue;
      const items = splitTopLevel(text.slice(open + 1, close));
      if (items.length < 2 || items.length > 4) continue;
      edits.push({
        from: open,
        to: open + 1,
        text: "",
        kind: "minmax",
        before: match[0],
        count: true,
      });
      edits.push({
        from: close,
        to: close + 1,
        text: "",
        kind: "minmax",
        before: "]",
        count: false,
      });
    }
  }
  return edits;
}

/** Drop parentheses that wrap exactly one `get` / `isTrue` call. */
function dropWrappingParens(text: string): string {
  const pattern = /(^|[^A-Za-z0-9_])\((!?(?:get|isTrue)\()/g;
  let result = text;
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    for (const match of [...result.matchAll(pattern)].reverse()) {
      const open = (match.index as number) + (match[1] as string).length;
      const close = closing(result, open);
      const callOpen = open + (match[2] as string).length;
      const callClose = closing(result, callOpen);
      if (close < 0 || callClose !== close - 1) continue;
      result = result.slice(0, open) + result.slice(open + 1, close) + result.slice(close + 1);
      changed = true;
      break;
    }
    if (!changed) break;
  }
  return result;
}

function listYaml(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listYaml(full));
    else if (/\.ya?ml$/.test(entry.name)) out.push(full);
  }
  return out.sort();
}

for (const frontendId of frontendIds) {
  for (const file of listYaml(path.join(frontendsDir, frontendId))) {
    const rel = path.relative(repoRoot, file).replace(/\\/g, "/");
    const original = fs.readFileSync(file, "utf8");
    let text = original;
    // A site nested in another (a has-ternary in another's default, a list in a
    // list) overlaps it and waits for the next pass.
    for (let pass = 0; pass < 5; pass++) {
      const edits = collectEdits(text, rel)
        .sort((a, b) => a.from - b.from)
        .filter((edit, at, all) => all.slice(0, at).every((other) => other.to <= edit.from));
      if (edits.length === 0) break;
      for (const edit of edits) {
        if (!edit.count) continue;
        const line = lineOf(text, edit.from);
        const shown =
          edit.kind === "minmax"
            ? `${edit.before}...])  =>  ${edit.before.slice(0, -1)}...)`
            : `${edit.before.replace(/\s+/g, " ")}  =>  ${edit.text}`;
        console.log(`${edit.kind.padEnd(6)} ${rel}:${line}: ${shown}`);
        counts[edit.kind]++;
      }
      if (!write) break;
      for (const edit of [...edits].reverse()) {
        text = text.slice(0, edit.from) + edit.text + text.slice(edit.to);
      }
    }
    if (write) text = dropWrappingParens(text);
    if (write && text !== original) fs.writeFileSync(file, text);
  }
}

console.log(
  `\n${write ? "rewrote" : "would rewrite"}: get=${counts.get} bool=${counts.bool} minmax=${counts.minmax}; manual=${manual}; left=${left}`,
);
