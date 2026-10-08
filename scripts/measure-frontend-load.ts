#!/usr/bin/env node

/**
 * measure-frontend-load.ts
 * ========================
 * How long it takes before a frontend can speak: the time a page spends when
 * the frontend is selected. Run it in a fresh process each time; everything it
 * measures is cached afterwards.
 *
 * Reports, in order:
 *   import_ms     importing the frontend modules (this loads and validates the
 *                 default frontend, rule-pack.ts QLATT_ENGLISH_RULEPACK)
 *   load_ms       loadBundledRulepackSpec(<frontend>): read, resolve includes,
 *                 expand macros, normalize, validate, freeze
 *   first_ms      the first textToKlattTrackDetailed call (dictionary, first
 *                 compilation of every expression)
 *   second_ms     the same call again
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/measure-frontend-load.ts [--frontend dectalk-english] ["sentence"]
 *
 * Add `--cpu-prof --cpu-prof-dir=<dir>` after `node` to see where the time
 * goes. Do not time or profile with `tsx`: it wraps every closure in a
 * `__name()` call (esbuild keepNames), which multiplies rule-engine time
 * several times over and shows in a profile as a native call.
 */

export {};

const argv = process.argv.slice(2);
const flagIndex = argv.indexOf("--frontend");
const frontendId = flagIndex >= 0 ? (argv[flagIndex + 1] as string) : "dectalk-english";
const positional =
  flagIndex >= 0 ? [...argv.slice(0, flagIndex), ...argv.slice(flagIndex + 2)] : argv;
const sentence = positional[0] ?? "cat.";

const startImport = performance.now();
const { loadBundledRulepackSpec } = await import("../src/declarative-frontend/rule-pack");
const { textToKlattTrackDetailed } = await import("../src/tts-frontend");
const importMs = performance.now() - startImport;

const startLoad = performance.now();
loadBundledRulepackSpec(frontendId);
const loadMs = performance.now() - startLoad;

const speak = (): number => {
  const start = performance.now();
  textToKlattTrackDetailed(sentence, undefined, 30, { frontendId });
  return performance.now() - start;
};
const firstMs = speak();
const secondMs = speak();

console.log(`frontend ${frontendId}, sentence ${JSON.stringify(sentence)}`);
console.log(`import_ms  ${importMs.toFixed(0).padStart(7)}`);
console.log(`load_ms    ${loadMs.toFixed(0).padStart(7)}`);
console.log(`first_ms   ${firstMs.toFixed(0).padStart(7)}`);
console.log(`second_ms  ${secondMs.toFixed(0).padStart(7)}`);
