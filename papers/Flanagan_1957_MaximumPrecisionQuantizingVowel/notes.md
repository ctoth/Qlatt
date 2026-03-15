# Flanagan 1957 — Estimates of the Maximum Precision Necessary in Quantizing Certain "Dimensions" of Vowel Sounds

## Key Contribution

Uses psychoacoustic difference limen (DL) data to estimate the minimum quantization step sizes (and thus maximum number of quantization levels / bits) needed to digitally encode the perceptually-relevant dimensions of vowel sounds: formant frequencies, formant amplitudes, and fundamental frequency.

## Core Argument

- Speech perception is closer to **absolute** judgment than **differential** discrimination.
- Differential DLs measured on quasi-steady-state stimuli therefore represent **upper bounds** (maximum precision) on what is perceptually necessary.
- Actual requirements for connected speech are likely lower.

## Difference Limens (DLs) for Vowel Dimensions

From Flanagan's own psychoacoustic experiments on synthetic vowels at conversational levels:

| Parameter | DL |
|---|---|
| Formant frequency (F1, F2) | ~3% of formant frequency |
| Fundamental frequency (F0) | ~0.5-1.0% (at ~120 Hz) |
| Second formant amplitude | ~3 dB (~40% of amplitude) |
| Over-all vowel amplitude | ~1 dB (~12% of amplitude) |

The over-all amplitude DL (~1 dB) is used as a crude estimate for the F1 amplitude DL, since most vowel energy is in F1.

## Formant and F0 Ranges (Adult Male Voices)

From Peterson & Barney (1952) and Fairbanks (1940):

| Parameter | Frequency Range | Amplitude Range |
|---|---|---|
| F1 | 250-800 Hz | 5 dB |
| F2 | 800-2300 Hz | 20 dB |
| F3 | 1700-3000 Hz | 20 dB |
| F0 | 80-160 Hz (one octave) | -- |

## Quantization Step Sizes

Derived from DLs applied to the ranges above:

| Parameter | Frequency Step | Amplitude Step |
|---|---|---|
| F1 | ~20 Hz | ~1 dB |
| F2 | ~50 Hz | ~3 dB |
| F3 | ~75 Hz | ~5 dB |
| F0 | ~1 Hz | -- |

## Table I: Maximum Quantization Levels and Bits

| Parameter | Freq Step (Hz) | Freq Levels | Freq Bits | Amp Step (dB) | Amp Levels | Amp Bits |
|---|---|---|---|---|---|---|
| F1 | 40 | 14 | 3.8 | 2 | 3 | 1.6 |
| F2 | 100 | 14 | 3.8 | 6 | 3 | 1.6 |
| F3 | 150 | 9 | 3.2 | 10 | 2 | 1.0 |
| F0 | 2 | 40 | 5.3 | -- | -- | -- |

Note: The "Size of levels" column in Table I uses full step sizes (twice the DL), e.g., F1 step = 40 Hz = 2 x 20 Hz.

## Total Information Content

- **Frequency-only (F1+F2+F3+F0):** ~16 bits per vowel frame
- **With formant amplitudes:** ~20 bits per vowel frame (adds ~4 bits)
- If formant-amplitude relations implicit in formant frequencies are exploited, amplitude data is redundant for vowels (but not for consonants).

## Table II: Information Rates (at 20 samples/sec)

| Parameter | Freq (bits/sec) | Amp (bits/sec) |
|---|---|---|
| F1 | 76 | 32 |
| F2 | 76 | 32 |
| F3 | 64 | 20 |
| F0 | 106 | -- |

- **Formant frequencies total:** ~200 bits/sec
- **All frequency params (F1-F3 + F0):** ~300 bits/sec
- **With amplitude data:** ~400 bits/sec total

This agrees with independent estimates from bandwidth and SNR considerations (Flanagan 1956).

## Temporal Resolution

- Vowel steady states persist ~0.25 sec
- Formant transitions between consonants and vowels can be as short as 50 ms (sometimes shorter)
- To resolve transitions: sample parameters at least 20-30 times per second

## Implementation Relevance for Klatt Synthesizer

1. **Parameter quantization guidance:** The DL values provide principled minimum step sizes for parameter scheduling. A Klatt synthesizer need not specify formant frequencies more precisely than ~3% or F0 more precisely than ~1%.

2. **Frame rate justification:** The 20-30 Hz update rate recommendation aligns with the ~5 ms frame rate used in Klatt 1980 (which is more than sufficient).

3. **Formant amplitude redundancy:** For vowels, formant amplitudes are uniquely determined by formant frequencies (Flanagan 1957, ref 4). This supports Klatt's cascade synthesizer design where formant amplitudes are implicit in the formant frequency settings.

4. **Perceptual precision bounds for diagnostics:** The DL values can serve as thresholds in diagnostic checks — if a parameter error is below the DL, it is perceptually irrelevant.

## References Cited

1. Dunn (1950) — JASA 22, 740-753
2. Fant (1952) — "Transmission properties of the vocal tract," MIT Tech Report No. 12
3. Peterson & Barney (1952) — JASA 24, 175-184
4. Flanagan (1957) — JASA 29, 306-310 (formant amplitude relations)
5. Flanagan & House (1956) — JASA 28, 1099-1106
6. Howard (1956) — JASA 28, 1091-1098
7. Pollack (1952) — JASA 24, 745-749 (absolute discrimination, frequency)
8. Pollack & Ficks (1954) — JASA 26, 155-158 (absolute discrimination, amplitude)
9. Flanagan (1955) — JASA 27, 613-617 (formant frequency DL)
10. Flanagan & Saslow (1956) — MIT Quarterly Reports (F0 DL)
11. Flanagan (1956) — MIT Quarterly Report (formant amplitude DL)
12. Flanagan (1955) — JASA 27, 1223-1225 (over-all vowel amplitude DL)
13. Fairbanks (1940) — JASA 11, 457-466 (F0 range)
14. Flanagan (1956) — JASA 28, 592-596 (bandwidth/SNR estimates)
