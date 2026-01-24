# Linguistic Uses of Segmental Duration in English: Acoustic and Perceptual Evidence

**Authors:** Dennis H. Klatt
**Year:** 1976
**Venue:** Journal of the Acoustical Society of America, Vol. 59, No. 5, May 1976
**Pages:** 1208-1221

## One-Sentence Summary
Comprehensive review establishing duration rules for English TTS synthesis, with quantitative models for vowel and consonant timing based on phonetic context, stress, and phrase position.

## Problem Addressed
How to predict segmental durations in English sentences for speech synthesis, and which durational cues are perceptually important vs. artifacts of production.

## Key Contributions
1. Systematic catalog of factors affecting segment duration (Table I)
2. Quantitative duration prediction models with specific parameters (Tables II & III)
3. Incompressibility formula for combining multiple shortening rules
4. Perceptual relevance assessment - which duration changes exceed JND (~25ms)
5. Primary vs. secondary durational cues classification

## Methodology
- Review of acoustic measurement studies on English
- Analysis of nonsense syllable data (Lehiste 1975a, Oller 1973)
- Perceptual experiments on JND for duration
- Model fitting to predict durations in 56 conditions with 9 parameters

## Key Equations

### Incompressibility Formula (Eq. 1)
$$D_f = K \cdot (D_i - D_{min}) + D_{min}$$

Where:
- $D_f$ = final duration after rule application
- $D_i$ = input/current duration
- $D_{min}$ = minimum duration (incompressible portion)
- $K$ = scaling factor (0-1 for shortening, >1 for lengthening)

**Critical insight:** Multiple shortening rules don't multiply - there's a floor. $D_{min} \approx 0.42-0.45 \times D_{inherent}$

### Umeda's Vowel Duration Formula
$$D = 60 + S \cdot [130 + (C \cdot 130)]$$

Where:
- $S$ = stress factor (0.2 for unstressed function words to 1.0 for prepausal stressed)
- $C$ = postvocalic consonant factor (0.2 for voiceless stops to 1.0 for phrase-final voiced fricatives)

## Parameters

### Vowel Inherent Durations (Table II)

| Phone | D_inh (ms) | D_min (ms) | Ratio |
|-------|------------|------------|-------|
| /æ/   | 240        | 105        | 0.42  |
| /ɪ/   | 160        | 65         | 0.42  |

### Consonant Inherent Durations (Table III)

| Phone | D_inh (ms) | D_min (ms) | Ratio |
|-------|------------|------------|-------|
| /b/   | 100        | 60         | 0.6   |
| /p/   | 100        | 60         | 0.6   |

### Global Timing Statistics
| Measure | Value |
|---------|-------|
| Stressed vowel median | 130 ms |
| Unstressed vowel median | 70 ms |
| Consonant median | 70 ms |
| Syllable mean (excl. pauses) | 200 ms |
| Syllable median | 180 ms |
| Speaking rate range | 150-250 words/min |
| Syllable rate | 4-7 syllables/sec |
| Pause fraction (reading) | 20% |
| Pause fraction (conversation) | 50% |

## Implementation Details

### Vowel Duration Rules (Table II)

**Rule 1: Postvocalic voiceless stop**
```
D = D - 45  // Fixed reduction of 45ms
```

**Rule 2: Non-phrase-final position**
```
K = 0.6
D = K * (D - D_min) + D_min  // ~35% shortening
```

**Rule 3: Unstressed vowel**
```
K = 0.4  // general case
K = 0.55 // word-initial unstressed in polysyllable
D = K * (D - D_min) + D_min
```

**Rule 4: Polysyllabic word**
```
K = 0.78  // ~15% shortening for all syllables
D = K * (D - D_min) + D_min
```

### Consonant Duration Rules (Table III)

**Rule 1: Non-word-initial consonant**
```
K = 0.7  // 15% shorter
D = K * (D - D_min) + D_min
```

**Rule 2: Unstressed consonant**
```
K = 0.8  // 10% shorter
D = K * (D - D_min) + D_min
```

**Rule 3: Word-medial consonant**
```
K = 0.7  // 15% shorter
D = K * (D - D_min) + D_min
```

**Rule 4: Phrase-final consonant (non-plosive)**
```
K = 1.6  // 30% longer
D = K * (D - D_min) + D_min
```

### Application Order
Rules apply sequentially, each using the output of the previous rule as input.

## Factors Influencing Duration (Table I)

### Extralinguistic
- Psychological/physical state (anger = very slow, fear/sorrow = slower)
- Speaking rate

### Discourse Level
- Position within paragraph (final sentence longer)

### Semantic
- Emphasis and semantic novelty (10-20% increase)
- First occurrence of unusual word is longest

### Syntactic
- Phrase-structure lengthening (30% increase at phrase boundaries)
- Sentence-final lengthening (60-200ms increase)

### Word Level
- Word-final lengthening (small effect, ~not significant)
- Consonant position: word-initial > word-final > word-medial

### Phonological/Phonetic
- Inherent duration (8:1 range in vowels from prepausal /ay/ to unstressed schwa)
- Stress (unstressed unreduced = 65% of stressed in phrase-final)
- Postvocalic consonant voicing (50-100ms in phrase-final, 10-20ms elsewhere)
- Consonant clusters (20-30% shortening)

### Physiological
- Incompressibility (~45% of inherent duration)

## Perceptual Relevance

### Just-Noticeable Difference (JND)
- **~25 ms** in sentence contexts with varied stimuli
- **~20 ms** when same sentence repeated
- **~10 ms** at phoneme boundaries in Japanese (near psychophysical limits)
- JND follows Weber's law: ~20% change detectable

### Primary Cues (changes > JND)
1. Inherent duration: long vs. short vowels (/æ/ vs /ɛ/)
2. Inherent duration: voiced vs. voiceless fricatives (/s/ vs /z/)
3. Phrase-boundary lengthening
4. Stressed vs. unstressed (especially if vowel reduced)
5. Postvocalic consonant effect at phrase boundaries
6. Emphasis

### Secondary Cues (changes < JND)
1. Word-boundary lengthening
2. Postvocalic consonant effect in non-phrase-final positions
3. Stress differences between already-stressed vowels

## Figures of Interest

- **Fig 1 (p.1208):** Spectrogram of "We shouldn't take so much time" with segment boundaries
- **Fig 2 (p.1209):** Block diagram of sentence generation showing where duration is specified
- **Fig 3 (p.1211):** "raisin bread" spectrograms showing emphasis effects on duration
- **Fig 4 (p.1212):** "bad" in phrase-final vs. non-final position (300ms vs 180ms)
- **Fig 5 (p.1213):** /æ/ vs /ɛ/ and /s/ vs /z/ duration contrasts
- **Fig 6 (p.1214):** "insert" noun vs. verb stress patterns
- **Fig 7 (p.1215):** Vowel duration before voiced vs. voiceless consonants
- **Fig 8 (p.1216):** Consonant cluster shortening (/s/, /p/, /sp/)

## Results Summary

The 4-rule vowel model accounts for **97% of variance** across 56 conditions using only 9 parameters.

Key quantitative findings:
- Phrase-final vowels: up to **2x longer** than non-final
- Voiceless postvocalic consonant: **-45ms** (phrase-final) or **-10 to -20ms** (elsewhere)
- Unstressed vowels: **35-60% shorter**
- Consonants in clusters: **20-30% shorter**
- Word-initial consonants: **10-30ms longer** than word-final

## Limitations

1. Rules derived mainly from nonsense syllables - may differ in natural speech
2. Semantic/discourse effects not captured in the model
3. Not all vowels/consonants behave identically
4. Speaker and dialect variation not modeled
5. Speaking rate effects are complex (not simple scaling)

## Relevance to Project

**Direct applications to Qlatt:**

1. **Inherent durations:** Use Table II values as baseline for vowel targets
2. **Incompressibility formula:** Implement Eq. 1 when combining multiple shortening rules
3. **Phrase-final lengthening:** 30% increase or 60-200ms absolute
4. **Stress effects:** K=0.4-0.6 for unstressed vowels
5. **Postvocalic consonant:** -45ms for voiceless (phrase-final only significant)
6. **Perceptual threshold:** Don't bother with effects < 25ms

**Implementation priority:**
1. Phrase-boundary lengthening (largest effect)
2. Stress-based shortening
3. Inherent duration differences
4. Postvocalic consonant effect (phrase-final only)

## Open Questions

- [ ] How do these rules interact with speaking rate changes?
- [ ] Are the constants speaker-independent or need calibration?
- [ ] How to detect phrase boundaries from text input?
- [ ] Does incompressibility formula work across all rule combinations?

## Related Work Worth Reading

- Peterson & Lehiste (1960) - Duration of syllable nuclei (inherent durations)
- House & Fairbanks (1953) - Postvocalic consonant effects
- Oller (1973) - Position effects on duration
- Umeda (1975a) - Vowel duration in connected discourse
- Lehiste (1975a) - Factors affecting syllable duration
- Lindblom & Rapp (1973) - Swedish recursive shortening rules
