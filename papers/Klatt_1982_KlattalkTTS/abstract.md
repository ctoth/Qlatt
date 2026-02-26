# Abstract

## Original Text (Verbatim)

A real time text-to-speech conversion system has been developed. Input is ordinary English spelling and/or simple numerical and algebraic expressions. Dynamic selection between a male or female output voice is under user control. The system executes a set of about 500 letter-to-sound rules to guess at the pronunciation of words that do not match a carefully selected exceptions dictionary of about 1500 words. A very simple syntactic analyzer determines probable locations of phrase and clause boundaries in order to improve the naturalness and intelligibility of input sentences. The resulting phonemic representation is converted to speech by a synthesis-by-rule program and formant synthesizer. The rule program differs from others of this type in having an extensive set of segment duration rules and many detailed rules for the synthesis of consonant-vowel transitions.

---

## Our Interpretation

Klatt describes a complete TTS system that converts arbitrary English text to speech in real-time, handling numbers and abbreviations automatically. The key innovation is the combination of a small but carefully chosen exceptions dictionary with robust letter-to-sound rules, plus simple syntactic analysis that finds phrase boundaries from punctuation and function words. For speech synthesis, the system stands out for its detailed duration rules and careful handling of consonant-vowel transitions - these phonetic details are what made Klattalk more intelligible than competing systems of its era.
