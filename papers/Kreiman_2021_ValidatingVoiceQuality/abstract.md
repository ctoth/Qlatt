# Abstract

## Original Text (Verbatim)

No agreed-upon method currently exists for objective measurement of perceived voice quality. This paper describes validation of a psychoacoustic model designed to fill this gap. This model includes parameters to characterize the harmonic and inharmonic voice sources, vocal tract transfer function, fundamental frequency, and amplitude of the voice, which together serve to completely quantify the integral sound of a target voice sample. In experiment 1, 200 voices with and without diagnosed vocal pathology were fit with the model using analysis-by-synthesis. The resulting synthetic voice samples were not distinguishable from the original voice tokens, suggesting that the model has all the parameters it needs to fully quantify voice quality. In experiment 2 parameters that model the harmonic voice source were removed one by one, and the voice tokens were re-synthesized with the reduced model. In every case the lower-dimensional models provided worse perceptual matches to the quality of the natural tokens than did the original set, indicating that the psychoacoustic model cannot be reduced in dimensionality without loss of fit to the data. Results confirm that this model can be validly applied to quantify voice quality in clinical and research applications.

---

## Our Interpretation

This paper establishes the gold standard for what a voice quality model needs to capture: four harmonic source slope parameters, four-band noise shaping plus HNR, 11 formants with bandwidths, 3 spectral zeros, and F0/amplitude contours. The validation is unusually strong — 198/200 voices matched at perceptual indistinguishability, which is a higher bar than most synthesis evaluations use. The necessity experiment is equally important: it confirms that the four-piece source model cannot be simplified without audible degradation, with the high-frequency slope (H4-5kHz) being most critical. For Qlatt, this validates the importance of detailed source spectrum control beyond simple spectral tilt (TL), and suggests that any voice quality preset system should control at least four independent spectral slope regions.
