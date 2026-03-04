#!/usr/bin/env node
/**
 * CEL evaluation waste profiler.
 *
 * Measures where CEL evaluations are "wasted" (where-clause evaluates to false)
 * by analyzing trace data and comparing match counts to total token counts.
 *
 * Usage:
 *   npx tsx scripts/profile-cel-waste.ts
 */

import { performance } from "node:perf_hooks";
import { textToKlattTrack, normalizeText, transcribeText } from "../src/tts-frontend";
import {
  materializePhonemeTarget,
  loadInventorySpecFromPath,
} from "../src/declarative-frontend/inventory";

const INVENTORY = loadInventorySpecFromPath(
  "/rules/frontends/qlatt-english/inventory.yaml"
);
import { runDeclarativeFrontend } from "../src/declarative-frontend";
import { QLATT_V12_CEL_RULEPACK } from "../src/declarative-frontend/rule-pack";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import {
  getCelEvalCount,
  resetCelCounters,
} from "../src/declarative-frontend/cel-expressions";
import {
  preloadCmuDictionaryFromPath,
  DEFAULT_CMU_DICTIONARY_PATH,
} from "../src/cmu-dictionary-loader";

// Suppress console.warn
console.warn = () => {};

type FrontendToken = Record<string, any>;

function buildParameterSequence(phonemeList: FrontendToken[]): FrontendToken[] {
  return phonemeList.map((ph, index) => {
    const targetKeyBase = ph.phoneme;
    const materialized = materializePhonemeTarget(targetKeyBase, { stress: ph.stress, inventorySpec: INVENTORY });
    return {
      id: `ph_${index}`,
      ...materialized,
      phoneme: targetKeyBase,
      stress: ph.stress,
      punctuationSymbol: ph.isPunctuation ? ph.symbol : null,
      word: ph.word,
    };
  });
}

/**
 * For a single run through a phase group, count per-rule:
 * - total active tokens in the sequence at rule evaluation time
 * - matches (from trace events)
 * - CEL evals consumed
 */
type RuleStats = {
  rule: string;
  phase: string;
  totalTokens: number;
  matches: number;
  celEvals: number;
  elapsedMs: number;
};

function analyzePhaseGroup(
  paramSeq: FrontendToken[],
  phases: string[],
  phaseKey: string,
  extraParams?: Record<string, unknown>
): { stats: RuleStats[]; outputSeq: FrontendToken[] } {
  const inventoryResolver = (phoneme: string) =>
  materializePhonemeTarget(phoneme, { inventorySpec: INVENTORY });
const inventory = { inventoryResolver };

  resetCelCounters();
  let prevCelCount = 0;

  const result = runDeclarativeFrontend(paramSeq, {
    ...inventory,
    phases,
    includeTrace: true,
    ...(extraParams ? { parameters: extraParams } : {}),
  }) as { sequence: FrontendToken[]; trace?: FrontendToken[] };

  const trace = result.trace ?? [];
  const stats: RuleStats[] = [];

  // Walk trace events to extract per-rule stats
  let currentRuleTokenCount = 0;
  let currentRuleMatchCount = 0;
  let currentRuleName = "";
  let currentPhase = "";

  for (const event of trace) {
    if (event.type === "rule_start") {
      currentRuleName = event.rule as string;
      currentPhase = event.phase as string;
      currentRuleTokenCount = result.sequence.filter(
        (t: FrontendToken) => t.status === 1 || t.status === undefined
      ).length;
      currentRuleMatchCount = 0;
    } else if (event.type === "match") {
      currentRuleMatchCount++;
    } else if (event.type === "rule_end") {
      stats.push({
        rule: currentRuleName,
        phase: currentPhase,
        totalTokens: currentRuleTokenCount,
        matches: currentRuleMatchCount,
        celEvals: 0, // filled later
        elapsedMs: typeof event.elapsed === "number" ? event.elapsed : 0,
      });
    }
  }

  return { stats, outputSeq: result.sequence };
}

async function main() {
  console.log("=== CEL Evaluation Waste Profiler ===\n");

  await preloadCmuDictionaryFromPath(DEFAULT_CMU_DICTIONARY_PATH);

  // Get spec for rule analysis
  const spec = parseDslSpec(QLATT_V12_CEL_RULEPACK);

  // Sample words
  const dict = await preloadCmuDictionaryFromPath(DEFAULT_CMU_DICTIONARY_PATH);
  const allWords = Object.keys(dict);
  const testWords = allWords.slice(0, 200);

  // Warmup
  for (let i = 0; i < 5; i++) {
    try { textToKlattTrack(testWords[i]); } catch {}
  }

  const inventoryResolver = (phoneme: string) =>
  materializePhonemeTarget(phoneme, { inventorySpec: INVENTORY });
const inventory = { inventoryResolver };

  // Accumulate per-rule stats across all words
  const ruleAccum: Map<string, {
    rule: string;
    phase: string;
    totalTokens: number;
    matches: number;
    celEvals: number;
    elapsedMs: number;
    wordCount: number;
  }> = new Map();

  // Also track per-phase CEL eval totals
  const phaseCelAccum: Map<string, number> = new Map();
  let totalCelEvals = 0;
  let wordCount = 0;
  let errorCount = 0;

  for (const word of testWords) {
    try {
      const normalized = normalizeText(word);
      const phonemes = transcribeText(normalized);
      let paramSeq = buildParameterSequence(phonemes);

      for (const phaseSpec of [
        { phases: ["postlexical"], key: "postlexical" },
        { phases: ["structural"], key: "structural" },
        { phases: ["duration"], key: "duration" },
      ]) {
        resetCelCounters();
        const { stats, outputSeq } = analyzePhaseGroup(paramSeq, phaseSpec.phases, phaseSpec.key);
        const phaseCel = getCelEvalCount();
        phaseCelAccum.set(phaseSpec.key, (phaseCelAccum.get(phaseSpec.key) ?? 0) + phaseCel);
        totalCelEvals += phaseCel;

        for (const s of stats) {
          const key = `${s.phase}:${s.rule}`;
          const existing = ruleAccum.get(key);
          if (existing) {
            existing.totalTokens += s.totalTokens;
            existing.matches += s.matches;
            existing.elapsedMs += s.elapsedMs;
            existing.wordCount++;
          } else {
            ruleAccum.set(key, { ...s, wordCount: 1 });
          }
        }
        paramSeq = outputSeq;
      }

      // Re-ID before prosody+finalize
      paramSeq = paramSeq.map((token: FrontendToken, index: number) => ({
        ...token,
        id: token.id ?? `ph_${index}`,
        stream: "phone",
        status: token.status ?? 1,
      }));

      resetCelCounters();
      const { stats } = analyzePhaseGroup(paramSeq, ["prosody", "finalize"], "prosody+finalize", {
        policy: {
          f0: {
            base_hz: 110,
            fall_rate_hz: 20,
            stress_rise: 1.15,
            question_rise_hz: 30,
          },
        },
      });
      const phaseCel = getCelEvalCount();
      phaseCelAccum.set("prosody+finalize", (phaseCelAccum.get("prosody+finalize") ?? 0) + phaseCel);
      totalCelEvals += phaseCel;

      for (const s of stats) {
        const key = `${s.phase}:${s.rule}`;
        const existing = ruleAccum.get(key);
        if (existing) {
          existing.totalTokens += s.totalTokens;
          existing.matches += s.matches;
          existing.elapsedMs += s.elapsedMs;
          existing.wordCount++;
        } else {
          ruleAccum.set(key, { ...s, wordCount: 1 });
        }
      }

      wordCount++;
    } catch {
      errorCount++;
    }
  }

  // === Output Results ===
  console.log(`Analyzed ${wordCount} words (${errorCount} errors)\n`);
  console.log(`Total CEL evaluations: ${totalCelEvals} (${(totalCelEvals / wordCount).toFixed(1)}/word)\n`);

  // Phase CEL breakdown
  console.log("=== CEL Evaluations by Phase ===\n");
  for (const [phase, count] of [...phaseCelAccum.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${phase.padEnd(25)} ${String(count).padStart(8)} total  ${(count / wordCount).toFixed(1).padStart(8)}/word`);
  }

  // Build sorted rule table
  const allRules = [...ruleAccum.values()];

  // Sort by waste (totalTokens - matches) descending
  const byWaste = [...allRules].sort((a, b) => {
    const wasteA = a.totalTokens - a.matches;
    const wasteB = b.totalTokens - b.matches;
    return wasteB - wasteA;
  });

  console.log("\n\n=== CEL Evaluation Distribution (per rule) ===\n");
  console.log(
    "Rule".padEnd(45) +
    "Phase".padEnd(20) +
    "Tokens".padStart(8) +
    "Matches".padStart(9) +
    "Rate".padStart(7) +
    "Time(ms)".padStart(10) +
    "  ms/word".padStart(10)
  );
  console.log("-".repeat(109));

  for (const r of allRules.sort((a, b) => a.phase.localeCompare(b.phase) || a.rule.localeCompare(b.rule))) {
    const matchRate = r.totalTokens > 0 ? ((r.matches / r.totalTokens) * 100).toFixed(1) : "N/A";
    const perWord = (r.elapsedMs / wordCount).toFixed(3);
    console.log(
      `${r.rule.padEnd(45)}${r.phase.padEnd(20)}${String(r.totalTokens).padStart(8)}${String(r.matches).padStart(9)}  ${matchRate.padStart(5)}%  ${r.elapsedMs.toFixed(1).padStart(8)}  ${perWord.padStart(8)}`
    );
  }

  // Top wasters
  console.log("\n\n=== Top 15 Wasters (lowest match rate x highest eval count) ===\n");
  console.log(
    "Rule".padEnd(45) +
    "Phase".padEnd(20) +
    "Tokens".padStart(8) +
    "Matches".padStart(9) +
    "Wasted".padStart(8) +
    "Rate".padStart(7)
  );
  console.log("-".repeat(97));

  for (const r of byWaste.slice(0, 15)) {
    const matchRate = r.totalTokens > 0 ? ((r.matches / r.totalTokens) * 100).toFixed(1) : "N/A";
    const wasted = r.totalTokens - r.matches;
    console.log(
      `${r.rule.padEnd(45)}${r.phase.padEnd(20)}${String(r.totalTokens).padStart(8)}${String(r.matches).padStart(9)}${String(wasted).padStart(8)}  ${matchRate.padStart(5)}%`
    );
  }

  // Stream filter analysis from spec
  console.log("\n\n=== Stream Filter Coverage ===\n");
  const phases = spec.phases as any[];
  const rules = spec.rules as Record<string, any>;
  let withStream = 0;
  let withoutStream = 0;
  const phaseStreamCoverage: { phase: string; withStream: number; withoutStream: number; rules: string[] }[] = [];

  for (const phase of phases) {
    let phaseWith = 0;
    let phaseWithout = 0;
    const noStreamRules: string[] = [];
    for (const ruleName of (phase.rules ?? []) as string[]) {
      const rule = rules[ruleName];
      if (!rule) continue;
      if (rule.select?.stream) {
        phaseWith++;
        withStream++;
      } else if (rule.match) {
        // Pattern rules get stream from the pattern definition
        phaseWith++;
        withStream++;
      } else {
        phaseWithout++;
        withoutStream++;
        noStreamRules.push(ruleName);
      }
    }
    phaseStreamCoverage.push({
      phase: phase.name,
      withStream: phaseWith,
      withoutStream: phaseWithout,
      rules: noStreamRules,
    });
  }

  console.log(`Total rules with stream filter: ${withStream}`);
  console.log(`Total rules without stream filter: ${withoutStream}`);
  console.log();
  for (const p of phaseStreamCoverage) {
    console.log(`  ${p.phase.padEnd(20)} ${p.withStream} with filter, ${p.withoutStream} without`);
    for (const r of p.rules) {
      console.log(`    - ${r} (NO stream filter)`);
    }
  }

  // Where-clause pattern analysis
  console.log("\n\n=== Where-Clause Pattern Analysis ===\n");

  const patternCategories: Record<string, string[]> = {
    "phoneme_exact_match": [],
    "phoneme_in_list": [],
    "type_check": [],
    "prev_next_check": [],
    "complex_boolean": [],
    "predicate_ref": [],
    "has_check": [],
    "other": [],
  };

  for (const phase of phases) {
    for (const ruleName of (phase.rules ?? []) as string[]) {
      const rule = rules[ruleName];
      if (!rule) continue;
      const where = rule.select?.where;
      if (!where || typeof where !== "string") {
        if (where && typeof where === "object" && where.predicate) {
          patternCategories.predicate_ref.push(ruleName);
        }
        continue;
      }

      const w = where as string;
      if (/current\.phoneme\s*(==|in\s*\[)/.test(w) && !/&&/.test(w)) {
        patternCategories.phoneme_exact_match.push(ruleName);
      } else if (/current\.phoneme\s*in\s*\[/.test(w)) {
        patternCategories.phoneme_in_list.push(ruleName);
      } else if (/current\.type\s*(==|in\s*\[)/.test(w) && !/&&/.test(w)) {
        patternCategories.type_check.push(ruleName);
      } else if (/\bprev\b/.test(w) || /\bnext\b/.test(w)) {
        patternCategories.prev_next_check.push(ruleName);
      } else if (/\bhas\(/.test(w)) {
        patternCategories.has_check.push(ruleName);
      } else {
        patternCategories.other.push(ruleName);
      }
    }
  }

  for (const [category, ruleNames] of Object.entries(patternCategories)) {
    if (ruleNames.length === 0) continue;
    console.log(`  ${category} (${ruleNames.length} rules):`);
    for (const name of ruleNames) {
      const rule = rules[name];
      const where = rule?.select?.where;
      const whereStr = typeof where === "string" ? where.substring(0, 80) : JSON.stringify(where)?.substring(0, 80);
      console.log(`    - ${name}`);
      console.log(`      where: ${whereStr}${(whereStr?.length ?? 0) >= 80 ? "..." : ""}`);
    }
    console.log();
  }
}

main().catch(console.error);
