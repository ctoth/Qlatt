# Investigating the Use of Formant Frequencies in Listener Judgments of Speaker Size

**Authors:** Santiago Barreda
**Year:** 2015
**Venue:** Journal of the Acoustical Society of America (preprint r1)
**Affiliation:** University of California, Davis

## One-Sentence Summary

Listeners use formant frequencies directly (not VTL estimates) for speaker-size judgments, with higher formants (F4, F5) contributing to these judgments, and phoneme-specific biases persisting even when contrary to VTL cues.

## Problem Addressed

Whether listeners estimate speaker size using a recovered vocal-tract length (VTL) parameter, or whether they respond directly to formant frequencies without phoneme-independent normalization.

## Key Contributions

1. **Phoneme biases exist in size perception**: Listeners consistently identify certain vowels as "taller" than others, even when VTL cues suggest otherwise (/ʊ/ perceived as taller than /æ/ in 74% of cases, even with conflicting VTL)
2. **Higher formants (F4, F5) are used**: Each additional formant up to F5 improved size-judgment consistency
3. **VTL estimation is not sole basis**: Speaker-size judgments are not based solely on phoneme-independent VTL estimates

## Methodology

- 60 listeners divided into 4 groups (2, 3, 4, 5-formant vowels)
- Synthetic vowels /i æ ʊ/ based on Edmonton English adult males
- VTL differences simulated by uniform formant scaling (~8% per step, 16% total range)
- Two f0 levels: 120-130 Hz (low) and 240-260 Hz (high)
- Paired comparison task: "Which vowel sounds like a taller speaker?"
- Bayesian multilevel logistic regression analysis

## Key Equations

### Logistic Model for Same-Phoneme Trials

$$
p(\text{success}_i) = \text{logistic}(\theta_i) = \frac{\exp(\theta_i)}{\exp(\theta_i) + 1}
$$

$$
\theta_i = \alpha_0 + \alpha_F + \alpha_V + \alpha_{\Delta VTL} + \alpha_S + \alpha_{F \times V} + \alpha_{\Delta VTL \times F} + \alpha_{\Delta VTL \times V}
$$

Where:
- $\alpha_0$ = overall intercept
- $\alpha_F$ = formant group effect (2, 3, 4, 5 formants)
- $\alpha_V$ = vowel category effect (/æ i ʊ/)
- $\alpha_{\Delta VTL}$ = VTL difference effect (1 or 2 steps)
- $\alpha_S$ = subject random effect

### Logistic Model for Different-Phoneme Trials

$$
p(\text{reference taller}_i) = \text{logistic}(\theta_i)
$$

$$
\theta_i = \alpha_i + \beta_i \times VTL_i
$$

$$
\alpha_i = \alpha_0 + \alpha_F + \alpha_V + \alpha_S + \alpha_{F \times V}
$$

$$
\beta_i = \beta_0 + \beta_F + \beta_V + \beta_S + \beta_{F \times V}
$$

## Parameters

| Name | Symbol | Units | Value | Notes |
|------|--------|-------|-------|-------|
| Baseline F1 /i/ | F1 | Hz | 295 | Edmonton English adult male |
| Baseline F2 /i/ | F2 | Hz | 2262 | |
| Baseline F3 /i/ | F3 | Hz | 2900 | |
| Baseline F1 /æ/ | F1 | Hz | 755 | |
| Baseline F2 /æ/ | F2 | Hz | 1576 | |
| Baseline F3 /æ/ | F3 | Hz | 2441 | |
| Baseline F1 /ʊ/ | F1 | Hz | 458 | |
| Baseline F2 /ʊ/ | F2 | Hz | 1100 | |
| Baseline F3 /ʊ/ | F3 | Hz | 2392 | |
| F4 (all vowels) | F4 | Hz | 3500 | Fixed across categories |
| F5 (all vowels) | F5 | Hz | 3500 | Fixed across categories |
| VTL step size | | log-Hz | 0.077 | ~8% per step |
| VTL total range | | % | 16 | 5 steps total |
| Low f0 | f0 | Hz | 120-130 | Falling contour |
| High f0 | f0 | Hz | 240-260 | Falling contour |
| Vowel duration | | ms | 200 | Steady-state |
| Inter-stimulus interval | | ms | 250 | |
| Formant bandwidth | BW | % of Fc | 6% | Min 60 Hz |

### Between/Within Category Variability Ratios (from Hillenbrand et al. 1995)

| Speaker Class | F1 | F2 | F3 | F4 |
|---------------|----|----|----|----|
| Women | 3.09 | 4.49 | 2.09 | 0.62 |
| Men | 3.22 | 4.34 | 2.06 | 0.54 |
| Children | 2.78 | 4.20 | 2.03 | 0.93 |

**Key insight**: Only F4 has ratio < 1, meaning it varies more between-speakers than between-phonemes, making it better for speaker identification.

## Implementation Details

### Synthesis Details
- Klatt-style parametric synthesis in MATLAB
- 11 formants specified (F6-F11 at 1000 Hz increments above F5)
- Sampling frequency varied to maintain Nyquist at midpoint between F11 and expected F12
- Formants scaled uniformly to simulate VTL differences
- Low-pass filtering to create 2, 3, 4, 5-formant versions

### Key Findings for Synthesis

1. **F4 and F5 contribute to perceived speaker size**: Speakers synthesized with more formants yield more consistent size judgments

2. **Phoneme biases are strong**: /ʊ/ perceived as taller than /æ/ in 74% of cases overall, even when /æ/ had 16% longer simulated VTL

3. **Success rates by vowel**: /i/ > /æ/ > /ʊ/ for associating lower FFs with larger speakers

4. **Higher formants don't eliminate biases**: More formants increased VTL sensitivity but did NOT reduce phoneme-specific biases

## Results Summary

### Same-Phoneme Trials
- Overall success rate: 79.7% (identifying longer VTL as taller)
- 2-formant vowels: 75.6% success
- Each additional formant credibly improved performance
- Success varied by vowel: /i/ > /æ/ > /ʊ/

### Different-Phoneme Trials
- /æ/ vs /i/: Slight bias toward /i/ as taller (55.4%)
- /æ/ vs /ʊ/: Strong bias toward /ʊ/ as taller (74%)
- Even with +2 VTL steps favoring /æ/, /ʊ/ still selected as taller 53.5% of time

## Figures of Interest

- **Fig 1 (page 6):** LPC spectra comparing /æ/ to /æ/ and /ʊ/ at different VTL levels
- **Fig 2 (page 14):** Stimulus voice positions in f0 x FF space and F1-F2 vowel space
- **Fig 3 (page 16):** LPC spectra showing filter cutoffs for 2, 3, 4, 5-formant stimuli
- **Fig 4 (page 25):** Success rates by formant group, VTL difference, and vowel category
- **Fig 5 (page 26):** Bayesian ANOVA results for same-phoneme trials
- **Fig 6 (page 28):** Different-phoneme trial results showing strong /ʊ/ bias
- **Fig 8 (page 30):** Posterior distributions for intercepts and slopes

## Limitations

1. Only 3 vowel categories tested (/i æ ʊ/)
2. Synthetic vowels only (not natural speech)
3. Isolated vowels (not connected speech)
4. Single dialect (Edmonton English)
5. Cannot determine exact FF-to-size mapping from this design

## Relevance to Project

### For Klatt Synthesizer Implementation
- **F4/F5 matter perceptually**: Even though Klatt 1980 suggests F4/F5 can be held constant across phonemes, they DO affect perceived speaker characteristics
- **Uniform VTL scaling is valid**: Appendix confirms uniform formant scaling is appropriate for simulating speaker size differences
- **Fixed higher formants are acceptable**: Within-speaker, F4/F5 variation across phonemes is minimal; idiosyncratic placement is fine

### For TTS Voice Quality
- **Speaker size perception varies by phoneme**: The same synthesized "speaker" may sound different sizes depending on which vowel is being produced
- **Lower formants = perceived larger speaker**: Simple heuristic, but can be overridden by phoneme-specific patterns

## Open Questions

- [ ] What is the exact perceptual weighting of F1-F5 in size judgments?
- [ ] Do these biases exist for other vowel categories?
- [ ] How do consonantal formant transitions affect size perception?
- [ ] Does context (connected speech) reduce phoneme-specific biases?

## Related Work Worth Reading

- Hillenbrand et al. (1995) - Acoustic characteristics of American English vowels (F1-F4 data)
- Peterson & Barney (1952) - Classic vowel formant data
- Klatt (1980) - Original cascade/parallel synthesizer (already in project)
- Fant (1970) - Acoustic Theory of Speech Production
- Nearey (1978) - Phonetic Feature Systems for Vowels (log-mean FF normalization)
- Turner et al. (2009) - Statistical formant-pattern model for VTL/vowel segregation

## Key Quotes

> "Klatt states that since F4 and F5 frequencies and bandwidths do not vary much between vowel phonemes within-speaker, they 'help to shape the overall spectrum, but otherwise contribute little to intelligibility for vowels' and so they can 'be held constant [across phonemes] with little decrement in output sound quality'" (p. 9)

> "Listeners appear to use the FFs directly, and simply associate lower formants with larger speakers regardless of the VTL implied by them" (p. 32)

> "Constraining category means for all speaker classes to vary according to uniform scaling results in an average error in F1 and F2 of only 2.3%" (p. 39-40) - Validates uniform VTL scaling approach

## Appendix Summary: Uniform Scaling Validation

The appendix provides important validation that **uniform formant scaling** (multiplying all formants by a single factor) is appropriate for simulating VTL differences:

1. Analysis of 3 large datasets (Peterson & Barney 1952, Syrdal 1985, Hillenbrand 1995) shows deviations from uniform scaling average only 2.3%
2. This is much smaller than within-speaker variability (9.4% between repetitions in P&B)
3. No consistent non-uniform patterns across dialects
4. Perceptual research shows uniform scaling has no negative consequences for intelligibility or naturalness

This validates the approach used in the current project's Klatt synthesizer for simulating different speaker sizes.
