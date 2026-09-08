# Abstract

## Original Text (Verbatim)

Work is progressing on a keyword lexicon aimed at enabling the synthesis of various regional accents of English. This paper focuses on a particular issue, that of vowels before orthographic 'r'. These vowels are discussed with respect to rhotic and nonrhotic accents, in terms of both keyword sets and phonetic realisation. Criteria for the use of keysymbols are discussed, and it is noted that these criteria result in inclusion of post-vocalic |r| in the lexicon, with deletion by rule for non-rhotic accents. It is noted that some keyvowels in our original set have had to be split, while others may prove to be redundant.

---

## Our Interpretation

The paper is the concrete engineering case study for the Unisyn lexicon-vs-rule question: it states two explicit criteria (Principle I: lexically encode any distinction phonemic in at least one target accent; Principle II: derive by accent-dependent rule whenever realisation is predictable from environment, with Principle II winning on conflict) and applies them systematically to every rhotic-adjacent English vowel keyword. The result is that post-vocalic |r| itself is kept in the base lexicon and deleted or realized by rule per accent, while individual keyvowels (NURSE, PRICE, etc.) are split or merged as each accent's actual phonemic contrasts require. For a declarative TTS frontend, this is the primary source for actual rule syntax — the environment notation and rewrite-rule examples are directly reusable templates.
