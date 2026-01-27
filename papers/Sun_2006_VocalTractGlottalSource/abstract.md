# Abstract

## Original Text (Verbatim)

A novel modeling method for glottal source is proposed for improving the naturalness and quality of synthetic speech. This paper utilizes the high correlation between vocal tract parameters and glottal source to model glottal source. Vocal tract parameters (LSF) are clustered into some classes. Within each class, a LSF vector closest to centroid and its corresponding glottal wave derivative are selected as a code vector representing different phonetic class of voiced speech. At the stage of voice conversion or synthesis, we can find the relevant glottal source by virtual of finding the closest matched vocal tract parameters. Experiment results show that this vocal tract related glottal source model significantly outperform Rosenberg model and LF model. Correlation coefficients between vocal tract related glottal source and original glottal source increase 27% and 30.13%, spectral distance between synthetic speech and original speech reduce 50.5% and 51.48% respectively, comparing with Rosenberg model and LF model.

---

## Our Interpretation

This paper presents an empirical finding that glottal waveform shape is strongly correlated with vocal tract configuration within phonetic classes, enabling a codebook-based approach that outperforms fixed parametric glottal models. The key insight is that phoneme identity predicts glottal characteristics, allowing voice conversion systems to select appropriate glottal waveforms simply by matching vocal tract parameters rather than explicitly tuning glottal source parameters, with measured improvements of 27-30% in waveform correlation and 50% reduction in spectral distortion compared to traditional LF and Rosenberg models.
