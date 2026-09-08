import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

// Capture the existing full track on the parent implementation before migrating
// association. These are compatibility controls, not acoustic quality claims.
// Issue 52's nasal vocabulary/target update was field-reviewed against master;
// see docs/nasal-side-branch.md and scripts/review-nasal-track-snapshots.mjs.
describe("tone association preserves the existing frontend tracks", () => {
  for (const frontendId of ["qlatt-english", "qlatt-beauty", "dectalk-english"]) {
    it.each(["The cat sat.", "Did Bob buy a blue balloon?", "Gag, gang; go!", "sip sip."])(
      `${frontendId}: %s`,
      (phrase) => {
        const { track } = textToKlattTrackDetailed(phrase, 110, 30, { frontendId });
        // Decision identities necessarily change when association decisions are
        // inserted. Compare every synthesis field; ancestry is tested separately.
        const payload = track.map(({ provenance: _provenance, ...frame }) => frame);
        expect(
          createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
        ).toMatchSnapshot();
      },
    );
  }
});
