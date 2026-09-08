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

## Algorithm: Discrete MSPWVD Computation (Fig. 2, p.1071)

**Inputs / notation** *(p.1071)*
- $x_R[k]$: real signal with $N_x$ points
- $x[k]$: **analytic signal** of $x_R$
- $g[k]$: time smoothing window of $2M-1$ points
- $h[k]$: frequency smoothing window of $2N-1$ points
- $n_0$: initial time; $\Delta$: time increment (hop)
- $N_T$: number of analysis instants; $N_{\mathrm{TFR}}$: number of frequency bins
- $T_e$: sampling period; $\epsilon$: magnitude threshold below which no reassignment is performed

**Step I — Analytic signal.** For a real signal $x_R[k]$, form the analytic signal $x[k]$, either in the time domain by adding an imaginary part equal to its Hilbert transform, or in the frequency domain: *(p.1071)*
1. Compute the Fourier transform of $x$.
2. Suppress the amplitudes belonging to strictly negative frequencies.
3. Double the amplitudes of strictly positive frequencies.
4. Take the inverse Fourier transform.

**Step II — Allocate.** Create a matrix `MSPWV` of $N_T \times N_{\mathrm{TFR}}$ elements, **initialized to zero**. *(p.1071)*

**Step III — For every analysis time** $n = n_0 + i\Delta$, $i = 0..N_T-1$: *(p.1071)*

Compute three discrete SPWVDs sharing the same double-sum structure (the outer sum over $k$ is the FFT; the inner sum over $l$ is the time smoothing):
$$
\mathrm{SPWV}_{g,h}[x;n,m] = \sum_{k=-N+1}^{N-1} h[k]\left(\sum_{l=-M+1}^{M-1} g[l]\, x[n-l+k]\, x^{*}[n-l-k]\right) e^{-j\frac{2\pi mk}{N_{\mathrm{TFR}}}}
$$
$$
\mathrm{SPWV}_{\mathcal{T}g,h}[x;n,m] = \sum_{k=-N+1}^{N-1} h[k]\left(\sum_{l=-M+1}^{M-1} l\cdot g[l]\, x[n-l+k]\, x^{*}[n-l-k]\right) e^{-j\frac{2\pi mk}{N_{\mathrm{TFR}}}}
$$
$$
\mathrm{SPWV}_{g,\mathcal{D}h}[x;n,m] = \sum_{k=-N+1}^{N-1} h'[k]\left(\sum_{l=-M+1}^{M-1} g[l]\, x[n-l+k]\, x^{*}[n-l-k]\right) e^{-j\frac{2\pi mk}{N_{\mathrm{TFR}}}}
$$
with the **discrete derivative window**
$$
h'[k] = T_e\,\frac{dh}{dt}(kT_e)
$$
*(p.1071)*

Then **for every frequency bin** $m = 0..N_{\mathrm{TFR}}-1$: *(p.1071)*
```
IF ( |SPWV_{g,h}[x;n,m]| > eps ) THEN
    n_hat[n,m] = n - ROUND( (1/Delta) * SPWV_{Tg,h}[x;n,m] / SPWV_{g,h}[x;n,m] ) * Delta
    m_hat[n,m] = m - ROUND( (N_TFR / (2*pi)) * Im{ SPWV_{g,Dh}[x;n,m] / SPWV_{g,h}[x;n,m] } )
    MSPWV[n_hat, m_hat] = MSPWV[n_hat, m_hat] + SPWV_{g,h}[x;n,m]
ENDIF
```
The matrix `MSPWV` finally contains the modified distribution. *(p.1071)*

**Implementation notes on this algorithm:**
- The reassignment is a **rounded-to-nearest-bin scatter-add**, not an interpolation. Energy is accumulated into integer grid cells.
- Sign convention check: eq. (11b) gives $\hat\omega = \omega + j\,\frac{\mathrm{SPWV}_{g,\mathcal{D}h}}{\mathrm{SPWV}_{g,h}}$, and $\mathcal{R}\{j z\} = -\mathcal{I}m\{z\}$, which is exactly the **minus** sign in the `m_hat` line.
- $\hat t$ uses the *time-weighted* window $\mathcal{T}g$ (multiply $g[l]$ by the index $l$); $\hat\omega$ uses the *differentiated* window $\mathcal{D}h$ (replace $h[k]$ with $h'[k]$). Only the windows change; the summation kernel does not.
- The $\epsilon$ guard is mandatory — the operators are $0/0$ where the distribution vanishes *(p.1069)*.
- The analytic signal is required to avoid the negative-frequency interference intrinsic to the WVD of a real signal.

## Table II — Basic Properties of the Representations and Their Modified Versions *(p.1088)*

Transcribed from the shaded-cell matrix. `Y` = property held (shaded), `-` = not held.

| Representation | Bilinearity | Time-freq shifts | Time shifts & time scalings | Energy conservation | Positivity | Instantaneous power | Instantaneous frequency | Null values of x(t) | Perf. loc. chirps | Perf. loc. sine waves | Perf. loc. impulses |
|---|---|---|---|---|---|---|---|---|---|---|---|
| WVD | Y | Y | Y | Y | - | Y | Y | - | Y | Y | Y |
| PWVD | Y | Y | - | Y | - | Y | Y | - | - | - | Y |
| **Modified PWVD** | - | Y | - | Y | - | Y | Y | - | Y | Y | Y |
| SPWVD | Y | Y | - | Y | - | - | - | - | - | - | - |
| **Modified SPWVD** | - | Y | - | Y | - | - | - | - | Y | Y | Y |
| MHD | Y | Y | Y | Y | - | Y | Y | Y | - | Y | Y |
| PMHD | Y | Y | - | Y | - | Y | Y | Y | - | - | Y |
| **Modified PMHD** | - | Y | - | Y | - | Y | Y | Y | - | Y | Y |
| MHSD | Y | Y | - | Y | - | - | - | - | - | - | - |
| **Modified MHSD** | - | Y | - | Y | - | - | - | - | - | Y | Y |
| Spectrogram | Y | - | Y | Y | Y | - | - | - | - | - | - |
| **Modified Spectrogram** | - | - | Y | Y | Y | - | - | - | Y | Y | Y |
| Scalogram | Y | - | Y | Y | Y | - | - | - | - | - | - |
| **Modified Scalogram** | - | - | Y | Y | Y | - | - | - | Y | Y | Y |
| ASPWVD | Y | - | Y | Y | - | - | - | - | - | - | - |
| **Modified ASPWVD** | - | - | Y | Y | - | - | - | - | Y | Y | Y |
| APWVD | Y | - | Y | Y | - | Y | - | - | - | - | Y |
| **Modified APWVD** | - | - | Y | Y | - | Y | Y | - | Y | Y | Y |

*Caveat: the printed table marks the spectrogram row as holding "time shifts and time scalings" but not "time-frequency shifts", which is the affine-family pattern rather than the Cohen's-class pattern one expects for a spectrogram. Transcribed as printed; verify against the original before relying on those two spectrogram/scalogram cells.*

**Reading of the table (the paper's own summary, p.1081):** the only property lost by reassignment across every row is bilinearity. **In the spectrogram and scalogram cases nonnegativity is preserved**, so reassignment yields a whole class of nonnegative time-frequency representations (the modified spectrograms) and a whole class of nonnegative time-scale representations (the modified scalograms) that are **perfectly localized for chirps and impulses** — and the authors state that "to our knowledge there exists no other time-frequency and time-scale representations with the same properties."

## Appendix — Derivation of the Spectrogram Reassignment Operators *(pp.1081, 1088)*

Starting equality *(p.1081)*:
$$
\mathrm{STFT}_g(x;t,\omega)\cdot \mathrm{STFT}^{*}_h(x;t,\omega) = \iint \mathrm{WV}(h\cdot g;u,\Omega)\,\mathrm{WV}(x;t-u,\omega-\Omega)\,du\,\frac{d\Omega}{2\pi}
$$

For the **time displacement** *(p.1088)*:
$$
\mathcal{R}\{\mathrm{STFT}_{\mathcal{T}h}(x;t,\omega)\cdot \mathrm{STFT}^{*}_h(x;t,\omega)\} = \iint u\,\mathrm{WV}(h;u,\Omega)\,\mathrm{WV}(x;t-u,\omega-\Omega)\,du\,\frac{d\Omega}{2\pi}
$$
since $\mathcal{R}\{\mathrm{WV}(h\cdot\mathcal{T}h;u,\Omega)\} = \mathcal{R}\{u\,\mathrm{WV}(h;u,\Omega) - \int \frac{\tau}{2}h(u+\tau/2)h^{*}(u-\tau/2)e^{-j\Omega\tau}d\tau\} = u\,\mathrm{WV}(h;u,\Omega)$.

For the **frequency displacement** *(p.1088)*:
$$
-\mathcal{I}m\{\mathrm{STFT}_{\mathcal{D}h}(x;t,\omega)\cdot \mathrm{STFT}^{*}_h(x;t,\omega)\} = \iint \Omega\,\mathrm{WV}(h;u,\Omega)\,\mathrm{WV}(x;t-u,\omega-\Omega)\,du\,\frac{d\Omega}{2\pi}
$$
since
$$
\mathcal{I}m\{\mathrm{WV}(h\cdot\mathcal{D}h;u,\Omega)\} = \mathcal{I}m\left\{-j\Omega\,\mathrm{WV}(h;u,\Omega) + \int j\frac{\xi}{2}H(\Omega+\xi/2)H^{*}(\Omega-\xi/2)e^{j\xi u}\frac{d\xi}{2\pi}\right\} = -\Omega\,\mathrm{WV}(h;u,\Omega)
$$

The **phase-derivative identities** (32a)/(32b) then follow from Rihaczek [35] *(p.1088)*:
$$
\frac{\partial}{\partial t}[\mathrm{STFT}_h(x;t,\omega)] = \frac{\partial}{\partial t}[M_h]\,e^{j\phi_h} + j\frac{\partial}{\partial t}[\phi_h]\cdot \mathrm{STFT}_h(x;t,\omega) = \mathrm{STFT}_{\mathcal{D}h}(x;t,\omega)
$$
$$
\frac{\partial}{\partial \omega}[\mathrm{STFT}_h(x;t,\omega)] = \frac{\partial}{\partial \omega}[M_h]\,e^{j\phi_h} + j\frac{\partial}{\partial \omega}[\phi_h]\cdot \mathrm{STFT}_h(x;t,\omega) = -jt\,\mathrm{STFT}_h(x;t,\omega) + j\,\mathrm{STFT}_{\mathcal{T}h}(x;t,\omega)
$$
*(As printed, both display lines are labelled $\partial/\partial t$; the second is clearly $\partial/\partial\omega$ — a typo in the journal text.)*

**This is the practical takeaway:** the modified-window STFT products are exactly the phase derivatives, computed **without ever forming or unwrapping a phase**.

## Parameters

### Experimental configuration (synthetic 4-component signal)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Signal length | $N_x$ | samples | 256 | — | 1077 | Computer-generated 4-component test signal |
| Number of signal components | — | count | 4 | — | 1077 | Sine, chirp, chirped Gaussian packet, half-sine-period FM |
| PWVD frequency window length | $h$ | points | 79 | — | 1079 | Gaussian; Fig. 5(a) |
| SPWVD time window length | $g$ | points | 39 | — | 1080 | Gaussian; Fig. 6(a); $h$ same as Fig. 5(a) |
| PMHD frequency window length | $h$ | points | 31 | — | 1082 | Gaussian; Fig. 8(a) |
| MHSD time window length | $g$ | points | 15 | — | 1083 | Gaussian; Fig. 9(a); $h$ same as Fig. 8 |
| Spectrogram window length | $h$ | points | 31 | — | 1084 | Gaussian; Fig. 10(a); MHSD with $g=h$ |
| APWVD window time-bandwidth | $F_0\cdot Th$ | — | 4.24 | — | 1085 | Gaussian window; Fig. 11(a) |
| ASPWVD time-window time-bandwidth | $F_0\cdot Tg$ | — | 1.0 | — | 1086 | Gaussian; Fig. 12(a); $h$ as Fig. 11 |
| Scalogram window time-bandwidth | $F_0\cdot Th$ | — | 3.0 | — | 1087 | Gaussian; Fig. 13(a) |
| Gray-scale levels in all TFR displays | — | count | 6 | — | 1078 | Logarithmic from max down to max/100 |
| Display dynamic range | — | ratio | 1/100 | — | 1078 | Floor relative to TFR maximum |

### Algorithm parameters (Fig. 2, MSPWVD)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Frequency smoothing window length | — | points | $2N-1$ | odd | 1071 | Window $h[k]$, $k=-N+1..N-1$ |
| Time smoothing window length | — | points | $2M-1$ | odd | 1071 | Window $g[l]$, $l=-M+1..M-1$ |
| Analysis instants | $N_T$ | count | — | — | 1071 | Rows of the output matrix |
| Frequency bins | $N_{\mathrm{TFR}}$ | count | — | — | 1071 | Columns; FFT length |
| Initial time | $n_0$ | samples | — | — | 1071 | First analysis instant |
| Time increment (hop) | $\Delta$ | samples | — | — | 1071 | $n = n_0 + i\Delta$ |
| Sampling period | $T_e$ | s | — | — | 1071 | Scales the derivative window $h'[k]=T_e h'(kT_e)$ |
| Reassignment magnitude threshold | $\epsilon$ | same as TFR | — | $>0$ | 1071 | Skip reassignment where $|\mathrm{SPWV}_{g,h}|\le\epsilon$ |
| Window normalization (SPWVD) | $h(0)$, $G(0)$ | — | 1 | — | 1070 | Required for energy conservation |
| Window normalization (PWVD / PMHD) | $h(0)$, $h'(0)$ | — | 1, 0 | — | 1071, 1074 | $h$ real even |
| Kernel normalization for energy conservation | $\iint\phi_{\mathrm{TF}}$ | — | 1 | — | 1070 | Condition in eq. (6) |
| Choi-Williams kernel parameter | $\sigma$ | — | — | $>0$ | 1072 | $\phi_{\mathrm{DL}}=e^{-\xi^2\tau^2/\sigma}$ |
| RID kernel constraints | $F(0)$, $F'(0)$ | — | 1, 0 | — | 1072 | Defines the RID class |
| Wavelet central frequency | $\Omega_0$ | rad/s | — | — | 1075 | Maps scale to frequency via $a=\Omega_0/\omega$ |

## Computational Cost Summary

| Representation | Base transform | Extra transforms for reassignment | Displacement | Page |
|---|---|---|---|---|
| PWVD | 1 FFT/frame | **+1** ($\mathcal{D}h$) | frequency only | 1071 |
| SPWVD | 1 FFT/frame | **+2** ($\mathcal{T}g$, $\mathcal{D}h$) | time + frequency | 1070-1071 |
| Spectrogram | 1 STFT | **+2** ($\mathcal{T}h$, $\mathcal{D}h$) | time + frequency | 1073 |
| Margenau-Hill spectrogram | 2 STFT ($g$, $h$) | **+2** ($\mathcal{T}g$, $\mathcal{D}h$) | time + frequency | 1074 |
| Pseudo Margenau-Hill | 1 STFT | **+1** ($\mathcal{D}h$) | frequency only | 1075 |
| Scalogram | 1 CWT | **+2** ($\mathcal{T}h$, $\mathcal{D}h$) | time + scale | 1077 |
| ASPWVD | 1 | **+2** ($\mathcal{T}g$, $\mathcal{D}h$) | time + scale | 1076 |
| APWVD | 1 | **+1** ($\mathcal{D}h$) | scale only | 1076 |

The paper's own statement: "This requires in the worst cases **two additional Fourier transforms**, which is not really cumbersome," and the two extra representations (19a)/(19b) "use the same signal values as the reassigned representation, and can therefore be computed at the same time." *(p.1081)*

## Figures of Interest

- **Fig. 1 (p.1070):** schematic of the reassignment principle — the $\phi_{\mathrm{TF}}$ support ellipse over the WVD, the computed point $(t,\omega)$, and the shifted center of gravity $(\hat t,\hat\omega)$, with marginals $|X(\omega)|^2$ and $x(t)$ drawn on the axes. The one picture that explains the whole method.
- **Fig. 2 (p.1071):** the MSPWVD computing algorithm (transcribed in full above).
- **Fig. 3 (p.1075):** instantaneous frequency laws of the four test components — the target "time-frequency skeleton", with the time-domain waveform below.
- **Fig. 4 (p.1078):** WVD of the test signal — dense oscillating cross-term interference.
- **Fig. 5 (p.1079):** (a) PWVD, 79-pt Gaussian $h$; (b) modified PWVD.
- **Fig. 6 (p.1080):** (a) SPWVD, $h$ as Fig. 5(a), $g$ = 39-pt Gaussian; (b) modified SPWVD — the paper's "nearly ideal" result.
- **Fig. 7 (p.1081):** Margenau-Hill distribution — the worst case, cross-terms twice as numerous as the WVD.
- **Fig. 8 (p.1082):** (a) PMHD, 31-pt Gaussian $h$; (b) modified PMHD.
- **Fig. 9 (p.1083):** (a) MHSD, $h$ as Fig. 8, $g$ = 15-pt Gaussian; (b) modified MHSD.
- **Fig. 10 (p.1084):** (a) spectrogram, 31-pt Gaussian $h$; (b) modified spectrogram — chirp perfectly localized.
- **Fig. 11 (p.1085):** (a) APWVD, Gaussian with $F_0\cdot Th=4.24$; (b) modified APWVD.
- **Fig. 12 (p.1086):** (a) ASPWVD, $h$ as Fig. 11, $g$ Gaussian with $F_0\cdot Tg=1.0$; (b) modified ASPWVD.
- **Fig. 13 (p.1087):** (a) scalogram, Gaussian with $F_0\cdot Th=3.0$; (b) modified scalogram.
- **Table I (p.1072):** reassignment-operator kernels in the ambiguity (Doppler-lag) and time-lag planes — general, RID, Choi-Williams, Born-Jordan.
- **Table II (p.1088):** property matrix for 18 representations (transcribed above).

## Results Summary

Reassignment gives a large, visually obvious concentration gain on every representation tested, at the cost of two extra transforms and the loss of bilinearity *(pp.1078-1087)*. The clearest wins are:
- **MSPWVD and MASPWVD** are described as "nearly ideal" — smoothing removes cross-terms, reassignment restores concentration *(p.1078)*.
- **Modified spectrogram** perfectly localizes the chirp, and is judged more useful than the modified MHSD on this signal *even though the plain spectrogram is worse than the plain MHSD* *(p.1078)*. Reassignment can therefore reorder the quality ranking of the underlying representations.
- **Modified PWVD** perfectly concentrates both the sine wave and the chirp *(p.1078)*.
- **Reassignment sharpens cross-terms too** — Fig. 5(b) shows "all components *and also all cross-terms* are much better localized" *(p.1078)*.

## Limitations *(pp.1069, 1078, 1081)*

- **Bilinearity is always lost.** The modified representation leaves Cohen's class, so no bilinear-superposition reasoning applies to it *(p.1069)*.
- **Reassignment does not remove cross-terms.** It only concentrates them. "The reassignment method must be associated to a properly chosen smoothing kernel to yield simultaneously a high concentration of the signal components and a cross-terms removal" *(p.1081)*. On its own it makes interference *sharper*, not absent *(p.1078)*.
- **Kernel quality still dominates.** "The better the chosen (or designed) smoothing kernel of a representation fits the analyzed signal, the more readable its modified version" *(p.1081)*.
- The operators are **undefined (0/0) wherever the representation vanishes**, requiring an $\epsilon$ threshold *(p.1069)*.
- The **MMHSD is not perfectly localized for chirps** — only for impulses and sine waves, since those are the only two classes the Rihaczek distribution localizes *(p.1074)*.
- The **modified scalogram localizes a sinusoidally frequency-modulated component more weakly than the modified ASPWVD** at matched frequency smoothing, because the scalogram forces roughly twice the time smoothing *(p.1078)*.
- Reassignment is positioned as **a following stage, not an alternative**, to signal-matched kernel design [26] *(p.1081)*.

## Arguments Against Prior Work

- **Against the plain spectrogram** *(p.1068)*: it provides biased estimators of instantaneous frequency and group delay, and the Gabor-Heisenberg inequality makes its time/frequency resolution tradeoff unavoidable. Its **unseparable kernel** binds and even opposes the time and frequency smoothing spreads *(p.1073)*.
- **Against the plain WVD** *(p.1069)*: nonnegligible cross-terms cause erroneous visual interpretation and hinder pattern recognition by overlapping the searched time-frequency pattern.
- **Against interference-removal by image processing [30]-[32],[24]** *(p.1069)*: recognizing interference terms by their geometry and oscillatory structure "works fairly well, except when signal components and cross-terms overlap."
- **Against signal-decomposition approaches [27]-[29]** *(p.1069)*: they only give a relevant, fewer-cross-term description "when this decomposition scheme is fitted to the analyzed signal."
- **Against the original Kodera/Gendrin/de Villedary formulation [33],[34]** *(pp.1068, 1074)*: it "remained unused because of implementation difficulties and because its efficiency was not proved theoretically"; concretely, the phase-derivative form (28a)/(28b) requires replacing derivatives with first-order differences **and unwrapping the STFT phase**. Auger and Flandrin's ratio-of-STFTs form removes both problems.
- **Against the Margenau-Hill distribution [39]** *(p.1078)*: its signal-component concentration is worse than the WVD's *and* its cross-terms are twice as numerous.
- **Against the scalogram** *(p.1077)*: its resolution is frequency-dependent and still Heisenberg-Gabor bounded, so "time and frequency resolutions ... can't be both taken as small as desired."

## Design Rationale

- **Why center of gravity instead of phase derivatives** *(pp.1069, 1074)*: the center-of-gravity formulation exposes the operators as *ratios of Cohen's-class members* (eq. 19), which are computable by the same machinery as the base representation with two modified windows. The mathematically equivalent phase-derivative form needs numerical differentiation and phase unwrapping, which is why the method lay dormant for 15 years.
- **Why reassign rather than sharpen the kernel** *(p.1069)*: smoothing is still needed to kill cross-terms; reassignment undoes only the *localization* penalty of that smoothing, keeping its *interference* benefit. The two mechanisms are orthogonal, which is why the paper insists on combining them *(p.1081)*.
- **Why the MHS uses Rihaczek-based operators rather than (3a)/(3b)** *(p.1074)*: with two distinct windows $g\ne h$, the Rihaczek center of gravity no longer coincides with the Wigner one; the Rihaczek version is preferred because it needs only two additional STFTs and it corresponds to a **separate use of each STFT's phase** ($\hat t$ from $g$, $\hat\omega$ from $h$).
- **Why the analytic signal** *(p.1071)*: step I of the algorithm mandates it before any WVD-family computation.
- **Why zero-initialized accumulation** *(p.1071)*: the modified representation is a scatter-add, so the output matrix must start at zero and receive contributions as the base distribution is computed — one pass, no second sweep.
- **Why nonnegativity matters** *(p.1081)*: because the reassigned spectrogram and scalogram stay nonnegative, they form the only known families that are simultaneously nonnegative and perfectly localized for chirps and impulses.

## Testable Properties

- Reassigning any Cohen's-class member of a linear chirp $A e^{j(\omega_1 t+\alpha t^2/2)}$ must concentrate all energy on the line $\omega' = \omega_1 + \alpha t'$, regardless of the smoothing window used *(p.1070)*.
- Reassigning any Cohen's-class member of an impulse $A\delta(t-t_1)$ must concentrate all energy on $t' = t_1$ *(p.1070)*.
- Total energy must be invariant under reassignment provided $\iint \phi_{\mathrm{TF}}(u,\Omega)\,du\,d\Omega/2\pi = 1$ *(p.1070)*.
- Shifting the input in time by $t_1$ and frequency by $\omega_1$ must shift the reassigned output by exactly $(t_1,\omega_1)$ *(p.1070)*.
- For the PWVD and PMHD families, $\hat t \equiv t$ exactly: reassignment must not move energy in time *(pp.1071, 1075)*.
- The time marginal of the MPWVD must equal $|x(t)|^2$, and its first frequency moment must equal $\varphi'_x(t)|x(t)|^2$ *(p.1071)*.
- For a real-valued smoothing kernel, both reassignment operators must come out real-valued *(p.1069)*.
- The reassigned spectrogram and reassigned scalogram must remain nonnegative everywhere *(pp.1073, 1077)*.
- If $x(t_0)=0$ then the modified pseudo Margenau-Hill must be zero for all $\omega'$ at $t_0$ *(p.1075)*.
- A time scaling by $b$ of the input must scale the modified RID output as $\mathrm{MTFR}(y;t',\omega')=\mathrm{MTFR}(x;(t'-t_1)/b,\,b\omega')$ *(p.1073)*.
- $\hat t$ computed from $\mathrm{STFT}_{\mathcal{T}h}$ ratios must equal $-\partial\phi_h/\partial\omega$ computed by unwrapped-phase differentiation, to within numerical tolerance *(pp.1073, 1088)*. This is the natural unit test for an implementation.
- Reassignment must not reduce cross-term energy, only concentrate it *(pp.1078, 1081)*.

## Relevance to Project

This is the canonical reference for **reassigned spectrograms**, and it is directly load-bearing for a formant / source-filter speech synthesizer that needs high-resolution analysis of its own output and of reference recordings.

**Formant analysis.** Formants are narrowband ridges whose center frequency drifts; a plain spectrogram smears each one by the window bandwidth, and the smearing is worst exactly where formants merge (F1/F2 in back vowels, F2/F3 in /r/). The reassigned spectrogram concentrates each ridge onto its instantaneous frequency law with **perfect localization for locally linear chirps** — which is what a formant transition is over a short window. That makes it a far better front end for formant tracking, transition-rate measurement, and validating that a synthesizer's formant trajectories match a target *(pp.1070, 1078)*.

**Glottal pulse analysis.** A glottal closure instant is impulse-like, and reassignment is **perfectly localized for impulses** *(p.1070)*. The time-reassignment operator $\hat t$ collapses energy onto the true excitation instant, which is exactly the quantity a source-filter synthesizer needs for pitch-synchronous analysis, GCI detection, and open-quotient estimation. The paper's Fig. 10(b) shows sharp vertical structure at the signal's discontinuities.

**Cheap to implement.** For a spectrogram front end, the whole method is: compute three STFTs with windows $h$, $t\,h(t)$, and $h'(t)$ using the *same* FFT length and hop; form two pointwise ratios; round; scatter-add. That is roughly 3x the cost of the spectrogram already being computed, with no phase unwrapping, no iteration, and no parameter tuning beyond the $\epsilon$ guard *(pp.1073, 1081)*.

**Direct implementation recipe for this project** (from eqs. 26a/26b, p.1073):
1. Build the analysis window $h[k]$ (Gaussian or Hann), plus $\mathcal{T}h[k] = k\,T_e\,h[k]$ and $\mathcal{D}h[k] = T_e\,h'(kT_e)$.
2. Compute $X_h$, $X_{\mathcal{T}h}$, $X_{\mathcal{D}h}$ — three STFTs, same frames.
3. $S = |X_h|^2$.
4. $\hat t = t - \mathcal{R}\{X_{\mathcal{T}h}\overline{X_h}/S\}$, $\hat\omega = \omega + \mathcal{I}m\{X_{\mathcal{D}h}\overline{X_h}/S\}$, computed only where $S>\epsilon$.
5. Scatter-add $S$ into the output bin nearest $(\hat t,\hat\omega)$.

**Caveats for this project.** Reassignment sharpens noise and cross-terms as readily as harmonics, so on breathy or fricated speech the reassigned display will be visually busy; the paper's own advice is to pair reassignment with a smoothing kernel matched to the signal *(p.1081)*. For voiced speech the SPWVD/MSPWVD path (eq. 11) offers independently tunable time and frequency smoothing, which is the right knob for separating harmonic structure from formant envelope.

## Open Questions

- [ ] What $\epsilon$ threshold is appropriate for speech at typical dynamic ranges? The paper gives no guidance beyond "$>\epsilon$".
- [ ] The paper rounds to the nearest bin. Does sub-bin accumulation (splatting with fractional weights) meaningfully improve formant-track precision, or does it reintroduce smearing?
- [ ] Table II's spectrogram/scalogram entries for "time-frequency shifts" vs "time shifts and time scalings" look swapped relative to the expected Cohen's-class behavior. Verify against a second source.
- [ ] How does reassignment interact with the discrete-time WVD aliasing issues raised in [38] (Peyrin & Prost) and [39] (Jeong & Williams)?
- [ ] For glottal closure instant detection, is the time-reassignment operator competitive with dedicated GCI methods, and at what window lengths?

## Related Work Worth Reading

- **[33] K. Kodera, C. de Villedary, R. Gendrin**, "A new method for the numerical analysis of time-varying signals with small BT values," *Phys. Earth Planet. Interiors*, no. 12, pp. 142-150, 1976. The original reassignment idea.
- **[34] K. Kodera, R. Gendrin, C. de Villedary**, "Analysis of time-varying signals with small BT values," *IEEE Trans. ASSP*, vol. ASSP-34, pp. 64-76, 1986. The phase-derivative formulation this paper supersedes.
- **[35] W. Rihaczek**, "Signal energy distribution in time and frequency," *IEEE Trans. Inform. Theory*, vol. IT-14, pp. 369-374, 1968. Source of the Rihaczek distribution used throughout the operator derivations.
- **[20] L. Cohen**, "Time-frequency distributions — A review," *Proc. IEEE*, vol. 77, pp. 941-981, 1989. The reference survey for Cohen's class.
- **[18] O. Rioul, P. Flandrin**, "Time-scale energy distributions: A general class extending wavelet transforms," *IEEE Trans. Signal Processing*, vol. 40, pp. 1746-1757, 1992. Basis for the affine sections; appendix D gives the smoothing-equivalence used in the Fig. 13 comparison.
- **[13] H. I. Choi, W. J. Williams**, "Improved time-frequency representation of multicomponent signals using exponential kernels," *IEEE Trans. ASSP*, vol. 37, pp. 862-871, 1989. Kernel in Table I lines c/d.
- **[26] R. G. Baraniuk, D. L. Jones**, "A radially Gaussian, signal dependent time-frequency representation," *Proc. ICASSP*, 1991, pp. 3181-3184. Signal-matched kernel design, which the authors say reassignment should follow rather than replace.
- **[36] D. H. Friedman**, "Instantaneous frequency vs. time: An interpretation of the phase structure of speech," *Proc. ICASSP*, 1985, pp. 29.10.1-4. The one explicitly speech-oriented citation in the reference list.
