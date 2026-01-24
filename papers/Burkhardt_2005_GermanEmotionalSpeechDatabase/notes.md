# A Database of German Emotional Speech

**Authors:** F. Burkhardt, A. Paeschke, M. Rolfes, W. Sendlmeier, B. Weiss
**Year:** 2005
**Venue:** INTERSPEECH 2005, Lisbon, Portugal
**URL:** http://www.expressive-speech.net/emodb/

## One-Sentence Summary
Describes the Berlin Database of Emotional Speech (EmoDB): 800 acted German utterances across 7 emotions with perception validation, phonetic labels, and electroglottograms - freely available for emotional speech synthesis research.

## Problem Addressed
Need for high-quality, controlled emotional speech data with:
- Consistent verbal content across emotions and speakers
- High audio quality for spectral analysis
- Electroglottograms for inverse filtering / voice quality analysis
- Perceptual validation of emotional authenticity

## Key Contributions
- 10 actors (5M/5F) performing 10 German sentences in 7 emotions (~800 utterances)
- Rigorous perception test filtering (>80% recognition, >60% naturalness)
- Narrow phonetic transcription with voice quality markers
- Electroglottogram (EGG) recordings for each utterance
- Freely downloadable database

## Database Specifications

### Emotions (7 total)
| Emotion | German | Recognition Rate |
|---------|--------|------------------|
| Anger | Ärger | 96.9% |
| Neutral | neutral | 88.2% |
| Fear | Angst | 87.3% |
| Boredom | Langeweile | 86.2% |
| Happiness/Joy | Freude | 83.7% |
| Sadness | Trauer | 80.7% |
| Disgust | Ekel | 79.6% |

### Recording Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Speakers | 10 (5M, 5F) | Selected from 40 candidates |
| Sentences | 10 | 5 short (1 phrase), 5 long (2 phrases) |
| Total utterances | ~800 | 7 emotions × 10 actors × 10 sentences + variants |
| Sample rate (original) | 48 kHz | |
| Sample rate (distributed) | 16 kHz | Downsampled |
| Microphone | Sennheiser MKH 40 P 48 | |
| Recorder | Tascam DA-P1 DAT | |
| Laryngograph | Laryngograph Ltd. portable | EGG signal |
| Environment | Anechoic chamber | TU Berlin Technical Acoustics |
| Mic distance | ~30 cm | Variable due to actor movement |

### Sentence Material (German with English)
```
a01: Der Lappen liegt auf dem Eisschrank.
     (The cloth is lying on the fridge.)
a02: Das will sie am Mittwoch abgeben.
     (She will hand it in on Wednesday.)
a04: Heute Abend könnte ich es ihm sagen.
     (Tonight I could tell him.)
a05: Das schwarze Stück Papier befindet sich da oben neben dem Holzstück.
     (The black sheet of paper is up there beside the piece of timber.)
a07: In sieben Stunden wird es soweit sein.
     (In seven hours the time will have come.)
b01: Was sind denn das für Tüten, die da unter dem Tisch stehen?
     (What are the bags standing there under the table?)
b02: Sie haben es gerade hochgetragen und jetzt gehen sie wieder runter.
     (They have just carried it upstairs and now they are going down again.)
b03: An den Wochenenden bin ich jetzt immer nach Hause gefahren und habe Agnes besucht.
     (At the weekends I have always gone home now and seen Agnes.)
b09: Ich will das eben wegbringen und dann mit Karl was trinken gehen.
     (I just want to take this away and then go for a drink with Karl.)
b10: Die wird auf dem Platz sein, wo wir sie immer hinlegen.
     (It will be in the place where we always put it.)
```

## Methodology

### Actor Selection
1. Newspaper advertisement (40 respondents)
2. Preselection: perform one utterance per emotion
3. 3 expert listeners selected 10 (equal gender split)
4. Criteria: naturalness and recognisability
5. Result: 9/10 had acting training (but not theatrical exaggeration)

### Recording Protocol
1. Single session per actor (~2 hours)
2. Supervised by 3 phoneticians (2 instructions, 1 equipment)
3. Text prompted (not read) to avoid reading intonation
4. Emotion induction: Stanislavski method (recall real emotional experiences)
5. Actors could repeat sentences as desired
6. Instructions: no shouting (anger), no whispering (fear) - for voice quality analysis
7. Casual pronunciation preferred over theatrical

### Perception Evaluation
1. 20 subjects rated each utterance (single listen)
2. Forced choice: identify emotion
3. Rate naturalness/convincingness
4. Filter criteria: >80% recognition AND >60% naturalness
5. Result: ~300 utterances retained from ~800 (about 500 rejected)

### Additional Perception Tests
- Emotional strength rating (moderate to strong)
- Syllable stress judgement (8 trained phoneticians)

## Labeling System

### File 1: Narrow Phonetic Transcription (SAMPA)
- Auditory judgement + oscillogram/spectrogram
- Segment and pause boundaries
- Diphthongs as single segments
- Plosives: separate burst and aspiration phases

### Diacritics (IPA-based, German abbreviations)
- Voice quality: breathy, creaky, harsh, falsetto, whispery, faucalized
- Articulation: voiceless, voiced, aspirated, rounded, centralized
- Place: dental, apical, laminal, labialised, palatalised, velarised, pharyngealised
- Manner: syllabic, nasal release, no audible release, lateral, fricative
- Other: raised, lowered, advanced, retracted, long, labial spreading, denasal
- Settings: shouted, laughing

### Annotation Format
- Onset/offset markers: `+nas` ... `-nas` for nasalized spans
- Special marking for utterance-initial plosives (indeterminate start time)

### File 2: Syllable Segmentation
- Syllable boundaries
- 4 stress levels: sentence stress, primary, secondary, unstressed
- Verified by 8 trained phoneticians

## Web Interface Features (emodb)
- Filter by speaker, sentence, emotion
- View: syllable labels, duration, F0 contours, global trends
- F0 histograms, energy curves, loudness curves
- Zwicker loudness-based rhythm events
- MBROLA resynthesis versions downloadable
- Statistics: duration, stress, F0

## Known Limitations
1. **Variable mic distance**: actors moved, energy analysis unreliable
2. **Recording level adjustments**: between loud (anger) and quiet (sadness)
3. **Accent placement variation**: actors chose different sentence accents, complicating F0 contour comparison
4. **Acted emotions**: physiological differences from spontaneous emotions
5. **German only**: limited cross-linguistic applicability

## Relevance to Project (Klatt TTS)

### Direct Applications
1. **Emotional prosody targets**: F0 histograms and contours per emotion available
2. **Voice quality settings**: EGG data enables extraction of glottal parameters (OQ, SQ, RQ) for emotional voice
3. **Duration patterns**: statistics available for emotional timing modifications
4. **Validation corpus**: test emotional TTS output against recognized natural exemplars

### Potential Parameters to Extract
- F0 mean, range, and contour shapes per emotion
- Duration scaling factors per emotion
- Voice quality (from EGG): OQ variations for breathy/tense
- Spectral tilt differences

### Integration Path
1. Download database from emodb
2. Extract prosodic statistics (F0, duration) per emotion
3. Derive Klatt parameter modifications:
   - AV (voicing amplitude) for voice quality
   - F0 for pitch
   - Duration scaling
   - Possibly TL (spectral tilt)

## Open Questions
- [ ] What are the actual F0 statistics per emotion? (available on website)
- [ ] Can EGG-derived OQ values map to Klatt OQ parameter?
- [ ] How do German emotional patterns transfer to English TTS?

## Related Work Worth Reading
- Banse & Scherer 1996 - Acoustic profiles in vocal emotion (nonsense material)
- Scherer 1981 - Speech and emotional states (methodology comparison)
- Burkhardt 2001 - "Simulation emotionaler Sprechweise" (emotional TTS with formant synthesis)
- Laver 1980 - "The Phonetic Description of Voice Quality" (voice quality framework)
- Zwicker & Fastl 1990 - Psychoacoustics (loudness-based rhythm model)
