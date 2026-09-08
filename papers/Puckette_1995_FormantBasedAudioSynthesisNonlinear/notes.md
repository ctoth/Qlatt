---
title: "Formant-based audio synthesis using nonlinear distortion"
authors: "Miller Puckette"
year: 1995
venue: "Journal of the Audio Engineering Society 43(1), pp. 40-47"
doi_url: "https://msp.ucsd.edu/Publications/jaes95.ps"
pages: "40-47"
---

# Formant-based audio synthesis using nonlinear distortion

## One-Sentence Summary
Defines the PAF (Phase-Aligned Formant) generator: a closed-form, fixed-cost time-domain oscillator that produces one formant of specified center frequency, bandwidth, and amplitude by nonlinearly distorting a phasor, with exactly-known partial amplitudes and mutually phase-aligned partials so several formants superpose additively without phase cancellation.

## Problem Addressed
Real-time musical synthesis needs a generator whose *spectral envelope* (formant center frequencies, bandwidths, amplitudes) can be steered directly and continuously, with predictable amplitude and predictable phase, at bounded computational cost. No prior technique met all of: cheapness, numerical stability, predictable output amplitude, and controllable phase for superposition. *(p.2-6)*

## Key Contributions
- The PAF function: a complex exponential sum with a two-sided exponential spectral envelope centered at ω_c with bandwidth δ, evaluated in closed form as a distortion of a phasor. *(p.8)*
- Phase alignment: all partials of a PAF share a phase reference, so summing several PAFs superposes their spectral envelopes predictably (the defect of subtractive synthesis, VOSIM, and FOF). *(p.6, p.8)*
- Direct, independent, time-varying control of center frequency ω_c, bandwidth δ, and fundamental ω_0, with a frequency shift ω_s enabling inharmonic/noisy output. *(p.8-9)*
- Fixed per-sample cost, unlike FOF whose expense scales without bound with parameters. *(p.6-7)*
- A speech analysis/resynthesis demonstration of a spoken word. *(p.1)*

## Methodology
The desired sound is specified as a set of time-varying formants (center frequency, bandwidth, amplitude, voiced/unvoiced). Each formant is produced by one PAF generator. The PAF is defined as a bi-infinite sum of complex exponentials whose amplitudes follow a two-sided exponential (Cauchy-like in log-magnitude) envelope about ω_c; the paper then derives an equivalent closed-form expression computable per-sample with a small fixed number of operations (wavetable lookups plus arithmetic), which is what makes it real-time.

## Key Equations / Statistical Models

Classic FM (for comparison, the technique PAF replaces):

$$
F(t) = \sin(\omega_c t + x \sin(\omega_m t))
$$
Where: $\omega_c$ = carrier angular frequency (rad/s), $\omega_m$ = modulating angular frequency (rad/s), $x$ = index of modulation (dimensionless), $t$ = time (s). *(p.5)*

Bessel expansion of FM, showing why FM spectra are hard to control:

$$
F(t) = \sum_{k=0}^{\infty} J_{k+1}(x)\sin((\omega_c + k\omega_m)t) + \sum_{k=1}^{\infty} (-1)^k J_{k+1}(x)\sin((\omega_c - k\omega_m)t)
$$
Where: $J_{|k+1|}(x)$ = Bessel function of the first kind giving the amplitude of the component at $\omega_c \pm k\omega_m$. As the index changes, components rise and fall non-monotonically, so obtaining a target spectrum is very hard. *(p.6)*

**Definition of the PAF (Eq. 3):**

$$
X(t) = \sum_{k=-\infty}^{\infty} e^{i(k\omega_0 + \omega_s)t - \frac{|(k\omega_0 + \omega_s) - \omega_c|}{\delta}}
$$
Where: $\omega_0$ = fundamental angular frequency (rad/s), $\omega_s$ = frequency shift (rad/s), $\omega_c$ = formant center frequency (rad/s), $\delta$ = formant bandwidth parameter (rad/s). *(p.8)*

Real/imaginary decomposition (Eq. 4):

$$
X(t) = \sum_{k=-\infty}^{\infty} \left(\cos((k\omega_0+\omega_s)t) + i\sin((k\omega_0+\omega_s)t)\right) e^{-\frac{|(k\omega_0+\omega_s)-\omega_c|}{\delta}}
$$
Where: real part is a sum of cosines, imaginary part a sum of sines, all at frequencies $k\omega_0 + \omega_s$. In practice only the real *or* the imaginary part is evaluated. *(p.8)*

Amplitude of the partial at angular frequency ω (Eq. 5) — the PAF spectral envelope:

$$
e^{-\frac{|\omega - \omega_c|}{\delta}}
$$
Where: the envelope is a two-sided exponential in linear frequency, hence a symmetric triangle (a "tent") in decibels centered on $\omega_c$ with slope set by $\delta$. *(p.8)*

## Parameters (running list, extended below)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Fundamental frequency | ω_0 | rad/s | — | — | 8 | Partial spacing; period of the PAF |
| Frequency shift | ω_s | rad/s | 0 | — | 8-9 | Nonzero shifts all partials, giving inharmonic/noisy output |
| Formant center frequency | ω_c | rad/s | 8ω_0 (example) | — | 8-9 | Example in Fig. 3 |
| Formant bandwidth | δ | rad/s | 3ω_0 (example) | — | 8-9 | Exponential envelope decay rate |
| Index of modulation (FM comparison) | x | — | — | — | 5 | Only for the FM baseline |
| dB reference for unit amplitude | — | dB | 100 | — | 9 | Figures 3-4 plot 100 dB = unit amplitude |

## Figures of Interest
- **Fig. 1 (p.3):** 3-D short-time Fourier plot of a recorded spoken word, 0-11 kHz, 0-1 s. Motivates time-varying formant specification; shows the number of prominent peaks, their centers, bandwidths, and amplitudes all changing, and notes that voiced/unvoiced status is invisible in the plot but audible.
- **Fig. 2 (p.7):** Analyzed output of FM synthesis with steadily increasing index, 0-5.5 kHz over 1 s. Shows complicated, criss-crossing formant evolution; the negative control example.
- **Fig. 3 (p.9):** Component strengths of a PAF with ω_c = 8ω_0, δ = 3ω_0. Horizontal axis = partial number (1..21), vertical axis dB with 100 dB = unit amplitude. A clean symmetric triangular peak: rises ~77 dB at partial 1 to ~100 dB at partial 8-9 and falls to ~67 dB by partial 21.
- **Fig. 4 (p.10):** Component strengths of the real part and the imaginary part separately, same parameters. Obtained by adding (real) or subtracting (imaginary) the reflection of the spectrum about ω = 0. The real-part low partials are lifted (~77 dB at partial 1) while the imaginary part's low partials are cut (~67 dB at partial 2), the two differing only near DC.
- **Fig. 5:** Sweeping ω_c with δ held constant — PAF spectral evolution is visibly simpler than FM's.

## Arguments Against Prior Work
- **Additive synthesis [1]:** one oscillator per partial; >100 partials is common, so the oscillator bank and the computation of every partial's target amplitude and frequency are both expensive. *(p.4)*
- **Subtractive synthesis [2], three shortcomings:** (a) filtering changes partial phases (phase-linear filtering would fix it but is too expensive here), so adding two filter outputs does not superpose spectra predictably, and cascading filters makes coefficient design intractable; (b) output amplitude is hard to predict, especially in transients but even in steady state, since a filter narrower than the partial spacing outputs more when its center frequency coincides with a partial, and time-varying coefficients compound this; (c) numerical accuracy of recursive filters is poor [3]. *(p.4-5)*
- **FM [4] and its generalizations [5]:** the first cheap, numerically tractable way to make complex evolving spectra, but the spectra are unmanageable — component amplitudes are Bessel functions of the index, so getting a desired spectrum from these elementary spectra is very hard (Fig. 2). Variants with several modulators or with $f(x\,g(\omega_0 t))$ wavetable pairs still suffer unmanageable spectra. *(p.5-6)*
- **VOSIM [6] and FOF [7]:** both allow direct specification of center frequency and bandwidth and so fix subtractive synthesis's problems (b) and (c), but not (a): their spectra are more complicated than a bandpass filter's and their phases are harder to predict, so superposition is still unreliable. FOF additionally has computational expense that varies without bound with its synthesis parameters, complicating real-time adaptation. *(p.6-7)*

## Design Rationale
- PAF is required to satisfy simultaneously: efficiency of computation, good numerical behavior, and an easily described spectrum whose phases are controlled so simple spectra superpose into desired ones. *(p.8)*
- Timbral parameters are exactly the desired center frequency and bandwidth, so they can be changed over time with stable and predictable results, rather than being indirect consequences of filter coefficients or a modulation index. *(p.8)*
- Only the real or imaginary part of the complex PAF is evaluated in practice, halving the work; the choice changes only the near-DC end of the spectrum (Fig. 4). *(p.9)*

## Section 2: Efficient computation of the PAF

We want $X(t)$ of Eq. 3 at discrete times $t = \{\tau, 2\tau, \ldots\}$ where $\tau$ is the sample period, treating $\omega_0, \omega_c, \omega_s, \delta$ and functions of them as **control signals** taken from envelope generators (i.e. updated at control rate, not per sample). *(p.12)*

### Special case: ω_s = 0 and ω_c = n·ω_0 (n integer)

$$
X(t) = \sum_{k=-\infty}^{\infty} e^{\omega_0\left(ikt - \frac{|k-n|}{\delta}\right)}
$$
*(Eq. 6, p.12)*

Reindexing $k \to k+n$:

$$
X(t) = \sum_{k=-\infty}^{\infty} e^{\omega_0\left(i(k+n)t - \frac{|k|}{\delta}\right)} = C(t)M(t)
$$
*(Eq. 7-8, p.12)*

**Carrier:**

$$
C(t) = e^{in\omega_0 t}
$$
*(Eq. 9, p.12)*

**Modulator:**

$$
M(t) = \sum_{k=-\infty}^{\infty} \left(g e^{i\omega_0 t}\right)^{k}
$$
*(Eq. 10, p.12)* — a two-sided geometric series in $g e^{i\omega_0 t}$; note the $k<0$ terms use $|k|$, so the series converges for $0 < g < 1$.

**Geometric ratio (the bandwidth-to-fundamental coupling constant):**

$$
g = e^{-\frac{\omega_0}{\delta}}
$$
*(Eq. 11, p.12)* — $g$ is exactly the per-partial amplitude ratio between adjacent partials of the exponential envelope. Narrow bandwidth (small δ) ⇒ g near 0; wide bandwidth relative to the fundamental ⇒ g near 1.

**Closed form of the modulator** (following LeBrun [8]):

$$
M(t) = 2\,\mathrm{Re}\left(\frac{1}{1 - g e^{i\omega_0 t}}\right) - 1
$$
*(Eq. 12, p.12)*

$$
M(t) = 2\,\mathrm{Re}\left(\frac{1 - g e^{-i\omega_0 t}}{1 + g^2 - 2g\cos(\omega_0 t)}\right) - 1
$$
*(Eq. 13, p.12)*

$$
M(t) = \frac{1 - g^2}{1 + g^2 - 2g\cos(\omega_0 t)}
$$
*(Eq. 14, p.13)* — the Poisson kernel. This is the fundamental identity: **the PAF modulator is the Poisson kernel evaluated on the unit circle**, and the whole PAF is a carrier times a Poisson kernel.

### Naive (LeBrun-style) waveshaping form and why it fails

Rewriting Eq. 14 as noted in [5]:

$$
M(t) = \frac{1 - g^2}{(1+g^2)\left(1 - \frac{2g\cos(\omega_0 t)}{1+g^2}\right)} = p_1(t)\, s_1\!\left(x_1(t)\cos(\omega_0 t)\right)
$$
*(Eq. 15-16, p.13)*

with waveshaping function, prescale and index:

$$
s_1(z) = \frac{1}{1+z}
$$
*(Eq. 17, p.13)*

$$
p_1(t) = \frac{1-g^2}{1+g^2}
$$
*(Eq. 18, p.13)*

$$
x_1(t) = \frac{-2g}{1+g^2}
$$
*(Eq. 19, p.13)*

**Cost:** two table lookups (cosine, and $s_1$) and two multiplications per output sample, plus two envelope generators to supply $p_1(t)$ and $x_1(t)$. *(p.13)*

**Numerical failure.** Introduce truncation error $\epsilon$ into the computed $\cos(\omega_0 t)$ and assume the worst case *(Eq. 20, p.13)*:

$$
\cos(\omega_0 t) = 1
$$

The induced error in $M(t)$ is approximately

$$
e \approx p_1(t)\, s_1'(x_1(t))\, \epsilon
$$
*(Eq. 21, p.14)*

Taking $g = 1 - h$ with $h \ll 1$, the **relative** error is

$$
\left|\frac{e}{M(t)}\right| \approx \left|\frac{s_1'(x_1(t))}{s_1(x_1(t))}\right|\epsilon = \frac{\epsilon}{1 - \frac{2g}{1+g^2}} = \frac{\epsilon}{1 - \frac{2(1-h)}{2 - 2h + h^2}} \approx \frac{2\epsilon}{h^2}
$$
*(Eq. 22-25, p.14)*

Where: $h = 1-g$ (dimensionless). The worst case is typical for small $h$, because it is exactly at that phase that the modulator attains its narrow peak. In practice $h$ often descends to **0.1 and lower**, so $s_1$ produces **error growth of 100 or more**, imposing a precision requirement on $\cos(\omega_0 t)$ and downstream arithmetic far higher than FM needs. *(p.14)*

### The numerically stable reformulation (the one to implement)

Rewriting Eq. 14:

$$
M(t) = \frac{1 - g^2}{(1-g)^2 + 2g\left(1 - \cos(\omega_0 t)\right)}
$$
*(Eq. 26, p.14)*

Using the half-angle identity $1 - \cos\theta = 2\sin^2(\theta/2)$:

$$
M(t) = \frac{1 - g^2}{(1-g)^2 + 4g\sin^2\!\left(\frac{\omega_0 t}{2}\right)}
$$
*(Eq. 27, p.14)*

$$
M(t) = \frac{1+g}{(1-g)\left(1 + \frac{4g\sin^2\left(\frac{\omega_0 t}{2}\right)}{(1-g)^2}\right)}
$$
*(Eq. 28, p.15)*

$$
M(t) = p(t)\, s\!\left(x(t)\sin\!\left(\frac{\omega_0 t}{2}\right)\right)
$$
*(Eq. 29, p.15)*

where the stable waveshaping function, prescale, and index are

$$
s(z) = \frac{1}{1 + z^2}
$$
*(Eq. 30, p.15)*

$$
p(t) = \frac{1+g}{1-g}
$$
*(Eq. 31, p.15)*

$$
x(t) = \frac{2\sqrt{g}}{1-g}
$$
*(Eq. 32, p.15)*

**Same low cost of calculation as before** (two table lookups — a half-frequency sine and the $s$ table — plus two multiplies, plus two control-rate envelopes for $p$ and $x$). *(p.15)*

**Error behavior:** the maximum absolute value of $s'(x)/s(x)$ is **1**, so **no error growth takes place during the application of $s$**. This is the decisive numerical argument for the $\sin(\omega_0 t/2)$ / $1/(1+z^2)$ form over the $\cos(\omega_0 t)$ / $1/(1+z)$ form. *(p.15)*

### General case (arbitrary center frequency, nonzero shift)

The above assumed $\omega_c = n\omega_0$ with $n$ integer and $\omega_s = 0$. For arbitrary $\omega_c$ and nonzero $\omega_s$, choose an integer $n$ and a fractional part $0 \le a < 1$ such that

$$
\omega_c - \omega_s = (n + a)\omega_0
$$
*(Eq. 33, p.15)*

Setting $\gamma = \omega_0/\delta$ (so $g = e^{-\gamma}$), Eq. 3 becomes

$$
X(t) = \sum_{k=-\infty}^{\infty} e^{i(k\omega_0 + \omega_s)t - |(k - n - a)\gamma|}
$$
*(Eq. 34, p.16)*

**Fractional-formant interpolation.** The obstruction is the fractional offset $a$ in the exponent. Puckette approximates the exact envelope weight

$$
S = e^{-|(k-n-a)\gamma|}
$$
*(Eq. 35, p.16)*

by a weighted sum of two integer-centered envelopes (centered at partial $n$ and at partial $n+1$):

$$
T = u\,e^{-|(k-n)\gamma|} + v\,e^{-|(k-n-1)\gamma|}
$$
*(Eq. 36, p.16)*

For $k \le n$, using $b = 1 - a$:

$$
|(k-n-a)\gamma| = a\gamma + |(k-n)\gamma| = -b\gamma + |(k-n-1)\gamma|
$$
*(Eq. 37, p.16)*

so that

$$
T = \left(u e^{a\gamma} + v e^{-b\gamma}\right) e^{-|(k-n-a)\gamma|}
$$
*(Eq. 38, p.16)*

and for $k > n$:

$$
T = \left(u e^{-a\gamma} + v e^{b\gamma}\right) e^{-|(k-n-a)\gamma|}
$$
*(Eq. 39, p.16)*

Hence $S = T$ for all integer $k$ exactly when

$$
u e^{a\gamma} + v e^{-b\gamma} = u e^{-a\gamma} + v e^{b\gamma} = 1
$$
*(Eq. 40, p.16)*

**The chosen approximation.** Rather than solving Eq. 40 exactly, approximate $e^x \approx 1 + x$, giving simply

$$
u = b, \qquad v = a
$$
*(p.16)* — i.e. **linear crossfade between the two adjacent integer carrier partials by the fractional part $a$**, with $b = 1-a$.

Accuracy note: the approximation is closest for **small $g$**, which corresponds to **bandwidths several times the fundamental frequency**. In practice the approximation is an *improvement over the exact result* for smaller bandwidths, because the signal power of a swept formant becomes **more nearly constant in time** under it. *(p.16-17)*

### The form in which the PAF is actually computed

$$
X(t) \approx b\sum_{k=-\infty}^{\infty} e^{i(k\omega_0+\omega_s)t - |(k-n)g|} + a\sum_{k=-\infty}^{\infty} e^{i(k\omega_0+\omega_s)t - |(k-n-1)g|}
$$
*(Eq. 41, p.17)*

$$
X(t) = \frac{(1+g)\left(b\,e^{i(n\omega_0+\omega_s)t} + a\,e^{i((n+1)\omega_0+\omega_s)t}\right)}{(1-g)\left(1 + \frac{4g\sin^2\left(\frac{\omega_0 t}{2}\right)}{(1-g)^2}\right)}
$$
*(Eq. 42, p.17)*

$$
X(t) = p(t)\, s\!\left(x(t)\sin\!\left(\frac{\omega_0 t}{2}\right)\right)\left(b\,e^{i(n\omega_0+\omega_s)t} + a\,e^{i((n+1)\omega_0+\omega_s)t}\right)
$$
*(Eq. 43, p.17)* — **"This is the form in which the PAF is actually computed."** The modulator $p\cdot s(x\sin(\omega_0 t/2))$ is a single pulse train shared by both carrier terms; the carrier is a crossfade of two adjacent harmonic phasors, both frequency-shifted by $\omega_s$.

### Generalized waveshaping function (unexplored extension)

Replace $s(z)$ of Eq. 30 with

$$
\sum_{k=1}^{n} \frac{a_k}{1 + c_k z^2}
$$
*(Eq. 44, p.17)*

The resulting spectrum is a **sum of exponentials with different coefficients $g$** — i.e. arbitrary superpositions of exponential skirts, letting one shape non-triangular (in dB) formant skirts. As a limiting special case, letting more than one $c_k$ approach the same value yields **the product of a polynomial by an exponential**. Puckette states these alternate waveshaping functions "have yet to be explored." *(p.17)*

### Section 2.2: Making noisy formants

In the spoken and sung voice, and in many acoustic instruments, parts of the spectrum at certain times are partly or wholly **noisy** — better approximated by spectrally enveloped noise than by a sum of equally spaced harmonics. This is of great importance in natural sounds and worth imitating. *(p.17-18)*

The simplest and perhaps most effective way to make the PAF noisy is **not specific to the PAF at all**: a **post-processor that modulates the PAF output with band-limited noise**. In practice a good result is obtained with the network of Figure 6. *(p.18)*

(Note the alternative implicit in Eq. 3: a nonzero, randomly-varying frequency shift $\omega_s$ also decorrelates the partials, but the paper's recommended route is the noise post-processor.)

## Section 3: Realization

- A single PAF is realized in hardware or software following the **block diagram of Figure 7**. The operations "cos", "sin", and "s" are the cosine, sine, and the waveshaping function of Eq. 30, **with appropriate input normalizations**; all three may be evaluated by **table lookup, with or without interpolation**. *(p.18)*
- For a multi-formant structure, several PAFs are combined as in **Figure 8** (a two-formant configuration), which also includes the **noise post-processor arranged to give independent control of the noisiness of each formant**. *(p.18)*

### Section 3.1: Control issues

- The block-diagram parameters $n$, $a$, $b$, $x$, and $p$ **may not be changed discontinuously without causing audible clicks**. *(p.18)*
- $p$ and $x$ **may be ramped** up and down; $n$, $a$, and $b$ **cannot** be (continued next page). *(p.18)*

### Figure 7 signal flow, traced node by node (p.20)

**Phase generation block** — two independent wrapping phase accumulators, each `accumulator += increment; phase = frac(accumulator)` with a one-sample feedback delay $z^{-1}$:
1. Shift phasor: increment $\tau\omega_s$, output $\phi_s$ (the frequency-shift phase).
2. Half-fundamental phasor: increment $\tau\omega_0/2$, output $\phi_h$ (the *half*-fundamental phase). *(p.20)*

Because `frac` is used, phases are normalized (0..1 per cycle), which is what "with the appropriate input normalizations" means for the cos/sin/s table lookups.

**Modulation block:**
3. $\phi_h$ feeds `sin` **directly** → $\sin(\omega_0 t/2)$.
4. $\phi_h$ also feeds a multiply by the constant **2** → the full fundamental phase $\omega_0 t$.
5. $\omega_0 t$ × $n(t)$ → $n\omega_0 t$.
6. $n\omega_0 t + \phi_s$ → phase of the lower carrier, $(n\omega_0+\omega_s)t$.
7. That sum + $\omega_0 t$ (from step 4) → phase of the upper carrier, $((n+1)\omega_0+\omega_s)t$.
8. Lower carrier: `cos` of step 6, × $b(t)$. Upper carrier: `cos` of step 7, × $a(t)$. Sum → the crossfaded carrier $b\cos((n\omega_0+\omega_s)t) + a\cos(((n+1)\omega_0+\omega_s)t)$.
9. Modulator branch: $\sin(\omega_0 t/2)$ × $x(t)$ → `s` table (Eq. 30, $1/(1+z^2)$).
10. Output = carrier sum × $s(\cdot)$ × $p(t)$. *(p.20)*

This is exactly the real part of Eq. 43. Total per-sample cost: two phase accumulators with wrap, three table lookups (two cosines share one table, one sine, one $s$), and roughly six multiplies plus three adds; the control-rate quantities are $n, a, b, x, p$.

### Figure 8: multi-formant configuration (p.21)

One shared **Phase Generation** block drives **both** Modulation blocks — this is what makes the PAFs *phase-locked* and hence superposable. Each Modulation block's output passes through a **pan** node; the pan splits each formant between (i) a path that goes to the dry sum and (ii) a path that goes into the shared **Noise** post-operator before being summed in. Thus one pan per formant gives **independent control of the noisiness of each formant** while sharing a single noise post-operator. Final output = dry sum + noise-modulated sum. *(p.21)*

### Figure 6: the noise post-operator network (p.19)

Input is fanned into four parallel branches: the direct input and three delayed copies $z^{-a}$, $z^{-b}$, $z^{-c}$. Each branch is multiplied by its **own independent noise generator**, and the four products are summed to the output. Multiplying by band-limited noise at several different delays decorrelates the harmonics without moving the spectral envelope, producing a noisy formant of the same center frequency and bandwidth. *(p.18-19)*

### Control issues, continued (p.22)

- **$n$ cannot be changed continuously** because it is an integer. If $\omega_c$ or $\omega_0$ is swept, $a$ and $b$ **oscillate rapidly up and down**, with an unpleasant effect on the sound. *(p.22)*
- **Solution:** change $n$, $a$, and $b$ **discontinuously at zero crossings of the phase** — at samples where $\omega_0 t$ crosses a multiple of $2\pi$ — because at those instants the value of Eq. 43 is **independent of $n$, $a$, and $b$**. So the update is inaudible. *(p.22)*
- $p$ and $x$ may be **ramped** continuously; only $n$, $a$, $b$ need the period-boundary treatment. *(p.18, p.22)*
- **Low-$\omega_0$ subtlety:** for $\omega_0$ below about **120 radians per second** (≈19 Hz; the paper's stated threshold), period boundaries are so far apart that (a) a rapid parameter change may sound like a **discrete sequence** rather than a continuous change, and (b) the **reaction time can be unacceptably large**, since nothing can change until the next period. Remedy: **ramp the gain quickly to zero, apply the update, ramp the gain back up.** *(p.22)*

### Section 3.2: Example (p.22)

- The recorded word of Figure 1 was resynthesized with **six PAF formants**. *(p.22)*
- The formant tracks were **entered by hand** using the **Explode editor [9]**, not automatically estimated. *(p.22)*
- The resynthesized spectrum (Figure 9) is **visibly similar** to the original. Deviations are partly deliberate: the formants were altered to make the word sound **more natural** even where the resulting spectrum diverged from the original. *(p.22)*

- **Fig. 9 (p.23):** 3-D spectral plot of the six-formant PAF resynthesis of the Figure 1 word, same 0-11 kHz / 0-1 s axes. Visibly similar to Figure 1, but with much more visible individual-harmonic structure (regular harmonic combs under the formant peaks) in the voiced regions.

## Section 4: Conclusion (p.24)

- The PAF generator has been **implemented in real time on the IRCAM Signal Processing Workstation [10]**, and **a patent has been applied for in France**. *(p.24)*
- **Three pieces of music** using the PAF were produced at IRCAM. The first, Philippe Manoury's *La Partition du Ciel et de l'Enfer* for orchestra and live electronics (1988), was conducted by Pierre Boulez at Carnegie Hall [11]. *(p.24)*
- Puckette's own summing-up: of the long list of published synthesis techniques perhaps only half a dozen became standard; it is too early to say whether the PAF joins that canon. **"The PAF's unique feature is the ease with which it can be used to generate sounds with specified time-varying spectral envelopes."** *(p.24)*

## Section 5: Acknowledgements (p.24)
Work carried out while the author was research staff at IRCAM. Philippe Manoury first explored the PAF's musical potential; Stefan Bilbao, Zack Settel, Cort Lippe, Leslie Stuck, and Jonathan Bachrach contributed to its realization in IRCAM's production environment. *(p.24)*

## Complete Parameter Table

### Core PAF parameters (user-facing)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Fundamental angular frequency | ω_0 | rad/s | — | > ~120 (see caveat) | 8, 22 | Partial spacing. Below ~120 rad/s the period-boundary update scheme becomes audible/laggy |
| Frequency shift | ω_s | rad/s | 0 | any | 8, 16 | Shifts all partials off the harmonic series; 0 gives a harmonic tone |
| Formant center frequency | ω_c | rad/s | 8ω_0 (fig. example) | any | 8-9 | Directly settable timbral parameter |
| Formant bandwidth | δ | rad/s | 3ω_0 (fig. example) | > 0 | 8-9 | Exponential envelope decay rate; large δ ⇒ wide formant |
| Sample period | τ | s | — | — | 12 | Phase increments are τω_s and τω_0/2 |

### Derived / internal quantities (computed from the above, at control rate)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Envelope decay per partial | g | — | — | 0 < g < 1 | 12 | g = exp(-ω_0/δ); adjacent-partial amplitude ratio |
| Normalized bandwidth exponent | γ | — | — | > 0 | 16 | γ = ω_0/δ, so g = e^{-γ} |
| Complement of g | h | — | — | often ≤ 0.1 | 14 | h = 1 - g; the naive form's relative error is ≈ 2ε/h² |
| Integer carrier partial index | n | — | — | integer ≥ 0 | 15-16 | From ω_c - ω_s = (n+a)ω_0 |
| Fractional carrier offset | a | — | — | 0 ≤ a < 1 | 15-16 | Upper-carrier crossfade weight (v = a) |
| Complementary crossfade weight | b | — | — | 0 < b ≤ 1 | 16 | b = 1 - a; lower-carrier weight (u = b) |
| Waveshaper index (stable form) | x | — | — | ≥ 2 | 15 | x = 2√g/(1-g); grows without bound as g → 1 |
| Output prescale (stable form) | p | — | — | ≥ 1 | 15 | p = (1+g)/(1-g) |
| Waveshaper index (naive form) | x_1 | — | — | -1 < x_1 ≤ 0 | 13 | x_1 = -2g/(1+g²); do not use |
| Output prescale (naive form) | p_1 | — | — | 0..1 | 13 | p_1 = (1-g²)/(1+g²); do not use |
| dB reference for unit amplitude | — | dB | 100 | — | 9 | Figure convention only |

### Numerical / cost constants

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Table lookups per sample (modulator only) | — | count | 2 | — | 13, 15 | cosine (or half-frequency sine) plus the waveshaping table |
| Multiplies per sample (modulator only) | — | count | 2 | — | 13, 15 | Plus two control-rate envelope generators for p and x |
| Error gain of naive waveshaper | 2/h² | — | ≥ 100 | — | 14 | At h = 0.1, error growth of 100 or more |
| Error gain of stable waveshaper | max\|s'/s\| | — | 1 | — | 15 | No error growth |
| Low-fundamental control threshold | ω_0 | rad/s | 120 | — | 22 | Below this, ramp gain to zero to update |
| Formants in the speech example | — | count | 6 | — | 22 | Hand-entered in the Explode editor |
| Noise post-operator branches | — | count | 4 | — | 19 | Direct plus three delayed taps z^-a, z^-b, z^-c, each times independent noise |

## Methods & Implementation Details
- Evaluate only the real (or only the imaginary) part of the complex PAF; the two differ only in their near-DC partials (Fig. 4). *(p.9)*
- Implement the modulator as $p\cdot s(x\sin(\omega_0 t/2))$ with $s(z)=1/(1+z^2)$, **never** as $p_1\cdot s_1(x_1\cos(\omega_0 t))$ with $s_1(z)=1/(1+z)$. Same cost, no error amplification. *(p.14-15)*
- Phase accumulators wrap via `frac`; increments are $\tau\omega_s$ and $\tau\omega_0/2$. The full-fundamental phase is obtained by doubling the half-fundamental phase, so the *same* accumulator serves both the sine argument and the two cosine carriers. *(p.20)*
- `cos`, `sin`, and `s` may all be table lookups, **with or without interpolation**. *(p.18)*
- Compute $n$ and $a$ from $\omega_c - \omega_s = (n+a)\omega_0$; set $b = 1-a$. *(p.15-16)*
- Update $n$, $a$, $b$ only at phase zero crossings ($\omega_0 t$ crossing a multiple of $2\pi$), where the output is independent of them. *(p.22)*
- Ramp $p$ and $x$ continuously; do not step them. *(p.18)*
- For multiple formants, drive all Modulation blocks from **one shared Phase Generation block** so the formants stay phase-locked and superpose predictably. *(p.21)*
- For noise, pan each formant's output between a dry path and the shared noise post-operator. *(p.21)*
- Possible extension: waveshaping function $\sum_k a_k/(1+c_k z^2)$ yields spectra that are sums of exponentials with distinct $g$, and, in the confluent limit, polynomial-times-exponential envelopes. Unexplored by the author. *(p.17)*

## Results Summary
- A PAF with $\omega_c = 8\omega_0$, $\delta = 3\omega_0$ produces the clean symmetric dB-triangular spectrum of Figure 3, peaking at partial 8-9. *(p.9)*
- Sweeping $\omega_c$ at constant $\delta$ gives the simple, single-peak, cleanly translating spectral evolution of Figure 5, in direct contrast with FM's tangled evolution in Figure 2. *(p.9, p.11)*
- A recorded spoken word was resynthesized with six hand-edited PAF formants; the resynthesized spectrogram (Fig. 9) is visibly similar to the original (Fig. 1). *(p.22-23)*
- The generator ran in real time on the IRCAM Signal Processing Workstation and was used in three concert works. *(p.24)*

## Limitations
- **Approximation error in the fractional-formant crossfade.** The $e^x \approx 1+x$ solution of Eq. 40 ($u=b$, $v=a$) is exact only in the limit; it is closest for small $g$, i.e. **bandwidths several times the fundamental**. Narrow formants (g near 1) depart from the exact envelope, though the author argues the approximation is actually *preferable* there because swept-formant power stays more nearly constant. *(p.16-17)*
- **$n$ is an integer and cannot vary continuously.** Sweeping $\omega_c$ or $\omega_0$ makes $a$ and $b$ oscillate rapidly, "with an unpleasant effect on the sound," forcing period-boundary updates. *(p.22)*
- **Update latency at low fundamentals.** Below about 120 rad/s, updates confined to period boundaries can sound like a discrete sequence and reaction time may be unacceptably large; the workaround (gain to zero, update, gain back) costs amplitude continuity. *(p.22)*
- **Discontinuous changes to $n, a, b, x, p$ cause audible clicks.** *(p.18)*
- **The naive waveshaping formulation is numerically unusable**, amplifying truncation error by 100× or more at typical $h$; the paper's own first-derived form must be discarded. *(p.14)*
- **Noise is bolted on, not intrinsic.** The recommended noise mechanism is a generic post-processor "not really specific to the PAF at all." *(p.18)*
- **The generalized waveshaper (Eq. 44) is unexplored.** *(p.17)*
- **The example's formants were entered by hand** and were deliberately altered away from the measured spectrum for naturalness, so Figure 9 is not evidence of automatic analysis-resynthesis accuracy. *(p.22)*
- A **patent application in France** encumbers the technique as of publication. *(p.24)*

## Testable Properties
- The amplitude of the partial at angular frequency ω is exactly $e^{-|\omega-\omega_c|/\delta}$, so in decibels the spectrum is a symmetric triangle centered at ω_c. *(p.8)*
- $g = e^{-\omega_0/\delta}$ lies strictly in $(0,1)$ for positive δ and ω_0; the modulator series converges only under this condition. *(p.12)*
- $M(t) = (1-g^2)/(1+g^2-2g\cos\omega_0 t)$ is the Poisson kernel: strictly positive, periodic with period $2\pi/\omega_0$, maximum $(1+g)/(1-g)$ at $\omega_0 t = 0$, minimum $(1-g)/(1+g)$ at $\omega_0 t = \pi$. *(p.13)*
- $p(t) = (1+g)/(1-g) \ge 1$ and $x(t) = 2\sqrt{g}/(1-g) \ge 0$; both diverge as $g \to 1$ (very wide formants relative to the fundamental). *(p.15)*
- $\max|s'(x)/s(x)| = 1$ for $s(z) = 1/(1+z^2)$, so the stable form does not amplify input error. *(p.15)*
- $\max|s_1'/s_1| \approx 2/h^2$ for $s_1(z) = 1/(1+z)$ with $g = 1-h$; at $h = 0.1$ this is ≈ 200, i.e. error growth of 100 or more. *(p.14)*
- $a + b = 1$ with $0 \le a < 1$, and $\omega_c - \omega_s = (n+a)\omega_0$ determines $n$ and $a$ uniquely. *(p.15-16)*
- At samples where $\omega_0 t$ is a multiple of $2\pi$, the value of Eq. 43 is independent of $n$, $a$, and $b$; therefore updating those three parameters at such samples introduces no discontinuity. *(p.22)*
- Two PAFs driven by the same phase generation block are phase-aligned, so their spectra add without unpredictable cancellation; this is the property that fails for bandpass filters, VOSIM, and FOF. *(p.4, p.6, p.21)*
- Per-sample cost is constant in all synthesis parameters, unlike FOF whose expense varies without bound. *(p.6-7, p.13)*

## Relevance to Project
For a formant/source-filter speech synthesizer, PAF is the principal **time-domain alternative to a cascade or parallel filter bank**:

- **It replaces one parallel-branch resonator.** Each PAF makes exactly one formant with directly specified F_n and bandwidth, no filter coefficient design, no transient amplitude surprises, and no recursive-filter numerical drift. For a parallel formant architecture this is a drop-in per-branch substitute whose amplitude is known in closed form.
- **Phase alignment is the differentiating property.** In a parallel filter bank the branches' phase responses make their outputs sum unpredictably, which is the classic reason parallel formant synthesizers need per-branch amplitude and sign tweaking. All PAFs sharing one phase generator sum cleanly, so per-formant amplitudes mean what they say.
- **Its spectral envelope is a dB-triangle, not a resonance.** A real vocal-tract formant is a complex-pole resonance whose skirts fall off differently; PAF's two-sided exponential is symmetric in linear frequency. The Eq. 44 generalization (sums of $a_k/(1+c_k z^2)$) is the hook for matching a true resonant skirt, and it is explicitly unexplored, i.e. an opening.
- **Pitch and formant are fully decoupled** by construction ($\omega_0$ vs. $\omega_c$, $\delta$), which is exactly the property a synthesizer needs for pitch-independent phoneme identity, and it works with time-varying values without the coefficient-interpolation pathologies of an IIR bank.
- **Voiced/unvoiced and breathy phonation** map onto the noise post-operator with per-formant pan, plus the frequency shift $\omega_s$ for inharmonicity — a route to fricatives and aspiration inside the same generator topology.
- **Two hard implementation constraints carry straight over:** update $n$, $a$, $b$ only at period boundaries, and use the $\sin(\omega_0 t/2)$ / $1/(1+z^2)$ form. Both are cheap to get wrong and expensive to debug from the audio alone.
- **Relation to FOF/VOSIM/CHANT:** PAF sits in the same family as Rodet's FOF (CHANT) and Kaegi/Templaars's VOSIM as a per-formant time-domain grain generator, but with a fixed cost and a closed-form, phase-controlled spectrum. If the project already evaluates FOF, PAF is the direct comparison point, and Puckette's stated criticisms of FOF (unbounded and parameter-dependent cost, unpredictable phase) are the axes to measure on.
- **Low-fundamental caveat matters for speech**: at 120 rad/s ≈ 19 Hz the threshold is well below any speech F0, so the period-boundary update strategy is safe for voices; but the *reaction time* argument still bounds how fast formant transitions can be committed (one pitch period), which is a real constraint on stop-consonant transitions at low F0.

## Open Questions
- [ ] Can Eq. 44's generalized waveshaper be fitted to a two-pole resonance skirt so PAF matches a Klatt-style formant rather than a dB-triangle? Puckette leaves it unexplored.
- [ ] What is the perceptual cost of the symmetric dB-triangular envelope versus a true resonance for vowel identity?
- [ ] How should formant amplitude be normalized across formants so that a sum of PAFs reproduces a target spectral envelope, given each PAF's peak is unit amplitude at ω_c?
- [ ] Does the fractional-crossfade approximation ($u=b$, $v=a$) hold well enough for speech-typical bandwidths (which are often comparable to, not several times, the fundamental)? The paper's accuracy claim favors wide bandwidths.
- [ ] Is the French patent still in force / relevant? (Filed as of 1995; almost certainly expired, worth confirming before shipping.)
- [ ] How does the noise post-operator's delay-tap structure (z^-a, z^-b, z^-c in Fig. 6) get parameterized — the paper gives the topology but no delay values.

## Related Work Worth Reading
- Chowning, J. (1973), "The synthesis of complex audio spectra by means of frequency modulation," JAES 21/7, 526-534 — the FM baseline PAF is argued against.
- LeBrun, M. (1979), "Digital waveshaping synthesis," JAES 27/4, 250-266 — source of the naive $p_1 s_1(x_1\cos)$ form and of waveshaping generally.
- Moorer, J. A. (1976), "The synthesis of complex audio spectra by means of discrete summation formulae," JAES 24/8, 717-727 — reference [8], the closed-form geometric-series trick PAF's modulator follows.
- Rodet, X., Potard, Y., and Barriere, J.-B. (1984), "The CHANT project: from the synthesis of the singing voice to synthesis in general," CMJ 8/3, 15-31 — FOF, the closest competitor and the most relevant to voice synthesis.
- Templaars, S. (1977), "The VOSIM signal spectrum," Interface 6, 81-96 — the other formant-grain technique.
- Rabiner, L. et al. (1974), "Some comparisons between FIR and IIR digital filters," BSTJ 53, 305-331 — the numerical-accuracy indictment of recursive filters.

