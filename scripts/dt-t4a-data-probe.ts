// dt-t4a locus-transition probe.
//
// Renders CV / VC words through the dectalk-english frontend and prints the
// F1/F2/F3 track near each obstruent<->vowel boundary, so we can confirm:
//   1. A formant transition now EXISTS at obstruent edges (it did not before
//      this chunk — obstruents were excluded from smooth_types).
//   2. F2 starts/ends near the consonant's LOCUS and ramps toward the vowel
//      target, and the locus direction matches DECtalk:
//        - labial /b,p/  -> low F2 locus (~900 Hz)
//        - alveolar /d,t,s/ -> F2 locus ~1700-1800 Hz
//        - velar /g,k/  -> high-front F2 locus near front vowels (velar pinch)
//
// Run: npx tsx scripts/dt-t4a-data-probe.ts
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

type Word = { text: string; note: string };

// CV words (obstruent -> vowel: FORWARD edge, vowel start ramps from locus)
// and VC words (vowel -> obstruent: BACKWARD edge, vowel end ramps to locus).
const WORDS: Word[] = [
  { text: "do", note: "alveolar /d/ + back UW: F2 locus ~1700" },
  { text: "go", note: "velar /g/ + back OW: F2 locus mid (velar)" },
  { text: "bee", note: "labial /b/ + front IY: F2 locus LOW ~900 (rises into IY ~2200)" },
  { text: "key", note: "velar /k/ + front IY: F2 locus HIGH ~1990 (velar pinch)" },
  { text: "see", note: "alveolar /s/ + front IY: F2 locus ~1440" },
  { text: "tea", note: "alveolar /t/ + front IY: F2 locus ~1700" },
  { text: "abe", note: "VC: AY before labial /b/: F2 ends toward ~900 locus" },
  { text: "dog", note: "CVC: /d/..AO..velar /g/ both edges" },
];

function frameStr(f: KlattFrame): string {
  const p = f.params;
  const g = (k: string) => (typeof p[k] === "number" ? Math.round(p[k] as number) : "-");
  return `t=${(f.time * 1000).toFixed(1)}ms ${f.phoneme ?? "?"} F1=${g("F1")} F2=${g("F2")} F3=${g("F3")}`;
}

function probe(word: Word): void {
  const detailed = textToKlattTrackDetailed(word.text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  console.log(`\n=== "${word.text}" — ${word.note} ===`);
  console.log(`phones: ${detailed.frontendPhones.map((p) => p.phoneme).join(" ")}`);
  // Print every frame's F1/F2/F3 (these words are short; full track is small).
  for (const f of detailed.track) {
    console.log("  " + frameStr(f));
  }
}

for (const w of WORDS) probe(w);
console.log("\n(Compare against the committed tree: `git stash` the working changes,");
console.log(" rerun, and observe NO obstruent-edge transition — the vowel frames");
console.log(" hold a constant F2 with no ramp toward the consonant locus.)");
process.exit(0);
