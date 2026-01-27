# Abstract

## Original Text (Verbatim)

Progress in speech synthesis has been hampered by the lack of rule-writing tools of sufficient flexibility and power. This paper presents a new system, Delta, that gives linguists and programmers a versatile rule language and friendly debugging environment. Delta's central data structure is well-suited for representing a broad class of multi-level utterance structures. The Delta language has flexible pattern-matching expressions, control structures, and utterance manipulation statements. Its dictionary facilities provide elegant exception handling. The interactive symbolic debugger speeds rule development and tuning. Delta can not only accommodate existing synthesis models, but can also be used to develop new ones.

---

## Our Interpretation

Delta is a domain-specific programming language and development environment designed specifically for text-to-speech synthesis rule writing, featuring synchronized multi-level data structures (called "streams") that represent linguistic information at different levels simultaneously (morphemes, letters, phonemes, syllables). The system provides powerful pattern-matching capabilities, flexible dictionary facilities for handling exceptions, and an interactive symbolic debugger that allows rule writers to develop and test synthesis rules independently without being constrained by the linear utterance representations forced by previous systems. Delta's architecture is significant for speech synthesis because it enables cleaner, more intuitive manipulation of complex linguistic structures and demonstrates how rule-based synthesis systems can be made practical and maintainable through proper language design and tooling.
