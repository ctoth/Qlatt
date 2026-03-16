---
title: "Delattre, Liberman & Cooper (1955) — Acoustic Loci and Transitional Cues for Consonants"
year: 1955
source: "JASA 27(4), 769–773. DOI: 10.1121/1.1908024"
---

# Delattre, Liberman & Cooper (1955) — Acoustic Loci and Transitional Cues for Consonants

## Key Concept: Formant Locus Theory

Each stop consonant has a characteristic fixed frequency position ("locus") for the second formant, corresponding to its articulatory place of production. Formant transitions are "movements" from the locus toward the steady-state frequency of the following vowel.

## Second-Formant Loci (F2)

| Consonant | Place of Articulation | F2 Locus (Hz) | Notes |
|-----------|----------------------|---------------|-------|
| /b/ | bilabial | 720 | Slightly less compelling than /d/ |
| /d/ | alveolar | 1800 | Most compelling, clearest locus |
| /g/ | velar | 3000 | Only works when adjacent vowel F2 > ~1200 Hz |

- At ~1320 Hz, the consonant identity is ambiguous (indifferently b, d, or g).
- The /g/ locus breaks down for back vowels (F2 < 1200 Hz) — no single locus serves all vowels. This reflects the variable articulatory place of /g/ but the acoustic discontinuity is sharper than the articulatory displacement.
- Loci were determined using straight (flat) second formants paired with rising first-formant transitions, across 65 vowel combinations.

## First-Formant Locus (F1)

- F1 locus is the **same for all voiced stops** (b, d, g): approximately 240 Hz or below (between 240 Hz and 0 Hz).
- F1 locus is related to **manner** of articulation, not place.
- Stronger stop consonant impression when F1 starts at lowest frequency (120 cps on their playback) and rises to vowel steady-state.

## Silent Interval (Closure) Requirement

Critical finding: transitions **cannot begin at the locus** and go directly to the vowel steady state. The first portion of the transition must be **silent** (closure interval).

### Optimal silent interval parameters:

| Total locus-to-steady-state interval (ms) | Best silent interval (ms) | Ratio |
|-------------------------------------------|--------------------------|-------|
| 80 | ~40 | 0.50 |
| 100 | ~50 | 0.50 |
| 120 | ~60 | 0.50 |

**Rule: Best silent interval ≈ half the total interval from locus to steady state.**

- Total intervals of 60 ms or less do not produce good /d/ at any silent interval.
- For /b/ and /g/, best results at total intervals of 80–100 ms.
- At 120 ms total, /b/ and /g/ are relatively poor.
- At 40–60 ms total, /g/ loses more clarity than /b/.

### What happens without the silent interval (transition from locus):

Starting from /d/ locus (1800 Hz) without silent interval:
- F2 steady state 2520–2040 Hz → heard as /b/
- F2 steady state 1920–1560 Hz → heard as /d/
- F2 steady state 1440–1200 Hz → heard as /g/
- F2 steady state < 1200 Hz → heard as /d/ again

Starting from /b/ locus (720 Hz) without silent interval:
- F2 steady state 2520–1440 Hz → heard as /bw/
- F2 steady state 1220–960 Hz → vaguely /gw/
- /d/ never heard in this series

## Generalization to Other Consonants

The same F2 locus applies to all consonants sharing the same place of articulation:
- **Bilabial** (720 Hz): /b/, /p/, /m/, /w/
- **Alveolar** (1800 Hz): /d/, /t/, /n/
- **Velar** (3000 Hz): /g/, /k/, /ŋ/

Different manner classes may differ in the **silent interval** requirement:
- Stops: ~50% of total interval must be silent
- Semivowels (e.g., /w/): transition can go all the way from locus to steady state (no silent interval needed)

## Third-Formant Loci

Preliminary evidence suggests F3 loci exist for place of articulation but results were less clear than F2; more sensitive techniques needed.

## Implementation Notes for Klatt Synthesizer

### Formant transition targets for consonant place

These locus values directly inform the F2 onset frequency for consonant-vowel transitions:
- Use F2 = 720 Hz onset for bilabials
- Use F2 = 1800 Hz onset for alveolars
- Use F2 = 3000 Hz onset for velars (only for front/mid vowels with F2 > 1200 Hz)
- For velars before back vowels, the locus concept breaks down — need vowel-dependent F2 targets

### Closure/burst timing

The finding that the best silent interval is ~50% of the total transition duration directly relates to how closure duration and VOT should be set relative to formant transition duration in synthesis.

### F1 transition

F1 should always start low (~150–240 Hz) for stop consonants regardless of place, then rise to the vowel target. This is a manner cue, not a place cue.

## Experimental Method

- Hand-painted spectrograms converted to sound via Haskins Laboratories pattern playback
- Two-formant patterns: each formant = 3 contiguous harmonics of 120-Hz fundamental
- Central harmonic 6 dB louder than flanking harmonics
- Transitions always in syllable-initial position
- Listeners: the three authors (not naive listeners for the main locus experiments)

## Collection Cross-References

### Already in Collection
- `Cooper_1952_PerceptionSyntheticSpeech` — predecessor Haskins perception experiments

### Cited By (in Collection)
- `Halle_1957_AcousticPropertiesStops` — cites Delattre et al. for Haskins transition experiments
- `Broad_Clermont_1987_VowelFormantContoursCVC` — uses locus concept throughout
- `Fant_1960_AcousticTheorySpeechProduction` — references locus concept
- `Ohman_1966_CoarticulationVCV` — builds on locus theory for coarticulation model
- `Stevens_1955_QuantitativeVowelArticulation` — references Delattre for transition cues
- `Stevens_House_1956_FormantTransitionsVocalTract` — extends locus concept with vocal tract analog
- `Holmes_1964_SpeechSynthesisRule` — uses locus values for synthesis rules
- `Heinz_1961_PropertiesVoicelessFricatives` — references Delattre for consonant spectral analysis
- `Blumstein_Stevens_1979_AcousticInvariance` — contrasts locus theory with spectral invariance
- `Blumstein_1977_PropertyDetectorsBurstsTransitions` — tests locus theory predictions

### Now in Collection
- `Nakata_1959_SynthesisPerceptionNasals` — uses locus concept for nasal place cues

### Conceptual Links (not citation-based)
- `Stevens_House_1963_PerturbationVowelConsonant` — both study consonant-vowel acoustic relationships; Delattre from perceptual locus perspective, Stevens & House from production/undershoot perspective
- `Gay_1977_ArticulatoryMovementsVCV` — articulatory evidence for the acoustic transitions Delattre characterized perceptually
