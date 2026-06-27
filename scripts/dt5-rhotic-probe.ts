// dt-5 rhotic probe (DECtalk 4.63 ph_aloph.c US branch).
//
// Renders phrases through the dectalk-english frontend and prints the phoneme
// sequence to confirm the two rhotic allophone rewrites added in chunk dt-5:
//
//   A13 POSTVOCALIC VOWEL+R FUSION (ph_aloph.c:835-872): a postvocalic /R/ fuses
//     into the preceding vowel and is DELETED -- AX->RR, IY/IH->IR, EY/EH/AE->ER,
//     AA/AH->AR, OW/AO->OR, UW/UH->UR.  The fused vowel keeps the original vowel's
//     stress (AR1 for a stressed AA, AR0 for an unstressed one).
//   A5 PREVOCALIC R->RR (ph_aloph.c:636-648): a /R/ before a syllabic (not across a
//     word boundary) becomes RR.  Fusion runs first, so A5 catches only the residual
//     (chiefly word-initial) prevocalic /R/.
//
// Postvocalic gate (L823-824): the /R/ must be unstressed and NOT word-initial, and
// the preceding phone must be a vowel.  So a word-initial /R/ ("red", "right") never
// fuses (no preceding vowel).
//
// NOTE on this port's transcription: "here"/"for"/"bird" already come out of the
// dictionary/G2P as ...ER (no /R/ token), so the fusion rule has nothing to fire on
// for those -- their rhotic nucleus already exists at the transcription layer.  The
// fusion rule fires where the transcription emits a separate vowel + /R/ (car, card,
// start, cure, fear, store).
//
// Run: npx tsx scripts/dt5-rhotic-probe.ts
import { textToKlattTrackDetailed } from "../src/tts-frontend";

type Case = { phrase: string; expect: string; want: RegExp | null; reject?: RegExp };

// A bare /R/ liquid token that escaped fusion (a real R, not part of AR/ER/... and
// not RR).  Matched by a standalone "R" with no following stress digit or letter.
const BARE_R = /(?<![A-Z])R(?![0-9A-Z])/;

const CASES: Case[] = [
  // --- FUSION (vowel + R -> rhotic vowel, R deleted) ---
  { phrase: "car", expect: "AA + R -> AR (R deleted)", want: /\bAR[01]\b/, reject: BARE_R },
  { phrase: "card", expect: "stressed AA + R -> AR1 (R deleted)", want: /\bAR1\b/, reject: BARE_R },
  { phrase: "start", expect: "stressed AA + R -> AR1, trailing T kept", want: /\bAR1\b/, reject: BARE_R },
  { phrase: "cure", expect: "UW + R -> UR (R deleted)", want: /\bUR[01]\b/, reject: BARE_R },
  { phrase: "fear", expect: "stressed IY + R -> IR1", want: /\bIR1\b/, reject: BARE_R },
  { phrase: "store", expect: "stressed OW + R -> OR1", want: /\bOR1\b/, reject: BARE_R },

  // --- FUSION inter-vocalic; A5 must NOT also leave a bare RR ---
  { phrase: "story", expect: "inter-vocalic R fuses (OW->OR1), no bare RR", want: /\bOR1\b/, reject: /\bRR\b/ },

  // --- A5 PREVOCALIC (word-initial R before a syllabic -> RR) ---
  { phrase: "real", expect: "word-initial R before syllabic -> RR", want: /\bRR\b/ },

  // --- NEGATIVE: word-initial R must not fuse (no preceding vowel) ---
  // "red" R EH/1 D: A5 will RR-ify it (next EH syllabic, no word boundary), which is
  // faithful to DECtalk (A5 has no word-initial guard).  The point is it must NOT
  // FUSE: the EH nucleus survives intact.
  { phrase: "red", expect: "word-initial R does not fuse; EH survives", want: /\bEH[01]?\b/ },

  // --- Already-ER words: fusion cannot fire (no R token); must stay correct ---
  // Transcription emits a bare "ER" nucleus (stress lives in .stress -> "ER/1"),
  // not the digit-suffixed fusion target names, so match ER optionally followed by
  // a /stress suffix.
  { phrase: "bird", expect: "already ER from transcription, unchanged", want: /\bER(\/[0-9])?\b/ },
  { phrase: "for", expect: "already ER from transcription, unchanged", want: /\bER(\/[0-9])?\b/ },
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
