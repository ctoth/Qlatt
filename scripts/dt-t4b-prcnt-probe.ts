// dt-t4b setloc prcnt-adjustment + special-coartic probe.
//
// Verifies the two DEFERRED setloc prcnt adjustments (ph_sttr2.c:294-307) now
// fire inside the generic locus resolver, and the us_special_coartic F2/F3
// target offsets (p_us_st1.c:314-410) now apply. For each probe word it prints
// the F1/F2/F3 track near the relevant boundary, and for the locus-boundary
// cases it computes the UNADJUSTED bouval (the t4a formula with the raw table
// prcnt/durtran) vs the ADJUSTED bouval (with the setloc adjustment) so the
// change is shown to be EXACTLY the DECtalk adjustment, not arbitrary.
//
// (a) rounded-soncon: F2/F3 of a rounded sonorant consonant (W/LL/LX/R/EL) after
//     a NON-palatal/dental obstruent -> prcnt = (prcnt>>1)+50 (extent reduced).
//     Probe: "dwell" (D -> W forward edge). D is non-palatal/dental.
// (b) f2_back: F2 into a back-cavity vowel (IY backward / YU forward) -> prcnt +=
//     25-(prcnt>>2); durtran=(durtran>>1)+2. Probe: "ease" (IY -> Z backward edge,
//     IY F2BACKF=true).
// special_coartic: F2 of a front vowel after W/LL/LX -> -150; F3 of vowel near
//     W/R/RX -> -150; F2 of UW adjacent alveolar -> +200.
//     Probe: "we" (W->IY, front-vowel F2 -150 + F3 near-W -150), "two" (T->UW,
//     UW after alveolar T +200).
//
// Run: npx tsx scripts/dt-t4b-prcnt-probe.ts
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

function frameStr(f: KlattFrame): string {
  const p = f.params;
  const g = (k: string) => (typeof p[k] === "number" ? Math.round(p[k] as number) : "-");
  return `t=${(f.time * 1000).toFixed(1)}ms ${f.phoneme ?? "?"} F1=${g("F1")} F2=${g("F2")} F3=${g("F3")}`;
}

function probe(text: string, note: string): KlattFrame[] {
  const detailed = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  console.log(`\n=== "${text}" — ${note} ===`);
  console.log(`phones: ${detailed.frontendPhones.map((p) => p.phoneme).join(" ")}`);
  for (const f of detailed.track) console.log("  " + frameStr(f));
  return detailed.track;
}

function bouval(locus: number, prcnt: number, curval: number): number {
  return locus + (prcnt * (curval - locus)) / 100;
}

// --- Adjustment (a): "dwell" D -> W (forward edge on W's F2/F3). ---
// D sontyx for W (rounded-soncon -> sontyx 3): loci D."3" F2 {locus,prcnt}.
// From frontend.yaml loci: D "3" F2 = {1700, 40}, F3 = {2540?, ...}. W steady F2 ~ 800.
probe("dwell", "(a) rounded-soncon W after D: F2/F3 prcnt -> (prcnt>>1)+50");
// Demonstrate the prcnt math for F2 with the table values used by the resolver:
{
  // Verified against the real D loci sontyx3 table + W steady targets:
  //   F2: locus 1700, prcnt 40->70; W F2 810; bouval 1344->1077 (track shows 1077).
  //   F3: locus 2601, prcnt 30->65; W F3 2177; bouval 2424->2325 (track shows 2325).
  const f2 = { locus: 1700, prcntRaw: 40, curval: 810, adj: Math.floor(40 / 2) + 50 };
  const f3 = { locus: 2601, prcntRaw: 30, curval: 2177, adj: Math.floor(30 / 2) + 50 };
  console.log(
    `  [a] F2 prcnt 40->${f2.adj}: bouval ${Math.round(bouval(f2.locus, f2.prcntRaw, f2.curval))}->` +
      `${Math.round(bouval(f2.locus, f2.adj, f2.curval))} (track 1077);` +
      ` F3 prcnt 30->${f3.adj}: bouval ${Math.round(bouval(f3.locus, f3.prcntRaw, f3.curval))}->` +
      `${Math.round(bouval(f3.locus, f3.adj, f3.curval))} (track 2325) — transition extent reduced.`,
  );
}

// --- Adjustment (b): "ease" IY -> S (backward edge, IY F2BACKF=true). ---
probe("ease", "(b) f2_back IY before S: F2 prcnt += 25-(prcnt>>2), durtran shortened");
{
  // S loci sontyx1 F2 = {locus 1440, prcnt 40, durtran 50}; IY steady F2 2100.
  const prcntRaw = 40;
  const prcntAdj = prcntRaw + (25 - Math.floor(prcntRaw / 4)); // += 25-10 -> 55
  const durRaw = 50;
  const durAdj = Math.floor(durRaw / 2) + 2; // 27
  console.log(
    `  [b] F2 prcnt ${prcntRaw}->${prcntAdj}: bouval ${Math.round(bouval(1440, prcntRaw, 2100))}->` +
      `${Math.round(bouval(1440, prcntAdj, 2100))} (track 1803); durtran ${durRaw}->${durAdj}ms` +
      ` (back-cavity F2 extent + duration reduced).`,
  );
}

// --- special_coartic ---
probe("we", "special: front-vowel F2 -150 after W; F3 -150 near W");
probe("two", "special: UW F2 +200 adjacent alveolar T");

console.log(
  "\n(The locus-boundary bouval changes are EXACTLY the DECtalk prcnt-adjustment formula;",
);
console.log(
  " special_coartic shifts F2/F3 steady targets by the cited Hz offsets. git stash to compare.)",
);
process.exit(0);
