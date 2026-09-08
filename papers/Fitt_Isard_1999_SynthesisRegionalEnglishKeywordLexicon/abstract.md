# Abstract

## Original Text (Verbatim)

We discuss the use of an accent-independent keyword lexicon to synthesise speakers with different regional accents. The paper describes the system architecture and the transcription system used in the lexicon, and then focuses on the construction of word-lists for recording speakers. We illustrate by mentioning some of the features of Scottish and Irish English, which we are currently synthesising, and describe how these are captured by keyword synthesis. Keywords: lexicon, accents, regional pronunciation, synthesis

---

## Our Interpretation

The paper introduces the Unisyn system's core idea: replace per-accent phonetic lexicons with a single lexicon transcribed in accent-neutral "keysymbols" derived from Wells's (1982) lexical sets, and push all accent-specific behavior into a separate, comparatively small set of post-lexical rules. It demonstrates the approach is practical by using it to build diphone-recording word-lists for Scottish and Irish English from the same underlying lexicon, showing the rules capture real segmental contrasts (e.g. NORTH/FORCE, NURSE splits) those accents make that RP does not. This is the founding paper for treating accent as a rule-layer policy over one shared lexicon, directly relevant to a declarative TTS frontend with the same goal.
