---
title: "Improving the Readability of Time-Frequency and Time-Scale Representations by the Reassignment Method"
authors: "François Auger, Patrick Flandrin"
year: 1995
venue: "IEEE Transactions on Signal Processing, Vol. 43, No. 5"
doi_url: "https://doi.org/10.1109/78.382394"
pages: "1068-1089"
---

# Improving the Readability of Time-Frequency and Time-Scale Representations by the Reassignment Method

> Page citations use the **printed journal page numbers** (1068-1089). PDF page index = printed page - 1068.

## One-Sentence Summary
Generalizes Kodera/Gendrin/de Villedary's "modified moving window method" from the spectrogram to *any* bilinear time-frequency or time-scale distribution, by reassigning each computed value from its grid point $(t,\omega)$ to the local center of gravity $(\hat t, \hat\omega)$ of the energy distribution, and — critically for implementation — shows that for the common representations the reassignment operators reduce to ratios of two or three cheap extra transforms (STFTs or pseudo-Wigner-Villes) computed with modified windows $\mathcal{T}h$ and $\mathcal{D}h$.

## Problem Addressed
Bilinear time-frequency representations trade off two evils *(p.1068)*:
- The **Wigner-Ville distribution (WVD)** has excellent concentration but severe **cross-terms** (interference between components), which mislead visual interpretation and pollute pattern recognition.
- **Smoothing** the WVD (pseudo-WVD, smoothed pseudo-WVD, spectrogram, reduced-interference distributions) attenuates the oscillating cross-terms but **broadens the signal components**, degrading localization. The Gabor-Heisenberg inequality makes the spectrogram's time/frequency resolution tradeoff unavoidable *(p.1068)*.
- The result: a smoothed representation can be nonzero at a point $(t,\omega)$ where the WVD indicates no energy, purely because there is nonzero WVD energy *nearby* *(p.1069)*.

Prior remedies were unsatisfying: decomposition into elementary components [27]-[29], or image-processing removal of interference terms [30]-[32], which "works fairly well, except when signal components and cross-terms overlap" *(p.1069)*. The Kodera et al. Modified Moving Window Method [33],[34] solved this correctly but "remained unused because of implementation difficulties and because its efficiency was not proved theoretically" *(p.1068)*.

## Key Contributions
- A **new formulation** of the reassignment method, expressed as a center-of-gravity assignment rather than a phase-derivative correction, applicable to any smoothed Wigner-Ville distribution *(p.1069)*.
- Proofs of the modified representation's properties: loss of bilinearity, retention of time/frequency shift invariance, energy conservation, and **perfect localization of chirps and impulses** *(p.1070)*.
- **Efficient computation** recipes for: SPWVD, PWVD, reduced interference distributions (Choi-Williams, Born-Jordan), spectrogram, Margenau-Hill spectrogram, pseudo Margenau-Hill, scalogram, affine smoothed pseudo-WVD, Margenau-Hill scalogram, and the "affine Wigner" (Bertrand) distributions *(pp.1070-1080)*.
- Explicit **pseudocode algorithms** (Figs. 2, 6, 8, 9, 10) for the discrete implementations.
- Experimental demonstration on a 4-component synthetic signal and on a real bat echolocation chirp *(pp.1080-1086)*.

## Core Formalism

### 1. Wigner-Ville distribution (the substrate)
$$
\mathrm{WV}(x;t,\omega) = \int x(t+\tau/2)\, x^{*}(t-\tau/2)\, e^{-j\omega\tau}\, d\tau
$$
Where: $x(t)$ is the (analytic) signal, $t$ time, $\omega$ angular frequency, $\tau$ the lag variable. *(p.1068, eq. 1)*

### 2. Cohen's class as a 2-D smoothing of the WVD
$$
\mathrm{TFR}(x;t,\omega) = \iint \phi_{\mathrm{TF}}(u,\Omega)\, \mathrm{WV}(x; t-u, \omega-\Omega)\, du\, \frac{d\Omega}{2\pi}
$$
Where: $\phi_{\mathrm{TF}}(u,\Omega)$ is the smoothing kernel in the time-frequency plane; $(u,\Omega)$ are time and frequency offsets. Every Cohen's class member is a 2-D low-pass filtered WVD. *(p.1069, eq. 2)*

### 3. The reassignment operators (THE central result)
$$
\hat t(x;t,\omega) = t - \frac{\displaystyle\iint u\cdot \phi_{\mathrm{TF}}(u,\Omega)\,\mathrm{WV}(x;t-u,\omega-\Omega)\,du\,\frac{d\Omega}{2\pi}}{\displaystyle\iint \phi_{\mathrm{TF}}(u,\Omega)\,\mathrm{WV}(x;t-u,\omega-\Omega)\,du\,\frac{d\Omega}{2\pi}}
$$
*(p.1069, eq. 3a)*

$$
\hat\omega(x;t,\omega) = \omega - \frac{\displaystyle\iint \Omega\cdot \phi_{\mathrm{TF}}(u,\Omega)\,\mathrm{WV}(x;t-u,\omega-\Omega)\,du\,\frac{d\Omega}{2\pi}}{\displaystyle\iint \phi_{\mathrm{TF}}(u,\Omega)\,\mathrm{WV}(x;t-u,\omega-\Omega)\,du\,\frac{d\Omega}{2\pi}}
$$
*(p.1069, eq. 3b)*

Where: $(\hat t, \hat\omega)$ is the **center of gravity of the energy contributions** that the smoothing averaged into the point $(t,\omega)$. Both numerator and denominator are themselves Cohen's-class members (see eq. 19). *(p.1069)*

### 4. The modified (reassigned) representation
$$
\mathrm{MTFR}(x;t',\omega') = \iint \mathrm{TFR}(x;t,\omega)\,\delta\!\left(t' - \hat t(x;t,\omega)\right)\,\delta\!\left(\omega' - \hat\omega(x;t,\omega)\right)\, dt\, \frac{d\omega}{2\pi}
$$
Where: $\delta$ is the Dirac impulse; the value at $(t',\omega')$ is the **sum of all representation values moved to that point**. *(p.1069, eq. 4)*

Implementation consequences stated by the authors *(p.1069)*:
- Where $\mathrm{TFR}=0$ it is **useless to reassign**; expressions (3a)/(3b) "have neither sense nor use in this case" (0/0). Guard with a magnitude threshold $\epsilon$.
- If the smoothing kernel $\phi_{\mathrm{TF}}(u,\Omega)$ is **real-valued**, the reassignment operators are real-valued too, since the WVD is always real.

## Properties of the Modified Representation *(pp.1069-1070)*

1. **Non-bilinearity.** The operators depend strongly on the signal, so the modified representation leaves Cohen's class. This is the only property lost. *(p.1069)*

2. **Time and frequency shift invariance.** *(p.1070, eq. 5)*
   - If $y(t) = x(t-t_1)\cdot e^{j\omega_1 t}$
   - then $\mathrm{WV}(y;t,\omega) = \mathrm{WV}(x;t-t_1,\omega-\omega_1)$
   - and $\hat t(y;t,\omega) = \hat t(x;t-t_1,\omega-\omega_1)+t_1$, $\hat\omega(y;t,\omega)=\hat\omega(x;t-t_1,\omega-\omega_1)+\omega_1$
   - therefore $\mathrm{MTFR}(y;t',\omega') = \mathrm{MTFR}(x;t'-t_1,\omega'-\omega_1)$

3. **Energy conservation.** *(p.1070, eq. 6)*
$$
\iint \mathrm{MTFR}(x;t',\omega')\,dt'\,\frac{d\omega'}{2\pi} = \int |x(t)|^2\,dt \quad\text{if}\quad \iint \phi_{\mathrm{TF}}(u,\Omega)\,du\,\frac{d\Omega}{2\pi} = 1
$$

4. **Perfect localization of chirps.** *(p.1070, eq. 7)* If $x(t) = A\,e^{j(\omega_1 t + \alpha t^2/2)}$, then $\mathrm{WV}(x;t,\omega) = 2\pi A^2\delta(\omega-\omega_1-\alpha t)$ and $\hat\omega(x;t,\omega) = \omega_1 + \alpha\,\hat t(x;t,\omega)$; therefore the MTFR collapses onto the line $\omega'=\omega_1+\alpha t'$.

5. **Perfect localization of impulses.** *(p.1070, eq. 8)* If $x(t)=A\cdot\delta(t-t_1)$, then $\mathrm{WV}(x;t,\omega)=A^2\delta(t-t_1)$ and $\hat t(x;t,\omega)=t_1$; the MTFR collapses onto $t'=t_1$.

The authors emphasize this is rare: within Cohen's class **only the WVD** perfectly localizes a chirp on its instantaneous frequency law [23]. Reassignment confers that property on *any* smoothed member "however sharp or flat the representation of these signals is" *(p.1070)*.

## Application to Time-Frequency Representations

### A. Smoothed Pseudo Wigner-Ville (SPWVD) *(p.1070)*
Separable kernel $\phi_{\mathrm{TF}}(u,\Omega)=g(u)H(\Omega)$ decouples time and frequency smoothing:
$$
\mathrm{SPWV}_{g,h}(x;t,\omega) = \iint g(u)h(\tau)\, x(t-u+\tau/2)\, x^{*}(t-u-\tau/2)\, e^{-j\omega\tau}\, du\, dt
$$
Where: $g$ and $h$ are real even windows with $h(0)=G(0)=1$. *(p.1070, eq. 9)*

$$
\mathrm{MSPWV}_{g,h}(x;t',\omega') = \iint \mathrm{SPWV}_{g,h}(x;t,\omega)\,\delta(t'-\hat t)\,\delta(\omega'-\hat\omega)\,dt\,\frac{d\omega}{2\pi}
$$
*(p.1070, eq. 10)*

**Efficient operators — two extra SPWVDs only:** *(p.1070, eqs. 11a, 11b)*
$$
\hat t(x;t,\omega) = t - \frac{\mathrm{SPWV}_{\mathcal{T}g,\,h}(x;t,\omega)}{\mathrm{SPWV}_{g,h}(x;t,\omega)}
$$
$$
\hat\omega(x;t,\omega) = \omega + j\,\frac{\mathrm{SPWV}_{g,\,\mathcal{D}h}(x;t,\omega)}{\mathrm{SPWV}_{g,h}(x;t,\omega)}
$$
justified by $\int \Omega H(\Omega) e^{j\Omega\tau}\frac{d\Omega}{2\pi} = -j\frac{dh}{dt}(t)$.

**Window operators (used throughout the paper):** *(p.1071)*
$$
\mathcal{D}h(t) = h'(t) = \frac{dh}{dt}(t) \qquad\text{and}\qquad \mathcal{T}h(t) = t\cdot h(t)
$$
Where: $\mathcal{D}$ is differentiation of the window, $\mathcal{T}$ is multiplication by the running time variable. These two modified windows are the entire computational cost of reassignment.

**Cost:** MSPWVD needs **two additional DFTs** over the SPWVD. Accumulate into a matrix initialized to zero; add SPWVD values as they are computed. *(p.1071)*

### B. Pseudo Wigner-Ville (PWVD) — frequency-only reassignment *(p.1071)*
No time smoothing: $\phi_{\mathrm{TF}}(u,\Omega)=\delta(u)H(\Omega)$.
$$
\mathrm{PWV}_h(x;t,\omega) = \int h(\tau)\,x(t+\tau/2)\,x^{*}(t-\tau/2)\,e^{-j\omega\tau}\,d\tau
$$
with $h(0)=1$, $h'(0)=0$. *(p.1071, eq. 12)*

$$
\hat t(t,\omega) = t
$$
*(p.1071, eq. 14a)*
$$
\hat\omega(t,\omega) = \omega + j\,\frac{\mathrm{PWV}_{\mathcal{D}h}(x;t,\omega)}{\mathrm{PWV}_h(x;t,\omega)}
$$
*(p.1071, eq. 14b)*

This is the **cheapest useful case**: only **one extra FFT** (instead of two), reassignment is a pure frequency displacement, and MPWVD values at time $t'$ depend only on PWVD values at the same time — so both the PWVD and its modified version are fully determined at every analysis instant, column by column. *(p.1071, eq. 13)*

**Marginal preservation.** Because reassignment is frequency-only, the MPWVD's time marginal is the instantaneous power and its first-order frequency moment is the instantaneous frequency: *(p.1071, eqs. 15, 16)*
$$
\int \mathrm{MPWV}_h(x;t',\omega')\frac{d\omega'}{2\pi} = \int \mathrm{PWV}_h(x;t',\omega)\frac{d\omega}{2\pi} = |x(t')|^2
$$
$$
\int \omega'\,\mathrm{MPWV}_h(x;t',\omega')\frac{d\omega'}{2\pi} = \varphi'_x(t')\,|x(t')|^2
$$
Where: $x(t)=|x(t)|e^{j\varphi_x(t)}$ and $\varphi'_x(t)=d\varphi_x/dt$ is the instantaneous frequency.

### C. Reduced Interference Distributions (RID) *(pp.1071-1073)*
Two equivalent rewritings of (2): *(p.1071, eqs. 17, 18)*
$$
\mathrm{TFR}(x;t,\omega) = \iint \phi_{\mathrm{TL}}(u,\tau)\, x(t-u+\tau/2)\, x^{*}(t-u-\tau/2)\, e^{-j\omega\tau}\, du\, d\tau
$$
$$
\mathrm{TFR}(x;t,\omega) = \iint \phi_{\mathrm{DL}}(\xi,\tau)\, A(x;\xi,\tau)\, e^{j(\xi t - \omega\tau)}\,\frac{d\xi}{2\pi}\, dt
$$
Where: $A(x;\xi,\tau)$ is the narrow-band ambiguity function [36]; $\phi_{\mathrm{TL}}$, $\phi_{\mathrm{DL}}$ are the kernel's Fourier transforms in the time-lag (TL) and Doppler-lag (DL) planes: *(p.1072)*
$$
A(x;\xi,\tau) = \int x(t+\tau/2)\,x^{*}(t-\tau/2)\,e^{-j\xi t}\,dt
$$
$$
\phi_{\mathrm{TL}}(u,\tau) = \int \phi_{\mathrm{TF}}(u,\Omega)\,e^{-j\Omega\tau}\,\frac{d\Omega}{2\pi}, \qquad \phi_{\mathrm{DL}}(\xi,\tau) = \int \phi_{\mathrm{TL}}(u,\tau)\,e^{-j\xi u}\,du
$$

**The unifying statement:** the reassignment operators use two particular Cohen's-class members $\mathrm{TFR}^{\hat t}$ and $\mathrm{TFR}^{\hat\omega}$, whose kernels are derived from the base kernel by simple multiplication: *(p.1072, eqs. 19a, 19b)*
$$
\hat t(x;t,\omega) = t - \frac{\mathrm{TFR}^{\hat t}(x;t,\omega)}{\mathrm{TFR}(x;t,\omega)} \quad\text{with}\quad \phi^{\hat t}_{\mathrm{TF}}(u,\Omega) = u\,\phi_{\mathrm{TF}}(u,\Omega)
$$
$$
\hat\omega(x;t,\omega) = \omega - \frac{\mathrm{TFR}^{\hat\omega}(x;t,\omega)}{\mathrm{TFR}(x;t,\omega)} \quad\text{with}\quad \phi^{\hat\omega}_{\mathrm{TF}}(u,\Omega) = \Omega\,\phi_{\mathrm{TF}}(u,\Omega)
$$

**RID definition** — $\phi_{\mathrm{DL}}$ is a real even function of the *product* of its variables: *(p.1072, eq. 20)*
$$
\phi_{\mathrm{DL}}(\xi,\tau)=F(\xi\tau),\quad F(0)=1,\ F'(0)=0;\qquad \phi_{\mathrm{TL}}(u,0)=\delta(u),\quad \phi_{\mathrm{TL}}(u,\tau\ne0)=\tfrac{1}{|\tau|}f(u/\tau)
$$

**Table I — kernels used by the reassignment operators** *(p.1072)*

| Line | Case | Doppler-lag plane | Time-lag plane |
|------|------|-------------------|----------------|
| a | General | $\phi^{\hat t}_{\mathrm{DL}}(\xi,\tau)=j\frac{\partial}{\partial\xi}[\phi_{\mathrm{DL}}(\xi,\tau)]$; $\phi^{\hat\omega}_{\mathrm{DL}}(\xi,\tau)=-j\frac{\partial}{\partial\tau}[\phi_{\mathrm{DL}}(\xi,\tau)]$ | $\phi^{\hat t}_{\mathrm{TL}}(u,\tau)=u\cdot\phi_{\mathrm{TL}}(u,\tau)$; $\phi^{\hat\omega}_{\mathrm{TL}}(u,\tau)=-j\frac{\partial}{\partial\tau}[\phi_{\mathrm{TL}}(u,\tau)]$ |
| b | RID | $\phi^{\hat t}_{\mathrm{DL}}=j\tau F'(\xi\tau)$; $\phi^{\hat\omega}_{\mathrm{DL}}=-j\xi F'(\xi\tau)$ | $\phi^{\hat t}_{\mathrm{TL}}(u,0)=0$, $\phi^{\hat t}_{\mathrm{TL}}(u,\tau\ne0)=\frac{u}{|\tau|}f(u/\tau)$; $\phi^{\hat\omega}_{\mathrm{TL}}(u,0)=0$, $\phi^{\hat\omega}_{\mathrm{TL}}(u,\tau\ne0)=\frac{j}{|\tau|^3}(\tau f(u/\tau)+u f'(u/\tau))$ |
| c | Choi-Williams kernel | $\phi_{\mathrm{DL}}(\xi,\tau)=e^{-\xi^2\tau^2/\sigma}$ | $\phi_{\mathrm{TL}}(u,0)=\delta(u)$; $\phi_{\mathrm{TL}}(u,\tau\ne0)=\frac{1}{\sqrt{4\pi\tau^2/\sigma}}e^{-u^2/(4\tau^2/\sigma)}$ |
| d | Choi-Williams reassignment | $\phi^{\hat t}_{\mathrm{DL}}=-j\frac{2\xi\tau^2}{\sigma}e^{-\xi^2\tau^2/\sigma}$; $\phi^{\hat\omega}_{\mathrm{DL}}=j\frac{2\xi^2\tau}{\sigma}e^{-\xi^2\tau^2/\sigma}$ | $\phi^{\hat t}_{\mathrm{TL}}(u,0)=0$, $\phi^{\hat t}_{\mathrm{TL}}(u,\tau\ne0)=u\cdot\phi_{\mathrm{TL}}(u,\tau\ne0)$; $\phi^{\hat\omega}_{\mathrm{TL}}(u,0)=0$, $\phi^{\hat\omega}_{\mathrm{TL}}(u,\tau\ne0)=\frac{j(2\tau^2-\sigma u^2)}{2\tau|\tau|^3\sqrt{4\pi/\sigma}}e^{-u^2/(4\tau^2/\sigma)}$ |
| e | Born-Jordan kernel | $\phi_{\mathrm{DL}}(\xi,\tau)=\mathrm{Sinc}(\xi\tau/2)$ | $\phi_{\mathrm{TL}}(u,0)=\delta(u)$; $\phi_{\mathrm{TL}}(u,\tau\ne0)=\frac{1}{|\tau|}\mathrm{Rect}(u/\tau,1/2)$ |
| f | Born-Jordan reassignment | $\phi^{\hat t}_{\mathrm{DL}}=\frac{j\tau}{2}\mathrm{Sinc}'(\xi\tau/2)$; $\phi^{\hat\omega}_{\mathrm{DL}}=\frac{-j\xi}{2}\mathrm{Sinc}'(\xi\tau/2)$ | $\phi^{\hat t}_{\mathrm{TL}}(u,0)=0$, $\phi^{\hat t}_{\mathrm{TL}}(u,\tau\ne0)=u\cdot\phi_{\mathrm{TL}}(u,\tau\ne0)$; $\phi^{\hat\omega}_{\mathrm{TL}}(u,0)=0$, $\phi^{\hat\omega}_{\mathrm{TL}}(u,\tau\ne0)=\frac{j}{|\tau|^3}[\tau\mathrm{Rect}(u/\tau,1/2)+u\{\delta(u/\tau+1/2)-\delta(u/\tau-1/2)\}]$ |

with $\mathrm{Sinc}(x)=\frac{\sin x}{x}$ and $\mathrm{Rect}(x,1/2)=1$ if $|x|\le 1/2$, else $0$. *(p.1072)*

**RID scale/shift covariance of the modified version** *(pp.1072-1073, eqs. 21a, 21b, 22)*: if $y(t)=\frac{1}{\sqrt{|b|}}x\!\left(\frac{t-t_1}{b}\right)$, then $\mathrm{TFR}(y;t,\omega)=\mathrm{TFR}\!\left(x;\frac{t-t_1}{b},b\omega\right)$, $\hat t(y;t,\omega)=b\cdot\hat t\!\left(x;\frac{t-t_1}{b},b\omega\right)+t_1$, $\hat\omega(y;t,\omega)=b^{-1}\hat\omega\!\left(x;\frac{t-t_1}{b},b\omega\right)$, therefore $\mathrm{MTFR}(y;t',\omega')=\mathrm{MTFR}\!\left(x;\frac{t'-t_1}{b},b\omega'\right)$. Time shifts and time scalings are preserved.

### D. The Spectrogram — the practically important case *(p.1073)*
Kernel is the WVD of a unit-energy window $h$: $\phi_{\mathrm{TF}}(u,\Omega)=\mathrm{WV}(h;u,\Omega)$.
$$
S_h(x;t,\omega) = |\mathrm{STFT}_h(x;t,\omega)|^2, \qquad \mathrm{STFT}_h(x;t,\omega)=\int x(u)\,h^{*}(t-u)\,e^{-j\omega u}\,du
$$
*(p.1073, eq. 23)*

The spectrogram's kernel is **unseparable**, so time and frequency smoothing spreads are bound and even opposed — which is exactly the resolution tradeoff reassignment sidesteps. *(p.1073)*

**Chain of equivalent forms for the operators** *(p.1073, bottom-of-page display)*:
$$
\hat t(x;t,\omega) = t - \frac{\displaystyle\iint u\cdot \mathrm{WV}(h;u,\Omega)\,\mathrm{WV}(x;t-u,\omega-\Omega)\,du\frac{d\Omega}{2\pi}}{\displaystyle\iint \mathrm{WV}(h;u,\Omega)\,\mathrm{WV}(x;t-u,\omega-\Omega)\,du\frac{d\Omega}{2\pi}}
$$
*(p.1073, eq. 24a)*
$$
\hat t(x;t,\omega) = t - \mathcal{R}\left\{\frac{\displaystyle\iint u\cdot Ri^{*}(h;u,\Omega)\,Ri(x;t-u,\omega-\Omega)\,du\frac{d\Omega}{2\pi}}{\displaystyle\iint Ri^{*}(h;u,\Omega)\,Ri(x;t-u,\omega-\Omega)\,du\frac{d\Omega}{2\pi}}\right\}
$$
*(p.1073, eq. 25a)*

$$
\boxed{\;\hat t(x;t,\omega) = t - \mathcal{R}\left\{\frac{\mathrm{STFT}_{\mathcal{T}h}(x;t,\omega)\cdot \mathrm{STFT}^{*}_{h}(x;t,\omega)}{|\mathrm{STFT}_h(x;t,\omega)|^2}\right\}\;}
$$
*(p.1073, eq. 26a)*

$$
\hat\omega(x;t,\omega) = \omega - \frac{\displaystyle\iint \Omega\cdot \mathrm{WV}(h;u,\Omega)\,\mathrm{WV}(x;t-u,\omega-\Omega)\,du\frac{d\Omega}{2\pi}}{\displaystyle\iint \mathrm{WV}(h;u,\Omega)\,\mathrm{WV}(x;t-u,\omega-\Omega)\,du\frac{d\Omega}{2\pi}}
$$
*(p.1073, eq. 24b)*

$$
\boxed{\;\hat\omega(x;t,\omega) = \omega + \mathcal{I}m\left\{\frac{\mathrm{STFT}_{\mathcal{D}h}(x;t,\omega)\cdot \mathrm{STFT}^{*}_{h}(x;t,\omega)}{|\mathrm{STFT}_h(x;t,\omega)|^2}\right\}\;}
$$
*(p.1073, eq. 26b)*

Where: $\mathcal{R}\{\cdot\}$ and $\mathcal{I}m\{\cdot\}$ are real and imaginary parts; $Ri(x;t,\omega)=x(t)\cdot X^{*}(\omega)e^{-j\omega t}$ is the **Rihaczek distribution**; $\mathcal{T}h(t)=t\,h(t)$ and $\mathcal{D}h(t)=dh/dt$. *(p.1073)*

**Cost:** three STFTs total — with windows $h$, $\mathcal{T}h$, $\mathcal{D}h$ — sharing the same FFT length. Equations (24a), (24b), (26a), (26b) are **new in this paper**; Kodera et al. used only (25a)/(25b). *(p.1073)*

**Reassigned spectrogram is still nonnegative** and retains all spectrogram properties except bilinearity: *(p.1073, eq. 27)*
$$
MS_h(x;t',\omega') = \iint S_h(x;t,\omega)\,\delta(t'-\hat t)\,\delta(\omega'-\hat\omega)\,dt\,\frac{d\omega}{2\pi}
$$

**Why the phase-derivative form is impractical.** Kodera et al.'s Appendix A form shows the operators equal the group delay and instantaneous frequency of the bandpass-filtered signal $y(t)=\mathrm{STFT}(x;t,\omega)$: *(p.1073, eqs. 28a, 28b)*
$$
\hat t(x;t,\omega) = -\frac{\partial}{\partial\omega}[\phi_h(x;t,\omega)], \qquad \hat\omega(x;t,\omega) = \omega + \frac{\partial}{\partial t}[\phi_h(x;t,\omega)]
$$
with $\mathrm{STFT}_h(x;t,\omega)=M_h(x;t,\omega)e^{j\phi_h(x;t,\omega)}$.

The authors explicitly reject this route for implementation: for discrete-time signals the derivatives must become first-order differences **and the STFT phase must be unwrapped**. "This probably explains why this method remained unused. On the other hand, expressions (26a) and (26b) lead to a reliable computation of the reassignment operators." *(p.1074)*

### E. Margenau-Hill Spectrogram (MHS) and Pseudo Margenau-Hill (PMH) *(p.1074)*
The most general Cohen's-class member deduced from linear TFRs — a product of two STFTs with *different* windows, i.e. separable time/frequency filtering of the Rihaczek distribution:
$$
\mathrm{MHS}_{g,h}(x;t,\omega) = \mathcal{R}\{K_{gh}^{-1}\cdot \mathrm{STFT}_g(x;t,\omega)\cdot \mathrm{STFT}^{*}_h(x;t,\omega)\}
$$
*(p.1074, eq. 29)*
$$
\mathrm{MHS}_{g,h}(x;t,\omega) = \mathcal{R}\left\{\iint K_{gh}^{-1} g^{*}(u) H(\Omega) e^{j\Omega u} Ri(x;t-u,\omega-\Omega)\,du\frac{d\Omega}{2\pi}\right\},\quad K_{gh}=\int h(u)g^{*}(u)\,du
$$
*(p.1074, eq. 30)*

For the MHS the authors do **not** use (3a)/(3b) but the center of gravity of the neighboring *Rihaczek* values, because with two distinct windows this point no longer merges to the (3a)/(3b) one, it is computable with two additional STFTs, and it corresponds to a separate use of each STFT's phase: *(p.1074)*

$$
\hat t(x;t,\omega) = t - \mathcal{R}\left\{\frac{\mathrm{STFT}_{\mathcal{T}g}(x;t,\omega)\cdot \mathrm{STFT}^{*}_{g}(x;t,\omega)}{|\mathrm{STFT}_g(x;t,\omega)|^2}\right\} = -\frac{\partial}{\partial\omega}[\phi_g(x;t,\omega)]
$$
*(p.1074, eqs. 31a, 32a, 33a)*
$$
\hat\omega(x;t,\omega) = \omega + \mathcal{I}m\left\{\frac{\mathrm{STFT}_{\mathcal{D}h}(x;t,\omega)\,\mathrm{STFT}^{*}_{h}(x;t,\omega)}{|\mathrm{STFT}_h(x;t,\omega)|^2}\right\} = \omega + \frac{\partial}{\partial t}[\phi_h(x;t,\omega)]
$$
*(p.1074, eqs. 31b, 32b, 33b)*

Note the asymmetry: $\hat t$ uses the **$g$** window family, $\hat\omega$ uses the **$h$** family. *(p.1074)*

$$
\mathrm{MMHS}_{g,h}(x;t',\omega') = \iint \mathrm{MHS}_{g,h}(x;t,\omega)\,\delta(t'-\hat t)\,\delta(\omega'-\hat\omega)\,dt\,\frac{d\omega}{2\pi}
$$
*(p.1074, eq. 34)*

MMHS is non-bilinear, shift-invariant, energy-conserving, and **perfectly concentrated for impulses and sine waves — but NOT for chirps**, because those two classes are the only ones the Rihaczek distribution perfectly localizes. *(p.1074)*

**Pseudo Margenau-Hill (PMH)** [10] — no time smoothing, $g(u)=\delta(u)$: *(p.1074, eqs. 35, 36)*
$$
\mathrm{PMH}_h(x;t,\omega) = \mathcal{R}\{x(t)\cdot \mathrm{STFT}^{*}_h(x;t,\omega)\cdot e^{-j\omega t}\} = \int \frac{h(\tau)}{2}\{x(t)x^{*}(t-\tau)+x(t+\tau)x^{*}(t)\}e^{-j\omega\tau}\,d\tau
$$
with $h$ real even, $h(0)=1$, $h'(0)=0$.

Its operators are a **frequency displacement only**: *(p.1075, eqs. 37a, 37b)*
$$
\hat t(x;t,\omega)=t, \qquad \hat\omega(x;t,\omega)=\omega+\mathcal{I}m\left\{\frac{\mathrm{STFT}_{\mathcal{D}h}(x;t,\omega)\cdot \mathrm{STFT}^{*}_{h}(x;t,\omega)}{|\mathrm{STFT}_h(x;t,\omega)|^2}\right\}
$$

MPMH is easier to implement than MMHS, preserves both the time marginal and the first-order time moment (as for the PWVD), and **preserves the null values of the signal**: *(p.1075, eq. 38)*
$$
\text{if } \exists t_0,\ x(t_0)=0, \text{ then } \forall\omega',\ \mathrm{MPMH}_h(x;t_0,\omega')=\mathrm{PMH}_h(x;t_0,\omega')=0
$$
MPMHD retains all PMHD properties except bilinearity, lost for perfectly localized **sine waves and impulses**. *(p.1075)*

## Application to Time-Scale Representations

### A. General case — affine smoothing of the WVD *(p.1075)*
$$
\mathrm{TSR}(x;t,a) = \iint \phi_{\mathrm{TF}}\!\left(\frac{u}{a},\ \Omega_0 - a\Omega\right)\,\mathrm{WV}(x;t-u,\Omega)\,du\,\frac{d\Omega}{2\pi}
$$
Where: $a$ is scale, $\Omega_0$ the central frequency of the frequency-direction bandpass filtering. For a pure sine of frequency $\omega_1$ the TSR peaks at $a=\Omega_0/\omega_1$, so a TSR can be displayed in a time-frequency plane via $a=\Omega_0/\omega$. *(p.1075, eq. 39)*

Affine smoothing attenuates cross-terms and preserves time shifts and time scalings, but again broadens components — so reassignment is justified here too. *(p.1075)*

**Affine reassignment operators** *(p.1076, eqs. 40a, 40b)*:
$$
\hat t(x;t,a) = t - \frac{\displaystyle\iint u\cdot \phi_{\mathrm{TF}}\!\left(\frac{u}{a},\Omega_0-a\Omega\right)\mathrm{WV}(x;t-u,\Omega)\,du\frac{d\Omega}{2\pi}}{\displaystyle\iint \phi_{\mathrm{TF}}\!\left(\frac{u}{a},\Omega_0-a\Omega\right)\mathrm{WV}(x;t-u,\Omega)\,du\frac{d\Omega}{2\pi}}
$$
$$
\hat\omega(x;t,a) = \frac{\Omega_0}{\hat a(x;t,a)} = \frac{\displaystyle\iint \Omega\cdot \phi_{\mathrm{TF}}\!\left(\frac{u}{a},\Omega_0-a\Omega\right)\mathrm{WV}(x;t-u,\Omega)\,du\frac{d\Omega}{2\pi}}{\displaystyle\iint \phi_{\mathrm{TF}}\!\left(\frac{u}{a},\Omega_0-\Omega\right)\mathrm{WV}(x;t-u,\Omega)\,du\frac{d\Omega}{2\pi}}
$$

**Modified time-scale representation** — note the $(a')^2$ weighting and the $dt\,da/a^2$ hyperbolic measure: *(p.1076, eq. 41)*
$$
\mathrm{MTSR}(x;t',a') = \iint (a')^2\,\mathrm{TSR}(x;t,a)\,\delta(t'-\hat t(x;t,a))\,\delta(a'-\hat a(x;t,a))\,\frac{dt\cdot da}{a^2}
$$
The MTSR is non-bilinear, preserves time shifts and time scalings, distributes signal energy over the whole time-scale plane, and is perfectly localized for chirps and impulses. *(p.1076)*

### B. Affine Smoothed Pseudo Wigner-Ville (ASPWVD) *(p.1076)*
Separable kernel $\phi_{\mathrm{TF}}=g(u)H(\Omega)$ with $G(0)=1$ and $\int H(\Omega_0-a\Omega)\frac{da}{|a|}=1$:
$$
\mathrm{ASPWV}_{g,h}(x;t,a) = \frac{1}{|a|}\iint h(\tau/a)\,g(u/a)\,x(t-u+\tau/2)\,x^{*}(t-u-\tau/2)\,e^{-j\Omega_0\tau/a}\,du\,d\tau
$$
*(p.1076, eq. 42)*
$$
\mathrm{MASPWV}_{g,h}(x;t',a') = \iint (a')^2\,\mathrm{ASPWV}_{g,h}(x;t,a)\,\delta(t'-\hat t)\,\delta(a'-\hat a)\,\frac{dt\cdot da}{a^2}
$$
*(p.1076, eq. 43)*

**Two additional ASPWVDs only:** *(p.1076, eqs. 44a, 44b)*
$$
\hat t(x;t,a) = t - \frac{a\cdot \mathrm{ASPWV}_{\mathcal{T}g,\,h}(x;t,a)}{\mathrm{ASPWV}_{g,h}(x;t,a)}
$$
$$
\hat\omega(x;t,a) = \frac{\Omega_0}{\hat a(x;t,a)} = \frac{\Omega_0}{a} + j\,\frac{\mathrm{ASPWV}_{g,\mathcal{D}h}(x;t,a)}{a\cdot \mathrm{ASPWV}_{g,h}(x;t,a)}
$$
Retains all ASPWVD properties except bilinearity; perfectly localizes chirps and impulses. *(p.1076)*

### C. Affine Pseudo Wigner-Ville (APWVD) — scale displacement only *(p.1076)*
No time smoothing, $\phi_{\mathrm{TF}}(u,\Omega)=\delta(u)H(\Omega)$:
$$
\mathrm{APWV}_h(x;t,a) = \int h\!\left(\frac{\tau}{a}\right) x(t+\tau/2)\,x^{*}(t-\tau/2)\,e^{-j\Omega_0\tau/a}\,d\tau
$$
*(p.1076, eq. 45)*
$$
\mathrm{MAPWV}_h(x;t',a') = \iint (a')^2\,\mathrm{APWV}_h(x;t',a)\,\delta(a'-\hat a(x;t',a))\,\frac{da}{a^2}
$$
*(p.1076, eq. 46)*
$$
\hat t(x;t,a)=t \qquad\text{(47a)}, \qquad \hat\omega(x;t,a)=\frac{\Omega_0}{\hat a(x;t,a)}=\frac{\Omega_0}{a}+j\,\frac{\mathrm{APWV}_{\mathcal{D}h}(x;t,a)}{a\cdot \mathrm{APWV}_h(x;t,a)}
$$
*(p.1076, eq. 47b)* — **only one additional APWVD** required.

Preserves the time marginal and yields an instantaneous-frequency estimator: *(p.1076, eq. 48; p.1077, eq. 49)*
$$
\int \mathrm{MAPWV}_h(x;t',a')\frac{da'}{a'^2} = \int \mathrm{APWV}_h(x;t',a)\frac{da}{a^2} = |x(t')|^2
$$
$$
\int \frac{1}{a'}\mathrm{MAPWV}_h(x;t',a')\frac{da'}{a'^2} = \int \frac{1}{\hat a(x;t,a)}\mathrm{APWV}_h(x;t',a)\frac{da}{a^2} = \frac{\varphi'_x(t')}{\Omega_0}|x(t')|^2
$$

### D. The Scalogram *(p.1077)*
Kernel = WVD of a window $h(u)$; the scalogram is the squared modulus of the continuous wavelet transform:
$$
SC_h(x;t,a) = |\mathrm{CWT}_h(x;t,a)|^2, \qquad \mathrm{CWT}_h(x;t,a)=\frac{1}{\sqrt{|a|}}\int x(u)\,h^{*}\!\left(\frac{t-u}{a}\right) e^{j\Omega_0(t-u)/a}\,du
$$
*(p.1077, eq. 50)*

Criticism motivating reassignment: the scalogram's time-frequency resolution is **frequency-dependent** — high time / low frequency resolution at high frequencies, and the reverse at low frequencies — but in every case still bounded by Heisenberg-Gabor, so "time and frequency resolutions ... can't be both taken as small as desired." *(p.1077)*

**Efficient operators — two particular scalograms (CWTs with windows $\mathcal{T}h$ and $\mathcal{D}h$):** *(p.1077, eqs. 51a-53b)*
$$
\hat t(x;t,\omega) = t - \mathcal{R}\left\{\frac{a\cdot \mathrm{CWT}_{\mathcal{T}h}(x;t,a)\cdot \mathrm{CWT}^{*}_{h}(x;t,a)}{|\mathrm{CWT}_h(x;t,a)|^2}\right\}
$$
*(p.1077, eq. 53a)*
$$
\hat\omega(x;t,\omega) = \frac{\Omega_0}{a} + \mathcal{I}m\left\{\frac{\mathrm{CWT}_{\mathcal{D}h}(x;t,a)\cdot \mathrm{CWT}^{*}_{h}(x;t,a)}{a\,|\mathrm{CWT}_h(x;t,a)|^2}\right\}
$$
*(p.1077, eq. 53b)*

Intermediate forms (51a)/(51b) express the operators over the WVD, and (52a)/(52b) over the **Rihaczek** distribution — the paper notes that (40a)/(40b) are equivalent to a center of gravity measured with the Rihaczek rather than the Wigner-Ville distribution, which is precisely what yields the cheap CWT-ratio form. *(p.1077)*

$$
\mathrm{MSC}_h(x;t',a') = \iint (a')^2 SC_h(x;t,a)\,\delta(t'-\hat t)\,\delta(a'-\hat a)\,\frac{dt\cdot da}{a^2}
$$
*(p.1077, eq. 54)* — nonnegative, retains all scalogram properties except bilinearity, gains perfect localization of chirps and impulses.

## Numerical Examples *(pp.1077-1086)*

**Test signal** *(p.1077)*: a **256-point** computer-generated signal with four components:
1. one sine wave,
2. one (linear) chirp,
3. one chirped Gaussian packet,
4. one constant-amplitude signal whose instantaneous frequency describes **half a sine period**.

Fig. 3 (p.1075) plots the four instantaneous frequency laws — the "time-frequency skeleton" a representation should approach.

**Display convention (important for fair comparison)** *(p.1078)*: all figures use the **same six gray-scale levels, spaced logarithmically from the TFR maximum down to one hundredth of that maximum**. The authors stress readability was *not* improved by a misleading display mode.

**Qualitative results walked through in the text** *(p.1078)*:
- **Fig. 4 — WVD:** components well localized, but numerous high-amplitude oscillating cross-terms make it "hardly readable."
- **Fig. 5(a) — PWVD** (79-point Gaussian window): frequency-direction smoothing reduces cross-terms; easier interpretation but coarser localization. **Fig. 5(b) — MPWVD:** improvement "obvious"; all components *and cross-terms* much better localized; sine wave and chirp **perfectly concentrated**.
- **Fig. 6(a) — SPWVD** (adds 39-point Gaussian time smoothing): very few cross-terms, but weaker concentration. **Fig. 6(b) — MSPWVD:** "nearly ideal" — cross-terms removed by the smoothing, components strongly localized by reassignment.
- **Fig. 7 — Margenau-Hill:** hardly readable; concentration is worse [39] and cross-terms are **twice as numerous** as in the WVD.
- **Fig. 8(a) — Pseudo Margenau-Hill** (31-point Gaussian frequency smoothing): easier, but cross-terms remain superimposed on components. **Fig. 8(b) — MPMHD:** much better localized; **perfectly concentrated for the sine wave**.
- **Fig. 9(a) — Margenau-Hill spectrogram** (adds 15-point Gaussian time smoothing): suppresses cross-terms. **Fig. 9(b) — MMHSD:** all cross-terms removed by the 2-D filtering; strongly localized components.
- **Fig. 10(a) — spectrogram** (the MHSD with equal time and frequency windows). **Fig. 10(b) — modified spectrogram:** perfectly localizes the chirp component. The authors judge the **modified spectrogram more interesting than the modified MHSD for this signal, even though the plain spectrogram is poor compared to the plain MHSD**.
- **Fig. 11(a) — APWVD:** scale-invariant frequency-direction smoothing; frequency-dependent concentration visible in the chirped component's shape. **Fig. 11(b) — MAPWVD:** much more concentrated, but still retains some cross-terms.
- **Fig. 12(a) — ASPWVD** (adds scale-invariant time-direction smoothing): nearly all cross-terms removed, components less concentrated. **Fig. 12(b) — MASPWVD:** "nearly ideal."
- **Fig. 13(a) — scalogram**, window chosen for the same frequency-direction smoothing as the ASPWVD, which forces an **approximately two times longer time-direction smoothing** [18, appendix D]. All WVD cross-terms removed but time resolution "really inadequate, especially at low frequencies." **Fig. 13(b) — modified scalogram:** much easier to interpret, but the sinusoidal-FM component localizes **more weakly than on the ASPWVD**.
