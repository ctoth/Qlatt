# Models for Representing the Acoustic Radiation Impedance of the Mouth

**Authors:** D. A. Chalker and D. Mackerras
**Year:** 1985
**Venue:** IEEE Trans. Acoust., Speech, Signal Processing, vol. ASSP-33, no. 6, pp. 1606-1609
**Affiliation:** Department of Electrical Engineering, University of Queensland

## One-Sentence Summary

Compares five radiation impedance models for the mouth and proposes a new two-term approximation from the piston-in-baffle series that is more accurate than Fant's and Flanagan's approximations at high frequencies and large apertures.

## Problem Addressed

The radiation impedance of the mouth affects formant frequencies and bandwidths in speech production models. Existing approximations (Fant, Flanagan) use only the first term of the piston-in-baffle series, which becomes inaccurate above 3 kHz for large mouth apertures (5.0 cm^2). A more accurate yet computationally tractable approximation is needed for digital speech synthesis.

## Models Compared

### 1. Pulsating Sphere

$$Z = \frac{j\rho cka}{1 + jka}$$

where $\rho$ = air density, $c$ = speed of sound, $k = \omega/c$, $a$ = sphere radius.

- Poor representation for small openings (0.9 cm^2): resistance term considerably exceeds piston-in-sphere.
- Not physically representative of mouth.

### 2. Piston in Infinite Baffle (Morse & Ingard)

$$Z = \rho c (\theta_0 + jX_0)$$

where $\theta_0$ and $X_0$ are series expansions in $y = 2ka$, $a$ = piston radius:

$$\theta_0 = \frac{y^2}{2 \cdot 4} - \frac{y^4}{2 \cdot 4^2 \cdot 6} + \frac{y^6}{2 \cdot 4^2 \cdot 6^2 \cdot 8} - \frac{y^8}{2 \cdot 4^2 \cdot 6^2 \cdot 8^2 \cdot 10} + \cdots$$

$$X_0 = \frac{4}{\pi}\left[\frac{y}{3} - \frac{y^3}{3^2 \cdot 5} + \frac{y^5}{3^2 \cdot 5^2 \cdot 7} - \cdots\right]$$

- Polynomial in $j\omega$, directly useful in time- or frequency-domain simulation.
- Deviates no more than 2.3 acoustic ohms from piston-in-sphere for both apertures to 5 kHz.
- Confirms the common assumption that this model is a good approximation.

### 3. Piston in Spherical Baffle (Morse & Ingard) — Reference Model

$$Z = \rho c (\theta_s + jX_s)$$

Expressed in terms of Legendre functions $P_n$ and spherical Bessel functions $j_n$, $y_n$; $a_s$ = sphere radius, piston radius = $a_s \sin\phi$.

- Most physically representative of human head + mouth.
- Most computationally expensive (Legendre + Bessel functions, slow convergence of reactance).
- Reactance series requires ~50 terms for 0.1% error at 5 kHz.
- Arithmetic overflow risk: $j_{50}$ and $y_{50}$ reach ~$10^{40}$; authors used extended floating-point with separate overflow exponents.
- Used as the **ground truth** for all comparisons.
- Computed with head radius = 9 cm, air at 36 deg C.

### 4. Fant's Approximation

$$Z = \rho c \left[\frac{(ka)^2}{2} + j\frac{8ka}{K_c(\omega)}\right]$$

where $K_c(\omega) \approx \begin{cases} 3\pi & 0 \le \omega < 2\pi \cdot 1600 \\ 1.6\pi + 1 & \omega \ge 2\pi \cdot 1600 \end{cases}$

- Resistance term: never more than 2.3 ohms error (good).
- Reactance term: 13.4 ohms error at 5 kHz for 5.0 cm^2 aperture (poor at high freq + large aperture).
- Frequency-domain only (due to $K_c(\omega)$ frequency dependence).
- Equivalent to Flanagan's with $K_c(\omega) = 2$.

### 5. Flanagan's Approximation

$$Z = \rho c \left[\frac{(ka)^2}{2} + j\frac{8ka}{3\pi}\right]$$

- Uses first terms of piston-in-baffle resistance and reactance series.
- Equivalent to parallel resistor-inductor circuit.
- Resistance: 7.6 ohms error at 5 kHz for 5.0 cm^2 (worse than Fant).
- Reactance: 13.4 ohms error at 5 kHz for 5.0 cm^2 (same problem as Fant).
- Usable in both time- and frequency-domain simulation.

### 6. Proposed Approximation (Chalker & Mackerras)

Uses first **two** terms of piston-in-baffle series (3) and (4):

$$\theta_{new} = \frac{y^2}{2 \cdot 4} - \frac{y^4}{2 \cdot 4^2 \cdot 6}$$

$$X_{new} = \frac{4}{\pi}\left[\frac{y}{3} - \frac{y^3}{3^2 \cdot 5}\right]$$

where $y = 2ka$.

- For 0.9 cm^2 aperture: indistinguishable from full piston-in-baffle to 5 kHz.
- For 5.0 cm^2 aperture: reactance error max 1.22 ohms at 2.6 kHz — less than 1/10 of Fant/Flanagan error.
- Overall: errors < 1.8 acoustic ohms from piston-in-sphere for both apertures to 5 kHz.
- Usable in both time- and frequency-domain simulations.
- Modest computational increase over Flanagan (two terms vs one).

## Key Findings

| Model | Resistance error (max, 5 cm^2) | Reactance error (max, 5 cm^2) | Domain |
|-------|-------------------------------|------------------------------|--------|
| Pulsating sphere | Large (small aperture) | — | Both |
| Piston-in-baffle (full) | < 2.3 ohms | < 2.3 ohms | Both |
| Fant | < 2.3 ohms | 13.4 ohms at 5 kHz | Freq only |
| Flanagan | 7.6 ohms at 5 kHz | 13.4 ohms at 5 kHz | Both |
| **Proposed (2-term)** | **< 1.8 ohms** | **1.22 ohms at 2.6 kHz** | **Both** |

- The radiation load lowers formant frequencies and increases bandwidths; effect grows with frequency.
- Conversion from specific acoustic impedance to standard acoustic impedance (transmission line analog): divide by aperture area in cm^2.
- Comparisons computed for air at 36 deg C, frequencies 0-5 kHz.

## Relevance to Qlatt Project

**Directly relevant.** The Qlatt synthesizer models radiation impedance as part of the vocal tract output. The Flanagan approximation is the one most commonly used in Klatt-type synthesizers (simple RL circuit). This paper shows that Flanagan's reactance term becomes significantly inaccurate above 3 kHz for open vowels like /a/ (5.0 cm^2 aperture).

The proposed two-term approximation would improve spectral accuracy of higher formants (F3-F5) for open vowels at minimal computational cost. Since Qlatt operates at audio sample rates in WebAudio, the two additional polynomial terms are negligible overhead.

**Implementation consideration:** If Qlatt currently uses a first-order radiation approximation (single zero at DC, equivalent to Flanagan), upgrading to the two-term model would improve high-frequency formant bandwidth accuracy, particularly for /a/-like vowels.

## Parameters

- Air density $\rho$ at 36 deg C
- Speed of sound $c$ at 36 deg C
- Mouth aperture area: 0.9 cm^2 (/i/, small), 5.0 cm^2 (/a/, large)
- Head radius: 9 cm (for piston-in-sphere model)
- Frequency range: 0-5 kHz

## References Cited

1. Rabiner & Schafer 1978, *Digital Processing of Speech Signals*
2. Morse & Ingard 1968, *Theoretical Acoustics*
3. Fant 1970, *Acoustic Theory of Speech Production*
4. Wakita & Fant 1978, vocal tract model improvements
5. Flanagan 1972, *Speech Analysis, Synthesis and Perception*
6. Jahnke & Emde 1947, *Tables of Functions*

## Testable Properties

- [ ] Compare Qlatt's current radiation model output against the two-term approximation proposed here
- [ ] Measure formant bandwidth differences between Flanagan and two-term models for /a/ above 3 kHz
- [ ] Verify that piston-in-baffle two-term agrees with full series to < 0.1 ohm for 0.9 cm^2 aperture

## Open Questions

- [ ] What radiation model does Qlatt currently use? (Likely Flanagan-equivalent first-order)
- [ ] Is the high-frequency reactance error audible for the formant range Qlatt targets?
- [ ] Would a second-order radiation filter improve perceived naturalness for open vowels?
