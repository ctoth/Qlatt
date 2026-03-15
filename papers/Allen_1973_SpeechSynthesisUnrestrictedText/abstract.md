# Abstract

**Paper:** Allen, J. (1976). Synthesis of speech from unrestricted text. *Proceedings of the IEEE*, 64(4), 433-442.

**Note:** Originally presented as a 1973 book chapter in Flanagan & Rabiner (Eds.), *Speech Synthesis*. The 1976 IEEE journal article is the expanded and more widely cited version.

## Verbatim Abstract

For many applications, it is desirable to be able to convert arbitrary English text to natural and intelligible sounding speech. This transformation between two surface forms is facilitated by first obtaining the common underlying abstract linguistic representation which relates to both text and speech surface representations. Calculation of these abstract bases then permits proper selection of phonetic segments, lexical stress, juncture, and sentence-level stress and intonation. The resulting system serves as a model for the cognitive process of reading aloud, and also as a stable practical means for providing speech output in a broad class of computer-based systems.

## Interpretation

This paper lays out the complete architectural blueprint for what would become the MITalk text-to-speech system. Allen argues that both text and speech are surface representations of a shared underlying linguistic structure, and that the correct approach to TTS is to analyze text into this abstract representation and then synthesize speech from it. The paper covers the full pipeline: morphological decomposition, letter-to-sound rules, lexical stress assignment, sentence parsing, and prosodic control (duration, F0, pauses). It explicitly references the Klatt synthesizer model as the vocal-tract backend. This is the theoretical foundation paper for Allen et al. 1987 (MITalk/DECtalk).
