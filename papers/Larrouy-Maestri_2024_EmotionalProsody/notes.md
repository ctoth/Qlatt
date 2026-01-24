# The Sound of Emotional Prosody: Nearly 3 Decades of Research and Future Directions

**Authors:** Pauline Larrouy-Maestri, David Poeppel, Marc D. Pell
**Year:** 2024 (published in Perspectives on Psychological Science, 2025, Vol. 20(4), 623-638)
**Venue:** Perspectives on Psychological Science (Association for Psychological Science)
**DOI:** 10.1177/17456916231217722

## One-Sentence Summary

A comprehensive review charting 3 decades of emotional prosody research, identifying key acoustic features (f0, duration, loudness, timbre/spectral quality, dynamics) associated with different emotions, while highlighting the lack of consensus and proposing research directions to establish clearer acoustics-emotion mappings for TTS and emotion recognition systems.

## Problem Addressed

Despite decades of research, the mapping between acoustic properties of speech and emotional states remains poorly defined. There is no comprehensive, definitive description of the "sound" of specific emotions, which limits progress in:
- Clinical diagnostic tools for prosody deficits
- Text-to-speech systems aiming for natural emotional expression
- Automatic emotion recognition systems
- Understanding developmental and aging curves of emotional prosody

## Key Contributions

- Chronological synthesis of emotional prosody research from 1996-2021 building on Banse & Scherer (1996)
- Categorization of acoustic features into three main groups: quality/spectral, dynamic/contour, and other features
- Identification of sources of variability preventing consensus (speech material, acoustic measurement choices, cultural factors, emotion granularity, authenticity)
- Concrete research directions for addressing current challenges
- Summary of standardized parameter sets (GeMAPS with 62 parameters, eGeMAPS with 88 parameters)

## Methodology

### Approach
Literature review using Google Scholar to track all citations of the landmark Banse & Scherer (1996) paper, synthesizing findings across computer science, social sciences, neurosciences, medical sciences, and humanities.

### Research Framework (Brunswik's Lens Model)
1. **Distal information**: Internal state of speaker (estimated via acoustic analysis)
2. **Proximal information**: Listener's perception
3. **Encoding process**: Speaker produces acoustic cues reflecting emotional state
4. **Decoding process**: Listener interprets acoustic cues to infer emotion

## Key Acoustic Feature Categories

### 1. Quality/Spectral Features (Blue in Fig. 1)

| Feature | Reference | Description |
|---------|-----------|-------------|
| Perturbation measures | Whiteside (1999) | Jitter, shimmer |
| Formants | Burkhardt & Sendlmeier (2000) | F1, F2, F3 frequencies |
| Voice types | Gobl & Chasaide (2003) | Harsh, tense, modal, breathy, whispery, creaky, lax-creaky |
| Harmonic-to-noise ratio | Borchert & Dusterhoft (2005) | Different spectral bands |
| Energy bands | Klabbers et al. (2007) | Four energy bands, overall energy, spectral tilt |
| Spectral slope | Tamarit et al. (2008) | Speaker-adapted measurements |
| Phoneme-specific spectral | Bitouk et al. (2009) | Per-phoneme spectral features |
| Spectral envelope | Luengo et al. (2010) | Voice quality measures |
| Subband energy variations | Amarakeerthi et al. (2013) | Inter- and intra-subband |
| H1-H2 difference | Elbarougy & Akagi (2013) | First and second harmonics |
| Spectral tilt + high freq | Kabuta et al. (2013) | Higher frequency bands |
| Modulation spectral | Zhu et al. (2018) | Modulation spectral features |
| Excitation features | Kadiri et al. (2020) | Using neutral speech reference |

### 2. Dynamic/Contour Features (Red in Fig. 1)

| Feature | Reference | Description |
|---------|-----------|-------------|
| Intonation patterns | Mozziconacci & Hermes (1999) | Categorical patterns |
| F0 inflections | McGilloway et al. (2000) | Number of inflections in contours |
| Dynamical speech features | Fellenz et al. (2000) | Time-varying characteristics |
| Stylization procedure | Banziger & Scherer (2005) | MOMEL/INTSINT tools |
| Contour categories | Knoll et al. (2006) | Bell, complex, falling, rising, level |
| Slope features | Ververidis & Kotropoulos (2006) | Downward and rising slopes |
| Pitch curve decomposition | Klabbers et al. (2007) | Superpositional model |
| Sentence-end features | Luengo et al. (2010) | Terminal contour characteristics |
| Stylized contours | Rodero (2011) | Contrasted contour types |
| Prosodic contours | Grichkovtsova et al. (2012) | Voice quality + contour manipulation |
| Rising/falling slopes | Eyben et al. (2016) | Mean and SD of slopes |
| Linear regression coefficients | Alonso et al. (2017) | Modeling F0 contours |
| Short intonation contours | Rajkovic et al. (2018) | Brief contour segments |
| Relative F0 movements | Van Mersbergen & Lanza (2019) | Transient emotional states |
| Slope description | van Rijn et al. (2023) | Morphometric approach |

### 3. Other Features (Orange in Fig. 1)

| Feature | Reference | Description |
|---------|-----------|-------------|
| Linguistic + acoustic | Schuller et al. (2004) | Combined information |
| Glottal flow parameters | Airas & Alku (2006) | Inverse filtering |
| Phoneme/pause durations | Hozjan & Kacic (2006) | Segmental timing |
| Phonetic classes | Bitouk et al. (2009) | Class-level features |
| Music-theory features | Yang & Lugger (2010) | Harmony-inspired |
| Vocal folds excitation | Chen et al. (2013) | Electroglottograph |
| Bimodal information | Gievska et al. (2015) | Linguistic + prosodic |
| Phonation type | Birkholz et al. (2015) | Breathy, modal, pressed |
| Long-range context | Lee & Tashev (2015) | Label uncertainty |
| Semantic content | Shigeno (2018) | Word meaning effects |
| Paradigmatic vowel variations | Rilliard et al. (2018) | Vowel-specific changes |
| Laryngeal tone | Dimitrova-Grekow & Konopko (2019) | Laryngeal characteristics |

## Emotion-Specific Acoustic Profiles (Banse & Scherer 1996)

| Emotion | Pitch | Temporal | Loudness | Timbre | General Description |
|---------|-------|----------|----------|--------|---------------------|
| Hot anger | X | X | | X | High and bright voice with limited pitch fluctuations |
| Panic fear | X | | | | High-pitched voice with limited fluctuations |
| Anxiety | X | | X | | Quiet voice in middle pitch range with limited pitch fluctuations |
| Desperation | X | X | | X | High and bright voice with limited pitch fluctuations and slow speech rate |
| Sadness | | | X | X | Quiet and thin voice |
| Elation | X | | | X | High-pitched voice with some fluctuations |
| Boredom | X | X | X | | Low and quiet voice with slow speech rate |
| Shame | | | X | | Quiet voice |
| Pride | X | | | | Low-pitched voice |
| Contempt | X | | | | Low-pitched voice with some pitch fluctuations |

**Note:** Pitch = mean and SD of f0; Temporal = duration of articulation (non-silent) periods; Loudness = mean log-transformed microphone voltage; Timbre = Hammarberg index (energy 0-2kHz vs 2-5kHz), proportion voiced energy <1kHz, spectral slope >1kHz.

## Standardized Parameter Sets

### GeMAPS (Geneva Minimalistic Acoustic Parameter Set)
- **Low-level descriptors:** 18 parameters (frequency, energy/amplitude, spectrum)
- **Derivatives:** Lead to 56 total parameters
- **Temporal features:** 6 additional
- **Total:** 62 parameters
- **Implementation:** openSMILE toolkit (publicly available)

### eGeMAPS (Extended version)
- **Total:** 88 parameters
- Includes additional cepstral and dynamic parameters

### Key Features from Large-Scale Studies

**Cowen et al. (2019) - 2,519 samples, 5 cultures, 12 emotions:**
- Duration
- Pause time
- Mean f0
- Minimum/maximum f0
- F1, F2, F3 average frequencies
- First/third quartiles of frequency spectrum
- Spectral centroid
- Pitch salience

**van Rijn & Larrouy-Maestri (2023) - 3,000 min recordings:**
Seven acoustic factors (57% variance explained):
1. Voice quality
2. Loudness
3. Pitch/formants
4. Rhythm/tempo
5. Shimmer
6. Pitch variation
7. Mel-frequency cepstrum

## Parameters for TTS Implementation

| Parameter | Symbol | Units | Emotion Association | Notes |
|-----------|--------|-------|---------------------|-------|
| Mean F0 | $\bar{f_0}$ | Hz | High: anger, fear, elation; Low: sadness, boredom | Speaker-relative |
| F0 Standard Deviation | $\sigma_{f0}$ | Hz/semitones | High: contempt, elation; Low: anger, fear, anxiety | Pitch variability |
| F0 Range | $f_{0,max} - f_{0,min}$ | Hz | Wider for expressive emotions | Min/max difference |
| Speech Rate | | syllables/s | Slow: sadness, boredom, desperation; Fast: anger, fear | Articulation rate |
| Pause Duration | | ms | Longer for sad, contemplative | Silent intervals |
| Mean Intensity | | dB | High: anger; Low: sadness, shame, anxiety | Overall loudness |
| Spectral Tilt | | dB/octave | Steeper for breathy/sad | Energy distribution |
| Hammarberg Index | | dB | Energy(0-2kHz) - Energy(2-5kHz) | Brightness measure |
| H1-H2 | | dB | First harmonic minus second | Breathiness indicator |
| Formant Frequencies | F1, F2, F3 | Hz | Emotion-dependent shifts | Vowel quality changes |
| Jitter | | % | Voice perturbation | Pitch cycle variation |
| Shimmer | | % | Amplitude perturbation | Amplitude cycle variation |
| HNR | | dB | Harmonic-to-noise ratio | Voice quality |

## Implementation Details

### Data Structures Needed
- Per-frame acoustic feature vectors (f0, formants, energy, spectral features)
- Contour representations (stylized pitch tracks, slope coefficients)
- Emotion category or dimensional (arousal/valence) targets
- Speaker normalization statistics (mean, SD for f0 and intensity)

### Prosody Contour Quantification Methods

1. **Stylization (MOMEL/INTSINT)**
   - Mark key points on pitch contour
   - Reduce to symbolic representation (H, M, L, U, D, S, etc.)

2. **Linear Regression**
   - Model pitch trajectory: $f_0(t) = a + bt$
   - Intercept $a$ = pitch height
   - Slope $b$ = declination/trend

3. **Morphometric Approach**
   - Shape-based analysis of contours
   - Captures dynamic changes over time

### Critical Implementation Considerations

1. **Unit Size:** Different emotional information at different levels (phoneme, syllable, word, phrase, sentence)

2. **Dynamics:** Static summary statistics (mean, SD) are insufficient; temporal evolution matters

3. **Speaker Normalization:** Emotions are relative to speaker's baseline
   - Z-score normalization: $(x - \mu_{speaker}) / \sigma_{speaker}$

4. **Cultural Variation:** Acoustics-emotion mapping varies across languages/cultures

5. **Authenticity:** Acted/posed speech differs acoustically from spontaneous emotional speech

## Figures of Interest

- **Fig. 1:** Timeline (1996-2021) showing chronological development of acoustic features in emotional prosody research, categorized into quality/spectral (blue), dynamic/contour (red), and other features (orange). Essential reference for feature selection.

- **Table 1:** Acoustic predictors for 10 emotion categories from Banse & Scherer (1996) - foundational mapping between acoustic dimensions and emotions.

- **Table 2:** Research directions for addressing sources of variability - useful for understanding limitations of current approaches.

## Results Summary

- No definitive acoustic signature exists for each emotion
- Mapping between acoustics and emotions is complex and modulated by:
  - Speech material characteristics
  - Acoustic feature choices
  - Cultural/linguistic background
  - Emotion granularity (beyond 6 basic emotions)
  - Authenticity of expressions
- Seven acoustic factors explain ~57% of variance in emotional classification
- In-group advantage exists for emotion recognition (cultural familiarity)
- Positive emotions show distinct profiles: high pitch for joy/amusement, low pitch for lust/admiration, fast rate for joy/pride, slow rate for pleasure

## Limitations

- No comprehensive consensus on acoustics-emotion mapping after 30 years
- Most studies use posed/acted speech which differs from spontaneous expressions
- Selection procedures (keeping only well-recognized stimuli) reduce variability and may bias findings
- Material length affects acoustic characteristics (single vowel vs. sentence)
- Language-specific effects confound cross-cultural comparisons
- Direction and magnitude of feature changes for emotion perception thresholds largely unknown
- Current studies limited to ~12-14 emotion categories; human emotional space is richer

## Relevance to TTS Systems

### Direct Applications

1. **Emotional TTS Synthesis:**
   - Use emotion-specific parameter profiles to modulate:
     - F0 mean, range, and contour shape
     - Speaking rate and pause patterns
     - Intensity/loudness
     - Spectral characteristics (formant shifts, spectral tilt)
     - Voice quality parameters

2. **Prosody Generation Rules:**
   - Anger: Raise mean f0, increase intensity, add spectral brightness
   - Sadness: Lower mean f0, reduce intensity, slower rate, steeper spectral tilt
   - Fear: Raise f0, limit fluctuations, increase rate
   - Joy/Elation: Raise f0, increase variability, faster rate

3. **Formant Synthesis (Klatt):**
   - Modulate F1-F3 for vowel quality changes with emotion
   - Adjust AV (voicing amplitude) for loudness
   - Modify spectral tilt parameters (TL, spectral balance)
   - Control source parameters for voice quality (OQ, AH for breathiness)

4. **Contour Generation:**
   - Implement dynamic pitch contours, not just static targets
   - Consider sentence-final patterns (terminal contours)
   - Model rising/falling slope characteristics

### Cautions for Implementation

- Avoid stereotypical/caricatured emotional renderings
- Consider speaker-relative modifications
- Account for linguistic prosody interactions (lexical stress, focus, sentence type)
- Emotional prosody varies across cultures - may need language-specific rules

## Open Questions

- [ ] What are the perceptual thresholds for acoustic changes to shift emotion perception?
- [ ] How do acoustic units of different sizes (phoneme, syllable, phrase) integrate for emotion perception?
- [ ] What makes synthetic emotional voices sound "unnatural" vs. authentic?
- [ ] How should emotion granularity be handled (beyond basic 6 categories)?
- [ ] What is the relative weighting of pitch vs. spectral vs. temporal features for each emotion?
- [ ] How to balance cultural universals vs. language-specific emotional prosody patterns?

## Related Work Worth Reading

- **Banse & Scherer (1996)** - Landmark paper on acoustic profiles of 14 emotions
- **Juslin & Laukka (2003)** - Review of emotion communication in speech and music
- **Eyben et al. (2016)** - GeMAPS standardized parameter set (openSMILE)
- **Cowen et al. (2019)** - Cross-cultural study of 12 emotions across 5 cultures
- **van Rijn & Larrouy-Maestri (2023)** - Large-scale modeling of individual and cross-cultural variation
- **Grichkovtsova et al. (2012)** - Voice quality and prosodic contour roles in affective perception
- **Laukka (2005)** - Categorical perception of emotional expressions via morphing
- **Murray & Arnott (1993)** - Early review of emotion simulation in synthetic speech
- **Scherer (1986, 2003, 2019)** - Foundational theoretical models of vocal affect expression
