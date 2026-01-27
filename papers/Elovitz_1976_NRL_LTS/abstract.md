# Abstract

## Original Text (Verbatim)

Speech synthesizers for computer voice output are most useful when not restricted to a prestored vocabulary. The simplest approach to unrestricted text-to-speech translation uses a small set of letter-to-sound rules, each specifying a pronunciation for one or more letters in some context. Unless this approach yields sufficient intelligibility, routine addition of text-to-speech translation to computer systems is unlikely, since more elaborate approaches embodying large pronunciation dictionaries or linguistic analysis require too much of the available computing resources.

The work described here demonstrates the practicality of routine text-to-speech translation. A set of 329 letter-to-sound rules has been developed. These translate English text into the International Phonetic Alphabet (IPA), producing correct pronunciations for approximately 90% of the words in an average text sample. Most of the remaining 10% have single errors easily correctable by the listener. Another set of rules translates IPA into the phonetic coding for a particular commercial speech synthesizer.

This report describes the technical approach used and the support hardware and software developed. It gives overall performance figures, detailed statistics showing the importance of each rule, and listings of a translation program and a program used in rule development.

---

## Our Interpretation

This paper presents a practical rule-based system for converting English text to phonetic codes for speech synthesis, achieving 90% accuracy on pronunciation using only 329 context-sensitive letter-to-sound rules. The work is foundational for text-to-speech because it demonstrates that accurate grapheme-to-phoneme conversion can be accomplished without large dictionaries or complex linguistic analysis, making it feasible to implement TTS on resource-constrained computers. The letter-to-sound rules approach directly influenced modern TTS systems and established the practical framework for handling unrestricted text input in speech synthesis applications.
