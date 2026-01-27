# Abstract

## Original Text (Verbatim)

A semi-automatic analysis-synthesis scheme that can be viewed as a "manual formant vocoder" is described. A human operator makes decisions about formant positions on processed speech data. The parameters which result from the operator decisions are used to control a four-pole parallel synthesizer. Speech processed by the system had an error rate of 4.2% for vowels and 16.9% for consonants.

---

## Our Interpretation

This paper presents an early speech analysis-synthesis system where humans manually identify formant peaks in spectrograms, then those parameters drive a parallel formant synthesizer. The key finding is that even with human-in-the-loop formant tracking (presumably more accurate than 1967-era automatic methods), the resynthesized speech still had significant consonant errors (~17%), suggesting the four-pole parallel model itself has limitations for consonant synthesis. For speech synthesis work, this provides historical context for why cascade synthesizers (like Klatt 1980) gained favor for vowels while parallel branches were reserved for consonants requiring independent amplitude control.
