---
title: "Spectral Modeling Synthesis: A Sound Analysis/Synthesis System Based on a Deterministic plus Stochastic Decomposition"
authors: "Xavier Serra, Julius Smith III"
year: 1990
venue: "Computer Music Journal, Vol. 14, No. 4, Winter 1990, pp. 12-24"
doi_url: "https://doi.org/10.2307/3680788"
pages: "12-24"
affiliation: "Center for Computer Research in Music and Acoustics (CCRMA), Department of Music, Stanford University"
---

# Spectral Modeling Synthesis: A Sound Analysis/Synthesis System Based on a Deterministic plus Stochastic Decomposition

*(Page citations are the printed Computer Music Journal page numbers, 12-24. PDF page index N corresponds to printed page N+12. All 13 pages read.)*

## One-Sentence Summary
SMS analyzes a sound into (1) a deterministic part — a set of sinusoids tracked as piecewise-linear amplitude and frequency envelopes extracted by peak-picking and peak-continuation over a short-time Fourier transform — and (2) a stochastic part — the spectral residual after subtracting the sinusoids, modeled as white noise through a time-varying filter described by a line-segment approximation of the residual's magnitude spectral envelope, and resynthesizes both with additive synthesis plus overlap-add inverse FFT. *(p.12)*

## Problem Addressed
Existing spectrum-modeling analysis/synthesis systems represented sound as sinusoids only. The phase vocoder was tied to a fixed-frequency filter bank, so inharmonic sounds and deep vibrato were hard to analyze *(p.13)*. PARSHL added FFT peak tracking and handled inharmonic sounds, but representing noiselike signals (attacks, breath, bow noise) with sinusoids is "extremely expensive because, in principle, noise consists of sinusoids at every frequency within the band limits" *(p.13)*. SMS adds an explicit stochastic component so noise is modeled cheaply and the deterministic part stays compact.

## Key Contributions
- A deterministic-plus-stochastic sound model: sum of quasi-sinusoids with piecewise-linear amplitude/frequency envelopes, plus a filtered-white-noise residual *(p.14)*
- An analysis procedure that extracts sinusoidal trajectories by peak tracking in a sequence of short-time Fourier transforms, then **removes them by spectral subtraction in the magnitude domain** to isolate the noise floor *(p.12, p.14)*
- Modeling of the residual as a time-varying filter applied to white noise, with the filter specified by a piecewise-linear (line-segment) approximation of the residual magnitude spectral envelope *(p.12, p.15)*
- Synthesis of the stochastic part by inverse-STFT/overlap-add using the approximated envelope as the magnitude spectrum and a random-number generator as the phase spectrum *(p.15)*

## Background and Prior Work (pp.12-13)
- **Three model families for musical sound generation** *(p.12)*: instrument models (parameterize at the source — violin, clarinet, vocal tract), spectrum models (parameterize at the basilar membrane, discarding what the ear discards), abstract models (e.g., FM). SMS is a spectrum model.
- Additive synthesis is the original spectrum-modeling technique, rooted in Fourier's theorem *(p.12)*.
- **Moorer 1973** — heterodyne filter: implements a single frequency bin of the DFT using the rectangular window; magnitude and phase derivative of the sliding DFT bin give instantaneous amplitude and frequency *(p.12)*.
- **Moorer 1978 / Portnoff 1976** — digital phase vocoder; the FFT provides effectively a heterodyne filter at each harmonic of the fundamental; a nonrectangular window gives better isolation among spectral components *(pp.12-13)*.
- **Grey 1975** — natural instrument sounds (oboe, clarinet) successfully modeled as a sum of sinusoidal oscillators with piecewise-linear amplitude envelopes; **100:1 data reduction** was not uncommon while sounding as good as the original *(p.13)*.
- **Phase vocoder limitations** *(p.13)*: FFT acts as a fixed filter bank of N narrow bandpass filters equally spaced between 0 Hz and the sampling rate; channel bandwidth is nominally sampling rate / FFT length. A sinusoid's frequency cannot vary outside its channel bandwidth without extra work combining channels. The analysis was really set up for harmonic signals; progressive sharpening of partials in a piano means some sinusoids fall in the crack between two adjacent FFT bins.
- **PARSHL (Smith and Serra 1987)** *(p.13)*: FFT peak tracking; a series of FFT frames is computed, but instead of writing out magnitude and phase derivative of each bin, the FFT is searched for peaks and the largest peaks are tracked frame to frame. The principal difference from the phase vocoder is replacement of the per-bin phase derivative by interpolated magnitude peaks across FFT bins — better suited to inharmonic sounds.
- **McAulay and Quatieri (1984, 1986)** developed an independent, similar facility for speech. Differences from PARSHL *(p.13)*:
  1. Peaks found as changes in slope of the magnitude spectrum, whereas PARSHL finds the maximum magnitude over all frequencies and "pulls out" the whole "hill".
  2. Spectral peaks were not interpolated in frequency or amplitude as they are in PARSHL.
  3. Amplitude and frequency envelopes were not simplified to small numbers of piecewise-linear breakpoints (a breakpoint was retained for each frame).
  4. Peak association across frames (including "birth" and "death" criteria for line tracks) was solved by a different algorithm.
  5. PARSHL supports additional constraints: limiting the peak search to a specific frequency interval, specifying a maximum glissando slope before dissociating peaks connected across adjacent frames, rejecting peaks below a minimum dB level and/or width.
  Both systems were built on the short-time Fourier transform facility of **Allen (1977)**.
- PARSHL works well for sounds created by simple physical vibrations or driven periodic oscillations, but is unwieldy for noiselike signals such as the attack of many instrumental sounds *(p.13)*.

## The Deterministic plus Stochastic Model (p.14)

A **deterministic** signal is traditionally anything that is not noise — an analytic signal, or a perfectly predictable part, predictable from measurements over any continuous interval. Here the class is restricted to **sums of quasi-sinusoidal components** (sinusoids with piecewise-linear amplitude and frequency variation). Each sinusoid models a narrowband component of the original sound and is described by an amplitude and a frequency function. *(p.14)*

A **stochastic**, or noise, signal is fully described by its amplitude probability density versus frequency, or its power spectral density. When a signal is assumed stochastic, **it is not necessary to preserve either the instantaneous phase or the exact details of individual FFT frames**. *(p.14)*

### Key Equations

$$
s(t) = \sum_{r=1}^{R} A_r(t)\cos[\theta_r(t)] + e(t)
$$
Where: $s(t)$ is the input sound; $A_r(t)$ and $\theta_r(t)$ are the instantaneous amplitude and phase of the $r$-th sinusoid; $R$ is the number of sinusoids; $e(t)$ is the noise component at time $t$ (in seconds). The model assumes the sinusoids are stable partials of the sound and that each one has a slowly changing amplitude and frequency.
*(p.14)*

$$
\theta_r(t) = \int_0^t \omega_r(\tau)\,d\tau + \theta_r(0)
$$
Where: $\omega_r(t)$ is the instantaneous frequency in radians per second and $r$ is the sinusoid number. The instantaneous phase is the integral of the instantaneous frequency.
*(p.14)*

$$
e(t) = \int_0^t h(t,\tau)\,u(\tau)\,d\tau
$$
Where: $u(\tau)$ is white noise and $h(t,\tau)$ is the impulse response of a time-varying filter at time $t$. That is, the residual is modeled by the convolution of white noise with a time-varying frequency-shaping filter.
*(p.14)*

## Description of the SMS Technique (pp.14-15)

**Analysis chain (Fig. 1, p.14):** Waveform → multiply by window → FFT → complex spectra → magnitude computation → magnitude spectra → peak detection → peak continuation → frequency trajectories + magnitude trajectories (the *deterministic representation*). The trajectories then feed **additive synthesis** → waveform → windowed → FFT → complex spectra → magnitude computation → magnitude spectra, which is **subtracted** from the original magnitude spectra to give the *magnitude spectrum residuals* → envelope approximation → spectral envelopes (the *stochastic representation*).

**Synthesis chain (Fig. 2, p.15):** Frequency trajectories and magnitude trajectories each pass through *Transformations*, then **additive synthesis** produces the deterministic signal. In parallel, the spectral envelopes of the residual pass through *Transformations* to give magnitude spectra; a *random number generator* supplies phase spectra; polar-to-rectangular coordinate conversion gives complex spectra; an **IFFT** followed by windowing (overlap-add) gives the stochastic signal. Deterministic and stochastic signals are summed into the synthesized waveform.

Stated step order *(pp.14-15)*:
1. Derive a series of magnitude spectra of the input sound by computing the FFT of every windowed portion of the waveform (the STFT).
2. Detect the prominent peaks in each spectrum.
3. Organize the peaks into frequency trajectories by a peak-continuation algorithm; this extracts the stable sinusoids present in the original sound (the deterministic component).
4. Compute the STFT of the deterministic component in the same way the STFT of the original waveform was obtained.
5. Subtract each deterministic magnitude spectrum from the corresponding spectrum of the original waveform.
6. Derive the envelope of each "residual" spectrum by performing a **line-segment approximation**. These envelopes represent the stochastic signal.
7. Deterministic signal is regenerated from the magnitude and frequency trajectories (or their transformation) by generating a sine wave for each trajectory (additive synthesis).
8. Stochastic signal is created by forming a complex spectrum (magnitude and phase spectra) for every spectral envelope of the residual, or its modification, and performing an inverse STFT using the overlap-add method. The **magnitude spectrum is the envelope itself**, and the **phase spectrum is generated by a random number generator**. This corresponds to filtering white noise by a filter whose frequency response equals the spectral envelope.

## Computation of the Magnitude Spectra (p.15)

The analysis starts by computing a set of magnitude spectra using the STFT (Allen 1977; Allen and Rabiner 1977), understood as a time-varying DFT:

$$
X_l(k) \triangleq \sum_{n=0}^{N-1} w(n)\,x(n + lH)\,e^{-i\omega_k n}, \quad l = 0, 1, \ldots
$$
Where: $w(n)$ is a real window that determines the portion of the input signal $x(n)$ that receives emphasis at frame $l$; $H$ is the **hop size**, or time advance, of the window; $N$ is the transform length; $\omega_k$ is the center frequency of bin $k$. The STFT computes a DFT at every frame $l$, advancing with hop size $H$ so as to slide the window $w(n)$ along the sequence $x(n)$.
*(p.15)*

$$
A_l(k) = |X_l(k)| = \sqrt{a^2(k) + b^2(k)}
$$
Where: $|X_l(k)|$ is the magnitude spectrum and $a(k)$, $b(k)$ are the real and imaginary parts of the complex value returned by the DFT for bin $k$.
*(p.15)*

## Analysis Window (pp.15-16)

The window choice determines the time-versus-frequency-resolution trade-off, which affects the smoothness of the spectrum and the detectability of different sinusoidal components. Commonly used: Rectangular, Hamming, Hanning, Kaiser, Blackman, Blackman-Harris; Harris (1978) gives a good discussion. *(p.15)*

All the standard windows are real and symmetric and have a frequency spectrum with a sinclike $(\sin x)/x$ shape (Fig. 3). Window choice is mainly determined by two spectral characteristics *(p.15)*:
1. **Main-lobe width** — the number of bins between zero crossings on either side of the main lobe when the DFT length equals the window length.
2. **Highest side-lobe level** — how many dB down the highest side lobe is from the main lobe.

Ideally: a narrow main lobe (good frequency resolution) and a very low side-lobe level (no cross-talk between DFT channels) *(pp.15-16)*.

| Window | Main-lobe width (bins) | Highest side lobe (dB) | Page |
|--------|------------------------|------------------------|------|
| Rectangular | 2 | -13 | p.16 |
| Hamming | 4 | -43 | p.16 |
| Kaiser | adjustable | adjustable (trade-off) | p.16 |

The Kaiser window allows control of the trade-off between main-lobe width and highest side-lobe level: a narrower main lobe means a higher side-lobe level, and vice versa. Since control of this trade-off is valuable, **the Kaiser window is a good general-purpose choice** (see Serra 1989 for a more extensive discussion). *(p.16)*

**Window length** must be sufficient to resolve the most closely spaced sinusoidal frequencies. A nominal choice for periodic signals is **about four periods**. *(p.16)*

## Computation of the DFT (p.16)

- Use the FFT whenever possible; this requires the analyzed signal length to be a power of two, accomplished by **zero padding** — filling with zeros out to the length required by the FFT. This both enables the FFT algorithm and computes a smoother spectrum. Zero padding in the time domain corresponds to interpolation in the frequency domain. *(p.16)*
- FFT size $N$ is normally chosen to be **the first power of two that is at least twice the window length $M$**, with the difference $N - M$ filled with zeros. *(p.16)*
- If $B_s$ is the number of samples in the main lobe when the zero-padding factor is 1 ($N = M$), then a zero-padding factor of $N/M$ gives $B_s N/M$ samples for the same main lobe (and same main-lobe bandwidth). *(p.16)*
- The zero-padding (interpolation) factor $N/M$ should be large enough to enable an accurate estimation of the true maximum of the main lobe. Since the window length is not an exact number of periods for every sinusoidal frequency, the spectral peaks do not in general occur at FFT bin frequencies (multiples of $f_s/N$); therefore the bins must be interpolated to estimate peak frequencies. **Zero padding is one type of spectral interpolation.** *(p.16)*

## Choice of Hop Size (p.16)

The hop size $H$ — how much the analysis time origin is advanced from frame to frame — is an important parameter whose choice depends on the purpose of the analysis. More overlap gives more analysis points and therefore smoother results across time, but the computational expense is proportionally greater. *(p.16)*

**Criterion:** successive frames should overlap in time in such a way that all the data are weighted equally. A good choice is the **window length divided by the main-lobe width in bins** (Allen 1977). For example, a practical value for the Hamming window is a hop size equal to **one-fourth of the window size**. *(p.16)*

## Peak Detection (p.16, continues)

Once the set of spectra is computed, the system extracts the prominent peaks of each spectrum. A **peak is defined as a local maximum in the magnitude spectrum**. Not all peaks are equally prominent, so selection must be controlled *(p.16)*:
- Measure the height of each peak **in relation to its neighboring valleys**, where the neighboring valleys are the closest local minima on both sides of the peak.
- Not all peaks of the same height are equally relevant perceptually; their amplitude and frequency matter. It is useful to specify **frequency and magnitude ranges** where the peak search takes place.
- Due to the sampled nature of the spectra returned by the STFT, each peak is accurate only to within half a bin (continues p.17).

### Peak accuracy and spectral interpolation (p.17)

Each peak is accurate only to within **half a bin**. A bin represents a frequency interval of $f_s/N$ Hz, where $N$ is the FFT size and $f_s$ is the sampling rate. Zero padding in the time domain increases the number of DFT bins per Hz and thus increases the accuracy of simple peak detection. However, **to obtain good frequency accuracy the required zero-padding factor is very large**. *(p.17)*

A more efficient spectral-interpolation scheme is to **zero pad only enough so that parabolic spectral interpolation, using only the three bins immediately surrounding the maximum-magnitude bin, can be used to refine the accuracy of the estimate** (Serra 1989). Note that **parabolic interpolation would be exact in the case of log-magnitude spectra using a Gaussian window**. *(p.17)*

$$
\Delta f_{\text{peak}} \le \tfrac{1}{2}\,\frac{f_s}{N}
$$
Where: $f_s$ = sampling rate, $N$ = FFT size. This is the raw (uninterpolated) peak-frequency accuracy bound stated in the text.
*(p.17)*

## Peak Continuation (pp.17-18)

Once spectral peaks are detected, a subset of them is organized by the **peak continuation algorithm** into **peak trajectories**, where each trajectory represents a stable sinusoid. The design of such an algorithm can be approached as a **line detection problem**: out of a surface of discrete points, each one being a peak, the algorithm finds lines according to the characteristics imposed by the model. *(p.17)*

The behavior of a partial, and therefore the way to track it, varies depending on the sound (speech, violin, gong, an animal). Thus the algorithm requires **some knowledge of the characteristics of the sound being analyzed**. In the current algorithm there is **no attempt to make the process completely automatic**; the user is expected to know some characteristics of the sound beforehand and specify them through a set of parameters. *(p.17)*

**Core idea:** a set of **frequency guides** advances in time through the spectral peaks, looking for the appropriate ones (according to the specified constraints) and forming trajectories out of them. The instantaneous state of the guides, their frequency, is kept in variables $\tilde f_1, \tilde f_2, \tilde f_3, \ldots, \tilde f_p$, where $p$ is the number of existing guides. These values are continuously updated as the guides are **turned on, advanced, and finally turned off**. *(p.17)*

Setup: guides are currently at frame $n$ with frequencies $\tilde f_1, \ldots, \tilde f_p$. We want to continue the $p$ guides through the peaks of frame $n$ with frequencies $g_1, g_2, g_3, \ldots, g_m$. Fig. 5 illustrates the algorithm. **Three steps: guide advancement, update of the guide values, and start of new guides.** *(p.17)*

### Step 1: Guide Advancement (p.18)

Each guide is advanced through frame $n$ by finding the peak closest in frequency to its current value. **Guide $r$ claims frequency $g_i$ for which $|\tilde f_r - g_i|$ is a minimum.** Three possible situations:

1. **Match found within the maximum deviation allowed** — the guide is continued (unless there is a conflict to resolve). The selected peak is incorporated into the corresponding trajectory. *(p.18)*
2. **No match found** — it is assumed the corresponding trajectory must turn off entering frame $n$, and its current frequency is matched to itself with **0 magnitude**. Since trajectory amplitudes are **ramped linearly from one frame to the next**, the terminating trajectory ramps to 0 over the duration of one hop size. Whether or not the actual guide is killed depends on the **allowed sleeping time**. *(p.18)*
3. **Match already claimed by another guide (conflict)** — the peak is given to the guide **closest in frequency**, and the loser looks for another match. If the current guide loses the conflict, it simply picks the best available nonconflicting peak within the allowed frequency range. If the current guide wins, it **calls the assignment procedure recursively on behalf of the dislodged guide**. When the dislodged guide finds the same peak and wants to claim it, it sees there is a conflict that it loses and moves on. This process is repeated for each guide, **solving conflicts recursively**, until all possible matches are made. *(p.18)*

### Step 2: Update of the Guide Values (p.18)

Once all existing guides and their trajectories have been continued through frame $n$, the guide frequencies are updated. Two situations:

**(a) Guide found a continuation peak** — its frequency is updated from $\tilde f_r$ to $\tilde h_r$ according to

$$
\tilde h_r = \alpha\,(g_i - \tilde f_r) + \tilde f_r, \qquad \alpha \in [0,1]
$$
Where: $g_i$ is the frequency of the peak the guide found at frame $n$; $\tilde f_r$ is the guide's current frequency; $\alpha$ is the given **contribution that the peak makes to the guide**. When $\alpha = 1$, the frequency of the peak trajectory is the same as the frequency of the guide, so the difference between guide and trajectory is lost.
*(p.18)*

**(b) Guide has not found a continuation peak** — if it has not found one for the **allowed sleeping time**, the guide is **killed** at frame $n$. If it is still under the sleeping time, it **keeps whatever value it already had**. Guides that find a continuation peak are called **active guides**; those that do not but are still alive are called **sleeping guides**. *(p.18)*

### Step 3: Start of New Guides (p.18)

New guides, and therefore new trajectories, are created from the peaks of frame $n$ that are not incorporated into trajectories by the existing guides. *(p.18)*

- A guide is created at frame $n$ by searching through the **unclaimed peaks** of the frame for the one with the **highest magnitude that is separated from every existing guide by a given minimum frequency separation**. The frequency value of the selected peak becomes the frequency of the new guide. *(p.18)*
- The actual trajectory is **started in the previous frame, $n-1$**, where its amplitude value is set to **0** and its frequency value to the same as the current frequency, thus **ramping in amplitude to the current frame**. *(p.18)*
- This process is done recursively until there are **no more unclaimed peaks** in the current frame, or the **number of guides has reached the maximum allowed**. *(p.18)*

### Backward analysis (attack handling) (pp.18-19)

The attack portion of most sounds is quite noisy, and the search for partials is harder in such a rich spectrum. **A useful modification is to start the process from the end of the sound**: start tracking the peaks from the last frame and work towards the front. The tracking process encounters the end of the sound first, and since this is a very stable part in most instrumental sounds, the algorithm finds a very clear definition of the partials. When the guides arrive at the attack, they are already tracking the main partials and can reject irrelevant peaks appropriately, or at least evaluate them with knowledge acquired from the rest of the analysis. *(pp.18-19)*

## Variations on the Algorithm for Harmonic Sounds (p.19)

When the sound is known to be harmonic, the peak continuation algorithm is specialized: the **frequency guides are circumscribed to track harmonic frequencies**. Two major changes with respect to the general algorithm: there is **a specific fundamental frequency at every frame**, and **each guide tracks a specific harmonic number**. *(p.19)*

Step order at the current frame becomes: (1) **detection of the fundamental frequency**, then (2) guide advancement (same as the general case). The only new step is fundamental detection. *(p.19)*

- Before advancing the guides through frame $n$, a pitch detection algorithm searches for the fundamental frequency of frame $n$. If found, the **guide values are reset to the harmonic series of the new fundamental, without considering the values of the previous frame**. If the fundamental is not found, the guides keep their frequency values. *(p.19)*
- Fundamental detection strategy used: dealing with single-source sounds and assuming a fundamental-frequency peak exists, a simple algorithm is based on **finding the $M$ highest peaks at frame $n$ and then searching for the peak that is a fundamental for all of them** (currently using $M = 3$). By choosing the highest peaks it is assured that they are good harmonic partials, therefore they must be multiples of a fundamental. *(p.19)*

## Representation of the Deterministic Part (p.19)

The output of the peak continuation algorithm is a set of peak trajectories representing the partials of the analyzed sound. Each peak is a **pair of numbers $(\hat A_r(l), \hat\omega_r(l))$**, amplitude and frequency, for each frame $l$ and each trajectory $r$. The pairs corresponding to trajectory $r$ are interpreted as **breakpoints for amplitude and frequency functions, one breakpoint per frame**. From these functions a series of sinusoids can be synthesized that reproduce the deterministic part. *(p.19)*

**Data reduction options** *(p.19)*:
- Perform a **line-segment approximation** on each function, reducing the number of breakpoints (Grey 1975; Strawn 1980).
- However, for easy manipulation it is useful to have **equally spaced points** along each function, so it may be better to **keep one breakpoint per frame** as returned by the analysis, unless data reduction is a priority.
- Another alternative: **combine groups of similar functions into a single one**, reducing the number of functions.

## Deterministic Synthesis (p.19)

From the amplitude and frequency functions $\hat A_r(l)$ and $\hat\omega_r(l)$, a frame of the deterministic sound is obtained by

$$
d^l(m) = \sum_{r=1}^{R^l} \hat A_r^l \cos[m\,\hat\omega_r^l], \quad m = 0, 1, 2, \ldots, H-1
$$
Where: $R^l$ is the number of trajectories present at frame $l$; $H$ is the length of the synthesis frame (without any time scaling, $H$ is the analysis hop size); $\hat A_r^l$ and $\hat\omega_r^l$ are the amplitude and frequency of trajectory $r$ at frame $l$; $m$ is the sample index within the frame.
*(p.19)*

### Frame juxtaposition and intra-frame interpolation (p.20)

The final sound $d(n)$ results from the **juxtaposition of all the synthesis frames**. To avoid clicks at the frame boundaries, the parameters $(\hat A_r^l, \hat\omega_r^l)$ are smoothly interpolated from frame to frame. *(p.20)*

Instantaneous amplitude by linear interpolation:

$$
\hat A(m) = \hat A^{l-1} + \frac{(\hat A^{l} - \hat A^{l-1})}{H}\,m
$$
Where: $m = 0, 1, \ldots, H-1$ is the time sample in the $l$ frame; $\hat A^{l}$ and $\hat A^{l-1}$ are the trajectory amplitudes at the current and previous frames; $H$ is the synthesis frame length (hop size).
*(p.20)*

Instantaneous radian frequency, also by linear interpolation:

$$
\hat\omega(m) = \hat\omega^{l-1} + \frac{(\hat\omega^{l} - \hat\omega^{l-1})}{H}\,m
$$
Where: symbols as above, with $\hat\omega$ in radians per sample.
*(p.20)*

Instantaneous phase for the $r$-th trajectory (phase as the running integral of instantaneous frequency):

$$
\hat\theta_r(m) = \hat\theta_r(l-1) + \hat\omega_r(m)\,m
$$
Where: $\hat\theta_r(l-1)$ is the phase carried over from the end of the previous frame.
*(p.20)*

Final deterministic synthesis equation:

$$
d^l(m) = \sum_{r=1}^{R^l} \hat A_r^l(m)\cos[\hat\theta_r^l(m)]
$$
Where: $\hat A(m)$ and $\hat\theta(m)$ are the calculated instantaneous amplitude and phase.
*(p.20)*

## Computation of the Stochastic Part (p.20)

Once the deterministic component has been detected, the next step is to obtain the **residual**, which in simplified form becomes the stochastic component. *(p.20)*

- Since the deterministic component **does not preserve the phases** of the original sound, **a time-domain subtraction cannot be performed**. (For a method that allows time-domain subtraction, see Serra 1989.) *(p.20)*
- However, since the **magnitude and frequency of each sinusoid are preserved**, the magnitude spectra of both signals are comparable (Fig. 6). Accordingly it is possible to perform a **frequency-domain subtraction from the magnitude spectra of both signals**. The result is a set of **magnitude spectrum residuals**. *(p.20)*
- Underlying assumption: the residual is a stochastic signal, which implies the residual sound is **fully described by its amplitude and its general frequency characteristics**. It is unnecessary to keep either the instantaneous phase or the exact frequency information. The stochastic residual can therefore be completely characterized by the **envelopes of the magnitude-spectrum residuals** — these envelopes keep the amplitude and the general shape of the residual spectrum. The set of envelopes forms the **stochastic representation**. *(p.20)*
- Two steps: (1) subtraction of each deterministic magnitude spectrum from the corresponding original magnitude spectrum, and (2) approximation of each residual spectrum with an envelope. *(p.20)*

### Computation of the Spectral Residuals (p.21)

For the subtraction to be feasible, the spectra must be comparable and therefore computed in the same manner. **The STFTs from which they are obtained must use the same analysis window, window length, FFT size, and hop size.** *(p.21)*

$$
|E_l(k)| = \big|\,|X_l(k)| - |D_l(k)|\,\big|
$$
Where: $|X_l(k)|$ is the magnitude spectrum of the original sound at frame $l$; $|D_l(k)|$ is the magnitude spectrum of the deterministic signal at frame $l$; $|E_l(k)|$ is the magnitude-spectrum residual. Note the **outer absolute value** — the subtraction is rectified so the residual magnitude is nonnegative.
*(p.21)*

### Approximation of the Spectral Residual (p.21)

Assuming the residual is quasi-stochastic, each magnitude-spectrum residual can be approximated by its envelope, since **only its shape contributes to the sound characteristics**. *(p.21)*

Curve-fitting alternatives discussed *(p.21)*:
- Standard techniques: **spline interpolation**, **method of least squares**, **straight-line approximations** (Strawn 1980).
- **Linear predictive coding (LPC)** (Markel and Gray 1976), a type of least-squares approximation popular in speech research for fitting an $n$th-order polynomial to a magnitude spectrum.
- **Chosen: simple line-segment approximation** — "accurate enough and gives the desired flexibility". The line-segment approach is judged **more flexible than LPC**, and even though **LPC results in fewer analysis points**, the flexibility is considered more important here.

The particular line-segment approximation is done by stepping through the magnitude spectrum and finding local maxima in every section:

$$
\tilde E_l(q) = \max_k \big(\,|E_l(k + qH)|\,\big)
$$
$$
k = -M/2,\; -M/2 + 1,\; \ldots,\; 0,\; \ldots,\; M/2 - 2,\; M/2 - 1 \qquad q = 0, 1, \ldots
$$
Where: $H$ is the hop size (here the *spectral* section advance), $M$ is the window size (or size of the section), and $\tilde E_l(q)$ is the maximum of section $q$ at frame $l$. The resulting points are **linearly interpolated to create the spectral envelope** (Fig. 7). **The accuracy of the fit is given by the hop size, which is set depending on the sound complexity.** *(p.21)*

## Representation of the Stochastic Part (pp.21-22)

The stochastic analysis returns an envelope $\tilde E_l(q)$ for every frame $l$, where $q$ is the breakpoint number in the envelope, $q = 0, 1, \ldots, Q-1$. These envelopes can be interpreted differently depending on which variable, $l$ or $q$, is considered fixed *(pp.21-22)*:
- **$l$ fixed** — a **frequency-shaping filter** for frame $l$.
- **$q$ fixed** — an **amplitude-modulated bandpass filter, centered at $f_s q / 2Q$ Hz and with a bandwidth of $f_s / 2Q$ Hz**. *(p.22)*

$$
f_{\text{center}}(q) = \frac{f_s\,q}{2Q}, \qquad BW = \frac{f_s}{2Q}
$$
Where: $f_s$ is the sampling rate, $Q$ is the number of breakpoints in the envelope, $q$ is the breakpoint index.
*(p.22)*

These frequency envelopes or time functions can be **simplified and smoothed** as in the deterministic representation. As with that representation, it is also useful to **keep the same number of breakpoints on both the frequency and the time axes**. *(p.22)*

## Stochastic Synthesis (p.22)

Synthesis of the stochastic component is the generation of a noise signal with the frequency and amplitude characteristics described by the spectral envelopes. The intuitive operation is **filtering white noise with these frequency envelopes** — time-varying filtering of white noise. In practice SMS generates the stochastic signal by an **overlap-add synthesis technique from the spectral envelopes**: the inverse Fourier transform of each envelope is computed and the resulting waveforms are overlapped and added. *(p.22)*

Before the inverse STFT, a complex spectrum (magnitude and phase spectra) is obtained from each frequency envelope *(p.22)*:
- The **magnitude spectrum** is generated by interpolating the approximation $\tilde E_l(q)$ of length $Q$ to a curve of length $N/2$, where $N$ is the FFT size.
- The **FFT size $N$ is the first power of 2 that is bigger than the synthesis window plus $Q$**.
- There is no phase information in the stochastic representation, but since the phase spectrum of noise is a random signal, the **phase spectrum can be created with a random number generator**. To avoid a **periodicity at the frame rate, different values are generated at every frame**.

$$
A_l(k) = \tilde E'_l(k)
$$
$$
\Theta_l(k) = \pi - \operatorname{ran}(2\pi)
$$
Where: $\tilde E'_l(k)$ is the interpolated spectral envelope, and $\operatorname{ran}(2\pi)$ is a function that produces random numbers in the range $0$ to $2\pi$. So the phase is uniform over $[-\pi, \pi]$.
*(p.22)*

Change of coordinates from polar to rectangular:

$$
\operatorname{Re}\{\hat E_l(k)\} = A_l(k)\cos[\Theta_l(k)]
$$
$$
\operatorname{Im}\{\hat E_l(k)\} = A_l(k)\sin[\Theta_l(k)]
$$
Where: $A_l(k)$ is the interpolated magnitude envelope and $\Theta_l(k)$ the random phase at frame $l$, bin $k$.
*(p.22)*

Inverse Fourier transform gives one frame of the noise waveform:

$$
\hat e'_l(m) = \frac{1}{N}\sum_{k=-N/2}^{N/2-1} \hat E_l(k)\,e^{j\omega_k m}, \quad m = 0, 1, \ldots, N-1
$$
Where: $N$ is the FFT size; $\hat E_l(k)$ is the complex spectrum at frame $l$.
*(p.22)*

**Windowing requirement.** The waveform $\hat e'_l(m)$ is a **constant-amplitude waveform of size $N$**. Since the phase spectrum used is not the result of an analysis process (windowing, zero padding, FFT), the resulting signal **does not taper to 0 at the boundaries** — a random-valued phase spectrum corresponds to the phase spectrum of a **rectangular-windowed noise waveform of size $N$**. To succeed in overlap-add resynthesis (smooth transitions between frames) a smoothly windowed waveform of size $M$ is needed, where $M$ is the **synthesis-window length**. *(p.22)*

$$
\hat e_l(m) = \hat e'_l(m)\,w(m), \quad m = 0, 1, \ldots, M-1
$$
Where: $w(m)$ is the synthesis window of length $M$.
*(p.22)*

- A practical choice for the synthesis window length is **four times the hop size**. This length is **independent of the analysis-window length** and is only related to the analysis hop size (when no time scaling is performed). *(p.22)*
- **There is no reason to use the same window as in the STFT analysis, nor a very sophisticated one. A simple Hanning window suffices.** *(p.22)*

Overlap-add of the windowed waveforms gives the stochastic signal:

$$
\hat e(n) = \sum_{l=0}^{L-1} \hat e_l(n - lH)
$$
Where: $L$ is the number of frames, $H$ the hop size, $\hat e_l$ the windowed noise frame.
*(p.22)*

Where: $H$ is the analysis hop size and $l$ is the frame number. *(p.23)*

## Representation of Timbral Modifications (p.23)

The deterministic analysis results in a set of amplitude and frequency functions $\hat A_r(l)$ and $\hat\omega_r(l)$, where $r$ is the function number and $l$ the breakpoint number in each function. The stochastic analysis results in a set of spectral envelopes $\tilde E_l(q)$, where $q$ is the breakpoint number in the envelope. From these representations a great number of sound transformations are possible. *(p.23)*

**Time-scale modification** *(p.23)*:
- Accomplished in both representations by **resampling the analysis points in time**, done by changing the **synthesis frame size** (or the hop size in the case of the stochastic synthesis).
- Results in slowing down or speeding up the sound **while maintaining pitch and formant structure**.
- A **time-varying frame size** gives a time-varying modification.
- Due to the separation of stochastic and deterministic components, this representation is **more successful in time-scale modifications than traditional additive synthesis**: the noise part of the sound **remains noise no matter how much the sound is stretched**, which is not the case in "sinusoids-only" representations.

**Deterministic modifications** *(p.23)*:
- Each amplitude/frequency function pair accounts for a partial of the original sound; manipulation is easy and musically intuitive.
- Partials can be **transposed in frequency, with different values for every partial and varying during the sound**.
- It is possible to **decouple the sinusoidal frequencies from their amplitude**, obtaining effects such as **changing pitch while maintaining formant structure**.

**Stochastic modifications** *(p.23)*:
- Modified by changing the shape of each envelope; changing the envelope shape corresponds to **further filtering of the stochastic signal**.
- Manipulation is **much simpler and more intuitive than the manipulation of a set of all-pole filters, such as those resulting from an LPC analysis**.

**Cross-component effects and fusion caveat** *(p.23)*:
- Interesting effects from **changing the relative amplitude of the two components**, emphasizing one or the other at different moments in time.
- **Characterizing a single sound by two different representations may cause problems.** When different transformations are applied to each representation, it is easy to create a sound in which the two components **do not fuse into a single entity**. This may be desirable for some musical applications, but in general it is avoided and requires practical experimentation with the actual representations.
- The **best synthesis is generally considered the one that results in the best perceptual identity with respect to the original sound**; transformations are then performed on the corresponding representation.
- Very interesting effects result from **purposely setting the analysis parameters "wrong"** — e.g., setting parameters such that the deterministic analysis only captures partials in a specific frequency range, leaving the rest to be considered stochastic. The result is a sound with a **much stronger noise component**. *(p.23)*

## Conclusion (pp.23-24)

- SMS is an analysis-based technique capable of capturing the perceptual characteristics of a wide variety of sounds. The resulting representation is intuitive and is easily mapped to useful musical parameters. *(p.23)*
- **The analysis part is central to the system.** It is a complex algorithm that requires the **manual setting of a few control parameters**. Further work may automate the analysis process, particularly if there is a specialization for a group of sounds. **Some aspects of the analysis are open to further research, in particular the peak-continuation algorithm.** *(p.23)*
- Synthesis from the deterministic-plus-stochastic representation is simple and **can be performed in real time with current technology**. A real-time implementation would allow use in performance: the representation would be computed ahead of time and stored, and the sound transformations done interactively. *(pp.23-24)*

## Parameters

### Analysis parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Analysis window type | — | — | Kaiser | Rectangular / Hamming / Hanning / Kaiser / Blackman / Blackman-Harris | p.16 | Kaiser is "a good general purpose choice" because the main-lobe / side-lobe trade-off is controllable |
| Window length | M | samples | ~4 periods of the signal | must resolve closest sinusoid spacing | p.16 | "A nominal choice for periodic signals is about four periods" |
| FFT size | N | samples | first power of 2 >= 2M | >= 2M | p.16 | Difference N - M filled with zeros |
| Zero-padding factor | N/M | — | >= 2 | large enough for accurate main-lobe maximum estimation | p.16 | Time-domain zero padding = frequency-domain interpolation |
| Main-lobe samples with padding | Bs·N/M | samples | — | — | p.16 | Bs = main-lobe samples at padding factor 1 |
| Analysis hop size | H | samples | window length / main-lobe width in bins | — | p.16 | Allen 1977 criterion; Hamming practical value = M/4 |
| Rectangular window main lobe | — | bins | 2 | — | p.16 | Narrowest main lobe |
| Rectangular window side lobe | — | dB | -13 | — | pp.15-16 | Relative to main-lobe peak (Fig. 3) |
| Hamming window main lobe | — | bins | 4 | — | p.16 | |
| Hamming window side lobe | — | dB | -43 | — | p.16 | |
| Bin width | fs/N | Hz | — | — | p.17 | Peak accurate to within half a bin without interpolation |
| Peak interpolation order | — | — | parabolic over 3 bins | — | p.17 | Exact for log-magnitude spectra with a Gaussian window |
| Peak-search frequency range | — | Hz | user-specified | — | p.16 | Restricts where peak search takes place |
| Peak-search magnitude range | — | dB | user-specified | — | p.16 | Peak height measured relative to neighboring valleys (closest local minima on both sides) |
| Maximum peak deviation for guide match | — | Hz | user-specified | — | p.18 | Guide r claims g_i minimizing abs(f_r - g_i) within this deviation |
| Guide update coefficient | alpha | — | user-specified | 0 to 1 | p.18 | alpha = 1 makes guide frequency equal the peak trajectory frequency |
| Allowed sleeping time | — | frames | user-specified | — | p.18 | Guide killed after this many frames with no continuation peak |
| Minimum frequency separation for new guides | — | Hz | user-specified | — | p.18 | New guide's peak must be this far from every existing guide |
| Maximum number of guides | p (max) | — | user-specified | — | p.18 | New-guide creation stops at this count |
| Number of highest peaks used for f0 detection | M | — | 3 | — | p.19 | "we are currently using M = 3" |
| Residual envelope section size | M | bins | user-set by sound complexity | — | p.21 | Section over which local max is taken for line-segment approximation |
| Residual envelope section advance | H | bins | set by sound complexity | — | p.21 | "The accuracy of the fit is given by the hop size" |
| Number of residual envelope breakpoints | Q | — | user-specified | — | pp.21-22 | Envelope band q is centered at fs·q/(2Q) Hz with bandwidth fs/(2Q) Hz |

### Synthesis parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Synthesis frame length | H | samples | equals analysis hop size when no time scaling | — | pp.19-20 | Changing it performs time-scale modification |
| Number of trajectories at frame l | R^l | — | — | <= max guides | p.19 | |
| Stochastic synthesis window | w(m) | — | Hanning | any smooth window | p.22 | "A simple Hanning window suffices"; need not match the analysis window |
| Stochastic synthesis window length | M | samples | 4 × hop size | — | p.22 | Independent of the analysis-window length |
| Stochastic synthesis FFT size | N | samples | first power of 2 > (synthesis window + Q) | — | p.22 | |
| Magnitude spectrum length after interpolation | N/2 | bins | — | — | p.22 | Envelope of length Q interpolated up to N/2 |
| Random phase range | Theta_l(k) | radians | pi - ran(2·pi) | -pi to pi | p.22 | New random values every frame to avoid periodicity at the frame rate |
| Data reduction achievable (prior art) | — | ratio | 100:1 | — | p.13 | Grey 1975, piecewise-linear amplitude envelopes |

## Methods and Implementation Details

- Analysis pipeline: window → FFT → magnitude → peak detection → peak continuation → deterministic trajectories; then additive-synthesize the deterministic part, re-window and re-FFT it with **identical window, window length, FFT size, and hop size**, and subtract magnitude spectra to get residuals *(pp.14, 21)*
- The magnitude-domain subtraction is **rectified**: `|E| = abs(|X| - |D|)` *(p.21)*
- Time-domain subtraction is **not possible** in the base system because the deterministic component does not preserve original phases; Serra (1989) gives a method that does allow it *(p.20)*
- Frame-to-frame parameter interpolation for the deterministic part is **linear in both amplitude and frequency**, with phase accumulated as the running integral of interpolated frequency *(p.20)*
- Trajectory birth: start the trajectory at frame n-1 with amplitude 0 and the current frequency so it ramps in *(p.18)*
- Trajectory death: match the guide frequency to itself with 0 magnitude so it ramps to 0 over one hop *(p.18)*
- Conflict resolution in guide assignment is **recursive**: winner keeps the peak and recursively re-invokes assignment for the dislodged guide *(p.18)*
- **Backward (end-to-front) analysis** is recommended to get clean partial definition before hitting the noisy attack *(pp.18-19)*
- Stochastic synthesis uses **overlap-add IFFT** with random phase and a Hanning synthesis window, not a time-domain filter *(p.22)*
- Because random phase implies a rectangular-windowed noise frame, the IFFT output has **no natural taper** and MUST be windowed before overlap-add *(p.22)*

## Figures of Interest
- **Fig. 1 (p.14):** Block diagram of the analysis part of SMS — window, FFT, magnitude computation, peak detection, peak continuation, frequency/magnitude trajectories (deterministic representation), then additive synthesis, FFT, magnitude computation, subtraction, envelope approximation, spectral envelopes (stochastic representation).
- **Fig. 2 (p.15):** Block diagram of the synthesis part — transformations on frequency/magnitude trajectories into additive synthesis; transformations on residual spectral envelopes plus a random number generator into polar-to-rectangular conversion, IFFT, windowing; sum of deterministic and stochastic signals.
- **Fig. 3 (p.15):** Magnitude spectrum of a rectangular window, showing the main lobe spanning bins -1 to +1 and the first side lobe at -13 dB.
- **Fig. 4 (p.17):** Peak detection on a spectrum of a piano attack sound, 0-4 kHz, 0 to -60 dB, with detected peaks marked by crosses on every local maximum.
- **Fig. 5 (p.17):** Illustration of the peak continuation algorithm over frames n-2 to n+2, labeling a sleeping guide, a new guide, an active guide, and a killed guide, with the frequency guides just continued through frame n.
- **Fig. 6 (p.20):** Deterministic synthesis without phase tracking — (a) waveform of an original piano tone, (b) deterministic component without phase tracking (waveform differs but spectrum is comparable), (c) magnitude spectrum of the original sound 0-16 kHz, 0 to -80 dB, (d) magnitude spectrum of the deterministic component, showing the deterministic spectrum tracks the original up to about 8 kHz then falls away where the noise floor dominates.
- **Fig. 7 (p.21):** Stochastic computation — (a) magnitude spectrum from a piano tone 0-8 kHz 0 to -60 dB, (b) residual spectrum after magnitude subtraction, (c) the smooth line-segment residual approximation.

## Results Summary
The paper is a system description rather than a quantitative evaluation. The stated result is qualitative: "The SMS technique has proved to give general, high quality transformations for a wide variety of musical signals" *(p.12)*. Figures 6 and 7 demonstrate that the deterministic magnitude spectrum matches the original where partials dominate and that the residual has a smooth, slowly varying envelope suitable for line-segment approximation *(pp.20-21)*. The prior-art data-reduction benchmark quoted is Grey's 100:1 for piecewise-linear amplitude envelopes *(p.13)*.

## Limitations
- The analysis is **not automatic**: "In the current algorithm there is no attempt to make the process completely automatic. The user is expected to know some characteristics of the sound beforehand, specifying them through a set of parameters" *(p.17)*
- The analysis is a **complex algorithm requiring manual setting of a few control parameters**; automation is future work, particularly with specialization for a group of sounds *(p.23)*
- **The peak-continuation algorithm is explicitly flagged as open to further research** *(p.23)*
- **Time-domain subtraction is impossible** in the base system because phases are not preserved *(p.20)*
- **Fusion failure**: characterizing one sound with two representations can produce a result where the deterministic and stochastic parts do not fuse into a single entity when transformed differently *(p.23)*
- The residual is only *assumed* quasi-stochastic; the model discards residual phase and exact frequency detail entirely *(pp.20-21)*
- Peak-frequency estimates are quantized to half a bin unless spectral interpolation is applied *(p.17)*
- Attack portions are noisy and hard to track, motivating the backward-analysis workaround *(p.18)*
- The tracking algorithm assumes stable partials with slowly changing amplitude and frequency *(p.14)*

## Arguments Against Prior Work
- **Against the phase vocoder** *(p.13)*: it is a fixed-frequency filter bank, so a sinusoid's frequency cannot normally vary outside its channel bandwidth (nominally sampling rate divided by FFT length) unless channels are combined with extra work. It was really set up for harmonic signals; a piano's progressively sharpened partials fall "in the crack between two adjacent FFT bins". Inharmonic sounds with deep vibrato were difficult to analyze. Combining adjacent bins was possible but "inconvenient and outside the original scope of the analysis framework."
- **Against PARSHL and sinusoids-only models** *(p.13)*: "A problem with PARSHL, however, is that it is unwieldy to represent noiselike signals, such as the attack of many instrumental sounds. Using sinusoids to simulate noise is extremely expensive because, in principle, noise consists of sinusoids at every frequency within the band limits."
- **Against McAulay-Quatieri** *(p.13)*: their peaks are found as changes in slope of the magnitude spectrum rather than by pulling out the whole hill; their spectral peaks are not interpolated in frequency or amplitude; their envelopes are not simplified to few piecewise-linear breakpoints (one breakpoint per frame retained); their peak association across frames uses a different birth/death algorithm; and they lack PARSHL's constraints (frequency-interval restriction, maximum glissando slope, minimum dB level and width).
- **Against LPC for residual modeling** *(p.21)*: "the line-segment approach is more flexible than LPC, and even though LPC results in fewer analysis points, the flexibility is considered more important here." Also, manipulating line-segment envelopes is "much simpler and more intuitive than the manipulation of a set of all-pole filters, such as those resulting from an LPC analysis" *(p.23)*.
- **Against sinusoids-only time stretching** *(p.23)*: with SMS "the noise part of the sound remains noise no matter how much the sound is stretched (which is not the case in 'sinusoids-only' representations)."

## Design Rationale
- **Why a stochastic component at all:** noise modeled as sinusoids costs one oscillator per frequency across the band; a filtered-noise model captures the same percept with a handful of envelope breakpoints *(p.13)*
- **Why phase is discarded for the stochastic part:** a stochastic signal is fully described by its power spectral density, so "it is not necessary to preserve either the instantaneous phase or the exact details of individual FFT frames" *(p.14)*
- **Why magnitude-domain rather than time-domain subtraction:** the deterministic resynthesis does not preserve original phase, but magnitude and frequency are preserved, so magnitude spectra are comparable *(p.20)*
- **Why Kaiser windows:** control of the main-lobe-width versus side-lobe-level trade-off is valuable *(p.16)*
- **Why zero padding plus parabolic interpolation instead of heavy zero padding:** obtaining good frequency accuracy by zero padding alone requires a very large padding factor; parabolic interpolation over three bins is far cheaper *(p.17)*
- **Why line-segment approximation over spline / least squares / LPC:** simple, accurate enough, and gives the desired flexibility *(p.21)*
- **Why one breakpoint per frame is often kept rather than a reduced line-segment fit:** equally spaced points along each function make manipulation easier, so data reduction is applied only when it is a priority *(p.19)*
- **Why the same number of breakpoints on frequency and time axes for the stochastic part:** parallel structure with the deterministic representation, easing manipulation *(p.22)*
- **Why backward analysis:** the end of an instrumental sound is a very stable region, so guides lock onto true partials before reaching the noisy attack *(pp.18-19)*
- **Why the stochastic synthesis window must exist and be smooth:** random phase corresponds to a rectangular-windowed noise frame, which would not taper and would break overlap-add *(p.22)*
- **Why new random phase every frame:** avoid periodicity at the frame rate *(p.22)*

## Testable Properties
- Peak frequency estimated without interpolation is accurate only to within half a bin, i.e. within fs/(2N) Hz *(p.17)*
- FFT size N must satisfy N >= 2M for the chosen window length M, with N a power of two *(p.16)*
- Hop size H = window length / main-lobe width in bins; for a Hamming window this gives H = M/4 *(p.16)*
- Rectangular window: main lobe 2 bins, highest side lobe -13 dB. Hamming window: main lobe 4 bins, highest side lobe -43 dB *(pp.15-16)*
- Narrowing a window's main lobe raises its highest side-lobe level, and vice versa (Kaiser trade-off) *(p.16)*
- Increasing overlap (smaller H) gives smoother results across time at proportionally greater computational expense *(p.16)*
- The residual spectrum must be computed from STFTs using identical window, window length, FFT size, and hop size for original and deterministic signals; otherwise the subtraction is invalid *(p.21)*
- The residual magnitude is the absolute value of the difference of magnitudes, hence nonnegative *(p.21)*
- Guide update with alpha = 1 makes guide frequency identical to peak trajectory frequency, losing the guide-trajectory difference *(p.18)*
- A trajectory that dies ramps its amplitude to 0 over exactly one hop size *(p.18)*
- A trajectory that is born starts at frame n-1 with amplitude 0 *(p.18)*
- Stochastic envelope breakpoint q corresponds to a band centered at fs·q/(2Q) Hz with bandwidth fs/(2Q) Hz *(p.22)*
- Stochastic synthesis window length should be four times the hop size, and is independent of the analysis window length *(p.22)*
- The IFFT of a random-phase spectrum has constant amplitude across the frame and does not taper at the boundaries *(p.22)*
- Time stretching by changing the synthesis frame size preserves pitch and formant structure *(p.23)*
- Under time stretching, the stochastic component remains noiselike, unlike sinusoids-only representations *(p.23)*
- Parabolic interpolation of the log-magnitude spectrum is exact when the analysis window is Gaussian *(p.17)*
- Window length of about four periods suffices for periodic signals *(p.16)*
- Restricting deterministic analysis to a limited frequency range shifts the remaining energy into the stochastic component, producing a stronger noise component *(p.23)*

## Relevance to Project
This is the origin paper for the harmonic-plus-noise decomposition that underlies modern source-filter and formant speech synthesis quality work. Direct applications to a Klatt-style formant synthesizer:

- **Aspiration and frication noise modeling.** The stochastic branch is exactly the "noise through a time-varying filter" structure that a formant synthesizer's aspiration (AH) and frication (AF) paths implement. Serra's contribution is a principled analysis route to *derive* that time-varying filter from real speech rather than hand-tuning it: subtract the resynthesized voiced harmonics in the magnitude domain and line-segment-fit what is left *(pp.20-21)*.
- **The rectified magnitude subtraction `abs(|X| - |D|)`** is a directly implementable recipe for extracting a per-frame noise floor from recorded speech, which can then be mapped onto noise-source amplitude and a shaping filter *(p.21)*.
- **Overlap-add random-phase IFFT noise synthesis** *(p.22)* is a cheap alternative to running white noise through a cascade of resonators, and the paper gives the exact windowing requirement (smooth synthesis window of length four times the hop) needed to avoid frame-rate artifacts. If a worklet-based synthesizer ever generates noise spectrally, this is the correct construction.
- **Avoiding frame-rate periodicity** by drawing fresh random phase every frame *(p.22)* is a concrete bug-avoidance rule for any block-based noise generator.
- **Peak continuation with guides, sleeping guides, birth/death ramps and recursive conflict resolution** *(pp.17-18)* is a reusable formant/partial tracking design; the harmonic specialization where guides are reset to the harmonic series of a detected f0 each frame *(p.19)* is the speech-relevant variant.
- **Pitch/formant decoupling**: "It is also possible to decouple the sinusoidal frequencies from their amplitude, obtaining effects such as changing pitch while maintaining formant structure" *(p.23)* is precisely the property a formant synthesizer needs when varying F0 independently of the vocal tract transfer function.
- **The fusion caveat** *(p.23)* is a warning for any two-path synthesizer: if the voiced and noise paths are modified independently, the result can fail to cohere as one voice.
- **Analysis parameter discipline** (window length about four periods, N >= 2M, hop = M / main-lobe bins, parabolic three-bin peak interpolation) *(pp.16-17)* is directly reusable for any analysis tooling built to measure formants or extract synthesis targets from recorded speech.

## Open Questions
- [ ] How should the residual line-segment section size be chosen automatically for speech, where the residual is dominated by aspiration rather than broadband instrument noise? The paper says only that it is "set depending on the sound complexity" *(p.21)*.
- [ ] The paper does not quantify how much residual energy remains harmonic after subtraction, nor how subtraction errors at partial peaks (where `abs()` rectification turns overshoot into spurious noise) affect perceived quality *(p.21)*.
- [ ] No numeric values are given for the maximum peak deviation, sleeping time, minimum guide separation, or maximum number of guides; these are left entirely to the user *(p.18)*.
- [ ] The pitch detection algorithm used for the harmonic variation is described only as "finding the M highest peaks and searching for the peak that is a fundamental for all of them" with M = 3; the matching tolerance is unspecified *(p.19)*.
- [ ] How well does the deterministic-plus-stochastic split behave for voiced fricatives, where harmonic and noise energy coexist in the same band? Not addressed.
- [ ] Serra's 1989 dissertation is cited for the time-domain-subtraction method, the extended window discussion, and the parabolic interpolation detail; those details are not in this paper *(pp.16, 17, 20)*.

## Related Work Worth Reading
- **Serra, X. 1989.** "A System for Sound Analysis/Transformation/Synthesis Based on a Deterministic plus Stochastic Decomposition." Ph.D. diss., Stanford University. The full-length source for window selection, parabolic interpolation, and phase-preserving time-domain subtraction.
- **Smith, J. O., and X. Serra. 1987.** "PARSHL: An Analysis/Synthesis Program for Nonharmonic Sounds based on a Sinusoidal Representation." ICMC 1987. The direct predecessor; supplies the peak-tracking machinery.
- **McAulay, R. J., and T. F. Quatieri. 1986.** "Speech Analysis/Synthesis based on a Sinusoidal Representation." IEEE Trans. ASSP 34(4): 744-754. The speech-side sinusoidal model and the main comparison point.
- **Allen, J. B. 1977.** "Short-term Spectral Analysis, Synthesis, and Modification by the Discrete Fourier Transform." IEEE Trans. ASSP 25(3): 235-238. Source of the STFT framework and the hop-size criterion.
- **Harris, F. J. 1978.** "On the Use of Windows for Harmonic Analysis with the Discrete Fourier Transform." Proc. IEEE 66(1): 51-83. The window reference the paper defers to.
- **Strawn, J. 1980.** "Approximation and Syntactic Analysis of Amplitude and Frequency Functions for Digital Sound Synthesis." CMJ 4(3): 3-24. Source for the line-segment approximation of envelopes.
- **Markel, J. D., and A. H. Gray. 1976.** *Linear Prediction of Speech.* The LPC alternative that SMS argues against for residual modeling.
