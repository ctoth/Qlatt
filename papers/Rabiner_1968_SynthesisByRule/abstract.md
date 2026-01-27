# Abstract

## Original Text (Verbatim)

A general model for speech synthesis by rule is presented along with a discussion of one specific implementation of the model. The conversion from discrete input signals to continuous synthesizer control signals is performed by the synthesis strategy. The details of the synthesis strategy, including linguistic preprocessing of the input and separate but interdependent segmental and suprasegmental models, are described. An experimental evaluation of the specific model is included, along with specific recommendations as to areas of speech synthesis and speech production requiring further study.

---

## Our Interpretation

This paper presents a foundational architecture for converting text (as discrete phonemes) into continuous speech synthesizer control signals through two-stage processing: linguistic preprocessing and separate models for formant timing (segmental) and pitch control (suprasegmental). The key insight is that smooth, natural synthesis requires formant transitions governed by critically-damped differential equations and timing control driven by target attainment rather than fixed phoneme durations, achieving ~80-90% intelligibility on various test materials. This work is essential for speech synthesis systems because it establishes the principle that separating segment-level acoustic control from phrase-level prosodic control simplifies rule-based TTS design and enables more flexible, context-sensitive pronunciation generation.

