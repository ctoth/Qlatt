# Abstract

## Original Text (Verbatim)

An audio synthesis technique ("Phase Aligned Formant synthesis") is presented which is aimed at real-time musical applications. A desired sound is specified in terms of one or several time-varying formants, each with specified center frequencies, bandwidths, and amplitudes. The sound produced may be periodic or noisy. The relative merits of other known real-time techniques for synthesizing sounds with desired formants are also discussed. As an example, a spoken word is analyzed and resynthesized.

---

## Our Interpretation

Filter-based, VOSIM, and FOF formant synthesis all fail at least one of: bounded cost, numerical stability, predictable output amplitude, and predictable phase. Puckette derives a closed-form generator whose spectrum is exactly a two-sided exponential (a symmetric triangle in decibels) about a directly specified center frequency and bandwidth, computed as a carrier phasor times a Poisson-kernel modulator realized by waveshaping a half-fundamental sine through 1/(1+z²). Because all formants share one phase generator, their spectra superpose additively, which makes PAF the natural time-domain alternative to a parallel formant filter bank for a speech synthesizer.
