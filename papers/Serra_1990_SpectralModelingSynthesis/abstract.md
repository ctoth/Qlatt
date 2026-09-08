# Abstract

## Original Text (Verbatim)

*(The article carries no separately headed abstract; the following is the opening lead block on p.12 that functions as one.)*

When generating musical sound on a digital computer, it is important to have a good model whose parameters provide a rich source of meaningful sound transformations. Three basic model types are used widely today for musical sound generation: instrument models, spectrum models, and abstract models. Instrument models attempt to parameterize a sound at its source, such as a violin, clarinet, or vocal tract. Spectrum models attempt to parameterize a sound at the basilar membrane of the ear, discarding whatever information the ear seems to discard in the spectrum. Abstract models, such as FM, attempt to provide musically useful parameters in an abstract formula.

This paper addresses the second category of synthesis technique: spectrum modeling. It describes a technique called *spectral modeling synthesis* (SMS), that models time-varying spectra as (1) a collection of sinusoids controlled through time by piecewise linear amplitude and frequency envelopes (the *deterministic* part), and (2) a time-varying filtered noise component (the *stochastic* part). The analysis procedure first extracts the sinusoidal trajectories by tracking peaks in a sequence of short-time Fourier transforms. These peaks are then removed by spectral subtraction. The remaining "noise floor" is then modeled as white noise through a time-varying filter. A piecewise linear approximation to the upper spectral envelope of the noise is computed for each successive spectrum, and the stochastic part is synthesized by means of the overlap-add technique. The SMS technique has proved to give general, high quality transformations for a wide variety of musical signals.

---

## Our Interpretation

Sinusoidal analysis/synthesis systems such as the phase vocoder and PARSHL could not represent noise economically, because modeling noise with sinusoids requires an oscillator at every frequency in the band. SMS solves this by splitting the signal: sinusoidal peaks are tracked across short-time Fourier transform frames into trajectories, resynthesized, transformed back to the magnitude-spectrum domain, and subtracted from the original magnitude spectra, leaving a residual that is modeled as white noise passed through a time-varying filter whose response is a line-segment fit to the residual envelope. For a formant speech synthesizer this is the foundational harmonic-plus-noise decomposition: it supplies both an analysis recipe for measuring the aspiration and frication noise floor of real speech and a synthesis recipe (random-phase overlap-add inverse FFT with a smooth window four times the hop size) for regenerating it without frame-rate artifacts.
