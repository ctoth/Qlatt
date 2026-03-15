---
tags:
  - formant-extraction
  - bandwidth-estimation
  - analysis-by-synthesis
  - diphone-synthesis
  - parallel-formant-synthesiser
---

Mannell (1998) describes a multi-pass formant parameter extraction system for building a diphone database for formant-concatenation synthesis from a labelled single-speaker corpus. The method uses probability-constrained LPC analysis with speaker-specific vowel formant spaces to achieve less than 5% tracking error rate, followed by an analysis-by-synthesis procedure to extract formant intensities and bandwidths. The paper provides a bandwidth estimation formula Bx = (80 + 120 * Fx/5000) * W that gives initial bandwidth as a linear function of formant frequency, with a voicing-dependent scaling factor.
