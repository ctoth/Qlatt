# Abstract

## Original Text (Verbatim)

This paper introduces the tilt intonational model and describes how this model can be used to automatically analyse and synthesize intonation. In the model, intonation is represented as a linear sequence of events, which can be pitch accents or boundary tones. Each event is characterised by continuous parameters representing amplitude, duration and tilt (a measure of the shape of the event). The paper describes a event detector, in effect an intonational recognition system, which produces a transcription of an utterance's intonation. The features and parameters of the event detector are discussed and performance figures are shown on a variety of read and spontaneous speaker independent conversational speech databases. Given the event locations, algorithms are described which produce an automatic analysis of each event in terms of the Tilt parameters. Synthesis algorithms are also presented which generate F0 contours from Tilt representations. The accuracy of these is shown by comparing synthetic F0 contours to real F0 contours. The paper concludes with an extensive discussion on linguistic representations of intonation and gives evidence that the Tilt model goes a long to way to satisfying the desired goals of such a representation in that its has the right number of degrees of freedom to be able to describe and synthesize intonation accurately.

---

## Our Interpretation

The Tilt model represents F0 intonation contours using three independent continuous parameters—amplitude, duration, and tilt—to describe pitch accents and boundary tones in a flexible framework for both analysis and synthesis. The paper demonstrates that this model achieves high synthesis accuracy (near-identical reconstruction of F0 contours) while maintaining linguistic interpretability superior to categorical systems like ToBI, and shows that continuous parameter representations are appropriate for capturing natural prosodic variation in speech synthesis.
