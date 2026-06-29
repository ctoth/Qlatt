# Citations

## Reference List

Fant, G. (1983), "The Voice Source: Acoustic Modeling", Speech Transmission Laboratory, QPSR 4/1982, Royal Institute of Technology, Stockholm, Sweden, 28-48.

Johnson, K. & Teheranizadeh, H. (1992), "Facilities for speech perception research at the UCLA phonetics lab", UCLA Working Papers in Phonetics, ??, ??-??.

Klatt (1980) "Software for a Cascade/Parallel Formant Synthesizer", J. Acoust. Soc. Am. 67, 971-995.

Rothenberg, A. (1971), "Effect of Glottal Pulse Shape on the Quality of Natural Vowels", J. Acoust. Soc. Am., 53, 1632-1645. [NOTE: almost certainly a typo in the manual for Rosenberg, A.E. (1971), the well-known glottal-pulse-shape paper; that paper is in the collection as Rosenberg_1971_EffectGlottalPulseShape.]

## Key Citations for Follow-up

- **Klatt (1980), "Software for a Cascade/Parallel Formant Synthesizer", JASA 67, 971-995** — The base synthesizer that KLSYN88 extends. Essential for the full block diagram, resonator/filter coefficient formulas, and the original parameter semantics (the manual explicitly defers many DSP details to it). Already in collection (`Klatt_1980_CascadeParallelFormantSynthesizer`).
- **Fant (1983), "The Voice Source: Acoustic Modeling", STL-QPSR 4/1982, 28-48** — Basis for the natural glottal pulse shape `Ug(t)=a·t²−b·t³`. Needed to reconstruct the `a`,`b` coefficients and source-spectrum behavior.
- **Rosenberg (1971), "Effect of Glottal Pulse Shape on the Quality of Natural Vowels"** (cited in the manual under the misspelling "Rothenberg") — Other cited basis for the natural pulse shape; perceptual justification for the asymmetric (fast-closing) waveform. In collection as `Rosenberg_1971_EffectGlottalPulseShape`.
- **Johnson & Teheranizadeh (1992), "Facilities for speech perception research at the UCLA phonetics lab", UCLA Working Papers in Phonetics** — Describes the online listening-test environment built around this synthesizer (relevant to MAKETAPE-style perception experiments).
