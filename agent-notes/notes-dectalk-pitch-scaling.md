# DECtalk pitch scaling convergence

## Current state

- Active exact-convergence target: the single word `cake.` (`g2p-cake`).
- Current branch: `master`, ahead of `origin/master` by three commits.
- Tracked worktree was clean before this source slice; all pre-existing untracked artifacts are being preserved.
- The temporary `scripts/inspect-cake-f0.ts` inspection artifact has been deleted.
- Worklet reuse/OOM remediation is complete in commit `956bf091`.

## Evidence

- Current `cake.` output has exact `K EY K` symbolic tokens but a large voiced-pitch error: oracle mean F0 about 128.70 Hz versus Qlatt about 94.17 Hz.
- Qlatt resolves Paul with `f0_minimum=1100` and `f0_scale_factor=4100`; its PhraseCommand baseline begins near 1160 internal units.
- Active DECtalk source in `Ph_drwt02it.c` scales with:
  `f0minimum + frac4mul(f0prime - f0minimum, f0scalefac)`.
- Qlatt instead declares `speaker_scale.reference: 1300`, subtracts that reference, and adds a derived `base_f0_bias_hz` after scaling.
- The Qlatt formula predicts the observed depressed contour. Scaling around `f0minimum` without the added bias predicts the oracle's roughly 116 Hz baseline and 140 Hz stressed peak.
- The Rust `f0-filters` ABI currently carries both obsolete values as `f0_reference` and `base_f0_bias_hz`; TypeScript/YAML carry the matching fields.

## Blocker

- None. The exact causal source and active target are identified.

## Next action

- Inspect only the validation/parser and Rust ABI/test surfaces that own `speaker_scale.reference` and `base_f0_bias_hz`.
- Add a targeted red regression for DECtalk scaling around `f0minimum`.
- Delete the incorrect reference and bias end-to-end, rebuild the exact `f0-filters` WASM artifact, rerun the targeted tests, and remeasure `g2p-cake`.
- Keep and commit the slice only if the voiced-F0 convergence metric improves; otherwise fully revert it.

This notes file must remain uncommitted.

## Slice progress

- Added `dectalk_speaker_scaling_uses_f0_minimum_as_pivot` against the real Rust render path.
- Red result: 107.986328125 Hz versus the source-derived 116.005859375 Hz expectation.
- Deleted `speaker_scale.reference`, `f0_reference`, and `base_f0_bias_hz` from YAML, TypeScript marshalling, the Rust kernel, its flat ABI, and existing test inputs.
- Green result: the targeted Rust regression now passes.
- Rebuilt all tracked WASM artifacts through the prescribed `pwsh -File build.ps1`; only `public/worklets/f0-filters.wasm` changed.
- The active tracked diff contains exactly the Rust kernel/test, DECtalk frontend YAML, TypeScript lowering marshalling, and rebuilt F0 WASM artifact.

## Immediate next action

- Run the complete `f0-filters` crate tests, core/audio typechecks, and the two directly affected Vitest files.
- Remeasure the `g2p-cake` oracle comparison before deciding whether the slice is kept and committed or fully reverted.

## Keep decision and verification

- Fresh cached-oracle run: `test/oracle-output/dectalk-pitch-scale-f0minimum/dectalk-us-v1/g2p-cake`.
- The slice improves `cake.` F0 minimum and maximum errors by exactly 8.01953125 Hz:
  - minimum delta: about -22.1413 Hz to -14.1217 Hz;
  - maximum delta: about -39.9774 Hz to -31.9579 Hz.
- Audio correlation improves from about 0.063 to 0.24097. Symbolic tokens remain exact (`K EY K`, similarity 1.0).
- The historical HRG fixture is explicitly `historicalOnly` and captures old Qlatt production, not DECtalk oracle output. Its invalid raw-F0 equality assertions were deleted; graph-command lowering, finite F0, and per-cell provenance coverage remain.
- The full suite initially exposed one expected stale 19-scalar JavaScript ABI fixture. All direct loader-test headers now use the 17-scalar layout; its eight focused tests pass.
- Final gates:
  - `cargo test -p f0-filters`: 22 passed;
  - affected Vitest files: 42 passed;
  - full `npm test`: 118 files, 945 tests passed;
  - dictionary audit: 5,400 tracks, 0 processing errors;
  - `npm run typecheck:core`: passed;
  - `npm run typecheck:audio`: passed;
  - `npm run build`: passed (99 modules).
- Keep decision: measured convergence improvement with all named gates green.

## Exact next action

- Inspect the final tracked diff and status.
- Stage only the six intended tracked paths (Rust kernel/test, TypeScript lowering, DECtalk YAML, rebuilt F0 WASM, HRG intonation test, F0 loader test).
- Commit this kept slice. Leave this notes file and all other untracked files uncommitted.

## Committed result

- Kept slice committed as `688d3ba9 fix(dectalk): scale F0 around speaker minimum`.
- Branch is now four commits ahead of `origin/master`; tracked worktree is clean.
- Exact convergence remains active on `g2p-cake` pitch. The target has not changed.

## Next pitch discrepancy

- Current Qlatt voiced pitch for `cake.` is 100.7783-108.4421 Hz (mean 102.1870 Hz).
- DECtalk voiced pitch is 114.9-140.4 Hz (mean 128.7036 Hz).
- DECtalk frames 29-38 carry the voiced stress peak: 136.1, 137.9, 139.5, 140.3, 140.4, 140.0, 139.4, 138.5, 137.1, 135.8 Hz.
- Symbolic phones remain exact, and voiced-ratio delta remains only about -0.00448, so the next causal question is F0 command timing/amplitude/filter state rather than phone identity or gross voicing duration.
- Generated a trace comparison under the untracked fresh oracle run. Its all-frame F0 aggregate is not the authority because it includes unvoiced oracle `f0prime`; voiced-only extrema/mean above remain the active metric.

## Immediate next action after checkpoint

- Inspect the current graph-native `PhraseCommand` and `Tilt` anchors and the aligned Qlatt voiced F0 events for `cake.`.
- Compare their timing to DECtalk's stress peak before proposing any second source slice.
