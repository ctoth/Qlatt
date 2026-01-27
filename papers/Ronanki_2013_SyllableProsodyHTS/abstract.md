# Abstract

## Original Text (Verbatim)

Simple4All is a speech synthesis research project that aims to ease the production of synthetic voices in new languages by means of unsupervised modeling techniques. In this work, we introduce syllable based models for prosody modeling in Hidden Markov Model based Text-to-Speech system (HTS). As a part of investigating the potential for building speech synthesis systems in new languages with little data, we are investigating alternate formulations for the pitch and duration models within HMM based speech synthesis frame-work, specifically investigating models that explicitly model prosody for named syllabic contexts. A comparison between phone and syllable methods demonstrating the differences in spectral and prosody features was carried out. In the end, a hybrid system with spectral features from phoneme models and prosody features from syllable models has been designed to synthesize speech with robust quality and naturalness.

---

## Our Interpretation

This paper investigates syllable-based HMM models for prosody (pitch and duration) in TTS, demonstrating that syllable units better capture prosodic patterns than phoneme units, particularly for F0 contours. The key contribution is a hybrid system that combines spectral features from phoneme HMMs (which have more training data per unit) with prosodic features from syllable HMMs (which better model linguistic context), aligned using dynamic time warping. This approach is directly relevant to Qlatt's TTS frontend, as it provides a principled way to generate prosodic targets (F0 and duration tracks) from text by leveraging linguistic structure above the phoneme level.

---
