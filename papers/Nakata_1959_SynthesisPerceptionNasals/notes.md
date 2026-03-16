---
title: "Nakata 1959 — Synthesis and Perception of Nasal Consonants"
year: 1959
---

# Nakata 1959 — Synthesis and Perception of Nasal Consonants

## Implementation-Relevant Notes

### Synthesizer Architecture

- **Terminal-analog (cascade) synthesizer** with 4 electronically controlled tuned circuits in cascade, each simulating one vocal tract resonance (F1-F4)
- Excited by quasi-periodic electrical buzz source at ~125 cps
- Buffer amplifiers between stages ensure formant amplitudes are **not independently controllable** — they vary naturally with formant frequency changes (consistent with Fant 1956 predictability)
- This is the same cascade architecture later formalized in Klatt 1980

### Key Finding: Nasal Consonants Without Antiresonances

- Acceptable nasal consonants can be synthesized **without introducing spectral zeros** (antiresonances)
- The critical modification vs vowels: **increase bandwidth of F1 to ~300 Hz**
- With narrow B1 (50 Hz) → voiced stop consonant perceived
- With wide B1 (~300 Hz) → nasal consonant perceived
- This is a major simplification relevant to cascade-only synthesizers

### Nasal Consonant Acoustic Properties

- **F1 for nasals**: 200-300 Hz (lower than most vowels)
- **B1 for nasals**: ~300 Hz (much wider than vowel B1 of 50-150 Hz)
- Damping is greater than for vowels due to soft walls and complex geometry of nasal cavity
- Spectral zeros exist (e.g., near 800 Hz for /m/) due to closed oral cavity "side branch," but are not required for perception
- The lowest resonance has greater intensity than higher resonances

### Nasal Consonant Identification Cues

#### Primary cue: F2 locus (starting frequency of second formant transition)

| Nasal | F2 locus range | Peak F2 locus (isolated) |
|-------|---------------|------------------------|
| /m/   | Low (~900-1300 Hz) | 1100 Hz |
| /n/   | Medium (~1300-1900 Hz) | 1700 Hz |
| /ng/  | High (~1900-2300 Hz) | 2300 Hz |

- F2 locus determines nasal identity more than any other parameter
- The best F2 locus for each nasal **shifts toward the F2 of the adjacent vowel** (coarticulation effect)

#### Secondary cues: Duration

- Best /m/ responses: short durations (20-50 ms consonant + transition)
- Best /n/ responses: 30 ms initial segment duration preferred
- Best /ng/ responses: longer durations (50-100 ms transition), 70 ms initial segment
- Best /m/ and /ng/: 70 ms initial segment duration

### Synthesis Parameters Used

#### Syllable structure (3 segments):
1. **Initial segment** (nasal): stationary resonances
2. **Transition segment**: resonances move exponentially to vowel targets
3. **Final segment** (vowel): stationary resonances at vowel frequencies

#### Parameter values:
- **F1 nasal**: 200 Hz
- **B1 nasal**: 300 Hz (entire stimulus including vowel portion)
- **B2, B3**: 50-100 Hz
- **F4**: 3600 Hz (fixed)
- **F0**: ~125 Hz with slightly rising inflection
- **Initial segment duration**: 30 or 70 ms
- **Transition duration**: 20, 50, or 100 ms
- **Total stimulus duration**: ~350 ms
- **No F3 or F4 transitions** used

#### Vowel formant targets (Table I):

| Vowel | F1 (Hz) | F2 (Hz) | F3 (Hz) |
|-------|---------|---------|---------|
| /i/   | 270     | 2290    | 3000    |
| /I/   | 390     | 1990    | 2500    |
| /e/   | 530     | 1840    | 2500    |
| /a/   | 730     | 1090    | 2500    |
| /o/   | 570     | 900     | 2500    |
| /u/   | 300     | 900     | 2500    |

### Isolated Nasal Consonant Synthesis

Parameters for isolated nasals:
- F1: 200 Hz, B1: 300 Hz
- F2: varied (900-2300 Hz)
- B2: 30-100 Hz (narrow) or 200 Hz (broad)
- F3: 2500 Hz

Results with broad B2 (200 Hz):
- /m/ peak response: ~85% at F2 = 1100 Hz
- /n/ peak response: ~75% at F2 = 1700 Hz
- /ng/ peak response: ~55% at F2 = 2300 Hz
- Broader B2 gives more clearly defined identification than narrow B2

### Acoustic Model of Nasal Production

- Vocal tract excited at glottis, output at nose
- Transfer function has conjugate pole pairs (as for vowels) PLUS pole-zero pairs from closed oral cavity "side branch"
- Side branch length differs for /m/, /n/, /ng/ — different antiresonance locations
- At low frequencies, coupling between oral and nasal cavities is significant → lowest resonance (200-300 Hz) originates from combined structures
- At higher frequencies, vocal tract resonances (F2+) are relatively unaffected by moderate velar coupling
- Sharp amplitude changes at consonant-vowel boundary, but frequency transitions are relatively continuous

### Implications for Klatt-type Synthesizers

1. Cascade synthesizer CAN produce acceptable nasals by widening B1 to ~300 Hz with F1 at 200 Hz
2. Antiresonances (FNZ in Klatt) improve realism but are not strictly required for identification
3. F2 locus is the primary perceptual cue — must be set correctly per place of articulation
4. Amplitude naturally drops when F1 is low in cascade configuration — consistent with natural nasal murmur being lower amplitude than adjacent vowel
5. Formant transitions should be continuous (exponential) from nasal to vowel

## Collection Cross-References

### Already in Collection
- `Fant_1960_AcousticTheorySpeechProduction` — acoustic theory of nasal tract
- `Delattre_1955_AcousticLociTransitionalCues` — locus concept applied to nasals

### Cited By (in Collection)
- `Fujimura_1962_NasalConsonantAnalysis` — extends Nakata's nasal analysis with spectral zeros
- `Recasens_1983_NasalPlaceCues` — builds on Nakata's nasal place identification findings
- `Rabiner_1968_DigitalFormantSynthesizer` — references Nakata for cascade nasal synthesis

### Conceptual Links (not citation-based)
- `Beddor_1986_NasalVowelHeight` — both study nasal acoustic effects; Nakata on consonants, Beddor on vowel nasalization
- `House_Stevens_1956_NasalizationVowels` — both study nasal coupling effects on spectrum
- `Hawkins_Stevens_1985_NasalVowelCorrelates` — complementary work on nasal vowel correlates
- `Chen_1997_NasalizedVowelAcoustics` — both address nasal acoustic properties in synthesis context
