# Formant Research Notes: Spectral Modeling, Higher Formants, and Future Directions

These notes capture what we learned from investigating why Klatt synthesizers use only 5-6 formants, what happens when you run one at 44.1 kHz instead of 10 kHz, and where we might go next. Written for someone who knows music and basic signal processing but isn't a DSP PhD.

---

## 1. The Unified Math: All Spectral Models Are H(z) in Different Clothes

The single most important insight from this research: **formant synthesis, LPC, cepstral analysis, and harmonic/sinusoidal modeling are four different parameterizations of the same mathematical object** -- the vocal tract transfer function H(z).

The vocal tract is a tube. Tubes have resonances. In the z-transform domain, each resonance appears as a pole of H(z), a complex conjugate pair whose angle encodes the formant frequency and whose radius encodes the bandwidth. Everything else is bookkeeping.

### The Conversion Diamond

```
              Formant (F, BW)
              /            \
    matched-z              polynomial
    transform              factoring
            /                \
    z-Plane Poles  <---->  LPC Coefficients
            \                /
    Taylor series      recursion
    of -log A(z)       (Makhoul 1975)
              \            /
          Cepstral Coefficients
```

All four corners represent the same denominator polynomial of H(z). Moving between them involves only algebra -- no approximations. (The matched-z discretization is negligible for audio-band signals.)

### Why source-filter separation works

The chain of transformations that makes this possible:

| Domain | Operation | What it means |
|--------|-----------|---------------|
| Time | Convolution | Source * Tract * Radiation -- can't separate |
| Frequency | Multiplication | S(w) = U(w) * H(w) * R(w) -- separate by division |
| Log-frequency (Cepstral) | Addition | log S = log U + log H + log R -- separate by subtraction |

Convolution becomes multiplication becomes addition. Each step makes the components easier to pull apart. Source and tract occupy different quefrency regions of the cepstrum, so a simple lifter can separate them.

### Minimum phase: magnitude determines everything

The vocal tract is modeled as an all-pole filter. All stable all-pole filters are minimum-phase, which means their magnitude spectrum uniquely determines the phase spectrum (via the Hilbert transform). This is why LPC, cepstral analysis, and formant analysis can all reconstruct the complete transfer function from magnitude information alone -- the phase comes for free.

---

## 2. Why 5-6 Formants: The Real Answer

### The physical constraint: ~1 formant per kHz

A 17 cm vocal tract (average adult male) is a tube whose resonances are spaced at roughly c/(2L) = 35000/(2*17) = ~1000 Hz. For 5 kHz of audio bandwidth, that gives about 5 formants. For 8 kHz, about 8. For full 20 kHz audible range, about 20.

The number of formants is not a free parameter. It is determined by the vocal tract length and the analysis bandwidth: approximately one per kilohertz.

### Klatt's 5 was matched to 10 kHz sample rate

Klatt's 1980 synthesizer ran at 10 kHz sampling rate, giving 5 kHz of audio bandwidth. Five cascade formants was a natural match. He built in the ability to use 4 or 6 (the NFC parameter), and in 1987 explicitly listed "optimal number of formants for cascade vs parallel branches" as an **unresolved question**.

The number 5 was pragmatic, not principled. Klatt knew it.

### At 44.1 kHz, we're worse off than Klatt

Here's the key insight from the implementation investigation: **our 44.1 kHz synthesizer is actually worse than Klatt's 10 kHz one in one specific way.**

A digital resonator at frequency f inherently represents analog poles at f, f + fs, f + 2*fs, etc. (z-transform pole repetition). At Klatt's 10 kHz sample rate, these phantom poles appear at 10 kHz, 20 kHz, etc. -- close enough to the audio band that they approximate the effect of unmodeled higher formants. Holmes (1983) notes: "No higher-pole correction needed if using sampled-data at minimum rate, inherent in z-transform."

At 44.1 kHz, the phantom poles are pushed to 44.1 kHz -- far above the audible range. We do NOT get the automatic higher pole correction. Our 5 formants model 5 kHz of spectral shaping, and the remaining 17 kHz up to Nyquist is unmodeled.

### Klatt never had an explicit higher pole correction

A common misconception: the original Klatt 1980 synthesizer does NOT implement a higher pole correction factor. The `* 170` in COEWAV.FOR is a constant output scaling for integer arithmetic, not a frequency-dependent correction. The synthesizer simply accepted the spectral error from unmodeled higher formants. The "higher pole correction" that Fant, Holmes, and Rabiner discuss is a concept from acoustic analysis and from other synthesizer designs, but Klatt 80 didn't implement one.

---

## 3. What We Did: F7-F10 Cascade Formants

### The implementation

We added 4 cascade-only resonators using Rabiner (1968) default values:

| Formant | Frequency (Hz) | Q Factor | Bandwidth (Hz) |
|---------|---------------|----------|----------------|
| F7 | 6500 | 9 | 722 |
| F8 | 7500 | 6 | 1250 |
| F9 | 8500 | 4 | 2125 |
| F10 | 9500 | 2 | 4750 |

These continue the neutral vowel spacing of ~1000 Hz per formant (F1=500, F2=1500, ..., F10=9500). The bandwidths follow the trend of decreasing Q with increasing frequency -- higher formants are progressively more heavily damped. F6 has Q=11, F7 Q=9, F8 Q=6, F9 Q=4, F10 Q=2. The bandwidth roughly doubles each time above F7.

### What it replaces

The implicit higher pole correction we never had. By adding explicit resonators, we get actual spectral shaping in the 6.5-10 kHz region instead of a flat rolloff. This matters more at 44.1 kHz than it would at 10 kHz because we lack the z-transform phantom pole benefit.

### Why cascade only

The parallel branch uses formants only for shaping frication noise, and frication at 6.5-9.5 kHz is not phonologically contrastive for any English phoneme. Adding parallel F7-F10 would require ndbScale calibration (extending beyond the existing A1-A6 values of -58, -65, -73, -78, -79, -80) with no clear perceptual payoff.

### What about ndbScale?

Lalwani (1992) warns that the "scale factor method requires exactly five resonators for 5 kHz bandwidth." Adding cascade formants technically changes the cascade transfer function, which could affect cascade-parallel matching during SW transitions. In practice, the parallel branch is independently controlled by user parameters (A1-A6), so ndbScale values should not need adjustment for the initial implementation.

### The FormantBank abstraction

We used the FormantBank expansion mechanism, which made adding 4 new formants trivial rather than requiring manual duplication of node definitions. The higher formants follow the same pattern as F1-F6 -- they're just more resonator nodes in the cascade chain.

---

## 4. Future Direction: Speaker-Varying Higher Formants

### The evidence

Barreda (2015) demonstrated that F4 and F5 carry speaker size information -- each additional formant up to F5 improved size-judgment consistency in their experiments. Their stimuli used 11 formants (F1-F11), with F6-F11 placed at 1000 Hz increments above F5.

The key finding: **higher formant variation is mostly between speakers, not within-speaker across phonemes.** F6-F11 at fixed values are acceptable for modeling a single speaker, but NOT for modeling different speakers. F1-F3 vary by phoneme, F4-F5 vary somewhat, and F6+ vary primarily by vocal tract length (i.e., speaker body size and sex).

### What we could do

Expose F7-F10 frequencies (and possibly bandwidths) as speaker profile parameters rather than phoneme parameters. Instead of changing them per frame (like F1-F3), they would be set once per speaker and remain constant throughout an utterance. This maps naturally to vocal tract length: a shorter tract (child, small adult) would have higher F7-F10 values, and a longer tract (large adult) would have lower ones.

### How novel is this?

Limited existing literature. Barreda (2015) shows the perceptual relevance but doesn't propose a synthesis implementation. Lalwani (1992) supports up to 8 formants but provides no guidance on speaker-varying higher formants. We'd be in somewhat novel territory.

---

## 5. Future Direction: Residual Spectral Envelope

### The problem Holmes identified

Holmes (1983) stated explicitly that formant synthesis "cannot model fine harmonic-by-harmonic spectrum detail." Formant resonances create smooth spectral envelopes. All harmonics under a given formant peak are shaped identically by that peak's transfer function. There is no mechanism for one harmonic at 2100 Hz to differ from another at 2200 Hz except through the smooth curvature of the formant.

### The Bonada solution: EpR

Bonada's (2008) EpR (Excitation plus Resonances) model addresses this directly by separating the spectrum into:

1. A **smooth resonance envelope** -- equivalent to formant synthesis
2. A **residual envelope** -- everything the smooth resonances miss

The residual captures:
- Anti-resonances (zeros from nasal/tracheal coupling)
- Spectral fine structure from source-tract interaction
- Speaker-specific spectral coloring
- Harmonic-level detail that smooth formants cannot represent

### Implementation idea

A per-harmonic correction layer on top of formant synthesis. The formant chain provides the coarse spectral shape; a residual envelope adds fine corrections at each harmonic frequency. This would bridge formant synthesis and harmonic models using the shared math from Section 1 -- the residual is just the difference between the discrete harmonic amplitudes and the smooth formant envelope, measured at the harmonic frequencies.

This connects back to the conversion diamond: the harmonic amplitudes are samples of |H(z)| at h*f0. The formant envelope is a smooth interpolation through those samples. The residual is the sampling error.

### Why we didn't do this yet

It's an analysis-synthesis technique -- you need real speech recordings to estimate the residual. Our current approach is fully parametric (rules and targets, no recorded speech input). Implementing a residual envelope would require either a corpus of residual measurements or a physical model that predicts them.

---

## 6. Future Direction: Harmonic-Level Control

### The evidence for per-harmonic importance

Titze (2015) analyzed the first 6 harmonics of glottal flow and showed dramatic perceptual consequences of individual harmonic amplitudes:
- Symmetric glottal pulses (Qo=0.5, Qs=1.0) eliminate odd harmonics entirely
- This causes "missing formant excitation at odd-harmonic frequencies, degrading vowel intelligibility" and perceived pitch doubling
- Mild asymmetry restores all harmonics at ~-10 dB/octave slope

Individual harmonics matter. The formant envelope shapes them, but the source spectrum determines which harmonics exist in the first place.

### The spectral tilt problem

The Klatt model uses a single TL (spectral tilt) parameter -- a first-order filter that tilts the entire spectrum by a fixed amount. This is too crude:

- **Childers & Lee (1991):** Voice quality types differ in overall spectral slope (normal: ~-12 dB/octave, breathy: ~-18 dB/octave, pressed: shallower), suggesting at minimum different slope values per voice quality.
- **Lienard (1999):** Spectral tilt changes non-uniformly with vocal effort -- "higher formants increase MORE than lower ones with effort (A3: 1.30 dB/dB vs A1: 1.10 dB/dB)." A single slope cannot model this.
- **Kreiman (2012):** The H1*-H2* relationship to Open Quotient is speaker-dependent, not a universal formula. KLGLOTT88 assumes a fixed mapping that doesn't hold across speakers.

### What better control would look like

Per-band or per-harmonic tilt, rather than a single TL parameter. This connects to the cepstral domain: low cepstral coefficients control the smooth spectral envelope (formant positions), and higher coefficients control finer spectral detail. More cepstral coefficients = finer spectral control = closer to per-harmonic shaping.

The Harmonic Richness Factor (HRF = sum of higher harmonic amplitudes / H1 amplitude) from Childers & Lee would be a more meaningful control parameter than TL for voice quality.

---

## 7. Future Direction: Physical Modeling Above 3 kHz

### The plane wave breakdown

Holmes (1983) noted a fundamental limitation: the plane wave assumption underlying all tube models and formant theory becomes invalid above ~3 kHz. Above this frequency, cross-modes appear in the vocal tract -- the acoustic wavefront is no longer one-dimensional. This means formants F4 and above are approximations of a more complex acoustic reality.

### Specific structures that matter

Feugere (2017) models the piriform sinus (pear-shaped cavities at the base of the pharynx) as an anti-resonance at 4.7 kHz with Q=2.5. This spectral notch affects the perception of sibilants and high-frequency consonants. A standard Klatt synthesizer with only poles (no zeros above the nasal region) cannot model this.

Sundberg (1972) showed that professional singing creates extra resonances: a lowered larynx compresses 5 formants below 3 kHz, requiring at least 6 total formants for singing synthesis. The sinus piriformes creates a spectral zero at 3-4 kHz, adding further spectral detail that poles alone cannot capture.

### What physical modeling could add

In the region above 3 kHz, physical modeling (wave propagation in 3D vocal tract geometry) could complement formant synthesis by providing the cross-mode effects, anti-resonances from piriform and valleculae, and the general spectral fine structure that the plane wave tube model misses.

### Current coverage

Not explored in our papers collection. This is a gap.

---

## 8. Open Questions

1. **How many formants actually improves perceptual quality?** No paper in our collection answers this empirically. There is no study that synthesizes speech with 5, 6, 7, 8, ... formants and measures perceptual quality differences. Klatt listed this as unresolved in 1987. It remains unresolved.

2. **Does F7-F10 improve naturalness or just theoretical accuracy?** We added them based on acoustic reasoning (spectral correction at 44.1 kHz). Whether listeners can tell the difference is unknown.

3. **What are the correct F7-F10 targets for non-neutral vowels?** The Rabiner defaults assume neutral vowel spacing. For extreme vowels like /i/ or /u/ where F1-F3 shift dramatically, do F7-F10 also shift? Probably not much (higher formants are less sensitive to articulation), but we have no data.

4. **Should we pursue the EpR residual approach or go straight to more formants?** The residual envelope captures detail that no number of formants can, but it requires analysis data. More formants is purely parametric. The approaches are complementary, not competing.

5. **At what point does adding formants become equivalent to LPC synthesis?** With enough formants (say, 20), the cascade synthesizer is essentially an LPC all-pole filter with explicit pole control. The advantage of formant synthesis (interpretable, articulatorily meaningful parameters) diminishes as the number of formants grows beyond what can be controlled individually. There's a sweet spot, but where?

6. **Does the remaining 12.5 kHz of uncorrected spectrum (9.5 kHz to 22.05 kHz Nyquist) matter perceptually?** Even with F10 at 9.5 kHz, our 44.1 kHz synthesizer has a large spectral gap above F10. No paper addresses whether this gap is audible.

---

## 9. Key Citations

| Reference | Contribution to this investigation |
|-----------|-----------------------------------|
| **Klatt (1980)** | NFC parameter (4-6), 5 cascade formants as default, no higher pole correction implemented |
| **Klatt (1987)** | Explicitly lists "optimal number of formants" as unresolved |
| **Klatt & Klatt (1990)** | NF parameter (1-6), tracheal coupling as evidence 5 formants alone are insufficient |
| **Fant (1960)** | Mathematical foundation for higher pole correction (kr3, kr4, kr5 formulas), neutral vowel spacing |
| **Holmes (1983)** | Higher pole correction = ~57 dB at 5 kHz; plane wave breaks above 3 kHz; formant synthesis "cannot model fine harmonic-by-harmonic spectrum detail" |
| **Rabiner (1968)** | F4-F10 default frequencies and Q factors for 20 kHz digital synthesizer; z-transform pole repetition insight |
| **Sundberg (1972)** | Singing requires 5 formants below 3 kHz; piriform sinus anti-resonance at 3-4 kHz |
| **Bonada (2008)** | EpR model: smooth resonances + residual envelope; "residual captures spectral details not modeled by smooth resonances" |
| **Barreda (2015)** | F4-F5 carry speaker size information; used 11 formants in stimuli; higher formants vary between speakers, not within phonemes |
| **Lalwani (1992)** | Extended Klatt to 8 formants; warns ndbScale calibrated for exactly 5 formants |
| **Titze (2015)** | Individual harmonic amplitudes have dramatic perceptual consequences; source symmetry eliminates odd harmonics |
| **Childers & Lee (1991)** | Harmonic Richness Factor differentiates voice types; spectral slope varies by voice quality |
| **Lienard (1999)** | Spectral tilt varies by frequency band with vocal effort, not a single slope |
| **Kreiman et al. (2012)** | H1*-H2* to OQ mapping is speaker-dependent, not universal |
| **Feugere (2017)** | Piriform sinus anti-resonance at 4.7 kHz |
| **Schotz (2006)** | FH parameter: 3 double-pole higher formant approximation |
| **Schwarz & Rodet (~1999)** | Comparison of spectral envelope representations; formants trade precision for compactness |
| **Makhoul (1975)** | LPC-to-cepstral recursion enabling the conversion diamond |
| **Drugman (2020)** | Complex cepstrum source-filter separation; minimum/maximum phase decomposition |
| **Milner (2002)** | MFCC computation chain; cepstral truncation determines spectral resolution |
