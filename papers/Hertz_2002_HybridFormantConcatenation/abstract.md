# Abstract

## Original Text (Verbatim)

This paper describes an approach to speech synthesis in which waveform fragments dynamically produced with a set of formant-based synthesis rules are concatenated with pre-stored natural speech waveform fragments to produce a synthetic utterance. While this hybrid approach was originally implemented as a tool for research into improved voice quality in formant-based synthesis, it has produced such good results that we now view it as a potentially viable and advantageous approach for a text-to-speech product. Possible advantages of the approach include smaller speech databases for waveform concatenation, enhancement of certain speech cues for sub-optimal listening environments, and improved and more efficient unit selection/production. In addition, the approach has already proven its utility as a tool for research and development in both concatenative and formant-based synthesis.

---

## Our Interpretation

This paper presents a hybrid synthesis method that combines rule-based formant synthesis with concatenative waveform synthesis, demonstrating that many phonetic segments can be synthesized by rule rather than stored in a database, thereby reducing database size while maintaining quality. The key finding is that obstruents and many sonorants can be successfully synthesized, while syllable nuclei remain challenging—but the hybrid approach provides a powerful diagnostic tool for identifying voice quality problems in both synthesis paradigms. For Qlatt, this work is highly relevant because it validates the efficacy of formant synthesis for consonants and consonantal transitions, informing decisions about which segments merit rule-based generation versus database lookup.
