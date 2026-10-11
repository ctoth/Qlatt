#!/usr/bin/env node

/**
 * rewrite-accessor-idioms.ts
 * ==========================
 * Rewrites verbose CEL guard idioms in a frontend's rule YAML onto the
 * accessors `get` and `isTrue` (src/declarative-frontend/cel-expressions.ts)
 * and the multi-argument `max` / `min`:
 *
 *   has(x.f) ? x.f : D                 ->  get(x, 'f', D)          (D a literal)
 *   has(x.f) && x.f == true            ->  isTrue(x, 'f')
 *   has(x.f) && x.f   (bare boolean)   ->  isTrue(x, 'f')
 *   has(x.f) ? x.f == true : false     ->  isTrue(x, 'f')
 *   has(x.f) ? x.f != true : true      ->  !isTrue(x, 'f')
 *   max([a, b]) / min([a, b])          ->  max(a, b) / min(a, b)   (inline list, 2-4 items)
 *
 * `get` returns D for a present null value where the longhand returns null, so
 * the `get` rewrite is only behaviour-preserving when D is null or the field
 * is never present-null; judge that with scripts/hash-frontend-outputs.ts.
 *
 * Sites inside a nested CEL string literal or a YAML single-quoted scalar
 * need a different quote style and are reported for hand editing.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/rewrite-accessor-idioms.ts <frontend-id>... [--write] [--only get|bool|minmax]
 *
 * Without --write it only prints each site and its replacement.
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

const PATH = String.raw`([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)`;
const LITERAL = String.raw`(null|true|false|-?\d+(?:\.\d+)?|'[^']*')(?![A-Za-z0-9_.])`;

type Rewrite = {
  kind: "get" | "bool" | "minmax";
  pattern: RegExp;
  replace: (m: RegExpMatchArray) => string | undefined;
};

const rewrites: Rewrite[] = [
  {
    kind: "get",
    pattern: new RegExp(String.raw`has\(${PATH}\) \? \1\.\2 : ${LITERAL}`, "g"),
    replace: (m) => `get(${m[1]}, '${m[2]}', ${m[3]})`,
  },
  {
    kind: "bool",
    pattern: new RegExp(String.raw`has\(${PATH}\) \? \1\.\2 != true : true(?![A-Za-z0-9_])`, "g"),
    replace: (m) => `!isTrue(${m[1]}, '${m[2]}')`,
  },
  {
    kind: "bool",
    pattern: new RegExp(String.raw`has\(${PATH}\) \? \1\.\2 == true : false(?![A-Za-z0-9_])`, "g"),
    replace: (m) => `isTrue(${m[1]}, '${m[2]}')`,
  },
  {
    kind: "bool",
    pattern: new RegExp(String.raw`has\(${PATH}\) && \1\.\2 == true(?![A-Za-z0-9_.])`, "g"),
    replace: (m) => `isTrue(${m[1]}, '${m[2]}')`,
  },
  {
    // A bare boolean test: not followed by an operator, member access or index.
    kind: "bool",
    pattern: new RegExp(
      String.raw`has\(${PATH}\) && \1\.\2(?![A-Za-z0-9_.\[])(?! *(==|!=|<=|>=|<|>|in\b|\?|\+|-|\*|/|%))`,
      "g",
    ),
    replace: (m) => `isTrue(${m[1]}, '${m[2]}')`,
  },
  {
    kind: "minmax",
    pattern: /\b(max|min)\(\[([^[\]]*)\]\)/g,
    replace: (m) => {
      const items = splitTopLevel(m[2]!);
      if (items.length < 2 || items.length > 4) return undefined;
      return `${m[1]}(${items.join(", ")})`;
    },
  },
];

/** Split on commas outside parentheses and string literals. */
function splitTopLevel(text: string): string[] {
  const items: string[] = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let at = 0; at < text.length; at++) {
    const ch = text[at]!;
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === "'" || ch === '"') quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      items.push(text.slice(start, at).trim());
      start = at + 1;
    }
  }
  items.push(text.slice(start).trim());
  return items;
}

/** Whether the site at `at` sits inside a CEL string literal opened earlier on the line. */
function insideStringLiteral(line: string, at: number): boolean {
  const before = line.slice(0, at).replace(/\\"/g, "");
  const singles = (before.match(/'/g) ?? []).length;
  return singles % 2 === 1;
}

/** Whether the line's value is a YAML single-quoted scalar (CEL quotes would be doubled). */
function inSingleQuotedScalar(line: string): boolean {
  return /^\s*(-\s+)?([\w.-]+:\s+)?'/.test(line);
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

const counts = { get: 0, bool: 0, minmax: 0 };
let manual = 0;

for (const frontendId of frontendIds) {
  for (const file of listYaml(path.join(frontendsDir, frontendId))) {
    const rel = path.relative(repoRoot, file).replace(/\\/g, "/");
    const lines = fs.readFileSync(file, "utf8").split("\n");
    let changed = false;
    lines.forEach((line, lineAt) => {
      let current = line;
      for (const rewrite of rewrites) {
        if (only && rewrite.kind !== only) continue;
        const edits: { from: number; to: number; text: string }[] = [];
        for (const match of current.matchAll(rewrite.pattern)) {
          const text = rewrite.replace(match);
          if (text === undefined) continue;
          const at = match.index ?? 0;
          const nested = insideStringLiteral(current, at) || inSingleQuotedScalar(current);
          if (nested && rewrite.kind !== "minmax") {
            manual++;
            console.log(`MANUAL ${rel}:${lineAt + 1}: ${match[0]}  =>  ${text}`);
            continue;
          }
          edits.push({ from: at, to: at + match[0].length, text });
          console.log(`${rewrite.kind.padEnd(6)} ${rel}:${lineAt + 1}: ${match[0]}  =>  ${text}`);
          counts[rewrite.kind]++;
        }
        for (const edit of edits.reverse()) {
          current = current.slice(0, edit.from) + edit.text + current.slice(edit.to);
        }
      }
      if (current !== line) {
        lines[lineAt] = current;
        changed = true;
      }
    });
    if (write && changed) fs.writeFileSync(file, lines.join("\n"));
  }
}

console.log(
  `\n${write ? "rewrote" : "would rewrite"}: get=${counts.get} bool=${counts.bool} minmax=${counts.minmax}; manual=${manual}`,
);
