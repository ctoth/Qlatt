#!/usr/bin/env node
/**
 * Profile textToKlattTrack() performance.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/profile-tts.ts
 *
 * For CPU profiling:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node --cpu-prof scripts/profile-tts.ts
 */

import { performance } from "node:perf_hooks";
import { textToKlattTrack } from "../src/tts-frontend";
import {
  preloadCmuDictionaryFromPath,
  DEFAULT_CMU_DICTIONARY_PATH,
} from "../src/cmu-dictionary-loader";

// ---- Configuration ----
const WORD_COUNT = 500;
const WARMUP_COUNT = 5; // warmup words before timing

async function main() {
  // Suppress console.warn spam from the pipeline (e.g. "word not found in dictionary")
  const originalWarn = console.warn;
  console.warn = () => {};

  console.log("=== textToKlattTrack() Performance Profile ===\n");

  // Step 1: Load dictionary and get words
  console.log("Loading CMU dictionary...");
  const t0 = performance.now();
  const dict = await preloadCmuDictionaryFromPath(DEFAULT_CMU_DICTIONARY_PATH);
  const dictLoadTime = performance.now() - t0;
  console.log(`Dictionary loaded in ${dictLoadTime.toFixed(1)}ms`);

  const allWords = Object.keys(dict);
  console.log(`Dictionary size: ${allWords.length} words`);

  // Take first N words deterministically
  const testWords = allWords.slice(0, WORD_COUNT);
  console.log(`Testing with ${testWords.length} words\n`);

  // Step 2: Warmup (to ensure CEL expression cache is populated, JIT, etc.)
  console.log("Warming up...");
  let warmupErrors = 0;
  for (let i = 0; i < WARMUP_COUNT; i++) {
    try {
      textToKlattTrack(testWords[i]);
    } catch {
      warmupErrors++;
    }
  }
  console.log(`Warmup done (${warmupErrors} errors).\n`);

  // Step 3: Profile individual words
  const timings: number[] = [];
  const slowWords: Array<{ word: string; time: number }> = [];
  let errorCount = 0;

  console.log(`Profiling ${testWords.length} words...`);
  const totalStart = performance.now();

  for (const word of testWords) {
    const start = performance.now();
    try {
      textToKlattTrack(word);
    } catch {
      errorCount++;
    }
    const elapsed = performance.now() - start;
    timings.push(elapsed);

    if (elapsed > 50) {
      slowWords.push({ word, time: elapsed });
    }
  }

  const totalElapsed = performance.now() - totalStart;

  // Step 4: Compute stats
  timings.sort((a, b) => a - b);
  const sum = timings.reduce((a, b) => a + b, 0);
  const mean = sum / timings.length;
  const median = timings[Math.floor(timings.length / 2)];
  const p95 = timings[Math.floor(timings.length * 0.95)];
  const p99 = timings[Math.floor(timings.length * 0.99)];
  const min = timings[0];
  const max = timings[timings.length - 1];

  console.log("\n=== Results ===\n");
  console.log(`Errors: ${errorCount} / ${testWords.length} words`);
  console.log(`Total time: ${totalElapsed.toFixed(1)}ms for ${testWords.length} words`);
  console.log(`Average: ${mean.toFixed(2)}ms per word`);
  console.log(`Median:  ${median.toFixed(2)}ms per word`);
  console.log(`Min:     ${min.toFixed(2)}ms`);
  console.log(`Max:     ${max.toFixed(2)}ms`);
  console.log(`P95:     ${p95.toFixed(2)}ms`);
  console.log(`P99:     ${p99.toFixed(2)}ms`);
  console.log(`Throughput: ${(1000 / mean).toFixed(0)} words/sec`);

  if (slowWords.length > 0) {
    console.log(`\nSlowest words (>50ms):`);
    slowWords
      .sort((a, b) => b.time - a.time)
      .slice(0, 10)
      .forEach(({ word, time }) => console.log(`  ${word}: ${time.toFixed(1)}ms`));
  }

  // Step 5: Distribution histogram
  const buckets = [0, 1, 2, 5, 10, 20, 50, 100, 200, Infinity];
  const histogram: Record<string, number> = {};
  for (let i = 0; i < buckets.length - 1; i++) {
    const label = buckets[i + 1] === Infinity
      ? `${buckets[i]}ms+`
      : `${buckets[i]}-${buckets[i + 1]}ms`;
    histogram[label] = 0;
  }

  for (const t of timings) {
    for (let i = 0; i < buckets.length - 1; i++) {
      if (t >= buckets[i] && t < buckets[i + 1]) {
        const label = buckets[i + 1] === Infinity
          ? `${buckets[i]}ms+`
          : `${buckets[i]}-${buckets[i + 1]}ms`;
        histogram[label]++;
        break;
      }
    }
  }

  console.log("\n=== Distribution ===\n");
  for (const [label, count] of Object.entries(histogram)) {
    const bar = "#".repeat(Math.ceil(count / testWords.length * 50));
    const pct = ((count / testWords.length) * 100).toFixed(1);
    console.log(`  ${label.padEnd(12)} ${String(count).padStart(4)} (${pct.padStart(5)}%) ${bar}`);
  }

  // Step 6: Measure first-call vs subsequent-call overhead
  console.log("\n=== First-call vs cached overhead ===\n");
  // Pick a word not in the test set
  const freshWord = allWords[WORD_COUNT + 100] || "supercalifragilistic";
  // Force a fresh test (expressionCache should already be warm from earlier runs)
  const firstStart = performance.now();
  try { textToKlattTrack(freshWord); } catch {}
  const firstTime = performance.now() - firstStart;

  const secondStart = performance.now();
  try { textToKlattTrack(freshWord); } catch {}
  const secondTime = performance.now() - secondStart;

  console.log(`First call  for "${freshWord}": ${firstTime.toFixed(2)}ms`);
  console.log(`Second call for "${freshWord}": ${secondTime.toFixed(2)}ms`);

  // Step 7: Batch of 5000 to match original test conditions
  console.log("\n=== Batch of 5000 words ===\n");
  const batchWords = allWords.slice(0, 5000);
  let batchErrors = 0;
  const batchStart = performance.now();
  for (const word of batchWords) {
    try { textToKlattTrack(word); } catch { batchErrors++; }
  }
  const batchTime = performance.now() - batchStart;
  console.log(`5000 words: ${batchTime.toFixed(0)}ms total (${batchErrors} errors)`);
  console.log(`Average: ${(batchTime / 5000).toFixed(2)}ms per word`);
  console.log(`Throughput: ${(5000 / (batchTime / 1000)).toFixed(0)} words/sec`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
