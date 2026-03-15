# Segment Durations in a Syllable Frame

**Authors:** W. N. Campbell and S. D. Isard
**Year:** 1991
**Venue:** Journal of Phonetics, Vol. 19, pp. 37-47
**DOI:** 10.1016/S0095-4470(19)30315-8
**Affiliation:** Edinburgh University, Centre for Speech Technology Research

## One-Sentence Summary
Presents a two-level duration model where syllable duration is predicted first (via neural net), then individual segment durations are accommodated to the syllable frame using a measure of segment elasticity (z-score normalization).

## Problem Addressed
Traditional duration models (e.g., Klatt 1976) operate purely at the segment level, applying multiplicative factors to inherent durations. This fails to capture higher-level rhythmic constraints at the syllable, foot, and phrase levels. Campbell & Isard propose that timing operates hierarchically: syllable duration is determined first by prosodic factors, then segment durations adjust to fit within the syllable frame.

## Key Contributions
- **Elasticity hypothesis**: All segments in a syllable can be lengthened/shortened by a constant factor k (in standard deviations), providing a uniform compression/expansion mechanism
- **z-score normalization** (Equation 1): Segment durations are normalized relative to their type-specific mean and standard deviation, allowing comparison of compression/expansion across different segment types
- **Two-level TTS timing model**: Syllable duration predicted by neural net, segment durations accommodated via elasticity
- **Empirical validation** on 200 phonetically balanced sentences from the SCRIBE database (RP English, adult male speaker)
- **Differential lengthening findings**: Pre-pausal syllables show greater lengthening in the rhyme than the onset; sentence-internal syllables compress more uniformly

## Methodology
1. 200 phonetically balanced sentences recorded and narrow-phonetically transcribed
2. Segments tagged as onset, peak (vowel/syllabic), coda, or medial within syllables
3. z-scores computed per segment type (Equation 1)
4. Syllables classified as long (mean z > +1), short (mean z < -1), or intermediate
5. Experiments testing whether z-scores are constant across syllable positions
6. Additional experiments on final lengthening and phonetically-motivated lengthening (pre-voicing)

## Key Equations

### Equation 1: z-score normalization
$$
z_{token} = \frac{\text{observed duration}_{token} - \mu_{type}}{\sigma_{type}}
$$

Where:
- $z_{token}$ = normalized duration of a specific token
- $\mu_{type}$ = mean duration of that segment type across the database
- $\sigma_{type}$ = standard deviation of that segment type

**Interpretation**: Positive z = lengthened relative to mean; negative z = shortened. A segment with high variance (like a tense vowel) will change more in absolute ms for the same z-value change than a segment with low variance (like a stop).

### Equation 2: Syllable-to-segment accommodation
$$
\Delta = \sum_{i=1}^{n} \exp(\mu_i + k\sigma_i)
$$

Where:
- $\Delta$ = total syllable duration
- $n$ = number of segments in the syllable
- $\mu_i$ = mean of log-transformed durations for segment type i
- $\sigma_i$ = standard deviation of log-transformed durations for segment type i
- $k$ = constant compression/expansion factor (solved numerically)

**Note**: Durations are log-transformed before z-score computation to reduce positive skew. The equation is solved for k given the target syllable duration $\Delta$.

### Final syllable modification
For final syllables, the ith segment is assigned duration:
$$
\exp(\mu_i + 0.75^{(n-i)} k \sigma_i)
$$

Where $(n-i)$ causes segments later in the syllable (closer to the end) to be lengthened more than those earlier, approximating the empirical finding that final-lengthening affects the rhyme more than the onset.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Segment z-score | z | SD units | 0 | ~[-3, +3] | 0.998 probability within +/-3 |
| Long syllable mean z | - | SD | 1.4 | SD 1.07 | n=439 |
| Short syllable mean z | - | SD | -1.2 | SD 0.54 | n=344 |
| Intermediate syllable mean z | - | SD | -0.05 | SD 0.89 | - |
| Compression factor k | k | SD | - | varies | Solved per syllable from Eq. 2 |
| Final lengthening exponent base | - | - | 0.75 | - | Empirical approximation |

## Implementation Details

### Syllable Duration Model (Section 6.1)
- Three-layer neural network (backpropagation)
- Trained on log-transformed syllable durations from the corpus
- Input: 6-tuple of features:
  1. Number of phonemes in broad transcription
  2. Nature of syllabic peak (tense/lax vowel, diphthong, sonorant consonant)
  3. Position of syllable in the foot
  4. Position of syllable in the phrase and clause
  5. Stress assigned to the syllable + pitch movement nature
  6. Function/content role of parent word
- Output: syllable duration in log milliseconds

### Segment Accommodation (Section 6.2)
1. Log-transform all durations
2. For non-final syllables: solve Equation 2 for k, apply uniformly
3. For final syllables: apply the 0.75^(n-i) weighting so segments near the end lengthen more
4. Differential vocalic lengthening before voiced stops: modeled by adjusting the computed k value

### Syllabification Rules (Section 2.2.1)
- Monosyllables: segments tagged as onset, peak, or coda
- Polysyllables: medial consonants tagged as potentially ambisyllabic
- Single medial consonant: preceded by syllable boundary, functions as onset
- Two medial consonants: first is coda, second is onset
- Three+ medial consonants: boundary between second and third
- Vowels and syllabic consonants = peak
- All consonants before first vowel after word boundary = onset
- All consonants after last vowel before word boundary = coda

## Data

### Table I: z-values for three syllable groups

| Position | Long (mean) | Long (SD) | Short (mean) | Short (SD) | Intermediate (mean) | Intermediate (SD) |
|----------|-------------|-----------|--------------|------------|---------------------|-------------------|
| Onset | 1.56 | 0.93 | -1.22 | 0.56 | -0.05 | 0.89 |
| Peak | 1.47 | 1.16 | -1.22 | 0.51 | -0.09 | 0.79 |
| Coda | 1.03 | 1.08 | -1.12 | 0.38 | -0.14 | 0.83 |
| Medial | 1.48 | 0.92 | -1.26 | 0.55 | -0.08 | 0.88 |

### Table II: Segments in different sentence-final unit sizes

| Unit | Mean z | SD | n |
|------|--------|----|---|
| Words | 90.60 | 0.82 | 1154 |
| Syllables | 91.23 | 1.32 | 770 |
| Segments | - | 1.44 | 200 |
| Vowels | - | 1.63 | 49 |

### Table III: Segments by position in final syllables

| Position | Mean z | SD | n |
|----------|--------|----|---|
| Onset | 0.33 | 0.97 | 232 |
| Peak | 1.09 | 1.25 | 245 |
| Coda | 1.14 | 1.21 | 242 |

### Table IV: Vowels before voiced vs. unvoiced stops

| Context | Unvoiced (mean) | Unvoiced (SD) | Voiced (mean) | Voiced (SD) | t | p |
|---------|----------------|---------------|--------------|-------------|---|---|
| All syllables | -0.022 | 0.89 | 0.227 | 0.98 | 3.09 | <0.01 |
| Sent-internal | -0.105 | 0.83 | 0.125 | 0.84 | 3.05 | <0.01 |
| Sent-final | 0.959 | 1.04 | 1.714 | 1.53 | 1.87 | n.s. |
| Long syllables | 0.703 | 0.65 | 0.844 | 0.84 | 1.59 | n.s. |
| Short syllables | -0.667 | 0.48 | -0.564 | 0.39 | 1.78 | n.s. |

### Table V: Vowels before voiced vs. unvoiced fricatives

| Context | Unvoiced (mean) | Voiced (mean) | t | p |
|---------|----------------|---------------|---|---|
| All syllables | 0.132 | 0.248 | 1.44 | n.s. |

## Figures of Interest
- No figures in this paper (tables only)

## Results Summary
1. **Short syllables**: Compression is uniform across onset, peak, and coda (elasticity hypothesis holds well)
2. **Long syllables**: Onset and coda consonants differ significantly -- coda consonants show less lengthening than onset segments, especially in sentence-final position
3. **Final lengthening**: Confined to the rhyme (peak + coda), not the onset. The rhyme vs. onset difference is significant (t=7.08, p<0.001)
4. **Pre-voicing lengthening**: Vowels before voiced stops are significantly longer than before voiceless stops in sentence-internal syllables (z difference ~0.25 SD), but this effect is a property of the syllable, not just the segment (no additional effect across word boundaries)
5. **Pre-voicing with fricatives**: Not significant (Table V), suggesting the voicing effect on vowel duration may interact with manner of articulation

## Limitations
- Database is from a single RP English speaker -- generalization to other speakers/dialects uncertain
- The 0.75 final-lengthening exponent is an empirical approximation, not theoretically derived
- No explicit treatment of pause durations
- Syllabification rules are heuristic (especially for medial consonant clusters)
- The neural net syllable duration model details are minimal (no architecture specifics, training procedure, or accuracy numbers in this paper)
- Phonetically-motivated lengthening (pre-voicing) cannot be fully captured by the strong elasticity hypothesis alone

## Testable Properties
- **Uniform compression**: In short, sentence-internal syllables, z-scores should be approximately constant across onset, peak, and coda positions (within ~0.15 SD)
- **Final lengthening asymmetry**: Peak and coda z-scores in final syllables should be significantly higher than onset z-scores (by ~0.7-0.8 SD)
- **Pre-voicing effect size**: Vowels before voiced stops should be ~0.25 SD longer than before voiceless stops in sentence-internal syllables
- **Log-normal distribution**: Raw segment durations should be approximately log-normally distributed (positive skew in raw, near-normal after log transform)
- **Elasticity range**: z-scores should fall within [-3, +3] with 0.998 probability
- **Syllable-level prediction**: Solving Eq. 2 for k and applying uniformly should reconstruct segment durations within the syllable to reasonable accuracy for non-final syllables

## Relevance to Project
This paper provides the theoretical framework for Qlatt's duration model. Rather than applying Klatt (1976) style multiplicative segment-level rules alone, the system should:
1. Predict syllable duration from prosodic features (stress, position, phrase structure)
2. Accommodate individual segment durations within the syllable using the elasticity mechanism
3. Apply the 0.75^(n-i) weighting for final syllables to get the rhyme-heavy final lengthening effect
4. Model pre-voicing lengthening as an additional adjustment within the syllable frame

This directly complements van Santen (1993) sums-of-products models and Klatt (1976) segment-level rules by adding a higher-level syllable timing layer.

## Open Questions
- [ ] How does the neural net syllable duration model compare to the rule-based approach in Campbell (1990a)?
- [ ] Can the 0.75 final-lengthening exponent be derived from the data rather than set empirically?
- [ ] How should the model handle cross-word resyllabification?
- [ ] What is the interaction between this model and foot-level timing (isochrony)?
- [ ] How to integrate with Qlatt's existing Klatt (1976) duration rules?

## Related Work Worth Reading
- Campbell (1990a) - Implementation of Klatt rules for syllable duration, accounting for 70% of variance
- Campbell (1990b) - Syllable-based model with minimal segment sensitivity
- Bartkova & Sorin (1987) - Timing rules for French speech synthesis
- Klatt (1974) - Duration of [S] in English words
- Klatt (1979) - Synthesis by rule of segmental durations
- Umeda (1988a) - Vowel duration in American English
- Umeda (1988b) - Consonant duration in American English
- Crystal & House (1988) - Segmental durations in connected speech
- Edwards & Beckman (1988) - Articulatory timing and prosodic interpretation of syllable duration

## Collection Cross-References

### Already in Collection
- [[Crystal_House_1988_StopConsonantDuration]] - cited for segmental durations in connected speech
- [[Klatt_1976_SegmentalDuration]] - cited as the foundational segment-level duration rules that this syllable-level model complements
- **vanSanten_1993_SegmentalDuration** - related work on sums-of-products duration models (not cited but directly comparable)
- **vanSanten_1997_ProsodicModeling** - related work on prosodic modeling obstacles (not cited but addresses same problems)

### New Leads (Not Yet in Collection)
- Campbell (1990a) - "Measuring speech-rate in the Spoken English Corpus" - syllable-based Klatt rule implementation
- Campbell (1990b) - "Analog I/O nets for syllable timing" - neural net syllable duration model details
- Edwards & Beckman (1988) - "Articulatory timing and prosodic interpretation of syllable duration" - articulatory basis for syllable timing
- Peterson & Lehiste (1960) - "Duration of syllable nuclei in English" - classic vowel nucleus duration data
### Now in Collection
- **Bartkova & Sorin (1987)** — [[Bartkova_1987_ModelSegmentalDurationFrench]] — French duration rules for cross-language comparison

### Cited By (in Collection)
- [[Beckman_2005_ToBISystemEvolution]] — cites this paper for segment duration modeling
- [[DeTournemire_1998_ProsodicAlphabetTranscription]] — applies the same syllable elasticity factor k model to French
- [[vanSanten_1997_ProsodicModeling]] — discusses Campbell & Isard's hierarchical syllable-to-segment decomposition as an alternative to pure segment-level multiplication

### Conceptual Links (not citation-based)
- [[Hertz_1991_StreamsPhonesTransitions]] — Hertz's nucleus stream and the observation that lengthening affects the entire sonorant sequence (vowel + /l/, /r/, /n/) solve the same problem as Campbell & Isard's syllable-level rhyme lengthening. Hertz provides a representational solution (nucleus stream); Campbell & Isard provide a computational one (z-score elasticity with exponential weighting). Both reject purely segment-level duration models.
- [[White_2014_ProsodicTimingFunction]] — reinterprets polysyllabic shortening as attenuated lengthening, complementing Campbell & Isard's elasticity hypothesis; both papers model duration variation as modulation of an underlying timing framework rather than independent segment-level rules. (Moderate)

### Supersedes or Recontextualizes
- Provides a higher-level framework that sits above [[Klatt_1976_SegmentalDuration]] -- Klatt's segment-level rules predict inherent durations and contextual modifications, while Campbell & Isard add a syllable-level timing layer that accommodates segments within a prosodically-determined syllable duration. The two are complementary rather than competing.
