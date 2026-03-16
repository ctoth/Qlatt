---
title: "Sensitivity of Odd-Harmonic Amplitudes to Open Quotient and Skewing Quotient in Glottal Airflow (L)"
authors: "Ingo R. Titze"
year: 2015
venue: "Journal of the Acoustical Society of America, Vol. 137, No. 1, pp. 502-504"
doi_url: "http://dx.doi.org/10.1121/1.4904539"
---

# Sensitivity of Odd-Harmonic Amplitudes to Open Quotient and Skewing Quotient in Glottal Airflow (L)

## One-Sentence Summary
Demonstrates that a perfectly symmetric glottal pulse (Qo=0.5, Qs=1.0) eliminates odd harmonics, and quantifies the minimal asymmetry needed to restore a balanced harmonic spectrum — critical for choosing glottal source parameters in formant synthesis.

## Problem Addressed
A half-sinusoid glottal pulse (the simplest model) has no odd harmonics beyond the fundamental. This would cause: (1) missing formant excitation at odd-harmonic frequencies, degrading vowel intelligibility; (2) pitch doubling (perceived octave up) since only even harmonics remain. The paper quantifies how much pulse asymmetry is needed to avoid these artifacts.

## Key Contributions
- Shows that odd harmonics vanish at exact symmetry (Qo=0.5, Qs=1.0) due to phase cancellation
- Quantifies safe operating ranges: Qo below 0.45 or above 0.55, and/or Qs >= 2.0
- Provides a simple parameterized glottal flow formula for generating waveforms with controllable Qo and Qs
- Documents typical human values: women Qo >= 0.6, men Qo 0.55-0.6 in speech, Qo ~0.4 in singing

## Methodology
Parametric sweep of ~100 waveform variants using a truncated-exponential-sinusoid model. Fourier analysis of first 6 harmonics. Plots An/A1 (dB) vs. Qo and Qs to show sensitivity near symmetry.

## Key Equations

### Glottal flow waveform model
$$
u(t) = \max[0, \; e^{\alpha t}(\beta + \sin \omega t)]
$$
Where:
- $\alpha$ controls skewing (applied only in open portion, $t > t_c$)
- $\beta$ controls open quotient (raises/lowers the sinusoid relative to zero)
- $\omega = 2\pi f_0$ is the angular fundamental frequency

### Opening and closing times
$$
t_o = \frac{T}{2\pi} \sin^{-1}(-\beta)
$$
$$
t_c = T/2 - t_o
$$
Where $T = 2\pi/\omega$ is the period. $t_o$ is negative when sinusoid is raised ($\beta > 0$).

### Open quotient
$$
Q_o = (t_c - t_o) / T
$$

### Skewing quotient
$$
Q_s = (t_m - t_o) / (t_c - t_m)
$$
Where $t_m$ is the time of peak flow (detected numerically).

## Parameters

| Name | Symbol | Units | Default/Typical | Range | Notes |
|------|--------|-------|-----------------|-------|-------|
| Open quotient | $Q_o$ | dimensionless | 0.5 (symmetric) | 0.4-0.6 (studied) | Duty ratio of glottal opening |
| Skewing quotient | $Q_s$ | dimensionless | 1.0 (symmetric) | 0.4-3.5 (studied) | Rise time / fall time ratio |
| Alpha | $\alpha$ | 1/s | 745 (for Qo=0.55, Qs=2.0) | varies | Controls exponential skewing |
| Beta | $\beta$ | dimensionless | 0.16 (for Qo=0.55, Qs=2.0) | varies | Raises sinusoid to control Qo |

### Typical human values
| Population | $Q_o$ | $Q_s$ | Context |
|------------|-------|-------|---------|
| Women (speech) | >= 0.6 | > 1.0 | General speech |
| Men (speech) | 0.55-0.6 | > 1.0 | General speech |
| Men (singing) | ~0.4 or less | > 1.0 | Singing |
| Safe minimum | < 0.45 or > 0.55 | >= 2.0 | Avoids odd-harmonic loss |

## Implementation Details

### Waveform generation algorithm
1. Choose $\alpha$ and $\beta$ to target desired $Q_o$ and $Q_s$
2. Compute $t_o$ and $t_c$ from Eqs. 2-3
3. Generate one period with ~1000 points
4. Apply $\max[0, \cdot]$ truncation (flow cannot be negative)
5. Apply exponential $e^{\alpha t}$ only in open portion ($t_o < t < t_c$)
6. Detect $t_m$ numerically as location of peak
7. Compute actual $Q_o$ and $Q_s$ from Eqs. 4-5

### Critical thresholds
- **Danger zone**: $Q_o \in [0.45, 0.55]$ AND $Q_s < 2.0$ — odd harmonics suppressed
- **Safe zone**: $Q_o < 0.45$ OR $Q_o > 0.55$ — odd harmonics restored regardless of $Q_s$
- **Safe zone**: $Q_s \geq 2.0$ — odd harmonics restored regardless of $Q_o$
- Combined: $Q_o$ outside [0.45, 0.55] with $Q_s \geq 2$ eliminates all odd-even peaks/valleys

### Spectral characteristics
- Symmetric pulse (Qo=0.5, Qs=1.0): only even harmonics (2, 4, 6, 8...)
- Mildly asymmetric (Qo=0.55, Qs=2.0): all harmonics present, ~-10 dB/octave slope
- Typical natural speech: ~-12 dB/octave slope for flow, ~-6 dB/octave for derivative

## Figures of Interest
- **Fig 1 (page 1):** Half-sinusoid glottal pulse and its spectrum — shows missing odd harmonics
- **Fig 2 (page 2):** Skewed sinusoid (Qo=0.55, Qs=2.0) and spectrum — all harmonics present at ~-10 dB/octave
- **Fig 3 (page 3):** Four-panel sensitivity plot — the key result. Shows An/A1 vs Qo and Qs for harmonics 2-7

## Results Summary
- At exact symmetry (Qo=0.5, Qs=1.0), harmonics 3, 5, 7 vanish completely
- Even harmonics 4, 6 actually *rise* as odd harmonics fall near Qo=0.5
- When Qs=2.0: variation with Qo shows only minor dips, no catastrophic loss
- When Qo=0.55: variation with Qs shows only minor dips, no catastrophic loss
- Spectral slope at mild asymmetry: ~-10 dB/octave (slightly less than typical -12 due to abrupt shutoff)

## Limitations
- Uses simple truncated sinusoid — lacks smooth opening/closing corners of natural phonation
- Sharp cutoff affects higher harmonics and spectral envelope shape
- Only examines first 6 harmonics
- Does not model source-filter interaction (which naturally skews the pulse)
- Does not address the case where glottal area skewing and vocal tract inertance cancel each other

## Relevance to Project
**Direct relevance to LF source parameterization.** The Qlatt synthesizer uses the Liljencrants-Fant (LF) glottal source model, which has its own open quotient and skewing parameters. This paper provides:
1. **Validation constraints**: when choosing default LF parameters, ensure the effective Qo and Qs avoid the symmetry danger zone
2. **Perceptual guidance**: explains why pitch doubling and vowel degradation occur with symmetric pulses — useful for debugging synthesis artifacts
3. **Quick sanity check formula**: the simple model in Eq. 1 could serve as a fast alternative source for testing

## Open Questions
- [ ] How do the LF model's Oq and asymmetry parameters map to Titze's Qo and Qs?
- [ ] Does our current LF source default to parameters in the safe zone?
- [ ] Could the cancellation effect between glottal area skewing and vocal tract inertance cause issues in our synthesis?

## Related Work Worth Reading
- Holmberg et al. (1988) — Measured Qo and Qs values for male/female speakers at different loudness levels
- Titze (2004) — Theory of source-filter interaction that naturally produces skewing
- Ananthapadmanabha & Fant (1982) — Calculation of true glottal flow components (more sophisticated flow model)
- Fant (1960) — Foundational acoustic theory, source spectrum description (already in our collection)

---

## Collection Cross-References

### Already in Collection
- [[Fant_1960_AcousticTheorySpeechProduction]]
- [[Holmberg_1988_GlottalAirflowPressure]]
- [[Stevens_1998_AcousticPhonetics]]

### New Leads (Not Yet in Collection)
- **Ananthapadmanabha & Fant (1982)** — More sophisticated calculation of true glottal flow components. Would inform a higher-fidelity source model than the simplified truncated sinusoid used here.
- **Titze (2004)** — Theory of source-filter interaction that produces natural pulse skewing. Relevant if we ever model acoustic feedback from the vocal tract back to the source.
