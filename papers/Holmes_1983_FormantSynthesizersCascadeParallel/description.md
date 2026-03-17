---
tags:
  - speech-synthesis
  - formants
  - klatt
  - source-filter
---

This paper presents a comprehensive technical argument that parallel formant synthesizers are superior to cascade synthesizers for all speech sounds, contrary to prevailing opinion that cascade is better for vowels. The key contribution is a detailed design methodology showing how parallel synthesizers can approximate cascade response when desired while offering better control over formant amplitudes, vocal effort modeling, and handling of consonants—all using the same unified formant system. This work is directly relevant to Klatt-style synthesizers like Qlatt, providing theoretical justification for parallel branch design and practical implementation details for spectral shaping filters, phase correction networks, and the ALF low-frequency control mechanism that maintains natural speech quality across all sound types.
