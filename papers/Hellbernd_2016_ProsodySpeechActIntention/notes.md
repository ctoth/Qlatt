# Prosody conveys speaker's intentions: Acoustic cues for speech act perception

**Authors:** Nele Hellbernd, Daniela Sammler
**Year:** 2016
**Venue:** Journal of Memory and Language, 88, 70-86
**DOI:** http://dx.doi.org/10.1016/j.jml.2016.01.001

## One-Sentence Summary
This paper demonstrates that distinct prosodic acoustic patterns reliably encode six different communicative intentions (speech acts), providing empirical acoustic profiles that could inform intention-aware prosody generation in TTS systems.

## Problem Addressed
How do listeners decode a speaker's communicative intention when it is not explicitly stated in the lexical content? The paper investigates whether prosody alone can convey "unspoken" intentions without relying on context or semantic meaning.

## Key Contributions
- Demonstrates that speakers use characteristic acoustic feature configurations for different speech acts (criticism, doubt, naming, suggestion, warning, wish)
- Shows listeners can reliably identify intentions from prosody alone, even without context or lexical meaning (non-words)
- Provides quantitative acoustic profiles linking specific acoustic parameters to intention perception
- Establishes that intention recognition is separable from emotion recognition (valence/arousal)

## Methodology
Three experiments:
1. **Experiment 1 (Acoustics):** Discriminant analysis of 768 stimuli (4 speakers × 4 tokens × 6 speech acts × 8 repetitions) to classify speech acts from acoustic features
2. **Experiment 2 (Perception):** 6-AFC categorization task + valence/arousal ratings (20 participants for words, 20 for non-words)
3. **Experiment 3 (Acoustics-Perception Link):** Multiple regression analyses predicting speech act ratings from acoustic features

## Key Equations

No formal equations, but key discriminant functions:

**Discriminant Function 1** (49.6-54.2% variance explained):
$$\text{F1} \propto \text{pitch rise (offset-onset f0)}$$

**Discriminant Function 2** (36.4-38.6% variance explained):
$$\text{F2} \propto \text{mean intensity} + \text{mean f0}$$

**Discriminant Function 3** (7.7-10.5% variance explained):
$$\text{F3} \propto \text{duration (voiced frames)}$$

## Parameters

### Acoustic Features Extracted (using Praat)

| Name | Symbol | Units | Description |
|------|--------|-------|-------------|
| Duration | voiced frames | count | Number of voiced frames |
| Mean F0 | mean f0 | Hz | Mean fundamental frequency |
| Pitch Rise | offset-onset f0 | Hz | Difference between offset and onset f0 |
| Mean Intensity | mean intensity | dB | Average intensity |
| HNR | mean HNR | dB | Harmonics-to-noise ratio |
| Spectral CoG | center of gravity | Hz | Spectral center of gravity |
| Spectral SD | SD spectrum | Hz | Standard deviation of spectrum |

### Mean Acoustic Features by Speech Act (Words)

| Speech Act | Duration (frames) | Mean f0 (Hz) | Offset-onset f0 (Hz) | Intensity (dB) | HNR (dB) |
|------------|-------------------|--------------|---------------------|----------------|----------|
| Criticism | 450.1 ± 61.1 | 230.7 ± 48.4 | 81.5 ± 91.6 | 65.1 ± 3.9 | 12.1 ± 3.2 |
| Doubt | 482.8 ± 68.7 | 188.9 ± 41.6 | 72.6 ± 30.9 | 57.2 ± 3.6 | 14.2 ± 3.4 |
| Naming | 341.1 ± 64.5 | 13.3 ± 42.6 | -51.6 ± 29.0 | 56.9 ± 4.2 | 13.3 ± 2.3 |
| Suggestion | 320.0 ± 56.4 | 206.1 ± 37.2 | 184.7 ± 55.2 | 63.3 ± 2.0 | 13.2 ± 2.7 |
| Warning | 428.4 ± 97.9 | 268.5 ± 49.4 | -122.7 ± 27.0 | 71.8 ± 2.3 | 13.9 ± 2.8 |
| Wish | 485.7 ± 62.9 | 148.6 ± 39.5 | -61.7 ± 16.4 | 59.1 ± 3.1 | 12.7 ± 2.1 |

### Valence/Arousal by Speech Act (approximate from Fig. 2)

| Speech Act | Valence (0-100) | Arousal (0-100) |
|------------|-----------------|-----------------|
| Criticism | ~25 (negative) | ~75 (excited) |
| Doubt | ~50 (neutral) | ~40 (calm) |
| Naming | ~50 (neutral) | ~20 (calm) |
| Suggestion | ~65 (positive) | ~55 (middle) |
| Warning | ~30 (negative) | ~90 (excited) |
| Wish | ~70 (positive) | ~25 (calm) |

### Regression Beta Weights (Acoustics → Speech Act Perception)

| Acoustic Parameter | Criticism | Doubt | Naming | Suggestion | Warning | Wish |
|--------------------|-----------|-------|--------|------------|---------|------|
| Voiced frames | 0.276*** | 0.348*** | -0.420*** | -0.227*** | 0.073*** | 0.083*** |
| Mean f0 | 0.371*** | 0.402*** | -0.326*** | -0.211*** | 0.385*** | -0.294*** |
| Offset-onset f0 | 0.224*** | 0.315*** | -0.277*** | 0.524*** | -0.387*** | -0.135*** |
| Mean intensity | -0.015 | -0.250*** | -0.266*** | 0.368*** | 0.343*** | 0.118*** |

## Implementation Details

### Prosodic Profile for Each Speech Act

**Criticism:**
- Long duration
- High mean pitch
- Rising pitch contour (positive offset-onset f0)
- Medium intensity

**Doubt:**
- Long duration
- Medium-high mean pitch
- Rising pitch contour
- Low intensity

**Naming (Neutral):**
- Short duration
- Low mean pitch
- Falling pitch contour (negative offset-onset f0)
- Low intensity
- Minimal acoustic salience overall

**Suggestion:**
- Short duration
- Medium mean pitch
- Strong pitch rise (highest offset-onset f0)
- High intensity

**Warning:**
- Medium-long duration
- Highest mean pitch
- Falling pitch contour (arched with salient peak)
- Highest intensity
- Most salient acoustic profile

**Wish:**
- Long duration
- Low mean pitch
- Falling pitch contour
- Low-medium intensity

### Classification Accuracy

| Speech Act | Acoustic Classification | Behavioral Recognition |
|------------|------------------------|------------------------|
| Criticism | 76.6% (words), 79.7% (non-words) | 62.0% (words), 52.4% (non-words) |
| Doubt | 92.2% (words), 84.4% (non-words) | 83.4% (words), 82.6% (non-words) |
| Naming | 100% (both) | 90.0% (words), 74.1% (non-words) |
| Suggestion | 95.3% (words), 98.4% (non-words) | 80.3% (words), 63.7% (non-words) |
| Warning | 100% (both) | 89.5% (words), 94.2% (non-words) |
| Wish | 90.6% (words), 95.3% (non-words) | 83.6% (words), 69.4% (non-words) |

## Figures of Interest
- **Fig. 1 (page 74):** Discriminant analysis scatter plots showing speech act clustering by first two discriminant functions
- **Fig. 2 (page 76):** Valence-arousal space showing emotional profiles of each speech act
- **Fig. 3 (page 79):** Beta weights visualization for acoustic features predicting each speech act

## Results Summary
- Discriminant analysis: 92% (words) and 93% (non-words) correct classification from acoustics alone
- Behavioral recognition: 82% (words) and 73% (non-words) correct identification
- Pitch features (mean f0, offset-onset f0) were most influential across all speech acts
- Results consistent across words and non-words, suggesting prosody conveys intention independently of lexical content
- Intention recognition remains significant after controlling for emotion (valence/arousal)

## Limitations
- Limited to 6 speech acts; not meant to be comprehensive
- Single-word stimuli may have led speakers to emphasize prosodic features more than in natural speech
- Lab recordings with fictional scenarios; ecological validity to natural conversation pending
- Speakers were voice coaches/speech scientists (not actors, but also not naive speakers)
- German language only; cross-cultural validation needed

## Relevance to Project
This paper provides empirically-grounded prosodic profiles for different communicative intentions, which could be used to:
1. Generate intention-appropriate prosody in TTS (e.g., warning vs. suggestion intonation)
2. Define prosodic "presets" for speech act categories
3. Map F0 contour shapes (rising/falling/arched) to specific intentions
4. Guide intensity and duration modulation for pragmatic effect

Key insight for Qlatt: The paper suggests "conventionalized" prosodic patterns exist for different intentions, with pitch contour shape (offset-onset F0) being the single most discriminating feature.

## Open Questions
- [ ] How do these patterns map to ToBI or other prosodic annotation schemes?
- [ ] Can the beta weights be directly used as synthesis parameters?
- [ ] How would these patterns interact with sentence-level prosody?
- [ ] Are German patterns transferable to English synthesis?

## Related Work Worth Reading
- Banse & Scherer (1996) - Acoustic profiles in vocal emotion expression (foundational methodology)
- Blanc & Dominey (2003) - Identification of prosodic attitudes by temporal recurrent network
- Pierrehumbert (1980) - English intonation (ToBI foundation)
- Sauter, Eisner, Calder, & Scott (2010) - Perceptual cues in nonverbal vocal expressions
- Morlec, Bailly, & Aubergé (2001) - Generating prosodic attitudes in French

---

## Collection Cross-References

### Already in Collection
- [[Banse_1996_VocalEmotionAcousticProfiles]]
- [[Kim_Snyder_2012_UniversalG2P]]
- [[Pierrehumbert_1980_EnglishIntonation]]
- [[White_2014_ProsodicTimingFunction]]

### New Leads (Not Yet in Collection)
- **Morlec, Bailly, & Aubergé (2001)** - "Generating prosodic attitudes in French" - Directly relevant to synthesis: describes a computational model for generating attitude-specific prosody in French TTS.
- **Blanc & Dominey (2003)** - "Identification of prosodic attitudes by temporal recurrent network" - Neural network approach to classifying prosodic attitudes, could inform machine learning approaches to intention-prosody mapping.
- **Tanenhaus, Kurumada, & Brown (2015)** - "Prosody and intention recognition" - Recent review on how context modulates prosodic interpretation; relevant for understanding when prosody alone is sufficient vs. when context is needed.
