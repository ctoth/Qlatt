# F0 and Segment Duration in Formant Synthesis of Speaker Age

**Authors:** Susanne Schötz
**Year:** 2006
**Venue:** Proc. of Speech Prosody, Dresden (pp. 515-518)
**Institution:** Linguistics and Phonetics, Centre for Languages and Literature, Lund University

## One-Sentence Summary

Describes a data-driven formant synthesis system (using GLOVE/OVE III) for analyzing speaker age through 23 acoustic parameters, with F0 and duration performing better than formants/amplitudes.

## Problem Addressed

- Growing need for voice variation (age, emotion, speaker-specific qualities) in TTS and voice prosthesis
- Relative importance of different acoustic age cues not fully explored
- Lack of adequate analysis tools for systematic parameter variation

## Key Contributions

1. Prototype system for analysis-by-synthesis of speaker age using GLOVE formant synthesizer
2. 23-parameter extraction pipeline from natural speech at 10ms intervals
3. Age interpolation method using weighted linear interpolation between speakers
4. Listening test evaluation (31 listeners) of age perception and naturalness

## Methodology

1. **Speakers:** Four related female Swedish speakers (same dialect, non-smoking):
   - Speaker 1: girl, 6 years
   - Speaker 2: mother, 36 years
   - Speaker 3: grandmother, 66 years
   - Speaker 4: great grandmother, 91 years

2. **Recording:** Sony DAT TCD-D8, 48kHz/16bit, resampled to 16kHz

3. **Test word:** "själen" [ˈʃɛːlən] (the soul)

4. **Pipeline:** Natural speech → Parameter extraction (Praat) → GLOVE synthesis → Audio-visual comparison → Parameter adjustment

## Parameters

| Name | Symbol | Description | Notes |
|------|--------|-------------|-------|
| F1-F4 | F1-F4 | Formant frequencies | Hz |
| B1-B4 | B1-B4 | Formant bandwidths | Hz |
| FH | FH | Higher pole correction | 3 double poles: FH, FH×1.2, FH×1.4; bandwidths=F5 |
| K1-K2 | K1-K2 | Fricative formant frequencies | K1=F2, K2=F3 |
| C1-C2 | C1-C2 | Fricative bandwidths | C1=B2, C2=B3 |
| AK | AK | Zero for fricatives | |
| F0 | F0 | Fundamental frequency | Hz |
| AC | AC | Noise amplitude for frication | dB |
| AH | AH | Noise amplitude for aspiration | dB |
| A0 | A0 | Voice amplitude | dB |
| RG | RG | Glottal shape | LF model parameter |
| RK | RK | Glottal pulse skewness factor | LF model parameter |
| FA | FA | Spectral tilt frequency | Adds 6dB/octave above this |
| NA | NA | Noise added to voice source | Pitch-synchronous, for breathiness |
| DI | DI | Diplophonia simulation | For creak/laryngealization |

**Total: 23 parameters extracted every 10ms**

## Key Findings: F0 by Speaker Age

| Speaker | Age | F0 Pattern |
|---------|-----|------------|
| 1 (girl) | 6 | Highest F0 (~300 Hz), creaky portions |
| 2 (mother) | 36 | Mid F0 (~200 Hz) |
| 3 (grandmother) | 66 | Slightly higher than Speaker 2 (atypical) |
| 4 (great grandmother) | 91 | Lowest F0 (~150 Hz), creaky portions |

**Note:** Speaker 3 was often judged younger than chronological age (atypical F0 and shorter duration).

## Segment Duration Data (ms)

| Segment | Spkr 1 (6y) | Spkr 2 (36y) | Spkr 3 (66y) | Spkr 4 (91y) |
|---------|-------------|--------------|--------------|--------------|
| [ʃ] | 139 | 207 | 128 | 106 |
| [ɛː] | 469 | 291 | 297 | 320 |
| [l] | 312 | 89 | 83 | 105 |
| [ə] | 179 | 110 | 147 | 136 |
| [n] | 111 | 117 | 72 | 156 |
| **Total** | **1209** | **813** | **728** | **822** |

**Observation:** Children and elderly have longer total durations than middle-aged speakers.

## Age Interpolation Algorithm

For target age $a_t$ between source ages $a_1$ and $a_2$:

$$
w = \frac{a_t - a_1}{a_2 - a_1}
$$

For each parameter $P$ and segment duration $D$:

$$
P_{target} = P_1 \cdot (1-w) + P_2 \cdot w
$$

$$
D_{target} = D_1 \cdot (1-w) + D_2 \cdot w
$$

**Example:** Target age 51 (between 36 and 66):
- $w = 0.5$
- If segment is 100ms for Speaker 2 and 200ms for Speaker 3:
- Target duration = 100×0.5 + 200×0.5 = 150ms

## Implementation Details

### Tools Used
- **Praat:** Acoustic analysis, parameter extraction, GUI
- **GLOVE:** Formant synthesizer (extension of OVE III cascade synthesizer)
- **LF voice source model** (Fant, Liljencrants & Lin, 1985)
- **Dat-convert:** Parameter file format conversion

### Parameter Extraction Issues & Solutions

| Issue | Solution |
|-------|----------|
| F0 detected in voiceless segments | Adjust Praat pitch analysis arguments |
| Creaky voice → very high F0 or voiceless | Secondary pitch analysis for F0 < 150 Hz |
| Creaky simulation | Halved F0 + DI (diplophonia) parameter |
| Formant/amplitude distortion | Smoothing of parameter curves |
| 10-20ms lost at word boundaries | Inherent limitation of 10ms frame extraction |

### Creaky Voice Implementation
```
if (segment is creaky):
    F0_synth = F0_measured / 2
    DI = active  // diplophonia parameter
```

## Listening Test Results (n=31)

### Age Perception
- Synthetic versions judged **older** than natural in most cases
- Speaker 3 (66y) consistently judged **younger** than chronological age
- Interpolations judged **older** than intended (especially 20-30y → perceived >50y)

### Naturalness (7-point scale)
| Speaker Age | Natural | Synthetic |
|-------------|---------|-----------|
| 6 years | ~4 | ~2.5 |
| 36 years | ~6 | ~4 |
| 66 years | ~6 | ~4 |
| 91 years | ~5 | ~3.5 |

Natural speech always rated more natural than synthetic.

## Limitations

1. **Linear interpolation is crude** - aging is non-linear; different parameters change at different life stages
2. **Formant extraction errors** - especially for Speaker 1 (child), causing tremor/roughness
3. **Small sample size** - only 4 speakers, 1 word
4. **Individual variation** - Speaker 3 atypical for age
5. **Muffled synthesis** - formant/amplitude issues
6. **Short segments** - 10ms frame rate may miss stop releases
7. **Intonation patterns** - speakers used different patterns (declarative vs. list), causing problematic interpolations

## Relevance to Qlatt Project

### Direct Applications
1. **Age-related F0 patterns:** Useful for prosody if implementing speaker variation
2. **GLOVE parameters (23):** Reference for Klatt-style parameter set with LF source
3. **Creaky voice:** F0/2 + diplophonia approach for creak simulation

### Parameter Mapping to Klatt
| GLOVE | Klatt Equivalent |
|-------|------------------|
| F1-F4, B1-B4 | F1-F4, B1-B4 |
| A0 | AV |
| AH | AH |
| AC | AF |
| F0 | F0 |
| RG, RK | OQ, TL (voice source) |
| FA | TL (spectral tilt) |
| NA | AVS (aspiration into voice) |
| DI | FL (flutter) related |

### Key Takeaway
F0 and duration are the most robust parameters for speaker age synthesis - they "performed better than most other parameters, including formants and amplitudes."

## Open Questions

- [ ] How does GLOVE's LF source model (RG, RK, FA, NA) map exactly to Klatt's source parameters?
- [ ] What smoothing algorithm works best for formant trajectories?
- [ ] How to handle non-linear aging effects in parameter interpolation?

## Related Work Worth Reading

- **Fant, Liljencrants & Lin (1985)** - LF glottal flow model (4 parameters)
- **Carlson, Granström & Karlsson (1991)** - Voice modelling in synthesis with GLOVE
- **Karlsson (1992)** - PhD on female voice synthesis
- **Liljencrants (1968)** - OVE III synthesizer (GLOVE's foundation)
- **Linville (2001)** - "Vocal Aging" - comprehensive summary of age-voice research
- **Brückl & Sendlmeier (2003)** - Aging female voices acoustic/perceptual analysis
