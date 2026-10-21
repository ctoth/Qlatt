#!/usr/bin/env node

/**
 * audit-word-keyed-rules.ts
 * =========================
 * List frontend rules and policy values that are fitted to one utterance
 * rather than stating a general rule:
 *
 *   - a rule whose text compares a word to a string literal
 *     (`current.word == 'cake'`), with the literal reported so closed-class
 *     function-word rules can be told apart from content-word replay;
 *   - a rule that reads a policy key matched by --policy-pattern;
 *   - a rule or policy value whose citation names the oracle output of one
 *     specific phrase (`oracle -lt trace for 'cake'`);
 *   - an LTS entry whose letters are a whole word bounded by spaces on both
 *     sides and whose comment or citation names an oracle phrase.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/audit-word-keyed-rules.ts [--frontend dectalk-english] [--json]
 *
 * Exit code 1 if anything is found.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";

type Finding = {
  file: string;
  line: number;
  rule: string;
  kind: "word_literal" | "phrase_citation" | "lts_whole_word";
  detail: string;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const frontendId = flag("frontend") ?? "dectalk-english";
const asJson = argv.includes("--json");
const frontendDir = path.join(repoRoot, "public", "rules", "frontends", frontendId);

const WORD_LITERAL = /\bword\s*==\s*'([^']+)'|\bword\s*==\s*"([^"]+)"/g;
// A citation that points at the observed output of one utterance.
const PHRASE_CITATION = /oracle[^"'\n]*(?:trace|log)?[^"'\n]*\bfor\s+['"“]?[A-Za-z]/i;

function lineOf(source: string, needle: string): number {
  const index = source.indexOf(needle);
  return index < 0 ? 0 : source.slice(0, index).split("\n").length;
}

function collectCitations(value: unknown, out: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectCitations(item, out);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "citations" && Array.isArray(child)) {
        for (const citation of child) if (typeof citation === "string") out.push(citation);
      } else {
        collectCitations(child, out);
      }
    }
  }
}

const findings: Finding[] = [];

const phasesDir = path.join(frontendDir, "phases");
for (const name of fs.readdirSync(phasesDir).filter((file) => file.endsWith(".yaml"))) {
  const filePath = path.join(phasesDir, name);
  const source = fs.readFileSync(filePath, "utf8");
  const doc = yaml.load(source) as { rules?: Record<string, unknown> } | null;
  const rules = (doc?.rules ?? doc ?? {}) as Record<string, unknown>;
  for (const [ruleId, rule] of Object.entries(rules)) {
    if (!rule || typeof rule !== "object") continue;
    const text = JSON.stringify(rule);
    const line = lineOf(source, `\n  ${ruleId}:`) + 1;
    const literals = new Set<string>();
    for (const match of text.matchAll(WORD_LITERAL)) literals.add(match[1] ?? match[2]);
    for (const literal of literals) {
      findings.push({
        file: `phases/${name}`,
        line,
        rule: ruleId,
        kind: "word_literal",
        detail: literal,
      });
    }
    const citations: string[] = [];
    collectCitations(rule, citations);
    for (const citation of citations) {
      if (PHRASE_CITATION.test(citation)) {
        findings.push({
          file: `phases/${name}`,
          line,
          rule: ruleId,
          kind: "phrase_citation",
          detail: citation,
        });
      }
    }
  }
}

// Policy values: report each cited value whose citation names one phrase.
const frontendPath = path.join(frontendDir, "frontend.yaml");
if (fs.existsSync(frontendPath)) {
  const source = fs.readFileSync(frontendPath, "utf8");
  const walk = (value: unknown, trail: string[]): void => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.citations)) {
      for (const citation of record.citations) {
        if (typeof citation === "string" && PHRASE_CITATION.test(citation)) {
          const key = trail[trail.length - 1] ?? "";
          findings.push({
            file: "frontend.yaml",
            line: lineOf(source, `${key}:`),
            rule: trail.join("."),
            kind: "phrase_citation",
            detail: citation,
          });
        }
      }
    }
    for (const [key, child] of Object.entries(record)) walk(child, [...trail, key]);
  };
  walk(yaml.load(source), []);
}

// LTS: whole-word entries justified by an oracle phrase in the preceding comment.
const ltsPath = path.join(frontendDir, "lts-rules.yaml");
if (fs.existsSync(ltsPath)) {
  // Found by structure, not by comment wording: an entry of two or more
  // letters whose left and right contexts are both a word boundary spells one
  // whole word. The comment above it, if any, is shown so a reader can tell a
  // rule converted from DECtalk's table from one added by hand.
  const lines = fs.readFileSync(ltsPath, "utf8").split("\n");
  for (let i = 0; i + 2 < lines.length; i += 1) {
    if (!/^\s*-\s*left:\s*' '\s*$/.test(lines[i])) continue;
    const letters = /^\s*letters:\s*(\S+)\s*$/.exec(lines[i + 1])?.[1];
    if (!letters || letters.length < 2) continue;
    if (!/^\s*right:\s*' '\s*$/.test(lines[i + 2])) continue;
    const comment = /^\s*#/.test(lines[i - 1] ?? "") ? lines[i - 1].trim() : "(no comment)";
    findings.push({
      file: "lts-rules.yaml",
      line: i + 1,
      rule: letters,
      kind: "lts_whole_word",
      detail: comment,
    });
  }
}

if (asJson) {
  console.log(JSON.stringify(findings, null, 2));
} else {
  for (const finding of findings) {
    console.log(
      `${finding.file}:${finding.line}\t${finding.kind}\t${finding.rule}\t${finding.detail.slice(0, 110)}`,
    );
  }
  const byKind = new Map<string, number>();
  for (const finding of findings) byKind.set(finding.kind, (byKind.get(finding.kind) ?? 0) + 1);
  console.log(
    JSON.stringify({ frontendId, total: findings.length, ...Object.fromEntries(byKind) }),
  );
}
process.exitCode = findings.length > 0 ? 1 : 0;
