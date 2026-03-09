# Abstract

## Original Text (Verbatim)

This paper reports the implementation of high-quality synthesis of speech with varying speaking styles using the Klatt synthesizer. This research is based on previously-reported research that determined that the glottal waveforms of various styles of speech are significantly and identifiably different. Given the parameter tracks that control the synthesis of a normal version of an utterance, those parameters that control known acoustic correlates of speaking style are varied appropriately, relative to normal, to synthesize styled speech. In addition to varying the parameters that control the glottal waveshape, phoneme duration, phoneme intensity, and pitch contour are also varied appropriately. Listening tests that demonstrate that the synthetic speech is perceptibly and appropriately styled, and that the synthetic speech is natural-sounding, were performed, and the results are presented in this paper.

---

## Our Interpretation

The paper provides concrete multiplicative scaling factors for transforming normal Klatt synthesizer parameters into eleven distinct speaking styles by modifying L-F glottal source shape, duration, intensity, and pitch. The listening test results validate that this parametric approach produces perceptually convincing style distinctions, with listeners performing comparably on synthetic and natural speech identification. For Qlatt, the scaling factor tables are directly usable as style-preset rules applied to existing L-F source and timing parameters.
