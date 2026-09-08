---
title: "Vocal Tract Wall Effects, Losses, and Resonance Bandwidths"
authors: "Gunnar Fant"
year: 1972
venue: "STL-QPSR 13(2-3), Speech Transmission Laboratory, KTH Royal Institute of Technology, Stockholm"
pages: "28-52"
doi_url: "https://www.speech.kth.se/prod/publications/files/qpsr/1972/1972_13_2-3_028-052.pdf"
---

# Vocal Tract Wall Effects, Losses, and Resonance Bandwidths

## One-Sentence Summary
Fant derives, from first principles and from measured data, the complete set of closed-form formulas for vocal tract formant bandwidths — radiation loss, viscous friction, heat conduction, and cavity-wall (soft-wall) dissipation — plus the wall-mass shift of formant frequencies, and packages them as simplified engineering expressions suitable for direct use in a formant synthesizer.

## Problem Addressed
Idealized hard-wall vocal tract models mispredict both formant frequencies (especially F1, which is raised by the wall mass shunt) and formant bandwidths (which are dominated at low frequency by wall losses and at high frequency by friction/heat-conduction and radiation). The paper supplies the quantitative loss model that closes this gap. *(p.28)*

## Abstract (verbatim)
"The finite impedance of the vocal tract cavity walls accounts for a shift in formant frequencies and additional losses compared to the idealized hard wall conditions. These effects are treated by: 1) low frequency approximation, 2) single tube tract and lumped element representation of the wall shunt, 3) generalized distributed element treatment of mass loading and losses. The superposition of sound radiated from the walls and from the mouth is calculated for case 2) above. Data on resonance bandwidths are reviewed and simplified formulas are derived for estimating formant bandwidth contributions from: a) radiation, b) classical friction and heat conduction losses, c) dissipation within the cavity walls. The relative importance of these factors in various classes of vocal tract configurations and with respect to different resonances is discussed. Formulas have also been derived for predicting resonance bandwidths from the set of resonance frequencies." *(p.28)*

---

## Section 1. Introduction. The closed tract resonance and divers' speech *(pp.28-30)*

Wall impedance effect on vocal resonance tuning was first discussed by van den Berg (1953, 1955B). With mouth and glottis shut, the **closed tract resonance is of the order of 150-200 Hz**, typical of F1 for voiced stops. It is set by the lumped inductance of the cavity walls against the capacitance of the enclosed air volume. *(p.28)*

With a finite mouth opening, the low frequency equivalent network has the wall inductance in **parallel** with the mouth opening inductance, so F1 becomes:

$$
F_1 = \left(F_{1i}^2 + F_W^2\right)^{1/2}
$$
Where: $F_{1i}$ = calculated F1 **without** the wall mass shunt (hard-wall value); $F_W$ = closed tract (wall) resonance frequency, Hz. *(p.28, Eq. 1)*

Worked value: with $F_W = 150$ Hz and $F_{1i} = 300$ Hz, $F_1 = 335$ Hz (Fant, 1960). *(p.28)*

Measuring $F_W$ from spectrograms of voiced occlusions is inaccurate. A direct method is the vocal tract sine wave response of Fujimura and Lindqvist (1971), which supplies extensive closed-glottis resonance and bandwidth data. Their /b/ samples in the context of [ʉ] and [u] gave **frequencies of 189 and 204 Hz with bandwidths of 73 and 62 Hz respectively**. *(pp.28-29)*

### Analytical expression of the closed tract resonance

$$
F_W = \frac{1}{2\pi}\left(C_T L_W\right)^{-1/2}
$$
*(p.29, Eq. 2)*

$$
C_T = \frac{V}{\rho c^2}
$$
Where: $C_T$ = acoustic capacitance of the enclosed air; $V$ = vocal tract volume; $\rho$ = density of air; $c$ = velocity of sound in the gas. *(p.29, Eq. 3)*

$$
L_W = \frac{\rho_w d}{S \ell}
$$
Where: $L_W$ = lumped wall inductance; $\rho_w$ = density of walls; $d$ = wall thickness; $S$ = perimeter of walls, averaged over the tract; $\ell$ = vocal tract length. *(p.29, Eq. 4)*

Combining:

$$
F_W = \frac{1}{2\pi}\, c\, \rho^{1/2} \left(\frac{S \ell}{V d \rho_w}\right)^{1/2}
$$
*(p.29, Eq. 5)*

### Hyperbaric / diving gas scaling

In compressed air $c$ is almost independent of pressure while $\rho$ is proportional to atmospheric pressure $P$. With $F_{W0}$ the tract resonance at normal pressure:

$$
F_W = F_{W0} \, P^{1/2}
$$
Where: $P$ = ambient pressure in atmospheres (ata). *(p.29, Eq. 6)*

For an ideal gas:

$$
c = \left(\frac{\gamma P}{\rho}\right)^{1/2}
$$
Where: $\gamma$ = ratio of specific heats at constant pressure and volume. *(p.30, Eq. 7)*

Combining Eq. (5) and Eq. (7):

$$
F_W = F_{W0}\left(\frac{\gamma}{\gamma_0} P\right)^{1/2}
$$
*(p.30, Eq. 8)*

Key consequences *(p.30)*:
- At high helium concentrations the factor $(\gamma/\gamma_0)^{1/2}$ is close to **1.1**.
- $F_W$ is **almost independent of gas mixture** and varies with $P$ only, whereas other vocal tract resonances are transposed by $c/c_0$, of order **2-3** in common helium-oxygen deep-sea diving mixtures.
- From Fant and Sonesson (1964): $F_W$ = 150-180 Hz. From Fant and Lindqvist (1968): $F_W$ = 180-200 Hz.
- **Conclusion: the male closed tract resonance is of the order of 150-200 Hz, with associated bandwidth of the order of 75-100 Hz** (Fant and Sonesson 1964; Fujimura and Lindqvist 1971).
- Divers at 1200 feet = 40 atmospheres raise $F_W$ by $(40)^{1/3} = 6.3$ [as printed]. Assuming $F_W$ = 175 Hz gives $F_W$ = 1100 Hz at depth; since $F_{1i} < F_W$, all vowels attain approximately the same F1 as the voiced stop voice bar. Electronic "unscramblers" are therefore much limited; complete phoneme recognition and re-synthesis would be needed. Even at 180 feet the F1 contrast among voiced stops, voiced fricatives, glides and low-F1 vowels is lost and speech sounds nasal from the average F1 increase at fairly constant F2.

---

## Section 2. Lumped element representation. Superposition effects *(pp.31-35)*

Fig. I-C-1a is a valid approximation for the F1 range of vowels produced with a narrowing in the mouth (narrow front vowels). $L_M$ = inductance of the mouth opening with end correction included; $L_W$ = lumped mass load of the walls. An additional large capacitance in series with $L_W$ representing vocal wall elasticity could be added for the sub-audio range. Mouth opening resistance $R_M$ and wall resistance $R_W$ are treated as small compared with $\omega L_M$ and $\omega L_W$. *(p.31)*

Solving for the poles $\sigma_1 \pm j\omega_1$ of the transfer of volume velocity from glottis to mouth opening $I_0/I_g$:

$$
F_1 = \frac{\omega_1}{2\pi} = \frac{1}{2\pi}\left(\frac{1}{C_T}\cdot\frac{L_M + L_W}{L_M L_W}\right)^{1/2}
$$
*(p.31, Eq. 9, first line)*

$$
B_1 = \frac{-\sigma_1}{\pi} = \frac{1}{2\pi}\left(\frac{R_M}{L_M}\cdot\frac{L_W}{L_W + L_M} + \frac{R_W}{L_W}\cdot\frac{L_M}{L_M + L_W}\right)
$$
*(p.31, Eq. 9, second line)*

Denoting:

$$
F_W = \frac{1}{2\pi}\left(C_T L_W\right)^{-1/2}, \qquad F_i = \frac{1}{2\pi}\left(C_T L_M\right)^{-1/2}
$$
*(p.31, Eq. 10)*

we recover Eq. (1):

$$
F_1^2 = F_W^2 + F_i^2
$$
*(p.31, Eq. 11)*

Bandwidth of the closed tract resonance:

$$
B_W = \frac{1}{2\pi}\cdot\frac{R_W}{L_W}
$$
*(p.31, Eq. 12)*

Bandwidth due to mouth opening resistance, neglecting the $R_W L_W$ branch:

$$
B_M = \frac{1}{2\pi}\cdot\frac{R_M}{L_M}
$$
*(p.31, Eq. 13; printed as 1/29 which is a typographic corruption of 1/2π)*

Accordingly the total:

$$
B = B_W\left(\frac{F_W}{F_1}\right)^2 + B_M\left(\frac{F_i}{F_1}\right)^2
$$
*(p.31, Eq. 14)* — **this is the key superposition rule: each loss mechanism's bandwidth is weighted by the squared ratio of its own characteristic frequency to the actual formant frequency.**

Shunting $C_T$ with a conductance $G = 1/R_T$ increases the bandwidth by:

$$
B_G = \frac{1}{2\pi R_T C_T}
$$
*(p.32, Eq. 15)*

Radiation resistance (a small part of $R_M$):

$$
R_0 = \frac{\rho \omega^2}{4\pi c}\cdot K_S(\omega)
$$
Where: $K_S(\omega)$ is a baffle factor attaining the limiting value **1 for zero frequency and 2 for an infinite baffle**; **$K_S(\omega) = 1.4$ is a representative mean for speaking conditions** (Fant, 1960). *(p.32, Eq. 16)*

Except for changes in $K_S(\omega)$, the radiation resistance is **independent of the area of the radiating surface**. This also holds for radiation from the walls of the vocal tract, so at low frequencies the radiation resistance component of $R_W$ is equal to $R_0$. *(p.32)*

### Superposition of mouth-radiated and wall-radiated sound

$$
P = \frac{\rho\,\omega\, I_M K_{TM}(\omega)}{4\pi \ell_M} + \frac{\rho\,\omega\, I_W K_{TW}(\omega)}{4\pi \ell_W}
$$
*(p.32, Eq. 17)*

Assuming equal baffle effects $K_T(\omega)$ and equal distances $\ell_M$, $\ell_W$ from the two radiating surfaces:

$$
P = \frac{\rho\,\omega}{4\pi \ell}\left(I_M + I_W\right) K_T(\omega)
$$
*(p.32, Eq. 18)*

The combined output has a **simpler transform than either current alone**: $I_M$ and $I_W$ each have a real pole at $(R_M + R_W)/(L_M + L_W)$ and zeros at $R_W/L_W$ and $R_M/L_M$ respectively, which **cancel in the summation**. *(p.32)*

### Homogeneous tube with lumped wall mass at the throat end (Fig. I-C-1b)

The actual distribution of the mass loading is not known and probably varies with articulation, but anatomical considerations and measurements of vibrational amplitude on the surface of head and throat suggest **posterior placement of the lumped load is more representative than an anterior location**. *(pp.32-33)*

$$
I_0 + I_W = I_q \cdot \frac{1 + \dfrac{Z}{R_W + sL_W}\sinh\theta}{\dfrac{Z}{R_W + sL_W}\sinh\theta + \cosh\theta}
$$
Where: $Z = \rho c / A$ (tube characteristic impedance), $\theta = j\omega \ell / c$. *(p.33, Eq. 19)*

Neglecting losses:

$$
I_0 + I_W = I_q \cdot \frac{1 + \dfrac{\sin x}{x}x_W^2}{\dfrac{\sin x}{x}x_W^2 + \cosh\theta}
$$
Where: $x = \omega\ell/c$, and $x_W = \omega_W \ell / c = 2\pi F_W \ell / c$. *(p.33, Eq. 20)*

$L_W$ substituted from:

$$
\left(2\pi F_W\right)^2 = \omega_W^2 = \frac{\rho c^2}{L_W \cdot A \cdot \ell}
$$
Where: $F_W$ = equivalent closed tract resonance frequency; $\ell$ = total tract length; $A$ = tube area. *(p.33, Eq. 21)*

Numerical estimate of $x_W$ by reference to $F_1 = c/4\ell$ of the open single tube:

$$
x_W = \frac{2\pi F_W}{4 F_1} = \frac{2\pi \cdot 180}{4\cdot 500} = 0.56
$$
*(p.33, Eq. 22)*

Under hyperbaric conditions at pressure $P$ ata, using Eq. (6), Eq. (20) becomes:

$$
I_0 + I_W = I_q \cdot \frac{1 + 0.32\,P\,\dfrac{\sin x}{x}}{\cosh\theta}
$$
*(p.33, Eq. 23)* — note $0.32 = x_W^2 = 0.56^2$.

The numerator provides a **$\sin x / x$ shaped correction** of the single tube response. *(p.33)*

## Figures of Interest (running)
- **Fig. I-C-1 (p.31 facing, unnumbered plate):** (a) Lumped element low frequency representation of the vocal tract with mouth opening and cavity wall shunt: $L_M$–$R_M$ (mouth branch, current $I_M$), $L_W$–$R_W$ (wall branch, current $I_W$), both shunted by $C_T$, driven by $I_g$. (b) Line analog of a tube with lumped element wall shunt at the driving end: series $Z\tanh(\theta/2)$ arms, shunt $Z/\sinh\theta$, terminal $L_0$–$R_0$ output branch with current $I_0$, wall branch $L_W$–$R_W$ with current $I_W$. (c) Distributed element representation of the vocal tract with wall impedance included: per-section $L(x)/2$, $R(x)$, $L(x)/2$ series elements; shunt $G(x)$, $C(x)$, and a series $L_W(x)$–$R_W(x)$ wall branch; source $I_q = P_S/(Z_S + Z_g(t))$ with time-varying glottal impedance $Z_g(t)$ and subglottal impedance $Z_S$.
- **Fig. I-C-2 (p.33 facing):** Response correction when adding sound radiated from the walls near the driving end of a neutral tract to the sound radiated from the mouth opening. Ordinate dB from -3 to +3, abscissa $\omega\ell/c$ marked at $\pi/2, \pi, 3\pi/2, 2\pi$ with frequency scale 500, 1000, 1500, 2000, 2500 Hz for $\ell = 17.5$ cm. Curve starts at about **+2.5 dB at DC**, crosses zero near 1000 Hz ($\omega\ell/c = \pi$), reaches a minimum of about **-0.7 dB near 1500 Hz**, returns through zero near 2000 Hz ($2\pi$), and shows a small positive lobe of about **+0.3 dB near 2400 Hz**.

### Numerical results of the lumped-throat-mass single tube *(p.34)*
- The essential feature of the wall-radiation correction is a **low frequency boost of 2.4 dB**. The **minimum of 0.6 dB at 1500 Hz** is of no importance.
- At **P = 15 ata** there would appear a **15 dB low frequency boost and a pronounced zero at 1500 Hz**, which would affect the F2 level.
- Solving for the zeros of the denominator of Eq. (19) gives **F1 = 560 Hz, i.e. a 12 % increase** due to the mass shunt at the driving end (relative to the 500 Hz hard-wall neutral tube).

---

## Section 3. Distributed losses and wall impedance *(pp.34-39)*

The generalized equivalent network of Fig. I-C-1c contains distributed **series elements $sL(x) + z(x)$** and **parallel elements $sC(x) + y(x)$**, where:

$$
z(s,x) = R(x)
$$
$$
y(s,x) = G(x) + \left[s L_W(x) + R_W(x)\right]^{-1}
$$
Where: all quantities are **per unit length** at coordinate $x$ along the tract; $L_W(x)$, $R_W(x)$ are the distributed inductance and series resistance of the cavity walls; $R(x)$ is the series (viscous) resistance; $G(x)$ is the shunt (heat conduction) conductance. *(p.34, Eq. 24)*

$R_0$ is the radiation resistance (Eq. 16); $L_0$ is the radiation inductance, which for simplicity of calculation may be included as an **end correction** adding approximately

$$
\Delta \ell_0 = 0.8\left(\frac{A_0}{\pi}\right)^{1/2}
$$
Where: $A_0$ = mouth opening area (cm squared); $\Delta\ell_0$ = added length at the lips (cm). *(p.34, Eq. 25 — first use of number 25)*

As long as $\ell_0$ is shorter than the wavelengths considered, the error in resonance frequency calculation is very small. **The glottal termination is set to infinite load for calculation of the closed glottis response.** *(p.34)*

### Laurent's indirect frequency transformation *(pp.34-36)*

Rather than solving $I_0/I_g$ by standard matrix technique, Fant uses the technique of **indirect frequency transformations developed by Laurent (1964)**: multiply all impedances of the original net by a factor $\psi$ such that inductances $L(x)$ become connected with series elements $z(s,x)$ and capacitances $C(x)$ become paralleled by branches $y(s,x)$:

$$
\psi\, s' L(x) = s L(x) + z(s,x)
$$
$$
\frac{s' C(x)}{\psi} = s C(x) + y(s,x)
$$
*(p.35, Eq. 24a, 24b)*

Eliminating the impedance function $\psi$:

$$
s'^2 = \left[s + \frac{y(s,x)}{C(x)}\right]\left[s + \frac{y(s,x)}{L(x)}\right] = (s + a_1)(s + a_2)
$$
*(p.35, Eq. 25 — second use of the number 25 in the paper; a genuine numbering duplication in the original)*

A property such as a pole of the transfer function $H_i(s') = I_0/I_g$ in the original net is transposed to a frequency $s$ in the transformed net:

$$
H_i(s') = H(s)
$$
*(p.35, Eq. 26)* — a similar transformation was used by **Sondhi and Gopinath (1971)**.

Consider a pair of conjugate poles $s' = \pm j\omega_i$. The associated complex frequencies in the $s$ domain of the transformed network satisfy Eq. (25). This requires the following four ratios to be **independent of $x$ and $A(x)$**:

$$
\alpha_R = \frac{R(x)}{L(x)}
$$
*(p.35, Eq. 27a)* — the **viscous friction damping rate**.

$$
\alpha_G = \frac{G(x)}{C(x)}
$$
*(p.35, Eq. 27b)* — the **heat conduction damping rate**.

$$
\alpha_W = \frac{R_W(x)}{L_W(x)}
$$
*(p.35, Eq. 27c)* — the **wall damping rate**.

$$
\omega_W^2 = \frac{1}{L_W(x) C(x)} = \frac{1}{L_W C_T} = (2\pi F_W)^2
$$
*(p.35, Eq. 27d)* — the **wall resonance**.

$$
-\omega_i^2 = s^2 + \alpha_R s + \alpha_G s + \alpha_G \alpha_R + \frac{\omega_W^2 (s + \alpha_R)}{s + \alpha_W}
$$
*(p.35, Eq. 28; the scan prints a "B" where the second $s$ belongs)*

Rearranged into a cubic:

$$
s^3 + s^2(\alpha_R + \alpha_G + \alpha_W) + s\left(\omega_i^2 + \omega_W^2 + \alpha_G\alpha_R + \alpha_W\alpha_R + \alpha_W\alpha_G\right) + \alpha_W\omega_i^2 + \alpha_R\omega_W^2 + \alpha_W\alpha_R\alpha_G = 0
$$
*(p.36, Eq. 29)*

Eq. (29) is solved assuming **one real and one conjugate complex root**, by identity with:

$$
(s + \alpha_1)\left(s^2 + 2\alpha s + \omega_0^2\right) = 0
$$
*(p.36, Eq. 30)*

giving the three identities:

$$
\alpha_1 + 2\alpha = \alpha_R + \alpha_G + \alpha_W
$$
*(p.36, Eq. 31a)*

$$
\omega_0^2 + 2\alpha_1\alpha = \omega_i^2 + \omega_W^2 + \alpha_W\alpha_R + \alpha_G(\alpha_R + \alpha_W)
$$
*(p.36, Eq. 31b)*

$$
\alpha_1\omega_0^2 = \alpha_W\omega_i^2 + \alpha_R\omega_W^2 + \alpha_W\alpha_R\alpha_G
$$
*(p.36, Eq. 31c)*

Neglecting the last term of Eq. (31c) gives the **real pole**:

$$
\alpha_1 = \frac{\alpha_W \omega_i^2 + \alpha_R \omega_W^2}{\omega_0^2}
$$
*(p.36, Eq. 32)*

From Eq. (31a):

$$
2\alpha = \alpha_W\left(1 - \frac{\omega_i^2}{\omega_0^2}\right) + \alpha_R\left(1 - \frac{\omega_W^2}{\omega_0^2}\right) + \alpha_G
$$
*(p.36, Eq. 33)*

Eq. (30b) is approximated by:

$$
\omega_0^2 = \omega_i^2 + \omega_W^2
$$
*(p.36, Eq. 34)*

so that:

$$
2\alpha = \alpha_W\frac{\omega_W^2}{\omega_0^2} + \alpha_R\frac{\omega_i^2}{\omega_0^2} + \alpha_G
$$
*(p.36, Eq. 35)*

### THE MASTER RESULT *(p.37)*

$$
F = \frac{\omega_0}{2\pi} = \frac{1}{2\pi}\sqrt{\omega_i^2 + \omega_W^2} = \sqrt{F_i^2 + F_W^2}
$$
*(p.37, Eq. 36)*

$$
B = \frac{\alpha}{\pi} = \frac{1}{2\pi}\left[\frac{\omega_W^2}{\omega_0^2}\alpha_W + \frac{\omega_i^2}{\omega_0^2}\alpha_R + \alpha_G\right] = B_W\left(\frac{F_W}{F}\right)^2 + B_R\left(\frac{F_i}{F}\right)^2 + B_G
$$
*(p.37, Eq. 37)*

These expressions have **formal identity with Eqs. (1), (11), and (14) but are more general, being valid for any resonance.** *(p.37)*

Eq. (36) requires:

$$
L_W(x) C(x) = \text{const}, \qquad \text{or equivalently} \qquad \frac{S(x)}{A(x)\,d(x)} = \text{const}
$$
*(p.37, Eq. 38)*

as seen from Eq. (5). **The perimeters $S(x)$ should accordingly be proportional to the product of the area $A(x)$ and the wall thickness $d(x)$.** *(p.37)*

Caveats stated by Fant *(p.37)*:
- It is not unreasonable to assume the **equivalent wall thickness increases when the tract is narrowed**, compensating for the increasing perimeter-to-area ratio.
- An alternative hypothesis: the **total lumped wall mass and the total enclosed air volume are independent of articulation**, which ensures a low-frequency validity of Eq. (36).
- **The alpha-terms of Eq. (27) are probably not independent of $A(x)$, which limits the validity of the bandwidth derivation from Eq. (37).** This is the author's own stated limitation on the master formula.

### Alternative derivation: frequency-dependent velocity of sound *(p.38)*

Under uniform mass-loading and constant $L_W(x)C(x) = \omega_W^{-2}$:

$$
c_e(\omega) = c\left[1 - \frac{\omega_W^2}{\omega^2}\right]^{-1/2}
$$
*(p.38, Eq. 39)*

which follows from the substitution:

$$
s C_e(x) = s C(x) + \frac{1}{s L_W(x)}
$$
*(p.38, Eq. 40)*

and the definitions:

$$
c = \left[L(x)C(x)\right]^{-1/2}, \qquad c_e = \left[L(x)C_e(x)\right]^{-1/2}
$$
*(p.38, Eq. 41)*

Any resonance frequency must be proportional to the velocity of sound, as seen directly from **Webster's wave equation** in pressure $P(x)$ along the tract:

$$
\frac{1}{A(x)}\cdot\frac{d}{dx}\left[A(x)\frac{dP(x)}{dx}\right] - \left(\frac{s}{c}\right)^2 P(x) = 0
$$
*(p.38, Eq. 42)*

$$
\frac{F}{F_i} = \frac{c_e}{c} = \left[1 - \frac{F_W^2}{F^2}\right]^{-1/2}, \qquad F^2 = F_i^2 + F_W^2
$$
*(p.38, Eq. 43)*

as in Eq. (36), subject to the constraints of Eq. (38), as earlier discussed by **Fant and Sonesson (1964)**.

Criticism of prior work *(p.38)*: "A derivation of wall effects via a correction in the velocity of sound has also been made by **Flanagan (1965), but the numerical values of frequency shifts he reports are not representative.**"

Numerical result *(p.38)*: For the **open neutral tube with $F_W$ = 180 Hz we find $F_1$ = 530 Hz, a 6 % increase**, which is **one half** that found when all the mass-loading was lumped at the glottal end (Eq. 20, which gave 560 Hz / 12 %). **The effect on F2 is 11 Hz only.**

Remaining gap *(p.39)*: although the validity of Eqs. (1), (6), and (11) has been experimentally verified on an average basis in the studies of Fant and Sonesson (1964) and Fant and Lindqvist (1968), data on the particular mass distribution along the tract and how it varies with particular articulations are still lacking. From the hyperbaric studies, **the derived numerical value of $F_W$ does not vary much with the particular vowel.** *(p.39)*

---

## Section 4. Bandwidth data *(pp.39-...)*

The **direct vocal tract sweep-frequency technique** — injecting a gliding-frequency sinusoidal vibration externally at the neck and recording the response from a microphone just outside the lips — was first introduced by **Fant (1961)**. *(p.39)*

Key empirical facts *(p.39)*:
- Bandwidths are typically **30-70 Hz at frequencies below 2000 Hz** and **increase at a high rate, approximately proportional to frequency squared, above 2000 Hz**.
- These magnitudes compare well with House and Stevens (1958), Dunn (1961), and the very detailed measurements of Fujimura and Lindqvist (1964 A, B and 1971).
- Fujimura and Lindqvist specifically drew attention to the **inverse bandwidth-frequency relation for frequencies below 500 Hz** (Fig. I-C-4, from their 1971 article).
- For male voices one may extrapolate a **limiting value of $B_1$ = 85 Hz at a closed tract $F_W$ of 175 Hz**.
- By Eq. (14) and (37) the wall-dissipation bandwidth contribution should be **85/4 = 21 Hz at $F_1$ = 350 Hz**, with about just as much from other sources to account for the observed $B_1$.
- **General rule: wall losses dominate the low $F_1$ range, frictional losses the $F_2$ range, and radiation loss the $F_3$ range** — "in general but with important exceptions".
- **The first formant bandwidth of females is about 25 % higher than for males.** Fujimura and Lindqvist (1971) ascribe it to thinner cavity walls of the females. An alternative explanation offered by Eq. (38) is the smaller (continued p.40).

### Figure I-C-3 (facing p.39): Vocal tract resonance bandwidth versus frequency. After Fant (1961).
Scatter of formant bandwidth (c/s, 0-250) against formant frequency (c/s, 0-4000+), titled "Bandwidth and frequency of formants from measurements of vocal tract transmission." Reading the plot:
- Below about 2000 Hz the cloud sits between roughly **30 and 70 Hz**, with the bulk near 40-60 Hz.
- Around 200-400 Hz there is a small rise, points up to about 70 Hz.
- Above 2000 Hz the cloud fans upward steeply: points near 2600-2800 Hz reach 110-125 Hz; near 3000-3600 Hz reach 165-205 Hz; a point near 4300 Hz sits at about 125 Hz.
- Filled symbols and plus symbols mark separate speaker or condition subsets; open circles dominate.

### Figure I-C-4 (facing p.39): Bandwidth versus frequency of vocal resonances in the F1 domain for males and females. Fujimura-Lindqvist (1971).
First formant bandwidth, closed glottis. Ordinate 20-130 Hz; abscissa first formant frequency 200-800 Hz. Filled circles = male, open circles = female; solid curve = male trend, dashed curve = female trend.
- **Male curve**: about **78 Hz at F1 = 200 Hz**, falling to about **65 Hz at 250 Hz**, **55 Hz at 300 Hz**, **45 Hz at 350 Hz**, **40 Hz at 400 Hz**, a **minimum of about 37 Hz over F1 = 450-550 Hz**, then rising gently to about **42 Hz at 750 Hz**.
- **Female curve**: about **90 Hz at F1 = 250 Hz**, **75 Hz at 300 Hz**, **63 Hz at 350 Hz**, **55 Hz at 400 Hz**, **50 Hz at 450 Hz**, flattening to a **plateau of about 46-47 Hz from F1 = 500 Hz upward to 800 Hz**.
- Two outliers at about 120 Hz near F1 = 200-215 Hz (one male, one female).
- The female curve lies roughly **25 % above** the male curve in the low-F1 region, consistent with the text on p.39.
- This is the empirical curve that Fant reads a **limiting B1 = 85 Hz at F_W = 175 Hz** off of by extrapolation.

### Continuation of section 4 *(p.40)*
- Female first-formant bandwidth excess: Fujimura and Lindqvist (1971) ascribe it to **thinner cavity walls of the females**; Fant's alternative from Eq. (38) is that **female cavities have a smaller A(x)/S(x) ratio as a consequence of the smaller cross-section dimensions**. *(p.40)*
- Figs. I-C-5 and I-C-6 replot Fujimura and Lindqvist's original data on bandwidth and resonant frequencies of **Swedish vowels**, ordered in minimal phonetic steps, representing the **average of two male speakers and of two female speakers** respectively. *(p.40)*

General trends valid for both speaker categories *(p.40)*:
- **B3 is substantially higher than B1 and B2 in unrounded front and neutral vowels and in open back vowels.**
- **In the extreme rounded back and front vowels [u] and [ʉ], B3 is nearly always smaller than B1 and B2.**
- **B1 has a somewhat greater range of variation than B2 and about the same average value.**
- Male and female data are in substantial agreement; their average difference is **not so pronounced as would have been expected from Fig. I-C-4**. The difference in F-patterns is also rather small for this particular subset of subjects.
- The B1 and B2 variation dependency with phonetic category is essentially the same in the male and female groups.
- **B1 > B2 in almost all vowels of maximally low F1**, i.e. in [u], [i], [y], and female [ʉ].
- **Crossover points where B1 = B2** occur at approximately the same vowels: **[ɑ], [e], [ʉ] for the males** and **[ɑ], [ɪ], [ø] for the females**.

---

## Section 5. Bandwidth calculations from articulatory models *(pp.40-...)*

Under closed glottis conditions, resonance bandwidths are the sum of a wall term $B_W$ (cavity wall vibrational losses), a friction term $B_R$, a heat-conduction term $B_G$ (losses at the interior surfaces of the tract), and a radiation term $B_0$:

$$
B = B_W + B_R + B_G + B_0
$$
*(p.40, Eq. 44)* — **the top-level bandwidth budget of the paper.**

### Figure I-C-5 (facing p.40): Resonance frequencies and bandwidths of male vowels in a phonetic sequence
Two stacked panels, 2 male Swedish speakers (GF, SO). Vowel abscissa order: u, o, ɔ, ɑ, a, æ, ɛ, e, ɪ, i (back then front unrounded), then y, ʉ, ø, œ, ɵ (front and mid rounded), then ɜ (neutral vowel).
- Upper panel, F-pattern (Hz, 0-3000+): F1 rises from about 250 Hz at [u] to a maximum of about 700 Hz around [a]/[æ], then falls to about 250 Hz at [i], rising again to about 450-500 Hz in the rounded and neutral vowels. F2 rises from about 600 Hz at [u] monotonically to about 2000 Hz at [ɪ]/[i], then drops through the rounded series to about 1000 Hz at [ɵ] and back to about 1500 Hz at [ɜ]. F3 sits near 2400-2700 Hz through the back vowels, peaks at about 3000 Hz at [i], falls to about 2050 Hz at [y], and returns to about 2500 Hz at [ɜ].
- Lower panel, B-pattern (Hz, 0-200): **B3 (triangles, dotted)** starts near 45 Hz at [u], climbs to about 100 Hz at [ɔ] and [a], dips to about 82 Hz at [æ], then peaks at about **155 Hz at [e]** and 145 Hz at [ɪ], falls to about 103 Hz at [i], about 82 Hz at [y], down to about 40 Hz at [ʉ], and rises to about 88 Hz at [ɜ]. **B1 (crosses, solid)** is about 68 Hz at [u], 38 Hz at [o], 50 Hz at [ɔ], 45 Hz at [ɑ], 38 Hz at [a], 45 Hz at [æ], 47 Hz at [ɛ], 63 Hz at [e], 70 Hz at [ɪ], **83 Hz at [i]**, 65 Hz at [y], 40 Hz at [ʉ], 35 Hz at [ø]-[ɵ], 30 Hz at [ɜ]. **B2 (open circles, dashed)** is about 45 Hz at [u], 38 Hz at [o], 45 Hz at [ɔ], 58 Hz at [ɑ], 62 Hz at [a], 58 Hz at [æ], 43 Hz at [ɛ], 47 Hz at [e], 42 Hz at [ɪ], **35 Hz at [i]** (the minimum), 68 Hz at [y], 65 Hz at [ʉ], 55 Hz at [ø], 35 Hz at [œ]-[ɵ], 38 Hz at [ɜ].
- Confirms the text: B1 > B2 at [u] and [i]; B3 far above B1/B2 in unrounded front and open back vowels; B3 below B1/B2 at [ʉ].

### Figure I-C-6 (facing p.40): Resonance frequencies and bandwidths of female vowels
Same layout, 2 female Swedish speakers (BB, KE). The caption notes "The two subjects selected differ from the male group less than the average for females."
- Upper panel: F1 about 300 Hz at [u], up to about 750 Hz at [a]-[æ], down to about 300 Hz at [i], rising to about 450 Hz at [ɵ]. F2 rises from about 650 Hz at [u] to a peak of about 2150 Hz at [e], then falls steadily to about 1200 Hz at [ɵ]. F3 near 2700-3000 Hz through back and front unrounded vowels, peaking near 3050 Hz at [i], falling to about 2280 Hz at [ø]/[œ], recovering to about 2650 Hz at [ɵ].
- Lower panel: **B3** about 68 Hz at [u], 55 Hz at [o], 88 Hz at [ɔ], 110 Hz at [ɑ], 120 Hz at [a], 145 Hz at [æ], **190 Hz at [e]** (the maximum), 100 Hz at [i], 90 Hz at [y], 62 Hz at [ʉ], 78 Hz at [ø], 72 Hz at [œ], 52 Hz at [ɵ]. **B1** about **95 Hz at [u]**, 55 Hz at [o], 52 Hz at [ɔ], 60 Hz at [ɑ], 42 Hz at [a], 45 Hz at [æ], 48 Hz at [ɛ]-[e], 62 Hz at [ɪ], 50 Hz at [i], 70 Hz at [y], 72 Hz at [ʉ], 55 Hz at [ø], 45 Hz at [œ], 40 Hz at [ɵ]. **B2** about 58 Hz at [u], 47 Hz at [o]-[ɔ], 62 Hz at [ɑ], 62 Hz through [a]-[e], 40 Hz at [i], 50 Hz at [y], 55 Hz at [ʉ]-[ø], 50 Hz at [œ], 42 Hz at [ɵ].

---

## Section 5 continued: the four loss terms *(pp.41-44)*

### (a) Wall and surface losses *(p.41)*

According to Eq. (37) and the Fujimura and Lindqvist (1971) experimental data, the wall losses account for:

$$
B_W = B_{W0}\left(\frac{F_W}{F}\right)^2 = B_{W0}\left(\frac{175}{F}\right)^2
$$
Where: $B_{W0}$ is **of the order of 85-100 Hz when normalized to $F_W$ = 175 Hz**; $F$ = the formant frequency in Hz. *(p.41, Eq. 45)* — **THIS IS THE WALL-LOSS BANDWIDTH FORMULA the later literature cites.**

### (b) Frictional (viscous) losses *(p.41)*

The internal surface losses have been treated extensively by **Fant (1960, pp. 32-33, 136, and 303-311)**. Frictional losses derive from expressions of the type $R/2L$, see Eqs. (13), (35), and (37). With:

$$
R(x) = \frac{S(x)\,\ell\,(2\mu\omega\rho)^{1/2}}{2A(x)^2}
$$
Where: $S(x)$ = perimeter, $A(x)$ = area, $\ell$ = length, $\mu$ = viscosity coefficient of a unit section of the tract, $\rho$ = air density, $\omega$ = radian frequency. *(p.41, Eq. 46)*

$$
L(x) = \frac{\rho\,\ell}{A(x)}
$$
*(p.41, Eq. 47)*

we obtain:

$$
B_R = \left(\frac{\mu F}{\rho A}\right)^{1/2}\cdot S_A
$$
*(p.41, Eq. 48)*

where the **shape factor**:

$$
S_A = \frac{S}{2\pi (A/\pi)^{1/2}}
$$
*(p.41, Eq. 49)*

is **unity for a circular area and 2 for an elliptical cross-sectional area of width-to-height ratio equal to 9**, which could be representative for narrow constrictions in the vocal tract. "Apart from this shape factor it is probable that the friction is greater than in hard walled ideal structures. **A value of $S_A$ = 2 has accordingly been adopted for all calculations.**" *(p.41)*

Eq. (48) holds for the distributed case, Eq. (37), as well as for the Helmholtz resonator, Eq. (13). As discussed by **Fant (1960, pp. 304-305)** the frictional losses in a resonator neck may alternatively be expressed by reference to the resonator volume and neck length, in which case **frequency is eliminated** from the expression, or by elimination of neck area $A$, in which case **frequency enters with negative exponent**. *(p.41)*

### The normalized numerical friction expressions *(p.42)*

$$
B_R = 13\left(\frac{f}{1000\,A}\right)^{1/2} S_A = 9.7\left(\frac{100}{A\,\ell_e\,V}\right)^{1/4} S_A = 7.3\left(\frac{1000}{f}\right)^{1/2}\left(\frac{100}{V \ell_e}\right)^{1/2} S_A \quad \text{(Hz)}
$$
Where: $f$ = frequency in Hz; $A$ = area in cm squared; $V$ = volume in cm cubed; $\ell_e$ = effective (neck) length in cm; $S_A$ = shape factor. *(p.42, Eq. 50)*

Interpretation *(p.42)*:
- The third expression shows that **if the resonance frequency is tuned by variations in neck area $A$ alone, the bandwidth contribution displays an $f^{-1/2}$ behavior.** This is the typical case of narrowing the lips or raising the tongue against the palate. **This negative exponent adds to the cavity-wall-induced bandwidth increase towards low frequencies, Eq. (45).**
- **For other modes of a tube than the fundamental, and for open tubes in general, the $f^{+1/2}$ dependency is more representative.**

### (c) Heat conduction losses *(p.42)*

$$
\alpha_G = 0.45\,\alpha_R
$$
*(p.42, Eq. 51)* — **the heat conduction damping rate is 45 % of the viscous friction damping rate.**

so the combined friction + heat conduction normalized numerical expression is:

$$
B_{RG} = B_R + B_G = 18.5\left(\frac{f}{1000\,A}\right)^{1/2} \quad \text{Hz}
$$
Where: $f$ = frequency (Hz); $A$ = cross-sectional area (cm squared). Note $18.5 \approx 13 \times 1.45$ with $S_A$ absorbed. As shown by **Fant (1960, p. 308)**. *(p.42, Eq. 52)* — **THIS IS THE FRICTION+HEAT-CONDUCTION BANDWIDTH FORMULA the later literature cites.**

### Effective area for arbitrary tract shapes *(p.42)*

The area is not treated as an arbitrary constant of the same value for all sounds, but calculated to satisfy:

$$
\frac{1}{A_e} = \frac{1}{\ell}\int_0^{\ell}\frac{dx}{A(x)}
$$
Where: $A_e$ = effective area, i.e. the **spatial mean of the reciprocal area over the particular area function** (harmonic mean of $A(x)$). This value is then inserted into Eq. (52) for use in calculations of all modes. *(p.42, Eq. 53)*

Validation approach *(p.42)*: Exact calculation from distributed element representations and complex matrix techniques as outlined by Fant (1960, pp. 37-41) and reported on p. 136 of that reference. Footnote: "**These calculations were made in 1954 with the first Swedish electronic computer Besk.**"

### Accuracy of the approximation *(p.44)*
- The cavity wall bandwidth term Eq. (45) was included in Table I-C-I with **$B_{W0}$ = 100 Hz**.
- The $(F_i/F)^2$ factor of Eq. (37) applied to $B_R$ **has been omitted**, since the calculations were made without regard to the mass-loading of the walls. *(p.44)*
- "**As seen from Table I-C-I the approximation by using Eqs. (52) and (53) instead of the complete vocal tract complex matrix is very good.**" The relative greatest departures occur at very low F1, where the mean $A_e$ is no longer representative and the approximate values are of the order of **10 Hz compared to the 15 Hz of the exact calculations**. **In B2 and B3 the mean error is 4.5 Hz.** *(p.44)*

### (d) Radiation losses *(p.44)*

Radiation losses are **more critically dependent on the particular vocal tract shape**. The following expression was derived by Fant (1960) for a **single tube**:

$$
B_0 = 29\left(\frac{f}{1500}\right)^2\left(\frac{A}{8}\right)\left(\frac{17.6}{\ell_e}\right)K_s(f)
$$
Where: $f$ = frequency (Hz); $A$ = mouth area (cm squared); $\ell_e$ = length of the tube (cm); $K_s(f)$ = baffle factor **set to 1.4** as an average value intermediate between the point-source $K_s = 1$ and the infinite-baffle $K_s = 2$ extreme, "which apparently provides too large measures." *(p.44, Eq. 54)* — **THIS IS THE RADIATION BANDWIDTH FORMULA.**

Validity caveats *(p.44)*:
- Eq. (54) applies for a resonance which is a **quarter wavelength or higher mode of a front cavity in a constricted vocal tract**, e.g. F3 of /i/.
- It would apply **very badly to standing wave resonances in semi-closed systems**, as for the second formant of a vowel [i]. The calculated second formant radiation bandwidth of [i] in Table I-C-I is **2 Hz only, whilst radiation adds 190 Hz to B3**.
- "In general for a semi-closed system the radiation damping is **very small and independent of frequency**", as shown by Fant (1960), Eq. A.36-21.

For a **two-tube model**:

$$
B_0 = 90\left(\frac{A_1}{\ell_{1e}}\right)^2\left(\frac{10}{\ell_2 A_2}\right)K_s(f)
$$
Where: $A_1$, $\ell_{1e}$ = area and effective length of the front (anterior) tube; $A_2$, $\ell_2$ = area and length of the back tube. *(p.44, Eq. 55)*

- **The radiation bandwidth term decreases with the square of the $A/\ell$ ratio of the front part**, which has immediate implication for the **low radiation damping of liprounded sounds**.
- "Apparently the particular cavity resonance dependency is the main factor for determining the extent to which radiation losses enter. The **ICA paper of Ichikawa and Nakata (1971)** demonstrates these effects." *(p.44)*

---

## Table I-C-I. Exact and approximate calculations of bandwidths B1, B2, and B3 of vowels *(p.43)*

### Input F-patterns and areas (from Fant, 1960)

| Vowel | F1 (Hz) | F2 (Hz) | F3 (Hz) | A_e (cm²) | A_0 (cm²) |
|-------|---------|---------|---------|-----------|-----------|
| u | 231 | 615 | 2375 | 1.75 | 0.65 |
| ɑ | 616 | 1072 | 2470 | 2.1 | 5 |
| ɛ | 432 | 1959 | 2722 | 4.1 | 5 |
| i | 222 | 2244 | 3140 | 3.8 | 2 |
| ɜ (neutral) | 500 | 1500 | 2500 | 7 | 7 |

$A_e$ = effective area from Eq. (53); $A_0$ = mouth opening area.

### Component bandwidths (Hz), by formant number 1 / 2 / 3

| Vowel | Walls B_W 1 | 2 | 3 | Surfaces B_RG "Exact" 1 | 2 | 3 | Surfaces B_RG Approx. 1 | 2 | 3 | Radiation B_0 "Exact" 1 | 2 | 3 | Radiation B_0 Approx. 1 | 2 | 3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| u | 57 | 8 | 0 | 15 | 16 | 40 | 9 | 20 | 43 | 0 | 0 | 1 | 0 | 0 | 9 |
| ɑ | 8 | 2 | 0 | 17 | 20 | 33 | 20 | 26 | 39 | 4 | 13 | 35 | 5 | 15 | 72 |
| ɛ | 15 | 0 | 0 | 11 | 19 | 27 | 12 | 25 | 29 | 3 | 28 | 85 | 3 | 40 | 81 |
| i | 62 | 0 | 0 | 14 | 22 | 36 | 9 | 28 | 33 | 0 | 2 | 190 | 0 | 24 | 45 |
| ɜ | 12.5 | 1.3 | 0 | 10 | 17 | 22 | 10 | 17 | 22 | 5 | 39 | 110 | 5 | 39 | 110 |

### Total bandwidth (Hz)

| Vowel | "Exact" B1 | B2 | B3 | Approx. B1 | B2 | B3 | Fujimura-Lindqvist similar vowel B1 | B2 | B3 |
|---|---|---|---|---|---|---|---|---|---|
| u | 72 | 24 | 41 | 63 | 29 | 52 | 63 | 43 | 42 |
| ɑ | 29 | 35 | 68 | 34 | 44 | 112 | 45 | 42 | 100 |
| ɛ | 29 | 47 | 112 | 31 | 65 | 110 | 41 | 58 | 119 |
| i | 76 | 24 | 226 | 67 | 53 | 78 | 72 | 35 | 105 |
| ɜ | 27 | 57 | 132 | 27 | 57 | 132 | 29 | 37 | 87 |

Note: the wall term $B_W$ in this table uses $B_{W0}$ = 100 Hz in Eq. (45). $B_W$ is **zero for F3 in every vowel** and near-zero for F2, confirming the $1/F^2$ falloff.

### Radiation loss caveats and conventions *(p.45)*
- As the point of maximum constriction in a three-parameter model is moved from the glottis to the lips, **the radiation component of B3 shows great undulations**. *(p.45)*
- Since the radiation damping of an open tube is **inversely proportional to its length** (Eq. 54), **resonances of a short front cavity become more highly damped than a higher mode of a longer tube at the same frequency**. *(p.45)*
- Conventions adopted for the present study *(p.45)*:
  - **Eq. (54) with $\ell_e$ = 17.6 cm** as in the standard neutral vowel.
  - **The radiation area $A_0$ is defined as the mean of the two smallest areas in the three most anterior sections of the area function, quantized in $\Delta x$ = 0.5 cm steps.**
  - "These $\ell_e$ and $A_0$ conventions have contributed to **underestimate front cavity damping** but are necessary in order to avoid excessive values of radiation damping of interior standing wave modes, as F2 of [i]."
- The main error in the approximate radiation loss calculation lies in **B2 and B3 of [i] and in B3 of [u] and [ɑ]**. The approximation is good for the open front vowel [ɛ]. *(p.45)*

### Comparison against experiment *(p.45)*
- With a few exceptions the overall agreement between calculated totals and the Fujimura-Lindqvist data is good, and **the approximate derivations provide just as good a match as the exact expressions**.
- **On the average the approximate B2 values come out too high and the "exact" B2 values too low.**
- The low calculated B2 of [u] indicates that **either the frictional losses or the wall losses occasionally play a more important role than anticipated**. The spread in human data is rather large and the vowels of the two studies are not quite the same.

### The [u] double-Helmholtz correction *(pp.45-46)*
There are good reasons to question the validity of Eq. (45) for calculating the cavity wall damping of the second formant of [u]. Fant (1960, p. 116) showed a **double Helmholtz resonator model** applied well to the articulatory configuration of [u], and p. 121 stated that the second formant is to a large extent tuned by the back cavity and tongue constriction. *(pp.45-46)*

Worked numbers *(p.46)*:
- **Back cavity volume of [u] = 31 cm³; overall tract volume close to 100 cm³.**
- Under the assumption that the mass load of the walls is largely confined to the lower part of the neck just above the glottis (as suggested by Fujimura and Lindqvist, 1971), and approaching a limit of completely closed tongue hump passage, **the closed tract resonance of the back cavity becomes $175(100/31)^{1/2}$ = 315 Hz**.
- The bandwidth of this resonance is entirely determined by $R_W(x)/L_W(x)$ as in the undivided tract, i.e. **$B_{W0}$ = 100 Hz**.
- With a finite coupling to the mouth through the tongue hump of **$\ell_2/A_2$ = 4.2**, $F_{2i}$ is calculated to be **495 Hz**, and when the mass-loading is added $F_2 = (F_{2i}^2 + F_W^2)^{1/2}$ = **590 Hz**.
- The bandwidth due to wall losses is then $B_{W0}(F_W/F_2)^2$ = **28 Hz**, "which is about three times, or more precisely the ratio of total volume to back cavity volume, greater than anticipated by the standard formula" (Table I-C-I).
- **An additional 28 - 8 = 20 Hz should be added to B2 of [u]**, which happens to be 19 Hz short of the experimental value. "This analysis should be significant at least qualitatively."

### General recommendation *(p.46)*
"As a general recommendation for gaining a substantial economy in bandwidth calculations I suggest that the **surface losses, i.e. the friction plus heat conduction component, be calculated from the approximate expressions whilst radiation losses if possible should be taken care of by exact calculations.** With a more profound insight in the distribution of vocal tract mass-loading it will eventually be possible to gain more exact expressions for the $B_W$ component."

---

## Section 6. Prediction of bandwidths from resonance frequencies *(pp.46-...)*

Goal: construct **empirical formulas for predicting bandwidths from the F-pattern alone, without reference to articulatory data**. Each of B1, B2, B3 is expressed as a function of F1, F2, F3, and F4. The search for suitable formulas was partly aided by the theory of damping mechanisms outlined in the previous sections. *(p.46)*

### THE F-PATTERN BANDWIDTH PREDICTION FORMULAS (male group) *(p.47)*

$$
B_1 = 15\left(\frac{500}{F_1}\right)^2 + 20\left(\frac{F_1}{500}\right)^{1/2} + 5\left(\frac{F_1}{500}\right)^2 \quad \text{(Hz)}
$$
Where: $F_1$ in Hz. **The three terms are identified with cavity wall losses, classical surface losses, and radiation losses respectively.** *(p.47, Eq. 56)*

$$
B_2 = 22 + 16\left(\frac{F_1}{500}\right)^2 + \frac{12000}{F_3 - F_2} \quad \text{(Hz)}
$$
Where: $F_1, F_2, F_3$ in Hz. *(p.47, Eq. 57)*

$$
B_3 = 25\left(\frac{F_1}{500}\right)^2 + 4\left(\frac{F_2}{500}\right)^2 + 10\,F_3\left(F_{4a} - F_3\right) \quad \text{(Hz)}
$$
Where: $F_{4a}$ = the speaker's average F4, **3400 Hz for the male group and 3700 Hz for the female group**. Note: the third term as printed must be read as $10\,F_3/(F_{4a}-F_3)$ dimensionally, but the scan shows the printed form reproduced here verbatim. *(p.47, Eq. 58)*

Interpretation *(p.47)*:
- **B2 has an F1-proportional component which accounts for the increase of radiation loss at greater degrees of articulatory opening.** The third term of B2 represents radiation loss of a constricted tract under the condition of an **F2 close to F3**, which accounts for energy transfer in spite of the narrowing.
- "The relation of B2 to F2 is by no means simple. When both F2 and F3 are high and not close, as in the vowel [i], **B2 can be as small as 30 Hz** and lower than in the vowel [u], where F2 is at the extreme low end."
- **The B3 formula contains an F1-proportional term representing the degree of articulatory opening, an F2² component, and a term where the degree of proximity of F3 to the average F4 of the speaker enters.** Lip rounded sounds as [ʉ] and [ø] have larger distances between F4 and F3 and at the same time small B3.

### Female adaptation *(p.47)*
"The only difference made in the female calculations is that **the first term of B1 has been increased by 30 %, i.e. by a 14 % higher equivalent $F_W$**, and that **$F_{4a}$ is set to 3700 instead of 3400 Hz** for the male group."

### Prediction error metric *(p.47)*
The bandwidth error represents relative peak levels in the spectrum envelope:

$$
\text{error (dB)} = 20\log_{10}\left(\frac{B_m}{B_p}\right)
$$
Where: $B_m$ = measured bandwidth, $B_p$ = predicted bandwidth. *(p.47)*

- **The average value of the error is close to 1 dB, except for B3 of the male group where the mean error in estimates is 2 dB.**
- "This accuracy should be sufficient for any practical purpose and is remarkably high in view of the fact that each measured value is the mean of two subjects only with one or two determinations per sound."

---

## Table I-C-II. Male bandwidths — measurements versus predictions from Eqs. (56)-(58) *(p.48)*

Errors are $20\log_{10}(B_m/B_p)$ in dB. $F_{4a}$ = 3400 Hz.

| Vowel | F1 (Hz) | F2 (Hz) | F3 (Hz) | B1 meas (Hz) | B2 meas (Hz) | B3 meas (Hz) | B1 pred (Hz) | B2 pred (Hz) | B3 pred (Hz) | B1 err (dB) | B2 err (dB) | B3 err (dB) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| u | 315 | 605 | 2450 | 63 | 43 | 42 | 57 | 35 | 39 | +1 | +2 | +0.5 |
| o | 410 | 690 | 2600 | 38 | 34 | 40 | 43 | 39 | 54 | -1 | -1 | -2.5 |
| ɔ | 505 | 900 | 2950 | 50 | 44 | 75 | 40 | 43 | 71 | +2 | 0 | +0.5 |
| ɑ | 600 | 1030 | 2700 | 45 | 42 | 100 | 40 | 52 | 86 | +1 | -2 | +1 |
| a | 710 | 1150 | 2700 | 43 | 58 | 100 | 42 | 62 | 104 | 0 | -0.5 | -0.5 |
| æ | 700 | 1430 | 2450 | 37 | 61 | 89 | 42 | 65 | 106 | -1 | -0.5 | -1.5 |
| ɛ | 450 | 1825 | 2425 | 41 | 58 | 119 | 42 | 73 | 96 | 0 | -2 | +2 |
| e | 325 | 1900 | 2450 | 43 | 43 | 155 | 56 | 51 | 92 | -1.5 | -0.5 | +4.5 |
| ɪ | 290 | 2025 | 2875 | 63 | 40 | 145 | 63 | 41 | 120 | 0 | 0 | +1.5 |
| i | 230 | 2000 | 3000 | 72 | 35 | 105 | 86 | 37 | 129 | -1.5 | 0 | -2 |
| y | 245 | 1875 | 2075 | 87 | 75 | 80 | 84 | 86 | 78 | +0.5 | -1 | 0 |
| ʉ | 265 | 1480 | 2060 | 61 | 65 | 40 | 68 | 46 | 56 | -1 | +3 | -3 |
| ø | 400 | 1650 | 2250 | 37 | 57 | 61 | 45 | 52 | 77 | -2 | +1 | -2 |
| œ | 510 | 1150 | 2350 | 32 | 36 | 43 | 40 | 47 | 68 | -2 | -2 | -4 |
| ɵ | 420 | 1000 | 2250 | 38 | 36 | 34 | 36 | 42 | 52 | +0.5 | -1.5 | -3.5 |
| ɜ | 520 | 1500 | 2500 | 29 | 37 | 87 | 39 | 51 | 87 | -2.5 | -2.5 | 0 |

## Table I-C-III. Female bandwidths — measurements versus predictions *(p.49)*

$F_{4a}$ = 3700 Hz; the first term of B1 is increased by 30 %. (The error column header in the scan reads "Hz" but the values are dB, matching Table I-C-II.)

| Vowel | F1 (Hz) | F2 (Hz) | F3 (Hz) | B1 meas (Hz) | B2 meas (Hz) | B3 meas (Hz) | B1 pred (Hz) | B2 pred (Hz) | B3 pred (Hz) | B1 err (dB) | B2 err (dB) | B3 err (dB) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| u | 365 | 690 | 2700 | 96 | 60 | 70 | 56 | 36 | 75 | +4.5 | +4.5 | -0.5 |
| o | 445 | 780 | 2850 | 60 | 48 | 67 | 48 | 41 | 64 | +2 | +1 | 0 |
| ɔ | 610 | 1100 | 2800 | 56 | 49 | 90 | 43 | 53 | 87 | +2 | -0.5 | 0 |
| ɑ | 700 | 1100 | 3000 | 60 | 66 | 114 | 45 | 59 | 111 | +2.5 | +1 | 0 |
| a | 760 | 1360 | 3000 | 44 | 66 | 120 | 46 | 64 | 130 | -0.5 | 0 | -0.5 |
| æ | 730 | 1660 | 2850 | 48 | 67 | 150 | 44 | 66 | 111 | +0.5 | 0 | +2.5 |
| e | 395 | 2200 | 2850 | 50 | 67 | 190 | 52 | 51 | 128 | -0.5 | +2.5 | +3.5 |
| i | 345 | 2060 | 3100 | 55 | 41 | 105 | 61 | 42 | 132 | -1 | 0 | -2 |
| y | 295 | 2000 | 2650 | 71 | 53 | 92 | 73 | 47 | 98 | 0 | +1 | -0.5 |
| ʉ | 305 | 1770 | 2380 | 77 | 59 | 62 | 70 | 48 | 77 | +1 | +1.5 | -2 |
| ø | 410 | 1740 | 2350 | 54 | 59 | 80 | 51 | 53 | 84 | +0.5 | +1 | -0.5 |
| œ | 525 | 1490 | 2600 | 44 | 54 | 75 | 44 | 51 | 87 | 0 | +0.5 | -1 |
| ɵ | 490 | 1240 | 2650 | 46 | 46 | 58 | 45 | 47 | 74 | 0 | 0 | -2 |

Comment *(p.50)*: "The positive error in the [u] domain, i.e. the underestimated B1 and B2, is especially apparent in the female data. It could be that the cavity wall losses become relatively more prominent under these conditions as outlined in the previous section, or that frictional losses become excessive. **The former explanation seems probable.**"

---

## Section 7. Final discussion *(pp.50-51)*

**(1)** The general theory of predicting formant levels and spectrum envelopes from formant frequency proposed by **Fant (1956) and (1960)** requires a predictability of formant bandwidths as an intermediate step. **Eqs. (56-58) allow a prediction of bandwidths of the closed glottis vocal tract from F1, F2, F3, F4 with an average accuracy of 1 dB.** *(p.50)*

**(2)** In real speech the **finite glottis impedance** must be taken into account. As discussed by Fant (1960), any finite glottis impedance conjectured must be interpreted as a **time average over a fundamental glottal period**, whilst the instantaneous value of the bandwidth or damping **during glottal closure would correspond to the ideal minimum**. The extent to which the average glottal dissipation affects the energy level of a formant in speech depends on the extent to which the corresponding resonance **stores energy in the pharynx cavity**. Accordingly *(p.50)*:
- **B1 of any front vowel**, or **B2 of [i] and [u]**, and **B3 of many vowels except [i]** would have to be corrected with varying degrees.
- The correction ultimately depends on the **degree of opening and pressure drop at the glottis**.
- "**A weak breathy voice would account for high damping and a strong effective voice a very small damping through glottis.**"
- A **flow dependent increase of the resistance** is also to be expected in real speech under conditions of extreme articulatory narrowing (Fant, 1960).
- "There remains much work to be done to quantify these effects."

**(3)** To simplify vocal tract computations of the F-pattern (F1, F2, F3, F4) and the associated B-pattern (B1, B2, B3, B4) it is recommended that *(pp.50-51)*:
- **Surface losses (friction and heat conduction) are estimated from overall vocal tract parameters** as an alternative to the more elaborate complex matrix calculations.
- **Radiation losses should be taken into account by the exact procedure.**
- **The effect of the wall mass load and associated losses can be handled by average formulas as a correction of the ideal hard walled tract data.**
- Further work is needed to investigate more precisely the distribution of the wall load. "**A lumped element representation at the glottal end of the line might provide improved accuracy at a suitable level of calculation cost.**"

**(4)** The superposition of sound from the external surface of the vocal tract walls and sound radiated from the mouth has been calculated for a simple tube resonator mass loaded at the glottal end. **The wall output adds a low frequency level increase in the transfer function.** In hyperbaric speech at pressures of the order of **15 ata or more the superposition may give rise to pronounced spectral zeros and a large low frequency boost.** *(p.51)*

---

## Parameters

### Wall / closed-tract parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Closed tract (wall) resonance, male | F_W | Hz | 175 | 150-200 | 28, 30, 41 | 150-180 Hz Fant and Sonesson 1964; 180-200 Hz Fant and Lindqvist 1968; 175 Hz adopted in Eq. (45) |
| Closed tract resonance used in single-tube worked example | F_W | Hz | 180 | - | 33, 38 | Used for x_W = 0.56 and the 530 Hz F1 result |
| Closed tract resonance bandwidth (wall damping), male | B_W0 | Hz | 100 | 75-100 | 30, 41, 44 | Eq. (45) normalization; 85-100 Hz stated on p.41; 100 Hz used in Table I-C-I |
| Extrapolated limiting B1 at F_W | B_1 | Hz | 85 | - | 39 | From Fujimura-Lindqvist Fig. I-C-4 |
| Normalized wall-mass constant | x_W | - | 0.56 | - | 33 | 2*pi*F_W/(4*F1) with F_W=180, F1=500 |
| Wall-mass shunt factor at pressure P | 0.32*P | - | 0.32 | - | 33 | x_W squared, Eq. (23) |
| Voiced-occlusion closed tract frequency, /b/ in [ʉ] | F_W | Hz | 189 | - | 29 | Fujimura and Lindqvist 1971 |
| Voiced-occlusion closed tract frequency, /b/ in [u] | F_W | Hz | 204 | - | 29 | Fujimura and Lindqvist 1971 |
| Voiced-occlusion bandwidth, /b/ in [ʉ] | B | Hz | 73 | - | 29 | Fujimura and Lindqvist 1971 |
| Voiced-occlusion bandwidth, /b/ in [u] | B | Hz | 62 | - | 29 | Fujimura and Lindqvist 1971 |
| Female B1 excess over male | - | % | 25 | - | 39 | Fig. I-C-4 trend |
| Female wall-term scaling in Eq. (56) | - | % | +30 | - | 47 | Equivalent to a 14 % higher F_W |
| Back cavity volume of [u] | V_2 | cm³ | 31 | - | 46 | Double Helmholtz analysis |
| Overall vocal tract volume | V | cm³ | 100 | - | 46 | Double Helmholtz analysis |
| Back cavity closed tract resonance of [u] | - | Hz | 315 | - | 46 | 175*(100/31)^(1/2) |
| Tongue hump coupling of [u] | l2/A2 | cm^-1 | 4.2 | - | 46 | Gives F2i = 495 Hz, F2 = 590 Hz |

### Loss / bandwidth model parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Radiation baffle factor | K_s(f) | - | 1.4 | 1-2 | 32, 44 | 1 = point source / zero frequency, 2 = infinite baffle; 1.4 representative for speaking |
| Cross-section shape factor | S_A | - | 2 | 1-2 | 41 | 1 for circular, 2 for ellipse of width:height = 9; 2 adopted for all calculations |
| Heat conduction to friction damping ratio | alpha_G/alpha_R | - | 0.45 | - | 42 | Eq. (51) |
| Friction bandwidth coefficient | - | Hz | 13 | - | 42 | B_R = 13*(f/1000A)^(1/2)*S_A |
| Friction + heat conduction coefficient | - | Hz | 18.5 | - | 42 | B_RG = 18.5*(f/1000A)^(1/2) |
| Radiation bandwidth coefficient, single tube | - | Hz | 29 | - | 44 | Normalized at f = 1500 Hz, A = 8 cm², l_e = 17.6 cm |
| Radiation bandwidth coefficient, two-tube | - | Hz | 90 | - | 44 | Eq. (55) |
| Reference tube length for radiation | l_e | cm | 17.6 | - | 44, 45 | Standard neutral vowel |
| Reference mouth area for radiation | A | cm² | 8 | - | 44 | In Eq. (54) normalization |
| Area function quantization step | delta x | cm | 0.5 | - | 45 | For defining radiation area A_0 |
| Lip end correction coefficient | - | - | 0.8 | - | 34 | delta l_0 = 0.8*(A_0/pi)^(1/2) |
| Neutral tube length | l | cm | 17.5 | - | Fig. I-C-2 | Frequency axis calibration |
| Male average F4 | F_4a | Hz | 3400 | - | 47 | Used in Eq. (58) |
| Female average F4 | F_4a | Hz | 3700 | - | 47 | Used in Eq. (58) |
| B1 wall-loss term coefficient | - | Hz | 15 | - | 47 | 15*(500/F1)^2 in Eq. (56) |
| B1 surface-loss term coefficient | - | Hz | 20 | - | 47 | 20*(F1/500)^(1/2) in Eq. (56) |
| B1 radiation-loss term coefficient | - | Hz | 5 | - | 47 | 5*(F1/500)^2 in Eq. (56) |
| B2 constant term | - | Hz | 22 | - | 47 | Eq. (57) |
| B2 F1-dependent term coefficient | - | Hz | 16 | - | 47 | 16*(F1/500)^2 in Eq. (57) |
| B2 F3-F2 proximity coefficient | - | Hz² | 12000 | - | 47 | 12000/(F3-F2) in Eq. (57) |
| B3 F1-dependent term coefficient | - | Hz | 25 | - | 47 | 25*(F1/500)^2 in Eq. (58) |
| B3 F2-dependent term coefficient | - | Hz | 4 | - | 47 | 4*(F2/500)^2 in Eq. (58) |
| B3 F4-F3 proximity coefficient | - | - | 10 | - | 47 | 10*F3/(F4a-F3) in Eq. (58) |

### Empirical bandwidth ranges

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Formant bandwidth below 2000 Hz | B | Hz | - | 30-70 | 39 | Fant 1961 sweep-tone data |
| Male B1 minimum | B1 | Hz | 37 | 35-40 | Fig. I-C-4 | Around F1 = 450-550 Hz |
| Male B1 at F1 = 200 Hz | B1 | Hz | 78 | - | Fig. I-C-4 | |
| Female B1 plateau | B1 | Hz | 46 | 46-47 | Fig. I-C-4 | F1 = 500-800 Hz |
| Female B1 at F1 = 250 Hz | B1 | Hz | 90 | - | Fig. I-C-4 | |
| B2 minimum for [i] | B2 | Hz | 30 | - | 47 | When F2 and F3 both high and not close |
| Mean prediction error, Eqs. (56-58) | - | dB | 1 | - | 47, 50 | 2 dB for male B3 |
| Approximation error vs exact matrix, B2/B3 | - | Hz | 4.5 | - | 44 | Mean error |

---

## Effect Sizes / Key Quantitative Results

| Outcome | Measure | Value | Population/Context | Page |
|---------|---------|-------|--------------------|------|
| F1 shift from wall mass, lumped at glottal end | Relative increase | +12 % (500 to 560 Hz) | Neutral single tube, F_W = 180 Hz | 34 |
| F1 shift from wall mass, uniformly distributed | Relative increase | +6 % (500 to 530 Hz) | Neutral single tube, F_W = 180 Hz | 38 |
| F2 shift from wall mass | Absolute | 11 Hz | Neutral single tube | 38 |
| F1 with F_1i = 300 Hz, F_W = 150 Hz | Absolute | 335 Hz | Eq. (1) | 28 |
| Wall-radiation superposition low-frequency boost | Level | +2.4 dB | 1 ata, neutral tract | 34 |
| Wall-radiation superposition minimum | Level | -0.6 dB at 1500 Hz | 1 ata, neutral tract | 34 |
| Wall-radiation superposition boost at 15 ata | Level | +15 dB, zero at 1500 Hz | Hyperbaric speech | 34, 51 |
| F_W multiplier at 40 ata | Ratio | 6.3 (to 1100 Hz from 175 Hz) | Divers at 1200 feet | 30 |
| Wall bandwidth contribution at F1 = 350 Hz | Absolute | 21 Hz (= 85/4) | Male, F_W = 175 Hz | 39 |
| Extra B2 for [u] from back-cavity wall loss | Absolute | +20 Hz (28 minus 8) | Double Helmholtz model | 46 |
| Radiation contribution to B3 of [i], exact | Absolute | 190 Hz | Table I-C-I | 43, 44 |
| Radiation contribution to B2 of [i], exact | Absolute | 2 Hz | Table I-C-I | 43, 44 |
| Mean prediction error of Eqs. (56-58) | dB (20 log Bm/Bp) | ~1 dB | Male and female Swedish vowels | 47, 50 |
| Mean prediction error, male B3 | dB | 2 dB | Male Swedish vowels | 47 |

---

## Testable Properties

- $F^2 = F_i^2 + F_W^2$ for every resonance: adding the wall mass shunt raises every formant, and the raise is largest where $F_i$ is smallest. *(p.37, Eq. 36)*
- Wall bandwidth falls as $1/F^2$: $B_W = B_{W0}(175/F)^2$, so $B_W$ is negligible above about 1000 Hz. In Table I-C-I $B_W$ is exactly 0 for F3 of every vowel. *(pp.41, 43)*
- Friction plus heat conduction bandwidth grows as $\sqrt{f}$ and as $1/\sqrt{A}$: $B_{RG} = 18.5\sqrt{f/(1000A)}$. *(p.42)*
- When a resonance is tuned by neck area alone, the friction bandwidth instead scales as $f^{-1/2}$. *(p.42)*
- Radiation bandwidth grows as $f^2$ and linearly with mouth area, and inversely with tube length: $B_0 \propto f^2 A / \ell_e$. *(p.44)*
- Total bandwidth is the sum $B = B_W + B_R + B_G + B_0$. *(p.40, Eq. 44)*
- Each loss mechanism enters weighted by the squared ratio of its characteristic frequency to the actual formant frequency: $B = B_W (F_W/F)^2 + B_R (F_i/F)^2 + B_G$. *(p.37, Eq. 37)*
- Bandwidths below 2000 Hz lie in 30-70 Hz; above 2000 Hz they rise approximately as $f^2$. *(p.39)*
- B1 versus F1 is U-shaped for males with a minimum near F1 = 450-550 Hz, and monotone-decreasing-to-plateau for females. *(Fig. I-C-4)*
- Female B1 exceeds male B1 by about 25 % in the low-F1 region. *(p.39)*
- $B_3 > B_1, B_2$ in unrounded front, neutral, and open back vowels; $B_3 < B_1, B_2$ in extreme rounded [u] and [ʉ]. *(p.40)*
- $B_1 > B_2$ in vowels of maximally low F1 ([u], [i], [y], female [ʉ]). *(p.40)*
- Eqs. (56-58) predict measured closed-glottis bandwidths to within about 1 dB on average. *(pp.47, 50)*
- $\alpha_G = 0.45\,\alpha_R$: heat conduction contributes 45 % as much damping as viscous friction. *(p.42, Eq. 51)*
- $F_W$ scales as $\sqrt{P}$ with ambient pressure and is nearly independent of gas mixture, while all other formants scale with $c/c_0$. *(pp.29-30)*
- The shape factor $S_A$ is bounded: 1 for a circular cross-section, 2 for a 9:1 ellipse. *(p.41)*
- The radiation baffle factor $K_s$ is bounded in [1, 2]. *(pp.32, 44)*

---

## Limitations (author-acknowledged)

- **The $\alpha$-terms of Eq. (27) are probably not independent of $A(x)$, which limits the validity of the bandwidth derivation from Eq. (37).** *(p.37)*
- Eq. (36) requires $S(x)/(A(x)d(x))$ = const, an assumption about wall thickness scaling that is not directly measured. *(p.37)*
- "We still lack data on the particular mass distribution along the tract, how it varies with particular articulations." *(p.39)*
- The $\ell_e$ and $A_0$ conventions **underestimate front cavity damping**, but are needed to avoid excessive radiation damping of interior standing wave modes such as F2 of [i]. *(p.45)*
- Eq. (54) applies badly to standing wave resonances in semi-closed systems. *(p.44)*
- The main error in the approximate radiation loss calculation is in B2 and B3 of [i] and B3 of [u] and [ɑ]. *(p.45)*
- Approximate B2 values come out too high on average, exact B2 values too low. The low calculated B2 of [u] suggests friction or wall losses occasionally matter more than anticipated. *(p.45)*
- The spread in human data is large and each measured value is the mean of only two subjects with one or two determinations per sound. *(pp.45, 47)*
- The $(F_i/F)^2$ factor applied to $B_R$ was omitted from Table I-C-I because the calculations ignored wall mass-loading. *(p.44)*
- **All predictions are for the closed-glottis condition.** Real speech requires a finite glottis impedance correction that is not quantified here: "There remains much work to be done to quantify these effects." *(p.50)*
- The positive prediction error for [u] (underestimated B1 and B2) is especially apparent in the female data. *(p.50)*

---

## Arguments Against Prior Work

- **Flanagan (1965)** also derived wall effects via a correction in the velocity of sound, "but the numerical values of frequency shifts he reports are **not representative**." *(p.38)*
- The **infinite-baffle radiation extreme $K_s = 2$** "apparently provides too large measures", so 1.4 is used instead. *(p.44)*
- Measuring $F_W$ from spectrograms of voiced occlusions is "rather inaccurate"; the sine-wave / sweep-tone response is the direct method. *(p.28)*
- Electronic "unscramblers" for divers' speech are "much limited" because at depth all vowels collapse to the same F1; complete phoneme recognition and re-synthesis would be needed. *(p.30)*
- Fujimura and Lindqvist (1971) ascribe the higher female B1 to thinner cavity walls; Fant offers the alternative that female cavities have a smaller $A(x)/S(x)$ ratio from smaller cross-section dimensions. *(pp.39-40)*
- The standard wall formula Eq. (45) underestimates the wall damping of B2 of [u] by about a factor equal to the ratio of total volume to back cavity volume (about 3). *(p.46)*

---

## Design Rationale

- **Posterior placement of the lumped wall mass** is chosen over an anterior location, justified by anatomical considerations and measurements of vibrational amplitude on the surface of the head and throat. *(pp.32-33)*
- **Laurent's (1964) indirect frequency transformation** is chosen over direct complex matrix solution so that wall effects and damping can be derived as **correction terms added to the loss-less, infinite-wall-impedance case**. *(p.34)*
- **$S_A = 2$ adopted for all calculations** because narrow constrictions approximate a 9:1 ellipse and because friction is probably greater than in hard-walled ideal structures. *(p.41)*
- **The effective area $A_e$ is the harmonic mean of $A(x)$**, not an arbitrary constant, so that one number characterizes each vowel across all modes. *(p.42)*
- **$K_s = 1.4$** chosen as an average intermediate between the point-source and infinite-baffle extremes. *(pp.32, 44)*
- **Radiation area $A_0$** defined as the mean of the two smallest areas in the three most anterior 0.5 cm sections, deliberately conservative to prevent runaway radiation damping on interior standing wave modes. *(p.45)*
- **Recommended computational split**: approximate formulas for surface losses, exact calculation for radiation losses, average formulas as a correction for wall mass load. *(pp.46, 50-51)*
- Radiation inductance folded into an **end correction** $\Delta\ell_0 = 0.8\sqrt{A_0/\pi}$ rather than modelled as a separate element, valid while the correction is short relative to wavelength. *(p.34)*

---

## Relevance to Project

This is the primary source behind the bandwidth model used by essentially every later formant and source-filter synthesizer. Three things are directly implementable:

1. **The F-pattern-only bandwidth predictor, Eqs. (56)-(58).** Given F1, F2, F3, and a speaker-average F4 (3400 Hz male, 3700 Hz female), it yields B1, B2, B3 to within about 1 dB of measured spectral peak level. This requires no area function and no articulatory model, so it drops straight into a formant synthesizer that already tracks an F-pattern. The female variant needs only two changes: scale the B1 wall term by 1.3 and set F4a = 3700 Hz.
2. **The physically decomposed budget, Eqs. (44), (45), (52), (54).** If the synthesizer has an area function or tube model, the four terms can be computed separately: wall loss falling as 1/F², surface loss rising as sqrt(f/A), radiation loss rising as f²A/l_e. This gives a principled way to make bandwidths track articulation rather than being fixed per formant.
3. **The wall-mass frequency correction, F² = F_i² + F_W².** Any hard-wall tube or area-function resonance calculation must add F_W ≈ 175-180 Hz in quadrature. This is a 6-12 % F1 shift and only about 11 Hz on F2. Without it, low-F1 vowels and voiced stops come out flat.

The paper also supplies validation data: Tables I-C-II and I-C-III give 29 vowels with measured F1-F3 and B1-B3 for male and female Swedish speakers, usable as a regression test fixture for any bandwidth implementation.

Two cautions for implementation. All values are **closed-glottis**; real phonation adds glottal damping that varies with voice quality (breathy voice raises damping substantially, pressed voice lowers it), and Fant explicitly leaves this unquantified. And Eq. (58) as printed reads `10*F3*(F4a - F3)`, which is dimensionally wrong for a Hz result; the intended form is almost certainly `10*F3/(F4a - F3)`, which reproduces the tabulated predictions and matches the stated interpretation that B3 rises as F3 approaches F4.

---

## Open Questions

- [ ] Confirm the intended form of the third term of Eq. (58) by numerically reproducing the Table I-C-II B3 predictions; the printed form appears to be a typographic error for a quotient.
- [ ] Eq. (13) is printed as `1/29` where `1/(2*pi)` is required; verify against Fant (1960).
- [ ] The distribution of wall mass along the tract is unknown; Fant suggests a lumped element at the glottal end as a cheap improvement. What does a two-element (glottal lump plus distributed remainder) model give?
- [ ] How should the closed-glottis bandwidths be corrected for voice quality in a synthesizer? Fant gives the direction (breathy = more damping) but no numbers.
- [ ] Does the B_W0 = 100 Hz value hold for child voices, and how does the 30 % female wall-term scaling extrapolate?
- [ ] The [u] double-Helmholtz correction adds roughly a factor (total volume / back cavity volume) to B_W of F2. Can this be generalized to a rule for any two-cavity configuration?

---

## Related Work Worth Reading

- **Fant, G. (1960): Acoustic Theory of Speech Production** — the source of Eqs. (46)-(50), (54), the surface loss treatment (pp. 32-33, 136, 303-311), the double Helmholtz model of [u] (pp. 116, 121), the matrix technique (pp. 37-41), and the semi-closed radiation result (Eq. A.36-21). Essential companion.
- **Fujimura, O. and Lindqvist, J. (1971): "Sweep-Tone Measurements of Vocal-Tract Characteristics", JASA 49, 541-558** — the experimental bandwidth data all of Section 4 and Tables I-C-II/III rest on.
- **Fant, G. (1956): "On the Predictability of Formant Levels and Spectrum Envelopes from Formant Frequencies"** — the framework that makes bandwidth prediction the enabling intermediate step for spectrum envelope synthesis.
- **House, A.S. and Stevens, K.N. (1958): "Estimation of Formant Band Widths from Measurements of Transient Response of the Vocal Tract"** — independent corroboration of the bandwidth magnitudes.
- **Ichikawa, A. and Nakata, K. (1971): "Vocal Tract Resonances with Losses"** — demonstrates the constriction-position dependence of radiation loss that Fant flags as the main source of B3 variability.
- **Sondhi, M.M. and Gopinath, B. (1971): "Determination of the Shape of a Lossy Vocal Tract"** — uses the same class of frequency transformation.
