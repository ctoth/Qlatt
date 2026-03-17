---
tags:
  - speech-intelligibility
  - acoustics
  - speech-quality-metrics
---

This paper presents ESTOI (Extended Short-Time Objective Intelligibility), a monaural intelligibility prediction algorithm that extends STOI by incorporating spectral correlation across frequency bands through row-and-column normalization of short-time spectrograms, enabling accurate prediction for speech contaminated by temporally modulated noise maskers where STOI fails (rho=0.47 vs ESTOI's rho=0.92). The key algorithmic difference is that ESTOI computes correlation between complete normalized spectral vectors across time frames rather than averaging per-band temporal correlations, which captures cross-frequency dependencies important for modulated noise conditions while maintaining comparable performance to STOI on standard additive noise. For the Qlatt synthesizer, ESTOI provides a complementary objective intelligibility metric alongside STOI for automated evaluation of synthesis quality, particularly robust for testing in realistic noise conditions with modulated maskers.
