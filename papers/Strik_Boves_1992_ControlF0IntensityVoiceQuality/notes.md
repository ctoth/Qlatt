---
title: "Strik & Boves 1992 — Control of fundamental frequency, intensity and voice quality in speech"
year: 1992
---

# Strik & Boves 1992 — Control of fundamental frequency, intensity and voice quality in speech

## Key Finding: Transglottal Pressure Dominates F0 and IL Control in Speech

In normal conversational speech, transglottal pressure (P_tr) is more important than subglottal pressure (P_sb) for controlling F0 and intensity. This contradicts the common assumption (based on sustained vowel phonation studies) that P_sb is the primary predictor.

## Why P_tr, Not P_sb

- In sustained vowel phonation, oral pressure (P_or) is approximately zero, so P_tr ~ P_sb
- In connected speech, P_or varies considerably due to vocal tract constrictions
- P_tr = P_sb - P_or; when P_or is non-negligible, P_tr and P_sb diverge substantially
- For a single voiced interval: P_tr and P_or are much better predictors of F0 than P_sb (Table I)
- For all voiced frames: P_sb and P_tr explain roughly equal proportions of F0 variance, but this is because both show declination patterns over entire utterances (Table II)

## Correlation Data

### Table I: Voiced interval correlations (N=66, |R| > 0.315 for p < 0.01)

| | F0 | IL | P_tr | P_or | P_sb |
|---|---|---|---|---|---|
| F0 | 1.000 | 0.808 | 0.851 | -0.783 | 0.478 |
| IL | | 1.000 | 0.960 | -0.983 | 0.111 |
| P_tr | | | 1.000 | -0.968 | 0.274 |
| P_or | | | | 1.000 | -0.504 |
| P_sb | | | | | 1.000 |

Key: Within a voiced interval, P_tr correlates 0.851 with F0, while P_sb correlates only 0.478.

### Table II: All voiced frames correlations (N=293, |R| > 0.151 for p < 0.01)

| | F0 | IL | P_tr | P_or | P_sb |
|---|---|---|---|---|---|
| F0 | 1.000 | 0.667 | 0.729 | -0.153 | 0.772 |
| IL | | 1.000 | 0.923 | -0.663 | 0.492 |
| P_tr | | | 1.000 | -0.638 | 0.612 |
| P_or | | | | 1.000 | 0.211 |
| P_sb | | | | | 1.000 |

Key: Over complete utterance, P_sb correlation with F0 rises to 0.772 due to shared declination trend.

## F0 to P_sb Ratio

- Estimates from speech and special phonation: 5-15 Hz/cm H2O (Collier, 1975; Maeda, 1976; Strik & Boves, 1989)
- Ratio of F0 change to P_sb change alone is approximately 2-5 Hz/cm H2O
- In "normal" speech, other factors (especially laryngeal muscles) also control F0
- The ratio of total F0 change to P_sb change in utterances is often larger than 2-5 Hz/cm H2O

## IL vs P_tr Regression

From 293 voiced frames of median signals:

```
IL = 41.6 + 30.3 * log(P_tr)    (N=293, R=0.90)
```

Equivalently, intensity I of the radiated speech wave is proportional to P_tr to the power 3.03. This is consistent with prior findings:
- Bouhuys et al. (1968): power of ~3.0
- Cavagna & Margaria (1968): power of 3.3 +/- 0.7
- Isshiki (1964): power of 3.0 +/- 1.0
- Tanaka & Gould (1983): power of 3.18

## Glottal Volume Flow Parameters (LF Model)

The paper uses the Liljencrants-Fant (LF) model with parameters:
- **U_0**: maximum amplitude of flow during open glottis interval
- **E_e**: excitation strength (amplitude of dU_g/dt at moment of glottal closure)
- **T_0**: fundamental period
- **Duty cycle**: proportion of open phase within pitch period

### E_e vs P_tr (Excitation Strength)

For steady phonation data (148 of 181 samples):

```
E_e = 6.1 * 10^(0.074 * P_tr)    (R=0.79)
```

An exponential fit is slightly better than linear.

### U_0 vs P_tr (Peak Flow)

```
U_0 = 12.7 * 10^(0.030 * P_tr)   (R=0.72)
```

### E_e vs U_0 Correlation

For steady phonation:

```
E_e = 4.9 + 0.75 * U_0    (R=0.80, N=148)
```

Very high correlation between E_e and U_0 for steady phonation. Other parameters (T_0, skewness, duty cycle) have less effect on this relationship.

## Three Regimes for Flow Waveform vs P_tr

1. **Steady phonation** (bulk of samples, 148/181): Exponential E_e-P_tr and U_0-P_tr fits hold well
2. **V-UV and UV-V transitions**: E_e is relatively lower compared to steady phonation, especially at voicing onset
3. **Utterance-final /a/**: Deviates considerably from regression lines (see below)

## Utterance-Final Syllable Effects

At the end of the utterance:
- F0, IL, P_tr, and P_sb decrease substantially
- Marked increase in SH (sternohyoid) muscle activity during the last syllable
- Larynx returns toward rest position, lowering begins before phonation stops

### Voice Quality Changes in Final Syllable

Comparing stressed vowel /a/ (first syllable) vs. unstressed final /a/:
- P_tr decreases from ~5.5 cm H2O to ~4.2 cm H2O
- AC-component of glottal flow (U_0) increases by ~6%
- Open quotient approximately 50% in both vowels
- First harmonic ~1.5 dB stronger relative to second harmonic in final vowel
- Increased noise at frequencies above ~1.4 kHz in F3 region of final vowel
- Evidence for a breathy (not pressed) voice quality at utterance end
- E_e decreases ~14% in final vowel
- T_0 is substantially larger for final vowel than first vowel
- The change in U_0 (+6%) combined with change in F0 (~-20%) determines the change in E_e (-14%)

## Implications for Synthesis

1. **LF model limitations**: The LF model cannot explain the different regimes found between E_e and P_tr, or between U_0 and P_tr, because P_or does not figure in the model. Multiple regimes in the E_e-P_tr relationship need models with physiological basis (Titze 1984; Cranen 1990).

2. **Voice quality at utterance boundaries**: The breathy quality at utterance endings is not simply a matter of lower P_sb but involves specific changes in glottal flow waveshape. For a synthesizer, this means utterance-final vowels should have:
   - Increased spectral tilt (H1 stronger relative to H2)
   - Increased noise in higher formant regions (especially F3)
   - These effects are separate from the F0 and IL declination

3. **IL control**: Use P_tr (not P_sb) as the control parameter for intensity. The power-law relationship IL ~ P_tr^3 is robust across studies.

4. **Declination**: Both F0 and IL show declination over the utterance, partly driven by the gradual decrease in P_sb.

## Measurement Details

- Subject: single male native Dutch speaker
- Utterance: "Ik heb het idee dat mijn keel wordt afgeknepen door die band" (29 repetitions)
- Simultaneous recordings: acoustic signal, EGG, lung volume, P_sb, P_or, and EMG of SH and VOC muscles
- F0 and IL calculated every 5 ms (200 Hz sampling rate)
- Pressure signals low-pass filtered and downsampled to 200 Hz
- Inverse filtering used to derive glottal volume flow (LPC-based, closed glottis interval)
- Median signals from 29 repetitions used (non-linear time-alignment method)

## Collection Cross-References

### Already in Collection
- `Klatt_1990_VoiceQualityVariations` — Klatt & Klatt 1990, voice quality variations including breathiness
- `Isshiki_1964_VoiceIntensityRegulation` — Isshiki 1964, intensity regulation mechanisms

### Cited By (in Collection)
- `Alku_2002_NormalizedAmplitudeQuotient` — cites Strik & Boves 1992 for LF model fitting approach
- `Alku_1997_ParabolicSpectralParameter` — references Strik's voice source work
- `Fant_1997_VoiceSourceConnectedSpeech` — references Strik's prosodic voice source findings
- `Doval_2003_VoiceSourceCALM` — cites Strik & Boves for pressure-source relationships
- `Doval_2006_SpectrumGlottalFlowModels` — references Strik's voice source parameter data
- `Drugman_2020_GlottalSourceEstimation` — cites Strik & Boves for inverse filtering context

### New Leads
- Collier 1975 — Physiological correlates of intonation patterns (F0 declination modeling)
- Titze 1984 — Parameterization of glottal area, flow, and vocal fold contact area

### Conceptual Links (not citation-based)
- `Bjorklund_2016_SubglottalPressureSPL` — both quantify the pressure-to-SPL relationship; Bjorklund provides normative data while Strik & Boves focus on transglottal pressure
- `Gobl_1988_VoiceSourceDynamicsConnectedSpeech` — both study LF model parameter variation in connected speech; complementary datasets (Dutch vs Swedish)
- `Sundberg_1993_PhonatoryControlSinging` — both investigate pressure-intensity relationships; Sundberg extends to singing phonation modes
- `Holmberg_1988_GlottalAirflowPressure` — both measure glottal airflow and pressure; Holmberg provides male/female comparison
