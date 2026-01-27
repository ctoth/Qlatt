# Abstract

## Original Text (Verbatim)

The framework of the presentation is the assessment of the ability of human raters or speech-processing software to detect glottal cycles in speech sounds and measure their lengths in synthetic breathy and rough voices. The synthesis of hoarse voices designates the generation of speech sounds the timbre of which simulates the voice quality of dysphonic speakers. The added value of synthetically generated test stimuli is that the user may fix and know their properties exactly. The corpus comprises synthetic vowels [a] combining seven levels of frequency jitter and three levels of additive noise. The presentation is focused on the simulation of rough and breathy voices via frequency modulation of the glottal excitation model and addition of pulsatile noise at the glottis. Furthermore, the genuine glottal cycle lengths and glottal source to noise ratios are obtained to which lengths and ratios inferred via signal processing may be compared. The glottal cycle lengths are acquired by tracking the phase of the harmonic driving functions of the speech sound synthesizer. Actual glottal signal-to-noise ratios are measured by summing separately over the sound stimuli the squared clean volume velocity and pulsatile noise samples.

---

## Our Interpretation

This paper addresses how to synthesize dysphonic voices (breathy, rough, hoarse) with known, measurable acoustic properties for testing voice analysis algorithms. The key contribution is a method for generating cycle-to-cycle frequency jitter and pulsatile glottal noise where the exact perturbation magnitudes and signal-to-noise ratios can be tracked internally during synthesis, providing ground truth values for validating speech processing software. For speech synthesis, the work demonstrates that pulsatile noise (modulated by glottal flow) sounds more natural than constant aspiration noise for breathiness, and provides empirical mappings between synthesis parameters (jitter magnitude, noise level) and perceptually-relevant dysphonia characteristics.
