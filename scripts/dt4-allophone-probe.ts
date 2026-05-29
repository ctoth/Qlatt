// dt-4 allophone probe (DECtalk 4.63 ph_aloph.c US branch).
//
// Renders phrases through the dectalk-english frontend and prints the phoneme
// sequence so we can confirm three allophone rewrites added in chunk dt-4, plus
// that they do not double-apply with the dt-3 flapping rule:
//
//   PALATALIZATION (ph_aloph.c:878-891): /t/ -> CH, /d/ -> JH before unstressed
//     /y/ ("got you" -> ...CH..., "did you" -> ...JH...).
//   GLOTTALIZATION (ph_aloph.c:912-927): /t/ -> TX when preceded by a sonorant in
//     a glottalizing context (next == EN/DH/L/word-boundary sonorant), else -> D.
//     The signature case is /t/ before a syllabic nasal EN ("button").
//   DENTALIZATION (ph_aloph.c:1066-1082): unstressed /dh/ -> DZ after /t,tx,d/
//     ("at the" -> ...TX DZ...).
//
// Run: npx tsx scripts/dt4-allophone-probe.ts
import { textToKlattTrackDetailed } from "../src/tts-frontend";

type Case = { phrase: string; expect: string; want: RegExp | null; reject?: RegExp };

const CASES: Case[] = [
  // --- PALATALIZATION (should rewrite) ---
  { phrase: "got you now", expect: "T before /y/ -> CH", want: /\bCH\b/ },
  { phrase: "did you go", expect: "D before /y/ -> JH", want: /\bJH\b/ },
  { phrase: "i bet you can", expect: "T before /y/ -> CH", want: /\bCH\b/ },
  { phrase: "would you mind", expect: "D before /y/ -> JH", want: /\bJH\b/ },
  // --- PALATALIZATION (should NOT) ---
  { phrase: "a yellow boat", expect: "no /t,d/ before /y/: no CH/JH from this rule", want: null, reject: /\bCH\b|\bJH\b/ },

  // --- GLOTTALIZATION (should -> TX, and must NOT also flap to DF) ---
  // "certain" (dict: S ER T EN): /t/ before syllabic EN, prev /er/ sonorant, n-2 = /s/
  // (not labial) -> TX.  No word-count gate on glottalization, so a single word works.
  { phrase: "certain", expect: "/t/ before EN, prev sonorant, n-2 non-labial -> TX (not DF)", want: /\bTX\b/, reject: /\bDF\b/ },
  { phrase: "a curtain rod here", expect: "/t/ before EN -> TX (not DF)", want: /\bTX\b/, reject: /\bDF\b/ },
  { phrase: "the atlas book", expect: "/t/ before /l/ (USP_LL clause) -> TX", want: /\bTX\b/, reject: /\bDF\b/ },
  // --- GLOTTALIZATION (should NOT glottalize) ---
  // "button" (B AH T EN): /t/ before EN, BUT phonemes[n-2] = /b/ is LABIAL, so the
  // DECtalk FLABIAL guard (ph_aloph.c:912) blocks glottalization; flapping catches it
  // instead (-> DF) in a 3+ word phrase.  Faithful to the source.
  { phrase: "press the button now", expect: "/t/ before EN but n-2 = /b/ LABIAL -> NO TX (DECtalk guard); flaps to DF", want: null, reject: /\bTX\b/ },
  { phrase: "an attic fan here", expect: "/t/ before /ih/, not a glottalizing context -> no TX", want: null, reject: /\bTX\b/ },

  // --- DENTALIZATION (should -> DZ) ---
  { phrase: "at the door now", expect: "/dh/ after /t/(->TX) -> DZ", want: /\bDZ\b/ },
  { phrase: "let the dog out", expect: "/dh/ after /t/(->TX) -> DZ", want: /\bDZ\b/ },
  // --- DENTALIZATION (should NOT) ---
  { phrase: "this is the box", expect: "/dh/ not after /t,tx,d/ -> stays DH", want: null, reject: /\bDZ\b/ },
];

function phonemeSeq(phrase: string): string {
  const detailed = textToKlattTrackDetailed(phrase, undefined, 30, {
    frontendId: "dectalk-english",
  });
  return detailed.frontendPhones
    .map((p) => (typeof p.stress === "number" ? `${p.phoneme}/${p.stress}` : p.phoneme))
    .join(" ");
}

let failures = 0;
for (const c of CASES) {
  const seq = phonemeSeq(c.phrase);
  const wantOk = c.want == null ? true : c.want.test(seq);
  const rejectOk = c.reject == null ? true : !c.reject.test(seq);
  const ok = wantOk && rejectOk;
  if (!ok) failures += 1;
  console.log(`\n"${c.phrase}"`);
  console.log(`  expect: ${c.expect}`);
  console.log(`  phones: ${seq}`);
  if (c.want) console.log(`  has ${c.want}: ${c.want.test(seq)}`);
  if (c.reject) console.log(`  must-not-have ${c.reject}: ${!c.reject.test(seq)}`);
  console.log(`  ${ok ? "OK" : "MISMATCH"}`);
}
console.log(`\n${failures === 0 ? "ALL EXPECTATIONS MET" : failures + " MISMATCH(es)"}`);
process.exit(0);
