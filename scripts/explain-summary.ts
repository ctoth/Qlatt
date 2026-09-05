#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

type ExplainDecision = {
  type?: string;
  stage?: string;
  reason?: string;
};

type ExplainSummary = {
  decisionCount?: number;
  uncitedCount?: number;
  byStage?: Record<string, number>;
  byType?: Record<string, number>;
};

type ExplainPayload = {
  summary?: ExplainSummary;
  decisions?: ExplainDecision[];
  totalDecisionCount?: number;
};

function parseArgs(argv: string[]): { inputPath: string; topN: number } {
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

  const inputPathRaw = flags.get("in") ?? positional[0];
  if (!inputPathRaw) {
    throw new Error("Missing input path. Use --in <path-to-explain-json>.");
  }
  const inputPath = path.resolve(inputPathRaw);

  const topNRaw = flags.get("top") ?? "12";
  const topN = Number(topNRaw);
  if (!Number.isFinite(topN) || topN <= 0) {
    throw new Error(`Invalid --top '${topNRaw}'`);
  }

  return { inputPath, topN: Math.floor(topN) };
}

function topEntries(
  record: Record<string, number> | undefined,
  topN: number,
): Array<[string, number]> {
  if (!record || typeof record !== "object") return [];
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);
}

function toInline(entries: Array<[string, number]>): string {
  if (entries.length === 0) return "<none>";
  return entries.map(([name, count]) => `${name}:${count}`).join(", ");
}

function countRewriteRules(decisions: ExplainDecision[], topN: number): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const decision of decisions) {
    if (decision.type !== "rule_rewrite_applied") continue;
    const reason = typeof decision.reason === "string" ? decision.reason : "";
    const marker = " rewrite in phase ";
    const idx = reason.indexOf(marker);
    const ruleName = idx >= 0 ? reason.slice(0, idx).trim() : reason.trim();
    const key = ruleName.length > 0 ? ruleName : "<unknown-rule>";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
}

function main(): number {
  try {
    const { inputPath, topN } = parseArgs(process.argv.slice(2));
    const raw = fs.readFileSync(inputPath, "utf8");
    const payload = JSON.parse(raw) as ExplainPayload;
    const summary = payload.summary ?? {};
    const decisions = Array.isArray(payload.decisions) ? payload.decisions : [];

    const decisionCount = summary.decisionCount ?? decisions.length;
    const uncitedCount = summary.uncitedCount ?? 0;
    const totalDecisionCount = payload.totalDecisionCount ?? decisionCount;

    console.log(`decisions ${decisionCount} uncited ${uncitedCount} total ${totalDecisionCount}`);
    console.log(`byStage ${toInline(topEntries(summary.byStage, topN))}`);
    console.log(`topTypes ${toInline(topEntries(summary.byType, topN))}`);
    console.log(`topRuleRewrites ${toInline(countRewriteRules(decisions, topN))}`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    return 1;
  }
}

process.exit(main());
