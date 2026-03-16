---
title: "Halle, Hughes, & Radley (1957) — Acoustic Properties of Stop Consonants"
year: 1957
---

# Halle, Hughes, & Radley (1957) — Acoustic Properties of Stop Consonants

## Implementation-Relevant Notes

### Two Major Cues for Stop Consonant Identity

1. **Burst spectrum** — the short noise burst at stop release
2. **Formant transitions** — rapid changes in vowel formants adjacent to the stop closure

Both cues can independently identify stops. Silence (closure) is a necessary cue for perceiving a stop; if filled with other sound (except voicing), no stop is perceived.

### Burst Spectral Classification

The burst spectra were measured using energy density spectra (200 cps to 10,000 cps range, Hewlett Packard 300A wave analyzer, ~150 cps bandwidth). First 20 ms of each burst was captured.

#### Three-Class Spectral Criterion (Table for burst identification)

Measured intensity in two bands: **700-10,000 cps** and **2700-10,000 cps** for all bursts.

| Class | Stops | Burst spectral property |
|-------|-------|------------------------|
| **Acute** | /t/, /d/, front variants of /k/, /g/ | Significant energy in high frequencies (above 2700 cps); intensity at 700-10,000 exceeds 2700-10,000 by **5 dB** (tense) or **8 dB** (lax) |
| **Grave** | /p/, /b/, back variants of /k/, /g/ | Energy concentrated at low frequencies; weak in the high range |

This two-band criterion correctly classified **95%** of all bursts across the corpus.

#### Separating Acute Stops: /t/ /d/ vs Front /k/ /g/

For the acute class, plot the intensity difference of the two most intense spectral maxima as a function of the frequency position of the highest maximum (Fig. 6):
- **Tense stops** (/t/, front /k/): straight line separates 85% correctly
- **Lax stops** (/d/, front /g/): 78% correctly separated

#### Separating Grave Stops: /p/ /b/ vs Back /k/ /g/

For grave consonants, the difference in levels between the two most intense spectral maxima was plotted as a function of frequency position of the maximum of highest frequency:
- Back /k/ and /g/ bursts have higher-frequency peaks than /p/ and /b/

### Formant Transition Properties

Corpus: monosyllables with English vowels /i/, /I/, /e/, /ae/, /a/, /^/, /o/, /o/, /u/, /U/ combined with all six stops in initial and final position. Read by 3 males and 1 female.

#### Key Transition Observations

Transitions examined on Kay Electric sonagraph. Major findings:

**For lax stops in initial position:**
- /b/ has a **negative or zero** F2 and F3 transition for every vowel except /i/, /I/ (where the initial frequency is below the steady-state vowel value, then rises)
- /d/ and front /g/ give progressively **more positive** F2 transitions
- /g/ before back vowels has a **positive** F2 transition initially, then converges

**For tense stops in initial position:**
- /p/ has a positive F2 transition, but F3 transition is hard to discern
- /t/ /d/ have **positive** F2 and **neutral or slightly negative** F3 transitions
- Front /k/: **markedly positive** F2 transition, with absence of clear F1 transition distinguishing it from /t/ /d/
- Convergence of F2 and F3 is common for /k/, though not exclusive

**For final position:**
- Rules are similar but transitions are into the stop (decreasing toward closure)
- Vowel duration is markedly different before tense vs lax stops (see perceptual tests)
- /b/ and /d/ in final position: F2 transitions are the key cue

### Perceptual Test Results (Table I)

Listeners were presented monosyllables with final stop bursts gated out. Vowels /i/, /I/, /u/, /U/, /a/, /ae/ followed by 6 stops. Open syllables also included.

- Subjects had **little difficulty** distinguishing tense from lax stops based on vowel duration alone
- Subjects **never** confused an open syllable with a tense-stop syllable
- Occasionally confused open syllable for lax-stop syllable
- /k/ and /g/ were judged **less reliably** than other stops from transitions alone
- The "mistake" judgments for /k/ /g/ correlated with F1 position of the preceding vowel

### Vowel Duration Differences (Fig. 8)

Strong durational contrast between vowels before tense vs lax stops:
- Vowels before **lax** stops are **longer**
- Vowels before **tense** stops are **shorter**
- This is a robust perceptual cue for the tense/lax distinction in final position

### Terminology

The paper uses **tense** = /p/ /t/ /k/ (voiceless) and **lax** = /b/ /d/ /g/ (voiced), following Jakobson et al. They also use **acute** (front: /t/ /d/ and front /k/ /g/) vs **grave** (back: /p/ /b/ and back /k/ /g/).

### Discussion: Formant Transitions as Resonance Changes

The paper argues that formant transitions should not be viewed simply as moving stationary formants. When a resonance is changing in frequency, the band width complicates frequency measurement. At some critical bandwidth (~300 cps estimated), the train of damped sine waves from a changing resonance can no longer be matched in pitch to a pure tone. Below this bandwidth the formant movement is perceptible; above it, the short-time energy-density spectrum organization replaces the time-domain formant interpretation.

This means the burst (very rapid spectral change) and transitions (slower spectral change) are points on a continuum of rate of change, not fundamentally different phenomena.

### Key Parameters for Synthesis

| Parameter | Value | Context |
|-----------|-------|---------|
| Burst duration | ~20 ms | First 20 ms of stop burst captured |
| Silence gap (closure) | order of 100 ms | Between preceding vowel and burst |
| Acute/grave boundary | 2700 cps | Energy above vs below this frequency |
| Intensity difference threshold | 5 dB (tense), 8 dB (lax) | Between 700-10k and 2700-10k bands |
| Transition duration | ~50 ms typical | But varies greatly; some >100 ms |
| Critical bandwidth for formant movement perception | ~300 cps | Estimate where pitch matching fails |
| Vowel+transition before stop | ~100 ms minimum | For lax back vowels, very short |

## Collection Cross-References

### Already in Collection
- `Delattre_1955_AcousticLociTransitionalCues` — Delattre et al. 1955, cited for Haskins transition experiments
- `Stevens_1998_AcousticPhonetics` — references Halle 1957 burst spectral analysis

### Cited By (in Collection)
- `Blumstein_Stevens_1979_AcousticInvariance` — cites Halle et al. 1957 for stop burst spectral properties
- `Zue_1976_StopConsonantAcoustics` — cites Halle et al. 1957 as foundational stop consonant study
- `Behrens_Blumstein_1988_FricativeAmplitude` — references Halle et al. for spectral classification
- `Hughes_1956_SpectralPropertiesFricatives` — companion study by same authors on fricatives
- `Jongman_1989_FricativeDuration` — references Halle et al. for spectral analysis methods
- `Stevens_1978_InvariantCuesPlaceArticulation` — builds on Halle 1957 burst spectral analysis

### Conceptual Links (not citation-based)
- `Crystal_House_1988_StopConsonantDuration` — both study stop consonant properties; Crystal & House focus on duration while Halle et al. focus on spectral cues
- `Abramson_Whalen_2017_VOTat50` — both address stop consonant voicing distinctions from different perspectives
