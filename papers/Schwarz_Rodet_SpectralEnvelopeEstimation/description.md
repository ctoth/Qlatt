---
tags:
  - spectrum-estimation
  - formants
  - source-filter
---

This paper surveys spectral envelope estimation methods (LPC, cepstrum, discrete cepstrum) and representation formats (filter coefficients, sampled, geometric, formants) for musical sound analysis-synthesis, providing a systematic comparison against requirements like stability, locality, and ease of manipulation. The key contribution is a "basic formant" equation that approximates two-pole resonator transfer functions using center frequency, bandwidth, and amplitude parameters, plus the concept of "fuzzy formants" for robust formant tracking. While primarily relevant to analysis-synthesis systems rather than direct formant synthesis like Klatt, the paper's discussion of parallel vs cascade filter structures and formant representation trade-offs provides useful background for understanding synthesizer architecture choices.
