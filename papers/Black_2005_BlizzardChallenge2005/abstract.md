# Abstract

## Original Text (Verbatim)

In order to better understand different speech synthesis techniques on a common dataset, we devised a challenge that will help us better compare research techniques in building corpus-based speech synthesizers. In 2004, we released the first two 1200-utterance single-speaker databases from the CMU ARCTIC speech databases, and challenged current groups working in speech synthesis around the world to build their best voices from these databases. In January of 2005, we released two further databases and a set of 50 utterance texts from each of five genres and asked the participants to synthesize these utterances. Their resulting synthesized utterances were then presented to three groups of listeners: speech experts, volunteers, and US English-speaking undergraduates. This paper summarizes the purpose, design, and whole process of the challenge.

---

## Our Interpretation

Speech synthesis had no common dataset and no agreed evaluation metric, so quality differences between systems could not be separated from differences in the underlying recorded voice. The Blizzard Challenge fixes the corpus (CMU ARCTIC bdl, slt, rms, clb), fixes a 250-sentence five-genre test set, and evaluates over the web with MOS on three genres, typed-transcription intelligibility on two, three distinct listener populations, and a natural-speech topline. For a formant/source-filter synthesizer project this is the reusable evaluation protocol: it separates naturalness from intelligibility, fixes the per-listener load at 20 stimuli per test with 10 or more listeners per sample, and states explicitly why MOS cannot support a speaker-similarity claim.
