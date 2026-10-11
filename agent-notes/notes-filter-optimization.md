# Filter optimization checkpoint

## Objective

Use Serhii Potapov's branchless-Rust article as the measurement discipline for
making every Qlatt filter faster where possible, while proving candidate WASM
outputs are bit-identical to the pre-change implementation.

## Current findings

- The audio-rate filter surface is `resonator`, `antiresonator`,
  `biquad-notch`, `tilt-filter`, `pitch-sync-mod` (pitch-sync resonator),
  `fujisaki-resonator`, and `reconstruction-filter`; `f0-filters` is included
  as the control-rate filter kernel.
- The simple resonator/notch sample loops contain no unpredictable per-sample
  branch. Their block-level bypass branches are predictable and should not be
  removed without benchmark evidence.
- `tilt-filter` and `pitch-sync-mod` currently cross the JavaScript/WASM ABI
  once per sample. A block ABI is the leading optimization opportunity.
- `reconstruction-filter` reconstructs, stamps, pivots, and eliminates the same
  constant 4x4 conductance matrix for every sample. A precomputed solve plan can
  retain the exact arithmetic order for the changing RHS while removing the
  repeated matrix work.
- The worktree was already heavily dirty with unrelated untracked artifacts.
  Filter work is restricted to explicit crate, worklet, script, and package
  paths.

## Infrastructure state

- Added `scripts/filter-perf/build.mjs` to build the production release WASM
  filter set into an explicit artifact directory.
- Added `scripts/filter-perf/harness.mjs` to compare baseline and candidate
  `f32`/`f64` result bits and benchmark warmed median nanoseconds per sample.
- Added `scripts/filter-perf/README.md` and package scripts.
- A clean pre-change artifact set exists under
  `target/filter-perf/baseline-current/artifacts`.

## Next action

Add direct unit coverage for the new block ABIs, decide whether the flat
Fujisaki recurrence has any remaining bit-exact optimization, rebuild the
tracked WASM artifacts, and run the full Rust, TypeScript, Vitest, and build
gates.

## Blockers

None. The article URL was absent from the persisted goal record, but the user
provided the full article text in this turn.

## Validation and cleanup checkpoint

- The full Rust workspace reaches `pitch-sync-mod` and then fails only the
  pre-existing `applies_fujisaki_compensation_on_downward_shift` assertion.
  The scalar implementation and that assertion were not changed; both new
  block-ABI tests pass.
- Focused tests pass for worklet sample normalization, tilt block equivalence,
  pitch-sync k-rate/a-rate block equivalence, and reconstruction solve-plan
  equivalence.
- Worklet TypeScript compilation passes after adding block buffers and
  unchanged-parameter caches.
- Modeling the real per-block parameter setter cost makes every covered kernel
  measurably faster: approximately 1.45x resonator, 2.03x antiresonator, 1.54x
  biquad notch, 3.04x tilt, 1.09x pitch sync, 1.33x Fujisaki, 2.01x
  reconstruction, and 1.55x F0 across repeated runs.
- `cargo fmt --all` rewrote unrelated legacy formatting. The unrelated Rust
  sources have been restored with reverse patches. The same normalization is
  in progress for touched Rust files so the final diff contains semantic edits
  only. The byte-identical but Git-different oversampled WASM rebuild also must
  be restored/excluded before completion.

## Revised next action

Completion audit is now the only remaining action: inspect the final semantic
diff, confirm the uncommitted note is excluded from deliverables, and report
the two known baseline gate failures accurately.

## Final evidence checkpoint

- Unrelated source-formatting changes and the unrelated oversampled WASM delta
  are gone. Every tracked modified path is now filter code, its worklet/generated
  artifact, the filter profile, or the harness entrypoint.
- Final tracked-artifact oracle covers all eight kernels and all three F0 filter
  modes. It is bit-identical and measured: resonator 1.48x, antiresonator 2.08x,
  biquad notch 1.56x, tilt 3.16x, pitch sync 1.07x, Fujisaki 1.31x,
  reconstruction 1.97x, F0 filters 1.57x.
- `typecheck:core`, `typecheck:audio`, `typecheck:golden`,
  `typecheck:scripts`, production Vite build, worklet build, focused Rust tests,
  and `git diff --check` all pass.
- Full Vitest: 1056 passed, 2 existing unrelated failures
  (`runtime-output-level` fricative peak 1.759 > 1.05 and
  `output-lp-filter` expected formants 7-10 but found none).
- Full Rust workspace reaches the unchanged legacy pitch-sync test and fails
  only `applies_fujisaki_compensation_on_downward_shift`; the two new pitch
  block equivalence tests pass.
- Strict clippy is not a clean repository gate: it reports numerous existing
  raw-pointer safety-doc/range-loop findings across unchanged code. The one new
  unnecessary test cast was removed and exact-order reconstruction loops carry
  scoped allows explaining their bit-level contract.

## Optimization pass results

- The baseline-vs-candidate oracle passes for all eight kernels, including
  NaN and signed-zero compatibility on the new block paths.
- `tilt-filter` now has a block ABI and measured about 3.05x-3.13x faster after
  counting input/output copies.
- `pitch-sync-mod` now has a block ABI and measured about 1.07x-1.08x faster
  after counting audio and five a-rate parameter copies.
- `reconstruction-filter` precomputes the constant matrix elimination plan and
  replays the original RHS arithmetic order; with the speed profile it measured
  about 1.98x faster.
- `antiresonator` measured about 1.29x-1.31x faster, and `biquad-notch` about
  1.06x faster.
- `f0-filters` benefits from its filter-only speed profile and measured about
  1.57x-1.59x faster without source changes.
- `resonator` measured about 1.02x faster. `fujisaki-resonator` is at the noise
  floor (1.00x-1.02x); both recurrences are already branchless and arithmetic-
  minimal under the bit-identical constraint.
- Applying `opt-level=3` to pitch-sync made it about 12% slower, so that override
  was rejected. Tilt, pitch, resonator, and Fujisaki retain the workspace's
  size-first profile; only filters with repeatable profile gains keep the
  package override.
