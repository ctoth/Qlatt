# A Model of Lingual Coarticulation Based on Articulatory Constraints

**Authors:** Daniel Recasens, Maria Dolors Pallarès, Jordi Fontdevila
**Year:** 1997
**Venue:** Journal of the Acoustical Society of America, Vol. 102(1), pp. 544-561
**DOI:** S0001-4966(97)03106-8

## One-Sentence Summary

Presents the DAC (Degree of Articulatory Constraint) model that predicts coarticulation magnitude and direction based on tongue-dorsum involvement in consonant/vowel production—directly applicable to formant transition modeling in synthesis.

## Problem Addressed

No existing model predicted how much coarticulation a phonetic segment allows or exerts on surrounding segments. Previous work (Stevens et al. 1966, Öhman 1966) established general principles but didn't quantify segment-specific coarticulation resistance.

## Key Contributions

1. **DAC Scale**: A 3-level scale (1-3) classifying phonemes by tongue-dorsum constraint
2. **Coarticulation Predictions**: Rules for C-to-V, V-to-C, and V-to-V effects based on DAC values
3. **Directionality Model**: Predictions for anticipatory vs. carryover coarticulation prominence
4. **Empirical Validation**: EPG and F2 data from Catalan VCV sequences across 5 speakers

## Methodology

- **Subjects**: 5 Catalan speakers (DR, JP, JS, DP, JC)
- **Stimuli**: VCV sequences with vowels /i/, /a/ and consonants /p/, /n/, dark /l/, /s/, /ʃ/, /ɲ/, /k/
- **Measurements**:
  - Electropalatography (EPG) at 10ms intervals, 62 electrodes
  - F2 frequency via LPC (25ms Hamming window, 12 coefficients) at 20kHz
- **Analysis**: Qp index = percentage of palatal electrode activation

## The DAC Model

### DAC Scale Definition

| DAC Value | Tongue-Dorsum Involvement | Phonemes |
|-----------|---------------------------|----------|
| **3** (max) | Active tongue-dorsum control required | /ʃ/, /ɲ/, /i/, /k/, dark /l/, (/s/) |
| **2** (mid) | Indirect coupling effects only | /n/, /a/, (/s/) |
| **1** (min) | No tongue-dorsum requirement | /p/, /ə/ |

**Note**: /s/ may be DAC=2 or DAC=3 depending on manner requirements (groove formation increases constraint)

### DAC Assignment Rationale

- **DAC=3 (Dorsals)**: Alveolopalatals /ʃ/, /ɲ/ require active tongue-dorsum raising; palatals /i/ and velars /k/ share kinematic properties; dark /l/ involves dual gesture (apico-alveolar closure + dorsopharyngeal constriction)
- **DAC=2 (Alveolars)**: Tongue blade raising for /n/, /s/ causes indirect tongue-dorsum raising via coupling
- **DAC=1 (Labials)**: Tongue body free; /ə/ (schwa) most sensitive to context

## Coarticulation Predictions

### C-to-V Coarticulation Rules

| Scenario | DAC Relationship | Gestural Compatibility | Predicted C-to-V Effect |
|----------|------------------|------------------------|-------------------------|
| /ɲi/ | C=V (both 3) | Compatible (both raise) | Negligible |
| /ni/ | C<V (2<3) | Compatible | Negligible |
| /li/ | C=V (both 3) | **Antagonistic** (C lowers, V raises) | **Large** |
| /ɲa/ | C>V (3>2) | Antagonistic | **Large** |
| /la/ | C>V (3>2) | Compatible (both lower) | Moderate |
| /pi/ | C<V (1<3) | N/A | Negligible |
| /pa/ | C<V (1<2) | N/A | Negligible |

**Key Finding**: Gestural antagonism does NOT prevent coarticulation—it INCREASES it. Maximal antagonism → maximal C-to-V coarticulation.

### V-to-C Sensitivity

Coarticulatory sensitivity inversely related to DAC:
$$\text{Sensitivity} \propto \frac{1}{\text{DAC}}$$

Progression: bilabials > dentoalveolars > alveolopalatals, velars, dark /l/, /s/

### V-to-V Coarticulation

- Consonant-dependent differences in V-to-V occur when fixed vowel has moderate DAC (/a/)
- May be cancelled if fixed vowel has maximal DAC (/i/)

## Coarticulatory Direction

### C-to-V Directionality by Consonant Class

| Consonant | Favored Direction | Mechanism |
|-----------|-------------------|-----------|
| Dark /l/ | **Anticipatory** | Dual lingual constriction requires early preparation |
| /ɲ/, /k/ (dorsals) | **Carryover** | Mechanico-inertial: tongue dorsum lowers slower at release than raises at onset |
| /n/, /s/, /ʃ/ (alveolars) | **Anticipatory** (in /a/ context) | Apical flexibility, manner requirements |
| /p/ | No clear preference | Context-dependent |

### V-to-V Directionality

Vocalic effects follow consonantal directionality:
- Dark /l/: V2-dependent anticipation prominent
- /ɲ/: V1-dependent carryover prominent

## Key Equations

### Qp Index (Palatal Contact)
$$Qp = \frac{\text{Number of activated palatal electrodes}}{\text{Total number of palatal electrodes}} \times 100\%$$

### Correlation Between Size and Temporal Extent
High positive correlations found between C-to-V size and temporal extent:
- Larger effects are longer
- Smaller effects are shorter

Correlation threshold: $r \geq 0.70$ considered meaningful

## Parameters

| Parameter | Symbol | Units | Typical Values | Notes |
|-----------|--------|-------|----------------|-------|
| Palatal contact index | Qp | % | 0-100 | 3-4 back rows of artificial palate |
| Second formant | F2 | Hz | 1000-3000 | Correlates positively with Qp |
| Temporal step | - | ms | 10 | EPG and acoustic sampling interval |
| Statistical threshold | p | - | <0.05 | For significant coarticulation |

## Implementation Details

### For TTS Formant Transitions

1. **Assign DAC values** to each phoneme in inventory
2. **Predict coarticulation magnitude** based on:
   - DAC(C) vs DAC(V) relationship
   - Gestural compatibility/antagonism
3. **Predict temporal extent** proportional to magnitude
4. **Predict direction** based on consonant class:
   - Dorsals: emphasize carryover transitions
   - Dark /l/: emphasize anticipatory transitions
   - Alveolars in low vowel context: emphasize anticipatory

### DAC Values for English (Extrapolated)

| DAC | Consonants | Vowels |
|-----|------------|--------|
| 3 | /ʃ/, /tʃ/, /dʒ/, /j/, /k/, /g/, dark /l/ | /i/, /u/ |
| 2 | /n/, /t/, /d/, /s/, /z/ | /a/, /ɑ/, /ɔ/ |
| 1 | /p/, /b/, /m/, /f/, /v/, /w/ | /ə/ |

### Articulatory Dimension of Effects

- Consonants requiring **tongue-dorsum raising** (/ɲ/, /k/): more sensitive to effects from /i/ than /a/
- Consonants requiring **tongue-dorsum lowering** (dark /l/, /p/, /n/): more sensitive to effects from /a/ than /i/

## Figures of Interest

- **Fig 1 (p. 547)**: EPG configurations at consonantal midpoint for all 7 consonants in /i/ and /a/ contexts
- **Fig 2 (p. 548)**: F2 trajectories showing anticipatory and carryover effects for dark /l/
- **Fig 3 (p. 550)**: Mean C-to-V effects in Qp and F2 across consonants
- **Fig 4 (p. 554)**: V-to-C and V-to-V effects across consonants
- **Fig 5 (p. 555)**: Qp and F2 trajectories for /aCi/ vs /iCa/ sequences showing directionality
- **Fig 6 (p. 556)**: Coarticulatory direction differences for C-to-V effects
- **Fig 7 (p. 557)**: Coarticulatory direction differences for V-to-C and V-to-V effects

## Results Summary

### C-to-V Effects (Table I, II)

| Consonant | Context | Qp Size (%) | F2 Size (Hz) | Direction |
|-----------|---------|-------------|--------------|-----------|
| dark /l/ | /i/ | -27.6 (A), -22.1 (C) | -732 (A), -552 (C) | Anticipatory |
| /ɲ/ | /a/ | +36.5 (A), +26.8 (C) | +472 (A), +475 (C) | Carryover |
| /ʃ/ | /a/ | +38.5 (A), +17.7 (C) | +365 (A), +151 (C) | Anticipatory |
| /p/ | /i/ | -1.8 (A), -4.8 (C) | -353 (A), -587 (C) | Carryover |

(A = Anticipatory, C = Carryover)

### V-to-C Effects

Bilabial /p/ and alveolar /n/ show largest vowel-dependent effects (low DAC → high sensitivity)

## Limitations

1. Data from Catalan only; some patterns may be language-specific
2. DAC scale is "preliminary" and could be refined
3. Schwa (/ə/) not directly tested as V2 was unstressed /a/→[ə]
4. Only 7 consonants tested; gaps in inventory coverage
5. F2 alone may not capture all coarticulatory dimensions (F3 similar, F1 differs)

## Relevance to Qlatt Project

### Direct Applications

1. **Formant Transition Modeling**: Use DAC to predict F2 transition magnitude and duration
2. **Coarticulation Resistance**: Implement DAC-based resistance in `tts-frontend-rules.js`
3. **Transition Direction**: Weight anticipatory vs carryover based on consonant class
4. **Target Undershoot**: Predict vowel undershoot based on C-V DAC relationship

### Integration with Klatt Synthesizer

- DAC model can inform the `AV` (voicing amplitude) and formant transition parameters
- Particularly relevant for:
  - `/l/` transitions (dark /l/ has very specific coarticulation pattern)
  - Palatal/velar consonants (strong carryover)
  - Labial consonants (minimal tongue constraint, free formant movement)

### Practical Rules for Implementation

```javascript
// Pseudo-code for DAC-based coarticulation
function getCoarticulationMagnitude(consonant, vowel) {
  const dacC = getDACValue(consonant);
  const dacV = getDACValue(vowel);
  const antagonistic = areGesturesAntagonistic(consonant, vowel);

  if (dacC > dacV && antagonistic) return 'large';
  if (dacC === dacV && antagonistic) return 'moderate';
  if (dacC <= dacV) return 'small';
}

function getTransitionDirection(consonant) {
  if (isDarkL(consonant)) return 'anticipatory';
  if (isDorsal(consonant)) return 'carryover';
  if (isAlveolar(consonant)) return 'context-dependent';
  return 'balanced';
}
```

## Open Questions

- [ ] How does DAC interact with speech rate? (faster rate → more undershoot)
- [ ] Are DAC values consistent across English dialects?
- [ ] How to handle consonant clusters with different DAC values?
- [ ] Does the model apply to F1 transitions? (paper says F1 differs from F2)

## Related Work Worth Reading

- Öhman, S. (1966). "Coarticulation in VCV sequences" - foundational VCV coarticulation model
- Stevens et al. (1966). "Acoustical description of syllabic nuclei" - dynamic model of coarticulation
- Browman & Goldstein (1986, 1992). Articulatory Phonology - gestural framework
- Fant, G. (1960). Acoustic Theory of Speech Production - F2/constriction relationships
- Kent & Moll (1972). "Cinefluorographic analyses of lingual consonants" - tongue-dorsum coupling
- Recasens (1984, 1985, 1987, 1989). Series on Catalan coarticulation - prior work by first author
- Sproat & Fujimura (1993). "Allophone variation in English /l/" - dark /l/ gesture analysis
