# Abstract

## Original Text (Verbatim)

The HLsyn speech synthesizer uses models of the vocal tract to map higher-level quasiarticulatory parameters to the acoustic parameters of a Klatt-type formant synthesizer. The benefits of this system are several. In addition to requiring a relatively small number of parameters, the HLsyn model includes constraints on source-filter relations that occur naturally during speech production. Such constraints help to prevent combinations of sources and filter that are impossible to achieve with the human vocal tract. Thus, HLsyn could lead to reductions in the complexity of formant synthesis and result in better quality synthesis. HLsyn can also be a useful tool for speech-science education and speech research. This paper focuses on the generation of acoustic sources in HLsyn. Described in detail are the equations and methods used to estimate Klatt-type source parameters from HLsyn parameters. Several examples illustrating the generation of source parameters for obstruents (voiced and voiceless) and sonorants are provided. Future papers will describe the filtering components of HLsyn.

---

## Our Interpretation

This paper solves the problem of controlling the ~50 interdependent parameters of a Klatt formant synthesizer by introducing a 13-parameter quasiarticulatory control layer (HLsyn) that uses an aerodynamic circuit model to automatically derive physically realistic source amplitudes, voicing characteristics, and F0 perturbations. The key finding is that source-filter constraints emerge naturally from the physics -- for example, voicing amplitude drops automatically when oral pressure builds during a stop closure, and frication rises when pressure drops across a supraglottal constriction. For Qlatt, this provides the complete equation set needed to implement a higher-level parameter mapping layer that would replace or augment the current rule-based source parameter control, enforcing constraints that prevent impossible acoustic configurations.
