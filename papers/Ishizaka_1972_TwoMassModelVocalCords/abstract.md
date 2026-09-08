# Abstract

## Original Text (Verbatim)

A model of voiced-sound generation is derived in which the detailed acoustic behavior of the human vocal cords and the vocal tract is computed. The vocal cords are approximated by a self-oscillating source composed of two stiffness-coupled masses. The vocal tract is represented as a bilateral transmission line. One-dimensional Bernoulli flow through the vocal cords and plane-wave propagation in the tract are used to establish acoustic factors dominant in the generation of voiced speech. A difference-equation description of the continuous system is derived, and the cord-tract system is programmed for interactive study on a DDP-516 computer. Sampled waveforms are calculated for: acoustic volume velocity through the cord opening (glottis); glottal area; and mouth-output sound pressure. Functional relations between fundamental voice frequency, subglottal (lung) pressure, cord tension, glottal area, and duty ratio of cord vibration are also determined.

Results show that the two-mass model duplicates principal features of cord behavior in the human. The variation of fundamental frequency with subglottal pressure is found to be 2 to 3 Hz/cm H2O, and is essentially independent of vowel configuration in the programmed tract. Acoustic interaction between tract eigenfrequencies and glottal volume flow is strong. Phase difference in motion of the cord edges is in the range of 0 to 60 degrees, and control of cord tension leads to behavior analogous to chest/falsetto conditions in the human. Phonation-neutral, or rest area of cord opening, is shown to be a critical factor in establishing self-oscillation. Finally, the complete synthesis system suggests an efficient, physiological description of the speech signal, namely, in terms of subglottal pressure, cord tension, rest area of cord opening, and vocal-tract shape.

*(p.1233)*

---

## Our Interpretation

The earlier one-mass self-oscillating cord model could not oscillate above a formant frequency, showed too much source-tract interaction, and had no phase difference between the upper and lower cord edges or any correlate of vocal register. This paper fixes all three by splitting each cord in depth into two coupled oscillators and by replacing van den Berg's empirical glottal outlet pressure recovery with a momentum-based one, then reduces the whole cord-plus-tract system to explicit difference equations with every constant specified. It matters here because it is the canonical physically-parameterized glottal source: it gives a complete, causal, sample-by-sample update rule whose only inputs are subglottal pressure, cord tension, phonation-neutral area, and tract shape, and it quantifies exactly what each of those does to pitch, duty ratio, waveform slope, and phonation onset.
