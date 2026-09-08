---
title: "Nonlinear source–filter coupling in phonation: Theory"
authors: "Ingo R. Titze"
year: 2008
venue: "The Journal of the Acoustical Society of America, 123(5), 2733–2749"
doi_url: "https://doi.org/10.1121/1.2832337"
pages: "2733–2749"
affiliation: "Department of Speech Pathology and Audiology, The University of Iowa, Iowa City, Iowa 52242; National Center for Voice and Speech, The Denver Center for the Performing Arts, Denver, Colorado 80204"
pacs: "43.70.Bk, 43.75.Rs"
---

# Nonlinear source–filter coupling in phonation: Theory

*(NOTE: notes written incrementally while reading page images; printed page 2733 = PDF page-000, so printed page = PDF index + 2733.)*

## One-Sentence Summary
Titze develops a quantitative theory of nonlinear (bidirectional) coupling between the glottal source and the vocal tract filter, showing that the epilarynx tube cross-sectional area is the primary regulator of coupling strength, that inertive supraglottal reactance and compliant subglottal reactance reinforce vocal fold vibration, and that harmonics crossing formants produce bifurcations (F0 jumps, subharmonics, chaos) that linear source–filter theory cannot predict. *(p.2733)*

## Problem Addressed
Classical linear source–filter theory assumes the glottal source is independent of the vocal tract; convolution/multiplication then applies and the filter can only amplitude- and phase-shape the existing source frequencies. It cannot create new frequencies or change the source's overall energy. This assumption fails for female, child, and singing voice, where low harmonics cross the formants and the source is strongly loaded by the tract. Linear theory also cannot predict F0 jumps, subharmonics, or chaotic vibration observed experimentally. *(p.2733)*

## Key Contributions
- Identifies **epilarynx tube (laryngeal vestibule) cross-sectional area $A_e$** as the primary control parameter for coupling degree; narrowing it raises supraglottal input impedance and hence coupling. *(p.2733, 2737)*
- Defines an explicit **coupling parameter $a_g/A^*$** falling out of the closed-form wave-reflection flow solution. *(p.2736)*
- Shows harmonic distortion frequencies are created **by the vocal tract acting on the flow**, i.e. genuinely nonlinear, not merely by vocal fold collision. Collision is not necessary to produce source harmonics. *(p.2736)*
- Argues stable harmonic spectra in voice come **not** from tuning harmonics to resonances (as in wind instruments) but from **placing harmonics into favorable reactance regions** (below the resonance frequency, in inertive territory). *(p.2733, 2739)*
- Establishes two levels of interaction: **Level 1** (flow pulse depends on sub/supraglottal pressures, vibration unchanged) and **Level 2** (mode of vibration itself depends on tract reactance). *(p.2735, 2739)*
- Provides a four-case taxonomy of intraglottal driving pressure (inertive/compliant × subglottal/supraglottal). *(p.2740)*

## Methodology
Combination of (a) analytical lumped-element/impedance treatment of the glottis loaded by subglottal and supraglottal impedances, (b) closed-form solution of the glottal flow in a **wave-reflection (Kelly–Lochbaum) analog** of the airway, and (c) simulation with a self-oscillating vocal fold model driven through a 44-section uniform (and later realistic MRI-derived) vocal tract with energy losses and a radiation impedance. Reactance curves computed with **cascade transmission line matrices** after Sondhi and Schroeter (1987), developed further by Story *et al.* (2000). *(p.2735)*

## Section II: Interaction based on vocal tract reactance

Because the vocal tract is short relative to a wavelength at speech F0 (at F0 = 200 Hz the tract holds < 1/8 wavelength), and because a talker must produce all phonetic variation, the tract shape cannot be adjusted to resonate many source frequencies simultaneously. This is the structural difference from woodwinds/brasses. *(p.2735)*

Apparent "formant-harmonic tuning" in high soprano singing (Sundberg 1977; Joliveau *et al.* 2004) on close inspection has **F0 slightly less than F1**; exact tuning of F1 to a harmonic occurs only in overtone singing (Rachele 1996). At very high F0 oscillation can occur with F0 > F1, which the paper attributes to a falsetto-like vibration regime. *(p.2735)*

For low-pitched speech/singing the dominant source harmonics (F0 through 3F0) lie below F1. Example: a bass/baritone on G2 (98 Hz) reaches F1 of /i/ or /u/ only with the third harmonic; for /a/ harmonics above the seventh are needed. *(p.2735)*

### A. Level 1 interaction: flow pulse dependency on sub- and supraglottal pressures
Vocal fold vibration is not significantly disturbed by oscillating pressures, but the glottal *flow* is. This level occurs in all speech. All harmonics below F1 experience positive (inertive) reactance from the vocal tract. *(p.2735)*

For the uniform configuration of Fig. 1: supraglottal reactance is positive (inertive) 0–500 Hz and negative (compliant) 500–1000 Hz; subglottal reactance stays inertive up to 600 Hz. *(p.2735)*

Inertive reactance skews the flow pulse (delays its peak relative to the glottal area), whether subglottal ($X_1$) or supraglottal ($X_2$). *(p.2735)*

## Key Equations

Supraglottal (epilarynx tube) input pressure:
$$
P_e = Z_2 U_g
$$
Where: $U_g$ = complex (Fourier-transformed) glottal flow; $Z_2$ = complex supraglottal input impedance; $P_e$ = vocal tract input pressure. *(p.2736)*

Subglottal pressure:
$$
P_s = Z_1(-U_g)
$$
Where: $Z_1$ = subglottal input impedance. The sign reflects flow leaving the subglottal system. *(p.2736)*

Transglottal pressure in the frequency domain (impedances add algebraically in complex form to give the effective glottal load):
$$
P_s - P_e = -(Z_1 + Z_2)U_g = -(R_1 + R_2)U_g - i(X_1 + X_2)U_g
$$
Where: $R_1, R_2$ = subglottal and supraglottal resistances; $X_1, X_2$ = corresponding reactances; $i = \sqrt{-1}$. Note $X_1 + X_2$ need not be symmetric about zero because subglottal and supraglottal peaks are at different frequencies. *(p.2736)*

Aerodynamic (incompressible, quasi-steady) transglottal pressure:
$$
P_s - P_e = k_t \tfrac{1}{2}\rho u_g^2 / a_g^2
$$
Where: $k_t$ = empirically determined transglottal pressure coefficient, average $\approx 1.1$ (Scherer *et al.* 1983; Alipour and Scherer 2007; Fulcher *et al.* 2006); $\rho$ = air density; $u_g(t)$ = time-dependent flow; $a_g(t)$ = time-varying glottal area. This equation is nonlinear in $u_g$, cannot easily be Fourier transformed, so Eqs. (3) and (4) cannot be equated directly. *(p.2736)*

**Closed-form glottal flow in the wave-reflection analog (central result):**
$$
u_g = \frac{a_g c}{k_t}\left\{-\left(\frac{a_g}{A^*}\right) \pm \left[\left(\frac{a_g}{A^*}\right)^2 + \frac{4k_t}{\rho c^2}\left(p_s^+ - p_e^-\right)\right]^{1/2}\right\}
$$
Where: $c$ = sound velocity; $A^*$ = equivalent vocal tract area; $p_s^+$ = incident partial-wave pressure arriving from the subglottis; $p_e^-$ = incident partial-wave pressure arriving from the supraglottis. This equation is critical because it defines explicitly the **coupling parameter $a_g/A^*$**. *(p.2736)*

Equivalent vocal tract area (parallel combination of the two entry areas):
$$
A^* = \frac{A_s A_e}{A_s + A_e}
$$
Where: $A_s$ = subglottal entry area; $A_e$ = supraglottal (epilaryngeal) entry area. *(p.2736)*

**Strong-coupling limit** ($a_g/A^*$ small): flow becomes directly proportional to glottal area:
$$
u_g = a_g\left[\frac{4(p_s^+ - p_e^-)}{k_t \rho}\right]^{1/2}
$$
*(p.2736)*

**Linear (noninteractive) asymptotic condition** — constant subglottal pressure ($P_s = p_s^+(1+r) = 2p_s^+ = P_L$ with reflection coefficient +1) and $p_e^- = 0$:
$$
u_g = a_g\left[\frac{2P_L}{k_t\rho}\right]^{1/2}
$$
Where: $P_L$ = lung pressure. For linear coupling the relative phase delays between $p_s^+$ and $p_e^-$ due to wave propagation are what make $u_g$ non-proportional to $a_g$. *(p.2736)*

### Level-1 findings (Figs. 1–4)
- Skewing of the flow pulse from overall inertive reactance **produces new harmonic frequencies in the glottal airflow that are not present in the glottal area waveform** — this is the nonlinearity. *(p.2736)*
- Previous analyses underestimated skewing because the exact epilarynx geometry was unknown; Story's (1995, 2005) MRI area functions are the key validating data sets. *(p.2736)*
- Fig. 1 (weak coupling, $A_e = 3.0$ cm²): sinusoidal $a_g$ (single spectral line) yields a slightly skewed flow with a full harmonic spectrum, spectral slope about **−15 dB/octave**. Harmonics 3 and 4 sit in negative (compliant) reactance and are depressed relative to harmonics 2 and 5. *(p.2736)*
- Explanation of amplitude depression: compliant (negative) reactance integrates downstream flow and builds an opposing back pressure that reduces flow at that frequency. If negative reactance were present at all frequencies the pulse would skew to the *left*. *(p.2737)*
- Fig. 2 (stronger coupling, $A_e = 0.5$ cm²): input impedance scales as $\rho c / A_e$ (characteristic acoustic impedance of the first tube section). Coupling parameter $a_g/A^*$ rose from **0.1 to 0.35**. Mean $a_g$ held at 0.15 cm², subglottal area held at 3.0 cm², so glottal source impedance unchanged. Combined reactance shifts upward: negative reactance occurs only between **600 and 800 Hz** over 0–1500 Hz. Spectral slope flattens to about **−10 dB/octave**. *(p.2737)*
- With stronger coupling an apparent "closed phase" appears in the flow waveform **even though there was no glottal closure** ($a_g$ sinusoidal and always > 0). This undercuts inferring vocal fold vibration patterns from inverse-filtered glottal flow in terms of open/closed phase. Rothenberg and Zahorian (1977) showed inverse filtering to get glottal area from mouth flow is fundamentally nonlinear; linear prediction cannot do it. *(p.2737)*
- The fourth harmonic, previously in negative territory, moves to about zero reactance and gains strength, producing visible ripple in the flow waveform. *(p.2737)*

### F0-glide experiments (Figs. 3, 4)
- **Fig. 3 (control, no interaction):** F0 glide 2000 → 100 → 2000 Hz over 8 s with a purely sinusoidal $u_g$ derived from a sinusoidal $a_g$ via Eq. (8). Glottal area amplitude programmed to vary inversely with the square root of frequency to approximate realistic vibration amplitudes; flow envelope peaks at 4.0 s. **No harmonic distortion frequencies are created.** Radiated pressure $P_o$ increases near 0.6 s (F0 through F2) and near 3.0 s (F0 through F1). Radiation asymmetry: 2000 Hz gives greater $P_o$ than 100 Hz even though peak glottal flow was 0.2 vs 0.8 l/s. *(p.2738)*
- Reactance fluctuation in the F3/F4 region (~3000 Hz) is so large that subglottal reactance is barely visible on the same scale; attributed to the **epilarynx tube establishing its own quarter-wave resonance at 2500–3000 Hz** (Titze and Story, 1997). *(p.2738)*
- **Fig. 4 (interactive, $A_e = 0.5$ cm²):** extra harmonics $2F_0$ through $4F_0$ appear in $u_g$ purely from tract coupling. Harmonics are reinforced where reactance is positive (left of the formant center), and **diminished at the formants**, where reactance switches suddenly from positive to slightly negative. Flow envelope shows valleys at 0.8 and 3.0 s. Peak-to-valley ripple in $P_o$ is **less severe** than in the linear control because the dips in $u_g$ at the formants partially cancel the increased transmission through the tract at formants (Rothenberg, 1987). *(p.2738)*
- **Net effect of level 1 nonlinear formant–harmonic coupling: it distributes acoustic energy over the entire spectrum rather than accentuating it at the center of a formant.** *(p.2738)*
- Strategy implication: rather than tuning several harmonics to tube resonances (musical-instrument design), a vocalist reinforces a **cluster** of harmonics with favorable reactance, placing as many harmonics as possible on the **lower-frequency side of a formant** (below the resonance). *(p.2738)*
- Fig. 5 example (male high voice, F4 to B-flat4, /U/ vowel): only the subglottal reactance is negative in the $2F_0$ range. A combination of **compliant (negative) subglottal reactance and inertive (positive) supraglottal reactance provides ideal reinforcement of vocal fold vibration** — so a level-1 loss can be recovered as a level-2 gain. This is why certain vowels are favored at certain pitches, and it gives articulatory freedom because source and filter frequencies need not match exactly. *(p.2739)*

## Section II.B: Level 2 interaction — mode of vibration depends on tract reactance

Supraglottal reactance is generally most favorable when **inertive (positive)**; subglottal reactance is sometimes more favorable when **compliant (negative)**. The complicating factor is glottal geometry, in direct analogy to Fletcher's (1993) classification of inward-, outward-, and lateral-striking valves that self-sustain oscillation in a pipe. An added complexity not in Fletcher: vocal folds propagate a **surface wave** in tissue, changing the valve shape dynamically. *(p.2739)*

**Mean intraglottal driving pressure (Titze, 1988):**
$$
P_g = P_s\left(1 - \frac{a_2}{a_1}\right) + P_e \frac{a_2}{a_1}
$$
Where: $P_g$ = mean (entry to exit) intraglottal driving pressure on the vocal fold surface; $P_s$ = subglottal pressure; $P_e$ = supraglottal (epilarynx tube) input pressure; $a_1$ = glottal entry area (lower margin of the vibrating portion); $a_2$ = glottal exit area (upper margin). Derivation assumptions: Bernoulli energy conservation for the intraglottal pressure profile, glottal area varying linearly from bottom to top, $P_e$ as the only pressure recovery at glottal exit, and transglottal pressure coefficient set to 1.0. See Titze (1988), p. 1542. *(p.2739)*

As a valve the vocal folds are closest to Fletcher's **(+,+) case**: tissue moves laterally with both increasing subglottal pressure (first +) and increasing supraglottal pressure (second +). Intraglottal pressure is greater for a **convergent** glottis than for a divergent one. Even with constant $P_s$ and $P_e = 0$, an alternating push–pull pressure is created by an $a_2/a_1$ ratio less than 1.0 for lateral movement and greater than 1.0 for medial movement. **Vocal tract interaction is therefore an important but not a necessary condition for self-sustained oscillation.** *(p.2740)*

### Registers and prephonatory shape (Fig. 6, after Hirano 1975)
- **Modal register** (Fig. 6a): vibration over much of the vocal fold thickness, entry area $a_1$ low in the glottis. Prephonatory shape is both convergent ($a_2 < a_1$) and divergent ($a_2 > a_1$) during the cycle. Produced when the thyroarytenoid (TA) muscle contracts, thickening and bulging the lower vocal fold and "squaring up" the glottis. *(p.2740)*
- **Falsetto register** (Fig. 6b): vibration confined mainly to the upper portion, $a_1$ much higher in the glottis; shape mainly **divergent** ($a_2 > a_1$). Produced when TA is relaxed: the bottom retracts, only the top is engaged, medial surface more rounded. The vocal ligament handles adductory positioning and tensing. *(p.2740)*
- The point where vibration effectively begins vertically is the **mucosal upheaval point** (Yumoto and Kadota, 1998). *(p.2740)*

### Idealized reactive tract pressures (lossless, neglecting resistance and steady pressures)
$$
P_s = -I_1 \frac{du}{dt} \quad \text{(inertive subglottal tract)}
$$
*(p.2740)*

$$
P_s = P_1 - \frac{1}{C_1}\int u\,dt \quad \text{(compliant subglottal tract)}
$$
*(p.2740)*

$$
P_e = +I_2 \frac{du}{dt} \quad \text{(inertive supraglottal tract)}
$$
*(p.2740)*

$$
P_e = P_2 + \frac{1}{C_2}\int u\,dt \quad \text{(compliant supraglottal tract)}
$$
Where: $I_1, I_2$ = subglottal and supraglottal acoustic inertances; $C_1, C_2$ = subglottal and supraglottal acoustic compliances; $P_1, P_2$ = constants of integration; $u$ = flow. *(p.2740)*

### Four forms of the intraglottal driving pressure
$$
P_g = -I_1\left(1 - \frac{a_2}{a_1}\right)\frac{du}{dt} + I_2\frac{a_2}{a_1}\frac{du}{dt} \quad \text{(inertive–inertive)}
$$
*(p.2740)*

$$
P_g = P_1 - \frac{1}{C_1}\left(1 - \frac{a_2}{a_1}\right)\int u\,dt + I_2\frac{a_2}{a_1}\frac{du}{dt} \quad \text{(compliant–inertive)}
$$
*(p.2740)*

$$
P_g = -I_1\left(1 - \frac{a_2}{a_1}\right)\frac{du}{dt} + P_2 + \frac{1}{C_2}\frac{a_2}{a_1}\int u\,dt \quad \text{(inertive–compliant)}
$$
*(p.2740)*

$$
P_g = P_1 - \frac{1}{C_1}\left(1 - \frac{a_2}{a_1}\right)\int u\,dt + P_2 + \frac{1}{C_2}\frac{a_2}{a_1}\int u\,dt \quad \text{(compliant–compliant)}
$$
*(p.2741)*

These four cases correspond to Fletcher's (1993) four cases. Fig. 7 gives acoustic circuit diagrams: inertance as coils $I_1, I_2$, compliance as parallel plates $C_1, C_2$, following electric-circuit symbolism for inductance and capacitance. *(p.2741)*

### The push–pull criterion (central design rule)
For maximum reinforcement of vocal fold vibration, the driving pressure $P_g$ must provide an alternating **push–pull** on the tissue: a push when the glottis is opening and a pull when it is closing. Formally: **when $du/dt$ is positive (flow increasing during glottal opening), $P_g$ should be positive; when $du/dt$ is negative (flow decreasing during closing), $P_g$ should be negative.** *(p.2741)*

### Case-by-case evaluation *(p.2741–2742)*
- **Inertive–inertive** (Eq. 14, Fig. 7a): both coefficients in front of $du/dt$ must be positive, which requires $a_2/a_1 > 1.0$ over most of the open portion, i.e. a **mainly divergent** glottis. Falsetto register provides this readily (the top of the folds spreads apart slightly). For modal register, the divergent configuration occurs over a smaller fraction of the cycle, prior to closure, but maximum pressures occur in that fraction, yielding strong pulse-like excitation. Therefore **subglottal inertance $I_1$ both helps and hinders in modal register, while supraglottal inertance $I_2$ always provides the favorable push–pull condition for both registrations and both glottal configurations.** *(p.2741)*
- **Compliant–inertive** (Eq. 15, Fig. 7b): **most favorable for vocal fold vibration in modal register.** If the glottis is mostly convergent with divergence only over a small fraction of the cycle prior to closure, the flow integration in Eq. (15) produces a steady decrease of intraglottal pressure over the open portion (because $a_2 < a_1$). That gradual decrease (stronger during opening, weaker during closing) adds to the dominant push–pull from the inertive supraglottal tract. Tongue-tip trills (McGowan, 1992) are likewise sustained by an upstream compliant reactance (there a wall compliance rather than an air compliance). *(p.2741)*
- **Inertive–compliant** (Eq. 16, Fig. 7c): **least favorable for modal register.** Supraglottal integration of flow raises intraglottal pressure throughout the open portion, creating a greater push during closing than during opening — contrary to the push–pull condition. Additionally, when the glottis is convergent ($a_2/a_1 < 1.0$) the inertive subglottal tract further hinders oscillation. Some assistance is possible from subglottal inertance in falsetto if $a_2 > a_1$. *(p.2741)*
- **Compliant–compliant** (Eq. 17, Fig. 7d): not favorable for modal register but a little more so than inertive–compliant. For convergence the first integration's gradual pressure reduction is favorable but the second integration is detrimental. **The worst of all situations exists for divergence: the glottis is simply blown apart by a uniformly increasing intraglottal pressure. A compliant–compliant vocal tract squelches phonation when the glottis diverges.** *(p.2742)*

### Criticisms of prior simulation work *(p.2741)*
- Flanagan and Landgraf (1968) and Ishizaka and Flanagan (1972) simulations had **no subglottal tract**, so their vocal tract interaction effects were probably **exaggerated**.
- Zhang *et al.* (2006a,b) had **only a subglottal tract**, which could **underestimate** overall interaction.
- Zañartu *et al.* (2007) included both, but the vocal fold model had only a single mass, so the result is best considered an excellent correction to the Flanagan and Landgraf (1968) model.
- Neglect of subglottal reactance can be dramatic even with greater degrees of freedom in tissue movement.
- Nobody to date has derived an autonomous differential equation including **both inertive and compliant reactance, upstream and downstream, with a surface wave on the tissue.** Fletcher's (1993) analysis was basically for a one-mass model ($x_{10}$ mode); Adachi and Sato (1996) captured a $z_{10}$ mode for lip vibration but no surface wave; Titze (1988) included the surface wave but only downstream inertive reactance; Chan and Titze (2006) and Titze (2006b, Chap. 7) added upstream inertive reactance but not compliant reactance. *(p.2742)*

## Fletcher (1993) small-oscillation analysis applied to phonation (Fig. 8)

Fletcher's Eqs. (19) and (20) (Fletcher 1993, p. 2176) were solved with these human-phonation parameters (Fletcher's notation): *(p.2742)*

### Fletcher small-oscillation parameters (Fig. 8)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Overpressure parameters (valve type) | $\sigma_1, \sigma_2$ | — | +1, +1 | — | 2742 | Defines the (+,+) valve type |
| Vocal fold length | $W$ | cm | 1.0 | — | 2742 | |
| Vocal fold mass in vibration | $m$ | g | 0.05 | — | 2742 | |
| Inferior/medial/superior surface areas | $S_1, S_2, S_3$ | cm² | 0.5 each | — | 2742 | |
| Neutral glottal half-width | $x_0$ | cm | 0.03 | — | 2742 | |
| Mean subglottal pressure | $\bar p_2$ | dyn/cm² | 10 000 (≈1 kPa) | — | 2742 | |
| Entry and exit angles into glottis | $\theta$ | deg | 30 | — | 2742 | |
| Tissue resonance bandwidth coefficient | $k$ | — | $(0.05)(2\pi F_0)$ | — | 2742 | 157 Hz bandwidth at $F_0$ = 500 Hz |
| Subglottal / supraglottal reactance | $X_1, X_2$ | dyn·s/cm⁵ | variable | −100 to +150 | 2742 | Taken from Fig. 2 reactance curves |
| No-load natural frequency | $F_0$ | Hz | glide | 0–1500 | 2742 | Pitch glide to predict $F_0$ jumps |

The reactance curves used apply to a uniform 3.0 cm² subglottal tract and a uniform 3.0 cm² supraglottal tract with a narrowed 0.5 cm² epilarynx tube. $F$ is the true oscillating frequency for any applied load. *(p.2742)*

### Fig. 8 results *(p.2742)*
- Oscillation frequency $F$ tends to be **mostly below** the no-interaction resonance frequency $F_0$, because inertive reactance dominates in airways with a constricted region (the epilarynx tube), effectively increasing the mass of the oscillating system (tissue plus air columns collectively).
- There is a general **inverse relation between $F - F_0$ and the supraglottal reactance $X_2$.**
- Highest frequency is at 750 Hz, where $X_1 = -30$ dyn·s/cm⁵ (compliant) and $X_2 = 0$; this frequency is slightly greater than $F_0$.
- Most notable **drop in frequency (−50 Hz)** occurs just above 500 Hz, where both $X_1$ and $X_2$ are highly positive.
- A small peak around 600 Hz is where $X_1 = X_2 = 0$, the no-interaction condition for which $F = F_0$.
- Threshold pressure $P_{th}$ basically follows the **sum of the reactance curves**. Aside from a narrow dip near the tube resonances where $X_1 + X_2 = 0$, the **lowest threshold pressure is in the 750–1000 Hz region, where $X_1$ is negative (compliant) and $X_2$ is positive (inertive)** — confirming the compliant–inertive load is the most favorable.
- $P_{th}$ in Fig. 8 varies from below 0.1 to above 0.3 kPa. Typical speech lung pressures are 0.5–1.0 kPa.
- Titze and Sundberg (1992): every doubling of lung pressure above threshold raises source intensity by about **6 dB**. Alipour *et al.* (2001): an approximate **6 dB** intensity increase was obtained in an excised larynx when a vocal tract was added via a physical tube that lowered threshold pressure. Hence **more than one doubling of $P_{th}$, or 6–12 dB in source intensity**, could be realized in lower-threshold regions with normal lung pressures. *(p.2743)*
- **Caveat:** the Fletcher (1993) equations used for Fig. 8 did **not contain vocal tract losses**, so the $P_{th}$ fluctuations are probably overestimated. Significant source-energy changes are nevertheless likely with only a few tenths of a kPa reduction in $P_{th}$. *(p.2743)*

## Tissue modes as a decoupling mechanism (Fig. 9) *(p.2743)*
In any vocal fold model other than the one-mass model, $a_2/a_1$ varies throughout the glottal cycle. The amount of dynamic $a_2/a_1$ variation is explained by two dominant tissue vibration modes:
- **$x_{10}$ mode:** no vertical variation in tissue displacement. Produces **less** variation in $a_2/a_1$ than $x_{11}$. For $x_{10}$ the ratio gradually increases and decreases over the open portion but stays between 0.0 and 1.0 (always convergent).
- **$x_{11}$ mode:** 180° phase difference between top and bottom displacement. Both convergence and divergence are experienced over the cycle. Therefore the $x_{11}$ mode is **less dependent on vocal tract interaction** than $x_{10}$, because the pushes and pulls from tract pressures tend to cancel over the cycle.
- Agrees with Flanagan and Landgraf (1968), whose one-mass model supports only $x_{10}$, and with Zhang *et al.* (2006a,b) on a physical model. It is also why Zañartu *et al.* (2007) focused on the one-mass model. In Ishizaka and Flanagan's (1972) two-mass model the $x_{11}$ mode was present and vocal tract interaction was reduced.
- **Key implication: the percentage of $x_{11}$ mode excitation (relative to $x_{10}$) serves as a decoupler of vocal tract interaction, in direct opposition to the narrowing of the epilarynx tube.** It offers a vocal-tract-independence mechanism of self-sustained oscillation (Titze 1988; Lucero and Koenig 2007; Chan and Titze 2006; Jiang and Tao 2007). Speakers and singers who adjust source and filter for *linear* coupling rely heavily on this mechanism. *(p.2743)*
- Full mode nomenclature: Titze (2006b), Chap. 4.

## Section III: Source–filter interactions with computer simulations

### A. Methods *(p.2743)*
An **$L \times M \times N$ point-mass model** of the vocal folds simulated flow-induced, self-sustained oscillation (Titze 2006b, Chap. 4):
- $L$ = number of masses medio-laterally = **7**
- $M$ = number of masses anterior–posteriorly = **5**
- $N$ = number of masses inferio–superiorly = **5**
- Total **175 point masses**, each with **two degrees of freedom** (horizontal and vertical).
- Tissue properties defined with a **fiber-gel construct**: fibers carry nonlinear stress–strain characteristics of muscle, ligament, and mucosa; gel properties defined with Young's moduli, shear moduli, and Poisson's ratios (Titze 2006b, Chaps. 2–4).
- Aerodynamic pressures and glottal flow computed with a **modified Bernoulli equation including flow separation and jet formulation by rule** (Titze 2006b, Chap. 5).
- All vocal tract pressures computed with the **wave-reflection analog** (Liljencrants 1985; Story *et al.* 1996; Titze 2006b, Chap. 6).
- **Subglottal system: 36 cylindrical sections, each 0.398 cm long, total 14.33 cm.**
- **Supraglottal system: 44 cylindrical sections of the same length, total 17.51 cm.**
- **The first eight supraglottal sections constitute the epilarynx tube**, kept uniform so that the single parameter $A_e$ controls coupling strength.
- **Sampling frequency 44.1 kHz.**
- Medial surface nearly flat with slight convergence inferio–superiorly and similar tapering posterio–anteriorly; dynamically the glottis assumed a variety of mode configurations from surface wave propagation. *(p.2743–2744)*
- Control parameters: lung pressure $P_L$ and simulated activations (0.0–1.0) of cricothyroid (CT), thyroarytenoid (TA), lateral cricoarytenoid (LCA), posterior cricoarytenoid (PCA), and interarytenoid (IA) muscles, which position the folds and determine all tissue properties (Titze 2006b Chap. 3; Titze and Hunter 2007). *(p.2744)*

### Simulation constants held fixed across simulations *(p.2744)*

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Lung pressure | $P_L$ | kPa | 1.5 | — | 2744 | Held constant in simulations |
| LCA activity | — | % | 31 | — | 2744 | |
| IA activity | — | % | 30 | — | 2744 | |
| PCA activity | — | % | 0.0 | — | 2744 | |
| CT activity | — | % | glide | 90–0–90 | 2744 | Drives the pitch glide |
| TA activity | — | % | glide | 0–10–0 | 2744 | |
| Vowel | — | — | uniform tube with narrowed epilarynx (as Fig. 2) | — | 2744 | No nasal coupling |

### 1. Simulation 1 — no-interaction control *(p.2744)*
A high–low–high pitch glide under self-sustained oscillation. Vocal tract interaction was removed by nullifying the incident (traveling-wave) pressures in the glottal flow and pressure calculation while still propagating waves for radiation; only aerodynamic pressures and flows were retained.
- Glottal flow and glottal area envelopes were **proportional**; the glottal area spectrogram was identical to the glottal flow spectrogram, indicating no interaction.
- Both spectrograms showed harmonics, but here they resulted from **vocal fold collision**, not flow pulse skewing. (It is difficult to obtain a perfectly sinusoidal area with no collision under self-sustained oscillation.)
- The broad peak in the center of the $u_g$ and $a_g$ envelopes was due to greater tissue laxness, causing greater vibrational amplitude when $F_0$ was low.
- **$F_0$ in the glide ranged from 700 to 330 Hz.**
- $F_0$ passed through the positive peak of the reactance curve at about 1.0 s and again at about 7.0 s with **no effect** on the flow or area waveforms — linear coupling confirmed for the control case.

### 2. Simulation 2 — subglottal interaction alone *(p.2744)*
Supraglottal pressure set to zero in the glottal flow and intraglottal pressure calculation (but not for wave propagation).
- Overall signal strength slightly **less** than the no-interaction case (by envelope height of $a_g$ and $u_g$), and $a_g$–$u_g$ proportionality is lost.
- **New frequencies created by bifurcations in tissue movement**: a **period-3 subharmonic at 0.8 s**, changing to a **period-5 subharmonic at 1.6 s**.
- Timing: the period-3 bifurcation coincides with **$F_0$ in the maximum negative reactance dip**; the period-5 bifurcation occurs when **$2F_0$ enters the negative reactance region**.
- Conclusion: individual harmonics passing through rapidly changing reactance regions can destabilize the vibration regime.

Further detail on Simulation 2 *(p.2745)*: The quantitative interest is in $F_0$ **drops**, the most predictable instabilities and the most prevalent in the companion paper on human phonation.
- An **$F_0$ drop of about 50 Hz occurs at 2.4 s**, predicted well by the Fletcher (1993) small-oscillation analysis (Fig. 8) and by Zhang *et al.* (2006a,b) on a physical model with only subglottal interaction. It was a "correction" from a higher $F_0$ that prevailed in the compliant reactance region. The **starting $F_0$ was 750 Hz rather than the no-interaction 700 Hz.**
- **Compliance basically adds stiffness to the interactive vibrating system, raising $F_0$; inertance adds mass, lowering $F_0$.** *(key mechanism)*
- The 50 Hz pitch jump occurred *below* the positive peak of the reactance curve; possibly because $2F_0$ entered the compliant region at about 2.4 s, delaying the jump by adding stiffness before inertive reactance took over.
- At 3.2 s some perturbed (noisier) vibration occurred. This aperiodic vibration is related to an **impedance mismatch instability**: the source impedance became lower on average than the vocal tract input impedance and was highly variable due to oscillation.
- The $F_0$ upglide showed slight asymmetry in the duration of another brief noisy regime at 5.6 s, indicating a **small hysteresis effect**.

### 3. Simulation 3 — supraglottal interaction alone *(p.2745)*
Subglottal pressure set to the lung pressure, supraglottal traveling waves kept intact.
- **Greatest overall signal energy** of all cases. ($u_g$ scale increased 3×, $a_g$ scale 2× relative to Figs. 10 and 11.)
- A weak **period-4 bifurcation at 2.0 s**, stronger at **2.7 s**. Both $F_0$ and $2F_0$ went from higher to lower inertive reactance in that region.
- **$F_0$ started at 570 Hz instead of 700 Hz** — a "pulling down" of $F_0$ toward $F_1$ with identical muscle activities, caused by the tract's inertive reactance adding mass to the interactive oscillating system.
- A very small $F_0$ rise (**10–20 Hz**) at the beginning of the strong period-4 bifurcation, correlated with diminished reactance for $2F_0$. This small rise plus the subharmonic regime delays the eventual larger **$F_0$ drop of about 100 Hz** in positive reactance territory.
- Vibrational amplitude became disproportionately large and slightly unstable in the **3.0–5.0 s** region. **Hysteresis** was seen: bifurcations were delayed on the upslope of the glide.
- Because these bifurcations did not appear in the noninteractive case, they are attributed to supraglottal source–filter interaction. *(p.2746)*

### 4. Simulation 4 — combined subglottal and supraglottal, $A_e = 3.0$ cm² *(p.2746)*
The realistic (nonrestricted) situation. At $A_e = 3.0$ cm² the epilarynx tube diameter equals the uniform tube.
- **Two $F_0$ drops:** one at about **0.8 s**, where $F_0$ entered a region of rapidly changing overall $F_1$ reactance and $2F_0$ entered a region of positive supraglottal reactance; another at about **3.0 s**, where $F_0$ entered the region of positive supraglottal $F_1$ reactance.
- $2F_0$ entered the **compliant–compliant** region at the second drop, and a **period-3 bifurcation** occurred when $2F_0$ entered this region (similar to Fig. 12).
- Evidence of **chaotic vibration near 4.0 s**, where the lowest $F_0$ and highest vibration amplitude occurred.
- Overall signal strength was slightly less than the noninteractive case.

### 5. Simulation 5 — severe epilaryngeal constriction, $A_e = 0.2$ cm² *(p.2746)*
- Overall signal strength **much higher** (glottal flow envelope scale changed to 3.0 l/s), and stronger bifurcations.
- A **100 Hz $F_0$ jump at 1.0 s**, preceded by a **period-4 subharmonic**, again as $F_0$ entered the rapidly changing reactance region.
- When $2F_0$ entered the minimum reactance regions around **3.0 s**, destabilization occurred with further bifurcations.
- **Strong hysteresis**: reverse bifurcations occurred at higher frequencies.
- Vibrational amplitude increased and decreased sharply and irregularly near the lowest $F_0$, while the **flow amplitude reached a plateau**. The plateau is attributed to the vocal tract input impedance becoming **higher than the glottal impedance** at $A_e = 0.2$ cm², thus limiting the flow.

## Effect Sizes / Key Quantitative Results — Table I: Output quantities for various degrees of interaction *(p.2747)*

All numbers are time averages over the entire 8.0 s pitch glide. Efficiency = radiated acoustic power / glottal aerodynamic power.

| Condition | Mean glottal area (cm²) | Mean glottal flow (l/s) | Aerodynamic power (W) | Radiated power (W) | Efficiency (%) |
|-----------|------------------------|-------------------------|-----------------------|--------------------|----------------|
| No interaction | 0.0381 | 0.3284 | 0.4825 | 0.0117 | 2.42 |
| Subglottal only | 0.0336 | 0.1835 | 0.2264 | 0.0033 | 1.44 |
| Supraglottal only ($A_e$ = 0.5 cm²) | 0.0579 | 0.5014 | 0.7408 | 0.0523 | 7.07 |
| Subglottal + supraglottal ($A_e$ = 3.0 cm²) | 0.0347 | 0.1717 | 0.2226 | 0.0014 | 0.62 |
| Subglottal + supraglottal ($A_e$ = 0.5 cm²) | 0.0405 | 0.1860 | 0.2228 | 0.0035 | 1.59 |
| Subglottal + supraglottal ($A_e$ = 0.2 cm²) | 0.0534 | 0.3200 | 0.2604 | 0.0143 | 5.49 |

Interpretation *(p.2747)*:
- The no-interaction control produced self-sustained oscillation by excitation of the **$x_{11}$ mode with aerodynamic pressures only**.
- **Subglottal only:** every dynamic quantity was reduced, consistent with subglottal inertance generally hindering vibration (inertance was present over most of the $F_0$ glide).
- **Supraglottal only:** every dynamic variable increased. Most by a factor of about 2, but **acoustic radiated power increased by a factor of more than 4** and glottal efficiency by a factor of about 3. Supraglottal interaction alone would be a highly favored condition, but the trachea is always present in human phonation; its effect cannot be removed, only altered by **larynx lowering or raising**.
- **Combined at $A_e = 3.0$ cm²:** radiated power only 0.0014 W, nearly an order of magnitude less than no interaction; efficiency 0.62% vs 2.42%. **Interaction is not necessarily an advantage** — if impedances are not well matched, more power is absorbed internally (Titze, 2002).
- **Combined at $A_e = 0.2$ cm²:** all quantities except aerodynamic power exceeded the no-interaction case — a **double advantage**: more radiated power for less aerodynamic power used, so glottal efficiency doubled at the same lung pressure. Going from $A_e$ = 3.0 to 0.2 cm², **radiated acoustic power increased by a factor of 10**, as did glottal efficiency. No optimization of $A_e$ was attempted; a better value is expected to yield even higher efficiency.

## Section IV: Discussion and Conclusions *(p.2747–2748)*

**Level 1** = interaction of glottal airflow with acoustic vocal tract pressures, even if vocal fold vibration is undisturbed.
- The interaction parameter is **mean glottal area divided by the effective (parallel-combination) tube area of the subglottis and supraglottis**. For constant adduction and constant large tracheal diameters, this reduces to the **cross-sectional area of the epilarynx tube**.
- Produces harmonic distortion frequencies contributing to the source spectrum. Present in all speech and singing, male and female. Described for nearly three decades but generally **underestimated in magnitude** because lower vocal tract details were unknown.
- Contributes to **spectral slope and spectral ripple** in the glottal sound source even when the spectrum is purely harmonic and no bifurcations occur.
- Supraglottal and subglottal impedances are **additive**. If both reactances are inertive (positive), **maximum skewing of the flow pulse** is achieved, which increases the **maximum flow declination rate** and thereby vocal intensity.
- Individual harmonics can be enhanced or suppressed by frequency-dependent reactances changing from positive to negative.
- **Notable discovery: the entire spectrum of source frequencies can theoretically be produced without vocal fold collision.** With sinusoidally varying glottal area and no vocal fold contact, a **−12 dB/octave spectral slope** was achievable with an epilarynx tube cross-sectional area of **0.5 cm²**. Potential impact on voice therapy for pathologies from excessive tissue collision stress. *(p.2747–2748)*

**Level 2** = change in the mode of vibration. Realized more in high-$F_0$ productions where the dominant harmonics ($F_0, 2F_0, 3F_0, \dots$) are near the formants.
- Produces frequency jumps and new source frequencies or instabilities, including subharmonics and non-random noise.
- Instabilities occur mostly when one of the dominant harmonics **encounters sudden changes in reactance**, destabilizing tissue vibration modes that are differently affected by reactance. Control parameter is the same as for level 1.
- Simulations: vocal efficiency can increase by an **order of magnitude** when epilarynx tube area is narrowed from **3.0 to 0.2 cm²**, but this narrowing also produced greater instabilities when dominant harmonics were in unfavorable reactance regions (near formants). *(p.2748)*
- A thick and pliable mucosal layer permits self-sustained oscillation without much reliance on tract reactance; the parameter for this is the **strength of the $x_{11}$ mode (large vertical phase differences) relative to $x_{10}$**. Some vocalists can choose a nearly linear region with maximum harmonic stability, or a nonlinear region with greater output power and efficiency at the expense of harmonic stability. *(p.2748)*

### Register / vowel predictions *(p.2748)*
- Companion paper: the most frequent instabilities in human subjects were **$F_0$ jumps of order 30–40 Hz**. Not all subjects showed them, so nonlinear interaction varies across subjects and even within subjects across repeated vocalizations.
- Jumps are mostly triggered when **$F_0$ passes through $F_1$**, occasionally when **$2F_0$ passes through $F_1$**. **Larger $F_0$ jumps occur with greater coupling (narrower epilarynx tube).**
- For **modal register** at low $F_0$ (most speech), the ideal load would be **subglottal compliance + supraglottal inertance**, giving maximum reinforcement of the $x_{10}$ mode. **This combination does not exist at low $F_0$ in the human voice**: both reactances tend to be inertive because trachea and supraglottal tract are roughly equal in length. The inertive–inertive combination is less favorable than compliant–inertive for self-sustained oscillation, but flow pulse skewing (level 1) benefits from dual inertive reactance, so **the two effects are offsetting**.
- **Worst combination for modal register: inertive subglottal + compliant supraglottal.** This occurs in speech for low-$F_1$ vowels such as /i/ and /u/. Worked example: **$F_0$ = 300 Hz, $F_1$ = 250 Hz, and $F_1^1$ = 600 Hz (first subglottal formant)** gives the inertive–compliant condition. If interaction is high (narrow epilarynx tube), the **register can flip from modal to falsetto**, which is more sustainable with this acoustic load. Females may have cultivated a **mixed register** for speech to avoid this instability, given that 300 Hz is well within their speaking range. The companion paper shows females exhibit *fewer* instabilities on a pitch glide than males even though $F_0$–$F_1$ crossing is more likely. *(p.2748)*

### Footnote 1 — reactance sign convention *(p.2748)*
Reactance is the **energy-storing** part of impedance; resistance is the **energy-dissipating** part. Impedance is a complex number; reactance is the imaginary part. **Positive reactance is labeled inertive** because the acoustic flow lags the pressure in phase. **Negative reactance is labeled compliant** because the acoustic flow leads the pressure in phase.

## Parameters

### Vocal tract / coupling geometry

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Epilarynx tube cross-sectional area | $A_e$ | cm² | 0.5 | 0.2–3.0 | 2737, 2746 | Primary coupling control parameter |
| Subglottal entry area | $A_s$ | cm² | 3.0 | — | 2737 | Held constant across simulations |
| Equivalent vocal tract area | $A^*$ | cm² | — | — | 2736 | $A_sA_e/(A_s+A_e)$ |
| Coupling parameter | $a_g/A^*$ | — | 0.1 ($A_e$=3.0) | 0.1–0.35 | 2737 | 0.35 at $A_e$ = 0.5 cm² |
| Mean glottal area | $a_g$ | cm² | 0.15 | 0.0336–0.0579 (simulated means) | 2737, 2747 | 0.15 for the forced-oscillation figures |
| Subglottal tract length | — | cm | 14.33 | — | 2743 | 36 sections × 0.398 cm |
| Supraglottal tract length | — | cm | 17.51 | — | 2743 | 44 sections × 0.398 cm |
| Epilarynx tube section count | — | sections | 8 | — | 2743 | First 8 supraglottal sections, uniform |
| Section length | — | cm | 0.398 | — | 2743 | Both tracts |
| Sampling frequency | $f_s$ | Hz | 44 100 | — | 2743 | |
| Transglottal pressure coefficient | $k_t$ | — | 1.1 | 1.0 (Eq. 9 derivation) | 2736, 2739 | Scherer 1983; Alipour & Scherer 2007 |
| Lung pressure (simulations) | $P_L$ | kPa | 1.5 | 0.5–1.0 typical speech | 2743, 2744 | |
| Oscillation threshold pressure | $P_{th}$ | kPa | — | <0.1–>0.3 | 2743 | Fig. 8; lossless so likely overestimated fluctuation |
| Epilarynx quarter-wave resonance | — | Hz | — | 2500–3000 | 2738 | Titze and Story (1997) |
| Simulated $F_0$ glide range | $F_0$ | Hz | — | 330–700 | 2744 | No-interaction control |
| Forced-oscillation $F_0$ | $F_0$ | Hz | 200 | — | 2737 | Figs. 1–2 |
| Glide range (level-1 forced) | $F_0$ | Hz | — | 100–2000 | 2738 | Figs. 3–4, 8 s duration |

### Spectral / energy outcomes

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Source spectral slope, weak coupling | — | dB/octave | −15 | — | 2736 | $A_e$ = 3.0 cm², sinusoidal $a_g$ |
| Source spectral slope, strong coupling | — | dB/octave | −10 | — | 2737 | $A_e$ = 0.5 cm² |
| Source spectral slope, no collision | — | dB/octave | −12 | — | 2748 | $A_e$ = 0.5 cm², sinusoidal area, no contact |
| Intensity gain per doubling of $P_L$ above threshold | — | dB | 6 | — | 2743 | Titze and Sundberg (1992) |
| Intensity gain from adding a tract (excised larynx) | — | dB | ~6 | 6–12 achievable | 2743 | Alipour *et al.* (2001) |
| Human $F_0$ jump magnitude | — | Hz | — | 30–40 | 2748 | Companion paper subjects |
| Simulated $F_0$ drop, subglottal only | — | Hz | 50 | — | 2745 | At 2.4 s |
| Simulated $F_0$ drop, supraglottal only | — | Hz | 100 | — | 2745 | Preceded by 10–20 Hz rise |
| Simulated $F_0$ jump, $A_e$ = 0.2 cm² | — | Hz | 100 | — | 2746 | At 1.0 s, after period-4 subharmonic |
| $F_0$ pull-down from supraglottal inertance | — | Hz | 130 | 700 → 570 | 2745 | Same muscle activities |
| $F_0$ raise from subglottal compliance | — | Hz | 50 | 700 → 750 | 2745 | Compliance adds stiffness |
| Max $F - F_0$ drop (Fletcher analysis) | — | Hz | −50 | — | 2742 | Just above 500 Hz, both $X$ highly positive |

### Reactance regions (uniform 3.0 cm² tracts, $A_e$ = 3.0 cm², Fig. 1)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Supraglottal inertive band | $X_2 > 0$ | Hz | — | 0–500 | 2735 | |
| Supraglottal compliant band | $X_2 < 0$ | Hz | — | 500–1000 | 2735 | |
| Subglottal inertive band | $X_1 > 0$ | Hz | — | 0–600 | 2735 | |

### Reactance regions ($A_e$ = 0.5 cm², Fig. 2)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Combined compliant band | $X_1 + X_2 < 0$ | Hz | — | 600–800 | 2737 | Only negative region over 0–1500 Hz |
| Lowest threshold pressure band | — | Hz | — | 750–1000 | 2742 | $X_1$ compliant, $X_2$ inertive |
| Zero-reactance (no-interaction) point | — | Hz | ~600 | — | 2742 | $X_1 = X_2 = 0$, $F = F_0$ |
| Max-$F$ point | — | Hz | 750 | — | 2742 | $X_1 = -30$ dyn·s/cm⁵, $X_2 = 0$ |

## Methods & Implementation Details
- Reactance curves computed with **cascade transmission line matrices** (Sondhi and Schroeter 1987; Story *et al.* 2000). *(p.2735)*
- Wave-reflection (Kelly–Lochbaum) analog for wave propagation in both subglottal and supraglottal tracts, with energy losses and a radiation impedance (Kelly and Lochbaum 1962; Liljencrants 1985; Story 1995; Titze 2006b, Chap. 6). Wave-reflection analogs do not include exact near-field pressures (Zhao *et al.* 2002; Zhang *et al.* 2002) but capture the important fields. *(p.2736)*
- Input impedance scales as $\rho c / A_e$, the characteristic acoustic impedance of the first tube section. This is the mechanical reason narrowing the epilarynx raises coupling. *(p.2737)*
- To simulate "no vocal tract interaction" in a self-oscillating model: propagate waves for radiation but **nullify the incident traveling-wave pressures in the glottal flow and intraglottal pressure calculations**, retaining only aerodynamic pressures and flows. This makes $u_g \propto a_g$. *(p.2744)*
- To isolate subglottal interaction: set supraglottal pressure to zero **in the glottal flow and intraglottal pressure calculation only**, not for wave propagation. *(p.2744)*
- To isolate supraglottal interaction: set subglottal pressure to the lung pressure while keeping supraglottal traveling waves intact. *(p.2745)*
- Glottal area amplitude was programmed to vary **inversely with the square root of frequency** in the forced-oscillation glides, to approximate realistic vibration amplitudes. *(p.2738)*
- In the forced-oscillation setup, a constant subglottal pressure is imposed by replacing the incident $p_s^+$ with half the lung pressure with a +1 reflection coefficient, so $P_s = p_s^+(1+r) = 2p_s^+ = P_L$ (Titze 1984; Story 1995). *(p.2736)*
- Muscle-activation control: CT, TA, LCA, PCA, IA activations from 0.0 to 1.0 determine posture and all tissue properties (Titze 2006b Chap. 3; Titze and Hunter 2007). *(p.2744)*

## Figures of Interest
- **Fig. 1 (p.2735):** Weak coupling ($A_e$ = 3.0 cm²). Vocal tract shape, reactance curves (thin = supraglottal, dashed = subglottal, thick = combined), sinusoidal $a_g$ and its single-line spectrum, resulting skewed $u_g$ and its full harmonic spectrum.
- **Fig. 2 (p.2737):** Same panels with $A_e$ = 0.5 cm². Combined reactance shifted upward; flow shows apparent closed phase and ripple without glottal closure.
- **Fig. 3 (p.2738):** Noninteractive $F_0$ glide control. Glottal-flow and radiated-pressure spectrograms with reactance curves overlaid vertically; amplitude envelopes.
- **Fig. 4 (p.2739):** Interactive $F_0$ glide, $A_e$ = 0.5 cm². Extra harmonics $2F_0$–$4F_0$; envelope valleys at 0.8 and 3.0 s.
- **Fig. 5 (p.2739):** Male high voice F4–B♭4, /U/ vowel. Vocal tract shape and reactance curves with favorable ranges for $F_0$, $2F_0$, $3F_0$ marked as colored bars.
- **Fig. 6 (p.2740):** Coronal sketches of vocal fold tissue displacement, (a) modal register, (b) falsetto register. After Hirano (1975).
- **Fig. 7 (p.2741):** Four acoustic circuit diagrams — (a) inertive–inertive, (b) compliant–inertive, (c) inertive–compliant, (d) compliant–compliant.
- **Fig. 8 (p.2742):** Fletcher (1993) small-oscillation analysis. Reactance curves; $F - F_0$ vs natural frequency; $P_{th}$ vs natural frequency.
- **Fig. 9 (p.2743):** Convergent glottis with (a) $x_{10}$ mode and (b) $x_{11}$ mode.
- **Fig. 10 (p.2744):** 175 point-mass simulation, no interaction. Spectrogram plus $u_g$ and $a_g$ envelopes.
- **Fig. 11 (p.2745):** Same with subglottal interaction only. Period-3 subharmonic at 0.8 s, period-5 at 1.6 s, 50 Hz drop at 2.4 s.
- **Fig. 12 (p.2745):** Supraglottal interaction only. Largest energy; period-4 bifurcations at 2.0 and 2.7 s.
- **Fig. 13 (p.2746):** Combined interaction, $A_e$ = 3.0 cm². Two $F_0$ drops (0.8 s, 3.0 s), period-3 bifurcation, chaos near 4.0 s.
- **Fig. 14 (p.2746):** Combined interaction, $A_e$ = 0.2 cm². 100 Hz jump at 1.0 s, strong hysteresis, flow plateau.
- **Table I (p.2747):** Output quantities for six interaction conditions.

## Results Summary
Coupling strength is governed by mean glottal area over the parallel combination of subglottal and supraglottal entry areas, which for fixed adduction and trachea reduces to the epilarynx tube area $A_e$. Narrowing $A_e$ from 3.0 to 0.2 cm² raised radiated acoustic power and glottal efficiency by roughly a factor of 10 at constant lung pressure, but also produced stronger bifurcations when dominant harmonics sat in unfavorable reactance regions. Supraglottal interaction alone is strongly beneficial (efficiency 7.07% vs 2.42% control), subglottal interaction alone is harmful (1.44%), and the realistic combined case at wide epilarynx is worst of all (0.62%). Inertive reactance lowers $F_0$ by adding mass; compliant reactance raises $F_0$ by adding stiffness. Instabilities (subharmonics, $F_0$ jumps, chaos) occur when $F_0$ or $2F_0$ traverses rapidly changing reactance near a formant, with hysteresis on the reverse glide. *(p.2744–2748)*

## Limitations
- The Fletcher (1993) equations used for the Fig. 8 threshold-pressure and frequency-shift calculations **contain no vocal tract losses**, so $P_{th}$ fluctuations are probably overestimated. *(p.2743)*
- Fletcher's analysis is effectively a one-mass ($x_{10}$) treatment; it does not model the alternating convergent–divergent glottis created by tissue surface waves. *(p.2742)*
- **No autonomous differential equation yet exists that includes both inertive and compliant reactance, upstream and downstream, together with a tissue surface wave.** *(p.2742)*
- All discussions pertain to a **neutral-shaped vocal tract**; detailed interaction effects for all vowels and consonants remain to be developed. *(p.2748)*
- The wave-reflection analog does not represent exact near-field pressures at the glottis. *(p.2736)*
- No optimization of $A_e$ was attempted for the given glottal conditions; better efficiency is expected from optimization. *(p.2747)*
- Much remains unknown about the nature and onset of the subharmonic bifurcations observed. *(p.2744)*

## Arguments Against Prior Work
- **Linear source–filter theory** (Chiba and Kajiyama 1958; Fant 1960; Flanagan 1972; Stevens 1999) assumes superposition; the filter cannot create new frequencies or change source energy. Shown here to be generally invalid, though an appropriate simplification under specific conditions (firm adduction plus a widened epilarynx tube). *(p.2733–2734)*
- Linear theory is **encumbered with possible inconsistencies in the glottal flow spectrum** and does not predict bifurcations. *(p.2733)*
- Explicit glottal-flow formulas (Rosenberg 1971; Fant *et al.* 1985; Fant and Lin 1987) introduced nonlinear coupling *implicitly* by making the flow pulse shape differ from the area pulse shape, but such a delay **cannot be justified from quasi-steady aerodynamics alone**. Constructing a glottal flow pulse shape without the vocal tract load leads to inconsistencies. *(p.2734)*
- Zhao *et al.* (2002) argue for intraglottal pressure skewing from flow separation and vortex shedding; Titze judges the effect **small compared with vocal tract loading**. *(p.2734)*
- Most previous analyses **underestimated flow-pulse skewing** because the exact epilarynx geometry was unknown; MRI area functions (Story 1995, 2005) are the key validating data. *(p.2736)*
- **Flanagan and Landgraf (1968)** and **Ishizaka and Flanagan (1972)** had no subglottal tract, so their interaction effects were probably exaggerated. *(p.2741)*
- **Zhang *et al.* (2006a,b)** had only a subglottal tract, likely underestimating overall interaction. *(p.2741)*
- **Zañartu *et al.* (2007)** included both tracts but only a single mass; best viewed as a correction to Flanagan and Landgraf (1968). *(p.2741)*
- **Inverse filtering / linear prediction cannot recover glottal area from mouth flow**; the process is fundamentally nonlinear (Rothenberg and Zahorian 1977), and an apparent closed phase can appear with no glottal closure at all. *(p.2737)*
- Claims of **formant–harmonic tuning** in soprano singing (Sundberg 1977; Joliveau *et al.* 2004) are reinterpreted: on close inspection $F_0$ is usually slightly *less* than $F_1$, consistent with favorable-reactance placement rather than exact tuning. *(p.2735)*

## Design Rationale
- The **epilarynx tube area $A_e$ is chosen as the single coupling knob** because input impedance scales as $\rho c / A_e$ and because $A_e$ enters $A^*$ in the closed-form flow solution, making $a_g/A^*$ the natural coupling parameter. *(p.2736–2737)*
- The **push–pull criterion** ($P_g > 0$ when $du/dt > 0$; $P_g < 0$ when $du/dt < 0$) is the design rule used to rank the four reactance combinations. *(p.2741)*
- **Compliant–inertive is chosen as the ideal target load** for modal register because the subglottal integration produces a steady intraglottal pressure decrease over the open phase (given $a_2 < a_1$) that adds to the supraglottal inertive push–pull. *(p.2741)*
- The strategy of **placing harmonic clusters in favorable reactance regions rather than tuning them to resonances** is chosen because a talker must produce all phonetic variation and cannot retune the tract per harmonic; it also leaves articulatory freedom for vowel migration. *(p.2735, 2739)*
- **$x_{11}$ mode strength is proposed as the decoupling knob**, the deliberate counterpart to epilarynx narrowing, giving a mechanism for vocal-tract-independent self-sustained oscillation. *(p.2743)*
- **Both subglottal and supraglottal tracts are included** in the simulation specifically because the autonomous-differential-equation analysis showed each contributes differently and omitting either biases the result. *(p.2743)*

## Testable Properties
- Coupling parameter $a_g/A^*$ increases from about 0.1 to 0.35 as $A_e$ decreases from 3.0 to 0.5 cm², with $a_g$ = 0.15 cm² and $A_s$ = 3.0 cm². *(p.2737)*
- $A^* = A_sA_e/(A_s+A_e)$ must equal the parallel combination; as $A_e \to \infty$, $A^* \to A_s$. *(p.2736)*
- As $a_g/A^* \to 0$, glottal flow becomes directly proportional to glottal area. *(p.2736)*
- Vocal tract input impedance scales as $1/A_e$. *(p.2737)*
- Source spectral slope flattens monotonically with coupling: −15 dB/oct at $A_e$ = 3.0 cm², −10 to −12 dB/oct at $A_e$ = 0.5 cm². *(p.2736, 2737, 2748)*
- Harmonics falling in positive (inertive) reactance are amplified; harmonics in negative (compliant) reactance are attenuated. *(p.2736–2738)*
- Inertive reactance lowers oscillation frequency ($F < F_0$); compliant reactance raises it. There is a general **inverse relation between $F - F_0$ and supraglottal reactance $X_2$**. *(p.2742, 2745)*
- $F = F_0$ exactly where $X_1 = X_2 = 0$. *(p.2742)*
- Threshold pressure $P_{th}$ tracks the **sum** $X_1 + X_2$; minimum $P_{th}$ occurs where $X_1 < 0$ and $X_2 > 0$. *(p.2742)*
- Inertive–inertive push–pull requires $a_2/a_1 > 1.0$ (divergent glottis) over most of the open phase. *(p.2741)*
- A compliant–compliant load with a divergent glottis squelches phonation. *(p.2742)*
- Glottal efficiency is non-monotonic in $A_e$ under combined interaction: 0.62% at 3.0 cm², 1.59% at 0.5 cm², 5.49% at 0.2 cm², vs 2.42% no-interaction. *(p.2747)*
- Radiated acoustic power increases by a factor of ~10 going from $A_e$ = 3.0 to 0.2 cm². *(p.2747)*
- Subglottal-only interaction reduces every dynamic quantity relative to no interaction; supraglottal-only increases every one. *(p.2747)*
- Bifurcations (period-3, -4, -5) appear when $F_0$ or $2F_0$ enters a rapidly changing or minimum reactance region; reverse bifurcations on the upglide occur at higher frequencies (hysteresis). *(p.2744–2746)*
- $F_0$ jumps in human subjects are of order 30–40 Hz and grow larger with narrower epilarynx. *(p.2748)*
- The full source harmonic spectrum can be produced with a strictly positive sinusoidal glottal area (no collision). *(p.2736, 2747)*
- Vocal intensity rises about 6 dB per doubling of lung pressure above threshold. *(p.2743)*
- The $x_{11}$ mode reduces sensitivity to vocal tract reactance relative to $x_{10}$. *(p.2743)*
- For $A_e$ = 0.2 cm², vocal tract input impedance exceeds glottal impedance and flow amplitude saturates. *(p.2746)*

## Relevance to Project
This is a directly implementable specification for adding source–filter interaction to a formant or articulatory speech synthesizer, and it names the exact parameter to expose.

- **The interaction knob is a single scalar.** Expose epilarynx tube area $A_e$ (or the derived coupling parameter $a_g/A^*$) as the synthesizer's "interaction strength" control, with the documented range 0.2–3.0 cm² and $A^* = A_sA_e/(A_s+A_e)$.
- **Eq. (5) is the drop-in flow computation** for a wave-reflection tract: given the incident partial pressures $p_s^+$ and $p_e^-$ and the instantaneous area $a_g$, it yields $u_g$ in closed form with no iteration. Eq. (8) is the degenerate linear case that a conventional Klatt-style source implicitly assumes, so the same code path covers both by nulling $p_e^-$ and forcing $p_s^+ = P_L/2$.
- **Skewing and spectral tilt come out for free.** A synthesizer that computes flow through Eq. (5) gets the −15 to −10 dB/octave tilt change, the pulse skew, and the harmonic ripple as emergent behavior rather than as hand-tuned source-spectrum parameters. This replaces ad hoc LF/Rosenberg shape parameters with a physically grounded mechanism.
- **Reactance-region placement is the singing/high-pitch rule.** For expressive or sung output, place $F_0$, $2F_0$, $3F_0$ just below formant frequencies (inertive side), not on them. That is the opposite of what a naive "tune the harmonic to the formant" heuristic would do.
- **Bifurcation prediction gives a diagnostic.** If a synthesizer with interaction produces unwanted subharmonics or pitch jumps during an $F_0$ glide, the paper says to look for $F_0$ or $2F_0$ crossing $F_1$ in a rapidly changing reactance region, and that widening $A_e$ or increasing $x_{11}$-mode content suppresses it.
- **Simulation topology is specified concretely enough to copy**: 36 subglottal + 44 supraglottal cylindrical sections of 0.398 cm at 44.1 kHz, first 8 supraglottal sections uniform as the epilarynx.
- **Register modelling**: the $a_2/a_1$ ratio, and its modal (mostly convergent) vs falsetto (mostly divergent) settings, is the parameter that decides whether a given reactance load helps or hurts. A synthesizer wanting a falsetto voice quality needs $a_2 > a_1$ and gains from inertive subglottal load.
- **Caution for the project's default configuration**: naive addition of both tracts at a wide epilarynx ($A_e$ = 3.0 cm²) is *worse* than no interaction at all (0.62% vs 2.42% efficiency). Interaction must be tuned, not merely enabled.

## Open Questions
- [ ] Detailed interaction effects for all vowels and consonants; the paper only covers a neutral-shaped tract. *(p.2748)*
- [ ] The nature and onset conditions of the subharmonic bifurcations observed in the simulations. *(p.2744)*
- [ ] The optimal $A_e$ for a given set of glottal conditions; no optimization was attempted. *(p.2747)*
- [ ] An autonomous differential equation combining inertive and compliant reactance, upstream and downstream, with a tissue surface wave. *(p.2742)*
- [ ] The extent to which subglottal/supraglottal reactance combinations can be exploited in high-pitched speech, loud speech, and singing across vowels. *(p.2748)*
- [ ] Whether the subglottal entry configuration can be changed for more compliance, and whether the soft-wall trachea (portion in contact with the esophagus) can introduce subglottal compliance. *(p.2748)*
- [ ] Why nonlinear interaction varies across subjects and even within subjects across repeated vocalizations. *(p.2748)*
- [ ] Quantitative $P_{th}$ predictions with vocal tract losses included. *(p.2743)*

## Related Work Worth Reading
- **Titze, I. R. (1988).** "The physics of small-amplitude oscillation of the vocal folds," JASA 83, 1536–1552. Source of Eq. (9), the intraglottal driving pressure; p. 1542 has the full derivation.
- **Fletcher, N. H. (1993).** "Autonomous vibration of simple pressure-controlled valves in gas flows," JASA 93, 2172–2180. Eqs. (19)–(20) on p. 2176 are used directly for the Fig. 8 frequency-shift and threshold-pressure analysis.
- **Titze, I. R. (2006b).** *The Myoelastic-Aerodynamic Theory of Phonation.* Chaps. 2–6 carry the fiber-gel tissue model, the modified Bernoulli with flow separation, the wave-reflection analog, and the tissue mode nomenclature used throughout.
- **Titze, I. R., Riede, T., and Popolo, P. (2008).** "Nonlinear source-filter coupling in phonation: Vocal exercises," JASA 123, 1902–1915. The companion human-subject paper that supplies the empirical $F_0$-jump data.
- **Story, B. H., Titze, I. R., and Hoffman, E. A. (1996).** "Vocal tract area functions from magnetic resonance imaging," JASA 100, 537–554. The area-function data that make accurate epilarynx modelling possible.
- **Titze, I. R., and Story, B. H. (1997).** "Acoustic interactions of the voice source with the lower vocal tract," JASA 101, 2234–2243. Source of the epilarynx quarter-wave resonance at 2500–3000 Hz.
- **Sondhi, M. M., and Schroeter, J. (1987).** "A hybrid time-frequency domain articulatory speech synthesizer," IEEE TASSP 35, 955–967. The transmission-line matrix method used for the reactance curves.
- **Rothenberg, M., and Zahorian, S. (1977).** "Nonlinear inverse filtering technique for estimating the glottal-area waveform," JASA 61, 1063–1071. The basis for the inverse-filtering criticism.

