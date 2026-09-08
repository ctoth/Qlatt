# Abstract

## Original Text (Verbatim)

Two applications of statistically-generated decision trees to problems in speech synthesis
are described: *(1) End of sentence detection:* A decision tree is generated to decide when
a period in text corresponds to the end of a declarative sentence (and not an
abbreviation). The result is 99.8% correct classification on the Brown corpus. *(2) Segment
duration modelling in speech synthesis:* 1500 utterances from a single speaker were used to
a build a decision tree that predicts segment durations based on features such as lexical
position, stress, and phonetic context. The result is prediction with residuals with a 23
millisecond standard deviation and synthesis that compares favorably with current
hand-generated duration rules.

*(p.229. "used to a build" is verbatim from the source, including the typo.)*

---

## Our Interpretation

Hand-written segmental duration rules were the state of the art in 1990 and still did not
sound natural; Riley asks whether CART trained on a phonetically segmented corpus can do
better. A regression tree over a 7-segment phonetic window plus stress, lexical position,
and phrase position cut the duration residual standard deviation from over 35 ms (Bell
Labs hand rules) to 23 ms on the same 1500-utterance single-speaker data, with each of 48
phones encoded as four multi-valued phonetic features to keep categorical splits tractable.
The perceptual gain was smaller than the error reduction suggests, because the tree's
occasional bad predictions in sparsely-trained contexts hurt more than the flatter rule
set's uniform mediocrity. This is the founding paper for CART segmental duration modelling
and the direct precursor of Riley 1992.
