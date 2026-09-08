# Citations

## Reference List

[1] J. Shen, R. Pang, R. J. Weiss, M. Schuster, N. Jaitly, Z. Yang, Z. Chen, Y. Zhang, Y. Wang, R. Skerrv-Ryan, et al., "Natural TTS synthesis by conditioning WaveNet on mel spectrogram predictions," in *Proc. International Conference on Acoustics, Speech, and Signal Processing (ICASSP)*, 2018, pp. 4779-4783.

[2] S. Arik, G. Diamos, A. Gibiansky, J. Miller, K. Peng, W. Ping, J. Raiman, and Y. Zhou, "Deep voice 2: Multi-speaker neural text-to-speech," *arXiv:1705.08947*, 2017.

[3] J. Sotelo, S. Mehri, K. Kumar, J. F. Santos, K. Kastner, A. Courville, and Y. Bengio, "Char2wav: End-to-end speech synthesis," in *Proc. ICLR Workshop*, 2017.

[4] W. B. Kleijn, F. SC Lim, A. Luebs, J. Skoglund, F. Stimberg, Q. Wang, and T. C. Walters, "WaveNet based low rate speech coding," in *Proc. International Conference on Acoustics, Speech, and Signal Processing (ICASSP)*, 2018, pp. 676-680.

[5] A. van den Oord, S. Dieleman, H. Zen, K. Simonyan, O. Vinyals, A. Graves, N. Kalchbrenner, A. Senior, and K. Kavukcuoglu, "WaveNet: A generative model for raw audio," *arXiv:1609.03499*, 2016.

[6] Z. Jin, A. Finkelstein, G. J. Mysore, and J. Lu, "FFTNet: A real-time speaker-dependent neural vocoder," in *Proc. International Conference on Acoustics, Speech, and Signal Processing (ICASSP)*, 2018, pp. 2251-2255.

[7] N. Kalchbrenner, E. Elsen, K. Simonyan, S. Noury, N. Casagrande, E. Lockhart, F. Stimberg, A. van den Oord, S. Dieleman, and K. Kavukcuoglu, "Efficient neural audio synthesis," *arXiv:1802.08435*, 2018.

[8] B. S. Atal and S. L. Hanauer, "Speech analysis and synthesis by linear prediction of the speech wave," *The journal of the acoustical society of America*, vol. 50, no. 2B, pp. 637-655, 1971.

[9] J. Markel and A. Gray, "A linear prediction vocoder simulation based upon the autocorrelation method," *IEEE Transactions on Acoustics, Speech, and Signal Processing*, vol. 22, no. 2, pp. 124-134, 1974.

[10] D. Griffin and J. Lim, "A new model-based speech analysis/synthesis system," in *Proc. International Conference on Acoustics, Speech, and Signal Processing (ICASSP)*, 1985, vol. 10, pp. 513-516.

[11] A. McCree, K. Truong, E. B. George, T. P. Barnwell, and V. Viswanathan, "A 2.4 kbit/s MELP coder candidate for the new us federal standard," in *Proc. International Conference on Acoustics, Speech, and Signal Processing (ICASSP)*, 1996, vol. 1, pp. 200-203.

[12] L. Juvela, V. Tsiaras, B. Bollepalli, M. Airaksinen, J. Yamagishi, and P. Alku, "Speaker-independent raw waveform model for glottal excitation," in *Proc. Interspeech*, 2018, pp. 2012-2016.

[13] K. Cho, B. Van Merriënboer, D. Bahdanau, and Y. Bengio, "On the properties of neural machine translation: Encoder-decoder approaches," in *Proc. Eighth Workshop on Syntax, Semantics and Structure in Statistical Translation (SSST-8)*, 2014.

[14] B.C.J. Moore, *An introduction to the psychology of hearing*, Brill, fifth edition, 2012.

[15] ITU-T, *Recommendation G.711: Pulse Code Modulation (PCM) of voice frequencies*, International Telecommunications Union, 1988.

[16] S. Mehri, K. Kumar, I. Gulrajani, R. Kumar, S. Jain, J. Sotelo, A. Courville, and Y. Bengio, "SampleRNN: An unconditional end-to-end neural audio generation model," *arXiv:1612.07837*, 2016.

[17] J. Makhoul, "Linear prediction: A tutorial review," *Proc. IEEE*, vol. 63, no. 4, pp. 561-580, 1975.

[18] B. S. Atal and J. Remde, "A new model of LPC excitation for producing natural-sounding speech at low bit rates," in *Proc. International Conference on Acoustics, Speech, and Signal Processing (ICASSP)*, 1982, vol. 7, pp. 614-617.

[19] M. Schroeder and B.S. Atal, "Code-excited linear prediction (CELP): High-quality speech at very low bit rates," in *Proc. International Conference on Acoustics, Speech, and Signal Processing (ICASSP)*, 1985, vol. 10, pp. 937-940.

[20] J.-M. Valin, "A hybrid DSP/deep learning approach to real-time full-band speech enhancement," in *Proc. Multimedia Signal Processing Workshop (MMSP)*, 2018.

[21] S. J. Reddi, S. Kale, and S. Kumar, "On the convergence of adam and beyond," in *Proc. ICLR*, 2018.

[22] ITU-R, *Recommendation BS.1534-1: Method for the subjective assessment of intermediate quality level of coding systems*, International Telecommunications Union, 2001.

## Key Citations for Follow-up

- **[17] Makhoul 1975, "Linear prediction: A tutorial review."** The authority LPCNet cites for the claim that the vocal tract response is well represented by a simple all-pole filter. This is the foundational reference for the entire filter side of any source-filter synthesizer, and the single most relevant citation here for a formant-synthesis project.
- **[7] Kalchbrenner et al. 2018, "Efficient neural audio synthesis" (WaveRNN).** The direct baseline LPCNet modifies. Supplies the block-sparse GRU technique, the 4x4 / 16x1 non-zero block choice, the coarse/fine 16-bit output split, and the "equivalent dense size" convention used in Fig. 3.
- **[18] Atal and Remde 1982** and **[19] Schroeder and Atal 1985 (CELP).** The analysis-by-synthesis lineage that LPCNet's noise-injection arrangement deliberately reproduces. Essential to understanding why the noise must be injected inside the prediction loop rather than on the signal.
- **[12] Juvela et al. 2018, "Speaker-independent raw waveform model for glottal excitation."** The open-loop glottal-excitation approach LPCNet explicitly argues against. Directly relevant to any project modeling the glottal source separately from the tract.
- **[20] Valin 2018, "A hybrid DSP/deep learning approach to real-time full-band speech enhancement" (MMSP).** Source of the 18-band Bark cepstral layout LPCNet uses as its feature set. Needed to reproduce the feature extraction exactly.
