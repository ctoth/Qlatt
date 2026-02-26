# Abstract

## Original Text (Verbatim)

SRS (Speech Research System) is a highly flexible computer system for the development of text-to-speech rules for any language. Its powerful interactive facilities and special rule language have been designed to facilitate rule development by programmers and nonprogrammers alike. The system has been used for instruction in acoustic phonetics, for the generation of stimuli for perceptual experiments, and for the development of synthesis rules for a variety of languages. This paper focuses on the SRS rule framework, which allows users to express four kinds of rules that apply in succession to convert text to sound. The paper also illustrates the user-oriented nature of the SRS interactive facilities, and describes the system's implementation and use.

---

## Our Interpretation

The paper introduces SRS, a rule-based TTS development environment from Cornell University that separates the text-to-speech process into four distinct rule types: text-modification (morphological analysis), conversion (grapheme-to-phoneme), feature-modification (allophonic/stress rules), and parameter rules (synthesizer control). The key innovation is making TTS rule development accessible to linguists without programming background through a notation that mirrors generative phonology conventions, while remaining powerful enough for production-quality multi-language synthesis. For speech synthesis implementers, SRS demonstrates that explicit, declarative rule systems can achieve both flexibility (language-independence) and quality (natural-sounding output across English, German, Dutch, Spanish, and Japanese), and its parameter rule concepts—percentage-based target positions, linear transitions, and duration modification—directly inform modern formant synthesis track generation.
