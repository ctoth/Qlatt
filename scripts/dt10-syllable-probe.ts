// dt-10 syllabification probe.
//
// Runs the dectalk-english frontend (which now carries a `syllabification:`
// table block + an `annotation` phase) over a word list and prints each phone
// token's syllable_index / syllable_role / syllable_position_in_word, grouped
// into syllables.  Demonstrates maximal onset-maximization and affix handling.
//
// The DECtalk maximal-onset + affix algorithm is implemented generically in
// src/declarative-frontend/syllabify.ts; the linguistic DATA (onset clusters,
// nuclei, affixes, ARPABET->ascky map) lives in the pipeline `syllabification:`
// block, extracted from p_us_sy1.c by scripts/dt10-extract-syllable-tables.ts.
//
// Run: npx tsx scripts/dt10-syllable-probe.ts
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const WORDS = [
  "computer",
  "happy",
  "apple",
  "strength",
  "running",
  "secret",
  "napkin",
  "button",
  "shipment",
  "car",
  "fear",
];

function probe(word: string): void {
  const detailed = textToKlattTrackDetailed(word, undefined, 30, {
    frontendId: "dectalk-english",
  });
  const phones = detailed.frontendPhones;

  // Group phones (skip SIL / dummy carriers) by syllable_index for display.
  const bySyll = new Map<number, string[]>();
  let nucleusCount = 0;
  const perTok: string[] = [];
  for (const p of phones) {
    const role = p.syllableRole ?? "-";
    const sidx = p.syllableIndex;
    const pos = p.syllablePositionInWord ?? "-";
    perTok.push(
      `${p.phoneme}{idx=${sidx ?? "-"},role=${role},pos=${pos}}`,
    );
    if (typeof sidx === "number") {
      if (!bySyll.has(sidx)) bySyll.set(sidx, []);
      bySyll.get(sidx)!.push(p.phoneme);
    }
    if (role === "nucleus") nucleusCount++;
  }
  const syllStr = [...bySyll.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, ps]) => "[" + ps.join(" ").toLowerCase() + "]")
    .join("");
  const sylCount = bySyll.size;

  console.log(`\n"${word}"`);
  console.log(`  phones:    ${perTok.join(" ")}`);
  console.log(`  syllables: ${syllStr}  (count=${sylCount}, nuclei=${nucleusCount})`);
}

for (const w of WORDS) probe(w);
console.log("\n(byte-identity: these annotations are not read by the render path)");
process.exit(0);
