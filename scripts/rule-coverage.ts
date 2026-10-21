#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RuleAttempt } from "../src/declarative-frontend/hrg/types";
import { parseRecognitionConfig } from "../src/declarative-frontend/recognition-config";
import {
  type CompiledRulepack,
  listBundledFrontendIds,
  loadBundledRulepackSpec,
} from "../src/declarative-frontend/rule-pack";
import type { DecisionRecord, RecognitionEvidence } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import { isPlainObject } from "../src/yaml-loader";

type RuleInventory = Pick<CompiledRulepack, "rules" | "phases">;
export type CoverageRow = {
  phase: string;
  rule: string;
  frame: boolean;
  firings: number;
  attempts: number | null;
  failures: Record<string, number> | null;
};
type RecognitionCounts = Map<string, Partial<Record<RecognitionEvidence["outcome"], number>>>;

const key = (phase: string, rule: string): string => JSON.stringify([phase, rule]);
const digest = (text: string): string => createHash("sha256").update(text).digest("hex");
const cell = (text: string): string => text.replaceAll("|", "\\|").replace(/[\r\n]/g, " ");

/** Rows name compiled rules; template-expanded effects are not separate rules. */
export function createCoverage(spec: RuleInventory): CoverageRow[] {
  const rows: CoverageRow[] = [];
  for (const rule of Object.keys(spec.rules).sort()) {
    const phases = spec.phases.filter((phase) => phase.rules.includes(rule));
    const definition = spec.rules[rule];
    const frame = isPlainObject(definition) && definition.kind === "frame";
    for (const phase of phases.length ? phases.map((entry) => entry.name) : ["(unscheduled)"]) {
      rows.push({
        phase,
        rule,
        frame,
        firings: 0,
        attempts: frame ? null : 0,
        failures: frame ? null : {},
      });
    }
  }
  return rows;
}

/** Count recorded outcomes; frame records are firing units, not frame attempts. */
export function addAttempts(rows: CoverageRow[], attempts: readonly RuleAttempt[]): void {
  const byRule = new Map(rows.map((row) => [key(row.phase, row.rule), row]));
  for (const attempt of attempts) {
    const row = byRule.get(key(attempt.phase, attempt.rule));
    if (!row) throw new Error(`Unknown recorded rule ${attempt.phase}/${attempt.rule}`);
    if (row.attempts !== null) row.attempts += 1;
    if (attempt.status === "fired") row.firings += 1;
    else if (row.failures) row.failures[attempt.status] = (row.failures[attempt.status] ?? 0) + 1;
    else throw new Error(`Unexpected frame failure record ${attempt.phase}/${attempt.rule}`);
  }
}

export function addRecognition(
  counts: RecognitionCounts,
  decisions: readonly DecisionRecord[],
): void {
  for (const decision of decisions) {
    if (decision.type !== "text_recognition" || !decision.recognition) continue;
    const { ruleId, outcome } = decision.recognition;
    const name = ruleId ?? "(unmatched)";
    const row = counts.get(name) ?? {};
    row[outcome] = (row[outcome] ?? 0) + 1;
    counts.set(name, row);
  }
}

export function mostCommonFailure(row: CoverageRow): string {
  if (row.failures === null) return "unavailable";
  const entries = Object.entries(row.failures).sort(
    ([a, countA], [b, countB]) => countB - countA || a.localeCompare(b),
  );
  return entries.length ? `${entries[0][0]} (${entries[0][1]})` : "none recorded";
}

export function renderCoverage(rows: CoverageRow[]): string[] {
  return [
    "| Phase | Rule | Fires / firing units | Recorded attempts | Most common failure |",
    "| --- | --- | ---: | ---: | --- |",
    ...rows.map(
      (row) =>
        `| ${cell(row.phase)} | ${cell(row.rule)} | ${row.firings}${row.frame ? " units" : ""} | ${row.attempts ?? "unavailable"} | ${mostCommonFailure(row)} |`,
    ),
    "",
    "### Zero recorded firings",
    "",
    ...rows.filter((row) => row.firings === 0).map((row) => `- ${row.phase}/${row.rule}`),
    ...(rows.every((row) => row.firings > 0) ? ["None."] : []),
  ];
}

/** Generate stdout only; a failed frontend/corpus does not produce a partial report. */
export function runRuleCoverage(argv: string[]): string {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!["--corpus", "--frontend", "--limit"].includes(name) || !value || value.startsWith("--")) {
      throw new Error("Usage: rule-coverage [--corpus file] [--frontend id] [--limit count]");
    }
    flags.set(name, value);
  }
  const corpusPath = flags.get("--corpus") ?? "test/phrase-sets/linguistic.json";
  const source = readFileSync(corpusPath, "utf8");
  const corpus: unknown = JSON.parse(source);
  if (
    !isPlainObject(corpus) ||
    !Array.isArray(corpus.phrases) ||
    corpus.phrases.length === 0 ||
    !corpus.phrases.every((phrase) => typeof phrase === "string")
  ) {
    throw new Error(`Expected a nonempty string phrases array in ${corpusPath}`);
  }
  const limit = flags.has("--limit") ? Number(flags.get("--limit")) : corpus.phrases.length;
  if (!Number.isInteger(limit) || limit <= 0) throw new Error("--limit must be a positive integer");
  const baseF0 = corpus.baseF0;
  if (
    baseF0 !== undefined &&
    (typeof baseF0 !== "number" || !Number.isFinite(baseF0) || baseF0 <= 0)
  ) {
    throw new Error(`Invalid baseF0 in ${corpusPath}`);
  }
  const phrases = (corpus.phrases as string[]).slice(0, limit);
  const selected = flags.get("--frontend");
  const frontendIds = selected ? [selected] : listBundledFrontendIds();
  const lines = [
    "# Recorded rule coverage",
    "",
    `Corpus: ${corpusPath}; SHA-256: ${digest(source)}; phrases: ${phrases.length}/${corpus.phrases.length}; base F0: ${baseF0 ?? "frontend default"}.`,
    "",
    "Regenerate with `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/rule-coverage.ts` (optional --corpus, --frontend, --limit).",
    "",
    "Counts are recorded RuleAttempt outcomes, including normalization and orthography. Frame rules record firing units only: one record per rule per unit that fired, not individual frames; their attempts and failure counts are unavailable. Zero firings means not observed in this corpus, not unreachable. Unscheduled means absent from the declared phase lists. No static linter conclusions are inferred.",
    "",
    "Recognition is reported separately from actual provenance outcomes. A disabled rule or a pattern with no match emits no candidate record; zeros are not a count of failed attempts.",
  ];
  for (const frontendId of frontendIds) {
    const spec = loadBundledRulepackSpec(frontendId);
    const rows = createCoverage(spec);
    const recognition: RecognitionCounts = new Map(
      (parseRecognitionConfig(spec)?.rules ?? []).map((rule) => [rule.id, {}]),
    );
    for (const phrase of phrases) {
      const detailed = textToKlattTrackDetailed(phrase, baseF0, 30, {
        frontendId,
        captureTooling: true,
      });
      addAttempts(rows, detailed.utterance.ruleAttempts());
      addRecognition(recognition, detailed.utterance.provenance.getDecisions());
    }
    lines.push(
      "",
      `## ${frontendId}`,
      "",
      `Compiled rulepack SHA-256: ${digest(JSON.stringify(spec))}.`,
      "",
      ...renderCoverage(rows),
      "",
      "### Recognition outcomes",
      "",
      "| Rule | Accepted | Ineligible | Overlap | Unmatched |",
      "| --- | ---: | ---: | ---: | ---: |",
      ...[...recognition]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
          ([rule, counts]) =>
            `| ${cell(rule)} | ${counts.accepted ?? 0} | ${counts.ineligible ?? 0} | ${counts.overlap ?? 0} | ${counts.unmatched ?? 0} |`,
        ),
    );
  }
  return `${lines.join("\n")}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(runRuleCoverage(process.argv.slice(2)));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
