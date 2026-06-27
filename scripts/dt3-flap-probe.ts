// dt-3 flapping probe.
//
// Renders phrases through the dectalk-english frontend and prints the phoneme
// sequence so we can confirm DECtalk A18 flapping (ph_aloph.c:958-1040):
//   intervocalic unstressed /t/ -> DF, /d/ -> DX, gated on >= 3 words.
//
// SHOULD flap: the /t,d/ becomes DF/DX in a 3+ word phrase when intervocalic
//   and unstressed ("better butter", "a city of", ...).
// SHOULD NOT flap: word-initial /t/ ("tea"), stressed /t/ ("attack"), and
//   anything in a phrase of fewer than three words (the number_words gate).
//
// Run: npx tsx scripts/dt3-flap-probe.ts
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const CASES: Array<{ phrase: string; expect: string }> = [
  // --- SHOULD flap (3+ words, intervocalic unstressed /t/ or /d/) ---
  { phrase: "a butter knife", expect: "T->DF inside 'butter'" },
  { phrase: "a better idea", expect: "T->DF inside 'better'" },
  { phrase: "a city of light", expect: "T->DF inside 'city'" },
  { phrase: "a glass of water", expect: "T->DF inside 'water'" },
  { phrase: "a ladder and rope", expect: "D->DX inside 'ladder'" },
  // --- SHOULD NOT flap ---
  { phrase: "a cup of tea", expect: "word-initial /t/ in 'tea' stays T" },
  { phrase: "a strong attack now", expect: "stressed /t/ in 'attack' stays T" },
  { phrase: "butter", expect: "single word < 3 words: gate blocks, stays T" },
  { phrase: "the butter", expect: "two words < 3: gate blocks, stays T" },
];

function phonemeSeq(phrase: string): string {
  const detailed = textToKlattTrackDetailed(phrase, undefined, 30, {
    frontendId: "dectalk-english",
  });
  return detailed.frontendPhones
    .map((p) => (typeof p.stress === "number" ? `${p.phoneme}/${p.stress}` : p.phoneme))
    .join(" ");
}

let exit = 0;
for (const c of CASES) {
  const seq = phonemeSeq(c.phrase);
  const flapped = /\bD[FX]\b/.test(seq);
  console.log(`\n"${c.phrase}"`);
  console.log(`  expect: ${c.expect}`);
  console.log(`  phones: ${seq}`);
  console.log(`  has DF/DX: ${flapped}`);
}
process.exit(exit);
