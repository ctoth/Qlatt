# Citations

## Reference List

Allen, J. B. 1977. "Short-term Spectral Analysis, Synthesis, and Modification by the Discrete Fourier Transform." *IEEE Transactions on Acoustics, Speech, and Signal Processing* 25(3): 235-238.

Allen, J. B., and L. R. Rabiner. 1977. "A Unified Approach to Short-time Fourier Analysis and Synthesis." *Proceedings of the IEEE* 65(11): 1558-1564.

General Electric Co. 1977. "ADEC Subroutine Description." Heavy Military Electronics Dept., Syracuse, New York, Document number 13201, June 1977.

Grey, J. M. 1975. "An Exploration of Musical Timbre." Ph.D. diss., Stanford University.

Harris, F. J. 1978. "On the Use of Windows for Harmonic Analysis with the Discrete Fourier Transform." *Proceedings of the IEEE* 66(1): 51-83.

Hedelin, P. 1982. "A Representation of Speech with Partials." In D. Carlson and B. Granstrom, eds. *The Representation of Speech in the Peripheral Auditory System*. Elsevier Biomedical Press, Amsterdam, Netherlands.

McAulay, R. J., and T. F. Quatieri. 1984. "Magnitude-only Reconstruction using a Sinusoidal Speech Model." *Proceedings of the 1984 IEEE International Conference on Acoustics, Speech, and Signal Processing*.

McAulay, R. J., and T. F. Quatieri. 1986. "Speech Analysis/Synthesis based on a Sinusoidal Representation." *IEEE Transactions on Acoustics, Speech, and Signal Processing* 34(4): 744-754.

Markel, J. D., and A. H. Gray. 1976. *Linear Prediction of Speech*. New York: Springer-Verlag.

Moorer, J. A. 1973. "The Heterodyne Filter as a Tool for Analysis of Transient Waveforms." Memo AIM-208. Stanford Artificial Intelligence Laboratory, Computer Science Dept., Stanford University.

Moorer, J. A. 1977. "Signal Processing Aspects of Computer Music — A Survey." *Computer Music Journal* 1(1): 4-37.

Moorer, J. A. 1978. "The Use of the Phase Vocoder in Computer Music Applications." *Journal of the Audio Engineering Society* 26(1/2): 42-45.

Portnoff, M. R. 1976. "Implementation of the Digital Phase Vocoder Using the Fast Fourier Transform." *IEEE Transactions on Acoustics, Speech, and Signal Processing* 24(3): 243-248.

Rife, D. C., and R. R. Boorstyn. 1974. "Single-Tone Parameter Estimation from Discrete-Time Observations." *IEEE Trans. Info. Theory* 20: 591-598.

Rife, D. C., and R. R. Boorstyn. 1976. "Multiple Tone Parameter Estimation from Discrete-Time Observations." *Bell Systems Tech. Journal* I55: 1389-1410.

Serra, X. 1989. "A System for Sound Analysis/Transformation/Synthesis Based on a Deterministic plus Stochastic Decomposition." Ph.D. diss., Stanford University.

Smith, J. O., and B. Friedlander. 1984. "High Resolution Spectrum Analysis Programs." Memo 5466-05. Systems Control Technology, Palo Alto, California.

Smith, J. O., and X. Serra. 1987. "PARSHL: An Analysis/Synthesis Program for Nonharmonic Sounds based on a Sinusoidal Representation." *Proceedings of the 1987 International Computer Music Conference*. San Francisco: Computer Music Association.

Strawn, J. 1980. "Approximation and Syntactic Analysis of Amplitude and Frequency Functions for Digital Sound Synthesis." *Computer Music Journal* 4(3): 3-24.

Wolcin, J. J. 1980a. *Maximum A Posteriori Line Extraction: A Computer Program*. USC Technical Memorandum 801042, March 20.

Wolcin, J. J. 1980b. "Maximum A Posteriori Estimation of Narrowband Signal Parameters." USC Technical Memorandum 791115, June 21, 1979, *Journal of the Acoustical Society of America* 68(1): 174-178.

## Key Citations for Follow-up

- **Serra, X. 1989.** Ph.D. diss., Stanford University. The full-length treatment behind this article. Cited three times for material deliberately omitted here: the extended analysis-window discussion (p.16), the parabolic spectral interpolation detail (p.17), and a method that permits time-domain rather than magnitude-domain subtraction of the deterministic component (p.20). Anyone implementing SMS faithfully needs it.
- **Smith, J. O., and X. Serra. 1987 (PARSHL).** The direct predecessor system and the source of the peak-detection and peak-tracking machinery SMS inherits, including the peak-search frequency interval, maximum glissando slope, and minimum dB level and width constraints (p.13).
- **McAulay, R. J., and T. F. Quatieri. 1986.** The parallel sinusoidal model developed for speech. This is the speech-domain counterpart to SMS and the paper's principal comparison target (p.13); essential reading for applying harmonic-plus-noise ideas to a voice synthesizer.
- **Allen, J. B. 1977.** Supplies the short-time Fourier transform framework both PARSHL and McAulay-Quatieri were built on, plus the hop-size criterion SMS adopts, window length divided by main-lobe width in bins (pp.15, 16).
- **Strawn, J. 1980.** The source for the line-segment approximation of amplitude and frequency functions, which SMS uses both to reduce deterministic breakpoints and to fit the stochastic residual envelope (pp.19, 21).
