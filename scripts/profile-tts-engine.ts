#!/usr/bin/env node
/**
 * Engine-level profiling of the declarative rule engine.
 *
 * Measures what's ACTUALLY expensive in the pipeline:
 * - Per-phase timing across many words
 * - Per-rule timing within phases (via trace events)
 * - CEL evaluation counts and cache hit rates
 * - Spec metadata (size, rule counts, CEL expression counts)
 *
 * Usage:
 *   npx tsx scripts/profile-tts-engine.ts
 */

import { performance } from "node:perf_hooks";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { QLATT_V12_CEL_RULEPACK } from "../src/declarative-frontend/rule-pack";
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
  resetCelCounters,
} from "../src/declarative-frontend/cel-expressions";
import {
  preloadCmuDictionaryFromPath,
  DEFAULT_CMU_DICTIONARY_PATH,
} from "../src/cmu-dictionary-loader";

// Suppress console.warn
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

async function main() {
  console.log("=== Engine-Level Profiling ===\n");

  await preloadCmuDictionaryFromPath(DEFAULT_CMU_DICTIONARY_PATH);
  const spec = parseDslSpec(QLATT_V12_CEL_RULEPACK);

  // --- Section 1: Spec Metadata ---
  console.log("=== Spec Metadata ===\n");
  const specStr = JSON.stringify(spec);
  console.log(`Spec size: ${(specStr.length / 1024).toFixed(1)} KB`);
  const ruleCount = Object.keys(spec.rules || {}).length;
  const phaseCount = (spec.phases as any[])?.length ?? 0;
  console.log(`Rule count: ${ruleCount}`);
  console.log(`Phase count: ${phaseCount}`);
  if (spec.phases && Array.isArray(spec.phases)) {
    for (const phase of spec.phases) {
      const p = phase as { name: string; rules: string[] };
      console.log(`  Phase '${p.name}': ${p.rules.length} rules`);
    }
  }

  // Count CEL expressions in rules
  let celExprCount = 0;
  function countExprs(obj: unknown) {
    if (typeof obj === "string" && obj.includes("current.")) celExprCount++;
    if (typeof obj === "string" && obj.includes("prev.")) celExprCount++;
    if (typeof obj === "string" && obj.includes("next.")) celExprCount++;
    if (Array.isArray(obj)) obj.forEach(countExprs);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      Object.values(obj as Record<string, unknown>).forEach(countExprs);
    }
  }
  countExprs(spec.rules);
  console.log(`CEL-like expressions in rules: ~${celExprCount}`);

  // --- Section 2: Per-Phase + Per-Rule Timing ---
  console.log("\n\n=== Per-Phase Timing (200 words) ===\n");

  const testWords = Object.keys(
    await preloadCmuDictionaryFromPath(DEFAULT_CMU_DICTIONARY_PATH)
  ).slice(0, 200);

  // Warmup
  for (let i = 0; i < 5; i++) {
    try { textToKlattTrack(testWords[i]); } catch {}
  }

  const phaseNames = ["postlexical", "structural", "duration", "prosody+finalize"];
  const phaseTotals: Record<string, number> = {};
  const phaseRuleTotals: Record<string, Record<string, number>> = {};
  const phaseCelEvals: Record<string, number> = {};
  for (const pn of phaseNames) {
    phaseTotals[pn] = 0;
    phaseRuleTotals[pn] = {};
    phaseCelEvals[pn] = 0;
  }

  let errorCount = 0;
  let totalCelEvals = 0;
  let totalCelHits = 0;
  let totalCelMisses = 0;

  const inventoryResolver = (phoneme: string) =>
    materializePhonemeTarget(phoneme, { inventorySpec: INVENTORY });
  const inventory = { inventoryResolver };
  const totalStart = performance.now();

  for (const word of testWords) {
    try {
      const normalized = normalizeText(word);
      const phonemes = transcribeText(normalized);
      let paramSeq = buildParameterSequence(phonemes);

      // Run each phase separately with tracing to get per-rule timing
      for (const phaseSpec of [
        { phases: ["postlexical"], key: "postlexical" },
        { phases: ["structural"], key: "structural" },
        { phases: ["duration"], key: "duration" },
      ]) {
        resetCelCounters();
        const t = performance.now();
        const result = runDeclarativeFrontend(paramSeq, {
          ...inventory,
          phases: phaseSpec.phases,
          includeTrace: true,
        }) as { sequence: FrontendToken[]; trace?: FrontendToken[] };
        phaseTotals[phaseSpec.key] += performance.now() - t;
        phaseCelEvals[phaseSpec.key] += getCelEvalCount();
        totalCelEvals += getCelEvalCount();
        totalCelHits += getCelCacheHitCount();
        totalCelMisses += getCelCacheMissCount();

        // Accumulate per-rule timing from trace
        for (const event of result.trace ?? []) {
          if (event.type === "rule_end" && typeof event.elapsed === "number") {
            const ruleName = event.rule as string;
            phaseRuleTotals[phaseSpec.key][ruleName] =
              (phaseRuleTotals[phaseSpec.key][ruleName] ?? 0) + (event.elapsed as number);
          }
        }
        paramSeq = result.sequence;
      }

      // Re-ID and tag before prosody+finalize
      paramSeq = paramSeq.map((token: FrontendToken, index: number) => ({
        ...token,
        id: token.id ?? `ph_${index}`,
        stream: "phone",
        status: token.status ?? 1,
      }));

      // prosody + finalize
      resetCelCounters();
      const t = performance.now();
      const result = runDeclarativeFrontend(paramSeq, {
        ...inventory,
        phases: ["prosody", "finalize"],
        includeTrace: true,
        parameters: {
          policy: {
            f0: {
              base_hz: 110,
              fall_rate_hz: 20,
              stress_rise: 1.15,
              question_rise_hz: 30,
            },
          },
        },
      }) as { sequence: FrontendToken[]; trace?: FrontendToken[] };
      phaseTotals["prosody+finalize"] += performance.now() - t;
      phaseCelEvals["prosody+finalize"] += getCelEvalCount();
      totalCelEvals += getCelEvalCount();
      totalCelHits += getCelCacheHitCount();
      totalCelMisses += getCelCacheMissCount();

      for (const event of result.trace ?? []) {
        if (event.type === "rule_end" && typeof event.elapsed === "number") {
          const ruleName = event.rule as string;
          phaseRuleTotals["prosody+finalize"][ruleName] =
            (phaseRuleTotals["prosody+finalize"][ruleName] ?? 0) + (event.elapsed as number);
        }
      }
    } catch {
      errorCount++;
    }
  }

  const totalTime = performance.now() - totalStart;
  const wordCount = testWords.length;

  console.log(`Total: ${totalTime.toFixed(0)}ms for ${wordCount} words (${errorCount} errors)\n`);

  // Phase summary table
  console.log("Phase".padEnd(25) + "Total(ms)".padStart(10) + "  ms/word".padStart(10) + "   %".padStart(6) + "  CEL evals".padStart(12));
  console.log("-".repeat(63));
  for (const pn of phaseNames) {
    const time = phaseTotals[pn];
    const pct = ((time / totalTime) * 100).toFixed(1);
    const perWord = (time / wordCount).toFixed(2);
    const celEvals = phaseCelEvals[pn];
    console.log(
      `${pn.padEnd(25)}${time.toFixed(0).padStart(10)}  ${perWord.padStart(10)}  ${pct.padStart(5)}%  ${String(celEvals).padStart(11)}`
    );
  }

  // --- Section 3: Top Rules by Time ---
  console.log("\n\n=== Top 20 Rules by Total Time ===\n");

  // Flatten all rules across phases
  const allRules: { phase: string; rule: string; time: number }[] = [];
  for (const pn of phaseNames) {
    for (const [rule, time] of Object.entries(phaseRuleTotals[pn])) {
      allRules.push({ phase: pn, rule, time });
    }
  }
  allRules.sort((a, b) => b.time - a.time);

  console.log("Rule".padEnd(40) + "Phase".padEnd(20) + "Total(ms)".padStart(10) + "  ms/word".padStart(10) + "  % of total".padStart(12));
  console.log("-".repeat(92));
  for (const { phase, rule, time } of allRules.slice(0, 20)) {
    const pct = ((time / totalTime) * 100).toFixed(1);
    const perWord = (time / wordCount).toFixed(3);
    console.log(
      `${rule.padEnd(40)}${phase.padEnd(20)}${time.toFixed(1).padStart(10)}  ${perWord.padStart(10)}  ${pct.padStart(11)}%`
    );
  }

  // --- Section 4: CEL Evaluation Stats ---
  console.log("\n\n=== CEL Evaluation Statistics ===\n");
  console.log(`Total CEL evaluations:     ${totalCelEvals}`);
  console.log(`  Per word (avg):          ${(totalCelEvals / wordCount).toFixed(1)}`);
  console.log(`Expression cache hits:     ${totalCelHits}`);
  console.log(`Expression cache misses:   ${totalCelMisses}`);
  if (totalCelHits + totalCelMisses > 0) {
    const hitRate = (totalCelHits / (totalCelHits + totalCelMisses) * 100).toFixed(1);
    console.log(`Cache hit rate:            ${hitRate}%`);
  }

  // --- Section 5: Per-Phase CEL evals breakdown ---
  console.log("\n=== CEL Evaluations by Phase ===\n");
  for (const pn of phaseNames) {
    const evals = phaseCelEvals[pn];
    const perWord = (evals / wordCount).toFixed(1);
    console.log(`  ${pn.padEnd(25)} ${String(evals).padStart(8)} total  ${perWord.padStart(8)}/word`);
  }

  // --- Section 6: Single-word deep dive ---
  console.log("\n\n=== Single-Word Deep Dive: 'hello' ===\n");
  const normalized = normalizeText("hello");
  const phonemes = transcribeText(normalized);
  let paramSeq = buildParameterSequence(phonemes);
  console.log(`Phoneme tokens: ${paramSeq.length}`);

  for (const phaseSpec of [
    { phases: ["postlexical"], key: "postlexical" },
    { phases: ["structural"], key: "structural" },
    { phases: ["duration"], key: "duration" },
  ]) {
    if (phaseSpec.key === "prosody") {
      paramSeq = paramSeq.map((token: FrontendToken, index: number) => ({
        ...token,
        id: token.id ?? `ph_${index}`,
        stream: "phone",
        status: token.status ?? 1,
      }));
    }
    resetCelCounters();
    const t = performance.now();
    const result = runDeclarativeFrontend(paramSeq, {
      ...inventory,
      phases: phaseSpec.phases,
      includeTrace: true,
    }) as { sequence: FrontendToken[]; trace?: FrontendToken[] };
    const elapsed = performance.now() - t;
    const celEvals = getCelEvalCount();

    console.log(`\n  Phase: ${phaseSpec.key} (${elapsed.toFixed(2)}ms, ${celEvals} CEL evals)`);
    const ruleTimings: { rule: string; elapsed: number }[] = [];
    for (const event of result.trace ?? []) {
      if (event.type === "rule_end" && typeof event.elapsed === "number") {
        ruleTimings.push({ rule: event.rule as string, elapsed: event.elapsed as number });
      }
    }
    for (const { rule, elapsed: ruleMs } of ruleTimings) {
      console.log(`    ${rule.padEnd(40)} ${ruleMs.toFixed(3).padStart(8)}ms`);
    }
    paramSeq = result.sequence;
  }

  // Re-ID before prosody+finalize
  paramSeq = paramSeq.map((token: FrontendToken, index: number) => ({
    ...token,
    id: token.id ?? `ph_${index}`,
    stream: "phone",
    status: token.status ?? 1,
  }));

  resetCelCounters();
  const t = performance.now();
  const result = runDeclarativeFrontend(paramSeq, {
    ...inventory,
    phases: ["prosody", "finalize"],
    includeTrace: true,
    parameters: {
      policy: {
        f0: {
          base_hz: 110,
          fall_rate_hz: 20,
          stress_rise: 1.15,
          question_rise_hz: 30,
        },
      },
    },
  }) as { sequence: FrontendToken[]; trace?: FrontendToken[] };
  const elapsed = performance.now() - t;
  const celEvals = getCelEvalCount();

  console.log(`\n  Phase: prosody+finalize (${elapsed.toFixed(2)}ms, ${celEvals} CEL evals)`);
  const ruleTimings: { rule: string; elapsed: number }[] = [];
  for (const event of result.trace ?? []) {
    if (event.type === "rule_end" && typeof event.elapsed === "number") {
      ruleTimings.push({ rule: event.rule as string, elapsed: event.elapsed as number });
    }
  }
  for (const { rule, elapsed: ruleMs } of ruleTimings) {
    console.log(`    ${rule.padEnd(40)} ${ruleMs.toFixed(3).padStart(8)}ms`);
  }
}

main().catch(console.error);
