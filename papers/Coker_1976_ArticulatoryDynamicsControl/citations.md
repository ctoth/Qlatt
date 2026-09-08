# Citations

## Reference List

[1] C. H. Coker and O. Fujimura, "A model for specification of vocal tract area function," *J. Acoust. Soc. Amer.*, vol. 40, 1271 (A), 1966.

[2] J. Mathews and R. C. Walker, *Mathematical Methods of Physics*. New York: Benjamin, 1965.

[3] R. Courant and D. Hilbert, *Methods of Mathematical Physics*. New York: Wiley, 1965.

[4] H. Goldstein, *Classical Mechanics*. Reading, MA: Addison-Wesley, 1950.

[5] S. E. G. Öhman, "Numerical models of coarticulation," *J. Acoust. Soc. Amer.*, vol. 41, pp. 310-320, 1966.

[6] W. L. Henke, "Preliminaries to speech synthesis based upon an articulatory model," in *Proc. IEEE Conf. Speech Commun. Processing*, pp. 170-182, 1967.

[7] J. S. Perkell, "A physiologically-oriented model of tongue activity in speech production," Doctoral dissertation, Massachusetts Inst. Technol., Cambridge, 1974.

[8] R. A. Houde, "A study of tongue body motion during selected speech sounds," Doctoral dissertation, Univ. Michigan, Ann Arbor, 1967.

[9] E. A. Guillemin, *Theory of Linear Physical Systems*. New York: Wiley, pp. 159-216, 1963.

[10] C. G. M. Fant, *Acoustic Theory of Speech Production*, s-Gravenhage, The Netherlands: Mouton and Co., 1960.

[11] N. Chomsky and M. Halle, *The Sound Pattern of English*. New York: Harper & Row, 1968.

[12] G. Fant, "Distinctive features and phonetic dimensions," in *Applications of Linguistics* (selected Papers of the 2nd Int. Congr. Appl. Linguistics, Cambridge, England, 1969). Cambridge, England: Cambridge Univ. Press, 1971.

[13] N. Umeda, "Linguistic rules for text-to-speech synthesis," this issue, pp. 443-451.

[14] N. Umeda and C. H. Coker, "Allophonic variation in American English," *J. Phonetics*, vol. 2-5, pp. 1-5, 1974.

[15] C. H. Coker and N. Umeda, "The importance of spectral detail in initial-final contrasts of voiced stops," *J. Phonetics*, vol. 3-1, pp. 63-68, 1975.

[16] J. L. Flanagan, K. Ishizaka, and K. Shipley, "Synthesis of speech from a dynamic model of the vocal cords and vocal tracts," *Bell Syst. Tech. J.*, vol. 54, pp. 485-506, Mar. 1975.

[17] L. R. Rabiner, L. B. Jackson, R. W. Schafer, and C. H. Coker, "A hardware realization of a digital formant synthesizer," *IEEE Trans. Commun. Technol.*, vol. COM-19, pp. 1016-1020, Nov. 1971.

[18] M. M. Sondhi, "Model for wave propagation in a lossy vocal tract," *J. Acoust. Soc. Amer.*, vol. 55, pp. 1070-1075, 1974.

[19] H. K. Dunn, "Methods of measuring vowel formant bandwidths," *J. Acoust. Soc. Amer.*, vol. 33, pp. 1737-1746, 1961.

[20] C. H. Coker, "Speech synthesis with a parametric articulatory model," presented at a Talk at Kyoto Speech Symposium, 1968.

[21] C. H. Coker, N. Umeda, and C. P. Browman, "Automatic synthesis from ordinary English text," *IEEE Trans. Audio Electroacoust.*, vol. AU-21, pp. 293-298, Feb. 1973.

## Key Citations for Follow-up

- **[8] Houde 1967** — The empirical foundation for the entire dynamics section: the linearity evidence, the two tongue-body speeds (~150 ms and ~80 ms), and the /g/ X-ray trajectories that the priority mechanism is tuned against. Anything that wants to reuse Coker's timing numbers should check them here.
- **[13] Umeda 1976** — The companion paper in the same issue supplying the duration and phonological rules that feed this model. The numeric priority and duration tables absent from Coker's paper most likely live here.
- **[14] Umeda & Coker 1974** — Direct source of the position-dependent /t/ devoicing times (60-70 ms initial, ~40 ms medial, 0-20 ms final), which transfer straight into a formant synthesizer's voicing-onset rules.
- **[21] Coker, Umeda & Browman 1973** — The full text-to-speech system this model plugs into. Already present in this collection as `Coker_1973_AutomaticSynthesisOrdinaryEnglish`.
- **[19] Dunn 1961** — The formant bandwidth measurements used by table lookup and interpolation; still the standard source for natural-speech bandwidth targets in formant synthesis.
