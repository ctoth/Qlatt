# Abstract

## Original Text (Verbatim)

Naturalness of sound quality is essential for singing-voice synthesis. Since 95% of singing is voiced sound (Cook, 1990), the focus of this paper is to improve the naturalness of the vowel tone quality via glottal excitation modeling. We propose to use the LF-model (Fant et al., 1985) for the glottal wave shape in conjunction with pitch-synchronous, amplitude-modulated Gaussian noise, which adds an aspiration component to the glottal excitation. The associated analysis and synthesis procedures are also provided in this paper. By analyzing baritone recordings, we have found simple rules to change voice qualities from "laryngealized" (or "pressed"), to normal, to "breathy" phonation.

---

## Our Interpretation

The paper addresses how to make synthesized singing sound more natural by improving the glottal source model. The authors combine the well-known LF waveform model with carefully shaped aspiration noise that pulses in sync with the pitch, then validate their approach by analyzing actual baritone recordings to extract rules for controlling voice quality. For speech synthesis, this provides concrete parameter values (especially the Rd parameter ranging 0.84-2.90) and a noise model that can be used to achieve different voice textures from tense/pressed through normal to breathy phonation.
