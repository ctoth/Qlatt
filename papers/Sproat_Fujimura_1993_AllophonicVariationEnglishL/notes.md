---
title: "Allophonic Variation in English /l/ and its Implications for Phonetic Implementation"
authors: "Richard Sproat, Osamu Fujimura"
year: 1993
venue: "Journal of Phonetics, Vol. 21, pp. 291-311"
doi_url: "10.1016/S0095-4470(19)31340-3"
---

# Allophonic Variation in English /l/ and its Implications for Phonetic Implementation

## One-Sentence Summary
Provides articulatory (X-ray microbeam) and acoustic evidence that English /l/ varies continuously between light and dark allophones as a function of syllable position and pre-boundary rime duration, with a key timing metric (Tip Delay) that predicts the darkness gradient.

## Problem Addressed
English /l/ has traditionally been classified into at least two allophones: light (syllable-initial) and dark (syllable-final). Previous work treated these as categorical. This paper investigates whether the distinction is genuinely categorical or represents a gradient continuum, and provides articulatory and acoustic data to settle the question and explain the phonetic implementation.

## Key Contributions
- Demonstrates that light and dark /l/ are NOT categorically distinct; they form a gradient continuum controlled by syllable position and prosodic boundary duration
- Introduces the **Tip Delay** metric: the temporal interval between the dorsal retraction extremum and the apical tip extremum, which continuously predicts /l/ darkness
- Shows that pre-boundary rime duration correlates with /l/ quality -- longer pre-boundary times yield darker /l/s
- Proposes that /l/ involves two independent gestural components: a **vocalic dorsal gesture** (tongue body retraction/lowering) and a **consonantal apical gesture** (tongue tip raising), with their relative timing determining allophonic quality
- Provides acoustic data (F1, F2, F3 formant frequencies) for light vs dark /l/ across multiple speakers

## Methodology
- **Data collection**: X-ray microbeam articulatory data from University of Wisconsin, recording pellet positions on tongue tip, tongue body, and other articulators
- **Speakers**: 4 speakers of Midwestern American English (CS, CH, DR, RS) plus 1 speaker of British English (AS)
- **Stimuli**: Sentences with /l/ in various pre-boundary positions across different boundary types (IP, VP, compound, word, clitic, syllable) and varying prosodic contexts
- **Measurements**: Both articulatory (pellet displacement trajectories) and acoustic (formant frequencies F1, F2, F3 at /l/ midpoint using LPC)
- **Key innovation**: The **Tip Delay** measure = [Tip Extremum time] - [Mid Lowering Extremum time], where positive values indicate the dorsal gesture precedes the tip gesture (dark /l/) and negative values indicate the tip precedes the dorsal (light /l/)

## Key Equations

**Tip Delay definition:**

$$
\text{Tip Delay} = t(\text{Tip Extremum}) - t(\text{Mid Lowering Extremum})
$$

Where:
- Tip Extremum = time of maximum vertical displacement of tongue tip pellet
- Mid Lowering Extremum = time of maximum lowering of tongue mid (dorsal) pellet

**Interpretation:**
- Tip Delay > 0: dorsal gesture precedes tip gesture (dark /l/, syllable-final)
- Tip Delay < 0: tip gesture precedes dorsal gesture (light /l/, syllable-initial)
- Tip Delay ~ 0: intermediate quality

## Parameters

| Name | Symbol | Units | Typical Values | Notes |
|------|--------|-------|----------------|-------|
| F1 at /l/ | F1 | Hz | 350-550 | Higher for dark /l/ |
| F2 at /l/ | F2 | Hz | 800-1400 | Key discriminator: low F2 = dark, high F2 = light |
| F3 at /l/ | F3 | Hz | 2200-3200 | Lower for dark /l/ |
| Tip Delay | - | seconds | -0.05 to +0.15 | Negative = light, positive = dark |
| Pre-boundary rime duration | - | seconds | 0.10-0.45 | Longer rime = darker /l/ |

### Acoustic Data from Table III (page 299, approximate means across speakers)

**Light /l/ (canonical, syllable-initial):**
- F2: ~1200-1400 Hz (varies by speaker)
- F3: ~2800-3200 Hz

**Dark /l/ (canonical, syllable-final):**
- F2: ~800-1000 Hz
- F3: ~2200-2600 Hz

**Key acoustic correlate**: F2 is the primary acoustic discriminator between light and dark /l/. Dark /l/ has substantially lower F2 (by 200-600 Hz) than light /l/.

### Table III Data (from page 299) - Mean formant values

| Speaker | Light F2 (Hz) | Dark F2 (Hz) | Light F3 (Hz) | Dark F3 (Hz) |
|---------|---------------|--------------|---------------|--------------|
| CS | ~1300 | ~950 | ~2900 | ~2500 |
| CH | ~1200 | ~850 | ~2800 | ~2400 |
| DR | ~1400 | ~1000 | ~3000 | ~2600 |
| RS | ~1350 | ~900 | ~2900 | ~2400 |
| AS (British) | ~1100 | ~800 | ~2700 | ~2200 |

*Note: These values are approximate, extracted from the table which was partially obscured. The pattern is consistent: dark /l/ shows F2 approximately 300-500 Hz lower than light /l/.*

## Implementation Details

### Gestural Timing Model for /l/
1. English /l/ consists of two independent gestures:
   - **Consonantal gesture**: tongue tip raising toward alveolar ridge (apical)
   - **Vocalic gesture**: tongue body retraction and lowering (dorsal)
2. In **syllable-initial** (light) /l/: tip gesture precedes dorsal gesture; the apical closure is achieved before dorsal retraction fully develops
3. In **syllable-final** (dark) /l/: dorsal gesture precedes tip gesture; tongue body retracts/lowers first, then tip rises
4. The relative timing is **gradient**, not categorical -- controlled by prosodic context

### Boundary Strength Effects
- Stronger prosodic boundaries yield lighter /l/ before the boundary
- The "+" boundary (clitic/compound) shows intermediate /l/ quality
- Pre-boundary rime duration is the best single predictor of /l/ quality

### For Klatt Synthesis
- Dark /l/ requires lowered F2 (~800-1000 Hz) and lowered F3 (~2200-2600 Hz) compared to light /l/ (F2 ~1200-1400, F3 ~2800-3200)
- F1 is slightly higher in dark /l/ (~450-550 Hz) vs light /l/ (~350-450 Hz)
- The darkness of /l/ should vary as a function of syllable position:
  - Syllable-initial /l/: use light formant targets
  - Syllable-final /l/: use dark formant targets
  - The transition between targets is gradient, modulated by prosodic context
- Pre-boundary lengthening environments produce darker /l/s

### Correlation of Tip Delay with Pre-boundary Rime Duration (Table IV, page 300)
The correlation between rime duration and various articulatory measures was computed for each speaker. Key finding: the quality of pre-boundary /l/ is strongly correlated with the duration of the pre-boundary rime.

| Speaker | Corr(F2, rime dur) | Corr(Tip Delay, rime dur) |
|---------|--------------------|-----------------------------|
| CS | ~0.40 | ~0.39 |
| CH | ~0.42 | ~0.43 |
| DR | ~0.63 | ~0.57 |
| RS | ~0.71 | ~0.51 |
| AS | ~0.47 | ~0.36 |

All correlations significant at p < 0.05 for at least half the speakers.

## Figures of Interest
- **Fig 1 (page 301):** Scatter plots showing correlation between F2 and pre-boundary rime duration. Clear linear relationship: longer rime = lower F2 (darker /l/)
- **Fig 2 (page 302):** Plots of [Dorsum Retraction Extremum] and [Tip Delay] vs pre-boundary rime duration, showing linear relationships
- **Fig 3 (page 303):** Plot of Tip Delay vs pre-boundary rime duration for speaker CS. In lighter /l/s, Tip Extremum precedes Mid Lowering Extremum (negative Tip Delay). In darker /l/s, this reverses (positive Tip Delay).
- **Fig 4 (page 307):** Schematic illustration of gestural timing for light vs dark /l/, showing how dorsal and apical gestures shift in temporal alignment depending on syllable position and available rime duration

## Results Summary
1. The difference between light and dark /l/ is **gradient**, not categorical
2. F2 at /l/ midpoint varies continuously with pre-boundary rime duration
3. Articulatory data confirms: the tongue body retraction (dorsal) gesture extends earlier and is more extreme in dark /l/
4. Tip Delay metric captures the gestural reorganization: positive for dark, negative for light
5. The gradient is driven by **prosodic duration** -- longer syllable-final rimes give the dorsal gesture more time to develop, producing darker /l/
6. Cross-linguistically, languages may differ in whether they exhibit this gradient (British English shows darker /l/s in syllable-final position than American English for the same contexts)

## Limitations
- Only 5 speakers (4 American, 1 British)
- X-ray microbeam data limited to midsagittal plane -- lateral tongue contact not measured
- Acoustic measurements taken at /l/ midpoint only -- no trajectory data
- The paper notes that the "putative allophone" (dark /l/) does not appear to be a separate categorical entity, but acknowledges more extensive articulatory data would strengthen the claim
- The articulatory model (two gestures) is simplified; real tongue movements are more complex

## Testable Properties
- F2 of syllable-final /l/ must be lower than F2 of syllable-initial /l/ (by approximately 200-500 Hz)
- F3 of syllable-final /l/ must be lower than F3 of syllable-initial /l/ (by approximately 200-600 Hz)
- Increasing pre-boundary duration should correlate with lower F2 at /l/
- Dark /l/ F2 target should be in range 800-1000 Hz; light /l/ F2 target in range 1200-1400 Hz
- Dark /l/ F3 should be approximately 2200-2600 Hz; light /l/ F3 approximately 2800-3200 Hz
- The allophonic distinction is gradient: intermediate values should exist for /l/ in intermediate prosodic positions

## Relevance to Project
This paper is directly cited in Qlatt's dark-L allophony rule (frontend.yaml) and inventory.yaml for syllable-final /l/ darkening. It provides:
1. **Acoustic targets**: Specific F2 and F3 ranges for light vs dark /l/ to use in formant synthesis
2. **Conditioning environment**: The syllable-position rule (initial = light, final = dark) with gradient modulation by prosodic boundary strength
3. **Theoretical grounding**: The two-gesture model (dorsal + apical) explains WHY dark /l/ has the formant pattern it does -- the tongue body retraction lowers F2 and F3

For the Qlatt declarative frontend, the key implementation is:
- Syllable-initial /l/: F2 ~1300 Hz, F3 ~2900 Hz
- Syllable-final /l/: F2 ~900 Hz, F3 ~2400 Hz
- These values are consistent with Recasens (2012) data that is also cited in the project

## Open Questions
- [ ] How should the gradient be implemented? Simple binary (initial vs final) or continuous based on rime duration?
- [ ] What F1 targets to use? Paper gives less clear F1 data
- [ ] Should British English dark /l/ values be different from American English values?
- [ ] How does this interact with vowel coarticulation (the paper shows vowel context affects /l/ quality)?

## Related Work Worth Reading
- Giles & Moll (1975) - Cinefluorographic study of /l/ allophones
- Browman & Goldstein (1992) - Articulatory phonology, gestural model foundation
- Catford (1977) - Vocoid vs contoid distinction relevant to /l/ dual gesture nature
- Recasens (2012) - Cross-language lateral allophone study (already in collection)
- Carter & Local (2007) - More recent articulatory data on /l/
- Lehiste (1964) - Acoustic phonetics data

## Collection Cross-References

### Already in Collection
- [[Recasens_2012_LateralAllophones]] - Cross-language acoustic study of /l/ allophones, provides complementary F2 data (threshold ~1300-1400 Hz for clear/dark distinction). Sproat & Fujimura provides articulatory grounding for the acoustic patterns Recasens documents.
- [[Iskarous_Pouplier_2022_ArticulatoryPhonologyAppraisal]] - Reviews Articulatory Phonology framework that Sproat & Fujimura apply. The two-gesture model for /l/ is an example of the gestural overlap discussed there.
- [[Dalston_1975_SonorantAcoustics]] - Provides acoustic data on /l/ including formant frequencies and transition durations. Sproat & Fujimura extends this with articulatory data and the gradient allophony finding.
- [[Volenec_2015_Coarticulation]] - Reviews coarticulation frameworks. Sproat & Fujimura's /l/ data exemplifies how coarticulation interacts with allophonic variation.
- [[Recasens_1997_LingualCoarticulationDAC]] - DAC model predicts coarticulation based on tongue dorsum involvement. Dark /l/ has high DAC value, explaining its strong coarticulatory resistance.
- [[Hertz_1991_StreamsPhonesTransitions]] - Referenced for multi-stream phonological representation
- [[Saltzman_1989_DynamicalGesturalPatterning]] — the task-dynamic model providing the formal gestural overlap framework that Sproat & Fujimura's two-gesture /l/ analysis depends on

### New Leads (Not Yet in Collection)
- Giles & Moll (1975) - Cinefluorographic /l/ study, foundational articulatory data
- Browman & Goldstein (1990, 1992) - Articulatory phonology framework, gestural overlap theory
- Catford (1977) - "Fundamental problems in phonetics" - vocoid/contoid distinction
- Carter & Local (2007) - More recent articulatory /l/ data
- Hardcastle & Barry (1985) - Articulatory/electropalatographic data on /l/

### Supersedes or Recontextualizes
- [[Recasens_2012_LateralAllophones]]: Sproat & Fujimura provides the articulatory mechanism underlying Recasens' acoustic observations. The two-gesture timing model explains WHY F2 varies with syllable position.
