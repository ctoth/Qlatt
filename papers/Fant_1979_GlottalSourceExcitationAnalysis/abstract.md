# Abstract

The source-filter concept of the production of voiced sounds is extended to include a derivation of the exact wave shape from Laplace transforms operating on a parameterized model of the glottal source. The conventional spectral representation of source and sound is compared with a specification in terms of discrete excitations and analysis of the output as the sum of damped oscillations and sinusoidal elements representing the residue of the voice source. The latter elements constitute a low-frequency "glottal pulse formant" and provide for characteristic properties of the waveforms of voiced sounds. With increasing voice effort the glottal pulse amplitude increases much less than the amplitudes of formant oscillation, which is associated with a relative deemphasis of the glottal pulse formant. Above F1 the greater part of the model generates source spectrum slopes of constant -12 dB/oct. along.

The time-variable properties of glottal damping are analyzed in detail. The non-stationarity of the glottal impedance during a voice cycle will in practice "fill out" the sharp source zeroes that appear in conventional source spectrum analysis and adds to the dominance of the closure excitation. Time-domain calculations of waveshapes agree with experimental data. A parametric analysis of voice source variations in connected speech is exemplified.

## Interpretation

This paper is a critical precursor to the LF (Liljencrants-Fant) glottal source model published in 1985. Fant's three-parameter source model (U_0, F_g, K) introduced here directly evolves into the four-parameter LF model by refining the relationship between the offset time T_d and the excitation strength. The key insights for synthesizer implementation are:

1. **Excitation is dominated by closure:** The main excitation of vocal tract formants occurs at glottal closure, not at glottal opening. The closure excitation E_3 dominates E_1 and E_2 by 18 dB/oct in the upper formant range.

2. **T_d is the master control:** The offset time T_d = 1/(omega_g * sqrt(2K-1)) captures both the glottal pulse frequency and the steepness factor into a single parameter that predicts formant initial amplitudes to within 1 dB.

3. **Formant amplitudes are bandwidth-independent in time domain:** Initial amplitudes of formants at excitation depend only on the source parameters and formant frequencies, not on formant bandwidths. This simplifies the source-formant interaction model.

4. **Voice effort modulates T_d, not U_0:** Going from weak to loud voice, U_0 stays roughly constant while T_d decreases (K increases). This means voice effort control in synthesis should primarily modulate the closure steepness, not the overall amplitude.

5. **-12 dB/oct source slope is the standard:** For normal voice (K ~ 1-2), the source spectrum above F_g has a consistent -12 dB/oct slope, which after differentiation by the radiation characteristic becomes -6 dB/oct in the radiated sound.
