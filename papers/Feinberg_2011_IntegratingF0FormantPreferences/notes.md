# Integrating Fundamental and Formant Frequencies in Women's Preferences for Men's Voices

**Authors:** D. R. Feinberg, B. C. Jones, L. M. DeBruine, J. J. M. O'Connor, C. C. Tigue, D. J. Borak
**Year:** 2011
**Venue:** Behavioral Ecology, 22:1320–1325
**DOI:** 10.1093/beheco/arr134

## One-Sentence Summary
Demonstrates that women integrate F0 (pitch) and formant frequencies (vocal tract length) interactively — not independently — when judging male voice attractiveness, supporting a cue amplification model.

## Problem Addressed
Prior work treated voice pitch preferences and vocal tract length preferences as independent effects. This paper tests whether they interact: does the effect of low pitch on attractiveness depend on apparent vocal tract size, and vice versa?

## Key Contributions
- First evidence for interaction between F0 and formant frequency cues in vocal attractiveness judgments
- Low pitch is more attractive when paired with large apparent vocal tract (low formants)
- Large vocal tract is more attractive when paired with low pitch
- Supports cue amplification model (Candolin 2003) rather than backup signaling
- Low pitch + small vocal tract may sound incongruous and reduce attractiveness

## Methodology
- 6 male voice recordings manipulated in Praat
- Vocal tract length altered by resampling ±15% then restoring original sample rate (shifts all formants uniformly)
- Pitch shifted by ±0.5 ERB (equivalent rectangular bandwidths) of original F0
- 4 conditions per voice: {raised/lowered pitch} × {shortened/lengthened VTL}
- Two forced-choice experiments with 83 women each:
  - **Pitch Test**: Choose preferred pitch (low vs high) at each VTL condition
  - **Vocal Tract Test**: Choose preferred VTL (large vs small) at each pitch condition
- Both lab (n=43) and internet (n=40) samples; results consistent across modalities

## Key Equations

No formal equations. The manipulation parameters are the implementable content:

### Vocal Tract Length Manipulation
Resample audio by ±15% of original sampling rate, then override with original rate. This shifts all formant frequencies uniformly by ±15% while preserving duration and F0.

### Pitch Manipulation
Shift F0 by ±0.5 ERB of the unmanipulated original. ERB (equivalent rectangular bandwidth) at frequency f:

$$ERB(f) = 24.7 \cdot (4.37 \cdot f/1000 + 1)$$

For a male voice at ~120 Hz: ERB(120) ≈ 25.99 Hz, so ±0.5 ERB ≈ ±13 Hz shift.

## Parameters

| Name | Symbol | Units | Value | Notes |
|------|--------|-------|-------|-------|
| VTL shift | — | % | ±15 | Applied to sampling rate to shift all formants |
| Pitch shift | — | ERB | ±0.5 | Of unmanipulated F0 |
| N voices | — | count | 6 | Male voice recordings |
| N women (Pitch Test) | — | count | 83 | 40 internet + 43 lab |
| N women (VTL Test) | — | count | 83 | 40 internet + 43 lab |

## Implementation Details

### VTL Manipulation (Praat method, per Feinberg et al. 2005)
1. Resample sound at 115% (or 85%) of original sampling rate → shifts all frequencies by +15% (or -15%)
2. Override the new sampling rate with the original sampling rate → restores duration while keeping frequency shift
3. Result: formants shifted uniformly, F0 unchanged, duration preserved

### Pitch Manipulation
- Uses Praat's pitch manipulation (PSOLA or similar)
- Shift amount: 0.5 ERB above or below original F0
- Preserves formant structure and duration

## Results Summary

### Pitch Test (F1,82 = 26.21, p < 0.001)
- Low pitch preferred 64% of time when VTL large (significantly above chance)
- Low pitch preferred only 45% of time when VTL small (not above chance)
- Internet sample: women actually preferred *high* pitch with small VTL (35% chose low, p = 0.002)

### Vocal Tract Test (F1,81 = 22.47, p < 0.001)
- Large VTL preferred 72% of time when pitch low (strongly above chance)
- Large VTL preferred 59% of time when pitch high (weakly above chance)

### Key Interaction
Low pitch amplifies preference for large VTL. Large VTL amplifies preference for low pitch. This is **cue amplification**, not backup signaling.

## Figures of Interest
- **Fig 1 (page 3):** Bar chart showing proportion of masculinized voices chosen across all 4 conditions, split by internet vs lab sample. Shows clear interaction pattern.

## Limitations
- Only 6 source voices (though authors argue equivalence with larger samples)
- Forced-choice paradigm (not rating scales)
- Uniform formant shift (±15% all formants) doesn't capture natural VTL variation patterns where individual formants may shift differently
- No acoustic measurements of the manipulated stimuli reported
- Internet sample showed unexpected preference for high pitch + small VTL — not fully explained

## Testable Properties
- Low pitch + large VTL should receive highest attractiveness ratings
- High pitch + small VTL may not be rated lowest (internet sample showed preference for congruent high+small)
- The interaction effect should be symmetric: pitch matters more at large VTL, VTL matters more at low pitch
- Congruent combinations (low pitch + large VTL, high pitch + small VTL) should be preferred over incongruent combinations (low pitch + small VTL)

## Relevance to Project
For Qlatt's voice preset system, this paper establishes that F0 and formant frequencies should be manipulated coherently — a "masculine" preset should lower both F0 and formants together, not independently. Incongruent combinations (low F0 with high formants) may sound unnatural or unattractive. The ±15% VTL / ±0.5 ERB F0 manipulation values provide concrete targets for voice quality variation presets.

## Open Questions
- [ ] What is the perceptual threshold for VTL manipulation detection?
- [ ] Does the cue amplification model extend to female voices?
- [ ] How do these preferences interact with voice quality parameters (breathiness, creakiness)?
- [ ] Would more natural (non-uniform) formant shifts produce different interaction patterns?

## Collection Cross-References

### Already in Collection
- [[Feinberg_2008_FemininityAveragenessVoicePitch]] — cited extensively as review of pitch manipulation methods and prior attractiveness findings; this paper extends Feinberg 2008 by testing F0 × formant interaction (which Feinberg 2008 did not)
- [[Collins_2003_VocalVisualAttractiveness]] — cited for foundational finding that women prefer lower-pitched male voices (correlational, pre-manipulation)
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited for source-filter theory framework (independent source and filter)
- [[Babel_2014_VocalAttractiveness]] — in collection, studies vocal attractiveness with breathiness controls; note Babel found F0 effect reversed when breathiness was controlled, whereas this paper found robust low-F0 preference when VTL was large
- [[Zuta_2007_AttractiveMaleVoices]] — in collection, models attractive male voice parameters; predates this work

### New Leads (Not Yet in Collection)
- Feinberg et al. (2005) — "Manipulations of fundamental and formant frequencies influence the attractiveness of human male voices" — original F0+formant manipulation method, precursor to this study
- Smith et al. (2005, 2007) — F0 × VTL interaction effects on size/sex/age perception — perceptual foundation for attractiveness interaction
- Puts (2005) — Menstrual cycle modulates voice pitch preferences — individual differences context
- Candolin (2003) — Theoretical framework: cue amplification vs backup signaling — key for interpreting interaction results

### Cited By (in Collection)
- [[Belin_2017_SoundOfTrustworthiness]] — cites this for F0 × formant interaction in voice attractiveness

### Supersedes or Recontextualizes
- [[Feinberg_2008_FemininityAveragenessVoicePitch]] — this paper extends Feinberg 2008 by demonstrating that F0 and formant preferences are not independent (as Feinberg 2008 treated them) but interact via cue amplification

## Related Work Worth Reading
- Feinberg et al. 2005 — Original manipulation method for F0 + formants; establishes preferences
- Fitch & Giedd 1999 — VTL measurement via MRI; height explains >70% of VTL variance
- Smith et al. 2005, 2007 — F0 × VTL interactions in size/sex/age perception (not attractiveness)
- Charlton et al. 2008 — F0 × formant interaction in red deer (no interaction found, unlike humans)
- Candolin 2003 — Theoretical framework for cue amplification vs backup signaling
- Puts 2005 — Menstrual cycle modulation of voice pitch preferences
- Collins 2000 — Foundational study: men's voices and women's choices

**See also:** Chen_2022_AcousticMasculinityFemininity — confirms F0 and VTL estimators are independent factors via hierarchical clustering (consistent with Feinberg's independent manipulation approach), and quantifies F3/F4/VTL cluster as second most important predictor (~13-16%) after F0
