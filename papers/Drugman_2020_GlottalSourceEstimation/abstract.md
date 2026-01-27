# Abstract

## Original Text (Verbatim)

Source-tract decomposition (or glottal flow estimation) is one of the basic problems of speech processing. For this, several techniques have been proposed in the literature. However studies comparing different approaches are almost nonexistent. Besides, experiments have been systematically performed either on synthetic speech or on sustained vowels. In this study we compare three of the main representative state-of-the-art methods of glottal flow estimation: closed-phase inverse filtering, iterative and adaptive inverse filtering, and mixed-phase decomposition. These techniques are first submitted to an objective assessment test on synthetic speech signals. Their sensitivity to various factors affecting the estimation quality, as well as their robustness to noise are studied. In a second experiment, their ability to label voice quality (tensed, modal, soft) is studied on a large corpus of real connected speech. It is shown that changes of voice quality are reflected by significant modifications in glottal feature distributions. Techniques based on the mixed-phase decomposition and on a closed-phase inverse filtering process turn out to give the best results on both clean synthetic and real speech signals. On the other hand, iterative and adaptive inverse filtering is recommended in noisy environments for its high robustness.

---

## Our Interpretation

This paper addresses the fundamental challenge of separating the glottal voice source from vocal tract filtering in speech signals—a "blind separation" problem since the true glottal waveform is never directly observable. The authors compare three leading methods (CPIF, IAIF, and CCD) through rigorous testing on over 250,000 synthetic conditions and real speech with different voice qualities. The key takeaway for speech synthesis is that mixed-phase decomposition (CCD) works best for analyzing clean recordings (like TTS training data), while iterative filtering (IAIF) is more robust for noisy real-world recordings, and the extracted glottal parameters reliably distinguish voice quality variations that are essential for expressive synthesis.
