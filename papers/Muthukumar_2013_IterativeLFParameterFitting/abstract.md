# Abstract

## Original Text (Verbatim)

Every parametric speech synthesizer requires a good excitation model to produce speech that sounds natural. In this paper, we describe efforts toward building one such model using the Liljencrants-Fant (LF) model. We used the Iterative Adaptive Inverse Filtering technique to derive an initial estimate of the glottal flow derivative (GFD). Candidate pitch periods in the estimated GFD were then located and LF model parameters estimated using a gradient descent optimization algorithm. Residual energy in the GFD, after subtracting the fitted LF signal, was then modeled by a 4-term LPC model plus energy term to extend the excitation model and account for source information not captured by the LF model. The ClusterGen speech synthesizer was then trained to predict these excitation parameters from text so that the excitation model could be used for speech synthesis. ClusterGen excitation predictions were further used to reinitialize the excitation fitting process and iteratively improve the fit by including modeled voicing and segmental influences on the LF parameters. The results of all of these methods have been confirmed both using listening tests and objective metrics.

---

## Our Interpretation

The paper tackles the problem of extracting LF glottal source parameters from real speech in a way that's both accurate and predictable for text-to-speech synthesis. Their solution combines inverse filtering to isolate the glottal source, gradient descent to fit LF parameters, and a clever feedback loop where a statistical model's predictions are used to improve the next round of fitting. The key practical insight is that modeling the LF residual with LPC avoids the need for binary voicing decisions, which tend to cause artifacts at voiced/unvoiced transitions.
