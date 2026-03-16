---
title: "Analysis of Vocal Disorders With Methods From Nonlinear Dynamics"
authors: "Hanspeter Herzel, David Berry, Ingo R. Titze, Marwa Saleh"
year: 1994
venue: "Journal of Speech and Hearing Research, 37(5), 1008-1019"
doi_url: "10.1044/jshr.3705.1008"
---

# Analysis of Vocal Disorders With Methods From Nonlinear Dynamics

## One-Sentence Summary

Applies nonlinear dynamics analysis (phase space embedding, bifurcation detection, attractor classification) to pathological voice signals, demonstrating that vocal disorders produce characteristic bifurcation patterns (period-doubling, subharmonics, chaos) that can be identified through F0/amplitude contours, autocorrelation, and phase portraits.

## Problem Addressed

Traditional voice analysis (jitter, shimmer, HNR) fails to distinguish between turbulent noise and deterministic nonlinear phenomena in disordered voices. This paper bridges nonlinear dynamics theory and clinical voice analysis, showing that many "rough" or "hoarse" voice qualities arise from low-dimensional deterministic chaos rather than random noise, and that specific analysis techniques can detect this.

## Key Contributions

- Demonstrates that bifurcations (period-doubling, subharmonics, tori, chaos) are prevalent in pathological voices -- found in ~25% of 95 dysphonic patients
- Provides accessible nonlinear analysis techniques: phase space embedding, F0/amplitude contours with autocorrelation, next-amplitude maps, phase portraits
- Unifies terminology for describing rough voice: maps clinical terms (diplophonia, biphonation, creaky voice, vocal fry, etc.) to attractor types from nonlinear systems theory
- Shows that vocal fry and creaky voice can be understood as manifestations of desynchronization of vocal fold vibratory modes
- Identifies specific mechanisms: left-right desynchronization, horizontal-vertical mode desynchronization, ventricular fold interaction, subglottal/supraglottal coupling

## Methodology

Analysis of sustained vowel "a" recordings from 95 dysphonic patients across three pathology groups:
1. Dysphonia with minimal associated pathological lesions (nodules 14, polyps 8, cysts 5, Reinke's edema 8)
2. Organic dysphonia (paralysis 16, neoplastic 8)
3. Functional dysphonia (phonasthenia 11, hypofunctional 4, hyperfunctional 11, hyperfunctional childhood 6, mutational 4)

Recordings: sustained vowel "a", 20 kHz sampling rate, 16-bit resolution.

### Analysis Pipeline
1. **Perceptual evaluation** -- listen for subharmonics, roughness, low-frequency modulations
2. **Spectrographic displays** -- narrow-band spectrograms to identify subharmonics, bifurcations, chaotic segments
3. **Waveform displays** -- inspect acoustic waveform for amplitude modulations, sudden onsets
4. **F0 and amplitude contour extraction** -- low-pass filter above F0 (~200 Hz for males), zero-crossing detection for period boundaries, least-mean-squares waveform matching
5. **Autocorrelation of F0 and amplitude contours** -- reveals period-doublings, subharmonic structure
6. **Phase portraits** -- delay-coordinate embedding of acoustic signal in reconstructed phase space
7. **Next amplitude/period maps** -- detect tori (ellipsoidal closed curves) and other attractor structures

## Key Equations

### Phase Space Embedding (Delay Coordinates)
$$
\mathbf{x}(t) = \{x(t), x(t + \tau), \ldots, x[t + (m-1)\tau]\}
$$
Where:
- $x(t)$ = scalar time series (acoustic signal)
- $\tau$ = delay time (chosen as fraction of pitch period)
- $m$ = embedding dimension (typically 2 or 3)

### Second-Order Perturbation Functions
$$
F_i = \frac{f_{i+1} + f_{i-1}}{2} - f_i
$$
$$
A_i = \frac{a_{i+1} + a_{i-1}}{2} - a_i
$$
Where:
- $f_i$ = i-th extracted frequency (or $a_i$ for amplitude)
- $F_i$ = second-order frequency perturbation
- $A_i$ = second-order amplitude perturbation
- These remove long-term trends and drifts, revealing modulations and period-doublings

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Sampling rate | -- | Hz | 20000 | -- | Recording parameter |
| Resolution | -- | bits | 16 | -- | Recording parameter |
| Low-pass cutoff for F0 detection | -- | Hz | ~200 | varies | Slightly above F0 for male voices; adjustable |
| Embedding dimension | m | -- | 2 or 3 | 2-3 | For phase portrait visualization |
| Delay time | tau | ms | ~1-2.5 | fraction of pitch period | Chosen as fraction of fundamental period |

## Implementation Details

### F0 and Amplitude Contour Extraction
1. Low-pass filter acoustic (or EGG) signal at cutoff slightly above F0 (typically ~200 Hz for male)
2. Detect zero-crossings of filtered signal to find approximate period boundaries
3. Refine period estimates using least-mean-squares waveform matching on unfiltered signal (Milenkovic 1987)
4. Compute amplitude as max-min difference within each cycle
5. Apply second-order perturbation functions (Eqs. 2-3) to remove long-term trends

### Autocorrelation of Contours
- Apply autocorrelation to F0 and amplitude contours
- Period-doubling: autocorrelation shows alternating pattern with period 2
- Subharmonics: characteristic peaks at subharmonic intervals
- Useful for detecting modulations not obvious in raw contours

### Phase Portrait Construction
- Choose delay time tau as fraction of pitch period
- Embedding dimensions m = 2 or 3
- Normal phonation: limit cycle (closed curve)
- Period-doubling: more complex closed curve
- Torus: donut-shaped attractor (two independent frequencies)
- Chaos: complex, non-repeating trajectory filling region of phase space

### Next Amplitude/Period Maps
- Plot a(n+1) vs a(n) (successive amplitudes) or period(n+1) vs period(n)
- Limit cycle: single point
- Period-doubling: two points
- Torus: closed ellipsoidal curve
- Chaos: scattered points (but with structure)

## Figures of Interest

- **Fig 1 (p. 1009):** Phase space embedding illustration -- time series to phase portrait, limit cycle attractor
- **Fig 2 (p. 1011):** Narrow-band spectrogram of hyperfunctional childhood disorder -- abrupt transitions to subharmonic regimes, period-tripling from 300-800 msec
- **Fig 3 (p. 1011):** Acoustic waveform (1000 msec) from laryngeal paralysis patient showing bifurcations to low-frequency amplitude modulations in segments (b) and (d)
- **Fig 4 (p. 1012):** Amplitude contours and autocorrelation: (a) period-doubling for nodules patient, (b) 30 Hz low-frequency modulation for paralytic dysphonia
- **Fig 5 (p. 1013):** Phase portraits -- (a) normal phonation limit cycle, (b) complex attractor from laryngeal paralysis
- **Fig 6 (p. 1014):** Next amplitude map approximating closed ellipsoidal curve = torus (two independent frequencies)
- **Fig 7 (p. 1015):** Acoustic waveform, amplitude contour, autocorrelation, and enumerated next-amplitude map for paralytic dysphonia -- rotation angle ~120 degrees = period-three
- **Fig 8 (p. 1016):** Cancer patient utterance with beating-like segments and sudden regime jumps
- **Fig 9 (p. 1016):** Hyperfunctional childhood dysphonia with various transitions across 8 utterance segments
- **Fig 10 (p. 1017):** Amplitude contour showing period-tripling transition, and F0 contour showing ~40 Hz modulation perceived as vocal fry
- **Fig 11 (p. 1017):** Male hyperfunctional dysphonia with period-doubling transition and 40 Hz amplitude modulation

## Results Summary

### Prevalence of Nonlinear Phenomena
- About 25% of 95 dysphonic patients showed indications of bifurcations and attractors
- Previous study (Herzel & Wendler 1991): bifurcations and chaos detected in ~50% of patients (that cohort was more severely hoarse)
- Not all hoarse voices show low-dimensional dynamics; severely breathy voices have too much turbulence for attractor detection

### Types of Bifurcations Observed
1. **Period-doubling**: alternating amplitudes/periods, subharmonics at F0/2 in spectrum
2. **Secondary Hopf bifurcation**: appearance of independent modulation frequency, torus attractor, low-frequency modulations (~20-40 Hz)
3. **Period-tripling**: three-fold alternation, seen as ~120-degree rotation in next-amplitude maps
4. **Frequency jumps**: sudden transitions between different limit cycles (octave jumps)
5. **Chaotic episodes**: noisy, non-repeating segments bounded by bifurcation transitions

### Terminology Mapping (Nonlinear Dynamics <-> Clinical)
| Attractor Type | Clinical Terms |
|---|---|
| Limit cycle (periodic) | Normal phonation |
| Torus (two independent frequencies) | Biphonation, diplophonia |
| Chaotic attractor (nonperiodic) | Rough/hoarse voice, noise concentrations |
| Period-doubling bifurcation | Subharmonic vocalization, octave jump |
| Secondary Hopf bifurcation | Low-frequency modulation, vocal fry |

## Limitations

- Analysis limited to sustained vowels; running speech introduces many more variables
- Phase portrait and attractor analysis require relatively long, stationary segments (often not available in pathological voices)
- Severely breathy/turbulent voices are too unstable for attractor detection
- Fractal dimensions and Lyapunov exponents (more rigorous chaos measures) require even longer stationary segments than available
- The paper provides qualitative analysis and classification rather than quantitative measures
- Cannot always distinguish between desynchronization mechanisms from acoustic signal alone

## Testable Properties

- Period-doubling must produce alternating high-low pattern in amplitude contours with period 2
- Autocorrelation of period-doubled signal must show negative peak at lag 1 and positive peak at lag 2
- Torus attractor must produce closed ellipsoidal curve in next-amplitude map
- Period-tripling must show ~120 degree rotation angle in enumerated next-amplitude map
- Subharmonic at F0/N must appear as peak at F0/N in narrow-band spectrogram
- Phase portrait of normal phonation must approximate a closed curve (limit cycle) in 2D or 3D embedding
- Low-frequency modulation (~20-70 Hz) in amplitude contour should be detectable by autocorrelation even when not visible in raw waveform

## Relevance to Project

This paper is directly relevant to modeling voice quality in a synthesizer:

1. **Voice disorder simulation**: The bifurcation types cataloged here (period-doubling, subharmonics, tori, chaos) provide a taxonomy for implementing different kinds of vocal roughness in the Klatt synthesizer. Each type has distinct acoustic signatures that could be generated by appropriate modulation of source parameters.

2. **Vocal fry modeling**: The paper explicitly connects vocal fry to low-frequency amplitude modulation (~40 Hz) arising from secondary Hopf bifurcation. This provides a principled basis for the synthesizer's vocal fry implementation -- it should introduce a low-frequency modulation of amplitude rather than simply reducing F0.

3. **Desynchronization mechanisms**: The four identified mechanisms (left-right fold desynchronization, horizontal-vertical mode desynchronization, ventricular fold interaction, acoustic coupling) map to different parameter manipulations in a synthesizer model.

4. **Jitter/shimmer interpretation**: The paper shows that jitter and shimmer are insufficient to characterize nonlinear phenomena -- period-doublings and low-frequency modulations are deterministic, not random. This matters for how the synthesizer implements perturbation: random jitter vs. structured modulation produce perceptually different results.

5. **Perceptual correlates**: Subharmonic modulations around 70 Hz produce roughness perception (psychoacoustics of Zwicker & Fastl 1990); below ~70 Hz they are perceived as vocal fry. This gives concrete frequency boundaries for roughness vs. fry simulation.

## Open Questions

- [ ] How to map the specific bifurcation types to Klatt synthesizer parameters (AV, F0, AH modulation patterns)?
- [ ] What are the precise F0/amplitude modulation depths and frequencies for each bifurcation type?
- [ ] Can the two-mass model (Ishizaka & Flanagan 1972) produce all the documented bifurcation types through parameter variation?
- [ ] How do the nonlinear phenomena interact with the formant filter -- do subharmonics excite formants differently?

## Related Work Worth Reading

- **Titze, I.R. (1993)** - *Vocal fold physiology: New frontiers in basic science* (book) - comprehensive nonlinear dynamics of phonation
- **Titze, I.R. (1991)** - A model of neurologic sources of aperiodicity in vocal fold vibration, JSHR 34, 460-472
- **Ishizaka & Flanagan (1972)** - Synthesis of voiced sounds from a two-mass model, Bell System Technology Journal 51, 1233-1268
- **Titze, Baken, & Herzel (1993)** - Evidence of chaos in vocal fold vibration (in *Vocal fold physiology*)
- **Berry, Herzel, Titze, & Krischer (in press at time of pub)** - Interpretation of biomechanical simulations of normal and chaotic vocal fold oscillations, JASA
- **Steinecke & Herzel (1994)** - *Bifurcations in an asymmetric vocal fold model* - manuscript submitted
- **Klatt & Klatt (1990)** - Analysis, synthesis, and perception of voice quality, JASA 87, 820-841
- **Hollien & Michel (1968)** - Vocal fry as a phonational register, JSHR 11, 600-604
- **Scherer (1989)** - Physiology of creaky voice and vocal fry, JASA 86(S1), S25(A)

## Collection Cross-References

### Already in Collection
- [[Klatt_1990_VoiceQualityVariations]] — cited as Klatt & Klatt 1990; provides the KLSYN88 synthesizer parameters (AH, TL, OQ, FL) that are the implementation targets for the voice quality variations this paper categorizes from a nonlinear dynamics perspective
- [[Titze_1991_NeurologicAperiodicity]] — cited as Titze 1991; models neurologic sources of jitter via motor unit firing, which Herzel 1994 explicitly distinguishes from the deterministic nonlinear phenomena (period-doubling, subharmonics) analyzed here. The two papers address complementary sources of aperiodicity: Titze models stochastic neurologic jitter, Herzel characterizes deterministic bifurcation-driven irregularity.

### Cited By (in Collection)
- (none found)

### New Leads (Not Yet in Collection)
- Steinecke & Herzel (1994) — "Bifurcations in an asymmetric vocal fold model" — mathematical analysis of how left-right vocal fold asymmetry produces bifurcations; directly relevant to asymmetric vocal fold modeling
- Berry, Herzel, Titze, & Krischer (in press ~1994) — "Interpretation of biomechanical simulations of normal and chaotic vocal fold oscillations" (JASA) — eigenmode analysis linking vibration modes to bifurcation patterns
- Hollien & Michel (1968) — "Vocal fry as a phonational register" — foundational definition of vocal fry as a register, which Herzel reinterprets as a secondary Hopf bifurcation phenomenon

### Supersedes or Recontextualizes
- (none)

### Conceptual Links (not citation-based)
- [[Lucero_2005_VocalFoldBifurcations]] — Lucero analyzes Hopf bifurcation at phonation onset/offset in a single-DOF mucosal wave model, characterizing super/subcritical transitions and hysteresis. Herzel 1994 documents the empirical acoustic signatures of bifurcations (period-doubling, tori, chaos) observed in pathological voices. These are complementary: Lucero provides the mathematical framework for onset-type bifurcations, Herzel catalogs the full range of bifurcation phenomena observable in clinical recordings. Herzel's observation that tiny parameter changes can cause abrupt regime transitions maps directly to Lucero's bifurcation diagrams.
- [[Lucero_1999_BifurcationsVoiceOnsetOffset]] — Lucero 1999 numerically demonstrates onset/offset hysteresis in the two-mass model (subcritical Hopf at onset, fold bifurcation at offset, Ps_offset/Ps_onset ratio ~0.45). This complements Herzel's clinical observations: the abrupt regime transitions Herzel documents in dysphonic patients are instances of the bifurcation mechanisms Lucero characterizes mathematically.
- [[Kreiman_2012_VoiceQualityHarmonicOQ]] — Kreiman shows that OQ alone is insufficient to predict spectral tilt (H1*-H2*) and that speakers use different strategies for voice quality variation. Herzel's finding that "roughness" comprises multiple distinct nonlinear phenomena (period-doubling vs. torus vs. chaos) parallels Kreiman's finding that "voice quality" is multi-dimensional and not reducible to a single parameter. Both papers argue against oversimplified models of voice quality.
