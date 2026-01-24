# Acoustic Characteristics of American English Vowels

**Authors:** James Hillenbrand, Laura A. Getty, Michael J. Clark, Kimberlee Wheeler
**Year:** 1995
**Venue:** Journal of the Acoustical Society of America, Vol. 97, No. 5, Pt. 1, pp. 3099-3111
**DOI:** 0001-4966/95/97(5)/3099/13/$6.00

## One-Sentence Summary

Modern replication and extension of Peterson & Barney (1952) providing F0-F4 formant data for 12 American English vowels from 139 speakers (men, women, children), with duration measurements and spectral change patterns critical for TTS formant targets.

## Problem Addressed

The classic Peterson & Barney (1952) study has several limitations:
1. No duration measurements
2. Static formants only (single time slice)
3. No information about spectral change over time
4. No separate data for men, women, children
5. Subject dialect not screened
6. Measurement reliability not reported
7. Original signals unavailable for re-analysis

## Key Contributions

1. **Updated formant database** for 12 American English vowels with F0, F1-F4 measurements
2. **Duration data** for each vowel in /hVd/ context
3. **Spectral change patterns** showing formant trajectories at 20% and 80% of vowel duration
4. **Talker group separation** (45 men, 48 women, 46 children aged 10-12)
5. **Listening test validation** with 94.4% overall identification accuracy
6. **Discriminant analysis** showing importance of spectral change for vowel classification

## Methodology

### Recording
- 139 talkers from Michigan's lower peninsula (87%), southeastern/southwestern Michigan
- 12 vowels in /hVd/ context: /i, ɪ, e, ɛ, æ, ɑ, ɔ, o, ʊ, u, ʌ, ɜ˞/
- Digital recording: Sony PCM-F1, Shure 570-S microphone
- 7.2 kHz low-pass filtered, 16 kHz sampling, 12-bit resolution
- ±10V dynamic range, no peak clipping

### Analysis
- LPC analysis: 14-pole, 128-point linear-predictive coding
- Spectra computed every 8 ms over 16 ms (256-point) hamming windows
- Cepstral smoothing applied
- Steady-state defined as center of seven 56-ms analysis frames with minimum slope in log F2 - log F1 space
- F0 extracted via autocorrelation pitch tracker

### Listening Test
- 20 phonetically trained listeners
- Signals low-pass filtered at 7.2 kHz, delivered at 77 dBA
- 1668 /hVd/ utterances presented in random order

## Key Equations

No explicit equations provided, but key computational concepts:

**Steady-state determination:**
Center of 7 consecutive frames (56 ms total) minimizing:
$$\text{slope} = \frac{d(\log F2 - \log F1)}{dt}$$

**Formant frequency resolution:**
LPC with 3-point parabolic interpolation yields 61.5 Hz resolution.

## Parameters

### Table V: Average Formant Frequencies and Durations (Steady-State)

| Vowel | Group | Dur (ms) | F0 (Hz) | F1 (Hz) | F2 (Hz) | F3 (Hz) | F4 (Hz) |
|-------|-------|----------|---------|---------|---------|---------|---------|
| /i/   | M     | 243      | 138     | 342     | 2322    | 3000    | 3657    |
| /i/   | W     | 306      | 227     | 437     | 2761    | 3372    | 4352    |
| /i/   | C     | 297      | 246     | 452     | 3081    | 3702    | 4572    |
| /ɪ/   | M     | 192      | 135     | 427     | 2034    | 2684    | 3618    |
| /ɪ/   | W     | 237      | 224     | 483     | 2365    | 3053    | 4334    |
| /ɪ/   | C     | 248      | 241     | 511     | 2552    | 3323    | 4575    |
| /e/   | M     | 267      | 129     | 476     | 2089    | 2691    | 3649    |
| /e/   | W     | 320      | 219     | 536     | 2530    | 3047    | 4319    |
| /e/   | C     | 314      | 237     | 564     | 2656    | 3323    | 4422    |
| /ɛ/   | M     | 189      | 127     | 580     | 1799    | 2605    | 3677    |
| /ɛ/   | W     | 254      | 214     | 731     | 2058    | 2979    | 4294    |
| /ɛ/   | C     | 235      | 230     | 749     | 2267    | 3310    | 4671    |
| /æ/   | M     | 278      | 123     | 588     | 1952    | 2601    | 3624    |
| /æ/   | W     | 332      | 215     | 669     | 2349    | 2972    | 4290    |
| /æ/   | C     | 322      | 228     | 717     | 2501    | 3289    | 4409    |
| /ɑ/   | M     | 267      | 123     | 768     | 1333    | 2522    | 3687    |
| /ɑ/   | W     | 323      | 215     | 936     | 1551    | 2815    | 4299    |
| /ɑ/   | C     | 311      | 229     | 1002    | 1688    | 2950    | 4307    |
| /ɔ/   | M     | 283      | 121     | 652     | 997     | 2538    | 3486    |
| /ɔ/   | W     | 353      | 210     | 781     | 1136    | 2824    | 3923    |
| /ɔ/   | C     | 319      | 225     | 803     | 1210    | 2982    | 3919    |
| /o/   | M     | 265      | 129     | 497     | 910     | 2459    | 3384    |
| /o/   | W     | 326      | 217     | 555     | 1035    | 2828    | 3927    |
| /o/   | C     | 310      | 236     | 597     | 1137    | 2987    | 4167    |
| /ʊ/   | M     | 192      | 133     | 469     | 1122    | 2434    | 3400    |
| /ʊ/   | W     | 249      | 230     | 519     | 1225    | 2827    | 4052    |
| /ʊ/   | C     | 247      | 243     | 568     | 1490    | 3072    | 4328    |
| /u/   | M     | 237      | 143     | 378     | 997     | 2343    | 3357    |
| /u/   | W     | 303      | 235     | 459     | 1105    | 2735    | 4115    |
| /u/   | C     | 278      | 249     | 494     | 1345    | 2988    | 4320    |
| /ʌ/   | M     | 188      | 133     | 623     | 1200    | 2550    | 3557    |
| /ʌ/   | W     | 226      | 218     | 753     | 1426    | 2933    | 4092    |
| /ʌ/   | C     | 234      | 236     | 749     | 1546    | 3145    | 4276    |
| /ɜ˞/  | M     | 263      | 130     | 474     | 1379    | 1710    | 3334    |
| /ɜ˞/  | W     | 321      | 217     | 523     | 1588    | 1929    | 3914    |
| /ɜ˞/  | C     | 307      | 237     | 586     | 1719    | 2143    | 3788    |

**Key:** M=Men, W=Women, C=Children (ages 10-12)

### Duration Patterns

- Tense vowels (/i, e, ɑ, ɔ, o, u, ɜ˞/) are longer than lax vowels (/ɪ, ɛ, æ, ʊ, ʌ/)
- Women's durations average ~30% longer than men's
- Children's durations similar to women's
- Duration correlates strongly (r=0.91) with connected speech data (Black, 1949)
- /hVd/ durations ~two-thirds longer than connected speech

### F0 Averages by Group

| Group    | F0 Range (Hz) |
|----------|---------------|
| Men      | 121-143       |
| Women    | 210-235       |
| Children | 225-249       |

### Measurement Reliability

| Measure | Average Absolute Difference |
|---------|----------------------------|
| Duration | 6.9 ms (remeasurement) |
| Steady-state time | 21.1 ms (7.7% of vowel) |
| F0 | 1.7 Hz (signed), 0.6 Hz (frame-by-frame) |
| F1 | 11.7 Hz absolute, -2.6 Hz signed |
| F2 | 25.2 Hz absolute, 3.4 Hz signed |
| F3 | 28.7 Hz absolute, 2.5 Hz signed |
| F4 | 59.0 Hz absolute, 4.0 Hz signed |

## Implementation Details

### Formant Extraction Pipeline
1. Low-pass filter at 7.2 kHz
2. Sample at 16 kHz, 12-bit resolution
3. Apply 256-point (16 ms) Hamming window
4. Compute 14-pole LPC spectrum every 8 ms
5. Cepstral smoothing (window adjusted per utterance)
6. Extract first 7 spectral peaks via 3-point parabolic interpolation
7. Find steady-state: center of 7-frame (56 ms) sequence with minimum log F2 - log F1 slope

### Steady-State vs. Spectral Change
- Single steady-state sample: 68.2% classification accuracy (F1, F2 only)
- Adding F3: improves to 81.0%
- Two samples (20%, 80% of duration): 87.9-94.1% accuracy
- **Spectral change is critical for vowel identification**

### Formant Merger Rates (Table I)

Percentage of utterances showing formant merger at steady state:

| Vowel | F1-F2 Merger | F2-F3 Merger |
|-------|--------------|--------------|
| /ɑ/   | 2.0%         | 0.7%         |
| /ɔ/   | 4.0%         | 0.7%         |
| /o/   | 2.7%         | 0.0%         |
| /ʊ/   | 1.3%         | 0.7%         |
| /ɜ˞/  | 0.0%         | 15.3%        |

Note: /ɜ˞/ has high F2-F3 merger due to rhoticity lowering F3.

## Figures of Interest

- **Fig. 1 (p. 3100):** Spectral peak display showing LPC analysis refinement process
- **Fig. 2 (p. 3103):** F0 scatter plot comparing present study to Peterson & Barney
- **Fig. 3 (p. 3103):** F1-F2 plot for all 12 vowels with ellipses (men, women, children)
- **Fig. 4 (p. 3104):** Individual F1-F2 data points showing vowel overlap
- **Figs. 5-7 (pp. 3104-3105):** Acoustic vowel diagrams comparing to Peterson & Barney
- **Fig. 8 (p. 3105):** F3 comparison between studies
- **Fig. 9 (p. 3105):** Spectral change patterns (mel-transformed F1 vs F0 and F2-F3 trajectories)
- **Fig. 10 (p. 3109):** Histogram of listener identification rates per token

## Results Summary

### Comparison to Peterson & Barney
- F0 values 28 Hz lower for children (vs. PB)
- F1, F2 values show similar patterns but with increased crowding in F1-F2 space
- F3 values: Men +113 Hz, Women +47 Hz, Children -174 Hz (vs. PB)
- General tendency toward lower tongue positions in present data

### Listener Identification
- Overall accuracy: 94.4% (present study) vs. 94.4% (PB)
- Men: 94.6%, Women: 95.6%, Children: 93.7%
- Most confusions: /ɑ/-/ɔ/ pair, /æ/-/ɛ/ pair
- /ɔ/ intended → heard as /ɑ/ in 13.8% of cases

### Discriminant Analysis (Table IX)
Classification accuracy using different parameter sets:

| Parameters | One Sample | Two Samples | Three Samples |
|------------|------------|-------------|---------------|
| F1, F2     | 68.2%      | 87.9%       | 87.7%         |
| F1, F2, F3 | 81.0%      | 91.6%       | 91.8%         |
| F0, F1, F2 | 78.2%      | 91.6%       | 91.0%         |
| F0, F1, F2, F3 | 84.7%  | 93.6%       | 92.8%         |

**With duration added:**
| Parameters | One Sample | Two Samples | Three Samples |
|------------|------------|-------------|---------------|
| F1, F2     | 76.1%      | 90.3%       | 90.4%         |
| F0, F1, F2, F3 | 87.8%  | 94.1%       | 94.8%         |

**Key finding:** Two-sample (20%, 80%) formant pattern + duration approaches listener performance.

## Limitations

1. /hVd/ context only - not representative of connected speech
2. Regional dialect (Michigan) - may not generalize to all American English
3. No direct comparability with PB due to LPC vs. spectrographic methods
4. Original PB recordings unavailable for re-analysis
5. Static F1-F2 alone insufficient for accurate vowel classification
6. /ɔ/ poorly identified (82.0%) - often confused with /ɑ/

## Relevance to Project

### For Klatt Synthesizer Formant Targets
1. **Use Table V** as primary reference for F1-F4 targets (replaces/supplements Peterson & Barney)
2. **Implement spectral change:** Static targets insufficient - need 20%/80% duration sampling
3. **Duration matters:** Tense/lax distinction requires correct duration ratios
4. **F3 critical for front vowels:** /i, ɪ, e, ɛ, æ/ need accurate F3 for identification
5. **F4 data available:** Can implement 4-formant synthesis if needed

### Specific Implementation Notes
- /æ/ and /ɛ/ overlap heavily in static F1-F2 space - **must use spectral change**
- /ɑ/ and /ɔ/ require careful F1/F2 separation and duration differences
- Children's formants ~15-20% higher than adult males
- Women's F0 averages 1.6× men's; children's F0 similar to women's

### Duration Scaling for Connected Speech
Black (1949) correlation suggests: connected speech duration ≈ 0.6 × /hVd/ duration

## Open Questions

- [ ] How to implement spectral change in frame-based synthesis (interpolation method?)
- [ ] Should formant transitions be linear or follow specific trajectories?
- [ ] What is the optimal number of formant samples for synthesis quality?
- [ ] How do these values interact with coarticulation rules?

## Related Work Worth Reading

- **Di Benedetto (1989a,b):** F1 time variations and vowel perception
- **Strange et al. (1983, 1989):** Dynamic properties in vowel perception
- **Nearey (1989):** Static, dynamic, and relational properties in vowel perception
- **Zahorian & Jagharghi (1993):** Spectral shape vs. formants for vowel classification
- **Syrdal & Gopal (1986):** Perceptual model using Bark scale
- **Miller (1989):** Auditory-perceptual vowel interpretation
