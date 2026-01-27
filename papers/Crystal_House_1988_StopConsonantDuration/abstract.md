# Abstract

## Original Text (Verbatim)

An overview is given of the durational characteristics of stop sounds in the readings of three slow and three fast talkers. Differences in percentage of completeness and durational statistics are presented for individual stops and classes of stops, with some contextual constraints taken into account. The data are compared to a number of previous studies of stop duration, with particular regard for the potential utility of durational cues for automatic speech recognition. Some generalizations made in the literature are not supported by these new data.

---

## Our Interpretation

This paper measures how long stop consonants (p, t, k, b, d, g) last in natural connected English speech, finding that only 59% of stops have both a silent holding period and an audible release. The key discovery is that release durations—not hold durations—are the primary acoustic difference between voiced and voiceless stops, with releases lasting ~18 ms for voiced stops versus ~39 ms for voiceless stops. For Qlatt synthesizer implementation, this reveals that duration rules must account for natural speech patterns where many stops are incomplete, and that modeling release duration variation is more important than modeling hold duration variation for distinguishing stop voicing and place of articulation.
