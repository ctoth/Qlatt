// dt-11 duration-rule probe.
//
// Runs the dectalk-english frontend over words that exercise the newly-ported /
// corrected segmental duration rules and prints per-segment durations (ms).
// Demonstrates the syllable-keyed rules now use the real syllabification
// (syllable_position_in_word) rather than the old vowel-lookback approximation:
//   - monosyllable ("cat") vs the same /ae/ vowel in a medial syllable of a
//     polysyllable ("category") -> the medial vowel is shorter (Rule 4/5/7).
//   - first vs medial vs last syllable vowels of a polysyllable.
//   - Rule 24 ("running" -> vowel before NG shortened).
//   - Rule 10 ("react" two-vowel hiatus first vowel lengthened).
//
// Run: npx tsx scripts/dt11-duration-probe.ts
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const WORDS = [
  "cat", // monosyllable: stressed /ae/ -- Rule 4 monosyllable, primary => no shortening
  "category", // polysyllable: /ae/ now first-syllable + medial syllables shortened
  "happy", // 2 syllables: first stressed, last unstressed
  "computer", // 3 syllables: first/medial/last
  "running", // Rule 24: vowel before NG
  "react", // Rule 10: two-vowel hiatus (IY AE)
  "apple", // Rule 11: word-initial stressed vowel of polysyllable
  "writing", // Rule 23: vowel before DF flap (if flapped)
];

function probe(word: string): void {
  const detailed = textToKlattTrackDetailed(word, undefined, 30, {
    frontendId: "dectalk-english",
  });
  const phones = detailed.frontendPhones;
  console.log(`\n"${word}"`);
  for (const p of phones) {
    const pos = p.syllablePositionInWord ?? "-";
    const role = p.syllableRole ?? "-";
    const idx = p.syllableIndex ?? "-";
    const dur = p.durationMs.toFixed(1);
    console.log(
      `  ${p.phoneme.padEnd(7)} dur=${dur.padStart(6)} ms  ` +
        `syll{idx=${idx},role=${role},pos=${pos}}`,
    );
  }
}

for (const w of WORDS) probe(w);
process.exit(0);
