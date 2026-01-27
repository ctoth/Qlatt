# Formant Bandwidth Affects the Identification of Competing Vowels

**Authors:** Alain de Cheveigné
**Year:** 1999
**Venue:** ICPhS99 (International Congress of Phonetic Sciences), San Francisco
**Pages:** 2093-2096

## One-Sentence Summary
Demonstrates that formant bandwidth, while having little effect on isolated vowel quality, strongly affects mutual masking between concurrent vowels - narrow formants increase both resistance to masking and masking power.

## Problem Addressed
While formant bandwidth is known to have minimal effect on isolated vowel perception, its role in concurrent speech (cocktail party problem) was unexplored. The paper investigates whether bandwidth affects vowel identification when two vowels compete.

## Key Contributions
- Establishes that formant bandwidth strongly affects vowel competition/masking
- Shows that narrow-bandwidth vowels are both more resistant to masking AND stronger maskers
- Demonstrates that target bandwidth, competitor bandwidth, amplitude ratio, and ΔF0 effects are approximately orthogonal (independent)
- Provides quantitative equivalence: 4-fold bandwidth change ≈ 10 dB amplitude change ≈ 6% ΔF0

## Methodology
- "Double vowel" stimuli: pairs of synthetic Japanese vowels (/a/, /e/, /i/, /o/, /u/) added together
- 5-formant synthesis with bandwidths at half or twice normal values
- F0s of 124 Hz or 132 Hz (0% or 6% ΔF0 difference)
- Amplitude ratios: 5, 15, or 25 dB difference
- 960 total stimuli presented to 15 Japanese subjects
- Subjects reported one or two vowels per stimulus; identification rates measured independently

## Key Equations

Peak amplitude increase from bandwidth narrowing:
$$
\Delta A_{peak} \approx 6 \text{ dB for 4-fold bandwidth reduction}
$$

This follows from resonator theory: halving bandwidth doubles peak amplitude (+6 dB).

## Parameters

| Name | Symbol | Units | /a/ | /e/ | /i/ | /o/ | /u/ | Notes |
|------|--------|-------|-----|-----|-----|-----|-----|-------|
| F1 | F1 | Hz | 750 | 469 | 281 | 468 | 312 | From Hirahara & Kato [6] |
| F2 | F2 | Hz | 1187 | 2031 | 2281 | 781 | 1219 | |
| F3 | F3 | Hz | 2595 | 2687 | 3187 | 2656 | 2469 | |
| F4 | F4 | Hz | 3781 | 3375 | 3781 | 3281 | 3406 | |
| F5 | F5 | Hz | 4200 | 4200 | 4200 | 4200 | 4200 | Same for all vowels |
| B1 | B1 | Hz | 90 | 90 | 90 | 90 | 90 | "Normal" from Assmann & Summerfield [1] |
| B2 | B2 | Hz | 110 | 110 | 110 | 110 | 110 | |
| B3 | B3 | Hz | 170 | 170 | 170 | 170 | 170 | |
| B4 | B4 | Hz | 250 | 250 | 250 | 250 | 250 | |
| B5 | B5 | Hz | 300 | 300 | 300 | 300 | 300 | |

Experimental bandwidth conditions:
- "Half" = 0.5 × normal bandwidth
- "Twice" = 2.0 × normal bandwidth

Stimulus parameters:
| Parameter | Values | Notes |
|-----------|--------|-------|
| Duration | 270 ms | Including 20 ms raised-cosine onset/offset |
| F0 | 124, 132 Hz | Allows 0% or 6% ΔF0 |
| Amplitude ratio | 5, 15, 25 dB | Between paired vowels |
| SPL | 63-70 dB(A) | Varied by stimulus |

## Implementation Details

### Stimulus Generation
1. Synthesize single vowels with 5 formants
2. Apply raised-cosine onset/offset (20 ms each)
3. Use "random" starting phase spectrum (same for all vowels)
4. Scale to standard RMS amplitude
5. To create double vowel: pair two vowels, scale one by ratio, add, rescale sum to standard RMS

### Key Insight for Synthesis
Perceptual salience depends on amplitude localized at formant peaks, not RMS or average spectrum level. This suggests:
- Peak amplitude matters more than integrated energy
- Narrow formants have higher local SNR
- Wide-formant competitors provide flatter spectral context

## Figures of Interest
- **Fig 1 (p.2093):** Spectral envelope of /e/ at normal, half, and twice bandwidth - shows peak amplitude differences
- **Fig 2 (p.2094):** Identification rate vs bandwidth conditions at each amplitude ratio - shows parallelogram pattern indicating independent effects
- **Fig 3 (p.2094):** ΔF0 improvement as function of ratio and bandwidth
- **Fig 4 (p.2095):** Spectral envelopes of /o+u/ pair showing how bandwidth affects formant prominence in combined spectra
- **Fig 5 (p.2095):** Pair-specific identification rates for /o+u/

## Results Summary

Main findings at ΔF0=0:
1. **Target bandwidth effect:** Narrow formants → better identification (all dotted lines have negative slope)
2. **Competitor bandwidth effect:** Wide competitor formants → better target identification (all solid lines have negative slope)
3. **Effects are orthogonal:** At -5 dB, data forms parallelogram; effects are independent
4. **Equal n/n and w/w:** When both have same relative bandwidth, identification is equivalent (except at -25 dB)

Quantitative equivalences:
- 4× bandwidth change ≈ 10 dB amplitude change
- 4× bandwidth reduction → ~6 dB peak amplitude increase
- These effects comparable to 6% ΔF0 difference

ΔF0 effects:
- 6% ΔF0 improves identification across all conditions
- Effect larger for narrow-formant targets at extreme ratios
- Narrow-formant competitor masking "surrenders more easily" to ΔF0

## Limitations
- Statistical analysis only for p<0.05 effects
- Pair-specific analyses limited by small trial counts (30 per condition)
- Qualitative explanations in terms of "feature salience" have limits
- Does not fully explain why narrow formants increase masking power (contradicts interformant valley hypothesis)
- Resolution requires computational models of auditory masking

## Relevance to Project

**Rating: Medium - directly implementable insights**

### Implementable Actions

1. **Bandwidth modulation for stress/emphasis** - The paper shows narrow bandwidths make vowels more perceptually prominent. Instead of just boosting amplitude for stressed syllables, Qlatt could *narrow bandwidths* (e.g., 0.7× normal). This is a different lever for emphasis that sounds more natural than just "louder." Add bandwidth scaling to stress/emphasis rules in `tts-frontend-rules.js`.

2. **The 4× bandwidth ≈ 10 dB equivalence** - Concrete parameter trading. If you want a vowel to "pop" by 10 dB equivalent, halve the bandwidths twice. This could inform prosodic rules for prominence.

3. **Bandwidth defaults** - B1=90, B2=110, B3=170, B4=250, B5=300 Hz from Assmann & Summerfield [1]. Compare current Klatt bandwidth defaults against these well-sourced values.

4. **Peak amplitude matters, not RMS** - For the synthesizer's gain staging, this tells us formant peak levels are what the ear tracks, not overall energy. Relevant for amplitude normalization and understanding why bandwidth affects perception.

### Secondary Value

5. **Vocal effort modeling:** Stressed speech may have narrower bandwidths (shorter glottal closed phase, stiffer tissues) - physiological basis for the bandwidth-stress connection
6. **Masking considerations:** When synthesizing speech for adverse conditions, narrower bandwidths improve intelligibility

## Open Questions
- [ ] How do bandwidth effects generalize to non-Japanese vowels?
- [ ] Does the effect hold for naturally produced (vs synthetic) double vowels?
- [ ] What computational model best explains the orthogonal masking effects?
- [ ] How does bandwidth interact with other voice quality parameters?

## Related Work Worth Reading
- Assmann & Summerfield (1990) - Concurrent vowel perception with different F0s [1]
- de Cheveigné et al. (1997) - Concurrent vowel identification: level and F0 effects [2]
- Klatt (1982) - Perceived phonetic distance from critical-band spectra [7]
- Rosner & Pickering (1994) - Vowel perception and production [8]
