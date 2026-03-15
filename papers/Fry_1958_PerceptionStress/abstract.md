# Abstract

Differences of stress are perceived by the listener as variations in a complex pattern bounded by four psychological dimensions: length, loudness, pitch and quality. The physical correlates of these perceptual factors are the duration, intensity, fundamental frequency and formant structure of the speech sound waves. Experiments have been made in order to measure the effect on stress judgments of changes in three of these physical dimensions, duration, intensity and fundamental frequency. The experimental method was to synthesize speech stimuli in which these quantities could be controlled and varied over a considerable range and to use this material to construct listening tests which were carried out by large groups of subjects.

English word-pairs of the type *subject*, *object*, *digest*, formed the language material for the tests; in the first experiment variations in duration were combined with variations in intensity. The results showed that both duration and intensity act as cues in stress judgments; duration produced the greater overall fluctuation in the judgments and a method is suggested of making a quantitative comparison of the effect of the two cues.

The second experiment combined duration changes with step changes of fundamental frequency. The results showed that the direction of a step change of frequency had a strong influence on stress judgments but the magnitude of the frequency change had no marked effect. The tendency was for a higher syllable to be heard as stressed in preference to a lower one.

The third test included variations in fundamental frequency within one syllable and contained a range of patterns which imposed sentence intonation on the test items. The results again demonstrated the all-or-none effect of frequency changes and showed that this may outweigh the duration cue altogether.

## Interpretation

This paper is foundational for understanding how to implement stress in a speech synthesizer. The key implementation takeaway is that stress perception depends on a hierarchy of cues: (1) sentence-level F0 contour patterns are most powerful and operate in an all-or-none fashion, (2) duration ratio between syllables is the strongest graded cue, and (3) intensity ratio is a weaker graded cue. For a Klatt synthesizer, this means that getting the F0 contour right (especially the direction of pitch change between syllables) is more important than getting the exact magnitude right, while duration ratios between stressed and unstressed vowels need careful graded control.
