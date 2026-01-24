# Speech Perception: A Model of Acoustic-Phonetic Analysis and Lexical Access

**Authors:** Dennis H. Klatt
**Year:** 1979
**Venue:** Journal of Phonetics, 7, 279-312
**Received:** 1 November 1978
**Affiliation:** Room 36-523, Massachusetts Institute of Technology, Cambridge, MA 02139, U.S.A.

## One-Sentence Summary

Proposes SCRIBER (automatic phonetic transcription) and LAFS (lexical access from spectra) systems that precompile acoustic-phonetic and phonological knowledge into spectral-sequence decoding networks, enabling bottom-up lexical hypothesis formation directly from acoustic input without intermediate phonetic decisions.

## Problem Addressed

Eight fundamental problems plague speech recognition and perception systems:

| # | Problem | Description |
|---|---------|-------------|
| 1 | Acoustic-phonetic non-invariance | Same phoneme has different acoustic realizations in different contexts |
| 2 | Segmentation into phonetic units | No reliable way to segment continuous speech into discrete phonemes |
| 3 | Time normalization | Segment duration varies by 2-3x based on rate, stress, context |
| 4 | Talker normalization | Different vocal tract lengths, coarticulatory strategies, dialects |
| 5 | Lexical representations for optimal search | What form should lexicon entries take? |
| 6 | Phonological recoding across word boundaries | Cross-word phenomena like palatalization, flapping |
| 7 | Dealing with phonetic errors | How to recover from transcription errors |
| 8 | Interpretation of prosodic cues | F0, duration, intensity as cues to stress and syntax |

Previous models (motor theory, analysis-by-synthesis, Logogen) fail to address all eight problems adequately.

## Key Contributions

1. **SCRIBER System**: Automatic phonetic transcription using spectral-sequence decoding
   - 55 output phonetic categories
   - ~2000 permissible diphones in English
   - Network of ~4000 states and 6000 paths
   - Uses diphone templates (mid-to-mid transitions)

2. **LAFS System**: Lexical Access From Spectra
   - Bypasses explicit phonetic transcription entirely
   - Precompiles phonological rules into decoding network
   - Lexicon organized as phonemic tree → phonetic network → spectral templates
   - Handles word-boundary phonological phenomena

3. **Perceptual Model**: Combines SCRIBER + LAFS with higher-level components
   - Bottom-up lexical hypothesis generation
   - Top-down verification via analysis-by-synthesis
   - Prosodic constraint matching

## Methodology

### Spectral Representation (SCRIBER)

**Table III: Psychophysical Considerations for Spectral Design**

| # | Consideration |
|---|---------------|
| 1 | Frequency range 270-5600 Hz (minimum passband for intelligibility) |
| 2 | Dynamic range ≥50 dB (for intense and weak sounds) |
| 3 | Temporal resolution ~10 ms (shortest useful spectral window) |
| 4 | Harmonics within critical bandwidth unresolvable |
| 5 | Equal contribution to intelligibility across critical bands (270-5600 Hz) |
| 6 | Critical band filter slopes account for spread of masking |
| 7 | Output in dB (approx. equal-interval loudness scale), quantized to 1 dB |
| 8 | Process magnitude only (phase too unpredictable) |
| 9 | Use overlapping critical-bandwidth filters (3-5% frequency JND) |
| 10 | Pre-emphasis based on pure-tone threshold, equal-loudness for intensity |

**Implementation:**
- Short-term spectrum computed every 10 ms
- 30 overlapping critical-band filters
- 25.6 ms Kaiser window (effective duration ~10 ms)
- Output: "neural spectrogram" temporary store

### Diphone Definition

A **diphone** = transition from middle of one phone to middle of the next
- Coarticulatory influences typically don't extend beyond half-way into adjacent phones
- Captures context-dependent acoustic encoding
- Each diphone characterized by 3-4 spectral templates (Fig. 2)

### SCRIBER Recognition Strategy

1. Compute spectrum every 10 ms (overlapping 25.6 ms windows)
2. Compare input spectra to template sequences using Euclidean distance in dB
3. Extend hypotheses through network states
4. Prune low-scoring paths (beam search, similar to HARPY)
5. Output best-scoring phonetic transcription

**Euclidean Distance Metric:**
$$d = \sum_{i=1}^{30} (S_{input,i} - S_{template,i})^2$$

Where $S_i$ is dB level in critical band $i$.

### LAFS Network Construction

**Step 1: Lexical Tree (Phonemic)**
- Words share initial portions (prefix tree)
- e.g., "limb", "list", "summer", "sum" share prefixes

**Step 2: Apply Phonological Rules**
- Convert abstract phonemes to surface allophones
- Add cross-word-boundary connections
- Examples: /d#y/ → [j] (palatalization), flapping, reduction

**Step 3: Map to Spectral Templates**
- Replace each phonetic transition with mini-network from SCRIBER diphone dictionary
- Result: ~3x larger than phonetic network (~150,000 states for 50,000-word lexicon)

### Phonological Rules Handled

| Rule | Example | Effect |
|------|---------|--------|
| Palatalization | "would you" → [wʊdʒu] | /d#y/ → [dʒ] |
| Unstressed reduction | "you" → [jə] | /u/ → [ə] |
| Flapping | "hit it" → [hɪɾɪt] | intervocalic /t/ → [ɾ] |
| Schwa devoicing | "to" | /tu/ → [tə] or devoiced |
| Geminate reduction | "it to" | [ɪt tu] → [ɪtu] |

### Recognition in LAFS

- Same spectral comparison as SCRIBER
- Beam search through lexical-spectral network
- Word boundaries implicit in network structure
- Prosodic constraints can be added (expected duration, F0, intensity)

## Key Parameters

| Parameter | Value | Units | Notes |
|-----------|-------|-------|-------|
| Spectral window | 25.6 | ms | Kaiser window |
| Effective duration | ~10 | ms | For rapid transitions |
| Frame rate | 10 | ms | Spectrum update interval |
| Frequency range | 270-5600 | Hz | Based on intelligibility studies |
| Dynamic range | ≥50 | dB | For weak/strong sounds |
| Critical bands | 30 | filters | Overlapping |
| Frequency JND | 3-5 | % | Just-noticeable frequency shift |
| Amplitude JND | ~1 | dB | Just-noticeable amplitude change |
| Phonetic categories | 55 | types | SCRIBER inventory |
| Diphones | ~2000 | types | Permissible in English |
| Network states (SCRIBER) | ~4000 | states | |
| Network paths (SCRIBER) | ~6000 | paths | |
| Spectral templates | ~300 | templates | Referenced in Fig. 4 |
| Echoic memory | 200-300 | ms | Short-term acoustic buffer |
| Lexical buffer | ~1000 | hypotheses | Before pruning required |
| Decision delay | 0.5 | s | After end of hypothesized word |

## Figures of Interest

- **Fig 1 (p. 280):** Block diagram comparing 3-step speech analysis, SCRIBER, and LAFS
- **Fig 2 (p. 286):** Broadband spectrogram of "the top of the hill" with spectral templates for [t]-[a] transition (silence, burst, aspiration, voicing onset, vowel midpoint)
- **Fig 3 (p. 288):** SCRIBER network fragment showing /t/ + vowel combinations with template sharing
- **Fig 4 (p. 293):** LAFS network construction: phonemic tree → phonetic network → spectral templates
- **Fig 5 (p. 297):** Complete perceptual model block diagram with SCRIBER, LAFS, and higher-level components
- **Fig 6 (p. 304):** Analysis-by-synthesis model for comparison

## Implementation Details

### Diphone Template Structure

For each diphone transition:
- 3-4 spectral templates at key timepoints
- Durational constraints (expected number of 10-ms frames per state)
- Templates may be shared across similar contexts (e.g., all [t] bursts before front vowels)

### Acoustic Invariance via Context-Dependent Templates

Problem: [t] burst spectrum depends on following vowel
Solution: Separate templates for:
- /t/ + front vowels (high F2 locus)
- /t/ + back unrounded vowels
- /t/ + back rounded vowels

This captures coarticulatory variation without explicit feature detectors.

### Time Normalization

Two approaches:
1. Allow any duration without penalty (ignores durational info)
2. Add durational constraints to network states:
   - Expected frame count per transition
   - Penalty for deviation from expected duration
   - e.g., prestressed [t] aspiration + burst ≈ 50 ms (5 frames)

### Talker Normalization Strategies

1. Start with average (male or female) templates
2. Modify based on:
   - Estimated vocal tract length
   - Average speech spectrum
   - Background noise spectrum
3. Save familiar talker templates for long-term use

### Error Recovery

- Beam search naturally explores alternatives
- No explicit segmentation decisions to propagate errors
- Matching score reflects cumulative fit, not isolated decisions
- Top-down verification can rescue borderline hypotheses

## Comparison to Other Models

| Model | Strengths | Weaknesses |
|-------|-----------|------------|
| **Motor Theory** | Explains non-invariance | Requires complex decoder, never fully specified |
| **Analysis-by-Synthesis** | Powerful verification | Computationally expensive, requires top-down |
| **Logogen** | Fast word activation | No mechanism for acoustic-phonetic details |
| **HARPY** | Fast, accurate (95%+) | Limited vocabulary, no phonological rules |
| **LAFS** | All 8 problems addressed | Requires large precompiled network |

## Results Summary

- SCRIBER achieves phonetic transcription accuracy of 80-90% depending on scoring method
- Expert spectrogram readers achieve similar accuracy
- LAFS network for 15,000-word HARPY vocabulary fits on Floating Point Systems AP-120B
- Real-time recognition feasible with parallel hardware

## Limitations

1. **Autonomous LAFS degrades in noise** - relies heavily on bottom-up signal
2. **Lexical ambiguity with delayed commitment** - search space grows exponentially
3. **No explicit prosodic model** - F0 interpretation requires sentence context
4. **Template storage requirements** - large networks for large vocabularies
5. **Validation incomplete** - model is theoretical framework, not fully tested system

## Relevance to Qlatt Project

### Direct Applications

1. **Diphone-based synthesis targets**: The 2000 permissible diphones and their spectral characterization could inform Klatt parameter interpolation between phoneme targets

2. **Coarticulation modeling**: The principle that coarticulatory effects extend about half-way into adjacent segments (diphone midpoint) is useful for defining formant transition boundaries

3. **Phonological rules**: Table II rules (palatalization, flapping, reduction) should be implemented in TTS frontend for natural connected speech

4. **Critical band considerations**: The 30-filter psychophysical representation suggests which frequency regions matter most for synthesis fidelity

### Indirect Applications

1. **Prosodic cues**: F0, duration, intensity patterns for stress/emphasis described here should guide prosody module

2. **Duration model**: Segment durations vary by 2-3x - need systematic rules for lengthening/shortening

3. **Word-boundary effects**: Cross-word phonological phenomena important for natural synthesis

## Open Questions

- [ ] What are the exact spectral templates used in SCRIBER? (Not published in this paper)
- [ ] How were the ~2000 diphones selected/verified?
- [ ] Specific formant values for the 55 phonetic categories?
- [ ] Quantitative coarticulation rules (how much F2 shift for velar pinch, etc.)?

## Related Work Worth Reading

### Foundational
- Fant (1960) *Acoustic Theory of Speech Production* - vocal tract acoustics
- Stevens & Halle (1964) - Analysis-by-synthesis
- Peterson, Wang & Sivertsen (1958) - Segmentation techniques

### Recognition Systems
- Lowerre & Reddy (1978) - HARPY system
- Wolf & Woods (1978) - HWIM system
- Klatt (1977) - Review of ARPA speech understanding

### Acoustic-Phonetic
- Blumstein, Stevens & Nigro (1977) - Property detectors for bursts and transitions
- Stevens & Klatt (1974) - Role of formant transitions in voiced-voiceless distinction
- Zue (1976) - Acoustic characteristics of stop consonants

### Duration/Prosody
- Klatt (1976b) - Linguistic uses of segmental duration
- Klatt (1979) - Synthesis by rule of segmental durations
- Lea (1973) - Segmental and suprasegmental influences on F0

### Phonological
- Chomsky & Halle (1968) - *The Sound Pattern of English*
- Oshika et al. (1975) - Role of phonological rules in speech understanding
