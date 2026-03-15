# Chistovich & Lublinskaya (1979) - Implementation Notes

## The Center of Gravity Effect in Vowel Spectra and Critical Distance Between the Formants

**Citation:** Chistovich, L.A. & Lublinskaya, A.V. (1979). Hearing Research, 1, 185-195.

## Key Finding: Critical Distance (delta-z_c)

The critical distance between formants at which the "center of gravity" effect disappears:

- **delta-z_c = 3.0-3.5 Bark**

When F1 and F2 are within this critical distance, listeners perceive a single spectral peak at an intermediate frequency (the "center of gravity") rather than two separate formants.

## Hz-to-Bark Conversion Used

The authors used the approximation from Zwicker & Feldtkeller (1967):

```
z(f) = 6.7 * arcsinh((f - 20) / 600)
```

Where z is in Bark and f is in Hz. Reference [18] in the paper (Tjomov 1971) provides the `Arsh` function notation: `z = 6.7 x Arsh((f - 20)/600)`.

## Critical Distance Measurements

Three delta-z_c values obtained for different F2 settings:

| F2 (kHz) | delta-z_c (Bark) |
|-----------|-----------------|
| 0.7       | 3.0             |
| 1.0       | 3.4             |
| 1.3       | 3.2             |

Consistent with Chistovich & Sheikin (in press): 3.3 < delta-z_c < 4.3 for F2 = 1.4 kHz and 3.1 < delta-z_c < 4.0 for F2 = 1.8 kHz.

**Conclusion:** Critical distance is approximately 3.0-3.5 Bark regardless of absolute frequency position.

## Experimental Paradigm

- Two-formant synthetic vowels matched to single-formant stimuli
- Single-formant matching stimulus: F* = (F1 + F2)/2
- Subject controlled A2/A1 ratio to match the two-formant standard to the single-formant variable
- Excitation: 30 microsecond square wave pulses at 100 Hz repetition rate
- Two parallel formant channels with bandpass filters, 30 dB/octave slope
- Stimulus duration: 320 ms, inter-pair interval: 600 ms

## Behavior Below Critical Distance (delta-z < delta-z_c)

When formants are within the critical distance:
- **Continuous monotonic relationship** between A2/A1 and F* (the matching single-formant frequency)
- F* shifts continuously between F1 and F2 as A2/A1 changes
- Vowel quality determined by "center of gravity" of the two-formant cluster
- A single-formant approximation is valid

## Behavior Above Critical Distance (delta-z > delta-z_c)

When formants exceed the critical distance:
- **Discontinuous relationship** between A2/A1 and F*
- F* jumps to either F1 or F2 (whichever formant dominates)
- Formant amplitudes are of minor importance for vowel quality
- Vowel quality determined by formant frequency locations, not their amplitudes

## Formant Detection Threshold

The threshold for detecting a formant peak (A1 level where F1 becomes perceptible):
- Measured using F1* adjusting experiments (Figs. 4-5)
- Clear threshold-like effect: below a certain A1 level, F1* groups around F1
- Additional decrease of A1 causes F1* matches to approach F2
- Threshold range of formant amplitudes for the "two-formant" category: ~45-50 dB wide
- This is slightly wider than the dynamic range for the center-of-gravity effect (~40 dB, from Fig. 2)

## Three Perceptual Categories for Two-Formant Stimuli (delta-z > delta-z_c)

1. **Two-formant category**: Both formants above detection threshold; vowel quality determined by both formant frequencies
2. **Single-formant (F1)**: F* close to F1; second formant below threshold
3. **Single-formant (F2)**: F* close to F2; first formant below threshold

## Implications for Vowel Synthesis

### Back Vowels (F1-F2 close, delta-z < delta-z_c)
- F1 and F2 are perceptually integrated into a single spectral peak
- The single-formant approximation is valid: F* ~ (F1+F2)/2 adjusted by A2/A1
- Best F* for [u] is around 0.3 kHz; for [a] around 1.2 kHz
- Average inter-vowel interval: 1.5-1.6 Bark

### Front Vowels (F1-F2 far, but F2-F3 may be close)
- Distance between F1 and F2 exceeds delta-z_c
- But distance between F2 and F3 (F4) is less than delta-z_c
- For [i], A2 < A3, so F2* must be displaced upward from F2
- Best F2* for [i] is around 2.9-3.2 kHz; for [ae] around 1.4-1.5 kHz
- Average inter-vowel interval: 1.1-1.25 Bark

### Spectral Coding Model
- The auditory system performs positional coding of spectrum shape
- Detects "objects" (maxima, irregularities) on the spectrum contour
- Within delta-z_c, the center of gravity of closely-spaced peaks serves as the coded position
- Formant peak detection is a serial process: peaks extracted, results averaged along frequency scale
- A lateral inhibition model adjusted to fit psychoacoustical data on formant detection (refs [6,18])

## Key Parameters for Synthesizer Implementation

1. **When F2-F1 < 3.5 Bark**: Perceptual quality depends on spectral center of gravity, not individual formant frequencies. A2/A1 ratio shifts perceived quality smoothly.

2. **When F2-F1 > 3.5 Bark**: Each formant is perceived independently. Amplitude ratio has little effect on quality; frequency positions dominate.

3. **Formant peak detection threshold**: ~12.4 dB average difference between first procedure (single-formant match) and second procedure thresholds. Very small spectral irregularities are sufficient for peak detection.

4. **For back vowels [u, o, a]**: Can be approximated by single-formant stimuli because F1-F2 distance is within critical range.

5. **For front vowels [i, e, ae]**: F2-F3 integration applies; F2* must be computed accounting for F3 proximity.

## Collection Cross-References

### Already in Collection
- `Delattre_1952_AcousticDeterminantsVowelColor` — One- and two-formant vowel perception experiments directly relevant to the center-of-gravity concept
- `Carlson_1975_RuleBasedTTS` — Carlson, Fant & Granstrom work on rule-based synthesis; Carlson & Fant also authored two-formant perception studies cited here
- `Carlson_1979_VowelPerceptionSalience` — Vowel perception salience, related to the perceptual integration phenomena studied here
- `Fant_1960_AcousticTheorySpeechProduction` — Fant's acoustic theory provides the formant framework this paper extends perceptually

### New Leads
- Bedrov, Chistovich & Sheikin (1976) — Frequency location of center of gravity as useful vowel perception parameter
- Plomp (1975) — Auditory analysis and timbre perception
- Zwicker & Feldtkeller (1967) — Hz-to-Bark conversion used in this paper

### Supersedes or Recontextualizes
- None

### Cited By (in Collection)
- No direct citations found in existing collection notes

### Conceptual Links (not citation-based)
- `Peterson_Barney_1952_VowelControl` — Canonical vowel formant data; the center-of-gravity effect explains why some P&B vowels with similar F1-F2 patterns are perceptually distinct
- `Hillenbrand_1995_VowelAcoustics` — Updated vowel acoustics; the 3.5-Bark critical distance applies to interpreting formant proximity in these measurements
- `Kent_Vorperian_2018_VowelFormantBandwidths` — Formant bandwidths affect the spectral prominence of individual formants, interacting with center-of-gravity integration
- `Stevens_1989_QuantalNatureSpeech` — Quantal theory's regions of stability relate to the critical distance boundaries for perceptual integration
- `Flanagan_1957_MaximumPrecisionQuantizingVowel` — Perceptual precision bounds for formant frequencies relate to the critical distance for formant integration
