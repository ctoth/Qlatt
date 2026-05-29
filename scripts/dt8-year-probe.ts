/**
 * Chunk dt-8 probe: verify dectalk-english reads 4-digit years the DECtalk way
 * via the per-frontend normalization policy, while qlatt-english keeps its
 * cardinal-only behavior (no leak).
 *
 * Run: npx tsx scripts/dt8-year-probe.ts
 *
 * Citation: DECtalk 4.63 ls_util.c:598-622 (is_year),
 *           l_us_pr1.c:367-398 (ls_proc_do_4_digits).
 */
import { normalizeText } from "../src/g2p/text-normalize";

// dectalk-english declares its own normalization tables + pipeline (DATA).
const DECTALK_CONFIG = {
  tablesPath: "/rules/frontends/dectalk-english/normalization-tables.yaml",
  pipelinePath: "/rules/frontends/dectalk-english/normalization-pipeline.yaml",
};

const inputs = [
  "in 1984",
  "the year 1066",
  "born in 1905",
  "by 2000",
  "around 2005",
  "it is 1900",
  // Extra coverage of the predicate / speaking forms:
  "the 2025 season",
  "year 2010",
  "code 0100",
];

// Expected dectalk year reading per recon §1.2 (NOT exhaustive of full output,
// just the year token). Asserted below.
const dectalkExpect: Record<string, string> = {
  "in 1984": "in nineteen eighty four",
  "the year 1066": "the year ten sixty six",
  "born in 1905": "born in nineteen zero five",
  "by 2000": "by two thousand",
  "around 2005": "around two thousand five",
  "it is 1900": "it is nineteen hundred",
  "the 2025 season": "the twenty twenty five season",
  "year 2010": "year twenty ten",
  "code 0100": "code one hundred",
};

let failures = 0;

console.log("=== dectalk-english (year policy ON) ===");
for (const input of inputs) {
  const out = normalizeText(input, DECTALK_CONFIG);
  const expected = dectalkExpect[input];
  const status = expected === undefined ? "    " : out === expected ? "PASS" : "FAIL";
  if (status === "FAIL") failures++;
  console.log(`  [${status}] ${JSON.stringify(input)} -> ${JSON.stringify(out)}`);
  if (status === "FAIL") {
    console.log(`         expected ${JSON.stringify(expected)}`);
  }
}

console.log("\n=== qlatt-english (default; NO year policy — must stay cardinal) ===");
// qlatt-english cardinal expectations: every 4-digit string reads as a cardinal.
const qlattExpect: Record<string, string> = {
  "in 1984": "in one thousand nine hundred eighty four",
  "the year 1066": "the year one thousand sixty six",
  "born in 1905": "born in one thousand nine hundred five",
  "by 2000": "by two thousand",
  "around 2005": "around two thousand five",
  "it is 1900": "it is one thousand nine hundred",
  "the 2025 season": "the two thousand twenty five season",
  "year 2010": "year two thousand ten",
  "code 0100": "code one hundred",
};
for (const input of inputs) {
  const out = normalizeText(input); // default = qlatt-english
  const expected = qlattExpect[input];
  const status = expected === undefined ? "    " : out === expected ? "PASS" : "FAIL";
  if (status === "FAIL") failures++;
  console.log(`  [${status}] ${JSON.stringify(input)} -> ${JSON.stringify(out)}`);
  if (status === "FAIL") {
    console.log(`         expected ${JSON.stringify(expected)}`);
  }
}

console.log(`\n${failures === 0 ? "ALL PROBE ASSERTIONS PASSED" : `${failures} PROBE ASSERTION(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
