# Abstract

## Original Text (Verbatim)

> A software formant synthesizer is described that can generate synthetic speech using a laboratory digital computer. A flexible synthesizer configuration permits the synthesis of sonorants by either a cascade or parallel connection of digital resonators, but frication spectra must be synthesized by a set of resonators connected in parallel. A control program lets the user specify variable control parameter data, such as formant frequencies as a function of time, as a sequence of (time, value) points. The synthesizer design is described and motivated in Secs. I–III, and FORTRAN listings for the synthesizer and control program are provided in an appendix. Computer requirements and necessary support software are described in Sec. IV. Strategies for the imitation of any speech utterance are described in Sec. V, and suggested values of control parameters for the synthesis of many English sounds are presented in tabular form.

---

## Our Interpretation

This paper describes a flexible software implementation of the Klatt formant synthesizer, which generates synthetic speech by filtering sound sources (voicing, frication, aspiration) through digital resonators representing the vocal tract. The key innovation is a hybrid cascade/parallel architecture that uses cascaded resonators for vowels and sonorants (where formant amplitudes emerge naturally) and parallel resonators for fricatives (where independent amplitude control is essential). The paper provides complete FORTRAN source code and practical synthesis strategies with parameter tables for English phonemes, making it a foundational reference for formant-based speech synthesis research and a practical tool for speech perception studies.

