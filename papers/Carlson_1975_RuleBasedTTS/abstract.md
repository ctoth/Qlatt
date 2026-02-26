# Abstract

## Original Text (Verbatim)

When reading a text a native speaker pronounces most words correctly even if they are unknown to him. During this process he makes use of his knowledge of the language, the semantic content and the syntax. However, if we take away all information except the spelling and some pronunciation rules on the word level, the task would be more difficult. This is basically the case in our text-to-speech synthesis system containing neither semantic and syntactic analysis nor a word or morpheme dictionary. At the conference the function of our present synthesis system will be discussed. The result shows that such a system might well be based on rules rather than on an extensive dictionary. Furthermore a useful tool in speech synthesis work is described (i.e. a programming language).

---

## Our Interpretation

The authors ask: can you build a working TTS system using only pronunciation rules, with no dictionary at all? They argue yes - their Swedish system proves it. The key insight is that even dictionary-based systems need rules for compounds and novel words, so rules are unavoidable anyway. For Qlatt, this validates the rule-based letter-to-sound approach in `tts-frontend-rules.js`, though their Swedish-specific stress rules don't transfer directly to English.
