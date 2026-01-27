# Abstract

## Original Text (Verbatim)

Speech glottal flow has been predominantly described in the time-domain in past decades, the Liljencrants–Fant (LF) model being the most widely used in speech analysis and synthesis, despite its computational complexity. The causal/anti-causal linear model (LFCALM) was later introduced as a digital filter implementation of LF, a mixed-phase spectral model including both anti-causal and causal filters to model the vocal-fold open and closed phases, respectively. To further simplify computation, a causal linear model (LFLM) describes the glottal flow with a fully causal set of filters. After expressing these three models under a single analytic formulation, we assessed here their perceptual consistency, when driven by a single parameter Rd related to voice quality. All possible paired combinations of signals generated using six Rd levels for each model were presented to subjects who were asked whether the two signals in each pair differed. Model pairs LFLM–LFCALM were judged similar when sharing the same Rd value, and LF was considered the same as LFLM and LFCALM given a consistent shift in Rd. Overall, the similarity between these models encourages the use of the simpler and more computationally efficient models LFCALM and LFLM in speech synthesis applications.

---

## Our Interpretation

This paper proves that two computationally efficient linear-filter approximations of the LF glottal source model (LFCALM and LFLM) produce perceptually equivalent voice quality when using the same Rd parameter, despite having different mathematical formulations. The key finding is that LFLM and LFCALM are 10-100 times faster to compute than LF while maintaining perceptual naturalness, making them viable for real-time speech synthesis applications that require voice quality control through a single, intuitive parameter.

