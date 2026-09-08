# Abstract

## Original Text (Verbatim)

A model of human articulation is described whose spatial and dynamic characteristics closely match those of natural speech. The model includes a controller that embodies enough articulatory "motor skill" to produce, from discrete phonetic strings, properly timed sequences of articulatory movements. Together with programs for dictionary searching and rules for duration and other phonetic variables, the model can produce reasonably acceptable synthetic speech from ordinary English text.

---

## Our Interpretation

Coker addresses the problem that articulatory models can produce plausible vocal-tract shapes but not correctly timed movement between them. He decomposes the articulatory system into roughly ten independent linear response modes, then adds an open-loop controller in which each phoneme carries per-articulator "priority" values, measured in milliseconds, that lead or lag the nominal segment boundary and thereby generate realistic coarticulatory overlap. For a formant-synthesis project the transferable parts are the priority timing mechanism, the scalar allophonic control digit, and concrete numbers such as position-dependent /t/ devoicing times and the yielding-wall F1 floor.
