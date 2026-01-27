# Abstract

## Original Text (Verbatim)

The Delta programming language is designed to let linguists easily formalize and test phonological and phonetic theories. Its central data structure lets rule-writers represent utterances as multiple "streams" of synchronized units of their choice, giving them considerable flexibility in expressing the relationship between phonological and phonetic units. This paper presents the Delta language, showing how it can be applied to two linguistic models, one for Bambara tone and fundamental frequency patterns and one for English formant patterns. While Delta is a powerful, special-purpose language that alone should serve the needs of most phonologists, phoneticians, and linguistics students who wish to test their rules, the Delta System also provides the flexibility of a general-purpose language by letting users intermingle C programming language statements with Delta statements.

---

## Our Interpretation

Delta is a specialized programming language that enables linguists to represent speech at multiple synchronized linguistic levels (phonemes, syllables, tones, CV structure) simultaneously, solving the fundamental limitation of linear phoneme-based representations for modeling non-linear phonological phenomena. The paper demonstrates Delta's flexibility through complete implementations of Bambara tone assignment with F0 generation and three progressive English formant transition models, showing how the same system can accommodate fundamentally different theories about the interface between phonology and phonetics—making it directly applicable to formant synthesis systems like Klatt that require explicit modeling of sub-phonemic units like aspiration and formant transitions.
