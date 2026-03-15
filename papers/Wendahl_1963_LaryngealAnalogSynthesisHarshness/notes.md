# Wendahl 1963 — Laryngeal Analog Synthesis of Harsh Voice Quality

## Implementation-Relevant Notes

### Core Finding: Jitter Perception Thresholds

Cycle-to-cycle frequency perturbation (jitter) is the primary acoustic correlate of perceived harshness/roughness. Key quantitative results:

- Even **1 Hz jitter** around a 100 Hz median F0 is perceived as rough (scale value 1.207 vs 0.585 for steady-state)
- Roughness perception scales **monotonically** with jitter magnitude for a given median F0
- Jitter perception is **F0-dependent**: same absolute jitter (in Hz) at 100 Hz median sounds rougher than at 200 Hz median

### Jitter Stimuli Parameters (Table I)

Eight-cycle repeating pattern with one cycle per frequency. The frequency sequence for each stimulus:

| Stimulus | Median F0 (Hz) | Max deviation (Hz) | F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8 |
|----------|----------------|-------------------|-----|-----|-----|-----|-----|-----|-----|-----|
| 1 | 100 | 10 | 110 | 100 | 90 | 103 | 110 | 97 | 90 | 100 |
| 2 | 100 | 8 | 108 | 100 | 92 | 103 | 108 | 97 | 92 | 100 |
| 3 | 100 | 6 | 106 | 100 | 94 | 103 | 106 | 97 | 94 | 100 |
| 4 | 100 | 4 | 104 | 100 | 96 | 101 | 104 | 97 | 96 | 100 |
| 5 | 100 | 2 | 102 | 100 | 98 | 101 | 102 | 99 | 98 | 100 |
| 6 | 100 | 1 | 101 | 100 | 99 | 100 | 101 | 100 | 99 | 100 |
| 7 | 100 | 0 | 100 | 100 | 100 | 100 | 100 | 100 | 100 | 100 |
| 8 | 200 | 10 | 210 | 200 | 190 | 203 | 210 | 197 | 190 | 200 |
| 9 | 200 | 8 | 208 | 200 | 192 | 203 | 208 | 197 | 192 | 200 |
| 10 | 200 | 6 | 206 | 200 | 194 | 203 | 206 | 197 | 194 | 200 |
| 11 | 200 | 4 | 204 | 200 | 196 | 201 | 204 | 197 | 196 | 200 |
| 12 | 200 | 2 | 202 | 200 | 198 | 201 | 202 | 199 | 198 | 200 |
| 13 | 200 | 1 | 201 | 200 | 199 | 200 | 201 | 200 | 199 | 200 |
| 14 | 200 | 0 | 200 | 200 | 200 | 200 | 200 | 200 | 200 | 200 |

### Roughness Scale Values (Thurstone paired-comparisons, Table II)

Rank-ordered from most to least rough:

| Rank | Stimulus | Median F0 | Deviation | Scale Value |
|------|----------|-----------|-----------|-------------|
| 1 | 1 | 100 Hz | +/-10 | 2.371 |
| 2 | 2 | 100 Hz | +/-8 | 2.334 |
| 3 | 4 | 100 Hz | +/-4 | 2.177 |
| 4 | 3 | 100 Hz | +/-6 | 2.039 |
| 5 | 5 | 100 Hz | +/-2 | 1.577 |
| 6 | 8 | 200 Hz | +/-10 | 1.534 |
| 7 | 9 | 200 Hz | +/-8 | 1.514 |
| 8 | 10 | 200 Hz | +/-6 | 1.240 |
| 9 | 6 | 100 Hz | +/-1 | 1.207 |
| 10 | 11 | 200 Hz | +/-4 | 0.896 |
| 11 | 7 | 100 Hz | +/-0 | 0.585 |
| 12 | 12 | 200 Hz | +/-2 | 0.524 |
| 13 | 13 | 200 Hz | +/-1 | 0.367 |
| 14 | 14 | 200 Hz | +/-0 | 0.000 |

### Key Observations for Synthesizer Implementation

1. **Jitter as percentage matters more than absolute Hz**: 10 Hz jitter at 100 Hz (10%) produces more roughness than 10 Hz at 200 Hz (5%). The 200 Hz +/-10 Hz stimulus (rank 6) was judged less rough than the 100 Hz +/-2 Hz stimulus (rank 5). This means jitter should be specified as a percentage of F0, not absolute Hz.

2. **Jitter pattern structure**: The 8-cycle repeating pattern is not purely random — it follows a specific sequence (high, median, low, near-median, high, near-median, low, median). This is a quasi-random pattern with controlled extremes.

3. **No vowel filtering used**: Stimuli were sawtooth waves without vocal tract filtering. The harshness percept arises purely from the source signal's aperiodicity.

4. **Waveform type**: Sawtooth (slightly non-linear) from a unijunction transistor relaxation oscillator — spectrally similar to the glottal pulse train.

5. **F0 interaction**: For equal absolute jitter, lower F0 sounds rougher. This has implications for male vs. female voice synthesis — male voices will sound harsher for the same jitter parameters if specified in absolute Hz.

6. **Threshold**: Even +/-1% jitter (1 Hz at 100 Hz) is perceptible as rough vs. steady-state, though the effect is small (scale value 1.207 vs 0.585).

### LADIC System Description

- Master oscillator: unijunction transistor relaxation circuit producing sawtooth + sync pulse
- Frequency range: 50-1000 Hz
- Memory: 8 frequency banks, cycling continuously
- One cycle per frequency before switching (cycle-to-cycle control)
- Frequency switching: ~500 nanosecond transistor gates (effectively instantaneous)
- Counter capacity: up to 2047 cycles per frequency
- Amplitude independently controllable per cycle (shimmer capability, not used in this experiment)

### Experimental Method

- 536 listeners (undergraduate students)
- Paired-comparisons design: all 14 stimuli paired with all others (91 test pairs)
- Stimulus duration: 1 second
- Inter-stimulus interval: 500 ms
- Intra-stimulus interval: 3 seconds
- Thurstone scaling for analysis
- SPL: ~75 dB at back of room

## Collection Cross-References

### Already in Collection

(No papers directly cited by Wendahl 1963 are in the collection. The references are all unpublished dissertations and conference presentations from 1957-1962.)

### Cited By (in Collection)
- [[Childers_Lee_1991_VoiceQualityFactors]] — cites Wendahl 1963 and 1966 for laryngeal analog synthesis of harsh voice quality and jitter/shimmer parameters of harshness
- [[Hammarberg_1980_PerceptualAcousticCorrelatesVoice]] — cites Wendahl 1963/1966 for laryngeal analog synthesis of voice quality, directly relevant to spectral correlates of roughness

### New Leads (Not Yet in Collection)
- Wendahl, R. W. (1966). Laryngeal analog synthesis of jitter and shimmer auditory parameters of harshness. *Folia Phoniatrica*, 18(2), 98-108. -- Follow-up study adding shimmer dimension and testing jitter-shimmer interaction
- Coleman, R. F. (1960). Some acoustic correlates of hoarseness. Unpublished master's thesis, Vanderbilt University. -- Early measurement of cycle-to-cycle variation in pathological voices
- Moore, G. P. (1962). The physiology of hoarseness. ASHA paper. -- Vocal fold behavior underlying harsh quality

### Supersedes or Recontextualizes
- (none)

### Conceptual Links (not citation-based)
- [[Titze_1991_NeurologicAperiodicity]] -- **Strong.** Wendahl demonstrates that jitter is the primary perceptual correlate of harshness and that roughness perception is F0-dependent. Titze provides the physiological model explaining where that jitter comes from (motor unit firing stochasticity). Wendahl establishes the perceptual side; Titze establishes the production mechanism.
- [[Fraj_2011_BreathyRoughVoices]] -- **Strong.** Fraj provides a modern synthesis implementation of jitter via sample-by-sample phase perturbation with quantitative parameter-to-jitter% mapping. Wendahl established the foundational finding that jitter produces harshness; Fraj provides the synthesis algorithm for implementing it.
- [[Herzel_1994_VocalDisordersNonlinearDynamics]] -- **Moderate.** Herzel shows that some "rough" voice qualities arise from deterministic nonlinear phenomena (period-doubling, chaos) rather than stochastic jitter. This complicates Wendahl's implicit assumption that cycle-to-cycle frequency perturbation is random — structured perturbation patterns produce perceptually different results.
- [[Steinecke_1995_BifurcationsVocalFold]] -- **Moderate.** Steinecke models how left-right vocal fold asymmetry produces bifurcations including period-doubling, which creates perceived roughness through a mechanism entirely different from the stochastic jitter Wendahl synthesized.
- [[Kreiman_Gerratt_2010_PerceptualVoiceQualityAssessment]] -- **Moderate.** Kreiman & Gerratt critique the perceptual validity of jitter/shimmer as voice quality measures, noting that listeners are relatively insensitive to jitter changes in sustained vowels. This challenges the magnitude of Wendahl's finding while validating his synthesis-based measurement approach.
