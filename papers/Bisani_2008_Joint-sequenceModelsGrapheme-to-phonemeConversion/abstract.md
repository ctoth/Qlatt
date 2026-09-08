# Abstract

## Original Text (Verbatim)

Grapheme-to-phoneme conversion is the task of finding the pronunciation of a word given its written form. It has important applications in text-to-speech and speech recognition. Joint-sequence models are a simple and theoretically stringent probabilistic framework that is applicable to this problem. This article provides a self-contained and detailed description of this method. We present a novel estimation algorithm and demonstrate high accuracy on a variety of databases. Moreover we study the impact of the maximum approximation in training and transcription, the interaction of model size parameters, n-best list generation, confidence measures, and phoneme-to-grapheme conversion. Our software implementation of the method proposed in this work is available under an Open Source license.

*Key words:* grapheme-to-phoneme, letter-to-sound, phonemic transcription, joint sequence model, pronunciation modeling

---

## Our Interpretation

Text-to-speech and speech recognition need pronunciations for arbitrary words, and neither hand-built dictionaries nor hand-written rule systems generalize adequately. The paper models spelling and pronunciation as a single M-gram sequence over joint letter/phoneme units called graphones, trains it with a discounted EM algorithm that folds Kneser-Ney smoothing into the re-estimation loop, and decodes exactly with best-first search; the key empirical finding is that single-letter, single-phoneme graphones combined with a long-range 8- or 9-gram model beat every larger-chunk variant and every previously published system. For a formant synthesizer project this is the front-end recipe: it converts orthography to phonemes, carries stress and syllable markers as ordinary inventory symbols, supplies a posterior-probability confidence measure with a 31.2% equal error rate for flagging doubtful entries, and comes with an open-source implementation.
