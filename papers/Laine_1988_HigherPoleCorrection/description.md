---
tags:
  - vocal-tract
  - formants
  - speech-synthesis
  - source-filter
---

This paper analyzes the Higher Pole Correction (HPC) function needed in all-pole formant synthesizers when only N formants are modeled, validating Fant's 1959 formula against a Transmission Line reference model and showing the correction depends primarily on effective vocal tract length rather than specific vowel configurations. The key contribution is an all-zero HPC filter model derived via polynomial factorization, where each formant pole is paired with a wide-bandwidth zero (~1.5-2 kHz) at odd multiples of the neutral tube's fundamental frequency, automatically handling HPC as more formant modules are added. This is directly relevant to Qlatt's F7-F10 cascade formants: the paper quantifies what explicit higher formants replace in terms of spectral correction and provides the theoretical framework for computing residual HPC error.