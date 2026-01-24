# Acoustic Characteristics of Stop Consonants: A Controlled Study

**Author:** Victor Waito Zue
**Year:** 1976
**Venue:** MIT ScD Thesis
**Advisor:** Kenneth N. Stevens

## One-Sentence Summary

Comprehensive acoustic measurements of English stop consonants (/p,t,k,b,d,g/) in singleton and cluster contexts, providing precise VOT, burst frequency, and burst amplitude data essential for implementing realistic stop consonant synthesis in a Klatt synthesizer.

## Problem Addressed

Prior to this work, acoustic characteristics of stop consonants were studied primarily in isolated monosyllabic words or continuous speech, making it difficult to separate intrinsic consonant properties from coarticulation effects. This thesis provides controlled measurements in a fixed linguistic environment ("Say haCVC again") to establish context-independent acoustic properties while systematically documenting vowel-dependent variations.

## Key Contributions

- **1,728 utterances** analyzed from 3 male speakers in controlled CV/CCV contexts
- Precise VOT measurements for all 6 stops in singleton and 21 cluster types
- Burst frequency measurements showing vowel-dependency patterns (especially for velars)
- Burst amplitude data showing 12 dB labial weakness relative to dentals/velars
- Evidence for context-independent acoustic properties despite coarticulation
- Demonstration that VOT alone cannot distinguish voiced/voiceless stops (requires additional cues)

## Methodology

### Corpus Design
- **Format:** Nonsense word "haCVC" in carrier sentence "Say ___ again"
- **Focus:** Prestressed consonants and consonant clusters (clearest acoustic environment)
- **Speakers:** 3 male speakers across multiple sessions

### Phonetic Inventory
- **Stops:** /p, t, k, b, d, g/
- **Vowels:** 15 vowels and diphthongs: /i, I, e, E, ae, a, A, o, O, u, U, schwa, ay, oy, aw/
- **2-Element Clusters:** pl, pr, tr, tw, kl, kr, kw, bl, br, dr, dw, gl, gr, gw, fl, fr, sp, st, sk, sm, sn, sl, sw, shr, thr
- **3-Element Clusters:** spr, spl, str, skr

### Recording
- Sound-proof room, >50 dB signal-to-noise ratio
- Altec 684B microphone with Presto model 800 tape recorder
- Speaking rate: ~5 syllables/second

### Analysis
- Band-limited to 5 kHz, sampled at 10 kHz, 12 bits
- 12.8 ms Hanning window, updated every 5 ms
- Linear prediction analysis with 12-14 parameters (preferred over DFT for formant tracking)

## Voice Onset Time (VOT) Data

### Singleton Voiced Stops

| Stop | Mean VOT (ms) | Std Dev (ms) | Notes |
|------|---------------|--------------|-------|
| /b/  | 13-17         | 3            | Shortest due to rapid lip movement |
| /d/  | 19-23         | -            | Intermediate |
| /g/  | 30-38         | 5            | Longest due to massive tongue body |

- **Pattern:** VOT increases from front to back (labial < alveolar < velar)
- **Cause:** Tongue body (velar) is massive and cannot move away quickly; lips can move rapidly

### Singleton Voiceless Stops

| Stop | Mean VOT (ms) | Std Dev (ms) | Frication (ms) | Aspiration (ms) |
|------|---------------|--------------|----------------|-----------------|
| /p/  | 58.4          | -            | ~15            | ~43             |
| /t/  | 70.8          | 7            | ~15            | ~56             |
| /k/  | 73.2          | 11           | ~15            | ~58             |

- **95%+ of voiceless stops have VOT > 40 ms**
- Total duration (closure + VOT) is constant ~150 ms for all voiceless stops
- Closure duration inversely related to VOT (longer closure for /p/, shorter for /k/)

### Cluster Effects on VOT

| Cluster Type | VOT Change | Example Values |
|--------------|------------|----------------|
| Stop-sonorant (voiced) | +28% | 26.3 ms mean (from 20.6 ms) |
| Stop-sonorant (voiceless) | +27% | 85.6 ms mean (from 67.5 ms) |
| /s/-stop clusters | Dramatic reduction | 22.7 ms (like voiced singleton) |

- /tw/: highest cluster VOT (~100 ms)
- /bl/: lowest cluster VOT (~15 ms)
- Voiceless stops in /s/-clusters behave like voiced stops (unaspirated)

### VOT by Vowel Features (Voiceless Stops)

| Vowel Feature | /p/ (ms) | /t/ (ms) | /k/ (ms) | Mean (ms) |
|---------------|----------|----------|----------|-----------|
| +HIGH         | 52.0     | 70.0     | 76.3     | 66.1      |
| -HIGH         | 60.9     | 71.5     | 72.5     | 68.3      |
| +BACK         | 61.0     | 70.9     | 74.3     | 68.7      |
| -BACK         | 53.6     | 71.4     | 71.8     | 65.6      |
| All vowels    | 58.4     | 70.8     | 73.2     | 67.5      |

## Burst Characteristics

### Burst Amplitude (Overall RMS)

| Stop | Overall RMS (dB) | Relative to Vowel (dB) |
|------|------------------|------------------------|
| /p/  | -27.6            | (not measurable)       |
| /t/  | -16.6            | +2.4                   |
| /k/  | -17.2            | -1.8                   |
| /b/  | -28.0            | (not measurable)       |
| /d/  | -15.8            | -0.4                   |
| /g/  | -16.6            | -3.4                   |

**Key findings:**
- **Labial bursts are 12 dB weaker** than dentals/velars
- No significant difference between voiced/voiceless in overall RMS
- Voiceless ~2 dB louder than voiced when measured relative to vowel
- Dental/velar burst amplitude approximately equals following vowel amplitude

### Burst Frequency by Place of Articulation

| Stop | Mean Freq (Hz) | Before Front V | Before Back V | Before Rounded V | Notes |
|------|----------------|----------------|---------------|------------------|-------|
| /t/  | 3,660          | 3,900          | 3,660         | 3,300            | High-frequency, relatively invariant |
| /d/  | 3,300          | 3,530          | 3,300         | 2,950            | 200-300 Hz lower than /t/ |
| /k/  | 1,910          | 2,720          | 1,770         | 1,250            | Highly vowel-dependent |
| /g/  | 1,940          | 2,700          | 1,770         | 1,250            | Same pattern as /k/ |
| /p/  | -              | -              | -             | -                | No clear spectral peak |
| /b/  | -              | -              | -             | -                | No clear spectral peak |

### Burst Frequency in Clusters

| Cluster | Freq (Hz) | Comparison |
|---------|-----------|------------|
| /tr/    | 2,460     | >1000 Hz lower than singleton /t/ |
| /tw/    | 2,570     | Slightly higher than /tr/ |
| /dr/    | 2,120     | Lower than singleton /d/ |
| /st/    | 3,240     | Matches singleton /d/, not /t/ |
| /sk/    | 2,010     | Matches singleton /g/ |
| /kl/    | 1,320     | Lowered by lateral |
| /kr/    | 1,240     | Lowered by rhotic |
| /kw/    | 1,050     | Lowest (rounding effect) |

## Formant Transitions

- Formant transitions carry place-of-articulation information
- F2 transition direction indicates place: rising for labials, falling for velars, variable for alveolars
- Transitions must be complete by voicing onset for proper perception of voiceless stops
- "Lack of rapid spectral change at the onset of voicing is necessary for the proper perception of the voiceless stops" (Stevens and Klatt 1974)

## Key Equations

### Linear Prediction Model

Speech production difference equation:
$$s(n) = \sum_{k=1}^{p} a(k)s(n-k) + x(n)$$

All-pole transfer function (equivalent to Klatt cascade):
$$H(z) = \frac{1}{1 - \sum_{k=1}^{p} a_k z^{-k}}$$

Parameters:
- p = 12-14 for 10 kHz sampling
- 5-6 complex pole pairs for vocal tract (up to 5 kHz)
- 2 additional real poles for glottal source and radiation

## Implementation Parameters for Klatt Synthesis

### Recommended VOT Values

| Stop | Default VOT (ms) | In Stop-Sonorant Cluster | In /s/-Cluster |
|------|------------------|--------------------------|----------------|
| /b/  | 17               | 22                       | -              |
| /d/  | 23               | 31                       | -              |
| /g/  | 38               | 49                       | -              |
| /p/  | 58               | 74                       | 23             |
| /t/  | 71               | 99                       | 23             |
| /k/  | 73               | 93                       | 23             |

### Recommended Burst Amplitude (AF parameter, relative to vowel)

| Stop | Amplitude (dB) | Notes |
|------|----------------|-------|
| /p/  | -28            | Very weak, may be imperceptible |
| /b/  | -28            | Very weak, may be imperceptible |
| /t/  | +2             | Strongest burst |
| /d/  | 0              | Near vowel amplitude |
| /k/  | -2             | Slightly below vowel |
| /g/  | -3             | Below vowel amplitude |

### Burst Frequency Rules

**Labials (/p/, /b/):**
- No distinct spectral peak
- Use low-amplitude broadband noise
- Identification relies on VOT and formant transitions

**Dentals (/t/, /d/):**
- Default: 3500-4000 Hz
- Before rounded/retroflexed vowels: reduce by 600 Hz
- /d/ is 200-300 Hz lower than /t/ in same context

**Velars (/k/, /g/):**
- Before front vowels: 2700-3000 Hz
- Before back unrounded vowels: 1700-1800 Hz
- Before back rounded vowels: 1200-1300 Hz
- Include secondary peak at 3/4-wavelength resonance for improved quality

### Glottal Timing Rules

- Total duration (closure + VOT) is constant ~150 ms for voiceless stops
- Closure duration = 150 - VOT
- /p/: longest closure (~90 ms), shortest VOT
- /k/: shortest closure (~75 ms), longest VOT
- Glottal abduction is independent of oral articulator timing

## Figures of Interest

| Figure | Page | Content |
|--------|------|---------|
| 1.1    | 15   | Spectrograms of "boo" vs "do" showing formant coarticulation |
| 1.2    | 16   | Spectrograms of "tea", "steep", "tree" showing /t/ variation |
| 3.1    | 35   | All-pole model of speech production (cascade branch basis) |
| 3.16   | 70   | VOT vs burst frequency scatter plot (270 samples) |
| 4.1    | 76   | Durational measurement methodology illustration |
| 4.4    | 90   | VOT for singleton voiceless stops (frication vs aspiration) |
| 4.5    | 92   | Total duration showing constant ~150 ms |
| 4.10   | 95   | VOT reduction in /s/-clusters |
| 4.11   | 98   | Glottal timing model schematic |
| 5.3    | 108  | Burst vs vowel amplitude comparison |
| 5.9    | 120  | Three-peak distribution for /k/ burst frequency |
| 5.10   | 121  | /k/ burst frequency by vowel context |

## Limitations

- Only 3 male speakers (no female data)
- Only prestressed CV syllables (word-initial position)
- Nonsense words may not fully represent natural speech
- Labial burst frequencies could not be reliably measured
- Burst/aspiration boundary is inherently ambiguous
- No data on post-vocalic or intervocalic stops

## Relevance to Qlatt Project

1. **VOT parameters:** Direct values for implementing stop consonant timing in the synthesizer

2. **Burst amplitude (AF):** The 12 dB labial weakness must be implemented; current Klatt may need adjustment for /p,b/ vs /t,d,k,g/

3. **Burst frequency rules:** Vowel-dependent velar burst frequency is critical for natural /k,g/ synthesis; dentals can use fixed high-frequency burst

4. **Cluster modifications:** Must implement VOT increases for stop-sonorant clusters and VOT reduction for /s/-clusters

5. **Closure duration:** Should be inversely related to VOT to maintain constant total duration for voiceless stops

6. **Voicing distinction:** VOT alone is insufficient; must combine with burst amplitude and formant transition cues

## Open Questions

- [ ] How should the secondary peak for velar bursts be implemented in the parallel branch?
- [ ] What is the optimal aspiration noise source spectrum (subglottal formant effects)?
- [ ] How do these values transfer to female speakers (likely need scaling)?
- [ ] How to handle the burst/aspiration boundary ambiguity in synthesis?
- [ ] Are current Qlatt AF values for labials appropriately weak (-28 dB)?

## References Worth Following

- **Klatt (1975)** - VOT, frication, aspiration in word-initial consonant clusters (first systematic cluster VOT data)
- **Stevens & Klatt (1968, 1969)** - Intrinsic acoustic properties in stressed C-V syllables
- **Stevens & Klatt (1974)** - Lack of rapid spectral change at voicing onset for voiceless perception
- **Lisker & Abramson (1964)** - Cross-language VOT study (foundational VOT research)
- **Halle, Hughes & Radley (1957)** - Acoustic properties of stop consonants
- **Fant (1973)** - Speech Sounds and Features
- **Fant et al. (1972)** - Subglottal formants during aspiration
