# The Contributions of the Lips and the Tongue to the Diachronic Fronting of High Back Vowels in Standard Southern British English

**Authors:** Jonathan Harrington, Felicitas Kleber, Ulrich Reubold
**Year:** 2011
**Venue:** Journal of the International Phonetic Association, 41(2), pp. 137-156
**DOI:** 10.1017/S0025100310000265

## One-Sentence Summary

Diachronic fronting of /u/ and /ʊ/ in Standard Southern British English (SSBE) is caused entirely by tongue advancement, NOT lip unrounding—lips remain fully rounded while tongue position has shifted to near-/i/ territory.

## Problem Addressed

F2 raising in back vowels can result from either tongue fronting OR lip unrounding (shorter vocal tract). Previous acoustic studies showed /u/ fronting in SSBE but couldn't determine which articulator was responsible. Wells (1997) suggested lip unrounding might be involved.

## Key Contributions

1. Demonstrated via 4 experiments that SSBE /u/ fronting involves tongue repositioning only, not lip unrounding
2. Showed young SSBE speakers' /u/ tongue position overlaps with /i/ while maintaining full lip rounding
3. Provided evidence that /ʊ/ (FOOT) fronting began later than /u/ (GOOSE) fronting
4. Supported coarticulation-based explanation for diachronic back vowel fronting

## Methodology

Four experiments on SSBE speakers (young: 18-22 years; old: 50+ years):

1. **Acoustic analysis of anticipatory coarticulation in /s/**: Compared spectral center of gravity of /s/ before /i/ (seep) vs /u/ (soup) across age groups
2. **Audio-visual perception**: German listeners classified video-only and cross-dubbed stimuli from young SSBE speaker
3. **Physiological lip analysis**: EMA measurement of lower lip horizontal position (LLX) during vowels
4. **Physiological tongue analysis**: EMA measurement of 3 tongue sensors (tip, mid, body) during /hVd/ words

## Key Equations

### Log Euclidean Distance Ratio (for articulator position relative to /i/ and /ɔ/)

$$
d_V = \log(E_i / E_ɔ)
$$

Where:
- $E_i$ = Euclidean distance of vowel V to speaker's mean of /i/ in DCT parameter space
- $E_ɔ$ = Euclidean distance of vowel V to speaker's mean of /ɔ/ in DCT parameter space
- $d_V = 0$: equidistant between /i/ and /ɔ/
- $d_V < 0$: closer to /i/
- $d_V > 0$: closer to /ɔ/

### Discrete Cosine Transformation (DCT) Parameterization

Used to reduce time-varying trajectories to 3 parameters:
- **DCT-0**: Proportional to signal mean
- **DCT-1**: Proportional to linear slope
- **DCT-2**: Proportional to curvature

## Parameters

| Parameter | Value | Context | Notes |
|-----------|-------|---------|-------|
| Spectral peak difference (soup vs seep) | 0.5-1 Bark lower | /s/ spectrum | Due to anticipatory lip rounding |
| /u/ F2 range (young female) | 2050-2250 Hz | who'd tokens | Fronted /u/ |
| /i/ F2 range (young female) | 2700-2880 Hz | heed tokens | Reference |
| /ɔ/ F2 (young female) | ~1060 Hz | hoard tokens | Back vowel reference |
| Video-only /u/ classified as rounded | 97.5% | German listeners | Strong lip rounding cue |
| Cross-dubbed i_aud+u_vid classified as rounded | 58% | German listeners | Lip cue shifts perception |
| EMA sampling rate | 200 Hz | Physiological data | |
| FIR filter cutoff (tongue tip) | 40-50 Hz | Movement data | |
| FIR filter cutoff (other articulators) | 20-30 Hz | Movement data | |

## Implementation Details

### SSBE Vowel Inventory (as analyzed)

| Vowel | IPA | Example | Traditional Description |
|-------|-----|---------|------------------------|
| /i/ | iː | heed, FLEECE | High front unrounded, tense |
| /ɪ/ | ɪ | hid, KIT | Mid-high front unrounded, lax |
| /u/ | uː | who'd, GOOSE | High back→FRONTED, rounded, tense |
| /ʊ/ | ʊ | hood, FOOT | Mid-high back→CENTRAL, rounded, lax |
| /ɔ/ | ɔː | hoard, THOUGHT | Mid-high back rounded |
| /ɒ/ | ɒ | hod, LOT | Low back rounded |
| /ɑ/ | ɑː | hard, PALM | Low back unrounded |

### Spectral Analysis of /s/ (Experiment 1)

1. Digitize at 44.1 kHz
2. Calculate 2048-point spectra every 5 ms
3. Mark /s/ boundaries (fricative onset to vowel periodic onset)
4. Extract spectrum at temporal midpoint
5. Convert frequency axis Hz → Bark scale
6. Apply DCT, sum first 10 coefficients for smoothing
7. Find spectral peak frequency between 2500-10000 Hz

### Lip Protrusion Measurement (Experiment 3)

1. Horizontal position of lower lip sensor (LLX) tracks lip protrusion
2. Extract LLX trajectory from vowel acoustic onset to offset
3. Apply DCT to reduce trajectory to 3 parameters (mean, slope, curvature)
4. Calculate log Euclidean distance ratio relative to /i/ and /ɔ/

### Tongue Position Analysis (Experiment 4)

1. Six parameters: horizontal + vertical positions of tongue tip, mid, body
2. Apply PCA separately per speaker to vowel midpoint data
3. PCA-1 separates front/back; PCA-2 separates high/low
4. Compare inter-vowel distances: /i-u/ vs /ɪ-ʊ/

## Figures of Interest

- **Fig 1 (p. 141):** Ensemble-averaged /s/ spectra showing 1-2 kHz lower peak for soup vs seep (lip rounding effect)
- **Fig 2 (p. 142):** Boxplots of spectral peak frequency—no age×word interaction
- **Fig 3 (p. 145):** German listeners' video-only classifications: /u/ classified 97.5% rounded
- **Fig 6 (p. 148):** LLX trajectories: /u ʊ/ pattern with /ɔ/, not /i/
- **Fig 8 (p. 150):** Tongue sensor positions showing /u ʊ/ closer to /i ɪ/ than to /ɔ ɒ/
- **Fig 9 (p. 151):** PCA space: /u/ overlaps with /i/ for 80% of speakers
- **Fig 10 (p. 152):** PCA-1 trajectories over /hVd/ words: /u/ tracks /i/, /ʊ/ is central

## Results Summary

### Experiment 1 (Anticipatory Coarticulation)
- Spectral peak 0.5-1 Bark lower for soup vs seep (both age groups)
- No significant Age × Word interaction (F(1,23)=0.5, NS)
- **Conclusion:** Young and old speakers round lips equally for /u/

### Experiment 2 (Audio-Visual Perception)
- Video-only /u/: 97.5% classified as rounded by German listeners
- Cross-dubbed /i/-audio + /u/-video: 58% classified as rounded
- No difference between /u/-video and /ɔ/-video in shifting judgments
- **Conclusion:** SSBE /u/ has strong visual lip rounding cues

### Experiment 3 (Lip Movement)
- Log Euclidean distance ratio: /u ʊ/ much closer to /ɔ/ than to /i/
- No significant difference between /u ʊ ɔ/ on lip protrusion (F(1,3)=2.1, NS)
- **Conclusion:** /u ʊ ɔ/ all equally lip-rounded

### Experiment 4 (Tongue Position)
- /u/ tongue position overlaps with /i/ for 80% of speakers
- /ʊ/ occupies central position between /i/ and /ɔ/
- Inter-vowel distance /i-u/ significantly less than /ɪ-ʊ/ (F(1,4)=23.1, p<.01)
- **Conclusion:** /u/ fronted more than /ʊ/; /ʊ/-fronting is more recent

## Limitations

1. Only 5 speakers in physiological experiments
2. Audio-visual experiment used only 1 young speaker
3. No direct comparison of tongue position between age groups (only young speakers in EMA study)
4. German listeners used—cross-linguistic perception differences possible
5. Materials limited to /hVd/ contexts

## Relevance to Project

### For TTS Formant Synthesis (Qlatt)

1. **Vowel targets for British English:** If implementing SSBE, /u/ should have:
   - F2 nearly as high as /i/ (due to tongue fronting)
   - F1 similar to traditional /u/ (lip rounding maintained)
   - This is acoustically similar to German /y/ but not identical

2. **Coarticulation modeling:** The paper supports strong coarticulatory effects of consonants on /u/:
   - Alveolar consonants pull /u/ forward synchronically
   - Young speakers show less allophonic variation (fronted in all contexts)
   - Older speakers show more context-dependent /u/ positions

3. **Lax vs Tense vowels:** /ʊ/ (FOOT) is more central than /u/ (GOOSE) in current SSBE
   - Different formant targets needed for /ʊ/ vs /u/
   - /ʊ/ may be in transition—formant values still shifting

4. **F2 raising mechanism:** F2 can be raised by:
   - Tongue fronting (what's happening in SSBE)
   - Lip unrounding (shorter vocal tract)
   - For synthesis, both parameters affect F2—need to model correctly

### Specific Formant Implications

For young SSBE female speakers (from this study):
- /u/ F2: ~2050-2250 Hz (highly fronted)
- Compare to traditional back /u/: ~800-1000 Hz F2

This represents a massive ~1000+ Hz shift in F2 while maintaining lip rounding.

## Open Questions

- [ ] What are the exact formant values for fronted SSBE /u/ vs traditional back /u/?
- [ ] How does /u/-fronting interact with preceding consonant place in synthesis?
- [ ] Should TTS systems model age-related variation in /u/ backness?
- [ ] How to model the /i/-/u/ distinction when tongue positions overlap?

## Related Work Worth Reading

- Lindblom & Sundberg (1971) - Acoustic consequences of lip, tongue, jaw movement
- Stevens & House (1963) - Consonantal perturbation of vowel articulations
- Hawkins & Midgley (2005) - Formant frequencies of RP monophthongs by age
- Harrington et al. (2008) - Compensation for coarticulation and /u/-fronting
- Perkell et al. (1993) - Tongue-body raising and lip rounding trading relations for /u/
- Ohala (1981, 1993) - Listener as source of sound change; phonetic basis of sound change

## Key Quotes

> "Traditionally classified as back and rounded, these vowels [tense /u/ and lax /ʊ/] are not only losing their lip-rounding but also ceasing to be very back. Thus spoon, conservatively [spuːn], may now range to a loosely rounded [spʊ̈n] or even [spɪ̈n]" — Wells (1997), **contradicted by this study**

> "The sound change has involved a shift in which these vowels used to be differentiated based on both lingual and labial features some 50 years ago to one in which the importance for the /i–u/ distinction of the lingual feature has waned and the labial feature has strengthened." (p. 153)

> "There is no evidence that the SSBE diachronic shift in /u ʊ/ has involved an unrounding of the lips." (p. 155)
