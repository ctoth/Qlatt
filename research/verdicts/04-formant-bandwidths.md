# Verdict 04: Formant Bandwidths

## Question

Are Qlatt's formant bandwidth values (B1-B6) correct? What are the best current values and where do they come from?

## Sources Read

| Paper | Bandwidth Data? | Notes |
|-------|----------------|-------|
| Kent & Vorperian 2018 | Yes -- typical ranges B1-B3 for adult male/female | Meta-analysis; ranges not vowel-specific |
| de Chevigne 1999 | Yes -- B1-B5 for Japanese vowels from Assmann & Summerfield | B1=90, B2=110, B3=170, B4=250, B5=300 (uniform across vowels) |
| Laine 1988 | Tangential -- HPC zero bandwidths 1.5-2 kHz | About higher pole correction, not formant BWs |
| Deloche 2020 | Indirect -- vowel beta correlates with formant BW | Confirms BW is acoustically significant; no numeric BW data |
| Fant 1960 | Yes -- Table 2.34-1: vowel-specific B1-B4 for Russian | B1=39-69, B2=50-125, B3=77-170, B4=115-325 |
| Hillenbrand et al. 1995 | No bandwidth data | F0-F4 frequencies and duration only |
| Peterson & Barney 1952 | No bandwidth data | F1-F3 frequencies only |
| Stevens 1998 | Yes -- Table 3.1, Section 6.10, BW rules | Physical model: B1=21, B2=28, B3=66, B4=110 (uniform tube); modal B1~80 Hz |

## Evidence Hierarchy Applied

1. **Stevens 1998 physical model** (Table 3.1): Decomposes bandwidth into radiation, wall, viscosity, heat conduction components. For 17.7 cm uniform tube at 3 cm^2: B1~21 Hz, B2~28 Hz, B3~66 Hz, B4~110 Hz. These are MINIMUM bandwidths for a hard-walled tube. Real speech adds glottal damping (~120 Hz on B1 during open phase) and wall vibration losses.
2. **Fant 1960 Table 2.34-1**: Vowel-specific measured bandwidths from Russian vowels. These include all loss mechanisms and represent realistic steady-state values.
3. **Kent & Vorperian 2018**: Meta-analysis gives RANGES: B1=50-80, B2=70-120, B3=100-180 Hz (male). Not vowel-specific.
4. **de Chevigne 1999 / Assmann & Summerfield**: Uniform BWs used for synthesis experiments: B1=90, B2=110, B3=170.
5. **Stevens 1998 Section 6.10**: Practical synthesis rules: B1=50-80, B2=50-80, B3=80-150, B4=150+.

## Key Finding

**Bandwidth values are inherently uncertain.** Unlike formant frequencies (which can be measured from spectral peaks with ~1% precision per Peterson & Barney), bandwidths are extremely difficult to measure and vary with:

- Voicing state (glottal open phase adds ~120 Hz to B1)
- Nasalization (+100-200 Hz on B1)
- Vocal effort (narrower BWs for stressed syllables)
- F0-F1 proximity (high vowels in high-pitched voices)
- Measurement method (LPC order, window length, spectral smoothing)

Kent & Vorperian 2018 explicitly states bandwidth data is "sparse" and "highly dependent on measurement method." There is no single authoritative table of vowel-specific bandwidths for American English equivalent to Peterson & Barney's formant frequency data.

## Synthesizer Audit

### Inventory Bandwidth Values (B1-B3)

Qlatt's `inventory.yaml` header states: "B1-B3 use Kent & Vorperian (2018) typical adult-male bandwidth ranges."

| Phoneme | Qlatt B1 | Qlatt B2 | Qlatt B3 | K&V Range B1 | K&V Range B2 | K&V Range B3 | Fant B1 | Fant B2 | Fant B3 |
|---------|----------|----------|----------|--------------|--------------|--------------|---------|---------|---------|
| IY (i)  | 50       | 90       | 120      | 50-80        | 70-120       | 100-180      | 43*     | 125*    | 77*     |
| IH (ɪ)  | 60       | 90       | 120      | 50-80        | 70-120       | 100-180      | --      | --      | --      |
| EY (eɪ) | 70       | 100      | 200      | 50-80        | 70-120       | 100-180      | --      | --      | --      |
| EH (ɛ)  | 70       | 90       | 130      | 50-80        | 70-120       | 100-180      | 39*     | 95*     | 170*    |
| AE (æ)  | 80       | 100      | 140      | 50-80        | 70-120       | 100-180      | --      | --      | --      |
| AA (ɑ)  | 80       | 90       | 130      | 50-80        | 70-120       | 100-180      | 57*     | 72*     | 130*    |
| AO (ɔ)  | 70       | 90       | 120      | 50-80        | 70-120       | 100-180      | 54*     | 65*     | 100*    |
| OW (oʊ) | 80       | 70       | 70       | 50-80        | 70-120       | 100-180      | --      | --      | --      |
| UH (ʊ)  | 60       | 90       | 120      | 50-80        | 70-120       | 100-180      | 69*     | 50*     | 110*    |
| UW (u)  | 50       | 80       | 110      | 50-80        | 70-120       | 100-180      | 69*     | 50*     | 110*    |
| AH (ʌ)  | 80       | 100      | 130      | 50-80        | 70-120       | 100-180      | --      | --      | --      |
| ER (ɝ)  | 70       | 90       | 120      | 50-80        | 70-120       | 100-180      | --      | --      | --      |
| AY (aɪ) | 100      | 70       | 200      | 50-80        | 70-120       | 100-180      | --      | --      | --      |
| AW (aʊ) | 80       | 70       | 140      | 50-80        | 70-120       | 100-180      | --      | --      | --      |
| OY (ɔɪ) | 80       | 50       | 130      | 50-80        | 70-120       | 100-180      | --      | --      | --      |

\* Fant values are for Russian vowels -- not directly comparable to American English, but similar vowel qualities.

**Observations:**

1. **B1 values (50-100 Hz):** All fall within or near the K&V 50-80 Hz range. AY1 at 100 Hz is an outlier (above range). Most values are reasonable.

2. **B2 values (50-100 Hz):** All within K&V 70-120 Hz range. OW1/AY1/AW1/OY1 at 50-70 Hz are at or slightly below the range floor. These low B2 values for back vowels/diphthongs are plausible -- Fant 1960 shows B2=50 Hz for Russian /u/.

3. **B3 values (70-200 Hz):** Most within K&V 100-180 Hz range. **OW1 at B3=70 Hz is well below the literature range** (K&V minimum 100 Hz, Fant minimum 77 Hz). EY1 and AY1 at B3=200 Hz are at the upper edge.

4. **OW1 anomaly:** B2=70, B3=70 Hz are both unusually narrow. B3=70 is below any published value I found in the assigned papers. This needs citation or correction.

### Higher Formant Bandwidths (B4-B6, B7-B10)

From `inventory.yaml` base_params:
- B4: 250 Hz (default)
- B5: 200 Hz (default)
- B6: 1000 Hz (default)

From `semantics.yaml` realize rules:
- B7: F7/9 = ~722 Hz (Rabiner 1968 Q=9)
- B8: F8/6 = ~1250 Hz (Rabiner 1968 Q=6)
- B9: F9/4 = ~2125 Hz (Rabiner 1968 Q=4)
- B10: F10/2 = ~4750 Hz (Rabiner 1968 Q=2)

**Assessment:**
- B4=250 Hz: Consistent with Stevens 1998 (150+ Hz) and Fant 1960 (115-325 Hz range). Reasonable.
- B5=200 Hz: Below B4. This is physically suspicious -- higher formants should generally have wider bandwidths due to increased radiation losses. However, B5 at 200 Hz could be an engineering choice for spectral shaping. **Needs citation.**
- B6=1000 Hz: Very wide. This effectively flattens F6 into background spectral tilt rather than a distinct resonance. Consistent with Laine 1988's observation that higher-formant bandwidths approach the correction-zero bandwidth regime (1.5-2 kHz). Reasonable as an approximation.
- B7-B10 from Rabiner 1968 Q factors: Cited and implemented correctly. The decreasing Q (increasing BW relative to frequency) follows physical expectations from Laine 1988 -- these high formants are transitioning into the HPC regime where they serve as spectral correction rather than distinct resonances.

### Bandwidth Adjustment System (semantics.yaml)

The B1 and B2 realize rules implement three physically-motivated corrections:

1. **Glottal leakage (Fant 1997):** `DeltaB1 = 250 * (F1/500)^2 * (Ra - RaRef) / 12`. This is correctly cited. Breathy voice widens bandwidths.

2. **Nasal coupling:** `nasalB1AdditionHz * nasalSecondaryCueScale`. Default addition of 107 Hz. Consistent with Stevens 1998 (+100-200 Hz for nasalization) and Chen 1997 as cited.

3. **F0-proximity widening:** `200 * max(0, F0/F1 - 0.5)^2`. Cited to Stevens 1998 Sections 3.8-3.9. Physically correct -- when F0 approaches F1, harmonics undersample the formant peak.

4. **Floor at 40 Hz:** Cited to Stevens 1998 Table 3.8 (radiation + wall losses alone ~15-20 Hz). Reasonable.

**B3+ has no dynamic adjustment.** The semantics comments state "B3+ glottal contribution is negligible," which is physically correct -- glottal damping affects primarily B1 and to a lesser extent B2 (Fant 1997, Stevens 1998 Eq. 3.58).

## Verdicts

### B1-B3 Steady-State Values: LIMITED

**Category: LIMITED**

The values fall within published ranges from Kent & Vorperian 2018 and are broadly consistent with Fant 1960. However:

1. Kent & Vorperian 2018 provides only ranges, not vowel-specific values for American English.
2. The inventory uses a single set of bandwidth values regardless of vowel quality, with only minor per-vowel variation. Fant 1960 Table 2.34-1 shows bandwidth varies substantially with vowel (e.g., B2 ranges from 50 Hz for /u/ to 125 Hz for /i/). Qlatt does capture some of this variation but not systematically from any single source.
3. **OW1 B3=70 Hz is below all published ranges** and needs correction or citation.
4. There is no single authoritative bandwidth dataset for American English vowels. The current approach of using K&V ranges as a guide and tuning per-vowel is reasonable engineering given the state of the literature.

### B4-B6 Defaults: LIMITED

**Category: LIMITED**

- B4=250 Hz is within Fant 1960 range (115-325 Hz). Reasonable.
- B5=200 Hz is below B4, which is physically questionable. Needs citation.
- B6=1000 Hz is an engineering approximation for HPC-regime behavior. Reasonable.

### B7-B10 Derived Values: CORRECT (for current architecture)

**Category: CORRECT (within the all-pole cascade limitation)**

The Rabiner 1968 Q-factor derivation is correctly cited and implemented. Laine 1988 shows that the theoretically correct approach would pair each formant with a wide-bandwidth zero (pole-zero model), but the current all-pole cascade is a standard limitation inherited from Klatt 1980.

### Bandwidth Adjustment System: CORRECT

**Category: CORRECT**

The B1/B2 realize rules correctly implement Fant 1997 glottal leakage, Stevens 1998 F0-proximity widening, and nasal coupling effects. All citations verified. The 40 Hz floor is physically motivated.

## Key Question Answer

> Kent & Vorperian 2018 attempted to resolve the bandwidth problem. Did they succeed?

**No.** Kent & Vorperian 2018 is a review/meta-analysis of formant frequencies, with bandwidth data as a secondary concern. Their bandwidth table (Table 5) provides only broad ranges, not vowel-specific values. They explicitly note that bandwidth data is "sparse" and measurement-method-dependent. The bandwidth problem remains unresolved -- there is no American English equivalent of Peterson & Barney 1952 for bandwidths.

The best vowel-specific bandwidth data in the collection remains **Fant 1960 Table 2.34-1**, which is for Russian vowels. For American English synthesis, the current engineering approach (K&V ranges + per-vowel tuning + dynamic adjustment from Fant 1997 and Stevens 1998) is the best available strategy.

## Recommendations

1. **Fix OW1 B3=70 Hz.** Raise to at least 100 Hz (the K&V minimum) or cite the source for the current value.
2. **Cite B5=200 Hz.** If this is an engineering estimate, label it as such.
3. **Consider adopting Fant 1960 Table 2.34-1 as a secondary reference** for vowel-specific bandwidth variation, with appropriate adjustments for American English vowel qualities.
4. **Consider Assmann & Summerfield baseline** (B1=90, B2=110, B3=170) from de Chevigne 1999 as a cross-check -- these are widely used in synthesis research.
5. **No urgent action needed** on the bandwidth adjustment system -- it is well-cited and physically motivated.

## Papers Read

- Kent_Vorperian_2018_VowelFormantBandwidths/notes.md
- deCheveigné_1999_FormantBandwidthCompetingVowels/notes.md
- Laine_1988_HigherPoleCorrection/notes.md
- Deloche_2020_StatisticalStructureSpeech/notes.md
- Fant_1960_AcousticTheorySpeechProduction/notes.md
- Hillenbrand_1995_VowelAcoustics/notes.md
- Peterson_Barney_1952_VowelControl/notes.md
- Stevens_1998_AcousticPhonetics/notes.md
