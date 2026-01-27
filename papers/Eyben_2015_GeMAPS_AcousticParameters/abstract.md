# Abstract

## Original Text (Verbatim)

Work on voice sciences over recent decades has led to a proliferation of acoustic parameters that are used quite selectively and are not always extracted in a similar fashion. With many independent teams working in different research areas, shared standards become an essential safeguard to ensure compliance with state-of-the-art methods allowing appropriate comparison of results across studies and potential integration and combination of extraction and recognition systems. In this paper we propose a basic standard acoustic parameter set for various areas of automatic voice analysis, such as paralinguistic or clinical speech analysis. In contrast to a large brute-force parameter set, we present a minimalistic set of voice parameters here. These were selected based on a) their potential to index affective physiological changes in voice production, b) their proven value in former studies as well as their automatic extractability, and c) their theoretical significance. The set is intended to provide a common baseline for evaluation of future research and eliminate differences caused by varying parameter sets or even different implementations of the same parameters. Our implementation is publicly available with the openSMILE toolkit. Comparative evaluations of the proposed feature set and large baseline feature sets of INTERSPEECH challenges show a high performance of the proposed set in relation to its size.

---

## Our Interpretation

GeMAPS addresses the fragmentation problem in vocal acoustic analysis where different research teams use incompatible parameter sets, making cross-study comparison impossible. The authors propose a minimalistic but theoretically grounded set of 62 acoustic parameters (prosodic, spectral, and excitation features) that can reliably capture physiological changes underlying affective vocal expression. For speech synthesis applications, this work is important because standardized, interpretable acoustic parameters provide a principled way to control emotional expression in synthesized speech—avoiding the overfitting problems of large brute-force feature sets while maintaining strong performance.

---

**Citation:** Eyben, F., Scherer, K., Schuller, B., Sundberg, J., André, E., Busso, C., Devillers, L., Epps, J., Laukka, P., Narayanan, S., & Truong, K. (2015). The Geneva Minimalistic Acoustic Parameter Set (GeMAPS) for Voice Research and Affective Computing. *IEEE Transactions on Affective Computing*, 6(2), 190-202.
