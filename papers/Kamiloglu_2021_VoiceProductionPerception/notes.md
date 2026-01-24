# Voice Production and Perception

**Authors:** Roza G. Kamiloglu, Disa A. Sauter
**Year:** 2021
**Venue:** Oxford Research Encyclopedia of Psychology
**DOI:** 10.1093/acrefore/9780190236557.013.766

## One-Sentence Summary
Comprehensive review of source-filter theory, acoustic parameters of voice, and emotional prosody production/perception - provides the theoretical foundation for understanding what acoustic features a synthesizer needs to manipulate for naturalistic speech.

## Problem Addressed
Provides an overview of how vocalizations are produced physiologically and how acoustic features map to perceived qualities (pitch, loudness, emotion, identity).

## Key Contributions
- Clear exposition of source-filter theory applied to human voice
- Mapping between physiological parameters and acoustic output
- Review of how emotions map to acoustic patterns
- Overview of voice quality types (modal, creaky, breathy/whispered)

## Methodology
Literature review synthesizing voice production physiology, acoustic phonetics, and emotion perception research.

## Key Concepts

### Source-Filter Theory (Fant, 1960; Titze, 1994)
Two-stage voice production:
1. **Source**: Vocal fold vibration in larynx creates sound
2. **Filter**: Supralaryngeal vocal tract shapes the spectrum

Source and filter can be controlled **independently** in humans - this is key for speech and emotional expression.

### Three Physiological Components
1. **Subglottal system**: Lungs + trachea - generates airflow
2. **Larynx**: Converts airflow to sound via vocal fold vibration
3. **Supralaryngeal vocal tract**: Pharyngeal, oral, nasal cavities - shapes spectrum

### Vocal Fold Vibration Mechanism
- Subglottal air pressure blows folds apart
- Bernoulli effect sucks them together
- Tissue elasticity restores position
- Cycle repeats at fundamental frequency

Key muscles:
- **Cricothyroid muscle**: Affects pitch
- **Thyroarytenoid muscle**: Affects voice quality

### Medial Surface Thickness Effects
- Large impact on vertical phase difference
- Affects higher-order harmonics excitation
- Decreasing resting glottal angle:
  - Lowers phonation threshold pressure
  - Reduces noise at high frequencies
  - Increases fundamental frequency

## Parameters

| Name | Symbol | Units | Perceptual Correlate | Notes |
|------|--------|-------|---------------------|-------|
| Fundamental Frequency | f0 | Hz | Pitch | Basic rate of vocal fold vibration |
| Formant Frequencies | F1, F2, ... | Hz | Vowel sound | Spectral peaks with high energy |
| Voice Intensity | - | dB | Loudness | Energy through unit area |
| Vibrato Rate | - | Hz | - | ~0.5 Hz decrease per decade with age |

### Singing Voice Pitch Ranges
| Voice Type | Range |
|------------|-------|
| Bass | 80-330 Hz |
| Soprano | 200-1200 Hz |

## Voice Quality Types

Three parameters determine voice quality:
1. **Adductive tension**
2. **Medial compression**
3. **Longitudinal tension**

| Voice Quality | Adductive Tension | Medial Compression | Longitudinal Tension |
|---------------|-------------------|--------------------|--------------------|
| Modal | Moderate | Moderate | Moderate |
| Creaky | High | High | Low |
| Whispered | Low | Moderate-High | Moderate |

**Modal voice**: Vocal folds vibrate as single unit; most frequent during normal speech
**Creaky voice**: Irregular glottal pulses, some aperiodicity
**Whispered**: Folds don't vibrate, narrow gap creates hissing

## Emotion-Acoustic Mappings

### Core Affect Dimensions
- **Arousal**: Degree of physiological alertness
- **Valence**: Degree of pleasure/displeasure

### Arousal Acoustic Correlates
| State | Pitch | Loudness | Speech Rate |
|-------|-------|----------|-------------|
| High arousal (fear, joy) | High | Loud | Fast |
| Low arousal (boredom) | Low | Quiet | Slow |

### Valence Acoustic Correlates
- Positive emotions: Lower frequency energy
- Negative emotions: Higher frequency energy
- Differences in intonation patterns and voice quality

### Physiological Pathway
```
Emotion → SNS/ANS changes → Muscle tension changes → Vocal apparatus modification → Acoustic patterns
```
- **SNS (Somatic)**: Affects larynx, vocal tract, articulatory muscles
- **ANS (Autonomic)**: Affects respiratory system (lungs, trachea)

## Evolutionary Considerations

### Human vs. Nonhuman Primate Differences
1. **Lowered larynx position**: More tongue space, more articulatory flexibility
2. **No air sacs**: Nonhuman primates use air sacs to lower formants

### Descended Larynx Effects
- Longer vocal tract
- Wider variety of vocal tract shapes
- Enhanced formant frequency variation
- More acoustically distinctive sounds

## Types of Vocalizations

### Speech
- Highly complex motor act
- Integrates auditory, somatosensory, motor information
- Meaning via semantics + prosody
- Prosody: pitch, amplitude, speech rate modifications

### Nonverbal Vocalizations (Affect Bursts)
- Sighs, laughs, grunts
- Not constrained by linguistic structures
- Less reliant on supralaryngeal movements
- Laughter = modified breathing, not speaking
- Evolutionarily older than speech
- Potent carriers of emotional information

### Singing
- Uses wider lung volume ranges than speech
- Subglottal pressure adjusted for both loudness AND pitch
- **Vibrato**: Periodic modulations from lung pressure

## Information Conveyed by Voice

1. **Physical characteristics**: Sex, body size
2. **Speaker identity**: Individual recognition
3. **Emotional state**: Positive/negative emotions
4. **Social information**: Regional accent, personality traits

### Sex Perception Cues
- Source features (pitch)
- Filter features (F2 formant frequency)
- Accurate even from brief segments or whispers

### Body Size Cues
- Higher pitch + higher formants → perceived smaller
- Men have lower mean pitch and formants (larger vocal folds)

## Voice Disorders

### Production Disorders
**Organic causes:**
- Vocal fold abnormalities
- Laryngeal structure problems
- Neurological (Parkinson's, laryngeal nerve paralysis)

**Functional causes:**
- Vocal misuse (screaming, yelling)
- Muscle tension imbalance

### Depression Voice Markers
- Low intensity
- Increased monotonicity (less pitch variation)
- Reduced articulation rate
- Varied pause duration

### Schizophrenia Voice Markers
- Increased pauses
- Decreased intensity variability
- Tonal abnormalities

## Relevance to Qlatt Project

### Direct Synthesis Implications
1. **Source-filter independence**: Confirms Klatt's cascade/parallel architecture is physiologically grounded
2. **Voice quality parameters**: Maps to Klatt parameters:
   - AV (voicing amplitude) → adductive tension
   - OQ (open quotient) → glottal configuration
   - AH (aspiration) → breathiness
3. **Formant manipulation**: F1-F5 control for vowel identity, speaker characteristics
4. **F0 control**: Critical for pitch perception, prosody, emotion

### Prosody Implementation
- High arousal: Increase F0, AV (amplitude), speed
- Low arousal: Decrease F0, AV, slow rate
- Valence: Spectral tilt modifications (voice quality)

### Voice Quality Synthesis
| Quality | Klatt Parameters to Adjust |
|---------|---------------------------|
| Modal | Standard settings |
| Creaky | Lower F0, irregular glottal pulses, reduce AV |
| Breathy | Increase AH, reduce AV, wider bandwidth |

## Figures of Interest
- **Fig 1 (page 3)**: Illustration of physiological basis - shows subglottal system, larynx, supralaryngeal tract, source vs filter

## Limitations
- Review paper, not original research
- No specific parameter values for synthesis
- Focused on perception psychology, not acoustic synthesis

## Open Questions
- [ ] What are the exact acoustic correlates of individual emotions beyond arousal/valence?
- [ ] How do voice quality changes interact with formant structure?
- [ ] Specific F0 contour patterns for different emotional states?

## Related Work Worth Reading
- Fant (1960) - Acoustic theory of speech production (source-filter theory origin)
- Titze (1994) - Principles of voice production
- Laver (1980) - Phonetic description of voice quality
- Scherer (1986, 2003) - Vocal affect expression models
- Gobl & Chasaide (2010) - Voice source variation and communicative functions
- Zhang (2016a, 2016b) - Physics of vocal fold vibration
