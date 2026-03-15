---
tags:
  - tts-architecture
  - text-to-speech
  - letter-to-sound
  - morphological-analysis
  - lexical-stress
  - prosody
  - klatt-synthesizer
  - g2p
---

Allen presents the complete architecture for converting unrestricted English text to speech, arguing that both text and speech are surface representations of a shared underlying linguistic structure and that TTS should proceed by analyzing text into this abstract representation then synthesizing speech from it. The paper details the full pipeline: morph decomposition using a 12,000-entry lexicon derived from the Brown Corpus, letter-to-sound rules for unknown words, morphophonemic adjustment rules, lexical stress assignment based on Chomsky-Halle generative phonology, sentence-level parsing via phrase detection, and prosodic control of duration and F0 contours including Halliday's functional model of discourse. This is the theoretical blueprint for the MITalk system (Allen et al. 1987), with the Klatt formant synthesizer explicitly shown as the vocal-tract model backend.
