# Port (1979) — Implementation Notes

## Key Findings for Synthesis

### Closure Duration as a Voicing Cue

The closure interval of post-stress medial stops varies systematically with phonological voicing and place of articulation. Closure duration functions as a cue for the voiced/voiceless distinction, but only relative to speaking tempo.

### Production Data: Closure Durations (from Port 1976)

Mean closure durations for post-stress medial stops in carrier sentences at three speaking tempos (5 speakers, NYC English):

| Stop | Fast Tempo | Normal Tempo | Slow Tempo |
|------|-----------|--------------|------------|
| /b/  | ~45 ms    | ~65 ms       | ~75 ms     |
| /p/  | ~65 ms    | ~85 ms       | ~110 ms    |
| /d/  | ~40 ms    | ~55 ms       | ~65 ms     |
| /t/  | ~55 ms    | ~75 ms       | ~95 ms     |

Note: /d/ and /t/ have characteristically shorter closure durations than /b/ and /p/. Apical stops are generally shorter than labial stops.

### Apical Flap Duration (from Port 1976, fastest tempo)

At fastest speaking tempo, medial /d/ and /t/ flaps (notated /r/) fall between 25-35 ms, though some were shorter than 25 ms. Apical flaps ranged from about 5 ms to about 40 ms. This differs from labial stops: /b/ is rarely shorter than 30 ms.

### Perceptual Boundaries (Experiment Results)

**Voicing boundary (/b/ vs /p/):**
- Slow carrier sentence: boundary at ~75 ms closure duration
- Fast carrier sentence: boundary shifted to ~65 ms (about 10 ms shorter)
- The /b/-/p/ boundary moved nearly 10 ms toward shorter values in fast speech
- Boundary shifts were statistically significant (p < 0.01, Wilcoxon matched-pair signed-ranks)

**Key insight:** The perceptual boundary for voicing must be defined relative to speaking tempo, not as an absolute duration value.

### Tempo Effect Magnitude

- The tempo effect on the voicing boundary is only about 10% of the total duration variation
- Fast carrier sentences averaged about 70% the duration of slow carrier sentences
- The test words were not altered between tempo conditions -- only the carrier sentence changed
- This means listeners used the carrier tempo to calibrate their perception of closure duration

### Place of Articulation and Closure Duration

Examination of spectrograms of *rabid*, *ratted*, and *ragged* showed:
- Formant trajectories for /b/, /d/, /g/ are minimally distinctive during closure
- The main perceptual difference comes from the release burst and formant transitions
- Closure duration alone cannot reliably distinguish place of articulation

However, there is a tendency:
- Labial stop closure durations are not normally shorter than about 30 ms
- Apical flaps can be as short as 5 ms
- Very short closure duration could potentially serve as gestural information for a gesture of apical closure rather than labial closure

### Interaction of Closure Duration with Other Cues

1. **Glottal pulsing during closure:** When all traces of glottal pulsing are removed from the closure interval, listeners hear a phonologically voiced stop if:
   - The closure interval is kept sufficiently short, AND
   - The silent closure interval is lengthened (i.e., the listener perceives it as voiced based on duration alone)

2. **Preceding vowel duration:** The voiced/voiceless distinction is more robustly cued by the ratio of closure duration to preceding vowel duration than by closure duration alone (citing Denes 1955, Port 1976).

3. **Formant transitions:** Formant transitions dominate closure duration as a place-of-articulation cue. Even when closure is long enough to produce the "right" labial stop duration, if formant transitions indicate /d/ or /g/, listeners follow the transitions.

### Implications for Synthesis Duration Rules

1. **Voiced stops have shorter closure** than voiceless stops at all tempos
2. **The voicing ratio is roughly 0.65-0.75** (voiced/voiceless closure ratio)
3. **Tempo scaling is not uniform:** closure duration compresses less than the overall sentence when tempo increases
4. **Apical stops (/d/, /t/) have shorter closure** than labial stops (/b/, /p/) by about 10-15 ms
5. **Minimum closure durations:** labial ~30 ms, apical ~5 ms (flap), velar comparable to labial
6. **Closure duration interacts with preceding vowel duration** -- the ratio matters more than absolute values

### Phonetic Timing as Temporal Proportion

Port argues that phonetic timing information should be understood in terms of a phonetic space where timing parameters are similar to those of the temporal structure of speech production. Key principle: temporal dimensions must be less abstracted from continuous time than segments or digits; they should be proportional ratios rather than absolute intervals, invariant under changes in speaking tempo.

## Relevant Equations/Rules

No formal equations are given. The key quantitative relationships:

- **Voiced/voiceless closure ratio:** ~0.65-0.75 across tempos
- **Perceptual boundary shift with tempo:** ~10 ms between fast and slow conditions
- **Labial vs apical closure difference:** ~10-15 ms (labial longer)
- **Minimum physiological closure:** labial ~30 ms, apical flap ~5 ms
