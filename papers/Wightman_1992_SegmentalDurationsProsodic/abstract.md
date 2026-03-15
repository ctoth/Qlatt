# Abstract

Numerous studies have indicated that prosodic phrase boundaries may be marked by a variety of acoustic phenomena including segmental lengthening. It has not been established, however, whether this lengthening is restricted to the immediate vicinity of the boundary, or if it extends over some larger region. In this study, segmental lengthening in the vicinity of prosodic boundaries is examined and found to be restricted to the rhyme of the syllable preceding the boundary. By using a normalized measure of segmental lengthening, and by compensating for differences in speaking rate, it is also shown that at least four distinct types of boundaries can be distinguished on the basis of this lengthening.

PACS numbers: 43.70.Fq

## Interpretation

This paper provides the empirical foundation for implementing pre-boundary lengthening in a TTS system. The key implementation-relevant findings are: (1) lengthening scope is precisely defined — only the rhyme (nucleus + coda) of the immediately pre-boundary syllable, not the onset or earlier syllables; (2) a z-score normalization (d = (t - mu) / sigma per phone class) provides a speaking-rate-invariant measure; (3) four statistically distinct lengthening levels map to break indices {0,1}, {2}, {3}, {4-6}; (4) pausing and lengthening are additive, not compensatory. These findings directly inform duration rules for the Klatt synthesizer's prosody module.
