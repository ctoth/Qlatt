---
tags:
  - glottal-source
  - inverse-filtering
  - source-filter
---

This paper presents an automated algorithm for estimating glottal waveforms from acoustic speech without requiring precise glottal closure instant detection, using iterative LP analysis with sliding windows around approximate closure regions and a smoothness criterion based on first-order LP coefficient magnitude. The algorithm produces estimates visually identical to those obtained using electroglottograph ground truth across male and female speakers, demonstrating that approximate closure regions are sufficient for reliable glottal inverse filtering. For speech synthesis, the technique provides a potential analysis-by-synthesis tool for extracting glottal source parameters from natural speech, though its primary contribution is to the speech analysis domain rather than direct synthesis implementation.
