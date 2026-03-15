---
tags:
  - spectral-analysis
  - linear-prediction
  - inverse-filtering
  - glottal-source
  - formant-estimation
  - all-pole-modeling
---

# El-Jaroudi & Makhoul 1991 — Discrete All-Pole Modeling

Introduces the Discrete All-Pole (DAP) method for fitting all-pole spectral envelopes to discrete sets of spectral points, using a discrete form of the Itakura-Saito distortion measure instead of the standard LP autocorrelation matching. DAP overcomes the well-known limitations of linear prediction for voiced speech (harmonic bias, poor high-pitch performance) by accounting for autocorrelation aliasing inherent in spectral sampling. The paper presents an iterative algorithm guaranteed to converge to the unique optimal solution, demonstrates 2-3x improvement in formant estimation accuracy over LP for synthetic vowels, and extends the method to frequency-weighted DAP (WDAP) for emphasis on specific spectral regions.
