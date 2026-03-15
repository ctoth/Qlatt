# Umeda 1975 — Vowel Duration in American English

## Abstract

This is a summary report of the vowel duration data that have been accumulated over the past several years. The data corpus analyzed to derive temporal controls of vowels consists mainly of three different readings by three different speakers, each about 10 to 20 min in duration. The rules cover the temporal behavior of vowels under many phonological conditions. The conditions include stressed and unstressed positions, prepausal and nonprepausal positions, word-final and non-word-final conditions, and monosyllabic and polysyllabic words. The influence of following consonants is discussed as well. Included also are conditions other than phonological ones, such as the effect of the prominence of words on their vowels, and the speed of reading. The duration rules derived from the data are intended for use in our speech synthesis-by-rule system from printed text.

Subject Classification: 70.20, 70.70.

## Interpretation

This paper provides the empirical foundation for a vowel duration model suitable for TTS synthesis. The key contribution is the multiplicative three-parameter rule T = T_0 + S(K_1 + K_2 * C), which captures the interaction between inherent vowel length, stress/position, and following consonant class. The data tables (I, II, III) give directly usable constants for implementation. The paper confirms the well-known voicing effect on preceding vowel duration but quantifies it as a continuous scale rather than a binary distinction, and shows that the consonant ordering differs slightly by vowel identity. The word prominence effect (content vs function word, word frequency) represents an additional factor beyond the phonological rule that would need to be addressed for high-quality synthesis.
