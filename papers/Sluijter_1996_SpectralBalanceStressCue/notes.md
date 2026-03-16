---
title: "Sluijter, van Heuven & Pacilly (1997) — Implementation Notes"
year: 1996
doi_url: "10.1121/1.417994"
citation: "Sluijter, A. M. C., van Heuven, V. J., & Pacilly, J. J. A. (1997). J. Acoust. Soc. Am., 101(1), 503-513."
---

# Sluijter, van Heuven & Pacilly (1997) — Implementation Notes

## Key Finding

Spectral balance (spectral tilt) is a strong perceptual cue for linguistic stress, while overall intensity level is a marginal cue at best. Duration is the strongest cue, and spectral balance is the second most important cue.

## Experimental Design

### Stimulus Construction

- Used reiterant nonsense word pairs (na/na...) to isolate acoustic parameters from segmental identity
- Dutch disyllabic words with stress on first or second syllable
- Syllable duration varied in seven steps from 90-270 ms (first syllable) and 90-270 ms (second syllable), with total duration fixed at ~360 ms
- Intensity level varied in seven steps: overall intensity manipulated by uniform amplification
- Spectral balance varied by increasing levels of the higher frequency bands only (above 500 Hz) by 3, 6, or 9 dB, in either the first or the final syllable

### Spectral Balance Manipulation Method

- Frequency components above 500 Hz were increased to simulate vocal effort
- The manipulation caused overall intensity level increases as a side effect (shown in Table II)
- Increase amounts per band for +9 dB high-frequency boost:
  - Overall intensity increase: ~3 dB
  - This corresponds to the natural production difference between stressed and unstressed vowels

### Table II: Duration Manipulations (ms)

| Duration | s1  | s2  | s1+s2 |
|----------|-----|-----|-------|
| Step 1   | 90  | 270 | 360   |
| Step 2   | 120 | 240 | 360   |
| Step 3   | 150 | 210 | 360   |
| Step 4   | 180 | 180 | 360   |
| Step 5   | 210 | 150 | 360   |
| Step 6   | 240 | 120 | 360   |
| Step 7   | 270 | 90  | 360   |

## Key Results — Experiment I (No Reverberation)

### Table III: Main Effects and Interactions (ANOVA)

| Effect                       | F     | Variance Explained |
|-----------------------------|-------|--------------------|
| Duration                    | 361.3 | 68%                |
| Intensity level             | 129.8 | 12%                |
| Presentation (method)       | 2.8   | NS                 |
| Duration x intensity level  | 7.8   | 4%                 |
| Duration x presentation     | 53.5  | —                  |
| Intensity level x method    | 46.1  | 4%                 |

- Duration explains 68% of the variance
- Intensity level explains only 12%
- Spectral balance (intensity in higher frequencies) explains 76% when separated from overall level
- Overall intensity level explains only 1%

### Critical Distinction: Spectral Balance vs Overall Intensity

When the effects of spectral balance and overall intensity are separated:
- **Spectral balance alone**: F(6,91)=115.5, p<0.001; explains 90% of the variance attributed to "intensity"
- **Overall intensity alone**: marginal, explains ~1% of variance
- Duration and spectral balance together explain 99% of the variance

## Key Results — Experiment II (With Reverberation)

- Reverberation reduces the effectiveness of duration as a cue (from 88% to 22% variance explained)
- Spectral balance increases in relative importance under reverberant conditions
- Spectral balance is not easily affected by reverberation (since it is a spectral property, not temporal)
- Duration dropped from explaining 80% to 20% of variance under reverberation
- Spectral balance remained relatively stable

### Table V: Relative Strength of Stress Cues (% Explained Variance)

|                  | Exp 1 (separate) | Exp 2 (mixed) |
|------------------|-----------------|---------------|
| **No reverb**    |                 |               |
| Duration         | 93              | 76            |
| Intensity level  | 2               | 13            |
| Duration x IL    | 3               | 7             |
| Residue          | 4               | 4             |
| **Reverb**       |                 |               |
| Duration         | 80              | 35            |
| Intensity level  | 3               | 53            |
| Duration x IL    | 7               | 5             |
| Residue          | 4               | 7             |

## Implementation Relevance for Klatt Synthesizer

### Spectral Tilt as Stress Correlate

1. **Do not rely solely on intensity (AV) for stress contrast.** Overall amplitude differences provide only a marginal stress cue.

2. **Implement spectral tilt changes for stress.** Stressed syllables should have more energy in the higher frequency bands (above 500 Hz). In the Klatt model, this can be achieved by:
   - Modifying the spectral tilt parameter (TL) — reduce tilt for stressed vowels
   - Adjusting the open quotient (OQ) — stressed vowels have lower OQ (more abrupt closure)
   - Both produce flatter spectra (more high-frequency energy) for stressed syllables

3. **Magnitude of spectral balance change:** A +9 dB boost in frequencies above 500 Hz is the maximum realistic range. The natural production data (from Sluijter & van Heuven 1996 companion paper) showed stressed vowels have approximately 3-9 dB more energy above 500 Hz depending on the frequency band.

4. **Duration remains the primary cue.** Stressed syllables should be 1.5-3x longer than unstressed in Dutch (and similarly in English). Duration explains ~68-93% of variance in non-reverberant conditions.

5. **Spectral balance is robust to room acoustics.** Unlike duration, spectral tilt is minimally affected by reverberation. This makes it important for naturalistic synthesis.

### Specific Parameter Recommendations

- **Stressed vowels**: Reduce TL (spectral tilt) by 3-9 dB to flatten the spectrum
- **Stressed vowels**: Duration ratio stressed:unstressed approximately 2:1 to 3:1
- **Unstressed vowels**: Higher TL (steeper spectral rolloff)
- **Overall intensity (AV)**: Can remain relatively constant between stressed and unstressed — not a reliable perceptual cue

### Total Amplitude vs Spectral Balance

The paper distinguishes between "total amplitude" (a measure of power integrated over the entire duration of the vocalic nucleus, i.e., energy) and "spectral balance." Beckman (1986, p. 197) argues total amplitude may be a better measure of loudness than peak intensity alone, since it integrates energy and duration. However, this paper shows that even total amplitude is a weak cue compared to spectral balance.

## Connection to Companion Paper

This paper is the perceptual companion to Sluijter & van Heuven (1996), "Spectral balance as an acoustic correlate of linguistic stress," JASA 100(4), 2471-2485, which established the acoustic facts. The present paper confirms the perceptual relevance of those acoustic findings.

## Collection Cross-References

### Already in Collection
- `Wightman_1992_SegmentalDurationsProsodic` — Wightman et al. 1992, prosodic phrase boundary durations; cited on duration and stress

### Cited By (in Collection)
- `Lienard_1999_VocalEffortVowelSpectral` — references Sluijter on spectral balance and vocal effort
- `vanSon_1997_ConsonantReduction` — cites Sluijter on spectral balance as stress correlate

### New Leads
- Fry 1955 — Duration and intensity as physical correlates of linguistic stress (classic study)
- Fry 1958 — Experiments in the perception of stress
- Beckman 1986 — *Stress and Non-Stress Accent* monograph; total amplitude measure

### Conceptual Links (not citation-based)
- `Lienard_1999_VocalEffortVowelSpectral` — Both examine spectral tilt changes related to vocal effort and stress; Lienard provides effort-related spectral data
- `Fant_1997_VoiceSourceConnectedSpeech` — Voice source properties in connected speech relate to the spectral balance changes Sluijter measures
- `Iseli_2007_VoiceSourceAgeSexVowel` — Voice source age/sex variations include spectral tilt measures relevant to stress modeling
