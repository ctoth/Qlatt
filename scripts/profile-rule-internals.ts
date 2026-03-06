#!/usr/bin/env node
/**
 * Micro-profile inside rule application: CEL eval time vs navigation/context
 * building vs other overhead.
 *
 * Uses the built-in trace events (with elapsed timing) plus the CEL timing
 * accumulator in cel-expressions.ts to separate cost categories.
 *
 * Usage:
 *   npx tsx scripts/profile-rule-internals.ts
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
import {
  getCelEvalCount,
  getCelCacheHitCount,
  getCelCacheMissCount,
  getCelEvalTimeMs,
  setCelTimingEnabled,
  resetCelCounters,
} from "../src/declarative-frontend/cel-expressions";
import {
  preloadCmuDictionaryFromPath,
  DEFAULT_CMU_DICTIONARY_PATH,
} from "../src/cmu-dictionary-loader";

// Suppress console.warn (dictionary miss warnings, etc.)
console.warn = () => {};

type FrontendToken = Record<string, any>;

/**
 * Build parameter sequence using materializePhonemeTarget (mirrors real pipeline).
 */
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

type PhaseSpec = {
  phases: string[];
  key: string;
  parameters?: Record<string, unknown>;
};

const PHASE_SPECS: PhaseSpec[] = [
  { phases: ["postlexical"], key: "postlexical" },
  { phases: ["structural"], key: "structural" },
  { phases: ["duration"], key: "duration" },
  {
    phases: ["prosody", "finalize"],
    key: "prosody+finalize",
    parameters: {
      policy: {
        f0: {
          base_hz: 110,
        },
      },
    },
  },
];

async function main() {
  console.log("=== Rule Internals Micro-Profiler ===\n");
  console.log("Separates CEL VM execution time from navigation/context overhead.\n");

  await preloadCmuDictionaryFromPath(DEFAULT_CMU_DICTIONARY_PATH);

  const dict = await preloadCmuDictionaryFromPath(DEFAULT_CMU_DICTIONARY_PATH);
  const testWords = Object.keys(dict).slice(0, 200);
  const wordCount = testWords.length;
  const inventoryResolver = (phoneme: string) =>
    materializePhonemeTarget(phoneme, { inventorySpec: INVENTORY });
  const inventory = { inventoryResolver };

  // Warmup: run 5 words to populate caches + JIT
  for (let i = 0; i < 5; i++) {
    try { textToKlattTrack(testWords[i]); } catch {}
  }
  // Also warmup the CEL expression cache with timing enabled
  setCelTimingEnabled(true);
  for (let i = 0; i < 3; i++) {
    try { textToKlattTrack(testWords[i]); } catch {}
  }
  resetCelCounters();

  console.log(`Test words: ${wordCount}`);
  console.log(`CEL timing: enabled (performance.now() per evaluateExpression call)\n`);

  // --- Accumulators ---
  // Per phase: total wall-clock time, total rule elapsed (from trace), total CEL time, CEL eval count
  const phaseStats: Record<string, {
    wallMs: number;
    ruleMs: number;
    celMs: number;
    celEvals: number;
    celHits: number;
    celMisses: number;
    ruleBreakdown: Record<string, { ruleMs: number; celMs: number; celEvals: number }>;
  }> = {};
  for (const ps of PHASE_SPECS) {
    phaseStats[ps.key] = {
      wallMs: 0, ruleMs: 0, celMs: 0, celEvals: 0,
      celHits: 0, celMisses: 0, ruleBreakdown: {},
    };
  }

  let errorCount = 0;
  let totalCelEvals = 0;
  let totalCelMs = 0;
  let totalRuleMs = 0;
  let totalWallMs = 0;

  // --- Main measurement loop ---
  const overallT0 = performance.now();

  for (const word of testWords) {
    try {
      const normalized = normalizeText(word);
      const phonemes = transcribeText(normalized);
      let paramSeq = buildParameterSequence(phonemes);

      for (const phaseSpec of PHASE_SPECS) {
        // Re-ID before prosody+finalize (mirrors real pipeline)
        if (phaseSpec.key === "prosody+finalize") {
          paramSeq = paramSeq.map((token: FrontendToken, index: number) => ({
            ...token,
            id: token.id ?? `ph_${index}`,
            stream: "phone",
            status: token.status ?? 1,
          }));
        }

        resetCelCounters();
        const wallT0 = performance.now();
        const result = runDeclarativeFrontend(paramSeq, {
          ...inventory,
          phases: phaseSpec.phases,
          includeTrace: true,
          parameters: phaseSpec.parameters,
        }) as { sequence: FrontendToken[]; trace?: FrontendToken[] };
        const wallElapsed = performance.now() - wallT0;

        const celMs = getCelEvalTimeMs();
        const celEvals = getCelEvalCount();
        const celHits = getCelCacheHitCount();
        const celMisses = getCelCacheMissCount();

        const stats = phaseStats[phaseSpec.key];
        stats.wallMs += wallElapsed;
        stats.celMs += celMs;
        stats.celEvals += celEvals;
        stats.celHits += celHits;
        stats.celMisses += celMisses;

        totalCelEvals += celEvals;
        totalCelMs += celMs;
        totalWallMs += wallElapsed;

        // Extract per-rule timing from trace events.
        // For per-rule CEL breakdown we use a heuristic: we cannot directly
        // attribute CEL time to individual rules from outside the engine.
        // Instead, accumulate total rule elapsed from trace.
        let phaseRuleMs = 0;
        for (const event of result.trace ?? []) {
          if (event.type === "rule_end" && typeof event.elapsed === "number") {
            const ruleName = event.rule as string;
            const ruleMs = event.elapsed as number;
            phaseRuleMs += ruleMs;
            if (!stats.ruleBreakdown[ruleName]) {
              stats.ruleBreakdown[ruleName] = { ruleMs: 0, celMs: 0, celEvals: 0 };
            }
            stats.ruleBreakdown[ruleName].ruleMs += ruleMs;
          }
        }
        stats.ruleMs += phaseRuleMs;
        totalRuleMs += phaseRuleMs;

        paramSeq = result.sequence;
      }
    } catch {
      errorCount++;
    }
  }

  const overallElapsed = performance.now() - overallT0;

  // --- Report ---

  console.log("=".repeat(80));
  console.log("OVERALL SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total wall-clock time:     ${overallElapsed.toFixed(1)}ms`);
  console.log(`  Sum of phase wall times: ${totalWallMs.toFixed(1)}ms`);
  console.log(`  Sum of rule elapsed:     ${totalRuleMs.toFixed(1)}ms`);
  console.log(`  CEL VM execution time:   ${totalCelMs.toFixed(1)}ms`);
  console.log(`  CEL evaluations:         ${totalCelEvals}`);
  console.log(`  Errors:                  ${errorCount}`);
  console.log();

  // Cost breakdown as a percentage of totalRuleMs (rule application is the hot path)
  const navContextMs = totalRuleMs - totalCelMs;
  console.log("--- Cost Breakdown (within rule application) ---\n");
  console.log(`Total rule application time:  ${totalRuleMs.toFixed(1)}ms  (${(totalRuleMs / wordCount).toFixed(3)} ms/word)`);
  console.log(`  CEL VM execution:           ${totalCelMs.toFixed(1)}ms  (${pct(totalCelMs, totalRuleMs)})  (${(totalCelMs / wordCount).toFixed(3)} ms/word)`);
  console.log(`  Navigation/Context build:   ${navContextMs.toFixed(1)}ms  (${pct(navContextMs, totalRuleMs)})  (${(navContextMs / wordCount).toFixed(3)} ms/word)`);
  console.log();

  // Phase-level overhead = wall - rule (captures cloneSequence, axis init, etc.)
  const phaseOverhead = totalWallMs - totalRuleMs;
  console.log("--- Phase-Level Overhead (outside rules) ---\n");
  console.log(`Phase overhead (wall - rule): ${phaseOverhead.toFixed(1)}ms  (${pct(phaseOverhead, totalWallMs)} of wall)  (${(phaseOverhead / wordCount).toFixed(3)} ms/word)`);
  console.log(`  (cloneSequence, stream classification, axis init, scalar resolution, etc.)`);
  console.log();

  // Full pie chart
  console.log("--- Full Cost Pie (of phase wall time) ---\n");
  console.log(`  CEL VM execution:         ${pct(totalCelMs, totalWallMs).padStart(6)}  ${totalCelMs.toFixed(1).padStart(8)}ms`);
  console.log(`  Navigation/Context build: ${pct(navContextMs, totalWallMs).padStart(6)}  ${navContextMs.toFixed(1).padStart(8)}ms`);
  console.log(`  Phase overhead:           ${pct(phaseOverhead, totalWallMs).padStart(6)}  ${phaseOverhead.toFixed(1).padStart(8)}ms`);
  console.log(`  TOTAL:                    100.0%  ${totalWallMs.toFixed(1).padStart(8)}ms`);
  console.log();

  // Per-word summary
  console.log("--- Per-Word Summary ---\n");
  console.log(`  CEL VM:            ${(totalCelMs / wordCount).toFixed(3)} ms/word  (${(totalCelEvals / wordCount).toFixed(0)} evals/word, ${(totalCelMs / totalCelEvals * 1000).toFixed(1)} us/eval)`);
  console.log(`  Nav/Context build: ${(navContextMs / wordCount).toFixed(3)} ms/word`);
  console.log(`  Phase overhead:    ${(phaseOverhead / wordCount).toFixed(3)} ms/word`);
  console.log(`  TOTAL:             ${(totalWallMs / wordCount).toFixed(3)} ms/word`);
  console.log();

  // --- Per-Phase Breakdown ---
  console.log("=".repeat(80));
  console.log("PER-PHASE BREAKDOWN");
  console.log("=".repeat(80));
  console.log();

  const hdr = (s: string) => s.padEnd(25);
  console.log(
    hdr("Phase") +
    "Wall(ms)".padStart(10) +
    "Rule(ms)".padStart(10) +
    "CEL(ms)".padStart(10) +
    "Nav/Ctx".padStart(10) +
    "Overhead".padStart(10) +
    "  CEL%".padStart(8) +
    "  Evals".padStart(8)
  );
  console.log("-".repeat(91));

  for (const ps of PHASE_SPECS) {
    const s = phaseStats[ps.key];
    const nav = s.ruleMs - s.celMs;
    const overhead = s.wallMs - s.ruleMs;
    const celPct = s.ruleMs > 0 ? ((s.celMs / s.ruleMs) * 100).toFixed(1) : "0.0";
    console.log(
      hdr(ps.key) +
      s.wallMs.toFixed(1).padStart(10) +
      s.ruleMs.toFixed(1).padStart(10) +
      s.celMs.toFixed(1).padStart(10) +
      nav.toFixed(1).padStart(10) +
      overhead.toFixed(1).padStart(10) +
      (celPct + "%").padStart(8) +
      String(s.celEvals).padStart(8)
    );
  }
  console.log();

  // --- Top 20 Rules by Total Time ---
  console.log("=".repeat(80));
  console.log("TOP 20 RULES BY TOTAL TIME");
  console.log("=".repeat(80));
  console.log();

  const allRules: { phase: string; rule: string; ruleMs: number }[] = [];
  for (const ps of PHASE_SPECS) {
    for (const [rule, data] of Object.entries(phaseStats[ps.key].ruleBreakdown)) {
      allRules.push({ phase: ps.key, rule, ruleMs: data.ruleMs });
    }
  }
  allRules.sort((a, b) => b.ruleMs - a.ruleMs);

  console.log(
    "Rule".padEnd(40) +
    "Phase".padEnd(20) +
    "Total(ms)".padStart(10) +
    "  ms/word".padStart(10) +
    "  % rules".padStart(10)
  );
  console.log("-".repeat(90));
  for (const { phase, rule, ruleMs } of allRules.slice(0, 20)) {
    const rPct = totalRuleMs > 0 ? ((ruleMs / totalRuleMs) * 100).toFixed(1) : "0.0";
    const perWord = (ruleMs / wordCount).toFixed(3);
    console.log(
      rule.padEnd(40) +
      phase.padEnd(20) +
      ruleMs.toFixed(1).padStart(10) +
      perWord.padStart(10) +
      (rPct + "%").padStart(10)
    );
  }
  console.log();

  // --- Per-Phase CEL Breakdown ---
  console.log("=".repeat(80));
  console.log("PER-PHASE CEL EVALUATION STATS");
  console.log("=".repeat(80));
  console.log();

  for (const ps of PHASE_SPECS) {
    const s = phaseStats[ps.key];
    const celPerWord = (s.celEvals / wordCount).toFixed(1);
    const celMsPerWord = (s.celMs / wordCount).toFixed(3);
    const avgUsPerEval = s.celEvals > 0 ? ((s.celMs / s.celEvals) * 1000).toFixed(1) : "N/A";
    console.log(`  ${ps.key}:`);
    console.log(`    CEL evaluations: ${s.celEvals} (${celPerWord}/word)`);
    console.log(`    CEL time:        ${s.celMs.toFixed(1)}ms (${celMsPerWord} ms/word, ${avgUsPerEval} us/eval)`);
    console.log(`    Cache hits:      ${s.celHits}  misses: ${s.celMisses}`);
    console.log();
  }

  // --- Single-word deep dive ---
  console.log("=".repeat(80));
  console.log("SINGLE-WORD DEEP DIVE: 'hello'");
  console.log("=".repeat(80));
  console.log();

  const normalized = normalizeText("hello");
  const phonemes = transcribeText(normalized);
  let paramSeq = buildParameterSequence(phonemes);
  console.log(`Phoneme tokens: ${paramSeq.length}`);

  for (const phaseSpec of PHASE_SPECS) {
    if (phaseSpec.key === "prosody+finalize") {
      paramSeq = paramSeq.map((token: FrontendToken, index: number) => ({
        ...token,
        id: token.id ?? `ph_${index}`,
        stream: "phone",
        status: token.status ?? 1,
      }));
    }

    resetCelCounters();
    const wallT0 = performance.now();
    const result = runDeclarativeFrontend(paramSeq, {
      ...inventory,
      phases: phaseSpec.phases,
      includeTrace: true,
      parameters: phaseSpec.parameters,
    }) as { sequence: FrontendToken[]; trace?: FrontendToken[] };
    const wallElapsed = performance.now() - wallT0;
    const celMs = getCelEvalTimeMs();
    const celEvals = getCelEvalCount();
    const navCtxMs = wallElapsed - celMs; // includes both nav overhead + phase overhead

    console.log(`\n  Phase: ${phaseSpec.key}`);
    console.log(`    Wall: ${wallElapsed.toFixed(2)}ms  CEL: ${celMs.toFixed(2)}ms (${pct(celMs, wallElapsed)})  Nav+Overhead: ${navCtxMs.toFixed(2)}ms (${pct(navCtxMs, wallElapsed)})  Evals: ${celEvals}`);

    // Per-rule timing
    let sumRuleMs = 0;
    const ruleTimings: { rule: string; elapsed: number }[] = [];
    for (const event of result.trace ?? []) {
      if (event.type === "rule_end" && typeof event.elapsed === "number") {
        ruleTimings.push({ rule: event.rule as string, elapsed: event.elapsed as number });
        sumRuleMs += event.elapsed as number;
      }
    }
    const phaseOverhead = wallElapsed - sumRuleMs;
    console.log(`    Phase overhead (wall - sum_rules): ${phaseOverhead.toFixed(2)}ms`);
    if (ruleTimings.length > 0) {
      console.log(`    Rules (${ruleTimings.length}):`);
      for (const { rule, elapsed: ruleMs } of ruleTimings) {
        console.log(`      ${rule.padEnd(40)} ${ruleMs.toFixed(3).padStart(8)}ms`);
      }
    }

    paramSeq = result.sequence;
  }

  console.log("\n\nDone.");
}

function pct(part: number, total: number): string {
  if (total <= 0) return "0.0%";
  return ((part / total) * 100).toFixed(1) + "%";
}

main().catch(console.error);
