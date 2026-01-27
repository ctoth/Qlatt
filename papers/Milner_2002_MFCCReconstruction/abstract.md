# Abstract

## Original Text (Verbatim)

This work presents a method of reconstructing a speech signal from a stream of MFCC vectors using a source-filter model of speech production. The MFCC vectors are used to provide an estimate of the vocal tract filter. This is achieved by inverting the MFCC vector back to a smoothed estimate of the magnitude spectrum. The Wiener-Khintchine theorem and linear predictive analysis transform this into an estimate of the vocal tract filter coefficients. The excitation signal is produced from a series of pitch pulses or white noise, depending on whether the speech is voiced or unvoiced. This pitch estimate forms an extra element of the feature vector.

Listening tests reveal that the reconstructed speech is intelligible and of similar quality to a system based on LPC analysis of the original speech. Spectrograms of the MFCC-derived speech and the real speech are included which confirm the similarity.

---

## Our Interpretation

The paper solves the problem of reconstructing audible speech from MFCC recognition features, which normally discard too much information for reconstruction. The key finding is that inverting MFCCs to a magnitude spectrum, then using Wiener-Khintchine to get autocorrelation coefficients for LPC filter estimation, produces speech quality comparable to direct LPC analysis - with only pitch needing to be added to the feature vector. This matters for distributed recognition systems where bandwidth constraints prevent sending both codec and recognition vectors.
