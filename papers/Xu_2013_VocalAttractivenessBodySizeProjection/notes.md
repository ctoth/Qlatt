# Human Vocal Attractiveness as Signaled by Body Size Projection

**Authors:** Yi Xu, Albert Lee, Wing-Li Wu, Xuan Liu, Peter Birkholz
**Year:** 2013
**Venue:** PLoS ONE 8(4): e62397
**DOI:** 10.1371/journal.pone.0062397

## One-Sentence Summary

Five perception experiments demonstrate that vocal attractiveness follows a body size projection principle: female attractiveness is signaled by high pitch, wide formant dispersion, and breathiness (small body), while male attractiveness is signaled by low pitch and narrow formant dispersion (large body) -- but breathiness enhances attractiveness for both sexes, and these same dimensions drive anger-happiness emotion judgments.

## Problem Addressed

The mechanism underlying vocal attractiveness has been unclear. Prior work showed correlations between individual acoustic parameters (f0, formant dispersion) and attractiveness, but lacked a unifying theoretical framework. This paper proposes that Morton's (1977) motivation-structural rules for animal calls -- where large body size signals are used for aggression/dominance and small body size signals for appeasement/friendliness -- also govern human vocal attractiveness.

## Key Contributions

- Provides a unifying theoretical framework (body size projection) for vocal attractiveness
- Demonstrates that breathiness universally enhances attractiveness for both male and female voices
- Shows that attractiveness and emotion (anger vs. happiness) share the same acoustic dimensions
- Uses both natural speech manipulation (Experiment 1) and VocalTractLab articulatory synthesis (Experiments 2-5) to confirm robustness
- Male vocal attractiveness involves a trade-off: large body size cues (low pitch, narrow formants) increase attractiveness, but breathiness (small body size cue) also helps by softening perceived aggressiveness

## Methodology

### Experiment 1: Natural speech manipulation (female voice attractiveness)
- Base sentence: "Good luck with your exams" spoken by female British English speaker in 3 voice qualities (normal, breathy, pressed)
- Pitch contours normalized via Praat
- Manipulated: Formant shift, Pitch shift, Final syllable F0 slope
- 10 male listeners, 5-level attractiveness scale

### Experiments 2-5: Synthetic speech (VocalTractLab 2.0)
- Base sentence: "I owe you a yoyo" synthesized with VocalTractLab
- Three voice qualities: pressed, modal, breathy (controlled via upper-lower rest displacement parameter)
- Voice quality verified acoustically (Table 2):
  - Centre of gravity: pressed 585 Hz, modal 473 Hz, breathy 353 Hz
  - H1-H2*: pressed -1.4, modal 3.3, breathy 5.1
  - H1-A1*: pressed -4.6, modal 0.6, breathy 5.2
  - H1-A3*: pressed -43.1, modal -36.3, breathy -25.9
- Manipulated parameters per experiment:

| Parameter | Levels | Values |
|-----------|--------|--------|
| Voice quality | 3 | pressed, modal, breathy |
| Formant shift | 3 | x0.9 (narrow), x1.0, x1.1 (wide) |
| Pitch shift | 3 | -2, 0, +2 semitones |
| Pitch range | 3 | x0.25 (narrow), x1.0, x2.0 (wide) |

- Female versions: F0 median +12 semitones, Formant Shift +0.2
- 16 listeners per experiment (Exp 2: 16M+16F; Exp 3: 16F; Exp 4-5: 16M+16F)
- 81 stimuli per condition (3x3x3x3), 5-level scale

## Key Results

### Female vocal attractiveness (rated by males)

| Parameter | Direction of attractiveness | Statistical result |
|-----------|---------------------------|-------------------|
| Voice quality | Breathy > Modal > Pressed | Exp 1: F(2,18)=21.7, p<0.001; Exp 2: F(1.13,16.98)=40.15, p<0.001 |
| Pitch shift | Higher pitch more attractive | Exp 1: F(2,18)=5.6, p<0.05; Exp 2: F(1.12,16.80)=3.79, p=0.065 |
| Formant shift | Wider dispersion more attractive | Exp 1: F(2,18)=3.6, p<0.05; Exp 2: not significant |
| Pitch range | Normal/narrow > wide | Exp 2: significant |
| F0 slope | Normal > steep/shallow | Exp 1: F(2,18)=5.6, p<0.05 |

### Male vocal attractiveness (rated by females, Experiment 3)

| Parameter | Direction of attractiveness | Statistical result |
|-----------|---------------------------|-------------------|
| Voice quality | Breathy > Modal > Pressed | F(1.21,18.19)=8.22, p=0.007 |
| Pitch shift | Lower pitch more attractive | F(2,30)=14.49, p<0.001 |
| Formant shift | Narrower dispersion more attractive | F(2,30)=66.79, p<0.001 |
| Pitch range | Normal/narrow > wide | F(1.16,17.42)=11.04, p=0.003 |

### Emotion ratings (anger-happiness)

Experiments 4-5 showed the same acoustic dimensions that signal attractiveness also signal emotion:
- Female happy voice: breathy, high pitch, wide formants, wide pitch range
- Female angry voice: pressed, low pitch, narrow formants
- Male angry voice: low pitch, narrow formants (= attractive male voice dimensions)
- Breathiness: makes voice sound happier for females; non-significant for males

## Parameters

### VocalTractLab voice quality settings (Table 2)

| Measure | Pressed | Modal | Breathy |
|---------|---------|-------|---------|
| Centre of gravity (Hz) | 585 | 473 | 353 |
| H1-H2* (dB) | -1.4 | 3.3 | 5.1 |
| H1-A1* (dB) | -4.6 | 0.6 | 5.2 |
| H1-A3* (dB) | -43.1 | -36.3 | -25.9 |

### Praat manipulation parameters (Table 1)

| Parameter | Values |
|-----------|--------|
| Voice quality | pressed, modal, breathy (VocalTractLab: upper-lower rest displacement -0.10, 0.10, 0.30 mm) |
| Formant shift ratio | 0.9, 1.0, 1.1 |
| Pitch shift (semitones) | -2, 0, +2 |
| Pitch range multiplier | 0.25, 1.0, 2.0 |
| Female F0 offset | +12 semitones from male base |
| Female formant shift offset | +0.2 from male base |

## Implementation Details

### VocalTractLab voice quality control
- Voice quality controlled via "upper-lower rest displacement" parameter:
  - -0.10 mm = pressed voice
  - +0.10 mm = modal voice (default)
  - +0.30 mm = breathy voice
- This parameter controls the degree of glottal abduction at the rest position
- Verified by spectral measures showing systematic variation in H1-H2*, H1-A1*, H1-A3*

### Acoustic manipulation procedure
- Formant dispersion modified using Praat "Change gender" function with formant_shift_ratio
- Pitch modified by semitone shift
- Pitch range modified by multiplying F0 deviation from median
- Intensity normalized across all stimuli

### Energy band analysis (Figure 3)
- Three energy bands used for voice quality verification:
  - Band 1: 0-300 Hz (fundamental and low harmonics)
  - Band 2: 300-2000 Hz (mid harmonics)
  - Band 3: 2000-5000 Hz (high harmonics)
- Breathy voice has more energy in Band 1, less in Band 3
- Pressed voice has more energy in Band 3, less in Band 1

## Figures of Interest

- **Figure 2a-c:** Attractiveness ratings across all parameter combinations for Experiments 1-3. Shows monotonic breathiness effect clearly.
- **Figure 2d-f:** Emotion ratings for the same stimuli. Shows parallel pattern between attractiveness and emotion dimensions.
- **Figure 3:** Energy band analysis comparing natural (Exp 1) and synthetic (Exp 2) voice qualities, confirming VocalTractLab produces comparable spectral profiles.

## Results Summary

1. **Breathiness universally enhances attractiveness** -- for both male and female voices, across natural and synthetic speech
2. **Female attractiveness = small body projection**: high pitch + wide formants + breathy
3. **Male attractiveness = large body projection + softening**: low pitch + narrow formants + breathy
4. **Attractiveness and emotion share acoustic dimensions**: the parameters that make a voice attractive overlap with those that signal happiness (for females) or a tempered version of anger (for males)
5. **Pitch range**: normal or narrow pitch range preferred over exaggerated range for both sexes

## Limitations

- Small sample sizes (10-16 listeners per experiment)
- Only British English speakers/listeners tested
- Synthetic speech quality limited by VocalTractLab circa 2010
- Only one base sentence per experiment type
- Binary gender framework -- no non-binary voice conditions
- No acoustic analysis of individual listener variation
- Formant shift manipulation in Experiment 2 (female attractiveness) was non-significant, possibly due to synthetic speech artifacts

## Testable Properties

- Breathy voice quality should be rated more attractive than modal or pressed for both male and female synthetic voices
- For female voices: higher F0 + wider formant dispersion + breathiness should maximize attractiveness
- For male voices: lower F0 + narrower formant dispersion + breathiness should maximize attractiveness
- The same parameter settings that maximize female attractiveness should also maximize perceived happiness
- Normal or narrow pitch range should be preferred over wide pitch range for both sexes

## Relevance to Project

This paper has moderate relevance to the Qlatt synthesizer. Its primary value is for voice preset design:
- Confirms that breathiness (controlled via OQ/TL parameters in Klatt) enhances perceived vocal attractiveness regardless of speaker gender
- Provides specific parameter relationships (pitch, formant dispersion, voice quality) for designing "attractive" or "friendly" voice presets
- The overlap between attractiveness and emotion dimensions means that the same parameter manipulations serve both aesthetic and affective goals
- The VocalTractLab voice quality parameters (Table 2) provide spectral tilt targets (H1-H2*, H1-A1*, H1-A3*) that can inform Klatt voice quality settings

## Open Questions

- [ ] How do these findings interact with Klatt's OQ and TL parameters for controlling breathiness?
- [ ] Could the attractiveness-emotion overlap be leveraged to create voice presets that are simultaneously "attractive" and "friendly"?
- [ ] How do these preferences vary cross-linguistically? (See XuLee_VocalAttractivenessMandarinListeners for Mandarin data)

## Related Work Worth Reading

- Morton (1977) - Motivation-structural rules in animal sounds (theoretical foundation for body size projection)
- Ohala (1984) - Ethological perspective on cross-language F0 use (already in collection as cited reference)
- Chuenwattanapranithi et al. (2008) - Encoding emotions with size code (directly tests the size code in speech)
- Birkholz et al. (2007) - VocalTractLab articulatory synthesis system

## Collection Cross-References

### Already in Collection
- [[Babel_2014_VocalAttractiveness]] - Extends this work with more detailed acoustic measurements and PCA; finds that breathiness predicts female attractiveness (consistent) and that apparent vocal tract size matters for male attractiveness (consistent)
- [[XuLee_VocalAttractivenessMandarinListeners]] - Cross-cultural replication with Mandarin listeners; adds creaky voice condition; partially replicates breathiness and formant dispersion findings
- [[Klatt_1990_VoiceQualityVariations]] - Provides the voice quality analysis framework referenced; defines spectral tilt measures used here
- [[Borkowska_2011_F0DominanceAttractiveness]] - Related work on F0 and dominance/attractiveness
- [[Belin_2017_SoundOfTrustworthiness]] - Voice perception and social judgments
- [[Belyk_2014_AcousticValenceEmotion]] - Acoustic dimensions of emotional valence
- [[Hughes_2004_VoiceAttractivenessSexualBehavior]] - Cited for voice-body configuration link; provides the empirical correlation data (voice attractiveness vs SHR/WHR) that this paper's body size projection framework explains theoretically

### New Leads (Not Yet in Collection)
- Chuenwattanapranithi, S., Xu, Y., Thipakorn, B., Maneewongvatana, S. (2008) "Encoding emotions in speech with the size code" Phonetica 65: 210-230 -- directly tests the size code hypothesis for emotional speech
- Morton, E. S. (1977) "On the occurrence and significance of motivation-structural rules in some bird and mammal sounds" Am. Nat. 111: 855-869 -- theoretical foundation for the body size projection framework

### Conceptual Links (not citation-based)
- [[Burkhardt_2009_VoiceQualityFormantSynthesis]] - Implements voice quality variations in a formant synthesizer; the breathiness parameters discussed here map directly to the synthesis parameters Burkhardt uses
- [[Gobl_2003_VoiceQualityAffectiveStates]] - Voice quality dimensions and affect; the breathiness-happiness link found here is consistent with Gobl's mapping of breathy voice to intimate/friendly affects
- [[Caballero_2018_SoundOfImpoliteness]] - Pressed voice and impoliteness perception; the pressed-voice = less attractive finding here is consistent with pressed voice signaling social hostility

### Supersedes or Recontextualizes
- This paper provides the theoretical framework (body size projection) that contextualizes the empirical findings in [[Babel_2014_VocalAttractiveness]] and [[XuLee_VocalAttractivenessMandarinListeners]]. While those papers provide more detailed acoustic measurements, this paper offers the evolutionary explanation.
