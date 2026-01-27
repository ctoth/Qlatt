# Abstract

## Original Text (Verbatim)

This paper is an initial investigation into using knowledge-based parameters in the field of statistical parametric speech synthesis (SPSS). Utilizing the types of speech parameters used in the Klatt Formant Synthesizer we present automatic techniques for deriving such parameters from a speech database and building a statistical parametric speech synthesizer from these derived parameters. Although the work is exploratory, it shows promise in using more speech production inspired parameterizations for statistical speech synthesis.

Index Terms: statistical speech synthesis, Klatt formant synthesizer.

---

## Our Interpretation

The paper addresses the gap between traditional knowledge-based Klatt formant synthesis and modern statistical parametric speech synthesis (SPSS) by automatically extracting Klatt-style parameters from speech databases rather than hand-tuning them. The key finding is that Klatt parameters can be successfully derived from natural speech using GMM-based detectors for articulatory features (nasality, aspiration, frication) and formant trackers, then used within the Clustergen statistical synthesis framework. This is relevant for Qlatt because it demonstrates that the 40 Klatt parameters can be treated as a feature vector for machine learning, and provides specific techniques for automatic parameter extraction that could inform analysis-by-synthesis approaches.
