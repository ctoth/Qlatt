# Filter performance harness

This harness measures Qlatt's production `wasm32-unknown-unknown` filter
artifacts and compares every output bit against a separately built baseline.
It covers the audio-rate resonators, notches, tilt and reconstruction filters,
the pitch-synchronous resonator, and the control-rate F0 filter kernel.

The optimization workflow follows Serhii Potapov's 2026 article, "Branchless
Rust: Making a Filter 4x Faster by Removing an if": measure first, remove only
branches or boundary crossings shown to be hot, and retain the old result as a
bit-level oracle.

```powershell
node scripts/filter-perf/build.mjs --out target/filter-perf/baseline
# edit the filters
node scripts/filter-perf/build.mjs --out target/filter-perf/candidate
node scripts/filter-perf/harness.mjs `
  --baseline target/filter-perf/baseline/artifacts `
  --candidate target/filter-perf/candidate/artifacts
```

The harness fails on the first unequal `f32` or `f64` bit pattern. Timing is
reported as the median of seven warmed rounds in nanoseconds per sample. Since
wall-clock measurements are noisy, keep only changes with repeatable gains.
For the resonator/notch family, the candidate model also includes the worklet's
unchanged-parameter cache while the baseline repeats the old transcendental
coefficient calculation once per WebAudio block.

The candidate may point directly at `public/worklets`; the harness recognizes
both Cargo's underscore filenames and Qlatt's published hyphenated filenames.
