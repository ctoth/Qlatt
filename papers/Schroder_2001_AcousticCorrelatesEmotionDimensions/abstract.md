# Abstract

> **Note:** the PDF in this directory is *"Acoustic Correlates of Emotion
> Dimensions in View of Speech Synthesis"* (Eurospeech 2001, DOI
> 10.21437/Eurospeech.2001-34), **not** the review paper the directory name
> claims. This abstract is that paper's.

## Original Text (Verbatim)

In a database of emotional speech, dimensional descriptions of emotional states
have been correlated with acoustic variables. Many stable correlations have been
found. The predictions made by linear regression widely agree with the
literature. The numerical form of the description and the choice of acoustic
variables studied are particularly well suited for future implementation in a
speech synthesis system, possibly allowing for the expression of gradual
emotional states.

---

## Our Interpretation

Emotional speech synthesis had been limited to a handful of discrete, extreme
emotion categories, which cannot express weak emotions or gradual shifts in
emotional tone. The authors correlated FEELTRACE activation/evaluation/power
ratings against ASSESS acoustic measurements over ~5500 tunes of the Belfast
Naturalistic Emotion Database, then fitted quadratic regressions predicting nine
synthesizer-settable acoustic variables from the three emotion coordinates,
separately for female and male speech. The result is a complete numeric rule set
turning emotion into a continuous 3-float control vector over F0 median and
range, F0 rise and fall steepness, tune and pause duration, intensity median and
range, and spectral slope, which is directly implementable in a formant or
source-filter synthesizer.
