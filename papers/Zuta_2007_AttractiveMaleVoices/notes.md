# Phonetic Criteria of Attractive Male Voices

**Authors:** Vivien Zuta
**Year:** 2007
**Venue:** ICPhS XVI (Saarbrücken, 6-10 August 2007), ID 1021
**Pages:** 1837-1840

## One-Sentence Summary
Identifies acoustic parameters (F0 modulation, nasality, pause structure, hesitation frequency) that distinguish attractive from unattractive German male voices as judged by female listeners.

## Problem Addressed
Tests the folk assumption that "deep voices are attractive" and seeks to identify which acoustic parameters actually correlate with female judgments of male voice attractiveness.

## Key Contributions
- Disproves that low F0 alone predicts male voice attractiveness
- Shows F0 *modulation* (standard deviation) matters more than F0 mean
- Identifies nasality (LTAS dip at ~2.8 kHz) as a strong negative predictor
- Quantifies pause and hesitation patterns that correlate with attractiveness ratings
- Suggests "closeness to a standard voice" (Hollien's "0-Voice") is the overarching principle

## Methodology
- 6 German male speakers narrated "Little Red Riding Hood"
- Female listeners rated voices on attractiveness and quality via questionnaire
- Speakers divided into "more attractive voices" (MAV, n=3) and "less attractive voices" (LAV, n=3)
- Acoustic analysis conducted manually and with Praat
- Parameters measured from continuous speech and from cardinal vowels [a:], [e:], [i:], [o:], [u:]

## Parameters

| Parameter | LAV (mean) | MAV (mean) | Direction | Notes |
|-----------|-----------|-----------|-----------|-------|
| Mean F0 | 110 Hz | 112 Hz | No significant diff | Disproves "deep = attractive" |
| F0 Std Dev | 18 Hz | 24 Hz | Higher → more attractive | Range: LAV 16-21 Hz, MAV 19-29 Hz |
| F0 Coeff of Variation | Lower | Higher | Higher → more attractive | CV = σ/μ |
| F2 (avg across vowels) | baseline | +53 Hz vs LAV | Higher F2 → more attractive | Suggests greater articulatory effort |
| F1 | — | — | No significant pattern | |
| LTAS dip at 2.8 kHz | Present (all LAV) | Absent (all MAV) | Dip → less attractive | Interpreted as nasality marker (cf. Nolan 1983) |
| Avg pause length | 0.3-0.8 s (variable) | ~0.6 s (consistent) | Moderate/consistent → attractive | |
| Pause-free interval | 3.7 s | 2.9 s | Shorter → more attractive | |
| Hesitations/min | 11 | 5 | Fewer → more attractive | Range: LAV up to 12/min, MAV as low as 3/min |
| Avg hesitation duration | 0.8 s (worst) | 0.3 s (best) | Shorter → more attractive | |
| Hesitation-free interval | 4.9 s | 14.1 s | Longer → more attractive | |
| Speech rate | — | — | ~0.2 syl/s diff (incl. pauses) | Not significant |
| Articulation speed | — | — | ~0.4 syl/s diff (excl. pauses) | Not significant |

### Individual Speaker F0 Data (Table 1)

| Speaker | Mean F0 (Hz) | F0 Std Dev (Hz) | Group |
|---------|-------------|-----------------|-------|
| 1 | 117 | 21 | LAV |
| 2 | 101 | 17 | LAV |
| 3 | 113 | 16 | LAV |
| 4 | 134 | 29 | MAV |
| 5 | 108 | 26 | MAV |
| 6 | 94 | 19 | MAV |

## Key Findings Detail

### F0 Modulation vs Mean F0
The mean F0 difference between groups is negligible (110 vs 112 Hz). The most attractive voice had F0=134 Hz (well above average male range), the deepest voice (101 Hz) was in the unattractive group. What matters is F0 standard deviation: MAV average 24 Hz vs LAV average 18 Hz. Monotonous voices are disfavored.

### LTAS and Nasality
All LAV speakers showed a spectral dip at ~2.8 kHz; no MAV speakers did. Compared against Nolan (1983), this dip indicates higher nasality. Nasality degrades attractiveness. This is consistent with the "0-Voice" principle — deviations from neutral voice quality reduce attractiveness.

### Pause Structure
Most speakers cluster around 0.6 s average pause duration. Deviations (0.3 s or 0.8 s) occurred only in LAV. Shorter pause-free intervals (2.9 s MAV vs 3.7 s LAV) correlate with attractiveness — suggesting moderate phrasing is preferred over long unbroken stretches.

### Hesitations
The strongest differentiator: MAV had 5 hesitations/min vs LAV 11/min. Hesitation-free intervals were nearly 3× longer in MAV (14.1 s vs 4.9 s). Longer hesitations also correlate with lower attractiveness.

## Limitations
- Very small sample (6 speakers, group size n=3)
- Only German male speakers with female listeners from same region
- No control for dialect/sociolect effects (attempted to minimize by geographic matching)
- No statistical significance testing reported for most comparisons
- Causal direction unclear (attractiveness perception vs. parameter correlation)
- F2 finding acknowledged as needing further study
- Speech rate and articulation speed inconclusive

## Testable Properties
- F0 standard deviation in range [19, 29] Hz for "attractive" male voice presets
- Absence of spectral dip at ~2.8 kHz (nasality check) for attractive voices
- Hesitation rate < 5/min for attractive speech
- Pause-free interval around 2.5-3.5 s for natural-sounding phrasing
- Pause duration clustering around 0.6 s for standard voice quality

## Relevance to Project
Provides empirical data on which acoustic parameters make male voices perceptually attractive, potentially useful for:
1. Voice preset design — F0 modulation targets, nasality avoidance
2. Prosody rule validation — pause structure, F0 variation ranges
3. Voice quality assessment — LTAS nasality check at 2.8 kHz
4. The "0-Voice" concept (closeness to standard) as a design principle for neutral presets

The F0 modulation finding (σ ≈ 24 Hz for attractive vs 18 Hz for unattractive) directly relates to prosody rule parameters for F0 contour generation.

## Open Questions
- [ ] How does the 2.8 kHz LTAS dip map to Klatt synthesizer nasal coupling parameters?
- [ ] Would the F0 modulation findings generalize to English speakers?
- [ ] How to operationalize "closeness to 0-Voice" as a synthesis quality metric?

## Collection Cross-References

### Already in Collection
- **Babel_2014_VocalAttractiveness** — directly related: investigates similar question (acoustic predictors of attractiveness) with larger sample, English speakers, both genders. Finds F0 alone is poor predictor (consistent with Zuta), but identifies spectral tilt and breathiness as key.
- **Collins_2003_VocalVisualAttractiveness** — related: female vocal attractiveness, but provides formant-attractiveness correlations
- **Gobl_2003_VoiceQualityEmotion** — tangentially related: voice quality perception, Ní Chasaide & Gobl cited in Zuta [6]
- **Hanson_1999_GlottalMaleSpeakers** — related: male glottal characteristics, relevant to the nasality/voice quality findings
- **Simpson_2009_PhoneticGenderDifferences** — related: gender differences in phonetic parameters

### New Leads (Not Yet in Collection)
- Nolan, F. 1983 — *The phonetic bases of speaker recognition* — relevant for LTAS nasality interpretation
- Hollien, H. 1971 — "Three major vocal registers: a proposal" — source of "0-Voice" concept
- Dommelen & Moxness 1995 — acoustic parameters in speaker height/weight identification
- Koreman 2006 — perceived speech rate effects

### Supersedes or Recontextualizes
- **Babel_2014_VocalAttractiveness** — Babel's larger study (60 speakers, English) largely supersedes Zuta's findings with better statistical power, but Zuta's LTAS nasality finding and pause/hesitation analysis provide unique contributions not in Babel.
