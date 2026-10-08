#!/usr/bin/env node

/**
 * normalization-rules-fired.ts
 * ============================
 * Which text rules still do something for a frontend: over every text of the
 * text parser fixtures (scripts/oracle/text-parser-port.ts recordedClauses),
 * the recognition rules that accepted a span and the normalization rules that
 * made an item, each with the number of texts it fired in and a few of them.
 * For a frontend with a text parser the texts reach these rules after the
 * parser has rewritten them, so a rule that never fires here has been made
 * idle by the parser, or the texts do not reach it.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/normalization-rules-fired.ts [--frontend dectalk-english]
 *       [--examples 3] [--out report.json]
 *
 * A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { createProvenanceCollector } from "../../src/provenance.ts";
import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";
import { recordedClauses } from "./text-parser-port.ts";

const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const frontendId = flag("frontend") ?? "dectalk-english";
const examples = Number(flag("examples") ?? 3);
const outFlag = flag("out");

interface Count {
  texts: number;
  examples: string[];
}
const recognition = new Map<string, Count>();
const normalization = new Map<string, Count>();
const parser = new Map<string, Count>();
const errors: { text: string; error: string }[] = [];
const note = (counts: Map<string, Count>, rules: Iterable<string>, text: string): void => {
  for (const rule of new Set(rules)) {
    const count = counts.get(rule) ?? { texts: 0, examples: [] };
    count.texts += 1;
    if (count.examples.length < examples) count.examples.push(text);
    counts.set(rule, count);
  }
};

const texts = Object.entries(recordedClauses())
  .filter(([, clauses]) => clauses !== null)
  .map(([text]) => text);
for (const text of texts) {
  const provenance = createProvenanceCollector();
  try {
    textToKlattTrackDetailed(text, undefined, 30, { frontendId, provenance });
  } catch (error) {
    errors.push({ text, error: error instanceof Error ? error.message : String(error) });
    continue;
  }
  const decisions = provenance.getDecisions();
  note(
    recognition,
    decisions.flatMap((decision) =>
      decision.recognition?.outcome === "accepted" && decision.recognition.ruleId
        ? [decision.recognition.ruleId]
        : [],
    ),
    text,
  );
  // A normalization rule's items are named item:<parent>:<rule>:<index>.
  note(
    normalization,
    decisions.flatMap((decision) => {
      if (decision.stage !== "rules" || decision.type !== "item_create") return [];
      const parts = decision.subject.split(":");
      const rule = parts.at(-2);
      return decision.subject.startsWith("item:normalization_") && rule ? [rule] : [];
    }),
    text,
  );
  note(
    parser,
    decisions.flatMap((decision) =>
      decision.type === "text_parser_rewrite" ? [decision.subject] : [],
    ),
    text,
  );
}

const table = (counts: Map<string, Count>): Record<string, Count> =>
  Object.fromEntries([...counts].sort((left, right) => right[1].texts - left[1].texts));
const report = {
  frontend: frontendId,
  texts: texts.length,
  errors,
  parserRules: table(parser),
  recognitionRules: table(recognition),
  normalizationRules: table(normalization),
};
if (outFlag) {
  fs.mkdirSync(path.dirname(path.resolve(outFlag)), { recursive: true });
  fs.writeFileSync(path.resolve(outFlag), `${JSON.stringify(report, null, 1)}\n`);
}
const brief = (counts: Record<string, Count>): string =>
  Object.entries(counts)
    .map(([rule, count]) => `${rule} ${count.texts}`)
    .join(", ");
console.log(`texts: ${texts.length}, errors: ${errors.length}`);
console.log(`parser rules that rewrote: ${brief(report.parserRules)}`);
console.log(`recognition rules that accepted: ${brief(report.recognitionRules)}`);
console.log(`normalization rules that made items: ${brief(report.normalizationRules)}`);
