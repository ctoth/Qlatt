# Prosody and Emotions

**Authors:** Sylvie Mozziconacci
**Year:** 2002
**Venue:** Speech Prosody 2002, Aix-en-Provence, France (April 11-13, 2002)
**DOI:** 10.21437/SpeechProsody.2002-1
**Affiliation:** Phonetics Lab, Leiden University, The Netherlands

## One-Sentence Summary

A methodological review arguing that emotional speech synthesis benefits from using intonation models (like IPO) as a theoretical framework, with experimental evidence that phonological contour type and F0 implementation both independently contribute to emotion perception.

## Problem Addressed

The paper addresses methodological issues in studying prosody and emotion:
1. Lack of standardized reference baselines across studies
2. Need for theoretical frameworks (intonation models) to control parameters
3. Distinction between phonological (contour type) vs. phonetic (F0 implementation) factors
4. Whether production and perception studies should be combined

## Key Contributions

1. **Reference baseline necessity**: Studies need neutral speech baselines for meaningful comparisons
2. **Intonation model framework**: Using models like IPO ('t Hart et al., 1990) enables systematic parameter manipulation
3. **Orthogonal design**: Contour type and F0 implementation should be studied independently AND in combination
4. **Three independent cues**: F0 range, voice quality, and contour type function independently for emotion/attitude

## Methodology

### IPO Model Framework
The IPO (Institute for Perception Research) model of intonation:
- Provides standardized representation of pitch contours
- Allows systematic manipulation of prosodic parameters
- Enables analysis-resynthesis of natural speech
- Supports rule-based synthetic speech generation

### Experimental Paradigm (Mozziconacci 1998, 2001)
- Database: 315 utterances (3 speakers x 5 sentences x 7 emotions x 3 repetitions)
- Emotions tested: Joy, Boredom, Anger, Sadness, Fear, Indignation, Neutrality
- Three synthesis conditions compared: natural, resynthesized, rule-based

## Key Equations

No formal equations presented. The paper is methodological/theoretical.

## Parameters

### Prosodic Parameters for Emotion Expression

| Parameter | Role | Notes |
|-----------|------|-------|
| F0 mean | Pitch level | Affects arousal perception |
| F0 range | Pitch excursion | H-F, H-L, M-F, M-L options for measurement |
| F0 contour type | Phonological category | Rise, fall, rise-fall patterns |
| Speech rate | Tempo | Varies with emotion |
| Voice quality | Source characteristics | Independent of F0 |

### F0 Target Extraction Points (Patterson & Ladd, 1999)

| Point | Description |
|-------|-------------|
| H | Sentence initial peak |
| M | Other accent peaks |
| L | Valleys |
| F | Sentence final low |

### Pitch Range Measurement Options

| Measure | Description |
|---------|-------------|
| H-F | Initial peak to final low |
| H-L | Initial peak to valleys |
| M-F | Other peaks to final low |
| M-L | Other peaks to valleys |

**Finding:** F (final low) best for pitch level; M-L best for pitch range

## Key Experimental Results

### Table 1: Emotion Identification Rates (%)

| Emotion | Natural | Resynthesized | Synthetic |
|---------|---------|---------------|-----------|
| Neutrality | 85 | 67 | 83 |
| Joy | 62 | 72 | 62 |
| Boredom | 92 | 85 | 94 |
| Anger | 32 | 42 | 51 |
| Sadness | 97 | 75 | 47 |
| Fear | 60 | 42 | 41 |
| Indignation | 85 | 77 | 68 |
| **Mean** | 73 | 66 | 63 |

**Interpretation:** Rule-based synthesis achieves ~63% mean accuracy (chance = 14.3% for 7 emotions)

### Table 2: Contour Type vs. Pitch Implementation

| Emotion | Cond.1 (all optimal) | Cond.2 (1&A contour + optimal pitch) | Cond.3 (optimal contour + neutral pitch) | Cond.4 (optimal both) |
|---------|------|--------|--------|--------|
| Neutrality | 37 | 46 | 56 | 56 |
| Joy | 18 | 10 | 27 | 35 |
| Boredom | 41 | 48 | 19 | 52 |
| Anger | 9 | 10 | 27 | 23 |
| Sadness | 8 | 0 | 33 | 19 |
| Fear | 19 | 17 | 10 | 25 |
| Indignation | 24 | 19 | 4 | 52 |
| **Mean** | 22 | 21 | 25 | 37 |

**Key Finding:** Additive contributions:
- Chance level: 14%
- Contour type contribution: +11%
- Pitch implementation contribution: +8%
- Combined (Cond.4): ~33% (close to 14% + 11% + 8%)

## Implementation Details

### For TTS Emotional Prosody

1. **Contour Type Selection**: Choose pitch contour based on:
   - Sentence type (question, statement, exclamation)
   - Target emotion (contributes ~11% to identification)

2. **F0 Implementation**: Set pitch level and range based on:
   - Target emotion (contributes ~8% to identification)
   - Speaker baseline

3. **ToBI/ToDI Annotation**: Paper references ToDI (Transcription of Dutch Intonation) as ToBI-like system for Dutch

### Three Independent Cue Model (Ladd et al., 1985)

Three prosodic cues function independently for emotion/attitude:
1. **F0 range** - continuous variations
2. **Voice quality** - source characteristics
3. **Contour type** - categorical (phonological)

Each affects:
- Arousal-related states (F0 range, voice quality)
- Cognitively-related attitudes (contour type interacts with sentence type)

## Figures of Interest

No figures in this paper (text-only with tables).

## Results Summary

1. **Model adequacy confirmed**: IPO model sufficient for describing emotional speech variation
2. **Phonological choice primary**: Contour type selection is "of primary importance" for emotion perception
3. **Phonetic implementation secondary but significant**: Pitch level/range also matters
4. **Independence demonstrated**: The three cues (F0 range, voice quality, contour type) function independently

## Limitations

1. **Dutch-specific**: Studies primarily on Dutch; cross-language generalization uncertain
2. **No voice quality manipulation**: Paper focused on F0, not source characteristics
3. **Elicited speech**: Used acted/elicited emotions, not spontaneous
4. **Limited emotion set**: 7 emotions tested; may not cover full emotional space
5. **No implementation algorithms**: Provides framework, not specific parameter values

## Relevance to Qlatt Project

### Direct Applications

1. **Prosody Rule Design**: Contour type selection should be emotion-dependent
   - Different rise/fall patterns for different emotions
   - Sentence type x emotion interaction matters

2. **F0 Parameter Modulation**:
   - Pitch level (baseline F0) varies by emotion
   - Pitch range (excursion size) varies by emotion
   - These are INDEPENDENT of contour shape

3. **Speech Rate**: Mentioned as varying with emotion but not detailed

### Architecture Implications

For `tts-frontend-rules.js`:
- Prosody rules should distinguish:
  1. **Contour type** (phonological) - categorical choice
  2. **F0 implementation** (phonetic) - continuous parameters
- These should be modifiable independently

### What's Missing for Implementation

- Specific F0 values for each emotion
- Exact contour shapes (rise-fall patterns)
- Duration/rate modifications
- Voice quality parameters (AV, OQ, etc.)

## Open Questions

- [ ] What are the specific F0 targets for each emotion?
- [ ] How do pitch movements map to synthesis parameters (frame-by-frame F0)?
- [ ] What ToDI/ToBI labels correspond to which emotions?
- [ ] How does speech rate vary with emotion?
- [ ] What voice quality parameters (Klatt AV, OQ, etc.) map to emotions?

## Related Work Worth Reading

### Core References for Implementation

1. **'t Hart, Collier, Cohen (1990)** - "A perceptual study of intonation" - IPO model details
2. **Mozziconacci (1998)** [28] - Ph.D. thesis with full parameter values
3. **Cahn (1990)** [5] - "Generating expression in synthesized speech" - MIT implementation
4. **Williams & Stevens (1972)** [42] - "Emotions and speech: some acoustical factors" - acoustic correlates

### Methodology

5. **Scherer (1984, 1986)** [36-38] - Covariance vs. configuration approaches
6. **Patterson & Ladd (1999)** [30] - Pitch range modeling with F0 targets
7. **Ladd et al. (1985)** [24] - Three independent cues (F0 range, voice quality, contour type)

### Production Studies

8. **Banse & Scherer (1996)** [2] - Acoustic profiles in vocal emotion expression
9. **Protopapas & Lieberman (1997)** [32] - Fundamental frequency and perceived emotional stress

### Cross-Cultural

10. **Tickle (1999)** [41] - Cross-language vocalization of emotion
