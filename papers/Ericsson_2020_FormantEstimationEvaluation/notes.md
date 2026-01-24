# Evaluation of an Automated Formant Estimation Procedure with Optimized Formant Ceiling

**Authors:** Anna Ericsson
**Year:** 2020
**Venue:** Master's Thesis (Magister), Stockholm University, Department of Linguistics (Phonetics)
**Supervisor:** Marcin Wlodarczak

## One-Sentence Summary

Evaluates the Escudero et al. (2009) optimized formant ceiling procedure against fixed generic ceilings using synthetic vowels, finding that the optimized procedure does NOT outperform the simpler generic ceiling method, and both fail at high F0.

## Problem Addressed

- Formant estimation is critical for vowel analysis but difficult, especially with high fundamental frequency (F0)
- The optimized formant ceiling method (Escudero et al., 2009) claims to adapt to speaker/vowel variation by selecting the ceiling with minimum variance
- This method had never been tested on material with *known* formant values (ground truth)

## Key Contributions

1. **First rigorous evaluation** of the optimized formant ceiling procedure on synthetic vowels with known formant frequencies
2. **Comparison with Monsen & Engebretson (1983)** - both modern methods (optimized and generic) outperform 1983-era LPC
3. **Systematic F0 variation study** - tested at 100, 200, 300, 400, 500 Hz to characterize high-F0 failure modes
4. **Vowel-specific error patterns** identified for Swedish vowels

## Methodology

### Vowel Synthesis (Praat KlattGrid)
- **9 Swedish long vowels:** [i, e, y, æ, ø, ʉ, ɒ, o, u]
- **50 F1-F2 configurations per vowel:** 25 male-based, 25 female-based
- **Systematic variation:** F1 and F2 varied from -2SD to +2SD in 1SD steps
- **F0 levels:** 100, 200, 300, 400, 500 Hz
- **Total tokens:** 2250 (9 vowels × 2 sexes × 25 variations × 5 F0 levels)
- **Synthesis parameters:**
  - Duration: 400 ms
  - Bandwidths: 50 Hz (F1, F2), 100 Hz (F3)
  - F4: 4000 Hz (male), 4500 Hz (female)

### Formant Estimation (Praat Burg LPC)
- **Settings:** Time step 0.0, Max formants 6.0, Window 0.025s, Pre-emphasis 50 Hz
- **Generic ceiling:** 5000 Hz (male), 5500 Hz (female)
- **Optimized ceiling:** Tested 4000-6500 Hz in 10 Hz steps, selected ceiling with minimum combined log-variance of F1+F2

## Key Equations

### Optimal Ceiling Selection (Escudero et al., 2009)
The optimal ceiling is the one that minimizes:

$$
\text{ceiling}_{\text{opt}} = \arg\min_c \left[ \log(\text{Var}(F_1)) + \log(\text{Var}(F_2)) \right]
$$

Where variance is computed across repeated measurements within a single token.

### Expected Error Due to F0 > F1
When F0 exceeds F1, the minimum expected error is:

$$
E_{\min} = \max(0, f_0 - F_1^{\text{target}})
$$

This is unavoidable - if F0 > F1, there are no harmonics to represent F1.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Generic ceiling (male) | - | Hz | 5000 | - | Praat standard |
| Generic ceiling (female) | - | Hz | 5500 | - | Praat standard |
| Optimized ceiling range | - | Hz | - | 4000-6500 | 10 Hz steps |
| Number of formants | - | count | 5 | 4-6 | Adjusted with ceiling |
| Analysis window | - | s | 0.025 | - | LPC parameter |
| Pre-emphasis | - | Hz | 50 | - | LPC parameter |
| Synthesis bandwidth (F1, F2) | B1, B2 | Hz | 50 | - | Klatt synthesis |
| Synthesis bandwidth (F3) | B3 | Hz | 100 | - | Klatt synthesis |
| Token duration | - | ms | 400 | - | Synthesis parameter |

### Swedish Vowel Formants (Eklund & Traunmuller, 1997)

| Vowel | M F1 Mean | M F1 SD | M F2 Mean | M F2 SD | F F1 Mean | F F1 SD | F F2 Mean | F F2 SD |
|-------|-----------|---------|-----------|---------|-----------|---------|-----------|---------|
| i [i] | 291 | 12 | 2107 | 74 | 351 | 34 | 2455 | 190 |
| e [e] | 376 | 14 | 2152 | 41 | 438 | 24 | 2500 | 178 |
| y [y] | 285 | 4 | 1988 | 61 | 353 | 26 | 2319 | 194 |
| ä [æ] | 612 | 40 | 1501 | 79 | 755 | 64 | 1890 | 171 |
| ö [ø] | 436 | 21 | 1601 | 60 | 517 | 51 | 1900 | 86 |
| u [ʉ] | 328 | 17 | 1679 | 52 | 386 | 10 | 1904 | 84 |
| a [ɒ] | 560 | 41 | 876 | 32 | 665 | 47 | 1038 | 58 |
| å [o] | 382 | 15 | 642 | 14 | 424 | 20 | 748 | 67 |
| o [u] | 320 | 20 | 639 | 40 | 374 | 16 | 718 | 58 |

## Implementation Details

### Optimized Ceiling Procedure
1. For each token, estimate formants at all ceilings from 4000-6500 Hz (10 Hz steps = 251 ceilings)
2. For each ceiling, compute mean F1 and F2 over token duration
3. Compute variance of F1 and F2 across the ceiling sweep
4. Select the ceiling where log(Var(F1)) + log(Var(F2)) is minimum
5. Use formant estimates from that ceiling

### Number of Formants vs Ceiling
- Ceiling 4000-4499 Hz → 4 formants
- Ceiling 4500-4999 Hz → 4.5 formants
- Ceiling 5000-5499 Hz → 5 formants
- Ceiling 5500-5999 Hz → 5.5 formants
- Ceiling 6000-6500 Hz → 6 formants

### Edge Cases
- When F0 > F1: No harmonics below F0 to represent F1, estimation fails
- Close vowels [i, u, ʉ, y] with low F1 are most affected
- Problems begin at F0 = 300 Hz for tokens with F1 < 300 Hz

## Figures of Interest

- **Fig 1a/b (p. 3):** Voice source vs. schwa (neutral tube) spectrograms - shows formant peaks
- **Fig 2 (p. 4):** Source-filter model for /i/, /a/, /u/ - tube shape affects formants
- **Fig 3 (p. 5):** IPA vowel chart with F1/F2 axes
- **Fig 4a/b (p. 6):** Synthetic vs. natural /i/ spectrograms - broadband vs narrowband
- **Fig 5 (p. 12):** All 2250 synthesized vowel tokens plotted in F1-F2 space
- **Fig 6 (p. 14):** **KEY RESULT** - Comparison with Monsen & Engebretson (1983)
- **Fig 10 (p. 18):** F1 overestimated at high F0, F2 underestimated
- **Fig 12 (p. 20):** Detailed vowel-by-vowel, F0-by-F0 error breakdown
- **Fig 15a/b (p. 22-23):** F1 and F2 estimation vs target at each F0
- **Fig 17 (p. 26):** Theoretical minimum error added - F1_fo_e curve

## Results Summary

### Main Findings

1. **Generic ceiling performed slightly BETTER overall** (p < .011, F(1,2160) = 6.474)
2. **Both methods outperform 1983-era LPC** by ~50-100 Hz at low F0
3. **Both methods fail similarly at high F0** - no advantage to optimization
4. **F1 estimations more accurate than F2** (p < .001)
5. **Male estimations more accurate than female** overall (p < .001)

### Error by F0 Level (Mean Absolute Error, Hz)
| F0 | Optimized | Generic | Monsen LPC | Monsen Human |
|----|-----------|---------|------------|--------------|
| 100 | ~10 | ~8 | ~60 | ~35 |
| 200 | ~25 | ~30 | ~80 | ~55 |
| 300 | ~40 | ~50 | ~100 | ~75 |
| 400 | ~105 | ~90 | ~140 | ~105 |
| 500 | ~155 | ~140 | ~180 | ~160 |

### Vowel-Specific Accuracy (Best to Worst)
[ø] > [æ] > [o] > [ʉ] > [ɒ] > [u] > [e] > [y] > [i]

- **Best:** Open/mid vowels with higher F1
- **Worst:** Close vowels [i, y] with low F1 (most affected by high F0)

### Ceiling Distribution
- Optimized ceilings: 4000-6500 Hz, typically LOWER than generic
- No clear pattern by vowel type (contrary to Escudero's expectation that front vowels would have higher ceilings)

## Limitations

1. **Synthetic vowels only** - may not generalize to natural speech
2. **Swedish vowels only** - 7 of 9 are close/half-close, may bias results
3. **No F3 evaluation** - only F1 and F2 examined
4. **Static vowels** - no formant transitions, coarticulation
5. **Arbitrary F0 steps** - 100 Hz increments miss 350 Hz region where Monsen showed anomaly

## Relevance to Project

### For Klatt Synthesis
- **Formant ranges validated:** Swedish vowel formants from Eklund & Traunmuller (1997) provide targets
- **Bandwidth defaults:** 50 Hz for F1/F2, 100 Hz for F3 are reasonable
- **F0-F1 interaction:** When F0 > F1, formant structure collapses - affects perception of close vowels at high pitch

### For Analysis/Verification
- **LPC estimation limits:** Don't trust formant estimates when F0 > 300 Hz for close vowels
- **Praat settings:** 5000 Hz (male) / 5500 Hz (female) ceilings are adequate
- **Optimized ceiling not worth complexity** for typical applications

### Practical Implications
- For TTS evaluation, use low F0 (< 200 Hz) test utterances for reliable formant measurement
- Close vowels [i, u] are inherently harder to analyze at high pitch
- Female/child speech formant analysis requires extra care

## Open Questions

- [ ] Why does optimized procedure sometimes perform better at 300 Hz F0 specifically?
- [ ] Would analysis-by-synthesis refinement improve high-F0 estimation?
- [ ] Can inverse filtering (IFC method) handle high F0 better in automated setting?
- [ ] What happens at 350 Hz F0 (the anomaly in Monsen's data)?

## Related Work Worth Reading

1. **Monsen & Engebretson (1983)** - Original LPC vs manual comparison methodology
2. **Escudero et al. (2009)** - Original optimized ceiling procedure (Portuguese)
3. **Watanabe (2001)** - Inverse-filter control (IFC) method, may handle high F0
4. **Dissen et al. (2019)** - Deep learning formant estimation, state-of-the-art
5. **Eklund & Traunmuller (1997)** - Swedish vowel formant data source
6. **Traunmuller & Eriksson (1997)** - Analysis-by-synthesis for high F0
7. **Fant (1960/1970)** - Acoustic theory fundamentals

## Key Quotes

> "The formant estimation procedure with optimized ceilings does not perform better than the common procedure. Both procedures perform better than earlier methods, but neither deals satisfactorily with high f0." (Abstract)

> "The accuracy of the formant estimation never can be more precise than the distance between harmonics" (p. 8)

> "When f0 is higher than F1, there are no harmonics to represent the F1" (p. 25)

> "Vowels with low F1 (i.e., closed vowels) have more errors with a higher f0" (p. 22)
