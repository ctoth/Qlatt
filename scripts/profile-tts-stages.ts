#!/usr/bin/env node
/**
 * Stage-level profiling of textToKlattTrack() pipeline.
 *
 * This script measures time spent in each pipeline stage by importing
 * the individual functions and timing them directly. The stages mirror
 * the actual textToKlattTrack() implementation in src/tts-frontend.ts.
 *
 * Usage:
 *   npx tsx scripts/profile-tts-stages.ts
 */

import { performance } from "node:perf_hooks";
import { normalizeText } from "../src/g2p/text-normalize";
import { transcribeText } from "../src/tts-frontend";
import {
  PHONEME_TARGETS,
  materializePhonemeTarget,
} from "../src/declarative-frontend/inventory";
import { runDeclarativeFrontend } from "../src/declarative-frontend";
import { assembleKlattTrack } from "../src/track-assembler";
import { QLATT_V12_CEL_RULEPACK } from "../src/declarative-frontend/rule-pack";
import {
  preloadCmuDictionaryFromPath,
  DEFAULT_CMU_DICTIONARY_PATH,
} from "../src/cmu-dictionary-loader";

// Suppress console.warn spam
console.warn = () => {};

const PHONEME_TARGET_MAP = PHONEME_TARGETS as Record<string, Record<string, any> | undefined>;

type FrontendToken = Record<string, any>;

// Extract output config from rulepack (mirrors tts-frontend.ts)
const RULEPACK_OUTPUT_CONFIG = (QLATT_V12_CEL_RULEPACK as any)?.output ?? undefined;

/**
 * Build parameter sequence using materializePhonemeTarget -- mirrors the
 * actual pipeline in textToKlattTrack (tts-frontend.ts:67-108).
 */
function buildParameterSequence(phonemeList: FrontendToken[]): FrontendToken[] {
  return phonemeList.map((ph, index) => {
    const targetKeyBase = ph.phoneme;
    const materialized = materializePhonemeTarget(targetKeyBase, { stress: ph.stress });
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
  console.log("=== Stage-Level Pipeline Profile ===\n");

  const dict = await preloadCmuDictionaryFromPath(DEFAULT_CMU_DICTIONARY_PATH);
  const allWords = Object.keys(dict);
  const WORD_COUNT = 200;
  const testWords = allWords.slice(0, WORD_COUNT);
  console.log(`Testing ${testWords.length} words\n`);

  // Warmup
  for (let i = 0; i < 5; i++) {
    try {
      const normalized = normalizeText(testWords[i]);
      const phonemes = transcribeText(normalized);
      const paramSeq = buildParameterSequence(phonemes);
      const inventory = { inventoryResolver: materializePhonemeTarget };
      runDeclarativeFrontend(paramSeq, { ...inventory, phases: ["structural"] });
    } catch {}
  }

  // Accumulators
  const stageTimings: Record<string, number> = {
    normalizeText: 0,
    transcribeText: 0,
    buildParameterSequence: 0,
    "runPhases(postlexical)": 0,
    "runPhases(structural)": 0,
    "runPhases(duration)": 0,
    reIdAndTag: 0,
    "runPhases(prosody+finalize)": 0,
    filterPhoneSequence: 0,
    assembleKlattTrack: 0,
  };
  let errorCount = 0;
  const inventory = { inventoryResolver: materializePhonemeTarget };

  const totalStart = performance.now();

  for (const word of testWords) {
    try {
      // Stage 1: normalizeText
      let t = performance.now();
      const normalized = normalizeText(word);
      stageTimings.normalizeText += performance.now() - t;

      // Stage 2: transcribeText
      t = performance.now();
      const phonemes = transcribeText(normalized);
      stageTimings.transcribeText += performance.now() - t;

      // Stage 3: buildParameterSequence (uses materializePhonemeTarget)
      t = performance.now();
      let parameterSequence = buildParameterSequence(phonemes);
      stageTimings.buildParameterSequence += performance.now() - t;

      // Stage 4: runPhases(postlexical) -- t-flapping, the-reduction
      t = performance.now();
      parameterSequence = runDeclarativeFrontend(parameterSequence, {
        ...inventory,
        phases: ["postlexical"],
      }) as FrontendToken[];
      stageTimings["runPhases(postlexical)"] += performance.now() - t;

      // Stage 5: runPhases(structural)
      t = performance.now();
      parameterSequence = runDeclarativeFrontend(parameterSequence, {
        ...inventory,
        phases: ["structural"],
      }) as FrontendToken[];
      stageTimings["runPhases(structural)"] += performance.now() - t;

      // Stage 6: runPhases(duration)
      t = performance.now();
      parameterSequence = runDeclarativeFrontend(parameterSequence, {
        ...inventory,
        phases: ["duration"],
      }) as FrontendToken[];
      stageTimings["runPhases(duration)"] += performance.now() - t;

      // Stage 7: re-ID and stream tagging
      t = performance.now();
      parameterSequence = parameterSequence.map((token: FrontendToken, index: number) => ({
        ...token,
        id: token.id ?? `ph_${index}`,
        stream: "phone",
        status: token.status ?? 1,
      }));
      stageTimings.reIdAndTag += performance.now() - t;

      // Stage 8: runPhases(prosody + finalize)
      t = performance.now();
      parameterSequence = runDeclarativeFrontend(parameterSequence, {
        ...inventory,
        phases: ["prosody", "finalize"],
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
      }) as FrontendToken[];
      stageTimings["runPhases(prosody+finalize)"] += performance.now() - t;

      // Stage 9: filter phone sequence
      t = performance.now();
      const phoneSequence = parameterSequence.filter(
        (token: FrontendToken) => token?.stream !== "f0" && token?.status !== 2
      );
      stageTimings.filterPhoneSequence += performance.now() - t;

      // Stage 10: assembleKlattTrack
      t = performance.now();
      assembleKlattTrack(phoneSequence, parameterSequence, {
        baseF0: 110,
        transitionMs: 30,
        outputConfig: RULEPACK_OUTPUT_CONFIG,
      });
      stageTimings.assembleKlattTrack += performance.now() - t;

    } catch {
      errorCount++;
    }
  }

  const totalTime = performance.now() - totalStart;

  console.log("=== Stage Breakdown ===\n");
  console.log(`Total: ${totalTime.toFixed(0)}ms for ${testWords.length} words (${errorCount} errors)\n`);

  const entries = Object.entries(stageTimings).sort((a, b) => b[1] - a[1]);
  const stageTotal = entries.reduce((sum, [_, time]) => sum + time, 0);

  for (const [stage, time] of entries) {
    const pct = ((time / totalTime) * 100).toFixed(1);
    const perWord = (time / testWords.length).toFixed(2);
    const bar = "#".repeat(Math.ceil(time / totalTime * 50));
    console.log(`  ${stage.padEnd(30)} ${time.toFixed(0).padStart(7)}ms  ${pct.padStart(5)}%  ${perWord.padStart(6)}ms/word  ${bar}`);
  }

  console.log(`\n  ${"(measured stage overhead)".padEnd(30)} ${(totalTime - stageTotal).toFixed(0).padStart(7)}ms  ${(((totalTime - stageTotal) / totalTime) * 100).toFixed(1).padStart(5)}%`);

  // Drill into which rules within each phase are slow
  console.log("\n\n=== Per-Rule Timing Drill-Down (single word 'hello') ===\n");
  const normalized = normalizeText("hello");
  const phonemes = transcribeText(normalized);
  let paramSeq = buildParameterSequence(phonemes);
  console.log(`Phoneme count: ${paramSeq.length}`);

  for (const phaseName of [["postlexical"], ["structural"], ["duration"], ["prosody", "finalize"]]) {
    // Re-ID before prosody+finalize (mirrors real pipeline)
    if (phaseName[0] === "prosody") {
      paramSeq = paramSeq.map((token: FrontendToken, index: number) => ({
        ...token,
        id: token.id ?? `ph_${index}`,
        stream: "phone",
        status: token.status ?? 1,
      }));
    }

    const t = performance.now();
    const result = runDeclarativeFrontend(paramSeq, {
      ...inventory,
      phases: phaseName,
      includeTrace: true,
      ...(phaseName[0] === "prosody"
        ? {
            parameters: {
              policy: {
                f0: { base_hz: 110, fall_rate_hz: 20, stress_rise: 1.15, question_rise_hz: 30 },
              },
            },
          }
        : {}),
    }) as { sequence: FrontendToken[]; trace?: FrontendToken[] };
    const elapsed = performance.now() - t;
    const trace = result.trace ?? [];
    const traceCount = trace.length;

    console.log(`\n  ${phaseName.join("+").padEnd(25)} ${elapsed.toFixed(2)}ms  ${traceCount} trace events`);

    // Extract per-rule timing from trace events
    const ruleTimings: { rule: string; elapsed: number }[] = [];
    for (const event of trace) {
      if (event.type === "rule_end" && typeof event.elapsed === "number") {
        ruleTimings.push({ rule: event.rule as string, elapsed: event.elapsed as number });
      }
    }
    if (ruleTimings.length > 0) {
      ruleTimings.sort((a, b) => b.elapsed - a.elapsed);
      for (const { rule, elapsed: ruleMs } of ruleTimings) {
        const bar = "#".repeat(Math.max(1, Math.ceil(ruleMs / elapsed * 30)));
        console.log(`    ${rule.padEnd(35)} ${ruleMs.toFixed(3).padStart(8)}ms  ${bar}`);
      }
    }

    paramSeq = result.sequence;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
