---
title: "The role of f0 and formant frequencies in distinguishing the voices of men and women"
authors: "James M. Hillenbrand, Michael J. Clark"
year: 2009
venue: "Attention, Perception, & Psychophysics, 71(5)"
doi_url: "https://doi.org/10.3758/APP.71.5.1150"
pages: "1150-1166"
affiliation: "Western Michigan University, Kalamazoo, Michigan"
funding: "NIH grant R01-DC01661 to Western Michigan University"
---

# The role of f0 and formant frequencies in distinguishing the voices of men and women

## One-Sentence Summary
Using a spectral-envelope source-filter resynthesizer to independently scale f0 (by 1.7041) and the whole spectral envelope (by 1.168) on sentences and /hVd/ syllables from 25 men and 25 women, the study shows that shifting **both** parameters flips perceived talker sex only ~82% of the time, that shifting either alone is largely ineffective (12-34% for sentences), and that the two cues combine strongly under-additively — implying substantial residual, non-scaling cues to voice gender that a synthesizer must model separately. *(pp.1150, 1157, 1164)*

## Problem Addressed
Both f0 and formant frequencies are known to cue perceived speaker sex, but no consensus exists on their relative importance, either to one another or relative to other cues. Prior synthesis studies (Whiteside 1998; Smith & Patterson 2005; Smith et al. 2007; Assmann et al. 2006) based all stimuli on 1-4 original talkers, so talker-to-talker variability was uncontrolled. *(p.1153)*

## Key Contributions
- Quadratic-discriminant pattern classification of f0 and F1-F3 over 1,116 /hVd/ tokens from 45 men and 48 women, comparing **absolute vs. vowel-normalized** formant representations. *(p.1153)*
- Two listening experiments using 25 male + 25 female talkers (far more than prior work), with a 2x2 factorial of f0-shift x envelope-shift, in both connected speech (TIMIT sentences) and isolated /hVd/ syllables. *(pp.1155, 1159)*
- Demonstration that individual f0 and envelope effects are strongly **under-additive**: MPO (34.3%) + MEO (18.9%) far below MPE (81.9%); WPO (19.1%) + WEO (11.7%) = 31% far below WPE (82.1%). *(p.1157)*
- Evidence that residual (non-f0, non-formant) cues to speaker sex are carried more strongly by connected speech than by isolated syllables. *(pp.1159, 1163)*
- Correlational test showing that atypical f0/formant values in the original talker explain only a small part of the failures to shift perceived sex. *(p.1162)*

## Study Design
- **Type:** Perceptual identification experiments with synthetic stimuli, plus a preliminary statistical pattern-classification study.
- **Population (classifier):** 1,116 /hVd/ utterances, 12 vowels (/i, ɪ, e, ɛ, æ, ɑ, ɔ, o, ʊ, u, ʌ, ɝ/), 45 men and 48 women, from Hillenbrand, Getty, Clark & Wheeler (1995) = "H95". *(p.1153)*
- **Stimuli, Exp. 1:** Sentences spoken by 25 men and 25 women, drawn at random from the phonetically diverse subset of TIMIT (Zue, Seneff & Glass, 1990), unmodified 16-kHz sample rate. 4 conditions x 50 sentences = 200 test signals. *(p.1155)*
- **Stimuli, Exp. 2:** /hVd/ syllables from 25 men and 25 women, 16-kHz recordings from H95. Corner vowels of the quadrilateral only (/i/, /æ/, /ɑ/, /u/). Actually spoken by 23 different men and 20 different women, with uneven token counts across the 43 talkers. 200 test signals. *(p.1159)*
- **Listeners, Exp. 1:** 21 students majoring in speech-language pathology; passed 25-dB HL hearing screening at octave frequencies 125-4000 Hz. *(p.1156)*
- **Listeners, Exp. 2:** A separate group of 24 normal-hearing students in an introductory phonetics course. *(p.1159)*
- **Task:** Two-alternative forced choice (man / woman) via on-screen buttons, followed by a confidence rating 1 (lowest) to 5 (highest). 200 trials, single random order (not blocked by condition), scrambled separately for each listener. *(p.1157)*
- **Presentation:** Stimuli low-pass filtered at 7.2 kHz, amplified, delivered free field in a quiet room over a single loudspeaker (Paradigm Titan v.3) about 1 m from the listener's head, ~75 dBA for stressed syllables. *(p.1157)*

## The Eight Conditions (2x2 crossed with original talker sex)

| Code | Original talker | f0 | Spectral envelope |
|------|-----------------|----|-------------------|
| MUS | Men | unmodified | unmodified |
| MPE | Men | shifted up | shifted up |
| MPO | Men | shifted up | unmodified |
| MEO | Men | unmodified | shifted up |
| WUS | Women | unmodified | unmodified |
| WPE | Women | shifted down | shifted down |
| WPO | Women | shifted down | unmodified |
| WEO | Women | unmodified | shifted down |

*(p.1155)*

## Methodology: The Spectral Envelope Synthesizer (SES)

The SES is described in detail in Hillenbrand, Houde & Gayvert (2006). It is a pure source-filter resynthesizer, not a formant synthesizer — the filter is the measured spectral envelope, used directly as an FIR impulse response.

**Signal chain (Fig. 3, p.1156):**

1. **Source = pulse sequence at the fundamental period.** A sequence of single-sample, spectrally white pulses whose period is set by the measured instantaneous fundamental period of the signal being reconstructed. *(p.1156)*
2. **Filter = spectrum envelope.** The measured spectral envelope of the speech signal is used directly to define a finite impulse response filter that shapes the flat-spectrum source. *(p.1156)*
3. **Output = filtered pulses**, obtained by convolving the source signal with the time-varying impulse response. *(p.1156)*

**Source variants:** *(p.1156)*
- **Voiced:** periodic single-sample pulse train at the measured fundamental period.
- **Whispered / unvoiced:** replace the periodic pulse train with a sequence of single-sample pulses whose amplitudes are either zero or nonzero with probability **0.5** at each sample point.
- **Mixed source (breathy vowels, voiced fricatives):** add periodic and random pulse sequences with any desired voiced/unvoiced mixing ratio. The amplitude ratio of periodic to aperiodic pulses is set by the measured **degree of periodicity**.
- f0 and degree of periodicity are both measured with a **cepstrum-like pitch tracker** described in Hillenbrand et al. (2006). *(p.1156)*

**Spectral envelope estimation — the "harmonic envelope" method:** *(p.1156)*
- Compute a narrow-band Fourier spectrum: **512 points, 32 ms** window.
- **Linearly interpolate between the harmonics** of that narrow-band spectrum, using the same f0 measurements used to create the source signal.
- The method makes no distinction between periodic and aperiodic speech segments: f0 is measured for all frames regardless of periodicity, and those estimates define the envelope for unvoiced and marginally periodic segments too, even though the "harmonic" peaks will often not correspond to real harmonics. Fig. 4B (p.1157) shows a harmonic envelope for a spectral slice taken from a [kʰ] release burst.
- Related prior method: Paul (1981), the spectral envelope estimation vocoder. *(p.1156)*

**Validation:** Sentence intelligibility for SES resynthesis, evaluated on utterances from the same TIMIT subset used here, was **96.9%** (Hillenbrand et al., 2006). Vowels synthesized with the SES were as intelligible as the natural signals they were based on. *(pp.1156, 1159)*

### Modification of f0 and envelope *(p.1156)*
- **f0 scale factor (men -> women):** all f0 values scaled by **1.7041**, the average ratio of adult female to male fundamental frequencies in the Peterson & Barney (1952) data.
- **Envelope scale factor (men -> women):** spectral envelopes shifted up in frequency by a factor of **1.168**, the average ratio of adult female to male formant frequencies (F1-F3) in the Peterson & Barney data.
- **Women -> men:** the **inverses** of these values were used (i.e., 1/1.7041 = 0.58682 for f0; 1/1.168 = 0.85616 for the envelope).
- The envelope is shifted **as a whole**, implicitly assuming a uniform scaling relationship between the formants of men and women. The authors flag this as a known simplification (see Limitations). *(p.1163)*

## Key Equations

$$
f_{0}^{\text{shifted}} = 1.7041 \cdot f_{0}^{\text{measured}}
$$
Where: f0 values are per-frame measured fundamental frequencies in Hz; the factor is the mean adult-female/adult-male f0 ratio from Peterson & Barney (1952). Applied for MPE and MPO; its reciprocal is applied for WPE and WPO. *(p.1156)*

$$
E^{\text{shifted}}(f) = E^{\text{measured}}\!\left(\frac{f}{1.168}\right)
$$
Where: E(f) is the harmonic spectral envelope as a function of frequency f in Hz; 1.168 is the mean adult-female/adult-male F1-F3 ratio from Peterson & Barney (1952). This is a uniform frequency-axis dilation of the whole envelope. Applied for MPE and MEO; its reciprocal is applied for WPE and WEO. *(p.1156)*

$$
z_{F_i,v} = \frac{F_i - \mu_{F_i,v}}{\sigma_{F_i,v}}
$$
Where: F_i is the measured frequency of formant i (Hz) for a token of vowel category v; mu and sigma are the mean and standard deviation of F_i computed **within vowel category v, pooled across men and women talkers**. A value of 1.0 means the token's F_i is 1 SD above the grand mean for that formant *for the vowel that was spoken*. The same standard-score scheme is applied to f0. *(p.1153)*

$$
\text{SD}_{f_0}\;[\text{semitones}] = \operatorname{SD}\!\left(12\log_{2}\!\frac{f_{0}(t)}{50}\right)
$$
Where: f0(t) is the hand-edited pitch contour of the sentence in Hz, and 50 Hz is an arbitrarily selected base frequency. This is the paper's measure of prosodic (intonation) variability, computed for the TIMIT sentences only. *(p.1161)*

$$
\text{Geometric mean } F_{1\text{-}3} = \sqrt[3]{F_1 F_2 F_3}
$$
Where: used as a single-parameter summary of the three lowest formants in the discriminant analysis (Table 1 row). *(p.1156)*

## Parameters

### Synthesis parameters (SES)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Sample rate of source recordings | fs | Hz | 16000 | — | 1155 | TIMIT and H95 recordings used unmodified |
| Fourier analysis window length | — | points | 512 | — | 1156 | Narrow-band spectrum for harmonic envelope |
| Fourier analysis window duration | — | ms | 32 | — | 1156 | 512 points at 16 kHz |
| Unvoiced pulse nonzero probability | p | — | 0.5 | — | 1156 | Amplitude zero or nonzero at each sample point |
| f0 upward scale factor (men -> women) | — | — | 1.7041 | — | 1156 | Peterson & Barney (1952) female/male f0 ratio |
| Envelope upward scale factor (men -> women) | — | — | 1.168 | — | 1156 | Peterson & Barney (1952) female/male F1-F3 ratio |
| f0 downward scale factor (women -> men) | — | — | 0.5868 | — | 1156 | Inverse of 1.7041 |
| Envelope downward scale factor (women -> men) | — | — | 0.8562 | — | 1156 | Inverse of 1.168 |
| Voiced/unvoiced mixing ratio | — | — | measured | 0-1 | 1156 | Set from measured degree of periodicity |
| Stimulus low-pass filter cutoff | — | kHz | 7.2 | — | 1157 | Applied to all test signals before presentation |
| Presentation level | — | dBA | 75 | — | 1157 | For stressed syllables, ~1 m free field |
| Prosodic-variability base frequency | — | Hz | 50 | — | 1161 | Arbitrary reference for semitone conversion |

### Reference male/female acoustic values

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Mean f0, adult men (H95) | f0 | Hz | 131 | — | 1150 | 45 men, /hVd/ |
| Mean f0, adult women (H95) | f0 | Hz | 220 | — | 1150 | 48 women, /hVd/ |
| Male-female f0 difference (H95) | — | octave | 0.75 | — | 1150 | 220/131 |
| Mean f0, adult men (Peterson & Barney) | f0 | Hz | 132 | — | 1150 | 33 men |
| Mean f0, adult women (Peterson & Barney) | f0 | Hz | 224 | — | 1150 | 28 women |
| F1 scale factor women/men (H95) | — | — | 1.18 | — | 1150 | Averaged across all vowels |
| F2 scale factor women/men (H95) | — | — | 1.17 | — | 1150 | Averaged across all vowels |
| F3 scale factor women/men (H95) | — | — | 1.14 | — | 1150 | Averaged across all vowels |
| F1 scale factor women/men (P&B) | — | — | 1.16 | — | 1150 | |
| F2 scale factor women/men (P&B) | — | — | 1.19 | — | 1150 | |
| F3 scale factor women/men (P&B) | — | — | 1.16 | — | 1150 | |
| f0 variability, men (TIMIT sentences) | SD f0 | semitones | 2.25 | — | 1162 | vs. base 50 Hz; n.s. vs. women |
| f0 variability, women (TIMIT sentences) | SD f0 | semitones | 2.21 | — | 1162 | t(48) = 0.61, n.s. |

### Experimental design parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Talkers per sex, listening experiments | — | count | 25 | — | 1155 | Exp. 1 and Exp. 2 |
| Test signals per experiment | — | count | 200 | — | 1157 | 50 utterances x 4 conditions |
| Listeners, Exp. 1 | N | count | 21 | — | 1156 | Speech-language pathology majors |
| Listeners, Exp. 2 | N | count | 24 | — | 1159 | Introductory phonetics students |
| Confidence rating scale | — | points | — | 1-5 | 1157 | 1 = lowest, 5 = highest confidence |
| Hearing screening level | — | dB HL | 25 | — | 1156 | Octave frequencies 125-4000 Hz |
| Classifier utterances | — | count | 1116 | — | 1153 | 12 vowels, 45 men + 48 women |
| Split-half repetitions | — | count | 30 | — | 1153 | Random split-half tests averaged |
| Distinct talkers behind Exp. 2 syllables | — | count | 43 | — | 1159 | 23 men, 20 women, uneven token counts |

## Effect Sizes / Key Quantitative Results

### Table 1: Quadratic discriminant classifier accuracy, % correct speaker-sex identification (30 random split-half tests) *(p.1156)*

| Parameter set | Absolute PC | Absolute SD | Normalized PC | Normalized SD |
|---------------|-------------|-------------|---------------|---------------|
| f0 only | 95.8 | 0.4 | 96.3 | 0.5 |
| F1 | 59.0 | 1.4 | 81.3 | 1.0 |
| F2 | 52.3 | 2.2 | 81.5 | 1.8 |
| F3 | 78.2 | 1.5 | 86.1 | 1.0 |
| F1, F2 | 70.2 | 1.8 | 87.8 | 1.0 |
| F1-F3 | 79.2 | 1.8 | 91.9 | 1.0 |
| Geometric mean F1-F3 | 68.8 | 2.0 | 92.4 | 0.9 |
| f0, F1 | 98.3 | 0.5 | 97.2 | 0.4 |
| f0, F1-F2 | 96.4 | 0.4 | 97.8 | 0.5 |
| f0, F1-F3 | 96.7 | 0.4 | 98.4 | 0.4 |

Notable: normalization barely changes f0 accuracy (95.8 -> 96.3) but transforms formant accuracy (F1: 59.0 -> 81.3; F2: 52.3 -> 81.5; geometric mean: 68.8 -> 92.4). F3 is the best single **absolute** formant (78.2%) because it is least correlated with vowel identity. *(pp.1153-1154, 1156)*

### Figure 5 / Figure 6 panel A: % identification as the shifted-toward sex *(pp.1158, 1160)*

| Condition | Sentences (Exp. 1) % | Syllables (Exp. 2) % |
|-----------|----------------------|----------------------|
| MUS (heard as men) | 99.6 | 97.5 |
| WUS (heard as women) | 99.6 | 97.0 |
| MPE (heard as women) | 81.9 | 81.7 |
| MPO (heard as women) | 34.3 | 56.3 |
| MEO (heard as women) | 18.9 | 21.3 |
| WPE (heard as men) | 82.1 | 92.3 |
| WPO (heard as men) | 19.1 | 68.2 |
| WEO (heard as men) | 11.7 | 21.7 |

### Figure 5 / Figure 6 panel B: mean confidence ratings (1-5) *(pp.1158, 1160)*

| Condition | Sentences | Syllables |
|-----------|-----------|-----------|
| MUS | 4.61 | 4.20 |
| WUS | 4.62 | 4.24 |
| MPE | 3.36 | 3.87 |
| MPO | 2.81 | 3.21 |
| MEO | 3.30 | 3.27 |
| WPE | 3.51 | 3.81 |
| WPO | 3.16 | 3.22 |
| WEO | 3.40 | 3.38 |

### Inferential statistics

| Analysis | Statistic | p | Page |
|----------|-----------|---|------|
| Exp. 1, one-way RM ANOVA on arcsine-transformed % ID | F(7,140) = 132.6 | < .0001 | 1157 |
| Exp. 1, one-way RM ANOVA on confidence ratings | F(7,140) = 50.5 | < .0001 | 1157 |
| Exp. 2, one-way ANOVA on arcsine-transformed % ID | F(7,161) = 194.7 | < .0001 | 1159 |
| Exp. 2, one-way ANOVA on confidence ratings | F(7,161) = 39.8 | < .0001 | 1161 |
| Two-way ANOVA (% ID), condition | F(7,42) = 194.7 | < .0001 | 1161 |
| Two-way ANOVA (% ID), speech material | F(1,42) = 44.0 | < .0001 | 1161 |
| Two-way ANOVA (% ID), condition x material interaction | F(7,38) = 13.9 | < .0001 | 1161 |
| Two-way ANOVA (confidence), condition | F(7,42) = 83.9 | < .0001 | 1161 |
| Two-way ANOVA (confidence), speech material | F(1,42) = 0.03 | n.s. | 1161 |
| Two-way ANOVA (confidence), interaction | F(7,38) = 7.8 | < .0001 | 1161 |
| f0 variability men vs. women (semitones) | t(48) = 0.61 | n.s. | 1162 |

### Table 2: Correlations of "% of judgments that did NOT shift perceived gender" (PE conditions only) with acoustic measures of the original utterance *(p.1162)*

| Measure | TIMIT Men | TIMIT Women | /hVd/ Men | /hVd/ Women |
|---------|-----------|-------------|-----------|-------------|
| Mean f0 | -.15 | **.60** | **-.49** | .04 |
| Mean normalized F1-F3 | — | — | -.24 | .32 |
| f0 variability (SD in semitones) | -.09 | -.25 | — | — |

Only the two bolded correlations are significant at p <= .05. Interpretation: women's sentences spoken at higher f0 tend to retain female gender despite downward shifts (r = .60); men's syllables spoken at lower f0 tend to retain male gender despite upward shifts (r = -.49). For women's syllables, the normalized-formant correlation (.32) fell just short of significance. The main conclusion is that factors **other than** average f0, f0 variability, and normalized formants account for most of the utterances that retained their original sex identity. *(p.1162)*

### Under-additivity (key computational finding) *(p.1157)*
- Men, sentences: MPO (34.3%) + MEO (18.9%) = 53.2%, far below MPE (81.9%).
- Women, sentences: WPO (19.1%) + WEO (11.7%) = 30.8%, far below WPE (82.1%).
- The authors call this the "underachievement" of single-parameter frequency shifts, and interpret it as listeners giving greater weight to residual cues when the primary cues of f0 and formants are ambiguous. *(p.1162)*

## Methods & Implementation Details
- SES pipeline: measure f0 and degree of periodicity per frame with a cepstrum-like pitch tracker; construct the source pulse train; estimate the harmonic envelope by linear interpolation between harmonics of a 512-point/32-ms narrow-band spectrum; compute a frame-by-frame sequence of impulse responses from the envelopes; convolve source with the time-varying impulse response. *(p.1156)*
- Frequency shifting is applied to the **envelope** and to the **f0 track**, independently and multiplicatively, before the convolution step. This gives a clean factorial manipulation impossible with a formant-tracking synthesizer. *(p.1156)*
- For the TIMIT sentences, average f0 was measured from **hand-edited** pitch contours used to drive the SES; editing consisted mainly of deleting f0 measurements during unvoiced and marginally periodic regions (editing tool described in H95). *(p.1161)*
- For the /hVd/ syllables, hand-edited f0 and F1-F3 measures were sampled at the **steadiest portion of the vowel**, taken from H95. Formants were normalized with the within-vowel standard-score method. *(p.1161)*
- Trials were presented in a single random order, not blocked by condition, and re-scrambled for each listener. *(p.1157)*
- Percent-identification values were **arcsine-transformed** before ANOVA. Planned comparisons used Bonferroni correction. *(pp.1157, 1159)*
- Exp. 2 restricted vowels to the corners of the vowel quadrilateral (/i/, /æ/, /ɑ/, /u/) so acoustic properties, especially formants, could be characterized with high confidence. *(pp.1159, 1161)*

## Figures of Interest
- **Fig. 1 (p.1154):** Frequency-of-occurrence histograms of absolute (A) and normalized (B) F1 (circles), F2 (squares), F3 (triangles) for 12 vowels, 45 men (closed) vs. 48 women (open). Absolute F1/F2 overlap heavily across sex; F3 separates moderately; normalized values separate reasonably well. Absolute x-axis spans 250-3750 Hz; normalized spans z = -2.5 to +4.0.
- **Fig. 2 (p.1155):** Same for f0, absolute (90-310 Hz) and normalized (z = -2.0 to +2.5). Speaker sex is clearly distinguished in **both** representations, unlike formants.
- **Fig. 3 (p.1156):** The SES block diagram — source pulse sequence at the fundamental period -> filter = spectrum envelope -> output waveform of filtered pulses. The clearest single statement of the synthesis architecture.
- **Fig. 4 (p.1157):** The harmonic envelope overlaid on the narrow-band spectrum for (A) a vowel and (B) a consonant release burst [kʰ], both shown to 4 kHz. Panel B shows that the harmonic-interpolation envelope still tracks the gross spectral shape of an aperiodic segment.
- **Fig. 5 (p.1158):** Percent identification (A) and confidence ratings (B) by condition, TIMIT sentences, error bars = 1 SD.
- **Fig. 6 (p.1160):** Same, with sentences (solid) and syllables (hatched) side by side.

## Results Summary
- Unmodified SES resynthesis conveys talker sex essentially perfectly (99.6% sentences, ~97% syllables), confirming the synthesizer preserves the relevant information. *(pp.1157, 1159)*
- Shifting both f0 and envelope changed perceived sex for ~82% of sentences in both directions; ~18% retained their original sex identity. *(p.1157)*
- Single-parameter shifts were largely ineffective for sentences (11.7%-34.3%). *(p.1157)*
- f0 alone was more effective than envelope alone, but the difference reached significance for men only. *(p.1159)*
- No significant departure from symmetry across male and female talkers in the sentence data: upward shifts for men produced as many perceived-sex changes as downward shifts for women. *(p.1159)*
- Syllables shifted perceived sex more readily than sentences, especially in the f0-only conditions (MPO 34.3 -> 56.3, +22 points; WPO 19.1 -> 68.2, +49 points). Significant condition x speech-material interaction. *(pp.1159, 1161)*
- Confidence was high (~4.6) for unmodified conditions and markedly lower (~2.8-3.5) for every frequency-shifted condition, including the combined shifts that did change perceived sex. *(p.1157)*

## Limitations
- The envelope was shifted **as a whole**, implicitly assuming uniform scaling between men's and women's formants. Scale factors are known to vary across formants and, especially, across vowels (Fant, 1975; Traunmüller, 1984, 1988). Sex-dependent, vowel-specific scaling relationships remain a viable candidate cue that this method preserves rather than manipulates. *(p.1163)*
- All stimuli were shifted by the **same fixed scale factors** derived from group averages, so a man with atypically low f0/formants (or a woman with atypically high values) may simply not have been shifted far enough. The correlational analysis (Table 2) shows this explains only part of the residue. *(pp.1159, 1162)*
- No simple method exists for normalizing formant frequencies in the TIMIT sentences: the difficulty is not measuring formants but deriving stable per-vowel means and SDs, because sentence material varies freely in phonetic context, speaking rate, sentential stress, and lexical stress. Hence normalized-formant correlations are reported only for the /hVd/ syllables. *(pp.1161, 1166 note 3)*
- Whether the SES conveys aspiration noise and harmonic spectral tilt (the Klatt & Klatt breathiness correlates) with sufficient precision is undetermined, and the perceptual weight of that cue relative to f0 and formants is unknown. *(p.1163)*
- The single measure of f0 variability used here captures far less than the full melody and rhythm of speech; prosodic differences between men and women remain largely untested. *(p.1163)*
- A pattern recognizer is not a listener; the discriminant results suggest logically possible perceptual mechanisms, nothing more. *(p.1154)*
- The study was not designed to test the Owren et al. (2007) male-advantage hypothesis, so its bearing on that question is limited. *(p.1153)*

## Arguments Against Prior Work
- **Bachorowski & Owren (1999):** their high formant-based classification accuracy (92.4%) was "greatly simplified" by restricting formant measurements to a single vowel (/ɛ/ in "test"), which makes absolute formant frequencies far more informative than in the realistic case of varying phonetic identity. The present study repeats the analysis over 12 vowels. *(pp.1151, 1153)*
- **Lass et al. (1976):** concluded f0 is the more potent cue because low-pass-filtered "formantless" vowels were identified better (91%) than "pitchless" whispered vowels (75%), but it is not clear their low-pass filter was sharp enough to eliminate formant information entirely. *(p.1151)*
- **Whiteside (1998):** used averages from just three men and three women, and only three listeners. *(p.1151)*
- **Smith & Patterson (2005):** all rescaled signals derived from a **single** adult male talker; the "woman" response category was strikingly small (p = .11) versus "man" (.36) and "boy" (.36), possibly due to residual cues to maleness in the original recordings. *(p.1152)*
- **Smith et al. (2007) vs. Assmann et al. (2006):** Smith et al. reported very similar man/woman response distributions for stimuli modeled after a man and a woman, i.e. little evidence for residual cues, whereas Assmann et al. found clear residual "indicators of voice gender" (p. 892) in sentences. The present study attributes the discrepancy to speech material: residual cues are conveyed more readily by connected speech than by isolated vowels — and then tests it directly. *(pp.1152, 1163)*
- **Coleman (1976):** the electrolarynx mismatch results are described as producing "equivocal" results "for reasons that are not clear". *(p.1151)*
- **Owren et al. (2007) male-advantage hypothesis:** the sentence data show no such asymmetry — upward shifts were, if anything, somewhat *more* likely to change perceived sex than downward shifts. The syllable data are more compatible with the hypothesis, so the evidence is inconsistent overall. *(p.1163)*
- **The formant concept generally:** (1) the "determinacy problem" (Bladon, 1982) — formant tracking in natural speech remains unsolved; (2) human perceptual confusions almost always involve phonetically similar sounds, hard to reconcile with a tracking process susceptible to gross split/merge errors (Klatt, 1982; Ito, Tsuchida & Yano, 2001); (3) spectral details other than formant frequencies affect phonetic quality (Bladon, 1982; Chistovich & Lublinskaja, 1979; Hillenbrand & Nearey, 1999). Note 4 (p.1166) adds that Peterson & Barney's 10,279 labeling responses to /u/ contained not a single /i/ or /ɪ/ response, errors that would be expected if closely spaced F1 and F2 merged into a single peak. *(pp.1164, 1166)*

## Design Rationale
- **Why a spectral-envelope synthesizer rather than a formant synthesizer:** it lets f0 and the whole spectrum envelope be scaled independently and multiplicatively without any formant-tracking step, avoiding the determinacy problem entirely while retaining the natural signal's fine structure. *(pp.1156, 1164)*
- **Why the harmonic envelope with no voiced/unvoiced distinction:** simplicity and uniformity — one estimator covers vowels, bursts, and marginally periodic frames; Fig. 4B is offered as evidence it still tracks gross spectral shape for aperiodic segments. *(p.1156)*
- **Why normalize formants by within-vowel z score:** to represent whether formants are high or low *relative to the vowel being spoken*, isolating vocal-tract-length variation and factoring out vowel identity. Absolute F1 of 750 Hz is ambiguous between /ɑ/ from a man and /ɔ/ from a woman. *(pp.1150, 1153)*
- **Why 25 talkers per sex:** prior frequency-shifting studies used 1-4 talkers; talker-to-talker variability in f0 and formants is among the most extensively documented facts in acoustic phonetics. *(p.1153)*
- **Why repeat with /hVd/ syllables:** (a) to test whether prosodic features (largely absent in citation-form syllables) carry residual sex cues, and (b) because syllable acoustics, especially formants, can be characterized confidently enough to correlate with the listener data. *(p.1159)*
- **Why corner vowels only in Exp. 2:** maximal confidence in formant characterization. *(p.1159)*
- **Why a single random (unblocked) trial order:** avoids condition-blocking artifacts in a 2AFC sex judgment. *(p.1157)*

## Testable Properties
- Unmodified SES resynthesis of a natural utterance must preserve perceived talker sex at >= ~97% identification. *(pp.1157, 1159)*
- Scaling both f0 by 1.7041 and the spectral envelope by 1.168 on male speech yields female percepts on roughly 82% of sentences, not ~100%. *(p.1157)*
- Single-parameter shifts must be substantially less effective than combined shifts, and their effects must be **sub-additive**: P(shift | f0 only) + P(shift | envelope only) < P(shift | both). *(p.1157)*
- f0-only shifts must produce more perceived-sex changes than envelope-only shifts, for both sentences and syllables. *(p.1162)*
- Isolated syllables must shift perceived sex at least as readily as sentences under the same manipulation; the gap is largest for f0-only shifts on female speech (19.1% -> 68.2%). *(p.1161)*
- Confidence must drop for every frequency-shifted condition relative to unmodified synthesis, including the successful combined shifts. *(pp.1157, 1164)*
- A classifier on f0 alone must reach ~96% speaker-sex accuracy; absolute F1 or F2 alone must be near chance-to-poor (52-59%); the same formants normalized within vowel must reach ~81%. *(p.1156)*
- Formant normalization must improve speaker-sex classification substantially while f0 normalization must not (95.8 -> 96.3). *(p.1156)*
- Mean f0 of the original talker correlates with resistance to sex-percept shifting only weakly and inconsistently: significant for women's sentences (r = .60) and men's syllables (r = -.49), not otherwise. *(p.1162)*
- f0 variability in semitones must not differ significantly between men and women in read sentences (2.25 vs. 2.21). *(p.1162)*

## Relevance to Project
For a formant/source-filter speech synthesizer, this paper is directly load-bearing in four ways.

1. **Concrete voice-conversion scale factors.** A male-to-female voice transform of f0 x 1.7041 and formant/envelope x 1.168 (and the inverses for the reverse direction) is the exact recipe validated here, with a measured ceiling on what it buys you: ~82% perceived sex change, not 100%. Any "female voice" preset built purely by scaling a male preset should be expected to fall short of fully convincing, and this paper quantifies by how much.
2. **A warning about uniform envelope scaling.** Real male-female formant ratios are non-uniform across formants (1.18 / 1.17 / 1.14 in H95) and across vowels. A synthesizer that exposes per-formant, and ideally per-vowel, scale factors will be more faithful than a single global dilation.
3. **Residual voice-quality cues must be modeled separately.** The ~18% failure rate plus the confidence drop across *all* shifted conditions says that gender percept needs more than f0 and formant frequencies. The named candidates are the Klatt & Klatt (1990) set: reduced periodicity, increased F1 bandwidth, decreased F1 amplitude, higher first-harmonic amplitude (more rounded/less abrupt glottal pulse), i.e. aspiration-noise level and harmonic spectral tilt. Those are exactly the parameters a Klatt-family synthesizer already exposes (AH, TL, OQ, B1), so this paper is a direct argument for exercising them when building a female voice rather than only scaling frequencies.
4. **The SES architecture itself is implementable.** Cepstrum-like f0 and periodicity tracking, a 512-point/32-ms harmonic-interpolation envelope, a single-sample-pulse source with a probability-0.5 random-amplitude variant for unvoiced, and a mixing ratio driven by measured periodicity, all convolved frame-by-frame. This is a usable analysis-resynthesis reference implementation for A/B testing a parametric synthesizer against a resynthesis of the same natural utterance, and it comes with a published intelligibility benchmark (96.9% sentence intelligibility) to hit.

Secondarily, the within-vowel z-score formant normalization is a clean, cheap speaker-normalization scheme worth reusing in any analysis tooling, and Table 1 gives a benchmark table for how much it is worth.

## Open Questions
- [ ] Does the SES convey aspiration noise and harmonic spectral tilt with enough precision to carry the Klatt & Klatt voice-quality cues, and what is their perceptual weight relative to f0 and formants? *(p.1163)*
- [ ] What are the residual cues to speaker sex? The study offers "a few hints" but was not designed to answer this; prosody beyond simple f0 SD is named as a worthwhile avenue. *(p.1163)*
- [ ] Do sex-dependent, vowel-specific (non-uniform) scaling relationships contribute to the speaker-sex percept? The authors speculate not dominantly, but call it "a viable candidate". *(p.1163)*
- [ ] How can the mutual interdependency between vowel identification and speaker-sex identification (Eklund & Traunmüller, 1997) be implemented computationally? "It is not immediately obvious how a recognition scheme of this kind might be implemented." *(p.1162)*
- [ ] Can whole-spectrum (non-formant) models explain perceived "envelope height" differences between like vowels spoken by men and women, as they do for vowel identity? Recommended as "a worthy topic for further work". *(p.1164)*
- [ ] Why did syllables shift sex more readily than sentences, given that the vowel-specific-scaling hypothesis predicts the opposite? *(p.1163)*

## Related Work Worth Reading
- **Hillenbrand, Houde & Gayvert (2006)**, JASA 119, 4041-4054 — the full SES description and intelligibility validation. The single most important follow-up for implementing this paper's synthesizer.
- **Klatt & Klatt (1990)**, JASA 87, 820-857 — analysis, synthesis, and perception of voice quality variations among female and male talkers. The canonical source for the residual voice-quality cues this paper cannot explain.
- **Hillenbrand, Getty, Clark & Wheeler (1995)**, JASA 97, 3099-3111 — the H95 acoustic database underlying every reference value here.
- **Peterson & Barney (1952)**, JASA 24, 175-184 — source of the 1.7041 and 1.168 scale factors.
- **Kawahara, Masuda-Kasuse & de Cheveigné (1999)**, Speech Communication 27, 187-207 — STRAIGHT, the alternative source-filter resynthesizer used by Smith & Patterson and Assmann et al.
- **Paul (1981)**, IEEE TASSP 29, 786-794 — the spectral envelope estimation vocoder, the method the harmonic envelope is related to.
- **Assmann, Nearey & Dembling (2006)**, ICSLP, 889-892 — the "residual indicators of voice gender" finding this paper builds on.
- **Traunmüller (1984, 1988)** and **Fant (1975)** — non-uniform vowel normalization and sex-conditioned formant variability; the correct treatment of the scaling non-uniformity flagged as a limitation.
- **Titze (1989)**, JASA 85, 1699-1707 — physiologic and acoustic differences between male and female voices.

## Collection Cross-References

### Already in Collection
- [Control Methods Used in a Study of the Vowels](../Peterson_Barney_1952_VowelControl/notes.md) - source of the 1.7041 f0 and 1.168 formant male-to-female scale factors used throughout the resynthesis.
- [Acoustic Characteristics of American English Vowels](../Hillenbrand_1995_VowelAcoustics/notes.md) - the H95 database (1,116 /hVd/ tokens) underlying the discriminant analysis and Experiment 2 stimuli.
- [Klatt & Klatt 1990 - Voice Quality Variations Analysis](../Klatt_1990_VoiceQualityVariations/notes.md) - canonical source for the residual (non-f0, non-formant) voice-quality cues - aspiration, F1 bandwidth, harmonic tilt - this paper's scaling experiments cannot explain.
- [The interaction of glottal-pulse rate and vocal-tract length in judgements of speaker size, sex, and age](../Smith_2005_InteractionGlottal-pulseRateVocal-tract/notes.md) - directly compared prior synthesis study using STRAIGHT resynthesis and a single-talker basis; Hillenbrand & Clark's 25+25-talker design was built to control for the talker-variability limitation of this and similar studies.

### New Leads (Not Yet in Collection)
- Kawahara, Masuda-Kasuse & de Cheveigné (1999) - "Restructuring speech representations using pitch-adaptive time-frequency smoothing..." (STRAIGHT) - the competing analysis-resynthesis system used by the Smith/Patterson and Assmann studies this paper compares itself against.
- Traunmuller (1984, 1988) - non-uniform, vowel-specific male-female formant scaling; the correct treatment of the uniform-scaling simplification this paper flags as its main methodological limitation.
- Fant (1975) - "Non-uniform vowel normalization" - same limitation as Traunmuller above.

### Cited By (in Collection)
- (bibliography-only mentions in [Investigating the Use of Formant Frequencies in Listener Judgments of Speaker Size](../Barreda_2015_FormantSpeakerSize/notes.md), [Voice Analytics in the Wild: Validity and Predictive Accuracy of Common Audio-Recording Devices](../Busquet_2023_VoiceAnalyticsRecordingDevices/notes.md), and [The Motor Theory of Speech Perception Revised](../Liberman_Mattingly_1985_MotorTheory/notes.md) - none discuss this paper's specific findings in their notes)

### Conceptual Links (not citation-based)
- [Investigating the Use of Formant Frequencies in Listener Judgments of Speaker Size](../Barreda_2015_FormantSpeakerSize/notes.md) - Barreda tests whether listeners use formant frequencies (uniform vs. non-uniform scaling) for speaker-size judgments; Hillenbrand & Clark test the same uniform-scaling assumption for speaker-sex judgments using an equivalent resynthesis paradigm - the two papers jointly bound how far frequency-only scaling can carry perceived speaker attributes. (Strong)
