# Abstract

## Original Text (Verbatim)

In the development process of noise-reduction algorithms, an objective machine-driven intelligibility measure which shows high correlation with speech intelligibility is of great interest. Besides reducing time and costs compared to real listening experiments, an objective intelligibility measure could also help provide answers on how to improve the intelligibility of noisy unprocessed speech. In this paper, a short-time objective intelligibility measure (STOI) is presented, which shows high correlation with the intelligibility of noisy and time-frequency weighted noisy speech (e.g., resulting from noise reduction) of three different listening experiments. In general, STOI showed better correlation with speech intelligibility compared to five other reference objective intelligibility models. In contrast to other conventional intelligibility models which tend to rely on global statistics across entire sentences, STOI is based on shorter time segments (386 ms). Experiments indeed show that it is beneficial to take segment lengths of this order into account. In addition, a free Matlab implementation is provided.

---

## Our Interpretation

STOI is designed to objectively predict how intelligible speech will be after it has been processed (e.g., by noise reduction or time-frequency masking), without needing human listeners. The key insight is that computing correlations over short 384 ms windows -- matching the auditory system's temporal integration time -- captures intelligibility-relevant information that global statistics miss. For Qlatt, this metric enables automated evaluation of synthesized speech intelligibility, allowing us to measure whether changes to formant targets, duration rules, or prosody parameters improve or degrade the intelligibility of the synthesizer's output.
