# Abstract

## Original Text (Verbatim)

A method for synthesizing vocal-tract spectra from phoneme sequences by mimicking the speech production process of humans is presented. The model consists of four main processes and is particularly characterized by an adaptive formation of articulatory movements. First, our model determines the time when each phoneme is articulated. Next, it generates articulatory constraints that must be met for the production of each phoneme, and then it generates trajectories of the articulatory movements that satisfy the constraints. Finally, the time sequence of spectra is estimated from the produced articulatory trajectories. The articulatory constraint of each phoneme does not change with the phonemic context, but the contextual variability of speech is reproduced because of the dynamic articulatory model. The accuracy of the synthesis model was evaluated using data collected by the simultaneous measurement of speech and articulatory movements. The accuracy of the phonemic timing estimates were measured and compared the synthesized results to the measured results. Experimental results showed that the model captured the contextual variability of both the articulatory movements and speech acoustics.

---

## Our Interpretation

Kaburagi and Kim address the problem of generating realistic coarticulatory variation in speech synthesis without explicitly modeling every phonemic context. Their key insight is that context-independent articulatory targets, when combined with a dynamic trajectory model that enforces smooth articulator movements, produce context-dependent acoustic output that matches measured speech within ~3.4 dB spectral error. This is relevant to formant synthesis as it provides theoretical grounding for why simple phonemic inventory targets plus transition smoothing rules can capture coarticulation effects — the same principle underlying Qlatt's rule-based formant transition system.
