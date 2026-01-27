# Abstract

## Original Text (Verbatim)

This paper describes the work with F0 and segment duration when developing a prototype system for analysis of speaker age using data-driven formant synthesis. The system was developed to extract 23 parameters from the test words—spoken by four differently aged female speakers of the same dialect and family—and to generate synthetic copies. Audio-visual feedback enabled the user to compare the natural and synthetic versions and facilitated parameter adjustment. Next, weighted linear interpolation was used in a first crude attempt to synthesize speaker age. Evaluation of the system revealed its strengths and weaknesses, and suggested further improvements. F0 and duration performed better than most other parameters.

---

## Our Interpretation

Schötz demonstrates that fundamental frequency (F0) and segment duration are the most robust acoustic cues for conveying speaker age in formant synthesis, outperforming formant frequencies and amplitude parameters. Using data-driven formant synthesis across a 6-91 year age range (GLOVE synthesizer with 23 parameters), the study shows that age-appropriate prosody—particularly F0 contours and timing patterns—emerges naturally when parameters are extracted from natural speech and can be interpolated across speaker ages using age-weighted linear blending. For speech synthesis applications targeting age-specific voices, this work establishes that F0 contour control and duration modeling are critical high-priority parameters, while revealing that formant and amplitude adjustments are more challenging and less perceptually salient, with creaky voice effectively simulated through F0 halving and diplophonia parameters.

