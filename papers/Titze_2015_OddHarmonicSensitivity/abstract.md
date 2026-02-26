# Abstract

## Original Text (Verbatim)

It is well known that a half-sinusoid has no odd harmonics other than the fundamental. If glottal flow in phonation were to approximate this exact waveshape, which is generally unlikely, some misperception of pitch and loss of vowel intelligibility would occur. The sensitivity of the glottal waveshape to this special shape is explored by systematically varying two parameters, open quotient and skewing quotient. Mild asymmetry (open quotient below 0.45 or above 0.55 and/or skewing quotient greater than 2.0) equalizes the odd-even harmonic series. Singers and speakers avoid the exact symmetry by skewing the flow pulse with source-filter interaction.

---

## Our Interpretation

The paper addresses a subtle but important edge case in glottal source modeling: if the airflow pulse is too symmetric, odd harmonics (3rd, 5th, 7th...) vanish completely, which would cause pitch doubling and degrade vowel perception since formants at odd-harmonic frequencies would lack excitation. The practical takeaway is that any glottal source model used in synthesis should ensure its open quotient avoids the 0.45-0.55 range or apply sufficient skewing (Qs >= 2.0) to maintain a balanced harmonic spectrum. Natural speakers accomplish this automatically through source-filter interaction, but synthesizers must enforce it parametrically.
