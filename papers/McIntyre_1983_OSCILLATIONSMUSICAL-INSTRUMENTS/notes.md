---
title: "On the oscillations of musical instruments"
authors: "M. E. McIntyre, R. T. Schumacher, J. Woodhouse"
year: 1983
venue: "Journal of the Acoustical Society of America, 74(5), 1325-1345"
doi_url: "https://doi.org/10.1121/1.390157"
pages: "1325-1345"
affiliations: "DAMTP, University of Cambridge (McIntyre); Department of Physics, Carnegie-Mellon University (Schumacher); Topexpress Ltd., Cambridge (Woodhouse)"
pacs: "43.10.Ln, 43.75.-z, 43.40.At"
note: "Received 20 August 1982; accepted 28 July 1983. Eighty-fifth in JASA's series of review and tutorial papers on acoustics."
---

# On the oscillations of musical instruments

## One-Sentence Summary
A single, minimal time-domain model — a memoryless nonlinear excitation characteristic `f = F(q)` coupled to a linear passive resonator represented by a *reflection function* `r(t)` convolved with the outgoing wave — reproduces the large-amplitude self-sustained oscillations of clarinet-type (reed), violin-type (bow), and flute/organ-pipe-type (air-jet) instruments, at a computational cost low enough to run in real time, and it is the direct ancestor of digital waveguide synthesis. *(p.1325)*

## Problem Addressed
Musical self-sustained oscillators are strongly nonlinear (reed closure, bow slip onset, jet switching). The dominant frequency-domain / normal-mode treatment handles these badly: the mathematics is hard, discontinuities in the nonlinear characteristic cause severe difficulties, transients on the tens-of-milliseconds scale that dominate perceived tone quality are computationally prohibitive, and some real behaviours (pitch flattening of a hard-bowed string) are counter-intuitive in the frequency domain. The paper argues for and demonstrates a time-domain formulation that is trivial to program, indifferent to whether nonlinearity is weak or strong, and gives direct physical insight. *(pp.1325-1326)*

## Key Contributions
- The **unified "linear resonator + nonlinear excitation" architecture** of Fig. 1: an energetically active nonlinear element (reed, air jet, bow) driving an energetically passive multimode linear element (tube, string), with feedback from the linear element back to the nonlinear element. *(p.1325)*
- The **reflection function `r(t)`** as the correct linear-element descriptor for computation, rather than the Green's function / impulse response `g(t)`. `r(t)` is short and well-localized while `g(t)` extends over the whole decay time of the resonator, so `r(t)` makes the per-sample convolution cheap. *(pp.1327-1329)*
- A three-equation model — (1), (10), (11) — solvable by "compute history term, then solve one scalar simultaneous equation, then advance". *(p.1328)*
- Demonstration that **one set of equations covers clarinet, violin and flute** by changing only `F(·)` and the parameters. *(p.1325)*
- For the flute/organ-pipe family, the model produces the **triangular pressure and velocity waveforms** observed by Coltman (1976), and shows the triangular waveform is a *universal limiting form* independent of the detailed loss mechanism, provided losses are small. *(p.1325)*
- Reformulation of a special case as a **nonlinear iterated map / difference equation** (Appendix A), linking musical oscillators to the chaos literature. *(p.1326)*
- Explicit energetic-passivity condition on the linear element, and its `|r̂(ω)| < 1` equivalent. *(p.1329)*

## Methodology
Conceptually split the instrument into (a) a nonlinear, energetically active element with a *memoryless* (quasi-static) characteristic relating excitation flow to the local resonator variable, and (b) a linear, passive, multimode element described by wave propagation. Write the resonator variable as a sum of outgoing and incoming travelling waves. Express the incoming wave as a convolution of the outgoing wave with `r(t)`. Step forward in time: compute the history term from past values, solve the memoryless nonlinear relation simultaneously with the linear travelling-wave relation (a single scalar root-find, or graphically the intersection of a curve with a straight line of slope `1/Z`), advance by `Δt`, repeat. *(pp.1327-1329)*

---

## I. THE BASIC MODEL (clarinet formulation)

### The nonlinear element

In a clarinet mouthpiece (Fig. 2, p.1326) a single springy cane reed controls the flow of air from the player's mouth. **First approximation: neglect reed dynamics and time-dependent flow-control effects.** This asserts that for a given embouchure the volume flow rate `f` through the reed gap depends only on the instantaneous pressure drop across the gap. With `p` the (constant) mouth pressure and `q` the fluctuating acoustic pressure just inside the mouthpiece, `f` is a function of `p - q` only; suppressing `p`: *(pp.1326-1327)*

$$
f = F(q)
$$
Where: `f` = volume flow rate of air through the reed gap (positive *into* the instrument); `q` = acoustic pressure in the mouthpiece, measured relative to atmospheric; `F` = the memoryless nonlinear characteristic, parametrized by mouth pressure `p` and embouchure. **Eq. (1)** *(p.1327)*

Shape of `F(q)` for a clarinet (Fig. 3, p.1327):
- Flow increases at first as the pressure difference `p - q` increases (i.e. as `q` decreases from `p`).
- Flow returns to zero at `q = q_c`, where the pressure drop `p - q_c` is large enough to overcome the reed's springiness and **close the gap completely**.
- `F(q) = 0` for `q ≤ q_c` (reed shut) and for `q ≥ p` (no pressure drop).
- The precise shape depends on embouchure and on the shape of the "lay" (the curved facing behind the reed, dashed line in Fig. 2).
- **Realistic `F(q)` shapes are steeper near `q = p` than the symmetric curve drawn**, and this has significant consequences (see Eq. 24 discussion). *(p.1327)*
- `F(q)` is not merely nonlinear: it has a **discontinuity in slope at `q = q_c`**. Such slope discontinuities occur in the nonlinear mechanisms of many musical oscillators and are the source of much of the mathematical difficulty in frequency-domain calculations. *(p.1327)*

Neglected effects (all listed as departures that matter mainly at high frequency): finite reed mass, inertia of the unsteady air flow through the gap, non-constancy of the mouth pressure `p`. Ref. 31 shows how to extend the model to include finite reed mass, which gives the reed a resonance the player can vary between about **2 and 3 kHz**; Thompson (Ref. 11) demonstrated its importance for the perceived tone quality of the clarinet's upper registers. *(p.1327)*

### The linear element as travelling waves

Assume a uniform tube section just beyond the mouthpiece, in which the pressure signal takes the one-dimensional form *(p.1327)*

$$
q(x, t) = q_o(t - x/C) + q_i(t + x/C)
$$
Where: `x` = distance along the uniform section; `C` = sound speed; `q_o` = outgoing wave; `q_i` = incoming wave. (unnumbered, p.1327)

The associated contributions to acoustic volume flow rate are *(p.1327)*

$$
Z^{-1} q_o(t - x/C) \quad \text{and} \quad -Z^{-1} q_i(t + x/C)
$$
Where: `Z` = wave (characteristic) impedance of the uniform tube section, a **real positive constant**, equal to `C` times air density divided by cross-sectional area; acoustic flow counted positive *away from* the mouthpiece. **Eq. (2)** *(p.1327)*

### The reflection function r(t)

Send an infinitely narrow Dirac pulse down the tube: `q_o(t) = δ(t)`. Tone holes and bell are strong reflectors only at sufficiently low frequency (**below about 1 kHz for a real clarinet**, Ref. 32), so the returning signal loses its delta character and takes on a smooth shape `r(t)`: *(p.1327)*

$$
q_i(t) = r(t) \quad \text{when} \quad q_o(t) = \delta(t)
$$
Where: `r(t)` = the **reflection function**. **Eq. (3)** *(p.1327)*

Interpretation: `r(t)` is the disturbance that would be found at `x = 0` after the delta pulse is sent out, *if the tube were terminated at `x = 0` by a perfect absorber* — a uniform semi-infinite tube of the same cross-section. **Causality requires `r(t) = 0` for `t < 0`.** *(p.1327)*

Shape: for a simple idealization, an inverted hump (Fig. 4, p.1327). For a "clarinet" with a real bell but no tone holes, `r(t)` has several slight undulations following the main pulse. With tone holes open the shape shows the effects of multiple reflections and is more complicated still (worked examples in Ref. 31). Bore nonuniformity and acoustic boundary-layer dissipation can also be folded into `r(t)`. `r(t)` can be made as realistic as desired, from laboratory measurement or theoretical calculation. *(pp.1327-1328)*

By superposition, for arbitrary outgoing signal: *(p.1328)*

$$
q_i(t) = r(t) * q_o(t)
$$
**Eq. (4)** *(p.1328)*

$$
r(t) * q_o(t) = q_o(t) * r(t) = \int_0^{\infty} r(t') \, q_o(t - t') \, dt'
$$
**Eq. (5)**, defining the convolution. *(p.1328)*

### The area rule (DC constraint)

$$
A = \int_0^{\infty} r(t') \, dt' = -1
$$
Where: `A` = total area under the reflection function. **Eq. (6)** *(p.1328)*

This holds for the reflected pressure signal in **any open tube, regardless of detailed geometry**. It expresses the fact that linear acoustic theory admits no permanent steady pressure difference between the tube interior and the outside air. *(p.1328)*

Rationale: the acoustic pressure at the reed is *(p.1328)*

$$
q(t) = q_o(t) + q_i(t)
$$
**Eq. (7)** *(p.1328)*

`q` must tend to zero after an initial transient if `q_o` and its flow `Z^{-1} q_o` rise from zero to a steady value (as when the player blows steadily with the reed not vibrating). Eq. (4) delivers this only if (6) holds, giving `q_i = -q_o` and `q = 0`. *(p.1328)*

Caveat: a real clarinet does have a small hydrodynamically induced excess pressure inside the bore, roughly proportional to flow rate squared (Ref. 33), which linear acoustic theory cannot describe. It is neglected here and is usually negligible relative to the reed pressure drop `p - q`, because the bore is much larger than the reed gap. *(p.1328)*

### Closing the loop

Total acoustic flow at the reed (set `x = 0` in Eq. 2): *(p.1328)*

$$
Z f(t) = q_o(t) - q_i(t)
$$
**Eq. (8)** *(p.1328)*

Sum and difference of (7) and (8): *(p.1328)*

$$
2 q_o = q + Z f \quad \text{and} \quad 2 q_i = q - Z f
$$
**Eq. (9)** *(p.1328)*

Substituting into (4): *(p.1328)*

$$
q(t) = q_h(t) + Z f(t)
$$
**Eq. (10)** — the "load line": a straight line of slope `Z^{-1}` in the `(q, f)` plane, offset by the history term. *(p.1328)*

$$
q_h(t) = 2 q_i(t) = r(t) * \{ q(t) + Z f(t) \}
$$
Where: `q_h` = the **history term**, the contribution to `q` attributable to the past history of the system. **Eq. (11)** *(p.1328)*

**Equations (1), (4), (7) and (8) comprise the model equations for the idealized clarinet; the compact computational form is (1), (10), (11).** *(p.1328)*

### Algorithm (the McIntyre-Schumacher-Woodhouse time-stepping scheme) *(p.1328)*

1. Given `q(t)` and `f(t)` at all times earlier than the present, compute `q_h` from Eq. (11). Any simple numerical approximation to the convolution integral will do; **for a smooth, well-localized `r(t)` like Fig. 4 the trapezoidal rule is as good as any** (Ref. 35).
2. Solve Eq. (1) and Eq. (10) **simultaneously** for the present values of `f` and `q`. Graphically (Fig. 3): find the intersection of the heavy `F(q)` curve with the straight line of slope `Z^{-1}` whose position is set by `q_h`.
3. Advance time by a small step `Δt` and repeat.

Efficiency notes:
- If `r(t)` is zero or negligible except over a small fraction of an oscillation period (as in Fig. 4), even the convolution is quick. **Hundreds of cycles compute in a few minutes on a minicomputer** (1983 hardware). *(p.1328)*
- Step 2 can be made efficient by exploiting the fact that **`q` varies monotonically with `q_h`**. *(p.1328)*
- Assumed for now: `F(q)` gives only **one** intersection point. Multiple intersections matter for the bowed string and are treated in Sec. IIC. *(p.1328)*
- The authors explicitly anticipate real-time hardware synthesis: "if the convolution integral were done by hardware using integrated circuits... a fast minicomputer could produce results at a cycle rate in the audible range. The result would perhaps have some novelty: an electronic musical instrument based on a mathematical model of an acoustic instrument." *(p.1328)*

### Frequency-domain route to r(t)

$$
Z_L(\omega) = \hat{q}(\omega) / \hat{f}(\omega)
$$
Where: `Z_L(ω)` = complex input impedance of the linear element; `ω` = angular frequency. **Eq. (12)** *(p.1328)*

$$
\hat{f}(\omega) = \int_{-\infty}^{\infty} \exp(-j \omega t) f(t) \, dt
$$
**Eq. (13)** *(p.1328)*

$$
\hat{r}(\omega) = \int_{0}^{\infty} \exp(-j \omega t) \, r(t) \, dt
$$
**Eq. (14)** — note the lower limit 0, by causality. *(p.1328)*

$$
\hat{r}(\omega) = \{ Z_L(\omega) - Z \} / \{ Z_L(\omega) + Z \}
$$
**Eq. (15)** — the standard reflection coefficient. Inverse Fourier transform gives `r(t)`. *(p.1328)*

### r(t) vs g(t): why the reflection function wins

`r(t)` must be carefully distinguished from the Green's function / impulse response `g(t)`, the inverse Fourier transform of `Z_L(ω)` itself. Either can describe the linear element, but **the computational advantages of `r(t)` are overwhelming**: `g(t)` differs significantly from zero over a far longer interval than `r(t)` — of the order of the decay time of free motion of the linear element — so using `g(t)` would require an enormously long convolution at every time step. *(pp.1328-1329)*

### Passivity condition

Using Fourier transforms is the simplest general way of guaranteeing the linear element is energetically passive: *(p.1329)*

$$
\mathrm{Re}\{ Z_L(\omega) \} > 0, \quad \text{for } \omega \neq 0, \text{ real}
$$
**Eq. (16)** — required *strictly* positive so that acoustic energy is dissipated, as in real instruments. *(p.1329)*

Equivalently, since `Z` is real and positive: *(p.1329)*

$$
| \hat{r}(\omega) | < 1, \quad \text{for } \omega \neq 0, \text{ real}
$$
**Eq. (17)** *(p.1329)*

---

## II. SOME EXAMPLES

### A. Preliminaries

Even with very simple `r(t)`, the varieties of behaviour obtainable from (1), (10), (11) are "seemingly endless" and reminiscent of real instruments in the hands of skilled or unskilled players. *(p.1329)*

The standard reflection function used through most of the paper is a **Gaussian** (Fig. 4): *(p.1329)*

$$
r(t) = \begin{cases} a \exp\{ -b (t - T)^2 \} & (t \geq 0) \\ 0 & (t < 0) \end{cases}
$$
Where: `a` = amplitude (negative, giving the inverted hump); `b` = width parameter; `T = 2L/C` = round-trip time; `L` = effective tube length. **Eq. (18)** *(p.1329)*

Full width at half-depth (at value `a/2`): *(p.1329)*

$$
2 b^{-1/2} (\log_e 2)^{1/2}
$$
**Eq. (19)** — chosen to be **5% to 40% of the round-trip time `T = 2L/C`**. With these values `r(t)` is negligible at `t = 0` (at most `3 × 10^-8 a`), so for practical purposes it is symmetrical about `t = T`. *(p.1329)*

Caveat the authors flag themselves: strictly, the symmetry of `r(t)` is unrealistic, but the basic behaviour being described is not sensitive to the precise shape. If one were describing the finer points of instrument behaviour of concern to the musician, the detailed shape would become vital. *(p.1329)*

**Numerical practice:** *(p.1329)*
- Time step `Δt = T / 128` unless otherwise stated.
- For the model clarinet and bowed string, `a` is chosen so that the **discretized numerical analog of Eq. (6) holds exactly in the simulation** (trapezoidal rule used). This is a discrete-conservation trick, not the continuous value.
- Required values of `r(t)` were stored in a **look-up table**, so exponentials were evaluated only once.

### B. Clarinet-like oscillations

Simplest analytical representation of the curved part of `F(q)` — a parabola: *(p.1329)*

$$
F(q) = k (p - q)(q - q_c)
$$
Where: `k` = positive constant; `p` = mouth pressure (upper zero); `q_c` = reed-closure pressure (lower zero). **Eq. (20)** *(p.1329)*

Fig. 5 parameter set (both panels, units such that `Z = 1`), for `t > 0`: `k = 0.2`, `p = 3`, `q_c = -2`. `a` in Eq. (18) determined by the trapezoidal approximation to Eq. (6). Left panel (a): reflection-function full width = **5% of `T`**, i.e. 2.5% of one oscillation period. Right panel (b): **20% of `T`**, i.e. 10% of one oscillation period. *(p.1329)*

Startup: blowing pressure `p` is brought **instantaneously** from zero to a steady positive value at `t > 0` (which is why the initial corner of the waveform is not rounded). Undisturbed conditions `f = q = 0` assumed for `t < 0`. *(p.1330)*

Observed behaviour: *(pp.1329-1330)*
- Oscillation **period is `2T = 4L/C`**, i.e. two round trips from reed to bell — as for the lowest note on a real clarinet (a stopped-pipe/odd-harmonic regime).
- The attained amplitude is such that the **peak positive excursion of `q` nearly coincides with the right-hand zero of `F(q)` at `q = p = 3`** (label iii). The peak negative excursion (label i) goes well to the left of `q = q_c = -2`, where the reed closes completely.
- The broader `r(t)` hump (b) implies greater loss of high-frequency components per round trip, which rounds the `q` waveform; the narrow hump (a) gives a squarer waveform.
- Mechanism: every half-cycle a pressure jump propagates outward from the reed; half a period later it returns **inverted and smeared out** by convolution with `r(t)`. On arrival it closes the reed (negative jump) or opens it (positive jump). During this, `q_h = 2 q_i` rapidly traverses the range between the outermost slanting lines in Fig. 3, so the intersection point sweeps rapidly across `F(q)` and a **brief pulse in `f(t)`** is generated, peaking at the peak of `F(q)`. Via Eq. (8) this pulse **steepens** the pressure jump as it sets out again from the reed.
- **The degree of squareness or roundness of the settled waveform is a competition between smearing (by `r(t)`) and steepening (by the timed puffs in `f(t)`).** This picture is due to Cremer and Lazarus (1968, Refs. 38, 39) in the bowed-string context. *(p.1330)*

### Energy balance and amplitude saturation

Mean rate of working of the nonlinear element on the linear element, for a periodic oscillation: *(p.1330)*

$$
W = \langle q(t) f(t) \rangle = \langle q(t) F\{q(t)\} \rangle
$$
Where: angle brackets = time average over one period. **Eq. (21)** *(p.1330)*

- Self-sustained oscillation requires `W > 0` by a margin sufficient to balance the linear element's losses.
- Positive `W` is made possible by the **positive-sloping part of `F(q)`**, which lets `q` and `F(q)` be positively correlated. This is the "negative resistance" of the nonlinear element. *(p.1330)*
- **Saturation mechanism:** in the final steady state the `q`-`f` correlation is very *low*, so `W` is just barely positive and numerically much smaller than the product of typical magnitudes of `f` and `q`. The condition "correlation positive, but only just" largely determines the saturation amplitude. *(p.1330)*
- **Stability:** the finite *negative* slope of `F(q)` at `q = p` is locally a *positive* resistance. If peak `q` overshot `p`, `f` and `q` would become negatively correlated and the oscillation would decay immediately. If peak `q` fell significantly short of `p`, `W` would approach the product of typical `f` and `q` magnitudes, far above steady state, and amplitude would grow rapidly. Large `W` of this kind occurs during the starting transient, accounting for the **fast build-up of a fortissimo attack** (visible by correlating the first two cycles of `q` with those of `f` in Fig. 5). *(p.1330)*
- The very short starting transients in Fig. 5 recall the "metallic hardness of attack" possible at fortissimo on a real clarinet. *(p.1330)*
- **Pianissimo playing:** small-amplitude "threshold" oscillations are stable when centered just to the left of the maximum of `F(q)`, where the slope has just become positive (resistance just negative). For a given embouchure the player reaches this by **decreasing blowing pressure `p`**, which slides the `F(q)` curve rigidly to the left in Fig. 3 with `k` and `p - q_c` held constant, until the maximum in `F(q)` falls only just to the right of `q = 0`. *(pp.1330-1331)*

### The zero-mean theorem

This form of control works because the mean value of `q` cannot drift far from zero. **For the model it cannot change at all** for periodic oscillations, provided Eq. (6) holds: *(p.1331)*

$$
\langle q(t) \rangle = 0
$$
**Eq. (22)** *(p.1331)*

Proof. For any periodic `φ(t)`: *(p.1331)*

$$
\langle r(t) * \phi(t) \rangle = r(t) * \langle \phi(t) \rangle = \langle \phi(t) \rangle \int_0^{\infty} r(t) \, dt = - \langle \phi(t) \rangle
$$
**Eq. (23)** *(p.1331)*

Step 1 uses periodicity of `φ` (verify by reversing the order of integration, i.e. interchanging the average over `t` with the integration over `t'`). Step 2 uses that `⟨φ(t)⟩` is a constant. Step 3 uses Eq. (6), `∫ r(t) dt = -1`. Applying (23) to (11) with `φ = q + Zf` gives `⟨q_h⟩ = -⟨q⟩ - Z⟨f⟩`; substituting into the time average of (10) yields `⟨q⟩ = 0`. *(p.1331)*

### The parabola is unrealistic; use a cubic

Simulations near threshold based on the parabola (20) **do not** exhibit the stable amplitude-vs-blowing-pressure dependence found in real instruments under normal playing conditions when the embouchure is not too loose (Ref. 44). With (20): lowering `p` below threshold kills the oscillation as expected, but raising `p` until small oscillations just grow makes them **keep growing until the reed begins to close**. If real small-amplitude oscillations behaved that unstably, eliciting pianissimo would require superhuman control; in fact even a novice can do it. *(p.1331)*

Cause: the **unrealistic symmetry of the parabola (20)**. Backus's experiments (Ref. 30) on real clarinets give an `F(q)` curve (Fig. 21.4 of Ref. 2) **much steeper near `q = p` than near `q = q_c`**. An experimentally determined `F(q)` could be used, but at this level of idealization a cubic suffices: *(p.1331)*

$$
F(q) = K (p - q)(q - q_c)(q + p - 2 q_c)
$$
Where: `K` = positive constant. **Eq. (24)** *(p.1331)*

With (24) — or any similarly asymmetric curve — the model **does** exhibit stable, small-amplitude, nearly sinusoidal oscillations when `p` is chosen so the maximum of `F(q)` falls just to the right of `q = 0`. *(p.1331)*

Why stabilization works: the cubic term `-K q^3` in (24) introduces a new term `-K ⟨q^4⟩` into the right-hand side of Eq. (21), which is **always negative**. Dissipation in the linear element goes as `⟨q^2⟩` as amplitude varies, so the negative `-K⟨q^4⟩` term always acts to diminish `W` relative to the linear dissipation rate as amplitude grows from zero. That is what allows a stable balance to be reached **within the continuous part of the `F(q)` curve** (no reed closure needed). *(p.1331)*

### Spectrum check against the real clarinet

Fourier-analysing `q(t)` simulates the internal pressure spectrum a probe microphone in the mouthpiece would measure. The model reproduces the qualitative harmonic behaviour of Fig. 21.6B of Ref. 2 — for instance the **third harmonic is proportional to the cube of the fundamental** as `p` is varied near threshold. **Even harmonics are relatively weak but are not, and cannot be, exactly zero**, because of the small contribution from `f(t)` in Eq. (8); the internal spectrum of a real clarinet likewise has weak but nonzero even harmonics. In the *radiated* sound of a real clarinet the even harmonics are relatively less weak than in the internal spectrum, for reasons given by Benade (Ref. 2, Sec. 22.4). *(p.1331)*

---

### C. Pitch flattening in the bowed string

**Phenomenon.** The playing frequency shifts systematically away from any plausible "compromise" frequency predicted from the string's normal modes. The shift occurs whenever the normal bow force `f_b` exceeds a certain limit, and is **downwards** — a flattening of pitch. The cause was not elucidated until Refs. 18 and 19. *(p.1331)*

**Mapping the same equations onto the bowed string** *(pp.1331-1332)*
- The analogy is exact if the string is symmetrical and bowed **exactly at its midpoint**: the two reflections act as one, each half of the string being a mirror image of the other at any instant. More generally one must allow for reflection from two ends rather than one (Appendix B).
- The bow's frictional force plays the role of the flow rate into the mouthpiece and is denoted by the same symbol `f(t)`.
- `q_o`, `q_i` now represent the **transverse string velocities** associated with waves travelling out from, and in towards, the bow. `q = q_o + q_i` is the transverse string velocity at the bow.
- Eq. (8) applies as before **provided `Z` is reinterpreted as half the wave admittance `Y` of the string**: it is an admittance and not an impedance because `f` is now force, not flow rate. Readers preferring `Y` should substitute `½Y` for `Z` in Eqs. (8) onward.
- If `f` were zero, (8) implies `q_o(t) = q_i(t)`: the outgoing wave in each half of the string would be identical to the incoming wave from the opposite half, as if the bow were removed.
- `T` in Eq. (18) is now the round-trip time over **one half** of the string, not the true round trip over both halves. *(p.1332)*
- The `r(t)` main pulse is **much narrower for a string of typical length than for a wind-instrument bore**. *(p.1332)*
- Eqs. (6) and (22) still hold; they now express the fact that **the string cannot drift continually sideways**, true whenever the terminations are modelled in any realistic way (Ref. 46). *(p.1332)*
- The usual assumption that friction depends only on the velocity of the string relative to the bow implies a relation between `f` and `q` of precisely the form (1). **So the full model set (1), (10), (11) is unchanged.** *(p.1332)*
- Advantage of the symmetric Gaussian (18) here: it gives the model string an almost precisely **harmonic** series of natural frequencies, so there is no ambiguity about whether an observed frequency shift is genuinely nonlinear. *(p.1332)*

**Shape of `F(q)` for the bow (Fig. 6, p.1332)** *(p.1332)*
- Passes through zero at `q = p`, after attaining maximum `f_max` for `q` just less than `p` (infinitesimally less, for practical purposes; see Ref. 48 and Appendix B of Ref. 19).
- `p` now = the velocity at which the bow is pushed or pulled past the string. **Varying `p` is again an important way of controlling loudness.**
- The **very steep portion** near `q = p` corresponds to **sticking**: tiny departures from zero relative motion are resisted by relatively large frictional forces. For practical purposes the slope may be regarded as **infinite**.
- `f_max` is roughly proportional to the **normal bow force `f_b`**, with proportionality coefficient **of order unity for rosined surfaces**.
- Points to the left of the maximum are **slipping** states, string moving backwards relative to the bow. Values well to the left of the maximum are typically **of order `0.2 f_b`**.

**The three-intersection ambiguity and the hysteresis rule** *(p.1332)*
- For practical values of `f_b`, the maximum positive slope of `F(q)` often exceeds `Z^{-1} (= 2/Y)`, the slope of the Eq. (10) line. Then (1) and (10) admit **three** intersections for a given `q_h`, whenever the line falls within the shaded region in Fig. 6. Pointed out but not resolved by Friedlander (Ref. 36) and Keller (Ref. 37); the physically correct resolution is in Ref. 19:
  1. **The system will never get into a state corresponding to the middle of the three intersections.**
  2. **The system follows a given intersection continuously as long as it can.**
- These two statements are the **"hysteresis rule."**
- Consequence: if currently sticking (intersection on the infinitely steep portion), that state persists until `q_h` moves beyond the **left-hand edge** of the shaded region; only then does the system jump to slipping — the bow **"releases"** the string (Ref. 40). Slipping persists until `q_h` leaves the **right-hand edge**, whereupon a **smaller** jump occurs back to sticking — the bow **"captures"** the string.
- As `q_h(t)` oscillates back and forth across the horizontal axis in Fig. 6, the bow-string contact sequence exhibits precisely the hysteresis one would intuitively anticipate.
- **Programming convenience:** the initial guess for `q` when solving (1) and (10) for given `q_h` can always be taken as `q` at the previous time step, and the nearest intersection found.

**Mechanism of flattening** *(pp.1332-1334)*
- During periodic oscillation the bow-string nonlinearity compensates for the smearing by `r(t)`, just as for the clarinet: **release of the string ≙ closing of the reed; capture ≙ opening of the reed.**
- Amplitude of steady oscillations is set essentially the same way, by the shape of `F(q)` and in particular by the location of `q = p`, which the **bow speed `p`** determines.
- But whenever hysteresis occurs, waveform steepening becomes extreme: parts of the `q` and `f` waveforms become **infinitely steep**, because of the hysteretical jumps as the Eq. (10) line sweeps across `F(q)`.
- **The hysteresis rule implies the jumps are bigger during release than during capture. This asymmetry produces the downward frequency shift.** The release process introduces a slight **delay** into the round-trip time of the propagating disturbance, which is **not fully compensated at capture**. *(p.1333)*
- Detail (Fig. 8, p.1334): during release, as `q_h` begins its negative swing, sticking is *prolonged* while `(q, f)` ascends the infinitely sloping part of `F(q)`, until the discontinuous jump to slipping occurs. This introduces both the discontinuity in `q` and an obvious **delay** in the timing of the whole transition relative to `q_h`. A similar delay appears in the outgoing velocity signal `q_o`, which is even more strongly affected: from (10) and the first of (9), *(p.1334)*

$$
2 q_o = q + (q - q_h)
$$
Where: the graph of `2 q_o` is as far above the `q` curve as `q_h` is below it. (unnumbered, p.1334)

  The nonlinearly induced delay is **not eliminated by the subsequent convolution with `r(t)`**. Because `r(t)` is symmetric, the convolution can only smooth the transition, not make it come earlier. In fact the reverse occurs: the convolution smears the positive peak in the `2 q_o` curve as well as the main transition, giving a smooth curve with a **smaller peak and an increased delay**. *(p.1334)*
- At capture (Fig. 8b) the nonlinear interaction produces an **advance** rather than a delay, but because of hysteresis the advance at capture is **smaller in magnitude than the delay at release**. Net: overall lengthening of the period. *(p.1334)*

**Scaling of the flattening effect** *(p.1333)*
- The amount of hysteresis **increases with normal bow force `f_b`**, because `F(q)` becomes taller and the shaded region wider.
- Flattening therefore **increases with `f_b`** for a given type of oscillation.
- Flattening also **increases with the width of `r(t)`**, since incoming signals are then smeared more strongly and there is more scope for perturbing their timing.
- Both effects occur in the simulations and on real instruments. On a real violin, audible flattening is easy to demonstrate at low bow speeds when the bow is pressed sufficiently hard, and becomes audible **well before the complete breakdown of the musical note** — especially when playing high notes on a thick string such as the G string (relatively broader `r(t)`).
- **Musical consequence:** audible flattening makes adequate control of pitch and tone quality impossible, setting one of the more important limits on the musically useful range of normal bow force `f_b`. Rapid, irregular frequency fluctuations under slightly unsteady bowing may be heard not as pitch fluctuation but as **changes in tone quality** (cf. psychoacoustics of Boomsliter and Creel, Ref. 22, and Benade, Ref. 2). Subjective tone quality deteriorates as bow force increases even before flattening is audible as such; violin students are exhorted not to "force the tone."

**Fig. 7 demonstration case (p.1333).** Steady-state `q(t)` and `f(t)` showing the flattening effect. Parameters: curved part of `F(q)` is `F(q) = 1/(1.5 - q)`; straight (sticking) part has `p = 1`, so `f_max = 2`, in units with `Z = 1`. Reflection function full width (19) = **40% of `T`**, i.e. **19.1% of one period**; `a` from the trapezoidal approximation to (6). Result: oscillation period **268 time steps vs the string's natural period 2T = 256 time steps — 4.7% longer**, i.e. the frequency is 4.7% below the gravest normal-mode frequency, a flattening of **nearly a semitone**, well outside numerical error. This happens *despite* the linear element having an accurately odd-harmonic normal-mode series `1/2T, 3/2T, 5/2T, ...` (to within numerical error, because `r(t)` is symmetric). *(p.1333)*

Classroom demonstration of the harmonicity: run the simulation, then continue it with `f` set to zero. The bow is effectively "suddenly raised." **As soon as `f` is switched off the frequency jumps up to `1/2T`.** The waveform becomes more rounded as higher modes decay relative to lower ones, but shows **no dispersion** — all modes stay in the same phase relation while decaying freely. An incautious frequency-domain argument would have predicted that nonlinear self-excitation of the form (1) "should have" produced frequency `1/2T` or an integer multiple. *(p.1333)*

Figure 7 rendering note: the fine dashed extensions to the hysteretical "capture" pulses in `f(t)` indicate that `(q, f)` may, if desired, be thought of as instantaneously traversing the peak `F(q)` value (as in Fig. 3 of Ref. 40 and Fig. 6 of Ref. 15), **even though the jump occupies zero time and has no dynamical significance for the model** (Ref. 49). *(p.1333)*

---

### D. Subharmonics, starting transients, and other bowed-string phenomena

- **Subharmonic patterns in starting transients** (recently pointed out by Cremer, Ref. 50). For midpoint bowing one expects patterns related to the **second subharmonic**, of period **twice** the string's fundamental period `2T`. Fig. 9 shows a decaying second-subharmonic pattern from the model. Decaying subharmonics play an important role in real starting transients and other transient phenomena (a laboratory example is Fig. 7 of Ref. 41). *(p.1334)*
- **Bow-position rule for subharmonics:** `N`-th subharmonics are liable to occur when the string is bowed near the point `1/N` of the string length from one end. More precisely, a simple geometrical argument (Ref. 41) shows **`N`-th subharmonics are possible when the bow is placed between the points `1/(N+1)` and `1/(N-1)` from the end, where `N = 3, 4, 5, ...`** *(p.1334)*
- Fig. 9 parameters: same as Fig. 7 except the curved part of `F(q)` is `F(q) = 2/(3 - q)` (a **shallower** shape than Fig. 6, exhibiting **no hysteresis**); straight part again `p = 1`; **time step `Δt = T/32`, not the standard `T/128`**; `r(t)` width (19) again **40% of `T`**. First sixteen cycles of `q(t)` in a starting transient. *(p.1334)*
- **A real limitation of the model.** As soon as **realistically narrow** reflection functions are used, transients such as the initial subharmonic in Fig. 9 **fail to die out**, and stable steady oscillations become practically impossible to obtain from most initial conditions. This contrasts with the very stable behaviour of the model clarinet and with the adequately controllable behaviour of real bowed strings. *(p.1334)*
- The parabola (20) behaves stably for large-amplitude oscillations even when tall or narrow enough to cause hysteresis, and this provides the simplest way of demonstrating the dependence of the flattening effect on the width of `r(t)` with minimal programming effort. *(pp.1334-1335)*

**The infinite-slope instability (Friedlander instability).** The infinite slope of `F(q)` at `q = p` in Fig. 6 is implicated in the model's unstable behaviour. If `r(t)` is sufficiently narrow while the sticking part of `F(q)` has infinite slope and the slipping part finite positive slope, then **even if the simplest regime of steady oscillation were set up, it would be unstable to small disturbances**. Discovered in 1953 by Friedlander (Ref. 36) for infinitely narrow `r(t)`. It takes the form of a **self-excited second subharmonic** (Ref. 41), which may itself become unstable to a fourth subharmonic, and so on — a **period-doubling bifurcation cascade** (cf. Appendix A). The corresponding model for bowing near the `1/N`-th point exhibits **period `N`-tupling if `N` is prime** (Ref. 51). *(p.1335)*

**The fix: torsional motion, modelled as a finite negative slope.** Sticking is a physical reality; the treatment of friction is not what is wrong. The most important missing ingredient is the string's **torsional degree of freedom**. Appendix B shows torsional effects can be partially included **without changing the model equations or the computer program**, simply by replacing the infinitely sloping section of `F(q)` with a section of **finite negative slope** (Ref. 15). This is exactly what is needed to get realistic, stable transient behaviour with narrow `r(t)`. *(p.1335)*

Precisely, the whole friction curve is **sheared horizontally** (Fig. 10, p.1335) so as to impart a negative slope `2/Y'` to the sticking section, where `Y'` is the **torsional wave admittance of the string referred to velocity at the string surface**: *(p.1335)*

$$
G(q) = F(q + \tfrac{1}{2} Y' f)
$$
Where: `G(q)` = modified nonlinear characteristic giving greater stability of oscillation; `Y'` = characteristic admittance of the string for torsional waves. **Eq. (B16)**, plotted as the solid curve in Fig. 10; the dashed curve is the corresponding `F(q)` from Fig. 6. In the figure `Y'` is taken as `0.4 Y`, **a value well within the typical range** (Refs. 40, 43). *(p.1335)*

Replacing `F(q)` by `G(q)` makes some allowance for the **scattering of transverse waves into torsional waves at the bow**. Note that this gives rise to a **larger shaded region and greater hysteresis** (Ref. 15). This simple device does not allow for torsional *reflections*, but it does incorporate the scattering of incoming transverse waves into torsional waves at the sticking bow (Refs. 43, 52). **Scattering into torsional waves is by far the most effective mechanism bringing about the decay of subharmonics in real strings** (Ref. 41). *(p.1335)*

**Excessive bow force (Schelleng maximum).** Pressing so hard that no musical note is produced near the string's fundamental is simulated simply by increasing `f_b`, and therefore the maximum of `F(q)`, beyond the limit corresponding to the **Schelleng maximum bow force** (Ref. 53). The returning velocity jumps are then not always strong enough to cause release. Both the real string and the model then produce a variety of periodic motions with periods **much longer than any natural period of the string**, as well as apparently **aperiodic** motions — the chaotic behaviour that in real instruments produces the raucous, scrunching sound made inadvertently by novices. *(p.1335)*

**Off-midpoint bowing and Helmholtz motion.** The model extends easily to bowing at any point of an asymmetrically terminated string; Appendix B gives the computationally most efficient way. It then simulates the celebrated **Helmholtz regime**, which is *simpler* than the Fig. 7 example: only **one** velocity jump propagates on the entire string, alternately triggering capture and release as it shuttles back and forth past the bow. In the process, backscattered **"secondary waves"** (Refs. 38, 39, 40, 43, 52) are generated by the accompanying pulses in `f(t)` and then reverberate in each section of the string (Ref. 41, Fig. 8). **Secondary waves have no separate existence in the symmetrical, midpoint case.** *(p.1335)*

Other demonstrable phenomena: `N`-th subharmonics, period `N`-tupling, various **"double flyback"** motions (Ref. 18), and **Raman's "higher types"** — of which the midpoint example, with two propagating velocity jumps, is the simplest case (Ref. 54). Contrary to what is sometimes said, Raman's higher types are **not musically unimportant** (Refs. 21, 55): certain of them produce a "fascinatingly luminescent sound" and are used, consciously or not, for coloristic effects in *sul tasto* playing. They tend to be evoked when the bow is **near, but not at, a point `1/N` of the string length from the bridge, typically `N = 3, 4, or 5`**. Lawergren (Ref. 55) has recently approached their classification using the term **"S motion."** General bowed-string surveys: Refs. 21 and 40; more detailed introduction: Ref. 43. *(p.1335)*

---

### E. Simulating a flute, recorder, or organ pipe

**Target behaviour.** A flue organ pipe open at its far end oscillates near `1/T` or `C/2L`, as does a flute or recorder (blockflute) on its lowest note. This is **an octave higher than the clarinet's `1/2T`**. Substituting a flute or recorder mouthpiece on a clarinet raises the lowest note by about an octave (Ref. 56). *(p.1335)*

**Two things must change.** Not only the altered acoustic conditions at the mouthpiece, but also the fact that an air jet blowing across a hole excites acoustic fluctuations, and is affected by them, **in an entirely different way from a reed**. Geometry: Fig. 11 (p.1336), a flue organ pipe after Cremer and Ising (Ref. 57). *(pp.1335-1336)*

**The crucial modification: a delay in the nonlinear element.** The finite speed of hydrodynamical disturbances carried along the jet — the sinuous instability waves first studied by Rayleigh in connection with "sensitive flames" (Ref. 59) — travel far more slowly than sound, **usually at speeds of the order of half the maximum flow speed in the jet** (Refs. 57, 60-62). This gives a significant time delay in the process symbolized by the left-hand box in Fig. 1. Its importance is well established experimentally and it is **one of the parameters varied by flute players in order to control their instruments** (Ref. 63). One of its effects is a frequency shift, **quite different in nature from the intrinsically nonlinear shift of Sec. IIC: it causes the familiar sharpening of pitch as the instrument is blown harder.** *(p.1336)*

$$
f(t) = F\{ q(t - \tau) \}
$$
Where: `τ` = the jet transit delay, taken to be a **positive constant for given playing conditions**. **Eq. (25)** replaces Eq. (1). *(p.1336)*

**Computational bonus.** (25) makes the program *simpler* than before: at each time step the right-hand side of (25) is **already known from past history**, without reference to (10). So **(10) need not be solved simultaneously with (25)**, as it had to be with (1) — there is no per-sample root-find at all. *(p.1336)*

**New physical meanings.** *(p.1336)*
- `q(t)` measures the **acoustic displacement of air into and out of the hole across which the jet blows** — the "mouth" of the flue pipe, the "embouchure hole" to flute players. For definiteness `q` is the **volume displacement**, with dimensions of **length cubed**. The corresponding acoustic volume flow rate through the mouth is `dq/dt`. **Positive `q` = displacement into the pipe.**
- `f(t)` = the **volume flow rate in that part of the jet which is blowing into the pipe at time `t`**, apart from an additive constant chosen so that (27) holds.

**Sign flip of the reflection function.** Because of the new meaning of `q`, the sign of `r(t)` is now **positive** for an open pipe: *(p.1336)*

$$
A = \int_0^{\infty} r(t) \, dt = +1
$$
**Eq. (26)** replaces Eq. (6). An open end reflects **negatively in terms of pressure, but positively in terms of acoustic flow rate or displacement**. A **closed pipe** is modelled by reverting to Eq. (6) and taking `A = -1`. *(p.1336)*

$$
\langle f(t) \rangle = 0
$$
**Eq. (27)** — an **exact property of the model as applied to open pipes**, following from (26) in the same way (22) followed from (6). *(p.1336)*

**What `r(t)` now means for the pipe.** Strictly, `r(t)` represents the cumulative effects of reflection from **both ends**, plus acoustic boundary-layer dissipation. For definiteness think of `q_i(t)` in Eq. (4) as the incoming wave **just after it has been re-reflected back up the pipe from the mouth**, in a hypothetical situation where `f(t)` is zero. That is, **`r(t)` represents the total smearing of a pulse during a complete round trip.** Reflection from the mouth of the pipe may well contribute noticeably to the total smearing (Ref. 64). *(p.1336)*

**The Cremer-Ising excitation model.** The term `Z f(t)` in Eq. (8) represents the **Cremer-Ising model** for the excitation of acoustic disturbances by the jet. Experimental evidence suggests this is a good model in the near-resonant cases studied by Coltman (Ref. 23) and Cremer and Ising (Ref. 57). **It may be less accurate for strongly blown pipes sounding above resonance** (Ref. 62). Eq. (8), or more conventionally its time derivative, may be obtained from the "excitation" portion of Coltman's (1976) equivalent circuit (Ref. 23, Fig. 9); `f(t)` and `dq(t)/dt` correspond respectively to `i_j` and `-i_1` in Coltman's notation. Coltman's equivalent circuit, with the understanding that `βx ≪ 1` in his Eq. (1), represents an aeroacoustically consistent refinement [continues p.1337]. *(p.1336)*

**What `Z` means for the flute.** In Eq. (8) `Z` is **no longer a wave impedance or admittance**. It has the **dimensions of time** and equals the time for a sound wave to travel a distance of the same order as the end correction at the mouth of the pipe. Caution: in the real world `Z` is **not precisely equal to a standard end correction divided by `C`, nor is it accurately a constant**. There is a numerical factor depending not only on the geometry of the mouth and lip but also, "in an ill-understood way," on the **width and speed of the jet and on the amplitude of the waves on the jet**. *(p.1337)*

**Shape of `F(q)` for the jet (Fig. 12, p.1337).** A **monotonic curve with horizontal asymptotes at each extremity**. One extremity = all of the jet blowing into the pipe; the other = jet deflected entirely outside it. Following Fletcher and Douglas (Ref. 65): *(p.1337)*

$$
F(q) = h + k \tanh(l q)
$$
Where: `h`, `k`, `l` are constants, with **`l` positive and `k` negative**. **Eq. (28)** *(p.1337)*

Why `k` is negative (Refs. 3, 57, 60, 62): when jet instability is important, the response of the jet to `q(t)` is almost the same as if `q` were zero but the slit from which the jet emerges were moving from side to side **in the opposite sense** (Ref. 67), with displacement `-q(t)`. *(p.1337)*

**Values of the jet delay `τ`** (experimentally determined, with the foregoing definitions): *(p.1337)*
- Just over **half an oscillation period** when the pipe is blown gently and sounds **below** its resonant frequency.
- **Half a period** at resonance — the regime studied in detail by Cremer and Ising (Ref. 57) and Coltman (Ref. 23).
- Just over **a quarter of a period** when blown hard and playing **sharp** (Refs. 63, 66).
- In the more softly blown regimes, `τ` is of the order of the time for a Rayleigh instability wave to travel to the lip **from the base of the jet where the jet is most acoustically sensitive** (Ref. 59). In hard-blown regimes jet behaviour is less simple; see Fletcher and Thwaites (Refs. 60-62).

**Validity condition for the memoryless-with-delay form (25).** The implicit assumption that jet behaviour depends only on `q(t)` is valid provided *(p.1337)*

$$
f(t) \ll dq(t)/dt
$$
**Eq. (29)** — typical magnitudes. *(p.1337)*

What (29) neglects: in real organ pipes there is a **local contribution `-f(t)` to the volume flux in the mouth**, which (25) ignores as far as its effect on the base of the jet is concerned. This is a good approximation for large-amplitude pipe oscillations near resonance. The neglected contribution is a **local, irrotational backflow out of the mouth** occurring by mass conservation whenever the jet blows into the mouth; it would be the *only* irrotational contribution to flow in the mouth if the pipe interior were blocked, making `dq/dt` zero (Ref. 68). **The backflow and its effective mass-acceleration are an essential part of the Cremer-Ising mechanism expressed by Eq. (8)** and must be considered carefully in any theoretical determination of `Z`; but its direct effect on the excitation of instability waves at the base of the jet can be neglected if (29) holds. *(p.1337)*

This approximation **would not be appropriate for simulating the edge-tone-to-pipe-tone transition** demonstrated by Coltman (Ref. 23): the direct effect of `-f(t)` on the base of the jet **is** the feedback mechanism giving rise to edge-tone behaviour. *(p.1337)*

**Honest assessment.** For other reasons too — not least the **strong frequency dependence of the growth rates of instability waves** — Eq. (25) is in principle **a far cruder idealization for the organ pipe than Eq. (1) is for the clarinet or violin**. Fortunately the inaccuracies are almost completely immaterial for the large-amplitude, near-resonant case of interest: (29) is well satisfied (verifiable directly from Coltman's Figs. 7 and 8), and the jet moreover **spends most of its time fully "switched" into or out of the pipe, so `f(t)` is very nearly a square wave** (as Coltman reported). The system spends most of its time on one or other of the asymptotes in Fig. 12, and is therefore **indifferent to details in the waveform of `q(t)` and in the form of (25), except near zero crossings** (Ref. 69). In addition, `q(t)` tends to be **weak in high harmonics**, so the frequency dependence of instability growth rates matters less than one might think. *(p.1337)*

### Fig. 13: flute simulation at exact resonance

Steady-state waveforms from Eqs. (10), (11), (25) with `r(t)` from (18). Traces shown: `q`, `dq/dt`, `f`, `df/dt`, `dq_o/dt`, `dq_i/dt`. Positive volume displacements and velocities are directed **into** the mouth/embouchure hole; positive `f` means the jet is blowing **into** the pipe. *(p.1338)*

Parameters (both sets): `h = 0`, `k = -0.5`, `l = 0.2` in Eq. (28); `Z = 0.0233 T`; `τ = T/2` (exact resonance); `r(t)` full width (19) = **15% of `T`**; `a` from the trapezoidal approximation to **(26)**. *(p.1338)*

- `h = 0` (unlike Fig. 12) corresponds, by virtue of (27), to a **time-average jet position exactly bisected by the lip, so no even harmonics are generated** (Refs. 65, 66). *(p.1338)*
- Vertical bar at the right of Fig. 13 = the theoretical peak-to-peak amplitude of `dq/dt` for the **limiting triangular waveform** of Ref. 58; peak-to-peak value **3.84**, corresponding to positive and negative excursions of **±1.92**. *(p.1338)*
- `dq/dt` is plotted on the same scale as `f`, to indicate the accuracy of approximation (29). *(p.1338)*
- **Startup:** a small constant displacement `q` was assumed to exist before turning on the jet. *(p.1338)*
- **Result:** with `τ = T/2` (one half the round-trip time `T`), the period of the resulting steady oscillation is `T = 2L/C`, **precisely that of the pipe's gravest free mode** — the pipe oscillates precisely at resonance. *(p.1338)*

**Edge tone vs pipe tone.** The delay `τ = T/2` required for resonance **differs from the value `τ = 3T_e/4`** characterizing the gravest edge-tone oscillation of period `T_e` (Ref. 70). **Resonance does NOT mean that the edge-tone frequency agrees with the pipe frequency, as has sometimes been assumed.** The reason is the different delay in the feedback mechanism producing edge tones, via the local backflow `-f(t)` instead of the acoustic pipe flow `dq/dt`. *(p.1338)*

**Agreement with Coltman's experiments (Ref. 23).** The waveforms and phase relations of Fig. 13 are "strikingly consistent with all the observations reported by Coltman" for a long organ pipe at resonance: *(p.1338)*
- Triangular shape of the experimental `dq/dt` waveform.
- Square waveform of `f`.
- The experimentally determined phase relation between them: **the jet switches into the mouth (`f` goes positive) at the time of maximum `dq/dt`**, i.e. at maximum acoustic flow into the mouth.
- Pressure waveform at different positions in the pipe: **triangular at the midpoint, trapezoidal between midpoint and ends**; the entire pressure distribution "takes very closely the form of the wave on a string plucked in the middle."

Pressure distribution formula: *(p.1338)*

$$
P(x, t) \propto \frac{\partial}{\partial t} q_o\!\left(t - \frac{x}{C}\right) - \frac{\partial}{\partial t} q_i\!\left(t + \frac{x}{C}\right)
$$
Where: `P(x,t)` = pressure at position `x` in a uniform pipe, estimated from the outgoing and incoming signals, **neglecting boundary-layer dissipation and any other contribution to `r(t)` originating from the body and mouth of the pipe rather than the far end**. **Eq. (30)** *(p.1338)*

Construction: phase-shift the bottom two waveforms of Fig. 13 and subtract graphically. At the **midpoint** the two contributions reinforce to give the same triangular waveform as `dq/dt`, but **delayed by a quarter period** relative to `dq/dt` itself. At other `x` they combine into a **trapezoidal** waveform. *(p.1338)*

**The universality result for the triangular waveform.** Ref. 14 gave a partial frequency-domain explanation. The time-domain viewpoint gives a much more complete one (easy to translate back into frequency-domain language once perceived): **an approximately triangular waveform is to be expected, at resonance, irrespective of the shape of `r(t)`, as long as `r(t)` is sufficiently narrow and as long as the jet is switching.** The authors note this result "seems not to have been remarked upon previously." It shows the waveforms probably constitute a **genuine explanation of Coltman's result**, even though the exact `r(t)` of his experiment is unknown, and **should apply in practice to any relatively long pipe with sufficiently small acoustic losses**. Mathematical derivation in Ref. 58. *(p.1338)*

Basis of the derivation: the same competition principle described earlier and **first used by Cremer (Ref. 39) for the bowed string** — the steady-state waveform shape is set by a competition between **sharpening of its corners by the pulses in `df/dt`** [Eq. (8)] and their **smearing-out by `r(t)`** [Eq. (4)]. As before, the incoming waves `dq_i/dt` (bottom trace) have rounder corners than the outgoing `dq_o/dt` (second from bottom). *(p.1338)*

**Essential difference from clarinet and bowed string.** The `F(q)` of Fig. 12 **cannot exert strong nonlinear control over the steady-state amplitude** in the manner of the `F(q)` shapes in Figs. 3 and 6. Once the jet is switching fully into and out of the pipe, `f(t)` becomes nearly a **square wave whose amplitude is insensitive to the amplitude of `q`**. **The amplitude of `q` is therefore limited mainly by dissipation, represented in the model by the properties of `r(t)`.** This fact, and the triangular waveform, can also be understood via an analogy with a simple heat-diffusion problem (Ref. 58). *(p.1338)*

**Starting transient length.** The important role of linear dissipation explains another aspect: **the model's starting transient is very much longer than for the model clarinet at large amplitude.** This is also true in the real world — the flute is known as one of the slowest-speaking members of the orchestra [continues p.1339]. *(p.1338)*

**Scope caveat the authors state.** A full justification of the model equations and their physical interpretation "lies beyond the scope of this paper"; it would require a lengthy digression, "especially as some of the fluid-dynamical questions involved are controversial." Further discussion promised in a forthcoming paper (Ref. 58). Here the results are presented with brief motivation only. **"Large amplitude" means the jet switches fully into and out of the pipe.** *(p.1336)*

### Flute transient and overblowing

- The model transient exhibits **smooth, monotonic growth of amplitude**, of duration **of the same order as the time for the gravest mode of the linear element to decay freely**. *(p.1339)*
- The authors decline to analyse starting transients in detail because (a) approximation (29) is unlikely to hold in the earliest stages, (b) realistic transients would need attention to the actual nonlinear fluid dynamics (Refs. 71, 72), implying **possible variations in `Z` during the transient** (Ref. 58), and (c) in a real starting transient **the jet orifice may act momentarily as an isolated monopole** — likely important for getting the oscillation going, especially when the note is vigorously "tongued." *(p.1339)*
- **Overblowing.** Varying `τ` to a **fourth, a sixth, and an eighth** of the round-trip time `T` yields oscillations at **two, three, and four times** the fundamental, simulating the flautist's or recorder player's octave, twelfth, and second octave by increasing jet speed and reducing `τ`. Variation of `τ` between these simple integral fractions produces the frequency-shifting effects already mentioned. *(p.1339)*
- **Even harmonics from off-center jet.** Displacing the jet off-center (Fletcher and Douglas, Ref. 65; Nolle, Ref. 66) is simulated for an open pipe by making **`h` nonzero**, which displaces the `F(q)` curve **vertically**. This imitates one way a flute player varies tone quality, or an organ builder "voices" an open flue pipe. *(p.1339)*
- **Asymmetry of control between open and closed pipes.** Because (27) constrains `⟨f⟩` and not `⟨q⟩` for the open pipe, shifting the `F(q)` curve **horizontally exerts essentially no control** over the conditions of oscillation: `⟨q⟩` would simply shift by the same amount and other details would be unaffected. This is consistent with the intrinsic arbitrariness in choosing an origin for displacement `q` in an open pipe. **The reverse is true for a closed pipe:** there `⟨q⟩` is zero, as for the clarinet, and control must be exerted by shifting `F(q)` **horizontally**. *(p.1339)*
- It is **not obvious how to choose the shift a priori in either case**; the time-average jet position in a real instrument involves nontrivial fluid-dynamical effects not in the model, of which the **"acoustic streaming" associated with boundary-layer dissipation is only one example** (Refs. 73-75). Simplest to regard the imposed `F(q)` shift as a **disposable parameter chosen for consistency with observed behaviour**. *(p.1339)*

---

## III. CONCLUDING REMARKS

The simple time-domain model defined by Eqs. (10), (11), (25), supplemented where necessary by the hysteresis rule of Sec. IIC, mimics basic aspects of the strongly nonlinear behaviour of the clarinet, violin, and flute families **simply by changing the shapes of `r(t)` and `F(q)`, and by changing the time delay `τ` in Eq. (25)** — zero for clarinet and violin, positive and usually of order half an oscillation period for the flute family. *(p.1339)*

**Three basic phenomena reproduced, easy to understand from the time domain:** *(p.1339)*
1. The **frequency shift** caused by a sufficiently severe nonlinearity `F(q)`, of practical significance for the bowed string (Sec. IIC).
2. The **nonlinear amplitude-limiting mechanism** for clarinet and bowed-string oscillations, tightly controlled by the shape of `F(q)` (Secs. IIB, IIC).
3. The **entirely different amplitude-limiting mechanism in the flute family**, controlled mainly by dissipation in the linear element and hardly at all by the shape of `F(q)` (Sec. IIE). This explains the flute family's relatively long starting transients.

These and many other phenomena are modelled in a qualitatively correct way **even with the simplified `r(t)` and `F(q)` used here for demonstration and ease of programming**. *(p.1339)*

**Practical advice on implementation.** It is generally useful to arrange for simulation parameters to be **varied interactively from the keyboard while the simulation proceeds**, so the simulation can be "played" more or less as a real instrument is played. A little experience with this reminds one of the **nonuniqueness** of nonlinear phenomena: several different regimes may be possible for the same final parameter set, especially for `F(q)` shapes like Fig. 6. One learns how to **encourage a given type of oscillation during the initial transient**, a matter in which musicians develop superlative skill. **Which behaviours are physically realistic for musical-acoustical purposes, and which result from too unrealistic a choice of model characteristics, has yet to be studied systematically.** *(p.1339)*

**Extensions named by the authors** *(p.1339)*
- **Finite reed mass / reed resonance** (Refs. 11, 31): an **integro-differential** system replaces the simple integral system, still amenable to efficient forward time stepping.
- **Brass instruments:** this modification is **essential**, since "reed" or lip mass is of leading importance (Refs. 3, 76).
- **Oboe and other conical-bore instruments:** integro-differential equations also arise naturally, because of the inertia of the air near the small end of the bore. Conical bores are modelled by **replacing Eq. (2) with the corresponding formulae for spherical waves** (Ref. 73).
- **Bowed string:** simulated very realistically with direct extensions involving **integral equations only**. Time-domain simulations proved extremely helpful in achieving definitive interpretations of laboratory results (Refs. 18, 19, 41, 42).

**Key to an efficient bowed-string algorithm: more than one reflection function** (Ref. 19). **"Right-hand" and "left-hand" reflection functions `r_R(t)` and `r_L(t)`** characterize the shapes of pulses returning to the bow from the two ends of the string (Appendix B). Moreover, for **any quantitative simulation of real strings, or even a *qualitatively* correct simulation of starting transients and other transient behaviour, it is vital to take torsional as well as transverse motion into account.** *(p.1340)*

### The wolf note (Fig. 14, p.1340)

Two wolf simulations from Eqs. (B13), (B14) and (1). Setup: *(p.1340)*
- Gaussian **right-hand** transverse reflection function of the Fig. 4 type, but **realistically narrow**: full width (19) = **3.9% of the round-trip time `T` for the whole string** [`b = (128/3T)^2` in (18), same as Fig. 9 of Ref. 19].
- **Left-hand** transverse reflection function of the Fig. 15 type: a similar main pulse **followed by a weak, decaying oscillation representing a damped resonance in the left-hand string termination**. The main pulse also has width 3.9%.
- These are classical **"simple" wolves** of the kind first explained by **Raman in 1916** (Ref. 21), for which the resonant period of the string termination is close to the full round-trip time `T` for the two string sections taken together. Here the **resonant period of the string termination is `65T/64`**.
- **Time step `Δt = T/128`.** Propagation delays for transverse waves on the left- and right-hand string sections are in the ratio **24:104**, so the bow is nominally **3/16 of the way along the string**.
- **Torsional and transfer reflection functions are set to zero** in these runs.
- `F(q)` characteristics used in Eq. (1) are those of Fig. 16; they correspond to normal bow forces **`1.2 v_b` and `2.4 v_b`**, in units such that `½Y = 1`, where `v_b (= p)` is the bow speed and `Y` is the transverse wave admittance. **Ratio `Y'/Y` of torsional to transverse wave admittance = 0.2.**
- Waveforms plotted: **center-of-mass string velocity at the bow** (upper) and **bridge velocity on the same scale** (lower).

**Result.** The **only parameter changed between the two simulations was the normal bow force `f_b`** (doubled). The **wolf or "beat" period increased by a factor of about 3/2** when `f_b` increased by a factor 2. Further unpublished simulations showed the **increase is monotonic** as `f_b` varies. The increase is easily understood from Raman's explanation, based on time-domain thinking and the concept of "mini-..." [continues p.1341]. *(p.1340)*

**Erratum noted by the authors:** in the caption to Fig. 9 of Ref. 19, `√3/128` and `(2/3)^{1/2}` are wrong and should be `3/128` and `2/3` respectively; similarly `1.5` in the caption to Fig. 18 of Ref. 41 should be `1.5^2`. *(p.1340)*

**Why the wolf period increase matters.** The simplest frequency-domain explanation of the wolf note (Ref. 77) **fails to predict the increase**, since it associates the wolf period with properties of the linear element alone — and the linear properties are identical in the two simulations shown. Raman's time-domain explanation, via the concept of "minimum bow force" (Refs. 21, 40, 43), does account for it. *(pp.1340-1341)*

**Fig. 15 (p.1341): the left-hand / "bridge" reflection function.** From Ref. 19. Main pulse centered on `t = T_L`, plus a decaying tail proportional to the real part of `exp[(jω - ω/2Q)(t - T_L)]`, representing the effect of free motion of the bridge. In the example shown the free decay has **`Q = 30`**; the same `Q` is used for Fig. 14. Amplitude of bridge motion governed by the admittance ratio `Y^{-1}(SM)^{-1/2}`, where `S` and `M` are the effective stiffness and mass seen by the string at the bridge (Ref. 77) and `Y` is the transverse wave admittance. Here `Y^{-1}(SM)^{-1/2} = 0.05` to make the decaying oscillation clearly visible, **but the more realistic value 0.01 is used for the Fig. 14 simulations**. The main pulse is a Gaussian of full width **3.9% of `T` for the whole string**. *(p.1341)*

**Efficiency trick for oscillatory reflection-function tails.** When computing the convolution integral, gain efficiency by computing the contributions from the main pulse and from the decaying sinusoid **separately**, and using the fact that **the latter contribution to the integral, in complex form, equals the corresponding quantity already computed at the previous time step, multiplied by `exp[(jω - ω/2Q) Δt]`, plus a further contribution from the current time step.** (A one-pole recursive filter update — this is the seed of the recursive loop-filter idea in digital waveguides.) *(p.1341)*

**Fig. 16 (p.1341): the two wolf-note friction characteristics.** Made of **straight line segments** as a computationally convenient approximation. `q` = velocity of the string surface at the bow; `v_b (= p)` = bow speed. Assumed, in qualitative agreement with laboratory evidence (Refs. 43, 47, 48), that **`F(q)` scales with normal bow force `f_b`**. The heavy `F(q)` corresponds to the upper pair of traces in Fig. 14; the light one to the lower pair, with double `f_b`. The straight line represents Eq. (B13) for one value of `q_h = (q_{iL} + q_{iR} + q'_{iL} + q'_{iR})`; its **slope is `(1 + Y'/Y)^{-1} = 0.83`** in the dimensionless units marked on the axes. *(p.1341)*

**Authors' call to experimenters.** "There is now no mathematical nor computational impediment to running extremely realistic and detailed simulations of musical oscillators," potentially useful as **practical design tools in musical instrument manufacture**. The main impediment is **a lack of high-precision experiments yielding sufficient information about real reflection functions and nonlinear characteristics**. To measure all the relevant reflection functions for a real bowed-string instrument, the **surface as well as the center-of-mass motion** of the string has to be excited and observed, at **extremely high spatial and temporal (or phase) resolution**, to see the detail in the transverse and torsional reflection functions relevant to the very fast events of the nonlinear bow-string interaction. *(p.1341)*

**Acknowledgments / funding.** Thanks to A. H. Benade, A. C. Pay, K. Gough (clarinet family); B. J. Bayly, A. H. Benade, J. Coltman, J. E. Ffowcs Williams, H. Ising, N. H. Fletcher (flute family); L. Cremer (bowed-string starting transients). Benade and Cremer read the first draft. JW supported by the Department of Engineering and Clare College, Cambridge; RTS by NSF Grant PHY-8007431; MEM by Nuffield Foundation Grant SCI/168/92 for work on jet-drive fluid dynamics. *(p.1341)*

---

## APPENDIX A: RELATION TO THE THEORY OF ITERATED MAPS

Purpose: show that Eq. (10) can be written, under some conditions, as a nonlinear difference equation or **"iterated map"** (cf. Refs. 36, 37) of a much-studied type. *(p.1341)*

$$
g_j = A H(g_{j-1})
$$
Where: `H(g)` = a nonlinear function of `g` with **a single quadratic extremum** in the domain of the argument; `A` = a constant. `H(g) = g(g-1)` is one simple example (the logistic map). **Eq. (A1)** *(p.1341)*

General behaviour for different `A` reviewed by May (Ref. 24); recent advances by Feigenbaum (Ref. 26); overview in the monograph by Collet and Eckmann (Ref. 25). One motivation is the possible connection between solutions of (A1) and the **onset of "turbulence" or chaotic behaviour** in less simple systems; Feigenbaum's predicted behaviour has been found in systems more complicated than those for which the theorem is proved, e.g. certain fluid-dynamical systems (Refs. 27-29). *(pp.1341-1342)*

**Derivation.** Suppose the reflection function is a **delta function**, `r(t) = A δ(t - T)`, and **drop the requirement that `A = -1`**. Then in units with `Z = 1`, Eq. (10) with (11) becomes *(p.1342)*

$$
q_n = A (q_{n-1} + f_{n-1}) + f_n
$$
Where: `q_n` = the value of `q(t)` for `t` between `nT` and `(n+1)T`. All the time-dependent functions are constant for each round-trip period `T`, changing their values instantaneously only at times `T` later than the last change. **Eq. (A2)** *(p.1342)*

Corresponding to `2q_i` and `2q_o` in (9), define *(p.1342)*

$$
g_n = q_n - f_n
$$
**Eq. (A3)** *(p.1342)*

$$
h_n = q_n + f_n
$$
**Eq. (A4)** *(p.1342)*

`h` appears to depend on both `q` and `f`. However, **if specifying `g` uniquely determines `q`, then `h = H(g)`** and the problem takes the form of (A1). **As long as the maximum positive slope of `F(q)` is less than unity (no hysteresis), `g` does uniquely determine `q`.** *(p.1342)*

**Findings.** *(p.1342)*
- With an `F(q)` like Fig. 3 (clarinet parabola) and `A` **negative**, `AH(g)` has a **single quadratic minimum at a positive value of `g`**, so **Feigenbaum's conditions (Ref. 26) are satisfied.** The theoretical interest lies in how the oscillation period depends on `A`.
- Computer simulations of the system (A1) with an `F(q)` of the Fig. 3 type found **the expected succession of period doublings as `A` is decreased towards `-1`, following quantitatively the universal behaviour predicted by Feigenbaum.**
- With `F(q)` of the Fig. 6 type (bow), the model becomes **the Raman model of a string bowed at its midpoint**. As in Sec. IID, one still gets sequences of period doublings, but with **different asymptotic behaviour**, as expected since the extremum in `H(g)` is **no longer quadratic**.
- For some `F(q)` curves there are **ranges of `A` for which the period is very large** (often exceeding the simulation time) **and the spectrum is very complicated, occasionally even resembling broadband noise.**
- **All these phenomena persist when `r(t)` is given small but finite width.**

---

## APPENDIX B: MORE REALISTIC MODELS OF THE BOWED STRING

### B.1 Asymmetric termination, arbitrary bow position: two reflection functions

Introduce **separate reflection functions `r_L(t)` and `r_R(t)`** for the sections of string to the left and right of the bow (Ref. 19). They concisely describe the effects of the left- and right-hand string **terminations**, together with the **propagation delay, high-frequency attenuation and wave dispersion** on each section of the string. The terminations may be of any kind, provided that both they and the string behave linearly. *(p.1342)*

**Notation warning:** `r_L(t)` and `r_R(t)` were called **"corner-rounding functions"** in Ref. 19 and were defined there with **sign and time-origin conventions differing from those used here**. *(p.1342)*

Equation (1) is unaltered: *(p.1342)*

$$
f = F(q)
$$
**Eq. (B1)** *(p.1342)*

Eq. (4) is replaced by the pair: *(p.1342)*

$$
q_{iL} = r_L * q_{oL}, \qquad q_{iR} = r_R * q_{oR}
$$
**Eq. (B2)** *(p.1342)*

Eq. (7) becomes: *(p.1342)*

$$
q = q_{oL} + q_{iL} = q_{oR} + q_{iR}
$$
**Eq. (B3)** *(p.1342)*

Eq. (8) becomes: *(p.1342)*

$$
\tfrac{1}{2} Y f = q_{oL} - q_{iR} = q_{oR} - q_{iL}
$$
**Eq. (B4)** *(p.1342)*

Where: `q_{oL}(t)`, `q_{iL}(t)` = outgoing and incoming **velocity** waves to the **left** of the bow; `q_{oR}(t)`, `q_{iR}(t)` = those to the **right**; `Y` = wave **admittance** of the string. Admittance plays the same mathematical role for the bowed string as impedance does for the clarinet, because `q` is now the transverse velocity of the string at the bow (was mouthpiece pressure) and `f` is the friction force exerted on the string (was flow past the reed). *(p.1342)*

Physical reading of the first of (B4): **the wave going out to the left is the same as the wave coming in from the right, apart from an additional contribution due to the friction force `f`.** The effect of `f` is to generate additional velocity waves `½Yf` which **radiate equally in both directions away from the bow**. The implied symmetry shows up as the **invariance of (B4) under exchange of the suffices `L` and `R`**. *(p.1342)*

**(B1)-(B4) are complete but not all independent**, since the right-hand equalities in (B3) and (B4) are equivalent. Rearranged into a complete, independent set preserving the formal `L`/`R` symmetry and convenient for numerical solution — subtracting (B4) from (B3): *(p.1342)*

$$
q = (q_{iL} + q_{iR}) + \tfrac{1}{2} Y f
$$
**Eq. (B5)** — compare Eq. (10). *(p.1342)*

Using (B4) to eliminate `q_{oL}` and `q_{oR}` from (B2): *(p.1342)*

$$
q_{iL} = r_L * (q_{iR} + \tfrac{1}{2} Y f), \qquad q_{iR} = r_R * (q_{iL} + \tfrac{1}{2} Y f)
$$
**Eq. (B6)** — compare Eq. (11). *(p.1342)*

**Algorithm (asymmetric bowed string).** Equations (B1), (B5), (B6) are solved numerically **in just the same simple way as before**, with `(q_{iL} + q_{iR})` playing the role of `q_h` and representing the contribution to `q(t)` attributable to past history. This is what was done in Ref. 19. At each time step: *(p.1342)*
1. Use **(B6)** to compute the new values of `q_{iL}` and `q_{iR}`.
2. Solve **(B1)** and **(B5)** simultaneously to get the new values of `q` and `f`.
3. The **Friedlander-Keller ambiguity**, if it occurs, is resolved using the **hysteresis rule** of Sec. IIC (shown in detail in Ref. 19).

The next major step towards realism is to allow for **torsional string motion**, which is highly significant for how a real string responds to the bow, especially during any kind of transient. *(p.1342)*
