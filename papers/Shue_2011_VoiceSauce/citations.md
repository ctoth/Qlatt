# Citations

## Reference List

[1] Boersma, P., Weenink, D. 2008. Praat: doing phonetics by computer (Version 5.0.13). http://www.praat.org/

[2] Esposito, C.M. 2010. Variation in contrastive phonation in Santa Ana Del Valle Zapotec. *JIPA* 40, 181-198.

[3] Gerratt, B.R., Kreiman, J. 2001. Toward a taxonomy of nonmodal phonation. *J. Phon.* 29, 365-381.

[4] Hanson, H. 1997. Glottal characteristics of female speakers: Acoustic correlates. *J. Acoust. Soc. Am.* 101, 466-481.

[5] Harrington, J. 2010. *Phonetic Analysis of Speech Corpora*. Wiley-Blackwell.

[6] Hawks, J.W., Miller, J.D. 1995. A formant bandwidth estimation procedure for vowel synthesis. *J. Acoust. Soc. Am.* 97, 1343-1344.

[7] Hillenbrand, J., Cleveland, R., Erickson, R. 1994. Acoustic correlates of breathy vocal quality. *J. Sp. Hear. Res.* 37, 769-778.

[8] Iseli, M., Shue, Y.L., Alwan, A. 2007. Age, sex, and vowel dependencies of acoustic measures related to the voice source. *J. Acoust. Soc. Am.* 121, 2283-2295.

[9] Kawahara, H., Masuda-Katsuse, I., de Cheveigne, A. 1999. Restructuring speech representations using a pitch-adaptive time-frequency smoothing and an instantaneous-frequency based F0 extraction. *Sp. Comm.* 27, 187-207.

[10] de Krom, G. 1993. A cepstrum-based technique for determining a harmonic-to-noise ratio in speech signals. *J. Sp. Hear. Res.* 36, 254-266.

[11] Lee, C. 2009. Identifying isolated, multispeaker Mandarin tones form brief acoustic input: A perceptual and acoustic study. *J. Acoust. Soc. Am.* 125, 1125-1137.

[12] Remijsen, B. Bert Remijsen's Praat scripts. http://www.ling.ed.ac.uk/~bert/praatscripts.html

[13] Sjölander, K. 2004. Snack sound toolkit. KTH Stockholm, Sweden. http://www.speech.kth.se/snack

[14] Sun, X. 2002. Pitch determination algorithm. http://www.mathworks.com/matlabcentral/fileexchange/1230

[15] Sun, X. 2002. Pitch determination and voice quality analysis using subharmonic-to-harmonic ratio. *Proc. ICASSP '02*, 333-336.

[16] Vicenik, C. 2010. An acoustic study of Georgian stop consonants. *JIPA* 40, 59-92.

[17] VoiceSauce download site: http://www.ee.ucla.edu/~spapl/voicesauce/

## Key Citations for Follow-up

- **[8] Iseli, Shue & Alwan 2007, JASA 121, 2283-2295.** Highest priority. This is the source of the formant/bandwidth correction algorithm that turns H1, H2, A1-A3 into H1*, H2*, A1*-A3*. VoiceSauce implements it but does not print the equations, so the corrected measures cannot be implemented from this paper alone.

- **[6] Hawks & Miller 1995, JASA 97, 1343-1344.** The formula that estimates formant bandwidths from formant frequencies. VoiceSauce uses it because measured LPC bandwidths are unreliable. Doubly relevant to a synthesizer project, which needs the same frequency-to-bandwidth mapping in the forward synthesis direction.

- **[4] Hanson 1997, JASA 101, 466-481.** The original formulation of H1*-H2* and H1*-A3* as glottal-source correlates, and the interpretive framework for what those measures mean about the voice source.

- **[7] Hillenbrand, Cleveland & Erickson 1994, JSHR 37, 769-778.** The CPP algorithm, given here only as a prose sketch (Hamming window, real cepstrum, maximum search around the pitch quefrency, normalization to a regression line).

- **[10] de Krom 1993, JSHR 36, 254-266.** The cepstral liftering method behind the three band-limited HNR measures, again described here only in prose.

- **[15] Sun 2002, ICASSP '02, 333-336.** Subharmonic-to-harmonic ratio, the measure for period doubling and alternating pulse cycles. Relevant if the synthesizer models diplophonic or creaky phonation.
