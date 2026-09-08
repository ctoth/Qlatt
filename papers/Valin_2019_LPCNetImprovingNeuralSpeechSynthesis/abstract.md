# Abstract

## Original Text (Verbatim)

Neural speech synthesis models have recently demonstrated the ability to synthesize high quality speech for text-to-speech and compression applications. These new models often require powerful GPUs to achieve real-time operation, so being able to reduce their complexity would open the way for many new applications. We propose LPCNet, a WaveRNN variant that combines linear prediction with recurrent neural networks to significantly improve the efficiency of speech synthesis. We demonstrate that LPCNet can achieve significantly higher quality than WaveRNN for the same network size and that high quality LPCNet speech synthesis is achievable with a complexity under 3 GFLOPS. This makes it easier to deploy neural synthesis applications on lower-power devices, such as embedded systems and mobile phones.

*Index Terms* — neural audio synthesis, parametric coding, WaveRNN

---

## Our Interpretation

Neural vocoders spend most of their capacity relearning the vocal tract response, which classical linear prediction already models well, so they need tens of GFLOPS and a GPU. LPCNet removes that burden: a 16th-order LPC filter computed per frame from the 18-band Bark cepstrum handles the spectral envelope, and a sparse two-GRU network predicts only the 8-bit µ-law excitation, with the prediction fed back into the network so it can compensate for the cepstrum's low resolution. The result beats an equal-sized WaveRNN in MUSHRA at every size tested and runs in real time under 2.8 GFLOPS, which makes it the reference example of splitting a synthesizer into a cheap classical filter and a learned source.
