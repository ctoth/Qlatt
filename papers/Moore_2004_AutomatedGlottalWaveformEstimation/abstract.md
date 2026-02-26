# Abstract

## Original Text (Verbatim)

An automated glottal waveform estimation algorithm is presented that improves on a previous manual glottal extraction technique which produced excellent glottal waveform estimates. The algorithm uses only basic approximations of glottal closure regions and successive iterations to find the best candidate for a glottal waveform estimate within a speech frame. Visual comparisons of the glottal waveform estimates created by the algorithm and those generated from the use of glottal closure information provided by an electroglottograph (EGG) reveal that the algorithm produced virtually identical estimates.

---

## Our Interpretation

The paper automates a previously manual process for extracting glottal source waveforms from speech recordings, eliminating the need for precise knowledge of when the vocal folds close. By sliding analysis windows around approximate closure regions and selecting the smoothest candidates, the algorithm matches the quality of estimates that use external sensor (EGG) data. This is useful for speech analysis tasks like voice quality assessment and parameter extraction, though it addresses the analysis side rather than synthesis directly.
