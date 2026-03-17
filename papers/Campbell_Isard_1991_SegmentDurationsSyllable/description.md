---
tags:
  - duration
  - speech-synthesis
  - prosody
---

This paper presents a two-level duration model for speech synthesis where syllable duration is computed first from prosodic features using a neural network, then individual segment durations are accommodated within the syllable frame using a z-score elasticity measure that normalizes each segment's duration relative to its type-specific mean and standard deviation. The key findings show that the elasticity hypothesis (uniform compression/expansion across all segments in a syllable) holds well for sentence-internal syllables, but sentence-final syllables exhibit differential lengthening concentrated in the rhyme rather than the onset, modeled by an exponential weighting factor of 0.75^(n-i). This hierarchical approach to duration modeling is directly applicable to Qlatt's TTS frontend, providing a principled mechanism for syllable-level timing that complements segment-level duration rules like Klatt (1976) and captures prosodic effects that purely segmental models miss.
