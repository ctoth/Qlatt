# Murray & Arnott 1993 — Implementation Notes

## Table I: Summary of Vocal Emotion Effects (Five Primary Emotions)

All values are relative to neutral speech, for American English male speakers unless noted.

| Parameter | Anger | Happiness | Sadness | Fear | Disgust |
|-----------|-------|-----------|---------|------|---------|
| Speech rate | slightly faster | faster or slower | slightly slower | much faster | very much slower |
| Pitch average | very much higher | much higher | slightly lower | very much higher | very much lower |
| Pitch range | much wider | much wider | slightly narrower | much wider | slightly wider |
| Intensity | higher | higher | lower | normal | lower |
| Voice quality | breathy, chest tone | breathy, blaring | resonant | irregular voicing | grumbled, chest tone |
| Pitch changes | abrupt, on stressed syllables | smooth, upward inflections | downward inflections | normal | wide, downward terminal inflections |
| Articulation | tense | normal | slurring | precise | normal |

## Three Main Parameter Categories

1. **Voice quality** — the most important for differentiating secondary emotions; includes breathiness, tenseness, chest/head register, voicing regularity
2. **Utterance timing** — speech rate, pause patterns, syllable duration
3. **Utterance pitch contour** — F0 level, range, shape, and timing; the most important for differentiating basic emotions

## Detailed Emotion Parameters

### Anger
- **F0**: Highest observed pitch median (229 Hz in Fairbanks' studies), widest pitch range (10.3 tones), widest mean inflectional range (2.6 tones), highest rate of pitch change (25.6 tones/s), highest mean rate during inflection (25.6 tones/s), mean pitch shift within phrases of two tones
- **Speech rate**: Increased (190 wpm, pauses 32% of total speaking time)
- **Duration**: Stressed syllables lengthened within; rapid off-glide between syllables
- **Voice quality**: Breathy, chest tone; extremely strong dynamics; heavy voice production; sometimes head tone from tension
- **Pitch contour**: Straight, rigid melodic line; stressed syllables ascend frequently and rhythmically; angular frequency curve
- **Articulation**: Tense; vowels more open (higher F1); consonants more clearly defined closure
- **Intensity**: Increased
- Two subtypes: frustration (higher F0) vs. threat (lower F0, perceived as having lower F0 due to larger pharynx → lower F1)

### Happiness/Joy
- **F0**: Much higher pitch median; wide pitch range
- **Speech rate**: Faster or slower (conflicting reports); tempo described as "lively"
- **Duration**: Increased in some cases; smiling raises formant frequencies
- **Voice quality**: Breathy, blaring; "moderately blaring" timbre; smiling raised F0 and formants
- **Pitch contour**: Smooth, upward inflections; rounded undulating curve; stressed syllables form slightly descending line; excited joy → alternating stress, capriciously ascending at irregular intervals
- **Articulation**: Normal
- **Intensity**: Increased; Skinner (1935) noted increase along with speech rate increase

### Sadness
- **F0**: Slightly lower than normal average pitch (136 Hz median in Fairbanks); narrowest pitch range (nine tones); narrowest inflectional range (1.7 tones); lowest rate of pitch change (15.6 tones/s)
- **Speech rate**: Low (129 wpm); high pause-to-phonation ratio (47%); slow speech rate due to longer vowels and consonants as well as inserted pauses
- **Voice quality**: Resonant; "slurred" enunciation
- **Pitch contour**: Long, sustained, slowly falling intonation throughout each phrase; downward inflections
- **Articulation**: Slurring
- **Intensity**: Decreased
- Extreme grief: pitch range may increase again; voicing irregularities; whispering possible

### Fear/Anxiety
- **F0**: Highest observed pitch median (254 Hz in Fairbanks); widest pitch range (11.2 tones); mean inflectional range of 2.3 tones; mean rate of pitch change during inflection of 19 tones/s; mean pitch shift within phrases of two tones
- **Speech rate**: High (202 wpm); pauses 31% of total speaking time
- **Duration**: Voicing irregularity; disturbed respiratory pattern
- **Voice quality**: Irregular voicing; voicing irregularity sometimes present
- **Pitch contour**: Normal; apparent disintegration of pattern; great number of changes in direction of pitch movement; increased pitch level with reduced melodic intervals
- **Articulation**: Precise; vowels and consonants more precisely articulated
- **Intensity**: Normal

### Disgust/Contempt/Scorn
- **F0**: Very much lower; low pitch median (124 Hz in Fairbanks); wide pitch range (10.5 tones); mean inflectional range of 16.8 tones/s
- **Speech rate**: Very much slower (116 wpm); prolonged phonation time and increased pause length; pauses 33% of total speaking time
- **Voice quality**: Grumbled, chest tone; compressed or grumbled voice production; narrow pitch range
- **Pitch contour**: Wide, downward inflections at phrase endings; slightly descending melodic line
- **Articulation**: Normal; often lengthening of stressed syllables
- **Intensity**: Lower; reduced loudness

## Secondary Emotions (less studied)

### Grief/Sorrow (extreme form of sadness)
- Low speech rate (129 wpm), high pause ratio (47%)
- Pitch range may increase; voicing irregularities may appear
- Sobbing possible

### Affection/Tenderness
- Higher pitch level, does not fluctuate
- Very slightly descending melody; narrow pitch range
- Far above basic level; "restrained" tempo; "reduced" loudness
- "Extremely soft" and "a little nasal" articulation
- Smooth contact of vocal folds; off-glide (portamento) on long stressed syllables
- Voice sounds "full" (Fonagy 1981); "absence of aggressiveness"

### Sarcasm/Irony
- Contradiction between verbal and nonverbal content
- Special intonation properties: nasalization, exaggeratedly slow speech rate, very heavy stress
- Three-phase creaky voice profile (Fonagy 1981):
  1. Initial phase: creaky voice, very low pitch, fairly straight contour
  2. Second phase: head register, reduced intensity, rise in pitch toward very high (250 Hz male), tense palatalised articulation, sharper vowels
  3. Third phase: return to chest register, creaky voice, pitch returns to initial level; velum lowered (nasal timbre)

### Surprise/Astonishment
- Voice suddenly glides up to high level within stressed syllable
- Then falls to mid level (joyful surprise) or lower level (stupefaction)
- Strong stress at beginning; following syllables run down weakly
- Tempo restrained; voice is breathy
- Very wide pitch range; pitch median normal or higher than normal
- Very short-lived emotion

## Voice Quality Parameters (for Klatt mapping)

The paper emphasizes that voice quality is carried at the intrasegmental level and is important for emotion communication:

- **Breathiness**: Associated with happiness, anger (sometimes), tenderness
- **Chest tone**: Associated with anger, disgust; heavy voice production
- **Head register**: Associated with fear (sometimes), sarcasm phase 2
- **Creaky voice**: Associated with sarcasm/irony
- **Blaring timbre**: Associated with happiness, anger
- **Resonant timbre**: Associated with sadness
- **Irregular voicing**: Associated with fear
- **Nasalization**: Associated with sarcasm/irony

### Klatt Parameter Mapping

For a Klatt synthesizer, the emotion effects map approximately to:

| Emotion Parameter | Klatt Parameters |
|-------------------|-----------------|
| Pitch average/range/contour | F0, F0 contour shape |
| Speech rate | Segment durations, pause durations |
| Intensity | AV (voicing amplitude), overall gain |
| Voice quality: breathiness | AH (aspiration amplitude), OQ (open quotient) |
| Voice quality: tenseness | TL (spectral tilt), BW adjustments |
| Voice quality: chest tone | Lower F0, increased low-frequency energy |
| Voice quality: creaky voice | Very low F0, irregular F0, diplophonia |
| Voice quality: nasalization | FNZ, FNP (nasal zero/pole frequencies), BNZ, BNP |
| Articulation precision | Formant target undershoot/overshoot, transition rates |

## Experimental Methods Notes

- Three main experimental techniques for emotion content analysis:
  1. Meaningless content (reading alphabet while expressing emotions)
  2. Constant content (same sentence, different emotions)
  3. Ignoring content (electronic filtering, measuring only nonverbal properties)
- Trade-off between realism (field recordings) and control (laboratory)
- Pitch envelope (level, range, shape, timing) is the most important parameter for differentiating basic emotions
- Voice quality is more important for differentiating secondary emotions

## Synthesis Application (Section III)

- DECtalk (Digital Equipment Corporation) identified as having sufficient control over pitch, duration, and ~30 voice quality parameters
- DECtalk-based prototypes produced by Murray et al. (1988) and Cahn (1988, 1989)
- Both noted sufficient parametric control; main gap was intensity control in text-to-speech mode
- Rule-based system suggested: definable characteristics of emotions → rules → final stage of TTS pipeline
- A coherent model of the emotion process (stimulus → nervous system → acoustic parameters) would be advantageous but does not yet exist

## Key Dimensions of Emotion (Section I.B)

- Schlosberg (1954): three dimensions — Strength (attention-rejection), Valence (pleasant-unpleasant), Activity (sleep-tension)
- Typically 2-3 dimensional models
- Four commonly accepted "basic" emotions: happiness, sadness, anger, fear
- Dimensional vs. categorical debate unresolved; discrete emotions exist as points within a continuous dimensional space
