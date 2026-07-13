# How Agents Without Ears Test a Speech Synthesizer

Status: territory-charting notes, 2026-06-11. Not a plan. Ideas here range from
"buildable this week" to "research program."

## The reframe that unlocks everything

Acoustic phoneticians do not trust their ears either. The entire field exists
because ears are unreliable, unrepeatable instruments — so the field built a
measurement vocabulary (formants, VOT, F0 contours, spectral moments, HNR) and
published seventy years of quantitative expectations in that vocabulary. Our
`papers/` library is not just implementation guidance; it is **a corpus of
falsifiable acoustic predictions**. Peterson & Barney is a table of where vowel
formants *should land*. Klatt 1976 is a table of how long segments *should
last*. Lisker & Abramson is a table of where VOT category boundaries *should
sit*.

So the question "how does an earless agent know what it should sound like?"
has a precise answer: **the same way Dennis Klatt knew** — by measuring the
output and comparing the measurements to the literature. We already cite the
literature on the way *in* (provenance). The missing half is citing it on the
way *out* (verification).

Two more reframes:

1. **Agents have eyes.** A multimodal agent can read a spectrogram PNG the way
   a phonetician does — see a missing F2 transition, a click, a gap, a burst
   that's too long. Spectrogram-reading is fuzzy (triage, not a gate), but it
   is a genuinely different sense organ than any numeric metric, and we
   currently use it not at all.
2. **Agents have proxy listeners.** An ASR model (Whisper et al.) is a
   functioning auditory system with a text output port. Neural MOS predictors
   (UTMOS, NISQA) are statistical models of human quality judgments. These are
   ears-as-a-service, and they answer the questions numeric metrics cannot:
   *is it intelligible* and *is it pleasant*.

## The five-layer verification model

Where every check lives, from cheapest/strictest to dearest/fuzziest:

| Layer | Question | What we have today | What's missing |
|---|---|---|---|
| 1. Determinism | Did the bits change? | golden tests, render-phrase RMS/max-delta, f0-fingerprint | nothing — this layer is solid |
| 2. Intent | Did the pipeline *decide* correctly? | explain/provenance DAG, track frames, probe-f0-contour | nothing structural |
| 3. Realization | Did the audio *do* what the frames asked? | inspect-audio, analyze-render (bands, centroid, flatness), probe-harness per-node telemetry | independent formant tracker, pitch tracker, segment-level measurement |
| 4. Prediction | Does the audio match what the *literature* says? | nothing | paper claims as machine-checkable acoustic assertions |
| 5. Perception proxy | Would a listener understand / prefer it? | STOI (needs a clean reference), DECtalk oracle correlation | ASR round-trip, forced alignment, MOS predictors, synthetic perception experiments |

The canyon: layers 1–2 are well built; layer 3 is half built (energy and
spectrum, but no formant or pitch *extraction* from the waveform); layers 4–5
barely exist. Everything below assumes we bridge layer 3 first, because layers
4 and 5 consume its measurements.

The KLGLOTT88 incident (2026-05-31: voiced in node, silent in browser, params
never reached the worklet) is the canonical argument for layer 3: intent-layer
checks said everything was fine, and only an ear — Q's — caught it. A
realization-layer check ("measure the WAV: is there periodicity where the
track says voiced?") would have caught it mechanically.

### Instrument independence principle

Layer 3 measurements must come from an instrument that shares no code with the
synthesizer. Measuring F1 with Qlatt's own resonator math verifies nothing —
the bug and the test would share the defect. Praat (headless, scriptable; or
parselmouth via Python) is the field-standard independent instrument; a
vendored LPC/Burg formant tracker + autocorrelation/YIN pitch tracker in
`scripts/` is the self-contained alternative. Either way: **the ruler must not
be made by the thing being measured.**

There's an apparent circularity worry — "we *set* F1=730, of course measuring
finds 730" — that dissolves on inspection. The parameter passes through the
entire realization chain (semantics CEL, AudioParams, worklets, cascade,
gains, browser vs node). Bugs live in that chain. Measuring the rendered
waveform tests the chain, which is precisely what intent-layer checks cannot.

## Workflow 1: read a paper → postulate → implement → verify

The shape this should take is **pre-registration**, borrowed from experimental
science, because it solves the agent-specific failure mode: an agent that
implements first and checks after will rationalize whatever it measures.

1. **Extract the prediction before writing code.** From
   `papers/<X>/notes.md`, write a structured claim: *"After implementing
   pre-boundary lengthening per Crystal & House 1988, phrase-final vowels in
   the test corpus will be 1.2–1.6× their phrase-medial duration."* The claim
   names: the phrase set, the measurement procedure, the expected range, the
   citation. We already have machinery shaped like this — the propstore claim
   system (pks, CEL assumptions) extracts propositional claims from papers.
   The bridge is making a claim *executable*: a CEL predicate over the output
   of the measurement battery.
2. **Record the baseline.** Run the measurement on current HEAD. The claim
   should be *false* before the change (or the change is a no-op — also worth
   knowing before writing code).
3. **Implement.** Rules get citations as always; now the citation has a
   sibling assertion.
4. **Run the battery; check the claim.** Pass = the paper's effect is present
   in the rendered audio. Fail = either the implementation or our reading of
   the paper is wrong — both are findings.
5. **The claim persists** as an acoustic regression test. The corpus of these
   accumulates into exactly what golden tests cannot be: a *semantic*
   regression suite. Golden tests scream when anything changes; claim checks
   scream only when a cited, intended effect disappears.

This closes the provenance loop. Today: rule → citation → paper. Tomorrow:
rule → citation → paper → prediction → measurement → verdict. "Explainable
synthesizer" becomes "falsifiable synthesizer," which is the stronger
property.

A natural home: `test/claims/*.yaml`, one claim per file, with `citation:`,
`phrases:`, `measure:` (which extractor, which segments), `assert:` (CEL over
measurements), `baseline:` (the pre-implementation measured value, for
honesty). An `npm run check:claims` runner. Schema deliberately parallel to
rule YAML — same citation discipline, same declarative-first principle.

## Workflow 2: "does it match what it should sound like?"

"Should sound like" decomposes into four reference classes, each with a
different comparator:

**a. The literature (absolute targets).** Hillenbrand 1995 / Peterson & Barney
give vowel formant distributions — not points, *ellipses with variance*. A
synthesized /æ/ whose measured (F1, F2) falls within 2σ of the published
ellipse "sounds like /æ/" in the only sense available to anyone, eared or not.
Same for VOT ranges, fricative spectral moments (Jongman 2000), voice-quality
parameters (H1-H2, HNR per Gobl 2003). This is layer 4 and it's the highest
ratio of value to novelty — the data tables are *already in `papers/`*.

**b. The oracle (relative targets).** The DECtalk comparator exists but
compares raw waveforms (lag-aligned RMS/correlation), which is brittle —
phase, timing, and amplitude differences swamp it. The standard TTS fix:
compare in *feature* space after *alignment*. Mel-cepstral distortion (MCD)
after DTW alignment is the field-standard "how far from the reference does
this sound" number; per-phone MCD (via forced alignment) localizes the
distance ("your /r/ is far, everything else is close"). Same machinery works
against natural recordings.

**c. Natural speech corpora (distributional targets).** Synthesize a few
hundred sentences; measure the *distributions* — vowel space area, duration
distribution per phone class, F0 declination slopes — and compare to
published population statistics (Crystal & House for durations, etc.).
Point assertions catch local bugs; distribution comparisons catch systemic
ones ("all vowels 15% centralized" looks fine sentence-by-sentence).

**d. The intelligibility floor (functional targets).** ASR round-trip: render
phrase, transcribe with Whisper, compute WER. Crude, but it is the one check
that approximates the actual job of a speech synthesizer. Below it, a
sharper instrument: **minimal-pair identification**. Synthesize "bit/bet/bat,"
"pat/bat," "ship/sip"; ask the ASR which it heard. If the synthesizer's vowel
or VOT or frication cues are wrong, the proxy listener confuses exactly the
pairs a human would. A confusion matrix over minimal pairs is a phoneme-level
intelligibility report — and a *diagnosis*, because confusions pattern by
feature (voicing confusions → source/VOT bugs; place confusions → formant
transition bugs).

## Workflow 3: "propose better soundings"

Once "better" is measurable, proposing is an optimization loop, and agents are
tireless optimizers:

- **Objective-driven parameter search.** Pick a target (Hillenbrand ellipse
  centroid, MCD-to-oracle, UTMOS score, minimal-pair accuracy). Perturb
  parameters within citation-justified bounds. Measure. Iterate. Crucially the
  result stays *explainable*: "moved F2 target for /æ/ from 1720→1660 Hz;
  Hillenbrand distance fell 0.8σ; MCD to DECtalk unchanged" is a provenance
  record, not an opaque tuned blob. Bounds from the literature keep the
  optimizer from wandering into inhuman settings.
- **Judge panels in measurement space.** Render N candidate variants of a
  change; score each against the full battery; synthesize a verdict. The
  multi-agent version: independent agents each propose a variant from a
  different paper's perspective (one argues Fant, one argues Stevens), then
  measurements adjudicate.
- **A/B perceptual diff.** Given two renders, produce a *localized* diff in
  measurement space: "variants differ only in 2–4 kHz during the /s/ at
  0.42–0.51s; variant B has 4 dB more energy there and 12 ms shorter
  frication." This converts "the bits differ" (useless) into a linguistic
  description of *what would sound different* (actionable) — see the
  perceptual diff report idea below.

## The economics of the one real ear

Q is the only calibrated listener, which makes Q's listening time the scarcest
instrument in the lab. Two design consequences:

**1. Every heard defect becomes a permanent detector.** When Q hears something
bad ("klsyn88 sounds quiet," "I heard only h + hiss"), the response is not
just "fix it" — it is "find the measurable signature of what Q heard, encode
it as a detector, add it to the battery." Click → sample-discontinuity
detector. Quiet → loudness-normalized RMS against sibling experiments. Buzz
in fricatives → harmonicity-in-unvoiced-segments detector. Hiss-only speech →
voiced-segment periodicity check (the KLGLOTT88 detector). Over time this
builds a **defect signature library**: Q's ear, amortized into infrastructure
agents can run forever. The library is the institutional memory of every bad
sound ever heard.

**2. Maximize information per listen.** When agents do need the ear, they
should present a prepared experiment, not a raw WAV: paired A/B with one
controlled difference, a timestamped segment ("listen to 0.8–1.2s; hypothesis:
the /t/ burst is doubled"), and a stated prediction the listen will confirm or
refute. One listen should settle one question. Tooling: a small
`scripts/listen-pack.ts` that cuts segments, loudness-matches them, orders
them for blind comparison, and records the verdict next to the hypothesis.

## Things not on the original list

**Synthetic perception experiments.** The classic phonetics literature
includes *perception* results, not just production measurements: categorical
perception of VOT continua (the /b/–/p/ boundary near +25–30 ms), cue trading,
formant-transition place cues. With an ASR or phone classifier as the
experimental subject, we can *replicate these experiments* on Qlatt output:
synthesize an 11-step VOT continuum, ask the proxy listener to identify each
step, check the identification function is sigmoid with the boundary where
Lisker & Abramson put it. This is a functional test of cue implementation that
no waveform metric can express — and it turns a second shelf of the paper
library (the perception papers) into executable tests.

**The perceptual diff report.** When a golden test fails today, the output is
"rmsError 0.003" — an alarm with no content. Build the tool that answers *what
changed, in phonetic vocabulary*: align old vs new, localize differences in
time and frequency, map time ranges to track segments/phonemes, emit "diff
confined to F0 contour, +4 Hz on final syllable" or "new energy at 6–10 kHz
during all voiced segments [suspicious: possible aliasing/noise leak]." This
changes golden-test failures from "re-bless or panic" into informed decisions,
and it is the single biggest quality-of-life tool for earless agents working
on this codebase.

**Audio linting (property-based invariants).** Claims test cited effects;
lints test things that must *never* happen, phrase-independent: no sample
discontinuities above a click threshold; no energy during track-silence; no
NaN/Inf (exists); formants within physiological bounds; formant *velocities*
within articulator-speed bounds (F2 can't move 1000 Hz in 5 ms); periodicity
present wherever AV says voiced; no periodicity where only AF/AH active;
output level within loudness window. Run on every render of every test.
Property-based generation too: random phrase fuzzing against the lint battery
finds the cluster nobody synthesized before.

**Voice-quality metrics for source work.** Current and upcoming LF-source /
tilt / voice work needs HNR, jitter, shimmer, H1-H2, H1-A3 extraction — the
Gobl/Childers voice-quality literature states its expectations in exactly
those terms. Without these extractors, source changes are evaluated by
spectral band energies, which is the wrong vocabulary.

**Spectrogram reading as agent triage.** A `scripts/spectrogram.ts` that
renders a labeled PNG (time-aligned phone boundaries from the track drawn on
it) lets any multimodal agent do the phonetician's glance: "the formant tracks
visibly break at each segment boundary — transitions aren't being applied."
Cheap to build, fuzzy as evidence, excellent as a hypothesis generator.
Verdicts still come from numbers.

**Cross-backend equivalence as a standing battery.** Generalize the KLGLOTT88
lesson: every (experiment × frontend × source) combination should have a
node-vs-browser realization comparison in the battery, at the *feature* level
(periodicity, energy, formants), not just sample equality. "Browser-silent"
must be a class of bug that is structurally impossible to ship again.

**Measurement provenance.** The battery's own outputs should flow into the
provenance system: a verdict record citing the claim, the extractor version,
the measured value, the paper. "Why do we believe /æ/ is right?" should be
answerable the same way "why is F0 142 Hz?" is. Same DAG, new record types.

## What "should sound like" means, finally

For an earless agent, "X sounds right" cashes out as the conjunction of:

1. lints pass (nothing physically/articulatorily impossible, no defects from
   the signature library),
2. cited claims hold (the literature's predictions are measurably present),
3. references agree (within tolerance of oracle/corpus distributions in
   feature space),
4. proxy listeners succeed (ASR hears the right words; minimal pairs don't
   confuse; MOS predictor doesn't flag),
5. and the one real ear, spent sparingly on prepared experiments, has no
   standing veto.

None of these is "hearing." Together they are something arguably stronger:
they are *reproducible* hearing, with citations.

## Rough build order (value ÷ effort, descending)

1. **Independent pitch + formant + periodicity extraction** (layer 3 bridge;
   Praat/parselmouth or vendored YIN + Burg LPC). Everything else consumes it.
2. **Audio lint battery** including the voiced-periodicity check (the
   KLGLOTT88 detector) wired into render-phrase paths, node and browser.
3. **ASR round-trip + minimal-pair confusion harness** (first proxy listener).
4. **Claim schema + runner** (`test/claims/`), seeded with vowel-formant
   ellipses (Peterson & Barney / Hillenbrand) and duration claims (Klatt
   1976 / Crystal & House) — tables already extracted in `papers/`.
5. **Perceptual diff report** on golden-test failure.
6. **Spectrogram PNG renderer** with track-aligned phone labels.
7. **Defect signature library** scaffold + listen-pack protocol for Q.
8. **Feature-space oracle comparison** (DTW + MCD, per-phone) replacing raw
   waveform correlation in `scripts/oracle/`.
9. **Synthetic perception experiments** (VOT continuum first).
10. **Corpus-level distribution checks**; **MOS predictors** (needs model
    hosting decision — external dependency, ask Q).
