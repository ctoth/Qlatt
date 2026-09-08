# Citations

## Reference List

1. J. Allen, S. Hunnicut, and D. Klatt. *From Text to Speech: the MITalk System*. Cambridge University Press, 1987.

2. A. W. Black and P. Taylor. The Festival Speech Synthesis System: system documentation. Technical Report HCRC/TR-83, Human Communication Research Centre, University of Edinburgh, Scotland, UK, 1997. Available at http://www.cstr.ed.ac.uk/projects/festival.html.

3. Alan W. Black and Paul A. Taylor. CHATR: A generic speech synthesis system. In *COLING '94, Kyoto, Japan*, 1994.

4. Louis Boves. Considerations in the design of a multi-lingual text-to-speech system. *Journal of Phonetics*, 19(1):309-327, 1991.

5. W. N. Campbell, S. D. Isard, A. I. C. Monaghan, and J. Verhoven. Duration, pitch and diphones in the CSTR TTS system. In *International Conference on Speech and Language Processing '90, Kobe, Japan*, 1990.

6. Susan R. Hertz. The delta programming language: an integrated approach to non-linear phonology, phonetics and speech synthesis. In John Kingston and Mary E. Beckman, editors, *Papers in Laboratory Phonology 1*. Cambridge University Press, 1990.

7. Richard Sproat and Joseph Olive. A modular architecture for multi-lingual text-to-speech. In *Second ESCA/IEEE Workshop on Speech Synthesis, New York*, 1994.

## Key Citations for Follow-up

- **[6] Hertz (1990), the delta programming language** — the canonical multi-level data structure (MLDS) system whose stream/edge-alignment model Festival is designed to replace. Read this to understand the "hole problem" and edge-alignment co-indexing that Festival's intersecting relations eliminate. Related work by the same author is already in this collection as `Hertz_1992_NucleusBasedTiming`.

- **[3] Black & Taylor (1994), CHATR: A generic speech synthesis system** — the authors' own immediately prior architecture. This paper criticizes it explicitly: CHATR achieved comparable generality and run-time flexibility, but its C constructs were so obscure that experienced C programmers could not read the code. Useful as a documented negative result on architecture ergonomics.

- **[2] Black & Taylor (1997), Festival system documentation, HCRC/TR-83** — contains the low-level implementation details this paper deliberately omits: the actual C++ classes for utterances, relations, items and features, and the module API.

- **[1] Allen, Hunnicutt & Klatt (1987), From Text to Speech: the MITalk System** — the string-rewriting archetype Festival argues against, and the direct ancestor of Klatt-style formant synthesis. Essential for a formant/source-filter project both as a synthesis reference and as the target of this paper's architectural criticism.

- **[7] Sproat & Olive (1994), A modular architecture for multi-lingual text-to-speech** — the Bell Labs MLDS architecture, the main contemporary alternative to Festival's design and the other serious modular TTS architecture of the period.
