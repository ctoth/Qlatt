# Abstract

## Original Text (Verbatim)

In order to devise an audio response system for computer output, we have to discover what determines the structure of a complete text-to-speech system. Clearly, a wide range of language competence is needed. Each structural domain (e.g. morphology, syntax, semantics, phonology) makes a contribution to the total process, but because individual acoustic correlates (e.g. pitch) are not always uniquely related to the linguistic structure of the utterance, the various structural domains must be represented in a manner that allows their interaction. Only in this way can increasingly complicated relations between the surface speech wave and the underlying abstract linguistic structure be comprehensively and insightfully modeled. Furthermore, since the structure of speech models is not nearly decomposable, the complete model is needed to provide an adequate context for the study of singular speech phenomena.

Given this interactive nature of language structures, a set of attributes for a complete text-to-speech system can be devised. We want:
a. A complete model in algorithmic form, so that the process is explicitly represented.
b. Since different parts of the process can be expected to develop at varying rates, dependent on past and current knowledge, flexibility must be provided so that one aspect of the system (e.g. syntactic analysis) can be improved while others remain static.
c. The system should allow for models of varying complexity. For example, it should be possible to use a fixed vocabulary, or suppress the use of varying prosodic correlates. That is, the complete structural framework should allow for the construction of several models according to the purpose at hand. This also allows for assessment of the contribution of each of the structural domains or knowledge sources to the resultant speech quality.
d. Finally, it should be possible to implement parts of the algorithm in efficient, application-oriented form, including the use of special hardware designed to minimize space, time, power, or monetary costs.

---

## Our Interpretation

Allen presents a foundational framework for text-to-speech synthesis that emphasizes modularity and the need for interaction between linguistic domains (morphology, syntax, semantics, phonology). Rather than building monolithic systems, he advocates for a modular architecture where each linguistic level can be developed and improved independently while the overall system retains flexibility to account for complex relationships between linguistic structure and acoustic output. This work is critical for speech synthesis because it recognizes that acoustic correlates like pitch cannot be determined from any single linguistic level alone—the complete linguistic context is essential for generating natural, intelligible speech.

