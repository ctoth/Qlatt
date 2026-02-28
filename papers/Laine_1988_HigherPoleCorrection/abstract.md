# Abstract

## Original Text (Verbatim)

The Higher Pole Correction (HPC) function in analog and digital all-pole modelling of speech production is analyzed by comparing all-pole models with a Transmission Line (TL) model. The validity of the TL model, which was chosen as a computational reference system in the study, is tested by comparing its transfer functions to acoustical measurements made on a physical vocal tract model. The variation of effective length of the vocal tract turned out to be an important parameter in modelling the HPC. Even if the frequency responses of the HPC in analog and digital cases differ, the relative changes in the correction, influenced by the variations in the effective length of the vocal tract, are exactly the same in both cases. Therefore digital realizations should have a variable HPC also. A polynomial analysis of the vocal tract transfer function was done to obtain new practical models for the HPC. The work results in all-zero models, which can be used in analog as well as digital all-pole realizations to form a new type of pole-zero model for speech production. This new pole-zero model is related to the PARCAS terminal analog model [Laine, 1982].

---

## Our Interpretation

When a formant synthesizer models only a few vocal tract resonances (e.g., 4-6 formants), it ignores the infinite number of higher resonances, causing spectral errors that grow at higher frequencies. This paper shows that the correction needed depends almost entirely on the effective vocal tract length (physical length plus a lip radiation term), and proposes a practical filter design: pair each formant resonator with a wide-bandwidth antiresonator (zero) to automatically compensate. This directly informs how adding explicit higher formants (like F7-F10 in Qlatt) reduces but does not eliminate the need for spectral correction, and provides the mathematical basis for computing what remains.
