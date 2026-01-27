# Abstract

## Original Text (Verbatim)

This study evaluates an automated formant estimation procedure designed to adapt to speakers and variations in speech. The adaption is achieved by using the formant ceiling with the least variation (in combined estimates of F1 and F2) as the optimal ceiling. This optimization renders the best possible estimations given the data, therefore it could presumably also adapt to variations such as high fo. The procedure has not been evaluated by using material with known formant frequencies. Therefore, this is done here. The performance of the procedure is tested through comparison with a common procedure with fixed ceilings, based on speaker sex. The estimations are carried out on synthetic vowel tokens, systematically varied in formant frequencies and in fo, to match the natural variation within vowels and between speakers. The formant estimations are compared to target values, compared between procedures and to earlier studies. The results reveal that the formant estimation procedure with optimized ceilings does not perform better than the common procedure. Both procedures perform better than earlier methods, but neither deals satisfactorily with high fo.

---

## Our Interpretation

This thesis evaluates whether dynamically optimizing formant ceiling frequencies (based on variance minimization within each speaker's vowel tokens) improves formant estimation accuracy compared to fixed sex-based ceilings. Using synthetic vowels systematically varied in formant frequencies and fundamental frequency, Ericsson found that the optimized ceiling procedure surprisingly underperformed relative to standard generic ceilings, particularly at high fundamental frequencies. The key contribution is demonstrating that automated ceiling optimization does not solve the persistent challenge of estimating formants accurately when fundamental frequency is high—a critical problem for synthesizing infant-directed speech, singing, and raised voice where fundamental frequency exceeds the first formant frequency.
