# Abstract

## Original Text (Verbatim)

This paper reports on work developing an accent-independent lexicon for use in synthesising speech in English. Lexica which use phonemic transcriptions are only suitable for one accent, and developing a lexicon for a new accent is a long and laborious process. Potential solutions to this problem include the use of conversion rules to generate lexica of regional pronunciations from standard accents [1] and encoding of regional variation by means of keywords [2]. The latter proposal forms the basis of the current work. However, even if we use a keyword system for lexical transcription there are a number of remaining theoretical and methodological problems if we are to synthesise and recognise accents to a high degree of accuracy; these problems are discussed in the following paper.

---

## Our Interpretation

The paper does not present new architecture but interrogates the keyword-lexicon approach's remaining open problems: exactly which pronunciation phenomena belong in the lexicon (as accent-neutral keysymbols) versus which should be derived by accent-specific post-lexical rule. It works through concrete hard cases across English accents (allophony that depends on morphology, full-vs-reduced vowel alternation, cross-word /r/-linking, stress and syllabification divergence) and offers three unranked candidate architectures for the derivation step. For a declarative TTS frontend, it is most useful as a worked decision procedure and vocabulary for the lexicon/rule boundary, not as a source of ready-made rule syntax — that is supplied instead by its companion paper on vowels preceding 'r'.
