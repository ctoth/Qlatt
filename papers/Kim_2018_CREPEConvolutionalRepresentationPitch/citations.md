# Citations

## Reference List

[1] Rachel M Bittner, Justin Salamon, Mike Tierney, Matthias Mauch, Chris Cannam, and Juan Pablo Bello, "Medleydb: A multitrack dataset for annotation-intensive mir research.," in *Proceedings of the 15th ISMIR Conference*, 2014, vol. 14, pp. 155-160.

[2] Juan Bosch and Emilia Gómez, "Melody extraction in symphonic classical music: a comparative study of mutual agreement between humans and algorithms," in *Proceedings of the 9th Conference on Interdisciplinary Musicology (CIM14)*, 2014.

[3] Matthias Mauch, Chris Cannam, Rachel Bittner, George Fazekas, Justin Salamon, Jiajie Dai, Juan Bello, and Simon Dixon, "Computer-aided melody note transcription using the tony software: Accuracy and efficiency," in *Proceedings of the First International Conference on Technologies for Music Notation and Representation*, 2015.

[4] Maria Luisa Zubizarreta, *Prosody, focus, and word order*, MIT Press, 1998.

[5] William M Hartmann, *Signals, Sound, and Sensation*, Springer, 1997.

[6] A Michael Noll, "Cepstrum pitch determination," *The journal of the acoustical society of America*, vol. 41, no. 2, pp. 293-309, 1967.

[7] John Dubnowski, Ronald Schafer, and Lawrence Rabiner, "Real-time digital hardware pitch detector," *IEEE Transactions on Acoustics, Speech, and Signal Processing*, vol. 24, no. 1, pp. 2-8, 1976.

[8] Myron Ross, Harry Shaffer, Andrew Cohen, Richard Freudberg, and Harold Manley, "Average magnitude difference function pitch extractor," *IEEE Transactions on Acoustics, Speech, and Signal Processing*, vol. 22, no. 5, pp. 353-362, 1974.

[9] David Talkin, "A robust algorithm for pitch tracking (rapt)," *Speech Coding and Synthesis*, 1995.

[10] Paul Boersma, "Accurate short-term analysis of the fundamental frequency and the harmonics-to-noise ratio of a sampled sound," in *Proceedings of Institute of Phonetic Sciences*, 1993, vol. 17, pp. 97-110.

[11] Alain De Cheveigné and Hideki Kawahara, "Yin, a fundamental frequency estimator for speech and music," *The Journal of the Acoustical Society of America*, vol. 111, no. 4, pp. 1917-1930, 2002.

[12] Arturo Camacho and John G Harris, "A sawtooth waveform inspired pitch estimator for speech and music," *The Journal of the Acoustical Society of America*, vol. 124, no. 3, pp. 1638-1652, 2008.

[13] Matthias Mauch and Simon Dixon, "pYIN: A fundamental frequency estimator using probabilistic threshold distributions," in *Acoustics, Speech and Signal Processing (ICASSP), 2014 IEEE International Conference on*. IEEE, 2014, pp. 659-663.

[14] Adrian von dem Knesebeck and Udo Zölzer, "Comparison of pitch trackers for real-time guitar effects," in *Proceedings of the International Conference on Digital Audio Effects (DAFx)*, 2010.

[15] Onur Babacan, Thomas Drugman, Nicolas d'Alessandro, Nathalie Henrich, and Thierry Dutoit, "A comparative study of pitch extraction algorithms on a large variety of singing sounds," in *Acoustics, Speech and Signal Processing (ICASSP), 2013 IEEE International Conference on*. IEEE, 2013, pp. 7815-7819.

[16] Eric J Humphrey and Juan Pablo Bello, "Rethinking automatic chord recognition with convolutional neural networks," in *Machine Learning and Applications (ICMLA), 2012 11th International Conference on*. IEEE, 2012, vol. 2, pp. 357-362.

[17] Sebastian Böck and Markus Schedl, "Enhanced beat tracking with context-aware neural networks," in *Proceedings of the International Conference on Digital Audio Effects (DAFx)*, 2011.

[18] Justin Salamon, Rachel M Bittner, Jordi Bonada, Juan José Bosch Vicente, Emilia Gómez Gutiérrez, and Juan P Bello, "An analysis/synthesis framework for automatic f0 annotation of multitrack datasets," in *Proceedings of the 18th ISMIR Conference*, 2017.

[19] Rachel M Bittner, Brian McFee, Justin Salamon, Peter Li, and Juan Pablo Bello, "Deep salience representations for f0 tracking in polyphonic music," in *Proceedings of the 18th ISMIR Conference*, 2017.

[20] Diederik Kingma and Jimmy Ba, "Adam: A method for stochastic optimization," in *Proceedings of the International Conference on Learning Representations (ICLR)*, 2015.

[21] Sergey Ioffe and Christian Szegedy, "Batch normalization: Accelerating deep network training by reducing internal covariate shift," in *International Conference on Machine Learning*, 2015, pp. 448-456.

[22] Nitish Srivastava, Geoffrey E Hinton, Alex Krizhevsky, Ilya Sutskever, and Ruslan Salakhutdinov, "Dropout: a simple way to prevent neural networks from overfitting.," *Journal of Machine Learning Research*, vol. 15, no. 1, pp. 1929-1958, 2014.

[23] François Chollet, "Keras: The python deep learning library," URL: https://keras.io/.

[24] Masataka Goto, Hiroki Hashiguchi, Takuichi Nishimura, and Ryuichi Oka, "Rwc music database: Popular, classical and jazz music databases.," in *Proceedings of the 3rd ISMIR Conference*, 2002, vol. 2, pp. 287-288.

[25] Bob L Sturm, "Classification accuracy is not enough," *Journal of Intelligent Information Systems*, vol. 41, no. 3, pp. 371-406, 2013.

[26] Justin Salamon, Emilia Gómez, Daniel PW Ellis, and Gaël Richard, "Melody extraction from polyphonic music signals: Approaches, applications, and challenges," *IEEE Signal Processing Magazine*, vol. 31, no. 2, pp. 118-134, 2014.

[27] Colin Raffel, Brian McFee, Eric J Humphrey, Justin Salamon, Oriol Nieto, Dawen Liang, Daniel PW Ellis, and C Colin Raffel, "mir_eval: A transparent implementation of common mir metrics," in *Proceedings of the 15th ISMIR Conference*, 2014.

[28] Matthias Mauch and Sebastian Ewert, "The audio degradation toolbox and its application to robustness evaluation," in *Proceedings of the 14th ISMIR Conference*, Curitiba, Brazil, 2013, accepted.

[29] Brian McFee, Eric J. Humphrey, and Juan Pablo Bello, "A software framework for musical data augmentation," in *16th International Society for Music Information Retrieval Conference*, 2015, ISMIR.

[30] Jesse Engel, Cinjon Resnick, Adam Roberts, Sander Dieleman, Douglas Eck, Karen Simonyan, and Mohammad Norouzi, "Neural audio synthesis of musical notes with wavenet autoencoders," *arXiv preprint arXiv:1704.01279*, 2017.

## Key Citations for Follow-up

- **[13] Mauch & Dixon, pYIN (ICASSP 2014)** — the primary baseline and prior state of the art. Its HMM-based temporal smoothing is exactly the component CREPE omits, and CREPE's own future work proposes recovering it via a recurrent layer. Essential for any pitch-tracking comparison in a speech-analysis pipeline.
- **[11] de Cheveigné & Kawahara, YIN (JASA 2002)** — the autocorrelation-difference algorithm underneath pYIN, and the stated reason pYIN resists brown noise. Still the standard reference implementation in speech toolkits.
- **[18] Salamon et al., analysis/synthesis f0 annotation framework (ISMIR 2017)** — the method used to build MDB-stem-synth, producing audio with perfect f0 annotation while preserving original timbre and dynamics. Directly relevant to a source-filter analysis/resynthesis project.
- **[19] Bittner et al., deep salience representations for f0 tracking (ISMIR 2017)** — the source of the Gaussian-blurred frequency-bin target used in CREPE's Equation 3, and the closest architectural predecessor.
- **[12] Camacho & Harris, SWIPE (JASA 2008)** — the second baseline, explicitly designed for speech as well as music, so the more relevant comparison point for a speech synthesizer.
- **[10] Boersma, PRAAT f0 and HNR analysis (IFA 1993)** — the default pitch analysis in phonetics; the practical incumbent CREPE would replace in a speech-analysis workflow.
