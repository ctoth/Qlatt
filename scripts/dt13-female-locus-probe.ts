// dt13 female-locus selection probe.
//
// Renders the same CV / VC words through the dectalk-english frontend with a
// MALE voice (paul, the default) and a FEMALE voice (betty), and prints the F2
// track near the obstruent<->vowel boundary, so we can confirm:
//   1. Paul uses the MALE locus table (us_maleloc) — F2 boundary value targets
//      the male locus.
//   2. Betty uses the FEMALE locus table (us_femloc) — F2 boundary value targets
//      the (higher) female locus. The selection is driven by the voice's `sex`
//      data field, generically.
//   3. The male and female loci differ, and the right table is used per voice.
//
// The boundary value bouval = locus_hz + prcnt*(curval - locus_hz)/100, where
// curval is the vowel's steady F2 target (already formant_scale'd per voice).
// We read the declared loci tables straight from the frontend spec and print the
// expected bouval for both, then read the actual rendered F2 at the boundary.
//
// Run: npx tsx scripts/dt13-female-locus-probe.ts

import { type LowerOptions, readLowerOptions } from "../src/declarative-frontend/hrg/lowering";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

type LocusTable = NonNullable<LowerOptions["transitions"]["loci"]>;
type LocusEntry = LocusTable[string][string][string];

const spec = loadBundledRulepackSpec("dectalk-english");
const transitions = readLowerOptions(spec.output.lowering).transitions;
if (!transitions.loci || !transitions.loci_female) {
  throw new Error("DECtalk lowering policy must define male and female locus tables");
}
const lociMale = transitions.loci;
const lociFemale = transitions.loci_female;

// Each probe word: a CV word; `obst` is the leading obstruent phoneme; `sontyx`
// is the vowel category (front-unrounded vowels -> "1") used to index the loci.
type Word = { text: string; obst: string; sontyx: string; note: string };
const WORDS: Word[] = [
  { text: "bee", obst: "B", sontyx: "1", note: "labial /b/ + front IY (forward edge)" },
  { text: "see", obst: "S", sontyx: "1", note: "alveolar /s/ + front IY (forward edge)" },
  { text: "key", obst: "K", sontyx: "1", note: "velar /k/ + front IY (forward edge)" },
  { text: "tea", obst: "T", sontyx: "1", note: "alveolar /t/ + front IY (forward edge)" },
];

function g(f: KlattFrame, k: string): number | null {
  const v = f.params[k];
  return typeof v === "number" ? v : null;
}

// First voiced (F2-bearing) frame whose phoneme is a vowel (not the obstruent /
// its release): the forward-edge boundary value of the vowel.
function firstVowelF2(
  track: KlattFrame[],
  obst: string,
): { time: number; f2: number; ph: string } | null {
  for (const f of track) {
    const ph = (f.phoneme ?? "").toUpperCase();
    if (ph === "" || ph === "SIL") continue;
    if (ph === obst || ph.startsWith(obst + "_") || ph.endsWith("_REL") || ph.endsWith("_CL"))
      continue;
    const f2 = g(f, "F2");
    if (f2 != null && f2 > 0) return { time: f.time, f2, ph };
  }
  return null;
}

function steadyVowelF2(track: KlattFrame[], obst: string): number | null {
  // Last frame's F2 of the first vowel run = its steady target (after the ramp).
  let last: number | null = null;
  for (const f of track) {
    const ph = (f.phoneme ?? "").toUpperCase();
    if (ph === "" || ph === "SIL") continue;
    if (ph === obst || ph.startsWith(obst + "_") || ph.endsWith("_REL") || ph.endsWith("_CL"))
      continue;
    const f2 = g(f, "F2");
    if (f2 != null && f2 > 0) last = f2;
  }
  return last;
}

function bouval(entry: LocusEntry, curval: number): number {
  return entry.locus_hz + (entry.prcnt * (curval - entry.locus_hz)) / 100;
}

let allOk = true;
for (const w of WORDS) {
  const paul = textToKlattTrackDetailed(w.text, undefined, 30, {
    frontendId: "dectalk-english",
    speaker: "paul",
  });
  const betty = textToKlattTrackDetailed(w.text, undefined, 30, {
    frontendId: "dectalk-english",
    speaker: "betty",
  });

  const mEntry = lociMale[w.obst]?.[w.sontyx]?.F2;
  const fEntry = lociFemale[w.obst]?.[w.sontyx]?.F2;

  const pStart = firstVowelF2(paul.track, w.obst);
  const bStart = firstVowelF2(betty.track, w.obst);
  const pSteady = steadyVowelF2(paul.track, w.obst);
  const bSteady = steadyVowelF2(betty.track, w.obst);

  console.log(`\n=== "${w.text}" — ${w.note} (${w.obst} sontyx ${w.sontyx}) ===`);
  console.log(`  MALE   /${w.obst}/ F2 locus=${mEntry?.locus_hz} prcnt=${mEntry?.prcnt}`);
  console.log(`  FEMALE /${w.obst}/ F2 locus=${fEntry?.locus_hz} prcnt=${fEntry?.prcnt}`);
  console.log(`  loci DIFFER: ${mEntry?.locus_hz !== fEntry?.locus_hz ? "YES" : "NO"}`);

  if (pStart && pSteady != null && mEntry) {
    const exp = Math.round(bouval(mEntry, pSteady));
    console.log(
      `  PAUL  (male)  vowel ${pStart.ph} steadyF2=${Math.round(pSteady)} | boundary F2=${Math.round(pStart.f2)} (expected male bouval=${exp})`,
    );
    if (Math.abs(pStart.f2 - exp) > 2) allOk = false;
  } else {
    console.log("  PAUL  (male)  — no vowel F2 frame found");
    allOk = false;
  }
  if (bStart && bSteady != null && fEntry && mEntry) {
    const expF = Math.round(bouval(fEntry, bSteady));
    const expM = Math.round(bouval(mEntry, bSteady));
    console.log(
      `  BETTY (female) vowel ${bStart.ph} steadyF2=${Math.round(bSteady)} | boundary F2=${Math.round(bStart.f2)} (expected FEMALE bouval=${expF}, male-would-be=${expM})`,
    );
    // Betty must match the FEMALE bouval, NOT the male one.
    if (Math.abs(bStart.f2 - expF) > 2) {
      console.log("  *** BETTY does not match FEMALE locus ***");
      allOk = false;
    }
    if (expF !== expM && Math.abs(bStart.f2 - expM) <= 2) {
      console.log("  *** BETTY matches MALE locus (WRONG — female table not used) ***");
      allOk = false;
    }
  } else {
    console.log("  BETTY (female) — no vowel F2 frame found");
    allOk = false;
  }
}

console.log(
  `\nRESULT: ${allOk ? "OK — Paul uses male loci, Betty uses female loci (selected by sex)" : "FAIL — see *** lines above"}`,
);
process.exit(allOk ? 0 : 1);
