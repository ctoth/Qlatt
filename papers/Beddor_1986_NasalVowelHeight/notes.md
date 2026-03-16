---
title: "Perceptual Constraints and Phonological Change: A Study of Nasal Vowel Height"
authors: "Patrice Speeter Beddor, Rena Arens Krakow, Louis M. Goldstein"
year: 1986
venue: "Phonology Yearbook, Vol. 3, pp. 197-217"
doi_url: "JSTOR stable/4615399"
---

# Perceptual Constraints and Phonological Change: A Study of Nasal Vowel Height

## One-Sentence Summary
Demonstrates that the acoustic effects of nasal coupling on the F1 region of vowel spectra (pole-zero introduction, F1' shift, spectral centre of gravity changes) are consistent with cross-language phonological patterns of nasal vowel height shifts, but perceptual height shifts only occur when nasalisation is phonetically or phonologically inappropriate.

## Problem Addressed
The longstanding claim that listener misperceptions drive phonological sound change in the domain of nasal vowel height — specifically, why nasalisation lowers high vowels and raises low vowels across languages.

## Key Contributions
- Shows the acoustic consequences of nasal coupling (pole-zero pair near F1) are consistent with the centralising phonological patterns of nasal vowel height
- Demonstrates that nasal coupling shifts F1' (first oral formant) upward relative to F1, but the first spectral peak in nasal vowels is not necessarily F1' — it may be the nasal formant FN
- Introduces "centre of gravity" of the F1-F2 spectral region as a better predictor of perceived vowel height than F1' frequency alone
- Shows perceptual height shifts occur only when nasalisation is phonetically inappropriate (unexpected coupling strength) or phonologically inappropriate (no conditioning nasal context)
- Contextual nasalisation (in [bVnd] sequences) does NOT shift perceived height for American English listeners — they factor out expected coarticulatory nasalisation

## Methodology
Three data types examined:
1. **Phonological:** Cross-language survey of nasal vowel height patterns (75+ languages)
2. **Acoustic:** Articulatory synthesis (Haskins Laboratories) of oral vs nasal vowels; LPC spectra of natural Hindi oral/nasal vowels
3. **Perceptual:** Three experiments with American English listeners:
   - Exp 1: Non-contextual nasal [bVd] vs oral [bVd] identification (7-step /ε/-/æ/ continuum)
   - Exp 2: Contextual nasal [bVnd] vs oral [bVd] and non-contextual nasal [bVd] identification
   - Exp 3: Weak vs strong nasalisation (small vs large velar port opening) in contextual and non-contextual conditions

## Key Equations
No formal equations, but critical acoustic relationships:

### Nasal coupling acoustic model
- Coupling nasal tract to oral tract adds a **pole-zero pair** in the low-frequency region of the vowel spectrum (Fant 1960; Fujimura & Lindqvist 1971)
- F1 of oral vowel is replaced by: **FZ** (zero), **F1'** (shifted oral formant), and **FN** (nasal formant)
- FN frequency: ~200-400 Hz (closed coupling end; Fujimura & Lindqvist 1971)
- FN has wide bandwidth and low amplitude when coupling is small; becomes prominent with larger coupling
- F1' > F1 (nasal coupling raises the frequency of the first oral formant)

### Centre of gravity
- Perceived height correlates with "centre of gravity" of spectral prominences in F1-F2 region
- Determined by frequency AND relative amplitude of F1', FN, and other low-frequency peaks
- Higher centre of gravity → higher perceived vowel (Chistovich & Lublinskaya 1979; Bedrov et al. 1978)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Nasal formant frequency | FN | Hz | ~250 | 200-400 | When velar port closed end ~200-400 Hz |
| Velar port opening (small) | - | mm² | 7.2 | - | Perceptually weak nasalisation |
| Velar port opening (large) | - | mm² | 24.0 | - | Perceptually strong nasalisation |
| Velar port opening (moderate) | - | mm² | 16.8 | - | Natural-sounding nasalisation |
| Alveolar occlusion duration | - | ms | 137 | - | In [bVnd] sequences |
| Velar port open during occlusion | - | ms | 80 | - | Of the 137 ms alveolar occlusion |
| Vowel continuum steps | - | - | 7 | - | /ε/ to /æ/ in equal articulatory steps |

## Implementation Details
- **Articulatory synthesis** used the Haskins Laboratories articulatory synthesiser (Rubin et al. 1981)
- Mid-sagittal vocal tract outline specified by 6 articulatory parameters: jaw, hyoid, tongue body centre, tongue tip, lips, velum
- Transfer functions computed from area functions using Ladefoged et al. (1978) equations
- 7-step vowel continuum from /ε/ to /æ/ by systematically lowering and retracting tongue body
- For /i/: oral [i] vs nasal [ĩ] with no/intermediate/heavy coupling (Fig 1)
- For /a/: oral [a] vs nasal [ã] with heavy coupling (Fig 2)

## Figures of Interest
- **Fig 1 (p.4):** Transfer functions for /i/ — oral, moderate nasal, heavy nasal. Shows F1' shift upward and FN emergence
- **Fig 2 (p.5):** Transfer functions for /a/ — oral vs heavy nasal. Shows FN and increased F1' frequency
- **Fig 3 (p.6):** Vocal tract shapes — original (used for synthesis) and recovered from formant frequencies. Nasal [ĩ] recovered as lower oral vowel
- **Fig 4 (p.8):** LPC spectra of Hindi oral [e] and nasal [ẽ]. Lower first peak in nasal but higher centre of gravity
- **Fig 5 (p.9):** Vocal tract outlines for the 7 /ε/-/æ/ continuum steps
- **Fig 6 (p.10):** Identification functions — oral [bVd] vs non-contextual nasal [bṼd]. Nasalisation lowers perceived height
- **Fig 7 (p.11):** Transfer functions for stimulus 4 — oral vs nasal. First spectral peak lower in nasal but predominant peak is F1'
- **Fig 8 (p.13):** Contextual nasal [bṼnd] vs oral [bVd] vs non-contextual [bṼd]. Contextual nasalisation has NO effect on height
- **Fig 9 (p.17):** Small vs large port opening effects. Weak nasalisation raises perceived height; strong nasalisation lowers it

## Results Summary

### Cross-language phonological patterns
- High vowels: nasalisation lowers (e.g., /i/ → [ĩ] perceived lower in Bengali, Ewe, Gadsup, Inuit, Swahili)
- Low vowels: nasalisation raises (e.g., /a/ → [ã] perceived higher in Breton, Haida, Nama, Seneca, Zapotec)
- Mid vowels: front-back asymmetry — front mid vowels tend to lower, back mid vowels tend to raise
- Pattern = centralisation: vowel height becomes more mid under nasalisation

### Acoustic findings
- F1' > F1 for high vowels → first spectral peak rises → inconsistent with lowering?
- BUT: for high vowels, FN is low-frequency and pulls centre of gravity DOWN → perceived lowering
- For low vowels, F1' > F1 → centre of gravity rises → perceived raising
- Key insight: it's the CENTRE OF GRAVITY of the low-frequency spectral region, not just F1' frequency

### Perceptual findings
- **Non-contextual nasalisation** (isolated [bṼd]): listeners perceive height shift (more /æ/ responses for nasal stimuli)
- **Contextual nasalisation** ([bṼnd]): NO height shift — listeners factor out expected coarticulatory nasalisation
- **Weak non-contextual nasalisation** (small port): slightly RAISES perceived height (overcompensation)
- **Strong non-contextual nasalisation** (large port): LOWERS perceived height (undercompensation)
- American English listeners compensate for expected nasalisation but misperceive unexpected degrees

## Limitations
- Only tested American English listeners (language without distinctive nasal vowels)
- Authors speculate but don't test listeners from languages with phonemic nasal vowels
- Articulatory synthesis may not capture all acoustic details of natural nasalisation
- /ε/-/æ/ continuum only — limited vowel height range tested perceptually
- Phonological survey data is from secondary sources

## Testable Properties
- F1' of nasal vowel must be higher than F1 of corresponding oral vowel (for all vowel heights)
- FN frequency should be in 200-400 Hz range regardless of oral vowel quality
- Centre of gravity of F1-F2 region should be higher for nasal low vowels than oral low vowels
- Centre of gravity should be lower for nasal high vowels than oral high vowels (due to FN pulling it down)
- Contextual nasalisation in VN sequences should produce no perceptual height shift for English listeners
- Non-contextual nasalisation should shift perceived height toward mid vowels (centralisation)

## Relevance to Project
Directly relevant to nasalisation modeling in the Klatt synthesiser. The pole-zero pair model (FZ, FN, F1') maps onto the cascade/parallel formant architecture: the nasal zero FZ and nasal pole FN must be set correctly relative to F1 to produce perceptually appropriate nasalised vowels. The finding that degree of coupling matters (weak vs strong nasalisation produce opposite perceptual effects) constrains how velopharyngeal coupling parameters should be modulated. The centre-of-gravity analysis suggests that getting FN amplitude and bandwidth right is as important as getting FN frequency right.

## Open Questions
- [ ] How would speakers of languages with distinctive nasal vowels (e.g., French, Hindi) perceive the same stimuli?
- [ ] Does the centre-of-gravity model predict perceived height for back vowels as well as front vowels?
- [ ] What are the optimal FN bandwidth and amplitude settings for natural-sounding nasalisation at different coupling strengths?

## Related Work Worth Reading
- House & Stevens 1956 — Analog studies of nasalization of vowels (already in collection)
- Hawkins & Stevens 1985 — Acoustic and perceptual correlates of nasal-non-nasal distinction (already in collection)
- Maeda 1982 — Vowel nasalization cues (already in collection)
- Fujimura 1962 — Nasal consonant analysis (already in collection)
- Chen 1997 — Nasalized vowel acoustics (already in collection)
- Feng 1996 — Nasal vowel target (already in collection)
- Chistovich & Lublinskaya 1979 — Centre of gravity in vowel perception
- Wright 1980 — Behavior of nasalized vowels in perceptual vowel space

## Collection Cross-References

### Already in Collection
- [[House_Stevens_1956_NasalizationVowels]] — cited for foundational analog synthesis studies of nasal vowel spectra; this paper extends those findings with perceptual experiments
- [[Hawkins_Stevens_1985_NasalVowelCorrelates]] — cited for acoustic and perceptual correlates of nasal-non-nasal distinction; Beddor builds on Hawkins & Stevens' spectral analysis with articulatory synthesis
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited for acoustic theory of pole-zero pairs in nasal coupling
- [[Maeda_1982_VowelNasalizationCues]] — cited for computational model of nasal coupling effects
- [[Fujimura_1962_NasalConsonantAnalysis]] — cited for nasal formant frequency data
- [[Chen_1997_NasalizedVowelAcoustics]] — related work on nasalized vowel acoustics
- [[Feng_1996_NasalVowelTarget]] — related work on nasal vowel targets

### Cited By (in Collection)
- [[Ruhlen_1973_NasalVowels]] — cites Beddor 1986 for perceptual experiments showing how nasal coupling shifts perceived vowel height
- [[Hawkins_Stevens_1985_NasalVowelCorrelates]] — cites Beddor 1982/1983 (dissertation version) for centre-of-gravity analysis
- [[Rossato_1998_RecoveringGesturesNasalVowels]] — cites Beddor 1982 for cross-language perception of oral-nasal distinction
- [[Recasens_2003_ArticulationSoundChangeRomance]] — cites Beddor 1983 for nasalization effects on vowel spectra and sound change
- [[Feng_1996_NasalVowelTarget]] — cites Beddor 1982 for cross-language perception study
- [[Fowler_2006_CoarticulationGesturePerception]] — cites Beddor 2002 for language-specific coarticulation patterns

### New Leads (Not Yet in Collection)
- Chistovich, L. A. & Lublinskaya, V. V. (1979) — "The 'center of gravity' effect in vowel spectra and critical distance between the formants" — foundational for the centre-of-gravity model used here
- Wright, J. (1980) — "The behavior of nasalized vowels in the perceptual vowel space" — directly tests perceptual space distortions caused by nasalisation

### Conceptual Links (not citation-based)
- [[Ruhlen_1973_NasalVowels]] — (Strong) Ruhlen documents the cross-linguistic typological patterns of nasal vowel inventories; Beddor provides the acoustic and perceptual explanation for why those patterns exist (centre-of-gravity shifts from nasal coupling)
- [[Rossato_1998_RecoveringGesturesNasalVowels]] — (Strong) Rossato attempts to recover articulatory gestures from nasal vowel acoustics; Beddor's pole-zero model of nasal coupling provides the acoustic theory underlying Rossato's inverse problem
