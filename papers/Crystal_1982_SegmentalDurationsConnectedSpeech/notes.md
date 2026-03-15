# Crystal & House 1982 - Segmental Durations in Connected Speech Signals: Preliminary Results

## Key Data for Synthesizer Implementation

### Corpus Description
- Two scripts: *Hunter* (monosyllabic, 254 words) and *Farm* (polysyllabic, 279 words)
- 14 talkers total, split into FAST and SLOW groups (7 each) based on total reading time
- First four sentences of each script segmented into phones
- ~5600 segments analyzed total

### Mean Durations by Phonetic Category (Table VI)

**FAST group:**
| Category | N | Duration (ms) | SD (ms) |
|---|---|---|---|
| All Phones | 2819 | - | - |
| Vowels | 1019 | 93.4 | 54.4 |
| Monophthongs | 901 | 85.2 | 46.0 |
| Long vowels | 394 | 115.3 | 48.2 |
| Short vowels | 507 | 61.8 | 26.6 |
| Diphthongs | 118 | 155.8 | 63.6 |
| Nonvocalic sonorants | 653 | 66.4 | 32.2 |
| Liquids | 293 | 65.3 | 28.4 |
| Nasals | 272 | 70.6 | 37.1 |
| Glides | 88 | 57.4 | 25.2 |
| Stops | 489 | 62.0 | 32.4 |
| Voiced stops | 250 | 56.4 | 29.3 |
| Voiceless stops | 239 | 67.7 | 34.5 |
| "One-part" stops | 270 | 46.7 | 23.0 |
| "Two-part" stops | 211 | 82.3 | 30.0 |
| Fricatives | 616 | 64.4 | 35.2 |
| Voiced fricatives | 391 | 47.1 | 20.7 |
| Voiceless fricatives | 225 | 94.5 | 34.9 |
| Affricates | 42 | 102.2 | 29.6 |
| Voiced affricates | 21 | 92.0 | 36.1 |
| Voiceless affricates | 21 | 112.4 | 15.5 |

**SLOW group:**
| Category | N | Duration (ms) | SD (ms) |
|---|---|---|---|
| All Phones | 2817 | - | - |
| Vowels | 1018 | 111.6 | 65.2 |
| Monophthongs | 903 | 102.7 | 58.8 |
| Long vowels | 395 | 141.0 | 62.5 |
| Short vowels | 508 | 72.9 | 33.0 |
| Diphthongs | 115 | 181.3 | 70.0 |
| Nonvocalic sonorants | 651 | 81.0 | 36.9 |
| Liquids | 293 | 80.7 | 36.7 |
| Nasals | 269 | 83.8 | 38.8 |
| Glides | 89 | 73.2 | 34.0 |
| Stops | 483 | 73.3 | 41.0 |
| Voiced stops | 244 | 64.2 | 29.9 |
| Voiceless stops | 239 | 82.6 | 48.1 |
| "One-part" stops | 240 | 58.1 | 35.2 |
| "Two-part" stops | 226 | 91.3 | 40.2 |
| Fricatives | 623 | 75.6 | 43.2 |
| Voiced fricatives | 401 | 54.1 | 27.0 |
| Voiceless fricatives | 222 | 114.3 | 39.8 |
| Affricates | 42 | 118.7 | 40.8 |
| Voiced affricates | 21 | 117.6 | 53.2 |
| Voiceless affricates | 21 | 119.7 | 22.4 |

### Comparison with Prior Studies (Table VII)

Mean durations compared with Parmenter & Trevino (1935) and Lehiste (1979):

| Category | Parmenter & Trevino [N=1] | SLOWEST [N=1] | SLOW [N=7] | ALL [N=14] | FAST [N=7] | FASTEST [N=1] | Lehiste [N=1] |
|---|---|---|---|---|---|---|---|
| Vowel | 117 | 117 | 112 | 102 | 93 | 78 | 78 |
| Nonvocalic sonorant | 82 | 86 | 81 | 78 | 66 | 54 | 59 |
| Fricative | 90 | 74 | 76 | 70 | 64 | 55 | 74 |
| Stop | 74 | 85 | 73 | 68 | 62 | 54 | 50 |

### Stop Consonant Analysis (Table VIII)

Hold durations of stops and affricates (FAST/SLOW):
| Class | FAST N | FAST Dur | FAST SD | SLOW N | SLOW Dur | SLOW SD |
|---|---|---|---|---|---|---|
| Stops | 481 | 49.4 | 23.6 | 466 | 56.8 | 32.0 |
| Voiced | 249 | 50.3 | 26.1 | 239 | 56.7 | 27.8 |
| Voiceless | 232 | 48.5 | 20.5 | 227 | 56.9 | 40.0 |
| Affricates | 35 | 42.9 | 15.3 | 35 | 49.4 | 23.1 |

**Critical finding:** Less than 50% of stops in connected speech are "complete" (have identifiable release bursts). "One-part" stops (hold only) are very common in connected speech.

### Vowel Duration by Following Context (Table IX)

Long and short vowels preceding particular segments:

| Following segment | LONG vowels N | LONG Dur (ms) | LONG SD | SHORT vowels N | SHORT Dur (ms) | SHORT SD |
|---|---|---|---|---|---|---|
| Stop | 185 | 128 | 53 | 216 | 63 | 27 |
| Voiced | 80 | 141 | 71 | 121 | 65 | 30 |
| Voiceless | 105 | 117 | 30 | 95 | 60 | 22 |
| Fricative | 173 | 118 | 56 | 375 | 69 | 30 |
| Voiced | 94 | 117 | 57 | 210 | 64 | 24 |
| Voiceless | 79 | 120 | 55 | 165 | 75 | 34 |

**Key finding:** Pre-voicing lengthening effect is strong for long (tense) vowels before stops but hardly present for short (lax) vowels before fricatives. The traditional prediction of lengthening before voiced consonants does not hold uniformly for connected speech.

### Gamma Distribution Parameters for Duration Distributions

The two-parameter gamma distribution was fitted to each phonetic category:

f_r(t;r,lambda) = lambda / Gamma(r) * (lambda*t)^(r-1) * e^(-lambda*t)

Where:
- lambda = scale parameter (dimension of reciprocal time/frequency)
- r = shape parameter (dimensionless, affects skewness)
- mu = r/lambda (mean)
- sigma^2 = r/lambda^2 (variance)

**Fitted parameters:**
| Category | r | lambda | Mean (ms) | SD (ms) | N |
|---|---|---|---|---|---|
| All vowels | 3.3 | 0.032 | 102 | 57 | 2037 |
| Long vowels | 5.4 | 0.042 | 128 | 57 | 789 |
| Short vowels | 5.6 | 0.083 | 67 | 30 | 1019 |
| Stops | 3.7 | 0.055 | 68 | 37 | 972 |
| Voiced fricatives | 4.8 | 0.095 | 61 | 24 | 792 |
| Voiceless fricatives | 6.7 | 0.064 | 104 | 38 | 447 |

### Tempo Effects

- FAST-to-SLOW pause time ratio: 0.79
- Duration ratios (FAST/SLOW) by category: 0.82 (sonorants) to 0.85 (stops), vowels at 0.84
- Mean durations of all categories show essentially same percentage change between tempo groups
- SLOW readers 33% slower than average; average SLOW reader 33% slower than average FAST reader
- Increase attributed to: new pauses (54%), increased duration of existing pauses (27%), increased duration of speech segments (19%)

### Breath Group Statistics (Table III)

Mean number of breath groups per reading:
- SLOW: Hunter 32.0, Farm 34.9
- FAST: Hunter 21.6, Farm 28.7

### Speech-Pause Time Ratios (Table V)

Ratio of speech to elapsed time:
- SLOW group mean: ~77.0 (Hunter), ~75.7 (Farm)
- FAST group mean: ~83.3 (Hunter), ~81.7 (Farm)

### Implementation Notes

1. **For duration models:** The gamma distribution provides a good fit for generating natural variation in segment durations. Use r and lambda parameters from the fitted distributions.

2. **Stop consonant modeling:** In connected speech, model stops as frequently incomplete (no release). "One-part" stops (hold-only) are the majority. Mean hold duration ~49-57 ms.

3. **Tempo scaling:** All categories scale by approximately the same percentage when tempo changes. A simple multiplicative factor applied uniformly across categories is a reasonable first approximation.

4. **Pre-voicing lengthening:** Effect is context-dependent and may not apply uniformly in connected speech, particularly for short vowels before fricatives.

5. **Voiceless fricatives** have notably bimodal distributions, suggesting subgroups with different durational characteristics (sibilants vs. non-sibilants likely).

## Collection Cross-References

### Already in Collection

- `Klatt_1976_SegmentalDuration` — Klatt 1976 "Linguistic Uses of Segmental Duration in English" is the foundational predecessor for duration rules that Crystal & House 1982 extends with connected-speech data
- `Crystal_House_1988_StopConsonantDuration` — Crystal & House 1988 is the companion/follow-up paper providing "current results" and focusing on stop consonant duration in connected speech

### Cited By (in Collection)

- `Wightman_1992_SegmentalDurationsProsodic` — Uses Crystal & House 1982 duration statistics and gamma distribution model as baseline for pre-boundary lengthening analysis
- `Crystal_House_1988_StopConsonantDuration` — Self-cites as predecessor providing preliminary connected-speech duration results
- `Abramson_Whalen_2017_VOTat50` — Cites Crystal & House 1982 for understanding how VOT varies in running speech contexts
- `vanSanten_1993_SegmentalDuration` — Cites Crystal & House duration data as comparison baseline
- `vanSanten_1994_SegmentalDurationTTS` — Uses Crystal & House connected-speech duration data
- `Campbell_Isard_1991_SegmentDurationsSyllable` — References Crystal & House duration statistics for syllable-level timing model

### New Leads (Not Yet in Collection)

- Klatt, D. H. (1975). "Vowel lengthening is syntactically determined in a connected discourse," J. Phonet. 3, 129-140. — Directly relevant predecessor on syntactic conditioning of vowel duration
- Umeda, N. (1975). "Vowel duration in American English," J. Acoust. Soc. Am. 58, 434-445. — Vowel duration data used as comparison
- Lehiste, I. (1970). *Suprasegmentals*. MIT Press. — Foundational suprasegmental analysis

### Conceptual Links (not citation-based)

- `Hertz_1992_NucleusBasedTiming` — Both address segmental duration in connected speech; Hertz proposes the acoustic nucleus as a superior unit to individual segments for duration assignment, while Crystal & House provide the segment-level baseline statistics that nucleus models must improve upon
- `Price_1991_ProsodySyntacticDisambiguation` — Both use normalized duration measures; Price et al. use a z-score normalization identical in concept to what Crystal & House's gamma distribution parameters enable
