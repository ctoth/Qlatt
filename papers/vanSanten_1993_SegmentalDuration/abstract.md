# Abstract

## Original Text (Verbatim)

In natural speech, durations of phonetic segments are strongly dependent on contextual factors. Quantitative descriptions of these contextual effects have applications in text-to-speech synthesis and in automatic speech recognition. In this paper, we describe a speaker-dependent system for predicting segmental duration from text, with emphasis on the statistical methods used for its construction. We also report results of a subjective listening experiment evaluating an implementation of this system for text-to-speech synthesis purposes.

---

## Our Interpretation

This paper presents a statistical framework for predicting how long individual speech sounds should be, accounting for linguistic context like stress, consonant place, and phrasal position. The key innovation is using sums-of-products models organized by phonetic category rather than single general-purpose models, achieving 93% correlation with observed durations and 73% listener preference over Klatt-style rules. This work is critical for speech synthesis because duration is perceptually salient and directly controllable, making accurate timing rules essential for natural-sounding synthetic speech.
