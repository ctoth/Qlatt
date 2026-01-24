# A Model of the Regularities Underlying Speaker Variation: Evidence from Hybrid Synthesis

**Authors:** Susan R. Hertz
**Year:** 2006
**Venue:** Interspeech 2006 (slightly revised version)
**Affiliation:** NovaSpeech LLC and Cornell University

## One-Sentence Summary
Demonstrates that consonant clusters (ACCs) are perceptually generic across speakers and can be substituted (even with formant synthesis) without degrading speaker identity, while vowel nuclei (ANs) carry speaker-specific information.

## Problem Addressed
How do listeners identify phonemes despite massive cross-speaker and contextual variation in the acoustic signal?

## Key Contributions
1. **Hybrid Model of Speech**: Speech divides into two fundamental units with different perceptual roles
2. **Cross-speaker consonant substitution**: 60-70% of utterance duration can be replaced by another speaker's consonants with minimal perceptual impact
3. **Rule-based formant synthesis validation**: Simple perceptually-oriented rules can produce consonants that work as cross-speaker surrogates

## The Hybrid Model

### Two Fundamental Units

| Unit | Definition | Speaker Dependency | Role |
|------|------------|-------------------|------|
| **Acoustic Nucleus (AN)** | Vowel phone + tautosyllabic sonorants + voiced edge transitions | Speaker-specific | Carries speaker identity, voice quality |
| **Acoustic Consonant Cluster (ACC)** | Consonant phones + transitions + devoiced edges between ANs | Speaker-generic | Can be substituted across speakers |

### Acoustic Nucleus (AN) Components
- Vowel phone of syllable
- Any following tautosyllabic sonorants
- Voiced portions of transitions at edges ("edge transitions")
- Heavily reduced vowels pattern with ACCs (no inherent F2 targets, strong coarticulation, lower amplitude)

### Acoustic Consonant Cluster (ACC) Components
- Sequence of consonant phones
- Intervening transitions
- Devoiced portions of edge transitions

## Key Perceptual Findings

### Timing Relations Are Critical
- **Durational cues** more robust than spectral cues in noise
- All speakers can produce similar timing regardless of vocal tract
- Timing patterns strategically organized to enhance phonological contrasts

### Parsing Mechanism
1. Listener queues ACC waveform until AN encountered (sudden energy rise, periodic waveform)
2. ~30 ms into AN, after edge transition processed, ACC is parsed
3. Parsing uses:
   - Gross relational acoustic patterns
   - Edge transition characteristics
   - Relative durations
   - Spectral/amplitude differences between consonant types

### Duration-Phoneme Relationships
| Duration Change | Perceived Phoneme |
|-----------------|-------------------|
| Long [s] in [asa] | /s/ |
| Shortened beyond threshold | /z/ |
| Further shortened to [d] duration | /d/ |

### Key Insight
> "An observed event is not necessarily a perceived event."

Listeners abstract away from acoustic differences resulting from vocal physiologies when parsing ACCs.

## Hybrid Synthesis Experiments

### Methodology
- 11 hybrid speakers: 8 human (3 children 6-11, 2 young adults 20s, 3 adults 50s) + 3 synthetic
- 6 target speakers for mimicry
- KLSYN-88 style synthesizer for formant synthesis
- Three synthesis types:
  1. **Rule-based formant synthesis (RBFS)**: General perceptually-oriented rules
  2. **Model-based formant synthesis**: Synthesize per hypothesized rules/principles
  3. **Copy-based formant synthesis (CBFS)**: Copy specific utterance details

### Substitution Rules Applied
- F0 in voiced surrogates: interpolated between F0 targets of adjacent voiced segments
- Non-sonorant clusters: substituted as whole chunks
- Voiced sonorant surrogates: model-based formant synthesis
- Amplitudes: adjusted based on general principles for appropriate relations to neighbors
- Durations: taken from surrogates unless unnatural, then adjusted (same adjustment works across all speakers)

### Speaker Identification Results (34 listeners, 123 stimuli)

| Condition | Correct ID (Familiar) | Similarity Score | Correct ID (Unfamiliar) |
|-----------|----------------------|------------------|------------------------|
| Natural | 98% | 1.37 | 79% |
| Hybrid | 96% | 1.99 | 78% |
| RBFS alone | 75% gender correct | - | - |

**Critical finding**: Listeners had no idea voices consisted of more than one speaker.

### Speech Quality Results (34 listeners, 143 stimuli)

| Type | Naturalness Score | Notes |
|------|-------------------|-------|
| Natural | 1.40 | |
| Hybrid | 1.97 | |
| CBWC1 (corpus concat) | 2.85 | Foreign accents, unexpected pronunciations |
| CBWC2 (corpus concat) | 4.04 | |
| CBFS (copy formant) | 4.21 | Non-human-sounding |
| RBFS (rule formant) | 4.84 | |

Scale: 1 = very natural, 5 = very unnatural

### Surprising CBFS vs CBWC1 Finding
- Copy-based formant synthesis (exact F0, timing, spectral copy) scored 4.21 (unnatural)
- CBWC1 (same speaker, not contextually appropriate) scored 2.85 (more natural)
- **Implication**: Primary correlate of quality is whether AN comes from human speaker, not acoustic accuracy

## Implementation Relevance for Qlatt

### What This Means for Formant Synthesis
1. **Consonants can be generic**: Don't need speaker-specific consonant modeling
2. **Timing is paramount**: Get durations right, spectral details can be approximate
3. **Simple rules work**: ETI-Eloquence used "just a few contextually appropriate values for just a few parameters"
4. **Vowels carry identity**: Focus speaker-specific effort on vowel nuclei

### Practical Rules for Hybrid/Surrogate Segments
- F0: Interpolate between adjacent voiced targets
- Non-sonorant clusters: Treat as whole units
- Amplitudes: Adjust to maintain appropriate relations to neighbors
- Durations: Once right for one speaker, generally work for all

### Quality Checklist Insight
The study validates that:
- Rule-based formant synthesis consonants are cross-speaker generic
- Voice quality perception hinges on ANs (vowels + sonorants)
- Durational relationships within ACCs critical for phoneme identification

## Related Work Worth Reading
- [3] Hertz 1991: Streams, phones, and transitions - phonological and phonetic model of formant timing. *J. of Phonetics* 19, 91-109
- [4] Hertz & Huffman 1992: Nucleus-based timing model. *Proc. ICSLP* 2, 1171-1174
- [5] Hertz et al. 1999: ETI-Eloquence multi-language TTS. *Proc. 14th ICPhS*, 2283-2286
- [7] Klatt & Klatt 1990: Voice quality variations analysis. *JASA* 87, 820-857

## Limitations
- Focused on English; other languages preliminary
- Rule-based synthesis alone scored poorly (4.84) - only works as surrogate within hybrid context
- Model evolved from ETI-Eloquence work; specific rule details not published here

## Open Questions
- [ ] What are the specific "simple, perceptually-oriented rules" used in ETI-Eloquence?
- [ ] How do edge transition durations trade off with phone durations quantitatively?
- [ ] What determines the ~30 ms parsing window into AN?
- [ ] How do heavily reduced vowels pattern with ACCs in implementation?
