/**
 * Chunk dt-12 probe: verify dectalk-english reads fractions and ordinals the
 * DECtalk way via the per-frontend normalization policy, while qlatt-english
 * keeps its behavior (no fraction step → fractions not expanded; no leak).
 *
 * Run: npx tsx scripts/dt12-number-probe.ts
 *
 * Citations:
 *   DECtalk 4.63 l_us_pr1.c:980-1015 (ls_proc_is_frac),
 *               l_us_pr1.c:1034-1069 (ls_proc_do_frac),
 *               ls_util.c:517-572 (ls_util_is_ordinal).
 *
 * NOTE on Roman numerals: the DECtalk 4.63 Reference Guide documents
 * "Roman numerals following a name -> ordinal" but the 4.63 LTS C source
 * implements NO Roman-numeral handler (no ls_proc_*roman; ls_util_is_name is an
 * ACNA name-mode flag, not a Roman parser). Per the source, this chunk does NOT
 * implement Roman numerals.
 *
 * NOTE on fractions: DECtalk special-cases ONLY denominator "2" (half/halves);
 * every other denominator reads as an ordinal + plural "s", so "3/4" ->
 * "three fourths" (NOT the colloquial "three quarters"). This probe asserts the
 * actual source behavior.
 */
import { normalizeText } from "../src/g2p/text-normalize";

// dectalk-english declares its own normalization tables + pipeline (DATA).
const DECTALK_CONFIG = {
  tablesPath: "/rules/frontends/dectalk-english/normalization-tables.yaml",
  pipelinePath: "/rules/frontends/dectalk-english/normalization-pipeline.yaml",
};

// Expected dectalk-english output per DECtalk source (full normalized string).
const dectalkExpect: Record<string, string> = {
  // Fractions
  "1/2": "one half",
  "3/4": "three fourths",
  "5/8": "five eighths",
  "1/3": "one third",
  // DECtalk: numerator cardinal "one" + denominator-as-ordinal "one hundredth"
  // (ls_proc_do_number(denom, TRUE) reads 100 as "one hundredth"). So the full
  // fraction is "one one hundredth", matching ls_proc_do_frac (l_us_pr1.c:1044-1056).
  "1/100": "one one hundredth",
  "3/4%": "three fourths percent",
  "2/2": "two halves",
  // Ordinals (already handled via expand_ordinals; confirm dectalk keeps them)
  "21st": "twenty first",
  "the 1st": "the first",
  "2nd place": "second place",
};

// qlatt-english (default; NO fraction step). Fractions are NOT expanded as a
// unit; the "/" is stripped and each digit run is read as a cardinal. Ordinals
// DO work in qlatt-english too (it has expand_ordinals). The key no-leak check:
// the FRACTION cases must differ from dectalk (fractions not expanded).
const qlattExpect: Record<string, string> = {
  "1/2": "one two",
  "3/4": "three four",
  "5/8": "five eight",
  "1/3": "one three",
  "1/100": "one one hundred",
  "3/4%": "three four",
  "2/2": "two two",
  // Ordinals: qlatt-english also expands these (shared behavior, not a leak).
  "21st": "twenty first",
  "the 1st": "the first",
  "2nd place": "second place",
};

let failures = 0;

console.log("=== dectalk-english (fractions ON) ===");
for (const input of Object.keys(dectalkExpect)) {
  const out = normalizeText(input, DECTALK_CONFIG);
  const expected = dectalkExpect[input];
  const status = out === expected ? "PASS" : "FAIL";
  if (status === "FAIL") failures++;
  console.log(`  [${status}] ${JSON.stringify(input)} -> ${JSON.stringify(out)}`);
  if (status === "FAIL") console.log(`         expected ${JSON.stringify(expected)}`);
}

console.log("\n=== qlatt-english (default; NO fraction step — must not expand fractions) ===");
for (const input of Object.keys(qlattExpect)) {
  const out = normalizeText(input); // default = qlatt-english
  const expected = qlattExpect[input];
  const status = out === expected ? "PASS" : "FAIL";
  if (status === "FAIL") failures++;
  console.log(`  [${status}] ${JSON.stringify(input)} -> ${JSON.stringify(out)}`);
  if (status === "FAIL") console.log(`         expected ${JSON.stringify(expected)}`);
}

console.log(
  `\n${failures === 0 ? "ALL PROBE ASSERTIONS PASSED" : `${failures} PROBE ASSERTION(S) FAILED`}`,
);
process.exit(failures === 0 ? 0 : 1);
