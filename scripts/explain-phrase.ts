#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrack } from "../src/tts-frontend";
import {
  applyRange,
  createProvenanceCollector,
  parseRangeSpec,
  type DecisionRecord,
  type ProvenanceStage,
} from "../src/provenance";

type ExplainFormat = "text" | "json";

type ParsedArgs = {
  phrase: string;
  format: ExplainFormat;
  strictCitations: boolean;
  stages: Set<ProvenanceStage> | null;
  subjectFilter: string | null;
  rangeRaw: string | null;
  outPath: string | null;
  baseF0: number;
  transitionMs: number;
  verbose: boolean;
  whyDecisionId: string | null;
};

type ExplainSummary = {
  decisionCount: number;
  uncitedCount: number;
  byStage: Record<string, number>;
  byType: Record<string, number>;
  uncitedByStage: Record<string, number>;
  uncitedByType: Record<string, number>;
};

type ExplainPayload = {
  phrase: string;
  whyDecisionId: string | null;
  totalDecisionCount: number;
  rangeApplied: string | null;
  rangeMatchedCount: number;
  subjectFilterApplied: string | null;
  decisions: DecisionRecord[];
  summary: ExplainSummary;
};

type CliIo = {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
};

const COMPACT_PRIORITY_TYPES = new Set([
  "fallback_pronunciation_selected",
  "rule_rewrite_applied",
  "semantics_rule_error_fallback",
  "schedule_mode_selected",
  "binding_resolved",
]);

function defaultIo(): CliIo {
  return {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  };
}

function parseArgv(argv: string[]): ParsedArgs {
  const flags = new Map<string, string>();
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next != null && !next.startsWith("--")) {
      flags.set(key, next);
      i += 1;
      continue;
    }
    flags.set(key, "true");
  }

  const phrase = flags.get("phrase") ?? positional.join(" ").trim();
  if (!phrase) {
    throw new Error("Missing phrase. Use --phrase \"...\".");
  }

  const format = (flags.get("format") ?? "text").toLowerCase();
  if (format !== "text" && format !== "json") {
    throw new Error(`Unsupported format '${format}'. Use text or json.`);
  }

  const baseF0Raw = flags.get("base-f0") ?? "110";
  const baseF0 = Number(baseF0Raw);
  if (!Number.isFinite(baseF0) || baseF0 <= 0) {
    throw new Error(`Invalid --base-f0 '${baseF0Raw}'`);
  }

  const transitionMsRaw = flags.get("transition-ms") ?? "30";
  const transitionMs = Number(transitionMsRaw);
  if (!Number.isFinite(transitionMs) || transitionMs < 0) {
    throw new Error(`Invalid --transition-ms '${transitionMsRaw}'`);
  }

  const stageRaw = flags.get("stage");
  const stages = stageRaw
    ? new Set(
        stageRaw
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean) as ProvenanceStage[]
      )
    : null;

  return {
    phrase,
    format,
    strictCitations: flags.get("strict-citations") === "true",
    stages,
    subjectFilter: flags.get("subject") ?? null,
    rangeRaw: flags.get("range") ?? null,
    outPath: flags.get("out") ? path.resolve(flags.get("out") as string) : null,
    baseF0,
    transitionMs,
    verbose: flags.get("verbose") === "true",
    whyDecisionId: flags.get("why") ?? null,
  };
}

function countBy<T extends string>(values: T[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function buildSummary(decisions: DecisionRecord[]): ExplainSummary {
  const uncited = decisions.filter((decision) => decision.citations.length === 0);
  return {
    decisionCount: decisions.length,
    uncitedCount: uncited.length,
    byStage: countBy(decisions.map((decision) => decision.stage)),
    byType: countBy(decisions.map((decision) => decision.type)),
    uncitedByStage: countBy(uncited.map((decision) => decision.stage)),
    uncitedByType: countBy(uncited.map((decision) => decision.type)),
  };
}

function isSubjectMatch(subject: string, filter: string): boolean {
  const normalized = filter.trim();
  if (normalized.length === 0) return true;
  if (normalized.endsWith("*")) {
    const prefix = normalized.slice(0, normalized.length - 1);
    return subject.startsWith(prefix);
  }
  return subject === normalized;
}

function buildWhyChain(allDecisions: DecisionRecord[], whyId: string): DecisionRecord[] {
  const byId = new Map(allDecisions.map((decision) => [decision.id, decision]));
  const target = byId.get(whyId);
  if (!target) {
    throw new Error(`Unknown decision id '${whyId}'`);
  }

  const ordered: DecisionRecord[] = [];
  const visited = new Set<string>();

  function visit(id: string): void {
    if (visited.has(id)) return;
    visited.add(id);
    const decision = byId.get(id);
    if (!decision) return;
    for (const parentId of decision.parents ?? []) {
      visit(parentId);
    }
    ordered.push(decision);
  }

  visit(whyId);
  return ordered.sort((a, b) => a.seq - b.seq);
}

function formatBreakdown(counts: Record<string, number>): string {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries.map(([name, count]) => `${name}=${count}`).join(", ");
}

function selectCompactDecisions(decisions: DecisionRecord[]): { displayed: DecisionRecord[]; truncated: number } {
  const prioritized = decisions.filter((decision) => COMPACT_PRIORITY_TYPES.has(decision.type));
  const base = prioritized.length > 0 ? prioritized : decisions.slice(0, 20);
  const limit = 40;
  const displayed = base.slice(0, limit);
  return {
    displayed,
    truncated: Math.max(0, base.length - displayed.length),
  };
}

function renderText(payload: ExplainPayload, verbose: boolean): string {
  const lines: string[] = [];
  const compact = verbose ? { displayed: payload.decisions, truncated: 0 } : selectCompactDecisions(payload.decisions);

  for (const decision of compact.displayed) {
    const citations = decision.citations.length > 0
      ? decision.citations.join("; ")
      : "<none>";
    lines.push(
      `#${decision.seq} [${decision.stage}] [${decision.type}] ${decision.subject} ${decision.reason} | citations: ${citations}`
    );
  }

  if (!verbose && compact.truncated > 0) {
    lines.push(`... truncated ${compact.truncated} additional compact decisions (use --verbose)`);
  }

  lines.push("");
  lines.push(
    `summary decisions=${payload.summary.decisionCount} uncited=${payload.summary.uncitedCount} total=${payload.totalDecisionCount}`
  );
  if (payload.rangeApplied) {
    lines.push(`range ${payload.rangeApplied} matched=${payload.rangeMatchedCount}`);
  }
  if (payload.subjectFilterApplied) {
    lines.push(`subject ${payload.subjectFilterApplied}`);
  }
  if (payload.whyDecisionId) {
    lines.push(`why ${payload.whyDecisionId}`);
  }
  if (payload.summary.uncitedCount > 0) {
    lines.push(`uncited-by-stage ${formatBreakdown(payload.summary.uncitedByStage)}`);
    lines.push(`uncited-by-type ${formatBreakdown(payload.summary.uncitedByType)}`);
  }
  return lines.join("\n");
}

function buildPayload(
  decisions: DecisionRecord[],
  phrase: string,
  rangeApplied: string | null,
  subjectFilterApplied: string | null,
  totalDecisionCount: number,
  whyDecisionId: string | null,
): ExplainPayload {
  return {
    phrase,
    whyDecisionId,
    totalDecisionCount,
    rangeApplied,
    rangeMatchedCount: decisions.length,
    subjectFilterApplied,
    decisions,
    summary: buildSummary(decisions),
  };
}

export async function runExplainCli(argv: string[], io: CliIo = defaultIo()): Promise<number> {
  try {
    const args = parseArgv(argv);

    const provenance = createProvenanceCollector();
    textToKlattTrack(args.phrase, args.baseF0, args.transitionMs, { provenance });

    const allDecisions = provenance.getDecisions();
    let decisions = allDecisions;
    let appliedRange: string | null = null;
    let subjectApplied: string | null = null;

    if (args.whyDecisionId) {
      decisions = buildWhyChain(allDecisions, args.whyDecisionId);
    } else {
      if (args.stages && args.stages.size > 0) {
        decisions = decisions.filter((decision) => args.stages?.has(decision.stage));
      }

      if (args.subjectFilter) {
        decisions = decisions.filter((decision) => isSubjectMatch(decision.subject, args.subjectFilter as string));
        subjectApplied = args.subjectFilter;
      }

      if (args.rangeRaw) {
        const range = parseRangeSpec(args.rangeRaw);
        decisions = applyRange(decisions, range);
        appliedRange = args.rangeRaw;
      }
    }

    const payload = buildPayload(
      decisions,
      args.phrase,
      appliedRange,
      subjectApplied,
      allDecisions.length,
      args.whyDecisionId
    );

    const rendered = args.format === "json"
      ? JSON.stringify(payload, null, 2)
      : renderText(payload, args.verbose);

    if (args.outPath) {
      fs.mkdirSync(path.dirname(args.outPath), { recursive: true });
      fs.writeFileSync(args.outPath, `${rendered}\n`, "utf8");
    } else {
      io.stdout(`${rendered}\n`);
    }

    if (args.strictCitations && payload.summary.uncitedCount > 0) {
      io.stderr(
        `strict-citations failed: ${payload.summary.uncitedCount} uncited decisions in output window` +
        ` | by-stage: ${formatBreakdown(payload.summary.uncitedByStage)}` +
        ` | by-type: ${formatBreakdown(payload.summary.uncitedByType)}\n`
      );
      return 2;
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr(`${message}\n`);
    return 1;
  }
}

const isMain =
  process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  runExplainCli(process.argv.slice(2)).then((code) => {
    process.exit(code);
  });
}
