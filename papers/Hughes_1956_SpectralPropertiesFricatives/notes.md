---
title: "Hughes & Halle 1956 — Spectral Properties of Fricative Consonants"
year: 1956
---

# Hughes & Halle 1956 — Spectral Properties of Fricative Consonants

## Key Findings for Synthesis

### Fricative Classification by Place of Articulation

Three classes based on spectral energy distribution, corresponding to three points of articulation:

1. **Labial** [f]/[v] — point of articulation at teeth/lips, very short front cavity
2. **Alveolar** [s]/[z] — peaks at higher frequencies than palatals
3. **Palatal** [sh]/[zh] — peaks in intermediate frequency region (2-4 kc)

### Spectral Peak Frequencies (by place)

- **[s]/[z]**: Spectral peaks consistently at higher frequencies than [sh]/[zh] for any single speaker
- **[sh]/[zh]**: Peaks in the 2-4 kc region
- **[f]/[v]**: Very short effective cavity length; sometimes no observable peak below 10 kc (e.g., "huff"); when peaks exist, they can be very high (~8 kc, e.g., "fussy"). Low-frequency peaks in [f]/[v] spectra are due to factors other than front-cavity resonance.

### Voiced vs. Unvoiced Distinction

- Voiced fricatives [v], [z], [zh] often show a strong spectral component below 700 Hz (voicing bar)
- This voicing component is NOT always present — some tokens of voiced fricatives lack it
- Above 1000 Hz, voiced and unvoiced fricative spectra do not differ appreciably
- The voiced/unvoiced distinction is NOT necessarily made on the basis of the low-frequency component alone

### Three-Measurement Identification Procedure (Fig. 11)

#### Measurement 1: High-frequency energy ratio
- `E(4200-10000 Hz) - E(720-10000 Hz)` (energy in dB)
- If difference < 2 dB: sound is [f] or [s] (energy concentrated above 4 kc)
- If difference > 2 dB: sound is [sh] (energy NOT concentrated above 4 kc)
- Accuracy: 86% (107/125) on [s] vs [sh] separation
- Note: Speaker E's [s] was shifted down ~1 octave, causing 16 of 18 errors

#### Measurement 2: Low-frequency contribution (for sounds with peaks > 4 kc)
- `E(720-6500 Hz) - E(720-2150 Hz)` (energy in dB)
- If difference < 5 dB: sound is [f] (energy spread flat, low frequencies ~equal to full band)
- If difference > 10 dB: sound is [s] (energy concentrated in upper part of band)
- Limited to 6500 Hz to avoid effects of very high [f] peaks
- Accuracy: 93% (82/88)

#### Measurement 3: Peak prominence (for sounds with peaks < 4 kc, i.e., [sh] vs [f])
- Locate peak in 1500-4000 Hz region
- `E(500 Hz band centered at peak) - E(720-1370 Hz)` (energy in dB)
- If difference > 5 dB: sound is [sh] (prominent mid-frequency peak)
- If difference < +2 dB: sound is [f] (no prominent peak)
- Accuracy: 90% (76/84)

### Perceptual Test Results

- 10 listeners presented with 50-ms gated fricative segments (200 samples total)
- 68% correct identification (chance = 33%)
- 65% correct on first presentation, 71% on second (small learning effect)
- Listener errors correlated with the same cases where objective criteria failed
- Speaker E's [s] was often heard as [sh] by listeners (matching objective criteria failure)

### Effective Cavity Length Model

The spectral peak frequency is inversely related to the length of the vocal tract portion from constriction to lips:
- Shorter cavity (labials) = higher peak frequency
- Longer cavity (palatals) = lower peak frequency
- Individual speaker differences in cavity length explain cross-speaker overlaps

## Measurement Parameters

- Gate length for all fricative measurements: **50 ms**
- Analysis bandwidth: **150 Hz** (Hewlett-Packard wave analyzer)
- Frequency range: **300 Hz to 10,000 Hz**
- Spectra normalized: highest peak = 0 dB
- Gate position reproducibility: +/- 2-3 ms
- System frequency response: flat within +/- 2 dB from 300-10000 Hz

## Implementation Notes for Klatt Synthesizer

### AF (Frication Amplitude) Spectral Shaping

The three-measurement procedure suggests that for synthesis:
- **[s]/[z]**: Concentrate frication energy above 4 kc; minimal low-frequency energy
- **[sh]/[zh]**: Prominent peak in 2-4 kc region; energy distributed across spectrum
- **[f]/[v]**: Flat or diffuse spectrum; energy spread broadly; sometimes very high peak (~8 kc)

### Voicing Bar Parameters

- When present, strong component below 700 Hz
- Not always present even for "voiced" fricatives — duration and context dependent
- Above 1 kc, voiced/unvoiced spectra are equivalent

### Key Frequency Boundaries for Fricative Rules

| Boundary | Significance |
|----------|-------------|
| 700 Hz | Upper limit of voicing bar |
| 1000 Hz | Above this, voiced = unvoiced spectrally |
| 2000 Hz | Below: [f] identifications drop sharply |
| 2150 Hz | Measurement 2 low-band cutoff |
| 4000-4200 Hz | Division between [sh] (below) and [s]/[f] (above) |
| 6500 Hz | Measurement 2 upper cutoff (excludes [f] HF peaks) |

## Speakers

- Speaker E: male (spectra shifted ~1 octave lower than others for [s])
- Speaker H: male (most consistent voicing component)
- Speaker T: female ([f] spectra had very strong high-frequency component)
- 2 additional speakers used for measurement validation (not shown in figures)

## Collection Cross-References

### Already in Collection

- `Fant_1960_AcousticTheorySpeechProduction` — Jakobson, Fant & Halle 1952 *Preliminaries to Speech Analysis* is cited; Fant 1960 provides the acoustic theory framework for understanding fricative spectra

### Cited By (in Collection)

- `Heinz_1961_PropertiesVoicelessFricatives` — Heinz & Stevens 1961 directly analyze and model the fricative spectra measured by Hughes & Halle 1956
- `Jongman_2000_FricativeAcoustics` — Cites Hughes & Halle 1956 as foundational fricative spectral analysis
- `Jongman_1989_FricativeDuration` — References Hughes & Halle for fricative spectral properties
- `Behrens_Blumstein_1988_FricativeAmplitude` — Builds on Hughes & Halle's spectral classification of fricatives
- `Shadle_1985_FricativeAcoustics` — Cites Hughes & Halle as predecessor work on fricative acoustics
- `Shadle_2023_FricativeSpectraHighFreq` — References Hughes & Halle for historical fricative spectral measurements
- `Monson_2014_HighFrequencyVoice` — Cites Hughes & Halle for high-frequency spectral data

### New Leads (Not Yet in Collection)

- Harris, K. S. (1954). Cues for the identification of the fricatives of American English. JASA 26, 952. — Showed formant transitions contribute little to fricative identification

### Conceptual Links (not citation-based)

- `Heinz_1961_PropertiesVoicelessFricatives` — Companion study: Hughes & Halle 1956 provides empirical spectral measurements; Heinz & Stevens 1961 provides the pole-zero acoustic theory explaining those measurements
- `Stevens_1978_InvariantCuesPlaceArticulation` — Both establish spectral templates for consonant identification; Hughes & Halle for fricatives (3 spectral classes), Stevens & Blumstein for stops (3 onset spectrum shapes)
