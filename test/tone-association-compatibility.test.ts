import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

// Capture the existing full track on the parent implementation before migrating
// association. These are compatibility controls, not acoustic quality claims.
// Issue 52's nasal vocabulary/target update was field-reviewed against master;
// see docs/nasal-side-branch.md and scripts/review-nasal-track-snapshots.mjs.
// Issue 64's Chen Table V duration calibration is reviewed by segment in
// docs/chen-1970-duration-review.md; its four affected Qlatt hashes are refreshed.
// Peterson Table I changes only the four Qlatt English controls; see
// docs/peterson-1960-duration-review.md for their complete segment review.
// Klatt Table I changes the two Qlatt "The cat sat." controls; see
// docs/klatt-1975-duration-review.md for the release/aspiration changes.
// #61 regenerates only qlatt-english snapshots for per-phone duration floors;
// the exact base 1af37573 passes the old snapshots. See docs/per-phone-duration-floors.md.
// The single output clock regenerates only the four dectalk-english snapshots:
// every frame keeps its fields, and only frame times and order change (segment
// starts move onto the 71/11025 s packet clock with the F0 ticks). Checked by
// hashing each track with times removed and frames sorted, before and after.
// The ahead(item, n) distance fix regenerates three snapshots: qlatt-english
// "Did Bob buy a blue balloon?" (place locus now finds the vowel after a stop's
// release) and qlatt-beauty "Did Bob buy a blue balloon?" and "Gag, gang; go!"
// (boundary-tone shaping now reaches a vowel two or three segments before the
// boundary). dectalk-english is unchanged. See docs/ahead-distance-golden-review.md.
// The DECtalk structure-word rules regenerate the four dectalk-english
// snapshots, and these are real changes of content, not only of timing: onset
// consonants now carry their syllabic's stress, every breath group gets a
// primary stress, the segmental F0 path runs for every phrase, and the
// word-keyed replay rules are gone. They are checked against DECtalk itself by
// scripts/oracle/compare-structure-bits.ts and the oracle scoreboard, not here.
// The splice tree-placement fix regenerates the "Did Bob buy a blue balloon?"
// and "Gag, gang; go!" snapshots in qlatt-english and qlatt-beauty (cluster
// position and syllable role of expanded stops) and dectalk-english "The cat
// sat." (a word-initial phone re-emitted by a splice now sits in its own word).
// See docs/splice-tree-golden-review.md.
// The transcription of DECtalk's duration rules (p_us_tim.c) regenerates the
// four dectalk-english snapshots: every duration changes. They are checked
// against DECtalk's recorded frame counts by
// scripts/oracle/compare-duration-frames.ts, not here.
// Keeping the DECtalk dictionary's secondary stress, and raising the last
// primary stress before "!" to emphasis, regenerate dectalk-english "Did Bob
// buy a blue balloon?" and "Gag, gang; go!".
// The syllabifier now knows this frontend's /l/ (it was keyed LL, so "bl" was
// never an onset), which regenerates dectalk-english "Did Bob buy a blue
// balloon?" again.
// The dictionary's RR and IX vowels are no longer folded into ER and IH, which
// regenerates dectalk-english "The cat sat." ("Saturday") and "Did Bob buy a
// blue balloon?".
// "balloon" is not in DECtalk's dictionary; it is now pronounced by DECtalk's
// compiled letter-to-sound tables, which regenerates that snapshot once more.
// DECtalk's clause-initial pauses and its dummy vowel regenerate dectalk-english
// "Gag, gang; go!" (each pause after a clause holds the next clause's four
// opening frames; the [g] before the comma is released into IX) and "sip sip."
// (the dummy vowel is six frames, 38.4 ms, with aspiration at 39 dB). Both are
// checked against DECtalk's packets by test/dectalk-frame-gate.test.ts.
// The hat rise and stress impulses as Ph_inton2.c issues them (a stress
// impulse on every stressed syllabic, sized by its place among the clause's
// stresses) regenerate all four dectalk-english snapshots: only F0 changes.
// The frame gate checks F0 packet by packet on 190 corpus phrases.
// The clause-type baselines, the question gestures as Ph_inton2.c issues
// them, and the removal of the comma rises (which the live routine never
// issues in English) regenerate dectalk-english "Did Bob buy a blue
// balloon?" and "Gag, gang; go!": F0 only, checked by the frame gate.
// Rendering F0 clause by clause, as DECtalk restarts it at every clause,
// regenerates dectalk-english "Gag, gang; go!", its only snapshot of more
// than one clause.
// The packet words of phases/articulation.yaml regenerate all four
// dectalk-english snapshots: every frame gains PS, CNK and AG, and F4 becomes
// the voice's 3500 on every frame. Nothing else changes: with those four
// params dropped, scripts/review-track-fields.ts prints the same hashes, times
// included, for this tree and for master 20b91b67 on all four phrases.
// PH and run regenerate them again, checked the same way against 3db3a34c
// with `--drop PH,run`: the two new keys are the only change.
// The reset of pressure and glottis in a later clause's initial silence
// regenerates "Gag, gang; go!" alone: against 062c027e the other three are
// unchanged, and it is unchanged with `--drop PS,CNK,AG`.
// Corrections to the glottal rules found by tracing DECtalk (the voice's
// end-of-phrase spread, which initial-silence cases run every frame, when the
// next phone's opening applies) regenerate three: against fc64b694 only AG
// changes (`--drop AG` gives equal hashes) and "sip sip." not at all.
describe("tone association preserves the existing frontend tracks", () => {
  for (const frontendId of ["qlatt-english", "qlatt-beauty", "dectalk-english"]) {
    it.each(["The cat sat.", "Did Bob buy a blue balloon?", "Gag, gang; go!", "sip sip."])(
      `${frontendId}: %s`,
      (phrase) => {
        const { track } = textToKlattTrackDetailed(phrase, 110, 30, { frontendId });
        // Decision identities necessarily change when association decisions are
        // inserted. Compare every original synthesis field; ancestry is tested separately.
        const payload = track.map(({ provenance: _provenance, ...frame }) => {
          if (frontendId === "dectalk-english") return frame;
          // #56 adds neutral controls after these snapshots were captured.
          // Assert their defaults before removing them from the legacy hash;
          // retain the original snapshots to prove all earlier fields unchanged.
          // #54 adds effort; all pre-effort track controls must remain identical.
          // Its contour, realization and scheduling have dedicated regressions.
          const { FTP, FTZ, BTP, BTZ, DF1, DB1, effort, ...params } = frame.params;
          if (frontendId === "qlatt-english") expect(Number.isFinite(effort)).toBe(true);
          expect({ FTP, FTZ, BTP, BTZ, DF1, DB1 }).toEqual({
            FTP: 2150,
            FTZ: 2150,
            BTP: 180,
            BTZ: 180,
            DF1: 0,
            DB1: 0,
          });
          return { ...frame, params };
        });
        expect(
          createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
        ).toMatchSnapshot();
      },
    );
  }
});
