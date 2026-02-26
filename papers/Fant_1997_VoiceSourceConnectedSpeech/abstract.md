# Abstract

## Original Text (Verbatim)

This is an attempt to formulate an outline of the properties of the human voice source in connected speech. Six aspects of the production process are considered: (1) reference data for a particular speaker; (2) segment specific values and source-tract interactions; (3) coarticulation of glottal gestures and interpolation at boundaries; (4) basic F0 dependencies; (5) the influence of stress, accents and voice intensity; (6) the phrasal contour of source variations. The parameterization of source data is based on the transformed LF-model and frequency domain correspondences (Fant, 1995) which allows for a maximal specificational power with a limited number of parameters.

---

## Our Interpretation

This paper tackles the challenge of making synthesized speech sound natural by modeling how the voice source (glottal waveform) changes dynamically during connected speech rather than treating it as static. Fant identifies six levels of variation - from speaker identity down to phrase-level contours - and shows they can all be captured using the Rd parameter as a master control, with systematic covariation rules linking waveshape to amplitude. For speech synthesis, this provides a practical framework: set Rd based on speaker type, then apply multiplicative dB adjustments for segments, stress, F0, and phrase position, with the 2:1 Ee-to-1/Rd covariation rule ensuring natural dynamics.
