# Abstract

## Original Text (Verbatim)

Many of the commonly used voice source models are based on piecewise elementary functions defined in the time domain. The discrete-time implementation of such models generally causes aliasing distortion, which make them less useful for certain applications. This paper presents a method which eliminates this distortion. The key component of the proposed method is the frequency domain description of the source model. By deploying the Laplace transform and phasor arithmetic, closed-form expressions of the source model spectrum can be derived. This facilitates the calculation of the spectrum directly from the model parameters, which in turn makes it possible to obtain the ideal discrete spectrum of the model given the sampling frequency used. This discrete spectrum is entirely free of aliasing distortion, and the inverse discrete Fourier transform is used to compute the sampled glottal flow pulse. The proposed method was applied to the widely used LF model, and the complete Laplace transform of the model is presented. Also included are closed-form expressions of the amplitude spectrum and the phase spectrum for the calculation of the LF model spectrum.

---

## Our Interpretation

This paper solves a critical problem in glottal source synthesis: aliasing distortion that occurs when time-domain glottal flow models are discretely sampled, especially at lower sampling rates. Gobl presents a frequency-domain approach using Laplace transforms and phasor arithmetic to derive exact closed-form expressions for the LF model spectrum, enabling the generation of aliasing-free discrete samples via inverse DFT. This work is highly relevant to Klatt synthesizers because the LF model is the standard glottal source in modern formant synthesis systems, and the alias-free implementation directly improves spectral accuracy and voice quality in low-sampling-rate applications.
