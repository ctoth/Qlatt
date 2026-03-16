---
title: "Mannell 1998 — Formant Diphone Parameter Extraction — Implementation Notes"
year: 1998
---

# Mannell 1998 — Formant Diphone Parameter Extraction — Implementation Notes

## Key Contribution

A multi-pass, probability-constrained formant parameter extraction system for building formant-parameter diphone databases from a labelled single-speaker corpus. Includes a bandwidth estimation formula and an analysis-by-synthesis method for intensity and bandwidth refinement.

## Bandwidth Estimation Formula

The initial bandwidth estimate for each formant:

```
Bx = (80 + 120 * Fx / 5000) * W
```

Where:
- `Bx` = bandwidth of formant x (Hz)
- `Fx` = centre frequency of formant x (Hz)
- `W` = 1 for voiced speech, 2 for voiceless speech

This produces a linear relationship between formant frequency and bandwidth:
- At Fx = 0 Hz: Bx = 80 Hz (voiced), 160 Hz (voiceless)
- At Fx = 500 Hz: Bx = 92 Hz (voiced), 184 Hz (voiceless)
- At Fx = 1000 Hz: Bx = 104 Hz (voiced), 208 Hz (voiceless)
- At Fx = 2500 Hz: Bx = 140 Hz (voiced), 280 Hz (voiceless)
- At Fx = 5000 Hz: Bx = 200 Hz (voiced), 400 Hz (voiceless)

These are used as initial estimates; final bandwidths are refined via analysis-by-synthesis.

## Formant Frequency Tracking Algorithm

### Overview (Two-Pass System)

Uses a segmented and labelled speech database (10 kHz sampling rate). Two LPC orders used:
- **14-coefficient LPC**: major spectral peaks (used for initial neutral vowel analysis)
- **24-coefficient LPC**: accurate peak positions, especially for closely-spaced formants

### First Pass

**Stage 1**: Analyse neutral vowel /3:/ (Australian English schwa-like vowel, non-nasal contexts only) to determine:
- N1-N5: approximate neutral formant frequencies for the speaker
- Ns: average inter-formant spacing

If only 4 formants below 5 kHz, speaker assumed to have short vocal tract; only 4 formants tracked thereafter.

**Stage 2**: Derive vowel-class-specific probability spaces for F1-F3 using N1-N5 and Ns.
- Front/central/back vowels get different F2 probability formulae
- High/mid/low vowels get different F1 probability formulae
- F4/F5 have single probability space for all vowel classes

Example for central vowels F2: p=1 if (N2 - Ns/2) <= F2 <= (N2 + Ns/2); p=0 if F2 >= N3 or F2 <= N1; linear interpolation in between.

Peak selection heuristic when two peaks compete:
1. Equal intensity (within 1 dB): select highest probability peak
2. Equal probability (within +/-0.1): select more intense peak
3. Equal both: select peak closest to neutral value
4. Lower probability but more intense: deduct p=0.1 per dB intensity difference

Results displayed graphically; trained phonetician selects ellipses encompassing valid targets (defines p=0.9-1.0 space for second pass).

### Second Pass

**Stage 1**: Track all vowels (targets + transitions + diphthong glides) using refined probability ellipsoids.
- Inner ellipsoid: p=0.9 (boundary) to 1.0 (centre)
- Outer ellipsoid: p=0.0 to 0.9, boundaries 2x distance from centre
- Trajectory constraints applied
- Between-target transitions: linear interpolation of probability ellipsoids
- CV/VC transitions: tracked outward from vowel targets; onset/offset values define consonant probability spaces

**Stage 2**: Consonant formant frequencies determined using onset/offset probability spaces. Models pole continuity (not actual resonance peaks for consonants like /s/).

Less than 5% of tokens required hand correction.

## Analysis-by-Synthesis for Intensity and Bandwidth

Target synthesiser: SHLRC Parallel Formant Synthesiser "MU-TALK" (Clark et al. 1986, Summerfield & Clark 1986).

### Intensity Extraction
- Initial values: all formants set to RMS average intensity of each frame
- Step size: 1 dB (approximately the intensity difference limen per Florentine et al. 1987)
- Formants > 0.8 * Ns apart: varied independently
- Formants < 0.8 * Ns apart: varied as pairs (e.g., F1+F2 for back vowels, F2+F3 for high front vowels, Fn+F1 for all nasalised vowels)
- Minimise frame-by-frame Euclidean spectral distance (on 24-coefficient dB-scaled LPC spectra)

### Bandwidth Refinement
- After intensity extraction, bandwidths modified in steps of 20% of current bandwidth (per Flanagan 1972: approximately formant bandwidth difference limen)
- Gains held fixed during bandwidth modification
- Same Euclidean spectral distance minimisation criterion

### Spectral Distance Regions
- Each formant analysed in frequency band from mid-point to adjacent formant below to mid-point to adjacent formant above
- Lower bound of lowest formant: 0 Hz
- Upper bound of highest formant: 5000 Hz (Nyquist)

## Relevance to Klatt Synthesis

1. **Bandwidth formula** `Bx = (80 + 120 * Fx/5000) * W` provides a simple, implementable initial bandwidth estimate as a function of formant frequency and voicing state. Useful as a default/fallback when no measured bandwidths are available.

2. **Formant proximity threshold** of 0.8 * Ns (average formant spacing) for determining when formants interact perceptually — relevant to parallel formant synthesiser gain calculations where closely-spaced formants affect each other's peak levels.

3. **Analysis-by-synthesis methodology** demonstrates that bandwidth refinement in 20% steps and intensity refinement in 1 dB steps are perceptually meaningful step sizes aligned with psychoacoustic difference limens.

## Collection Cross-References

### Already in Collection
- `Flanagan_1972_SpeechAnalysisSynthesisPerception` — formant bandwidth difference limen (~20%)

### Cited By (in Collection)
- `Iseli_2007_VoiceSourceAgeSexVowel` — references Mannell for formant extraction methodology

### Conceptual Links (not citation-based)
- `Kent_Vorperian_2018_VowelFormantBandwidths` — both provide bandwidth estimation approaches; Kent & Vorperian provide age/sex-dependent data, Mannell provides a frequency-dependent formula
- `Ericsson_2020_FormantEstimationEvaluation` — both address formant tracking accuracy
- `Conkie_1997_OptimalCouplingDiphones` — both address diphone synthesis unit construction
