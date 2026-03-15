---
tags:
  - voice-quality
  - synthesis-validation
  - perceptual-measurement
  - LF-model
  - noise-modeling
  - signal-to-noise-ratio
---

Gerratt & Kreiman (2001) propose a listener-mediated analysis-synthesis method for measuring perceived voice quality, where listeners adjust synthesizer parameters (specifically SNR) to match natural pathological voice samples rather than using unreliable rating scales. Their custom MATLAB formant synthesizer uses a modified LF source model (abandoning the equal-area constraint), a noise pipeline based on cepstral comb filtering and FIR spectral shaping, and pulse-by-pulse F0 interpolation to avoid quantization artifacts at 10 kHz sampling. Results show synthesis-based measurements produce dramatically lower inter-rater variance than visual analog scales for 9/12 voices, with remaining disagreements falling within perceptual difference limens, demonstrating that listeners do agree on voice quality when given appropriate measurement tools.
