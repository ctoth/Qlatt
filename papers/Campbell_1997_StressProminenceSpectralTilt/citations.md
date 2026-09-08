# Citations

## Reference List

Transcribed verbatim from the printed reference list on p.70 (`pngs/page-003.png`).

[1] D. Bolinger "A theory of pitch accent in English", Word 14, 109-149. 1958.

[2] G. E. Booij *The Phonology of Dutch*, Clarendon Press, 1995

[3] W. N. Campbell: "Synthesis Units for Natural English Speech", Transactions of the Institute of
Electronics, Information and Communication Engineers, SP 91-129, pp 55-62. 1992.

[4] D. B. Fry "Duration and intensity as physical correlates of linguistic stress", J. Acoust. Soc.
Am. 27, 765-768. 1955.

[5] D. B. Fry, "Experiments in the perception of stress", Language and Speech 1, 126-152, 1958.

[6] J. van Heuven (1987) "Stress patterns in Dutch (compound) adjectives: Acoustic measurements and
perception data", Phonetica 44, 1-12, 1987.

[7] V. Huss, "English word stress in post-nuclear position", Phonetica 35, 86-105, 1978

[8] M. Jackson, P. Ladefoged, M. K. Huffman, & N. Antonanzas-Barroso, "Measures of spectral tilt",
UCLA Working Papers in Phonetics, 61, 72-8, 1985.

[9] R. D. Patterson & B. C. J. Moore, "Auditory filters and excitation patterns as representations
of frequency resolution", In B. C. J. Moore, ed., *Frequency Selectivity in Hearing*, pp. 123-177,
1986.

[10] A. Sluijter & V. van Heuven, "Spectral balance as an acoustic correlate of linguistic stress",
J. Acoust. Soc. Am. 100, 2471-2485, 1996.

[11] A. Sluijter & V. van Heuven, & J. J. A. Pacilly, "Spectral balance as a cue in the perception
of linguistic stress", J. Acoust. Soc. Am. 101, 503-513, 1997.

### Discrepancies in the printed list

- Reference [7] is dated **1978** in the reference list but cited in the body text on p.70 as
  "Huss (1977)".
- Reference [1] is printed as "109- 149" with a stray space.
- Reference [6] carries the year twice ("(1987) ... 1987").
- References [2] and [3] have no terminal period in the original.

## Key Citations for Follow-up

- **[10] Sluijter & van Heuven (1996)** — the direct target of this paper. It is the source of the
  claim that spectral balance is an acoustic correlate of *lexical stress*, established on a Dutch
  corpus that contrasted minimally different words in focal and non-focal position. Campbell and
  Beckman replicate its accent effect but not its stress effect. Read first; it defines the
  measurement approach being extended.
- **[9] Patterson & Moore (1986)** — supplies the 128-channel ERB filterbank that produces the paper's
  key result. Needed to convert the "ERB channel 60 and above" threshold into an actual frequency in
  Hz, which this paper never does and which a synthesizer implementation requires.
- **[8] Jackson, Ladefoged, Huffman & Antonanzas-Barroso (1985)** — the definitional reference for
  H2-H1 and other spectral tilt measures. Relevant because this paper reports H2-H1 failing as a
  prominence correlate, so the alternatives catalogued there are the candidates for a replacement
  control parameter.
- **[11] Sluijter, van Heuven & Pacilly (1997)** — the perception counterpart to [10]. Listed in the
  references but never cited in the body. It would settle whether the spectral-balance cue is
  perceptually used, which matters more for synthesis than whether it is produced.
- **[1] Bolinger (1958)** — the theoretical position the results endorse: stress in English is
  nothing more than a structural marking of a syllable's potential to bear pitch accent. This is the
  argument for keeping stress and accent as separate features in a synthesizer's front end.
