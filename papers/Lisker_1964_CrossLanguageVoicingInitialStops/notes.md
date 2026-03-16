---
title: "Lisker & Abramson 1964 — Implementation Notes"
authors: "Leigh Lisker & Arthur S. Abramson"
year: 1964
venue: "Word, 20:3, 384-422"
doi_url: "10.1080/00437956.1964.11659830"
---

# Lisker & Abramson 1964 — Implementation Notes

## Core Concept: Voice Onset Time (VOT)

VOT is defined as the time interval between the release of the stop (burst) and the onset of periodic glottal vibration (voicing). This is the foundational definition used throughout phonetics.

**Sign convention:**
- **Negative VOT (voicing lead):** voicing begins *before* release (prevoiced stops)
- **Zero VOT:** voicing begins at the moment of release
- **Positive VOT (voicing lag):** voicing begins *after* release (aspirated stops)

**Measurement reference point:** The instant of oral release is assigned time zero. Release = abrupt onset of energy in the formant frequency range.

**Measurement precision:** Rounded to nearest 5 ms.

## Three Cross-Language VOT Modes

Across all 11 languages, stop categories cluster into three regions along the VOT continuum:

| Mode | VOT Range (median) | Description |
|------|-------------------|-------------|
| Voicing lead | -125 to -75 ms (median ~-100 ms) | Voiced stops (prevoiced) |
| Short lag | 0 to +25 ms (median ~+10 ms) | Voiceless unaspirated |
| Long lag | +60 to +100 ms (median ~+75 ms) | Voiceless aspirated |

**Key finding:** These three modes are universal — all 11 languages select their stop categories from these same three regions.

## VOT Values by Language — Isolated Words

### Two-category languages (voiced vs voiceless unaspirated)

**American English** (Table 6, 4 speakers):

| | /b/ | /p/ | /d/ | /t/ | /g/ | /k/ |
|---|---|---|---|---|---|---|
| Av. | 1/-101 | 58 | 5/-102 | 70 | 21/-88 | 80 |
| R. | 0.5/-130:-20 | 20:120 | 0.25/-155:-40 | 30:105 | 0.35/-150:-60 | 50:135 |
| N. | 51/17 | 102 | 63/13 | 116 | 53/13 | 84 |

Note: English /b d g/ show bimodal distribution — some speakers produce voicing lead, others short lag. Two sets of values given (lag/lead).

**Dutch** (Table 1, 1 speaker):

| | /b/ | /p/ | /d/ | /t/ | /k/ |
|---|---|---|---|---|---|
| Av. | -85 | 10 | -80 | 15 | 25 |

**Puerto Rican Spanish** (Table 2, 2 speakers):

| | /b/ | /p/ | /d/ | /t/ | /g/ | /k/ |
|---|---|---|---|---|---|---|
| Av. | -138 | 4 | -110 | 9 | -108 | 29 |

**Hungarian** (Table 3, 2 speakers):

| | /b/ | /p/ | /d/ | /t/ | /g/ | /k/ |
|---|---|---|---|---|---|---|
| Av. | -90 | 2 | -87 | 16 | -58 | 29 |

**Tamil** (Table 4, 1 speaker):

| | /b/ | /p/ | /d/ | /t/ | /g/ | /k/ |
|---|---|---|---|---|---|---|
| Av. | -74 | 12 | -78 | 8 | -62 | 24 |

**Cantonese** (Table 5, 1 speaker) — two-category but both positive:

| | /p/ | /ph/ | /t/ | /th/ | /k/ | /kh/ |
|---|---|---|---|---|---|---|
| Av. | 9 | 77 | 14 | 75 | 34 | 87 |

### Three-category languages (voiced, voiceless unaspirated, voiceless aspirated)

**Eastern Armenian** (Table 7, 1 speaker):

| | /b/ | /p/ | /ph/ | /d/ | /t/ | /th/ | /g/ | /k/ | /kh/ |
|---|---|---|---|---|---|---|---|---|---|
| Av. | -96 | 3 | 78 | -102 | 15 | 59 | -115 | 30 | 98 |

**Thai** (Table 8, 3 speakers):

| | /b/ | /p/ | /ph/ | /d/ | /t/ | /th/ | /k/ | /kh/ |
|---|---|---|---|---|---|---|---|---|
| Av. | -97 | 6 | 64 | -78 | 9 | 65 | 25 | 100 |

**Korean** (Table 9, 1 speaker) — all three categories have positive VOT:

| | /p/ | /pc/ | /ph/ | /t/ | /tc/ | /th/ | /k/ | /kc/ | /kh/ |
|---|---|---|---|---|---|---|---|---|---|
| Av. | 7 | 18 | 91 | 11 | 25 | 94 | 19 | 47 | 126 |

### Four-category languages (voiced, voiced aspirated, voiceless, voiceless aspirated)

**Hindi** (Table 10, 1 speaker):

| | /b/ | /bh/ | /p/ | /ph/ | /d/ | /dh/ | /t/ | /th/ |
|---|---|---|---|---|---|---|---|---|
| Av. | -85 | -61 | 13 | 70 | -87 | -87 | 15 | 67 |

VOT alone does not separate voiced unaspirated from voiced aspirated in Hindi/Marathi — these overlap in the -60 to -90 ms range.

## VOT and Place of Articulation

Velars consistently show higher positive VOT values than labials and dentals/alveolars. This is observed across all languages. The effect is attributed to the shorter cavity behind the velar closure point, leading to faster pressure equalization.

**Typical VOT ordering:** labial < dental/alveolar < velar (for voiceless categories)

## Sentence vs. Isolated Word Effects

- VOT values in sentences are compressed compared to isolated words
- Both lead and lag values are reduced in magnitude
- Non-initial voiced stops often show unbroken voicing from preceding voiced context
- The basic category separations are maintained in connected speech

## Implementation Parameters for Klatt Synthesizer

### VOT targets for American English (from Table 6 and Table 17)

For a Klatt synthesizer, VOT maps to the timing of:
- AV (voicing amplitude) onset relative to burst
- AH (aspiration amplitude) during the lag interval
- AF (frication amplitude) at burst onset

**Recommended VOT values for English (isolated words, averaged across places):**

| Category | VOT (ms) | Synthesizer action |
|----------|----------|-------------------|
| /b d g/ (short lag) | 0-10 ms | AV onset nearly simultaneous with burst; minimal AH |
| /p t k/ (aspirated) | 50-80 ms (labial~58, alveolar~70, velar~80) | AH active during lag interval; AV onset delayed |

**For connected speech, reduce these values by ~20-30%.**

### Place-dependent VOT adjustments (from English Table 6):
- Labial /p/: ~58 ms aspiration lag
- Alveolar /t/: ~70 ms aspiration lag
- Velar /k/: ~80 ms aspiration lag

### Key timing parameters:
- **Burst duration:** ~5-10 ms (implicit from spectrogram description)
- **Aspiration noise:** Present during entire voicing lag for /p t k/; frequency content concentrated at F2-F3 region
- **Voicing lead for /b d g/:** In citation-form words, English speakers may produce either short lag (0-10 ms) or voicing lead (-60 to -130 ms), with individual speaker consistency

## Acoustic Correlates Beyond VOT

The paper notes several features that co-vary with VOT but are not its primary focus:
1. **F1 cutback** — delay in onset of first formant relative to higher formants
2. **Burst intensity** — differences in buccal air pressure
3. **Aspiration noise** — turbulent noise during voicing lag, concentrated at higher formant frequencies
4. **Voiced aspiration/breathy voice** — characterizes voiced aspirates in Hindi/Marathi

## Glottal Mechanism Discussion (Section IV)

- Voice onset is not simply a matter of whether there is laryngeal vibration
- The speaker makes muscular adjustments to set conditions for vibration when sufficient airflow is supplied
- Myoelastic-aerodynamic theory explains voicing onset: when subglottal pressure is sufficient and glottis is appropriately adducted, vocal folds are blown apart then snap back
- F0 is regulated by vocal fold length, mass, and tension plus air pressure
- For aspirated stops: glottis opens wide for the burst, then closes to initiate voicing — the lag represents the time for this glottal gesture
- For voiced stops: glottis is already (nearly) closed before release, allowing voicing to begin early

## Key References from Paper

- Fant, G. (1960). Acoustic Theory of Speech Production. The Hague.
- Jakobson, R., Fant, G., & Halle, M. (1952). Preliminaries to Speech Analysis. MIT Technical Report No. 13.
- Liberman, A.M., Delattre, P.C., & Cooper, F.S. (1958). Some cues for the distinction between voiced and voiceless stops in initial position. Language and Speech, I, 153-166.

## Collection Cross-References

### Already in Collection
- `Fant_1960_AcousticTheorySpeechProduction` — Fant 1960, acoustic theory of speech production (cited)
- `Abramson_Whalen_2017_VOTat50` — 50-year retrospective on VOT by Abramson (co-author of this paper)

### Cited By (in Collection)
- `Abramson_Whalen_2017_VOTat50` — retrospective on VOT at 50 years, directly extends this paper
- `Zue_1976_StopConsonantAcoustics` — references Lisker & Abramson's VOT framework
- `Keating_1984_PhoneticPhonologicalRepresentationStop` — uses VOT framework from this paper
- `Port_1979_ClosureDurationVoicingPlace` — references Lisker & Abramson on voicing distinctions
- `Cho_1999_VariationUniversalsVOT` — extends VOT cross-linguistic work
- `Klatt_1975_VoiceOnsetTimeFrication` — uses Lisker & Abramson's VOT definition
- `Hanson_2003_AspiratedStopsModels` — references VOT data for stop modeling
- `Crystal_House_1988_StopConsonantDuration` — references Lisker on stop timing
- `Koenig_LaryngealFactors` — references Lisker & Abramson on voicing
- `Hombert_1979_PhoneticToneDevelopment` — references VOT in tonal language context
- `Fowler_1980_CoarticulationTheoriesExtrinsicTiming` — references Lisker's work on timing

### New Leads
- van den Berg 1958 — Myoelastic-aerodynamic theory of voice production
- Lisker 1957 — Closure duration and intervocalic voiced-voiceless distinction

### Conceptual Links (not citation-based)
- `Blumstein_Stevens_1979_AcousticInvariance` — Acoustic invariance for stop consonants relates to VOT and burst spectral patterns
- `Stevens_1993_ModelsProductionAcousticsStop` — Models of stop production and acoustics build on VOT framework
- `Stevens_1978_InvariantCuesPlaceArticulation` — Invariant cues for place of articulation complement VOT voicing distinctions
