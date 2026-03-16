---
title: "Weninger et al. 2013 — On the Acoustics of Emotion in Audio"
authors: "Felix Weninger, Florian Eyben, Bjorn W. Schuller, Marcello Mortillaro, Klaus R. Scherer"
year: 2013
full_title: "On the acoustics of emotion in audio: what speech, music, and sound have in common"
published: "Frontiers in Psychology, May 2013, doi: 10.3389/fpsyg.2013.00292"
---

# Weninger et al. 2013 — On the Acoustics of Emotion in Audio

## One-sentence summary

Cross-domain analysis showing that loudness and energy features are the primary acoustic correlates of arousal across speech, music, and environmental sounds, while valence features are domain-specific and sometimes inversely correlated across domains.

## Problem

Can a single set of acoustic descriptors predict emotion (arousal/valence) across speech, music, and environmental sound? Prior work treated these domains independently.

## Key contributions

1. Demonstrates that cross-domain arousal recognition is feasible (r up to 0.78) using automatically selected acoustic features
2. Shows valence features are harder to generalize; some features have *inverse* correlations across domains
3. Introduces the Cross-Domain Correlation Coefficient (CDCC) for automatic feature selection across domains
4. Provides evidence for evolutionary co-evolution of affect expression in speech, music, and sound

## Databases used

| Database | Domain | Instances | Audio length | Annotators | Arousal agreement (r) | Valence agreement (r) |
|----------|--------|-----------|-------------|------------|----------------------|----------------------|
| GEMEP | Enacted speech (French) | 154 | 6 min | 20 | 0.64 | 0.68 |
| VAM | Spontaneous speech (German TV) | 947 | 50 min | 6-17 | 0.81 | 0.56 |
| NTWICM | Popular music (UK charts 1983-2010) | 2648 | 168 h | 4 | 0.70 | 0.69 |
| ESD | Environmental sounds (animals, nature, tools, etc.) | 390 | 25 min | 4 | 0.58 | 0.80 |

All annotations averaged using Evaluator Weighted Estimator (EWE): weighted mean where weight = correlation of rater k with mean rating.

## Feature set: ComParE (INTERSPEECH 2013)

6373-dimensional feature set. Built from 65 low-level descriptors (LLDs) x functionals.

### Low-level descriptors (64 LLDs + deltas)

**Energy-related (4):**
- Sum of auditory spectrum (loudness) — perceptually weighted, outperforms raw RMS
- Sum of RASTA-filtered auditory spectrum
- RMS energy
- Zero-crossing rate

**Spectral (55):**
- RASTA-style auditory spectrum bands 1-26 (0-8 kHz)
- MFCC 1-14
- Spectral energy 250-650 Hz, 1k-4k Hz
- Spectral roll-off points: 0.25, 0.50, 0.75, 0.90
- Spectral flux, centroid, entropy, slope
- Psychoacoustic sharpness, harmonicity
- Spectral variance, skewness, kurtosis

**Voicing-related (6):**
- F0 (via SHS + Viterbi smoothing)
- Probability of voicing
- Log HNR
- Jitter (local, delta)
- Shimmer (local)

### Functionals applied to LLD contours

- Quartiles 1-3, inter-quartile ranges
- Min (1st percentile), Max (99th percentile), range
- Position of min/max
- Arithmetic mean, root quadratic mean
- Centroid, flatness
- Standard deviation, skewness, kurtosis
- Relative duration above 25/50/75/90% of range
- Relative duration rising / positive curvature
- Linear prediction gain + LP coefficients 1-5
- Mean/max/min/SD of segment length
- Peak statistics (mean, amplitude mean, inter-peak distances, rising/falling slopes)
- Linear regression slope, offset, quadratic error
- Quadratic regression a, b, offset, quadratic error
- Percentage of non-zero frames (F0 only)

## Key findings: Feature relevance

### Arousal features (Table 4)

**Best cross-domain arousal features (generalize across sound/music/speech):**
1. **Loudness — quadratic regression offset** (CDCC3 = 0.37): captures intensity climax. Strong in music (r=0.57), moderate in speech/sound.
2. **Loudness — arithmetic mean** (CDCC3 = 0.31): strongest for speech and sound, weaker for music
3. **Spectral flux — quadratic regression offset** (CDCC3 = 0.31)
4. **Energy 1-4 kHz — quartile 1** (CDCC3 = 0.31)

**Domain-specific arousal features:**
- Sound: Loudness RQM (r=0.59), loudness linear regression offset (r=0.54), loudness 99th percentile (r=0.53)
- Speech: Spectral flux RQM (r=0.75), spectral flux arithmetic mean (r=0.76) — note: spectral flux outperforms loudness for speech
- Music: Loudness mean peak distance (r=-0.58, periodic = more aroused), spectral entropy mean peak distance (r=-0.54)
- F0 is speech-only: r=0.37 for speech, near zero elsewhere

**Critical insight:** Loudness correlates better than raw RMS energy for arousal, indicating perceptual auditory frequency weighting matters.

### Valence features (Table 5)

**Cross-domain valence features are weak and hard to interpret:**
1. Spectral centroid — rise time (CDCC3 = 0.12)
2. Psychoacoustic sharpness — rise time (CDCC3 = 0.12)
3. Energy 250-650 Hz — IQR 1-3 (CDCC3 = 0.12)

**Domain-specific valence features:**
- Sound: Loudness quartile 3 (r=-0.31) — loud sounds perceived as unpleasant
- Speech: F0 quartile 2 (r=0.27) — higher F0 = more positive; Energy 1-4 kHz mean (r=0.23)
- Music: Loudness mean peak distance (r=-0.65) — same feature but indicates positive valence (inverse of speech)

**Critical insight — inverse valence encoding:**
- MFCC 1 median: "percussive" music (flat spectrum) = positive valence; "noisy" voices (flat spectrum) = negative valence
- Loudness: loud sounds/voices = low valence; loud music = high valence
- This asymmetry makes cross-domain valence regression fundamentally harder than arousal

## Regression results (SVR)

### Cross-Domain Correlation Coefficient (CDCC)

For two domains i, j:
```
CDCC2(f,i,j) = (r_f(i) + r_f(j)) / 2 - |r_f(i) - r_f(j)| / 2
```

Generalized to J domains:
```
CDCC_J(f) = sum_{i<j} [r_f(i) + r_f(j) - |r_f(i) - r_f(j)|] / [J(J-1)]
```

High CDCC = feature correlates similarly with emotion across domains. Range [-1, 1].

### Arousal regression (Table 6)

| Setting | Feature set | Mean r across all train/test pairs |
|---------|------------|-----------------------------------|
| Full 6373 features | ComParE | 0.50 |
| 200 task-specific (CDCC2) | Per domain pair | **0.65** |
| 200 generic (CDCC3) | All domains | 0.58 |

Best cross-domain results:
- Train on sound, test on enacted speech: r = 0.78
- Train on enacted speech, test on spontaneous speech: r = 0.77
- Within-domain enacted speech: r = 0.85

### Valence regression (Table 7)

| Setting | Feature set | Mean r |
|---------|------------|--------|
| Full 6373 features | ComParE | 0.12 (most cross-domain results non-significant or negative) |
| 200 task-specific (CDCC2) | Per domain pair | **0.44** |
| 200 generic (CDCC3) | All domains | 0.32 |

Best cross-domain: Train on enacted speech, test on music: r = 0.60
Within-domain music: r = 0.82

**Key result:** Without feature selection, cross-domain valence regression fails entirely (negative correlations common). CDCC2 selection rescues it.

## SVR parameters

- Algorithm: Support Vector Regression with Sequential Minimal Optimization (Platt 1999)
- Implementation: Weka
- C parameter: 10^-3 (within-domain), 10^-5 (cross-domain) — lower C for cross-domain to increase regularization
- Preprocessing: Per-database unsupervised mean and variance normalization
- Gold standard: Evaluator Weighted Estimator (EWE) of rater annotations

## Implementation relevance for Qlatt

### Direct relevance: Acoustic correlates of emotion in speech

The paper confirms and quantifies specific acoustic-to-affect mappings useful for emotional speech synthesis:

**Arousal correlates (for controlling perceived activation/energy):**
- Primary: loudness (perceptually weighted), spectral flux
- Secondary: MFCC changes (timbre variation rate), F0 (speech-specific)
- Spectral flux RQM is the single best speech arousal feature (r=0.76) — measures rapid spectral change

**Valence correlates (for controlling perceived positivity/negativity):**
- F0 (higher = more positive, speech-specific)
- Energy in 1-4 kHz band (speech frequency range)
- Spectral characteristics more domain-specific and harder to generalize

### Implications for speaker personality / emotion system

1. **Arousal is easier to control than valence** — loudness and spectral flux generalize well; valence requires speech-specific features (F0, formant structure)
2. **Perceptual loudness > raw energy** — auditory frequency weighting matters for perceived arousal; raw amplitude manipulation is insufficient
3. **Spectral flux as arousal cue** — rapid spectral changes (fast formant transitions, varied phonetic content) increase perceived arousal independently of loudness
4. **F0 is speech-specific for both arousal and valence** — does not generalize to other domains, but is strongly predictive within speech

### What this does NOT provide

- No synthesis parameter mappings (this is an analysis/recognition paper)
- No specific F0 contour shapes for emotions
- No formant frequency targets for emotional speech
- No duration or timing parameters

## Evolutionary hypothesis

The paper argues (following Scherer 1991, 2013) that speech and music co-evolved from primitive affect bursts, sharing a common production mechanism (vocalization). The high cross-domain consistency for arousal may reflect this shared evolutionary origin — loudness/energy as a universal activation signal. The inconsistency for valence may reflect later divergence as speech and music took on more specialized representational functions.

## Collection Cross-References

### Already in Collection (cited or citing)
- [[Burkhardt_2005_GermanEmotionalSpeechDatabase]] — EMO-DB used as reference emotional speech corpus; GEMEP database in this paper serves a similar role for enacted emotion.
- [[Eyben_2015_GeMAPS_AcousticParameters]] — Cites Weninger 2013; GeMAPS feature set is a reduced, standardized version of the ComParE features used here. Weninger's cross-domain feature analysis directly informed GeMAPS parameter selection.
- [[Scherer_2001_VocalEmotionCrossCultural]] — Scherer is co-author; his appraisal theory framework underlies the arousal/valence dimensional model used here.

### Cited By (in Collection)
- [[Eyben_2015_GeMAPS_AcousticParameters]] — Cites as ref [24] for cross-domain acoustic emotion features.
- [[KaczmarekMajer_2024_AcousticMarkersBipolar]] — Cites the openSMILE tool co-developed by Weninger/Eyben.
- [[Staib_2021_CorticalVoiceProcessing]] — Cites the openSMILE development work.
- [[Wiethoff_2008_CerebralEmotionalProsody]] — Cross-referenced for arousal correlates convergence.

### Conceptual Links (not citation-based)
- [[Gobl_2003_VoiceQualityEmotion]] — Strong. Gobl provides synthesis-side voice quality parameters for emotions (breathy, tense, etc.); this paper provides analysis-side acoustic features that predict emotion perception. Together they bridge analysis-to-synthesis for emotional voice.
- [[Burkhardt_2009_VoiceQualityFormantSynthesis]] — Strong. Burkhardt synthesizes emotional speech; Weninger identifies which acoustic features best predict arousal (loudness, spectral flux) vs valence (F0, spectral shape), directly informing synthesis parameter priorities.
- [[Banse_1996_VocalEmotionAcousticProfiles]] — Strong. Banse provides emotion-specific acoustic profiles for 14 categories; Weninger provides the dimensional (arousal/valence) decomposition showing which features generalize. The two approaches are complementary.
- [[Scherer_TaskLoadStressAcoustics]] — Moderate. Scherer separates cognitive load from stress effects; Weninger's arousal dimension subsumes both but does not distinguish them. Scherer's granular distinction adds nuance to Weninger's dimensional model.
- [[Grollero_2023_CoreAffectVocalBursts]] — Moderate. Grollero examines arousal/valence in vocal bursts (non-speech); Weninger includes environmental sounds as a third domain alongside speech and music, with similar cross-domain arousal consistency findings.
- [[Goudbeek_2010_ValencePotencyVocalEmotion]] — Moderate. Goudbeek shows valence requires spectral balance measures (H1-H2, spectral slope) beyond F0; Weninger confirms valence is harder than arousal to predict and domain-specific.
- [[Belyk_2014_AcousticValenceEmotion]] — Moderate. Belyk examines acoustic valence encoding; Weninger's finding of inverse valence correlations across domains provides an explanation for why valence recognition is harder.
- [[Cummings_1995_GlottalExcitationEmotionalSpeech]] — Moderate. Cummings examines glottal source parameters across emotions; Weninger's feature set includes voicing-related features (HNR, jitter, shimmer) but finds these less predictive than energy/spectral features for arousal.

## References of interest

- Burkhardt et al. 2005 — German emotional speech database (EMO-DB)
- Grimm et al. 2008 — VAM corpus (spontaneous emotional speech)
- Juslin & Laukka 2003 — comprehensive review: emotion expression in speech vs. music (similar acoustic parameters)
- Scherer 1991 — evolutionary origin of affect expression in speech and music
- Schuller et al. 2013 — INTERSPEECH 2013 ComParE feature set definition
