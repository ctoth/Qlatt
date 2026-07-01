# DSP / Signal-Graph Paper Divergences

Scope: `public/experiments/klatt80-baseline` and the concrete JS/WASM DSP nodes it instantiates. This audit was done against the actual PDFs in `papers/`, not the repo notes. The baseline paper anchor is `Klatt_1980_CascadeParallelFormantSynthesizer/klatt1980.pdf`; later-paper alignments are called out where relevant.

## Confirmed divergences

- [HIGH] Default excitation is not the Klatt 1980 source.
  Code: `public/experiments/klatt80-baseline/semantics.yaml:112`, `public/experiments/klatt80-baseline/graph.yaml:121`, `public/experiments/klatt80-baseline/graph.yaml:133`, `crates/lf-source/src/lib.rs:177`.
  Paper anchor: Klatt 1980 describes impulse-train excitation sent through `RGP` and `RGZ` for normal voicing and impulse into `RGP` and `RGS` for quasi-sinusoidal voicing (paper text around lines 445-462 and 2240-2243 in the `pdftotext` extraction).
  Code behavior: the baseline `sourceMode` default is `1`, which enables the LF source by default and disables the classic impulse source path. The LF crate is a hybrid of Fant 1997, Klatt & Klatt 1990, Perrotin 2021, Fraj 2011, and Gobl 2003.
  Why it matters: this changes the source waveform, phase, and source-spectrum control before the tract. The graph is not a literal Klatt 1980 baseline even before later filters or nasal logic are considered.

- [HIGH] The voiced aspiration/frication modulation is not the Klatt 1980 modulator.
  Code: `public/experiments/klatt80-baseline/graph.yaml:153`, `public/experiments/klatt80-baseline/semantics.yaml:466`, `src/worklets/glottal-mod-processor.ts:93`, `src/worklets/glottal-mod-processor.ts:105`, `src/worklets/glottal-mod-processor.ts:108`.
  Paper anchor: Klatt 1980 says the noise-source amplitude modulation is fixed at 50%, implemented as a square wave with period equal to the fundamental period (paper text lines 529-536).
  Code behavior: `glottal-mod` produces an OQ-shaped sinusoid during the open phase and a constant 0.5 floor during the closed phase. OQ is derived from Fant-style `Rd`.
  Why it matters: this changes the temporal envelope of aspiration/frication within each cycle and makes the modulation depend on later voice-quality theory, not the 1980 synthesizer.

- [HIGH] The frication/aspiration source is not Klatt 1980's pseudo-Gaussian noise source plus LPF/integrator scheme.
  Code: `src/worklets/noise-source-processor.ts:78`, `src/worklets/noise-source-processor.ts:85`, `src/worklets/noise-source-processor.ts:120`.
  Paper anchor: Klatt 1980 says the frication source is built from a pseudo-random generator whose output is summed 16 times to get a pseudo-Gaussian distribution, followed by an LPF obeying `y(nT) = x(nT) + y(nT-T)` to approximate the source integral (paper text lines 509-526 and 476-481).
  Code behavior: the implementation uses raw white noise (`Math.random()` unless seeded) passed through a one-pole low-pass with an arbitrary cutoff parameter. There is no 16-sample sum and no Klatt-style integrator.
  Why it matters: this changes the noise amplitude distribution and the source transfer function before the tract. It is not the 1980 frication/aspiration source.

- [HIGH] The output stage includes non-literature dynamics processing and gain staging.
  Code: `public/experiments/klatt80-baseline/graph.yaml:460`, `public/experiments/klatt80-baseline/graph.yaml:472`, `public/experiments/klatt80-baseline/semantics.yaml:339`, `public/experiments/klatt80-baseline/semantics.yaml:344`, `public/experiments/klatt80-baseline/registry.yaml:41`.
  Paper anchor: Klatt 1980 specifies D/A conversion followed by an external 5 kHz low-pass filter; it does not specify a compressor, post-filter gain boost, or post-compression trim (paper text lines 1592-1600 and Appendix A lines 1589-1594).
  Code behavior: after the reconstruction filter, the graph applies `masterGain`, then a `DynamicsCompressorNode`, then `outputGain`. The defaults (`4.5`, compressor, `0.5`) are explicitly described as engineering estimates.
  Why it matters: this directly changes branch balance, transient behavior, and dynamic range. It is an engineering loudness fix, not a paper-backed stage.

- [MEDIUM] The nasal antiformant is not the Klatt 1980 antiresonator.
  Code: `public/experiments/klatt80-baseline/graph.yaml:350`, `public/experiments/klatt80-baseline/registry.yaml:128`, `crates/biquad-notch/src/lib.rs:3`.
  Paper anchor: Klatt 1980 describes nasal zeros using the same antiresonator formulation as the rest of the synthesizer's pole-zero network.
  Code behavior: the graph replaces the nasal antiresonator with an RBJ cookbook biquad notch and explicitly describes it as a "numerically stable replacement" for the Klatt FIR antiresonator.
  Why it matters: the implementation is deliberately not the same transfer structure. The stated reason is numerical stability at modern sample rates, but it is still a paper divergence.

- [MEDIUM] Oral speech bypasses the nasal core instead of using Klatt's cancellation pair.
  Code: `public/experiments/klatt80-baseline/semantics.yaml:531`, `public/experiments/klatt80-baseline/semantics.yaml:538`, `public/experiments/klatt80-baseline/semantics.yaml:550`.
  Paper anchor: Klatt 1980 removes the nasal pole/zero pair in oral speech by setting `FNP = FNZ`, i.e. by cancellation inside the tract model rather than by deleting the section (paper text lines 812-819).
  Code behavior: when `nasalRuntimeActive` is false, the bound nasal frequencies and bandwidths are driven to `0.0`, which causes runtime bypass of the nasal nodes.
  Why it matters: cancellation and hard bypass are not the same system. The phase and residual response differ.

- [MEDIUM] The nasal subsystem adds an extra place-specific oral-cavity antiformant that is not in Klatt 1980.
  Code: `public/experiments/klatt80-baseline/graph.yaml:359`, `public/experiments/klatt80-baseline/semantics.yaml:516`, `public/experiments/klatt80-baseline/semantics.yaml:521`.
  Paper anchor: the 1980 synthesizer has the core nasal pole/zero machinery; it does not include a separate runtime-selected place antiformant node.
  Code behavior: `nzPlace` is an extra notch driven from `nasalPlaceIndex` and `nasalPlaceBwHz`, sourced from later nasal literature.
  Why it matters: this is a later extension grafted onto the baseline graph, not part of the original Klatt topology.

- [MEDIUM] The graph extends the tract beyond the original F1-F6 / 10 kHz design.
  Code: `public/experiments/klatt80-baseline/graph.yaml:72`, `public/experiments/klatt80-baseline/semantics.yaml:383`, `public/experiments/klatt80-baseline/semantics.yaml:396`.
  Paper anchor: Klatt 1980 is a 10 kHz, 5 kHz-output system; the parallel configuration has six resonators and the paper explicitly frames the useful output band below 5 kHz (paper text lines 802-818 and 1589-1594).
  Code behavior: the graph adds F7-F10 in both cascade and parallel routing with Fant/Rabiner-derived defaults up to 12 kHz.
  Why it matters: this is outside the original bandwidth and topology envelope. It is a later extension, not a faithful 1980 implementation.

- [MEDIUM] The voiced-source radiation stage is not the 1980 first-difference model.
  Code: `public/experiments/klatt80-baseline/graph.yaml:293`, `public/experiments/klatt80-baseline/graph.yaml:296`, `src/worklets/chalker-radiation-processor.ts:50`, `src/worklets/chalker-radiation-processor.ts:79`.
  Paper anchor: Klatt 1980 uses a digital high-pass / first-difference radiation characteristic in the classic implementation.
  Code behavior: the voiced paths use a Chalker two-term correction (`c1*(1-z^-1) + c2*(1-2z^-1+z^-2)`), while the separate `diff` node remains first-difference for the parallel branch.
  Why it matters: the graph no longer uses a uniform Klatt 1980 radiation model. It is partly upgraded to later literature and partly left in the original form.

## Unsupported engineering terms or claims that do not have paper support

- `public/experiments/klatt80-baseline/semantics.yaml:342` and `:347` mark `masterGain` and `outputGain` as engineering estimates. Those are explicit non-literature terms.

- `crates/reconstruction-filter/src/lib.rs:28` defines `OUTPUT_GAIN_COMP = 2.0`. The Appendix A ladder values are paper-backed; the extra output gain compensation is not.

- `public/experiments/klatt80-baseline/semantics.yaml:621` multiplies `avsGain` by `10`. I did not find paper support for that scaling in Klatt 1980, Klatt & Klatt 1990, or Fant 1997. It looks like a balancing patch.

- `public/experiments/klatt80-baseline/semantics.yaml:604` adds an `effectiveRd`-dependent aspiration boost. That may be a plausible later voice-quality heuristic, but it is not a literal implementation of Klatt 1980.

## Verification run

Executed:

```text
cargo test -p resonator -p antiresonator -p biquad-notch -p edge-detector -p decay-envelope -p reconstruction-filter -p lf-source
```

Result: passed.
