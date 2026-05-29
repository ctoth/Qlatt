// dt-9 allophone probe (DECtalk 4.63 ph_aloph.c US branch).
//
// Renders phrases through the dectalk-english frontend and prints the phoneme
// sequence so we can confirm three minor allophone rewrites added in chunk dt-9:
//
//   A1  GEMINATE OBSTRUENT DELETION (ph_aloph.c:558-562): an obstruent identical
//       to the following phoneme is deleted ("bus stop" S S -> one S, "less so"
//       S S -> S, "big game" no -- /g/ != /g/ only fires for IDENTICAL adjacent
//       phonemes).
//   A4  S/Z -> SH/ZH BEFORE SH (ph_aloph.c:715-722): /s,z/ assimilate to the
//       following postalveolar ("this ship" S -> SH, "those shoes" Z -> ZH).
//   A19 SYLLABIC-N AFTER TX (ph_aloph.c:1042-1051): after a glottalized /t/ (TX),
//       an unstressed vowel (not /UW/) + nasal collapse to syllabic EN
//       ("certain", "mountain").
//
// Run: npx tsx scripts/dt9-allophone-probe.ts
import { textToKlattTrackDetailed } from "../src/tts-frontend";

type Case = { phrase: string; expect: string; want: RegExp | null; reject?: RegExp };

const CASES: Case[] = [
  // --- A1 GEMINATE DELETION (should reduce a doubled obstruent to one) ---
  // "this song"? no double.  Use clear identical-obstruent joins.  We assert the
  // doubled obstruent appears only ONCE in the output (the first copy deleted).
  { phrase: "bus stop now", expect: "S S across join -> single S (first deleted)", want: /\bS\b/, reject: /\bS S\b/ },
  { phrase: "less so then", expect: "S S -> single S", want: /\bS\b/, reject: /\bS S\b/ },
  { phrase: "big game today", expect: "G then G but separated by vowel -> no geminate, both /g/ survive", want: /\bG\b/, reject: null },
  // --- A1 (should NOT delete: different adjacent phonemes) ---
  { phrase: "this sport here", expect: "S then S? 'this'=DH IH S, 'sport'=S P -> S S join -> reduce", want: /\bS\b/, reject: /\bS S\b/ },
  { phrase: "a red box now", expect: "no doubled obstruent -> nothing deleted", want: null, reject: null },

  // --- A4 S/Z -> SH/ZH BEFORE SH (should assimilate) ---
  { phrase: "this ship sails", expect: "/s/ of 'this' before SH of 'ship' -> SH (two SH in a row)", want: /\bSH SH\b/ },
  { phrase: "those shoes fit", expect: "/z/ of 'those' before SH of 'shoes' -> ZH", want: /\bZH SH\b/ },
  // --- A4 (should NOT) ---
  { phrase: "this song plays", expect: "/s/ before /s/ not /SH/ -> stays S, no SH", want: null, reject: /\bSH\b/ },

  // --- A19 SYLLABIC-N AFTER TX (should collapse vowel+nasal -> EN) ---
  // "certain" S ER T EN already lexicalizes EN, so use words whose dict form is
  // vowel + N after a /t/ that glottalizes: rely on glottalization producing TX,
  // then the unstressed vowel + N -> EN.  "mountain", "certain" depend on dict.
  { phrase: "a certain way now", expect: "/t/ -> TX then unstressed vowel+N -> EN", want: /TX EN\b/ },
  { phrase: "a kitten sleeps now", expect: "/t/ -> TX then unstressed vowel+N -> EN (dict: K IH T EN)", want: /TX EN\b/ },
  { phrase: "the rotten apple", expect: "/t/ -> TX then vowel+N -> EN", want: /TX EN\b/ },
  // NOTE: 'mountain'/'fountain' transcribe as ...T AH N (a FULL vowel /AH/ before
  // /N/, not a glottalizing context), so the /t/ does NOT glottalize and A19
  // correctly does NOT fire -- the trigger requires the /t/'s right context to be
  // a glottalizing one (EN/L/DH/word-boundary sonorant), per ph_aloph.c:912-927.
  // --- A19 (should NOT fire where prev is not TX) ---
  { phrase: "a happy noun here", expect: "vowel+N but no preceding TX -> no syllabic-EN collapse", want: null, reject: /TX EN\b/ },
];

function phonemeSeq(phrase: string): string {
  const detailed = textToKlattTrackDetailed(phrase, undefined, 30, {
    frontendId: "dectalk-english",
  });
  return detailed.frontendPhones
    .map((p) => (typeof p.stress === "number" ? `${p.phoneme}/${p.stress}` : p.phoneme))
    .join(" ");
}

// Strip stress digits for regex matching on bare phoneme symbols.
function bareSeq(seq: string): string {
  return seq.replace(/\/\d+/g, "");
}

let failures = 0;
for (const c of CASES) {
  const seq = phonemeSeq(c.phrase);
  const bare = bareSeq(seq);
  const wantOk = c.want == null ? true : c.want.test(bare);
  const rejectOk = c.reject == null ? true : !c.reject.test(bare);
  const ok = wantOk && rejectOk;
  if (!ok) failures += 1;
  console.log(`\n"${c.phrase}"`);
  console.log(`  expect: ${c.expect}`);
  console.log(`  phones: ${seq}`);
  if (c.want) console.log(`  has ${c.want}: ${c.want.test(bare)}`);
  if (c.reject) console.log(`  must-not-have ${c.reject}: ${!c.reject.test(bare)}`);
  console.log(`  ${ok ? "OK" : "MISMATCH"}`);
}
console.log(`\n${failures === 0 ? "ALL EXPECTATIONS MET" : failures + " MISMATCH(es)"}`);
process.exit(0);
