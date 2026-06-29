# Abstract

## Original Text (Verbatim)

*(This document is a software manual and has no formal abstract. The following is the verbatim opening description from page 1, which serves as the abstract.)*

The KLSYN speech synthesis program accepts user commands to create parametric data to control a digital speech synthesizer, and it produces an output waveform file with a user-specified name. {The IBM-PC version of KLSYN was first implemented by Keith Johnson & Yingyong Qi at Ohio State University in 1987. Since then several minor modifications have been added by Keith Johnson.}

The synthesizer is the same as the one documented in some detail in Klatt (1980), except that the voicing source has been augmented so as to permit a choice between two glottal waveforms. The new voicing source waveform is intended to be more flexible and thus be capable of producing more natural changes in voice quality over the duration of a sentence, if controlled properly. The theory of control, and the new control parameters are all described herein.

---

## Our Interpretation

This is the authoritative parameter reference for the "KLSYN88" generation of the Klatt cascade/parallel formant synthesizer. It catalogs ~50 constants and variable parameters (with symbols, defaults, soft min/max ranges, and units), documents the two interchangeable glottal sources (low-pass-filtered impulse train vs. the natural cubic-polynomial pulse `Ug(t)=a·t²−b·t³`), and defines the new continuous voice-quality controls (open quotient, spectral tilt, skew, turbulence) that extend Klatt (1980). It is directly relevant as the implementation specification for this project's klsyn88 fidelity engine — including unit quirks (f0 in Hz×10, oq in % or samples depending on source) and fidelity-critical details (4× source oversampling, glottal-opening parameter snapping, fixed high formants).
