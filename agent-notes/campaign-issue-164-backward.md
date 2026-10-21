# Goal

Preserve the full requested backward sonorant/locus transition interval in existing #164 diagnostics.

# State

Authorized branch campaign/issue-164-backward from origin/master 2191ee15. Smallest change: remove two caller pre-caps (about four production lines), plus 40–60 focused test lines using existing transition fixtures. Implemented. `npx vitest run test/hrg-lowering-locus-transitions.test.ts` passed after the fixture correction. No local CI suite run.

# Decisions and why

- Both backward callers cap the authored span to segment duration before the shared helper, hiding part of the original request in diagnostics.
- The helper's trailing start is max(positiveEdge, duration-span); removing the pre-cap preserves that applied start for spans longer than duration.
- Real qlatt sonorant policy declares span45 and backward=true. DECtalk locus table supplies backward formant spans. No policy retuning or new warning machinery.
- Keep #164 open for the remaining categories.

# Surprises

Active test failed: `AssertionError: expected [] to have a length of 1 but got +0` at test/hrg-lowering-locus-transitions.test.ts:167. The new locus case failed; five others passed. I set blend.keys=[] to suppress blending, but resolveLocusFormants iterates those same keys (lowering.ts:581), disabling the intended locus path. Work stopped. Proposed fixture correction: use ["F2"] for the locus case, leaving smooth_all_boundaries=false to prevent unrelated vowel-to-stop blending.

# Next step

Q's "fix em all" authorized correcting the fixture and continuing, including routine fixture/typing/formatting corrections within scope. Restored F2 for the locus case; focused tests pass. Commit/push for hosted CI and Claude review.
