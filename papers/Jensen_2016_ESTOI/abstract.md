# Abstract

## Original Text (Verbatim)

Intelligibility listening tests are necessary during development and evaluation of speech processing algorithms, despite the fact that they are expensive and time-consuming. In this paper, we propose a monaural intelligibility prediction algorithm, which has the potential of replacing some of these listening tests. The proposed algorithm shows similarities to the Short-Time Objective Intelligibility (STOI) algorithm but works for a larger range of input signals. In contrast to STOI, Extended STOI (ESTOI) does not assume mutual independence between frequency bands. ESTOI also incorporates spectral correlation by comparing complete 400-ms length spectrograms of the noisy/processed speech and the clean speech signals. As a consequence, ESTOI is also able to accurately predict the intelligibility of speech contaminated by temporally highly modulated noise sources in addition to noisy signals processed with time-frequency weighting. We show that ESTOI can be interpreted in terms of an orthogonal decomposition of short-time spectrograms into intelligibility subspaces, i.e., a ranking of spectrogram features according to their importance to intelligibility. A free Matlab implementation of the algorithm is available for non-commercial use at http://kom.aau.dk/~jje/.

---

## Our Interpretation

This paper addresses the limitation of STOI -- the most widely-used objective intelligibility metric -- when confronted with modulated noise maskers like competing talkers or amplitude-modulated noise. The key innovation is replacing per-subband temporal correlation (which assumes frequency bands contribute independently) with spectral correlation computed on doubly-normalized spectrograms (which captures cross-frequency patterns). The result is a metric that works well across all noise types tested, never performing significantly worse than STOI on any condition while dramatically outperforming it on modulated maskers. For Qlatt, this gives us a more robust automated quality metric for evaluating synthesized speech.
