# Abstract

## Original Text (Verbatim)

A vocoder-based speech synthesis system, named WORLD, was developed in an effort to improve the sound quality of real-time applications using speech. Speech analysis, manipulation, and synthesis on the basis of vocoders are used in various kinds of speech research. Although several high-quality speech synthesis systems have been developed, real-time processing has been difficult with them because of their high computational costs. This new speech synthesis system has not only sound quality but also quick processing. It consists of three analysis algorithms and one synthesis algorithm proposed in our previous research. The effectiveness of the system was evaluated by comparing its output with against natural speech including consonants. Its processing speed was also compared with those of conventional systems. The results showed that WORLD was superior to the other systems in terms of both sound quality and processing speed. In particular, it was over ten times faster than the conventional systems, and the real time factor (RTF) indicated that it was fast enough for real-time processing.

**key words:** speech analysis, speech synthesis, vocoder, sound quality, real-time processing

---

## Our Interpretation

High-quality vocoders in the STRAIGHT family are too slow for real-time use, and the simplifications that make them fast cost audible quality. WORLD resolves this by pairing three cheap analyzers (DIO, CheapTrick, PLATINUM) with a synthesis stage that needs only one convolution per pitch period, achieving both the top MUSHRA score against Legacy-STRAIGHT and TANDEM-STRAIGHT and a total real time factor near 0.32 against their 3.5 to 3.8. For a source-filter synthesizer this paper is a compact, implementable specification of pitch-synchronous minimum-phase excitation synthesis, together with an honest account of where minimum phase fails, namely low-F0 male voices.
