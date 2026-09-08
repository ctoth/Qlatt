# Abstract

## Original Text (Verbatim)

The task of estimating the fundamental frequency of a monophonic sound recording, also known as pitch tracking, is fundamental to audio processing with multiple applications in speech processing and music information retrieval. To date, the best performing techniques, such as the pYIN algorithm, are based on a combination of DSP pipelines and heuristics. While such techniques perform very well on average, there remain many cases in which they fail to correctly estimate the pitch. In this paper, we propose a data-driven pitch tracking algorithm, CREPE, which is based on a deep convolutional neural network that operates directly on the time-domain waveform. We show that the proposed model produces state-of-the-art results, performing equally or better than pYIN. Furthermore, we evaluate the model's generalizability in terms of noise robustness. A pre-trained version of CREPE is made freely available as an open-source Python module for easy application.

**Index Terms** — pitch estimation, convolutional neural network

---

## Our Interpretation

Monophonic f0 estimation had been dominated by hand-tuned DSP heuristics whose reported near-perfect accuracies concealed real failure modes on uncommon timbres and fast pitch changes. CREPE replaces the whole pipeline with a convolutional network on raw audio that predicts a distribution over 360 log-frequency bins, reaching 99.9% raw pitch accuracy on homogeneous synthesized audio and 96.7% on timbrally diverse audio, with its advantage growing as the evaluation tolerance tightens toward 10 cents. For a source-filter speech synthesizer this is the reference-grade f0 analyzer, subject to the caveats that it was trained on music rather than speech, applies no temporal smoothing, and offers no voicing decision.
