---
tags:
  - diphone-synthesis
  - concatenation
  - spectral-mismatch
  - segment-boundaries
  - PSOLA
  - perceptual-evaluation
---

Conkie and Isard evaluate four measures of spectral mismatch at diphone join points (simple mel-cepstral frame distance, frames plus regression coefficients, linear fit over a window, and duration-constrained least mismatch) and test whether choosing diphone boundaries to minimize these measures improves synthesis quality. Their perceptual test shows that optimizing cutpoints by simple frame mismatch raises word identification accuracy from 64% to 84% compared to fixed boundaries. The work is specific to PSOLA concatenative synthesis but the spectral continuity principles and mismatch metrics are relevant to evaluating segment transitions in any synthesis framework.
