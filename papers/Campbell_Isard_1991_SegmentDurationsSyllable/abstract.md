# Abstract

## Original Text (Verbatim)

In continuous speech there is considerable variation in the durations of the segments. A measure of this variation in terms of elasticity of segments is proposed, and experiments are described that test the assumption that within a given syllable a constant factor of lengthening or compression can be applied uniformly to each segment in terms of its elasticity. Elasticity of segments is calculated on the basis of measured durations from a phonetically balanced 200-sentence database.

Comparisons were performed of relative compression and expansion of different segments with regard to position in the syllable and in the utterance. It was found that whereas segments in pre-pausal sentence-final syllables undergo greater lengthening in the rhyme than in the onset, segments in sentence-internal syllables are lengthened or compressed more uniformly across the syllable. These findings offer a simpler account of the differential lengthening of vowels and consonants by explaining such differences in terms of elasticity about a mean.

We describe an implementation of the concept of segmental elasticity in the timing component to a text-to-speech system. In this system, duration is first computed at the syllable level, and the segmental durations are accommodated to the syllable framework.

---

## Our Interpretation

Campbell and Isard propose that segment duration in speech is best modeled hierarchically: first predict how long a syllable should be (based on stress, position, and prosodic context), then distribute that time among the syllable's component segments using each segment's inherent "elasticity" -- its tendency to stretch or compress relative to its average duration. The key finding is that this uniform stretching works well for non-final syllables, but pre-pausal syllables show asymmetric lengthening concentrated in the vowel and coda rather than the onset. For TTS implementation, this means duration rules should operate at both syllable and segment levels rather than treating each segment independently.
