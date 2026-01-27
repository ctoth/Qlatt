# Abstract

## Original Text (Verbatim)

In general text-to-speech systems, it is not possible to guarantee that a lexicon will contain all words found in a text, therefore some system for predicting pronunciation from the word itself is necessary. Here we present a general framework for building letter to sound (LTS) rules from a word list in a language. The technique can be fully automatic, though a small amount of hand seeding can give better results. We have applied this technique to English (UK and US), French and German. The generated models achieve, 75%, 58%, 93% and 89%, respectively, words correct for held out data from the word lists.

To test our models on more typical data we also analyzed general text, to find which words do not appear in our lexicon. These unknown words were used as a more realistic test corpus for our models. We also discuss the distribution and type of such unknown words.

---

## Our Interpretation

This paper addresses the fundamental problem that TTS systems cannot have every possible word in their pronunciation dictionaries, so they need rules to guess pronunciations for unknown words. The authors present a method using CART decision trees trained on aligned letter-phone pairs that works across multiple languages with varying orthographic complexity. The key practical finding is that models optimized for lexicon test sets (stop=1) actually perform worse on real unknown words than smaller, more generalized models (stop=5), providing important guidance for TTS deployment.
