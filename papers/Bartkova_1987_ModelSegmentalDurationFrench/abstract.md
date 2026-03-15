# Abstract

This paper presents a set of rules to predict phoneme durations for synthesis applications in French. The rules use a speaker-independent Intrinsic Duration for each phoneme and a lengthening/shortening coefficient reflecting the effects of context and speaking style. The model can thus yield different sets of phoneme durations as produced by different speakers. The validity of the model was tested on 2 speakers. For the test-corpora, the mean differences between predicted and measured durations were less than 18 ms.

## Interpretation

The paper addresses the specific problem of predicting segment durations in French connected speech for use in a diphone-based TTS system at CNET. The key contribution is the factored multiplicative model (DI * coefficient) which cleanly separates language-universal intrinsic durations from speaker-specific contextual shortening/lengthening. This is directly relevant to any rule-based duration model: the coefficient tables (Tables 1, 3, 4, 5) provide empirically validated French-specific duration parameters. The comparison with O'Shaughnessy (1984) and Klatt (1979) helps position the approach within the broader duration modeling literature. The 18 ms accuracy is below the perceptual threshold for duration differences in connected speech (~20 ms JND), validating the model for synthesis use.
