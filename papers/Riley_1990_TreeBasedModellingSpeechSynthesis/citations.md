# Citations

## Reference List

*(Verbatim from the REFERENCES section, p.232. Riley's own spelling and errors are
preserved; "Brieman" is a misspelling of Breiman, and Chou is cited as [Chou 1987] in the
body text but listed as 1988 here.)*

Brieman, L., et. al. 1984. *Classification and regression trees*. Monterey, CA: Wadsworth
& Brooks.

Chou, P. 1988. *Applications of information theory to pattern recognition and the desing
of decision trees and trellises*. Ph.D. thesis, Stanford University, Stanford, CA.

Klatt, D. 1976. Linguistic uses of segmental duration in English: acoustic and perceptual
evidence. *J. Acoust. Soc. Am.* **59**. 1208-1221.

Riley, M. 1989. Statistical tree-based modeling of phonetic segment durations. *J. Acoust.
Soc. Am.* **85**. S44.

Syrdal, A. 1989. Improved duration rules for text-to-speech synthesis. *J. Acoust. Soc.
Am.* **85**. S43.

Van Santen, J. and J. Olive. 1990. The analysis of contextual effect on segmental
duration. *Computer Speech and Language*. **4**. To appear.

## Works Named in the Body but Not in the Reference List

- **Brown corpus** (tagged, ~1 million words) — training and evaluation data for the
  end-of-sentence classifier. *(p.229, p.230)*
- **TIMIT** phonetically segmented and labelled speech database — named in the
  introduction as an example of the newly available labelled databases motivating the
  work; not identified as the duration corpus. *(p.229)*
- **AP news** text database, 25 million words — source of the word-probability features.
  *(p.230)*
- **Syrdal 1988** is cited in the body text *(p.231)* where the reference list gives
  Syrdal 1989. Treat these as the same work.

## Key Citations for Follow-up

1. **Breiman, L., et al. 1984. Classification and Regression Trees.** The complete method
   reference. Riley cites p. 29 specifically for the 2^k categorical-partition blowup, and
   defers all splitting/pruning theory to this book. Required reading before reimplementing
   the duration tree, since this paper states no splitting criterion or stopping rule.
2. **Klatt, D. 1976. Linguistic uses of segmental duration in English: acoustic and
   perceptual evidence.** JASA 59:1208-1221. The hand-derived rule tradition Riley measures
   against and the canonical duration rule set for a Klatt-style formant synthesizer.
   Directly relevant to this project's existing duration handling.
3. **Van Santen, J. and Olive, J. 1990. The analysis of contextual effect on segmental
   duration.** Computer Speech and Language 4. The contemporaneous sums-of-products
   alternative to trees for the same problem, from the same lab. The natural comparison
   point for anyone choosing a duration-model architecture.
4. **Chou, P. 1988. Applications of information theory to pattern recognition and the
   design of decision trees and trellises.** Stanford PhD thesis. The k-means approach to
   splitting high-cardinality categorical variables in linear time, which Riley considered
   and rejected in favour of the phonetic 4-feature decomposition.
5. **Syrdal, A. 1989. Improved duration rules for text-to-speech synthesis.** JASA 85:S43.
   The best hand-derived rules of the period, i.e. the baseline the 35 ms figure represents.
   Abstract only, so likely low yield.
