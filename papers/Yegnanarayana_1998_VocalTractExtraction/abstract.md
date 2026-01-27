# Abstract

## Original Text (Verbatim)

We propose methods to track natural variations in the characteristics of the vocal-tract system from speech signals. We are especially interested in the cases where these characteristics vary over time, as happens in dynamic sounds such as consonant-vowel transitions. We show that the selection of appropriate analysis segments is crucial in these methods, and we propose a selection based on estimated instants of significant excitation. These instants are obtained by a method based on the average group-delay property of minimum-phase signals. In voiced speech, they correspond to the instants of glottal closure. The vocal-tract system is characterized by its formant parameters, which are extracted from the analysis segments. Because the segments are always at the same relative position in each pitch period, in voiced speech the extracted formants are consistent across successive pitch periods. We demonstrate the results of the analysis for several difficult cases of speech signals.

---

## Our Interpretation

This paper presents a pitch-synchronous formant extraction method that uses group-delay analysis to detect glottal closure instants, enabling accurate tracking of time-varying formant parameters during consonant-vowel transitions and other dynamic speech segments. The key innovation is synchronizing analysis frames to glottal closure instants rather than using fixed block-based frames, which dramatically improves consistency and allows detection of heavily damped formants that would otherwise be obscured. The multicycle covariance method extends the approach for high-pitched voices where pitch periods are short, making this technique essential for analysis-synthesis applications in speech synthesis systems like Klatt.
