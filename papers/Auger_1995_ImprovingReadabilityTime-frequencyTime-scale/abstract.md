# Abstract

## Original Text (Verbatim)

In this paper, the use of the reassignment method, first applied 15 years ago by Kodera, Gendrin, and de Villedary to the spectrogram, is generalized to any bilinear time-frequency or time-scale distribution. This method creates a modified version of a representation by moving its values away from where they are computed, so as to produce a better localization of the signal components. We first propose a new formulation of this method, followed by a thorough theoretical study of its characteristics. Its practical use for a large variety of known time-frequency and time-scale distributions is then addressed. Finally, some experimental results are reported to demonstrate the performance of this method.

---

## Our Interpretation

Smoothing a Wigner-Ville distribution kills its cross-terms but broadens the signal components, and the spectrogram's Heisenberg-Gabor tradeoff makes that broadening unavoidable. Auger and Flandrin recover the lost localization by moving each computed value from its grid point to the local center of gravity of the energy distribution, and show this reduces to ratios of two or three cheap extra transforms computed with the modified windows $t\,h(t)$ and $h'(t)$ — no phase unwrapping, no numerical differentiation, which is why the original 1976 method had gone unused.

For a formant and source-filter speech synthesizer this matters directly: the reassigned representation is perfectly localized for chirps and impulses, so formant transitions collapse onto their instantaneous frequency law and glottal closure instants collapse onto the true excitation time, at roughly three times the cost of the spectrogram already being computed.
