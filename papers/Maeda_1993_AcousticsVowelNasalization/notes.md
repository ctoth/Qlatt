---
title: "Maeda 1993 - Acoustics of Vowel Nasalization and Articulatory Shifts in French Nasal Vowels"
year: 1993
---

# Maeda 1993 - Acoustics of Vowel Nasalization and Articulatory Shifts in French Nasal Vowels

## Implementation-Focused Notes

### 1. The "Port" Model of Velopharyngeal Coupling

Maeda uses a model where increasing the velopharyngeal port area (NC, in cm^2) simultaneously decreases the oral passage cross-sectional area. The oral passage area for a given vowel is reduced by subtracting NC from the passage area of the corresponding oral vowel.

- **NC = 0**: Velopharyngeal port closed. Transfer function has only oral vowel formants (poles).
- **NC > 0**: Port opens. Nasal formants (poles) and nasal antiformants (zeros) appear.
- **NC = max**: Oral passage blocked. Transfer function determined by pharyngonasal tract resonances and collapsed pole-zero pairs at oral cavity critical frequencies.

**Key parameter**: NC (nasal coupling magnitude) in cm^2. Ranges from 0 to ~2.5 cm^2.

### 2. Nasal Tract Model Parameters

- Nasal tract: total length 13 cm, uniform cross-sectional area of 6 cm^2
- Exit section: 1 cm long, constricted to 0.1 cm^2 (lowers critical frequencies)
- First section (1 cm long): cross-sectional area = NC (couples to main vocal tract)
- Nasal tract coupled to main vocal tract at 9 cm above glottis
- Nasal spectral zeros appear at ~500 Hz and ~2000 Hz (for male speaker, Lonchamp 1988)
- First critical frequency of nasal tract for male speaker: ~400 Hz

### 3. Critical Resonance Frequencies (Figure 1, vowel /open-o/)

**Row I (oral vowel formants + nasal critical resonances):**
| Parameter | Value (Hz) |
|-----------|-----------|
| C_n1 | 368 |
| F1 | 501 |
| F2 | 1096 |
| C_n2 | 1803 |
| F3 | 2512 |
| F4 | 3392 |

**Row II (pharyngonasal tract resonances + oral cavity critical resonances):**
| Parameter | Value (Hz) |
|-----------|-----------|
| R1 | 296 |
| R2 | 688 |
| C_o1 | 872 |
| R3 | 1744 |
| R4 | 2648 |
| C_o2 | 3024 |

### 4. Four Types of Spectral Modification by Vowel Class

The acoustic effects of nasal coupling depend on the relative positions of vowel formants and nasal tract critical resonances:

#### Type 1: High front vowels [i, y] (F1 < 400 Hz)
- NF1 peak appears at right-hand skirt of F1
- Spectral dip due to Z1
- F1 and F2 region relatively stable across NC values
- Small NC sufficient for perceptual nasalization
- **For synthesizer**: F1 weakening + NF1 spectral dip near F1 is the primary cue

#### Type 2: Front vowels [e, epsilon] (F1 > 400 Hz, high F2)
- F1 weakened and suppressed by Z1
- F2 peak relatively unaffected (F2 freq >> nasal critical freq)
- NF1 appears below weakened F1
- **For synthesizer**: F1 weakening is the dominant nasalization cue

#### Type 3: Non-high back vowels [open-o, o] (F1 > 400 Hz, low F2)
- Both F1 and F2 can be influenced by Z1
- F1 peak splits into NF1 + weakened F1
- F2 weakening requires relatively large velopharyngeal port opening
- F3 shifts upward, separating NF1-F1'-F2' cluster from F3'
- Creates the "nasal eye" (large spectral gap between low and high formant clusters)
- **For synthesizer**: F1 split + F3 upshift; spectral flattening in F1-F2 region

#### Type 4: High back vowel [u] (low F1, low F2)
- NF1-Z1 pair appears between F1 and F2
- Both F1 and F2 remain relatively stable
- Nasalization harder to achieve perceptually
- **For synthesizer**: Minimal formant modification; requires large NC

### 5. Spectral Measure for Nasalization: N1-N2 Distance

Maeda proposes measuring the distance (in Bark) between the two lowest spectral peaks (N1 and N2) in the auditory spectrum as a vowel-independent measure of perceived nasalization.

- N1: lowest identifiable spectral peak in low-frequency region
- N2: second spectral peak (may correspond to a nasal formant or shifted vowel formant)
- Auditory spectra computed on Bark scale using Schroeder, Atal & Hall (1979) formulas for loudness density (sone/Bark)
- N1-N2 distance increases monotonically with NC for vowels [i] and [a]
- For [u], the measure shows discrepancy at zero coupling (predicts high nasalization when none perceived)

**Correlation with perception**: The N1-N2 distance correlates well with perceived degree of nasalization for [i] and [a], but less well for [u].

### 6. Perceptual Experiment Parameters

- Three stationary vowels: [i], [a], [u]
- NC varied in 6 steps from 0 to 2.5 cm^2
- Duration: 300 ms fixed
- F0 contour: piecewise-linear, 140 Hz onset, 150 Hz at 50 ms, 120 Hz at offset
- 8 French listeners, 5 repetitions
- 5-step nasalization scale (0 = not nasalized, 4 = heavily nasalized)

**Results**:
- [i]: Perceived nasalization increases rapidly, saturates at ~0.4 cm^2
- [u]: Similar pattern but perceived degree generally weaker than [i]
- [a]: Distinctly different - only with large coupling (> 1.6 cm^2) does nasalization become evident

### 7. Articulatory Shifts in French Nasal Vowels

French nasal vowels show systematic articulatory differences from their oral counterparts:

#### /a/ vs /a-tilde/ (nasalized counterpart closer to [open-o])
- Tongue retracted, lips protruded
- Lip protrusion lowers F1 (from 664 to 580 Hz) and F2 (from 1240 to 1140 Hz)
- With this F1 lowering, only ~0.4 cm^2 NC needed to flatten spectrum
- Articulatory shift explained as enhancing nasalization percept

#### /open-o/ vs /open-o-tilde/ (nasalized counterpart closer to [o])
- Tongue position shifted higher toward [o]
- Lip rounding increased
- Lip aperture reduced fourfold
- F1 lowering of ~80 Hz; F2 lowering of ~170 Hz
- Tongue backing + VP opening intended to lower F2 so antiformant approximates F2
- Spectrum resembles nasalized [o], forming weak NF1-F2' cluster

#### /epsilon/ vs /epsilon-tilde/
- Lip protrusion in nasalized version
- F1 weakening enhanced by labial gesture
- Less robust articulatory contrast than [a]/[a-tilde]

### 8. Key Acoustic Principle for Synthesis

The central insight: nasalization percept requires an antiformant near a vowel formant. For low back vowels, the antiformant frequency is controlled by the oral passage area (which shrinks as NC grows). For high vowels, even small coupling places the antiformant near F1.

**For a formant synthesizer (Klatt-type)**:
- Nasalization primarily implemented by adding a nasal formant (NF1) and nasal antiformant (Z1)
- NF1 frequency: ~250-300 Hz (near first resonance of pharyngonasal tract)
- Z1 frequency: starts near first critical resonance of oral cavity (~400-900 Hz depending on vowel), shifts upward with coupling
- Bandwidth of NF1: relatively broad
- The N1-N2 distance on auditory spectrum can serve as a quality metric for synthetic nasalized vowels

### 9. Interaction Between Vowel Identity and Nasality Perception

Listeners separate spectral attributes contributing to nasality from those contributing to vowel identity. The N1/N2 peak identification provides a reasonable approximation of this segregation process. However, for [u], the spectral shape at low frequencies resembles nasalized [i], suggesting that a pure bottom-up model is insufficient -- vowel identity influences nasality judgment.

## Collection Cross-References

### Already in Collection
- [[Fant_1960_AcousticTheorySpeechProduction]] — Fant 1970 2nd ed. cited for acoustic theory underlying the vocal tract model
- [[Hawkins_Stevens_1985_NasalVowelCorrelates]] — Hawkins & Stevens 1985 cited for perceptual correlates of the nasal-nonnasal distinction for vowels
- [[House_Stevens_1956_NasalizationVowels]] — House & Stevens 1956 cited as foundational analog study of vowel nasalization
- [[Maeda_1982_VowelNasalizationCues]] — Maeda's own earlier work on sinus cavity effects and spectral correlates of nasalization
- [[Stevens_1989_QuantalNatureSpeech]] — Stevens 1972 quantal nature of speech cited for formant-antiformant interaction theory

### Cited By (in Collection)
- [[Feng_1996_NasalVowelTarget]] — cites Maeda 1993 for nasalization acoustics and spectral correlates
- [[Chen_1997_NasalizedVowelAcoustics]] — cites Maeda 1993 for French nasal vowel acoustics and complementary analysis methodology
- [[Klatt_1990_VoiceQualityVariations]] — references Maeda's nasalization work
- [[EspyWilson_2000_AcousticModelingAmericanR]] — references Maeda for nasalization modeling
- [[Beddor_1986_NasalVowelHeight]] — references Maeda's nasalization work
- [[Ruhlen_1973_NasalVowels]] — references Maeda for nasalization acoustics
- [[Kaburagi_2007_VocalTractSpectrum]] — references Maeda for vocal tract modeling with nasal coupling
- [[Rossato_1998_RecoveringGesturesNasalVowels]] — references Maeda for nasalization gesture recovery
- [[Lalwani_1992_FlexibleFormantSynthesizer]] — references Maeda for nasalization implementation
- [[Laine_1988_HigherPoleCorrection]] — references Maeda for nasalization effects

### New Leads (Not Yet in Collection)
- Chistovich & Lublinskaya (1979) — "Center of gravity" effect in vowel spectra — referenced for N1-N2 peak identification method
- Fujimura (1960) — Spectra of nasalized vowels — early MIT analysis of nasal vowel spectra

### Supersedes or Recontextualizes
- [[Maeda_1982_VowelNasalizationCues]] — this 1993 chapter extends Maeda's own 1982 work with fuller vowel-dependent spectral modification taxonomy (4 types), the N1-N2 perceptual measure, and articulatory shift analysis for French nasal vowels

### Conceptual Links (not citation-based)
- [[Chen_1997_NasalizedVowelAcoustics]] — Chen provides American English nasalized vowel measurements (F1, B1, FNP, FNZ values for specific vowels) that complement Maeda's French-focused simulation. Maeda's four vowel-type taxonomy predicts Chen's observations: high vowels show rapid nasalization with small coupling, low vowels require larger coupling. Different languages, converging acoustic principles.
- [[Feng_1996_NasalVowelTarget]] — Feng extends Maeda's port model with sinus cavity effects and develops French nasal vowel synthesis targets. Maeda provides the acoustic theory; Feng provides the synthesis implementation parameters.
- [[Beddor_1986_NasalVowelHeight]] — Beddor examines how nasalization interacts with perceived vowel height across languages. Maeda's finding that articulatory shifts in French nasal vowels enhance nasalization percept provides the acoustic mechanism for the perceptual vowel height shifts Beddor documents.
