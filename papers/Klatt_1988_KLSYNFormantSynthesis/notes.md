---
title: "KLSYN: A Formant Synthesis Program"
authors: "Dennis H. Klatt (revised for the IBM-PC implementation by Keith Johnson)"
year: 1988
venue: "Software manual / user guide (MIT Research Laboratory of Electronics; IBM-PC port by Keith Johnson & Yingyong Qi, Ohio State University)"
doi_url: ""
note: "The 'KLSYN88' synthesizer. Same synthesizer as Klatt (1980) except the voicing source is augmented with a second (natural KLGLOTT88-style polynomial) glottal waveform and new voice-quality control parameters. IBM-PC version first implemented 1987; minor later modifications by Keith Johnson."
---

# KLSYN: A Formant Synthesis Program

## One-Sentence Summary
This is the user manual / parameter reference for KLSYN (the "KLSYN88" formant synthesizer): it documents the ~50 control constants and variable parameters, the two selectable glottal voicing sources (low-pass-filtered impulse train vs. the natural cubic-polynomial pulse), the new voice-quality parameters (open quotient, spectral tilt, skew, turbulence) added beyond Klatt (1980), the cascade/parallel vocal-tract topology, and the command-line interface — everything needed to reproduce the synthesizer behavior.

## Problem Addressed
The Klatt (1980) cascade/parallel formant synthesizer used a single fixed voicing source whose phase and spectral characteristics could not be varied to mimic natural changes in voice quality over the duration of a sentence. KLSYN88 augments the voicing source so the user can choose between two glottal waveforms and continuously vary voice quality (open quotient, spectral tilt, skew/fry, turbulence/breathiness), making more natural voice-quality changes possible. The manual also documents the IBM-PC port and its workflow tooling.

## Key Contributions
- A second, more natural voicing source (`ss=2`): a cubic-polynomial glottal volume-velocity pulse `Ug(t) = a·t² − b·t³` with well-defined open/closing times and asymmetric (faster closing) shape *(p.11)*.
- New continuous voice-quality control parameters beyond Klatt (1980): open quotient `oq`, spectral tilt `tl`, skew-to-alternate-periods `sk`, amplitude of turbulence `at` (breathiness), plus delta-F1/delta-B1 at open glottis (`dF`,`db`) *(p.3, p.14-15)*.
- A complete, exhaustively defaulted parameter set (Table I) with soft min/max limits *(p.3-4)*.
- Fundamental-frequency specification in 0.1 Hz units with period quantization at 1/40000 s (4× oversampled source) to avoid "staircase pitch" *(p.13)*.
- Practical command interface (Table II) and 21 selectable diagnostic output taps (Table III) *(p.6, p.13)*.
- IBM-PC port producing Cspeech files; batch mode and automatic gain control (AGC) not in the original KLSYN *(p.0-1, p.5)*.

## Study Design (empirical papers)
*Not an empirical study — this is a synthesizer software manual / parameter reference.*

## Methodology
KLSYN is a digital cascade/parallel Klatt formant synthesizer driven by a configuration file (`default.con` or `name.doc`) plus per-parameter piecewise-linear time functions. The user sets constants (fixed for the whole utterance) and variable parameters (which may be made time-varying via the `e` command). The synthesizer generates a glottal source (selectable impulse-train or natural-polynomial), adds aspiration and turbulence noise, routes voicing through a cascade vocal-tract resonator chain (vowels/sonorants) and frication/voicing through a parallel resonator bank + bypass (fricatives/plosive bursts), applies the radiation characteristic, and writes a waveform file.

### Signal flow / block diagram (Figure 1, "insert Figure 1 about here", p.3; topology inferred from text + Klatt 1980)
- Voicing source: selected by `ss`. `ss=1` = impulse train through a critically-damped 2-pole low-pass filter (cutoff nominally 0 Hz, bandwidth ∝ `oq`); `ss=2` = natural polynomial pulse. The source is generated at 4× the sampling rate `sr`, then low-pass/downsampled *(p.13-14)*.
- Spectral tilt `tl` applied via a soft one-pole low-pass filter on the voicing source *(p.15)*.
- Aspiration noise (`ah`) and turbulence noise (`at`) mixed into the glottal source feeding the **cascade** branch; frication noise (`af`) feeds the **parallel** branch *(p.14)*.
- Cascade vocal tract: up to `nf` (≤8) series resonators F1..F8 plus a nasal pole/zero pair (`fp`/`fz`). Excited by `av` (voicing) + aspiration + turbulence *(p.10, p.18)*.
- Parallel vocal tract: 6 parallel formant resonators (own amplitudes `a1..a6` and bandwidths `p1..p6`), a nasal parallel formant (`an`), and a bypass path (`ab`). Excited by frication `af` and optionally parallel voicing `ap` *(p.18-20)*.
- Radiation characteristic applied at output (and to diagnostic taps with `os≥5`); the source derivative is usually computed directly *(p.12)*.

## Key Equations / Statistical Models

Natural voicing-source (KLGLOTT88) glottal volume-velocity waveform, during the open phase of each period (zero for the remainder):
$$
U_g(t) = a\,t^{2} - b\,t^{3}
$$
Where: `Ug(t)` = glottal volume velocity during the open phase; `t` = time from glottal opening; `a`, `b` = coefficients set so the pulse has the requested open duration (`oq`) and amplitude. Closing velocity exceeds opening velocity (asymmetric). Choice based on Rothenberg (1971) and Fant (1983). With default parameters and `ss=2` the source spectrum has a weak zero near ~600 Hz. *(p.11)*

Fundamental period quantization (digital simulation): glottal-opening instants are quantized to increments of `1/40000` s, i.e. the source is run at `4·sr` and downsampled. At 100 Hz this gives ~0.25 Hz `f0` steps (0.25% error); at 200 Hz, 0.5 Hz steps (still 0.25%). *(p.13)*

`f0` units: requested fundamental frequency in Hz × 10 (e.g. 100 Hz → `f0`=1000), giving 0.1 Hz resolution. *(p.13)*

Open quotient at default: `oq`=50 (%) corresponds to a 5 ms open portion at `sr`=10000 and `f0`=100 Hz. For `ss=2`, `oq` is the **exact number of samples** in the open period; for `ss=1` it is a nominal pulse-width indicator. *(p.15)*

Skew: `sk` = number of 25-microsecond increments added to / subtracted from successive (alternate) fundamental period durations, simulating vocal fry. *(p.15)*

Maximum utterance duration: `du_max = 200 frames × ui` (with default `ui`=5 ms → 1000 ms). `du` is rounded up to the nearest multiple of `ui`. *(p.9)*

## Parameters

### Table I — Default configuration of KLSYN: CONSTANTS (V/C = C, fixed for whole utterance) *(p.3)*

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Sampling rate | sr | samples/s | 10000 | 5000–20000 | 3 | Raising sr alone tilts spectrum down; for 16000 set nf=8. Antialias LPF 4500–4800 Hz at 10 kHz. |
| Utterance duration | du | ms | 500 | 30–5000 | 3 | Include ≥25 ms tail for decay. Max effectively 1000 (=200·ui). Rounded up to multiple of ui. |
| Number of cascade formants | nf | count | 5 | 1–8 | 3 | 5 ≈ 17 cm tract at 10 kHz. Female→4. 16 kHz→8. F7/B7=6500/500, F8/B8=7500/600 fixed. |
| Source select | ss | — | 1 | 1–2 | 3 | 1=LP-filtered impulse train; 2=natural polynomial pulse (sharp closing). |
| Random seed | rs | — | 1 | 1–99 (text says 0–99999) | 3 | Same seed → identical frication/aspiration noise (good for continua). |
| Output select | os | — | 0 | 0–20 | 3 | Diagnostic output tap (Table III). Radiation char applied if os≥5. |
| Update interval | ui | ms | 5 | — | 9 | NOT in Table I but a constant. Frame/param update interval; 10 ms often enough. |

### Table I — VARIABLE parameters (V/C = V; may be time functions via `e`) *(p.3-4)*

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Overall gain control | g0 | dB | 60 | 0–80 | 3 | Scales output without editing each source-amp track. |
| Fundamental frequency | f0 | 0.1 Hz (Hz×10) | 1000 | 0–5000 | 3 | 1000 = 100 Hz. 0 = no voicing pulses. |
| Amplitude of turbulence | at | dB | 0 | 0–80 | 3 | Breathiness; noise only during open phase, scales with av. |
| Glottal open quotient | oq | % (samples if ss=2) | 50 | 10–80 | 3 | % of period glottis open; exact sample count for ss=2. |
| Glottal spectral tilt | tl | dB | 0 | 0–34 | 3 | Extra downward tilt via 1-pole LPF; 24 → ~24 dB atten above ~3 kHz. |
| Glottal skew | sk | 25 µs units | 0 | 0–100 | 3 | Skew to alternate periods (vocal fry). |
| Delta F1 (at open glottis) | dF | Hz | 0 | 0–100 | 3 | F1 increment during glottal open phase. |
| Delta B1 (at open glottis) | db | Hz | 0 | 0–400 | 3 | B1 increment during glottal open phase. |
| Amplitude of cascade voicing | av | dB | 60 | 0–80 | 3 | Voicing into cascade tract; 0=off, ~60=max non-overloading vowel. |
| Amplitude of aspiration | ah | dB | 0 | 0–80 | 3 | Aspiration noise into cascade tract; for [h]/aspirated plosives. |
| First formant frequency | F1 | Hz | 500 | 180–1300 | 3 | F1 ≥180 Hz always (cavity-wall mass). |
| Second formant frequency | F2 | Hz | 1500 | 550–3000 | 3 | |
| Third formant frequency | F3 | Hz | 2500 | 1200–4800 | 3 | |
| Fourth formant frequency | F4 | Hz | 3250 | 2400–4990 | 3 | |
| Fifth formant frequency | F5 | Hz | 3700 | 3000–4990 | 3 | |
| Sixth formant frequency | f6 | Hz | 4990 | 3000–4990 | 3 | Move up to place parallel noise peaks above 4990 when sr raised. |
| Nasal zero frequency | fz | Hz | 280 | 180–800 | 3 | Anti-resonance; =fp cancels pole/zero (non-nasal). |
| Nasal pole frequency | fp | Hz | 280 | 180–500 | 3 | ~300 Hz in nasalized vowel. |
| First formant bandwidth | b1 | Hz | 60 | 30–1000 | 3 | Raise to 200–400 for aspiration. |
| Second formant bandwidth | b2 | Hz | 90 | 40–1000 | 3 | |
| Third formant bandwidth | b3 | Hz | 150 | 60–1000 | 3 | |
| Fourth formant bandwidth | b4 | Hz | 200 | 100–1000 | 3 | |
| Fifth formant bandwidth | b5 | Hz | 200 | 100–1500 | 3 | |
| Sixth formant bandwidth | b6 | Hz | 500 | 100–4000 | 4 | No effect if nf=5. |
| Nasal zero bandwidth | bz | Hz | 90 | 40–1000 | 4 | |
| Nasal pole bandwidth | bp | Hz | 90 | 40–1000 | 4 | |
| Amplitude of parallel voicing | ap | dB | 0 | 0–80 | 4 | Voicing into parallel tract (all-parallel synthesis); ~60 for parallel vowel. |
| Amplitude of frication | af | dB | 0 | 0–80 | 4 | Frication noise into parallel formants + bypass. |
| Amplitude of the bypass | ab | dB | 0 | 0–80 | 4 | Flat bypass path (short front cavity: f,v,th,dh,p,b). |
| First formant amplitude (parallel) | a1 | dB | 0 | 0–80 | 4 | Parallel branch formant amplitude. |
| Second formant amplitude (parallel) | a2 | dB | 0 | 0–80 | 4 | |
| Third formant amplitude (parallel) | a3 | dB | 0 | 0–80 | 4 | |
| Fourth formant amplitude (parallel) | a4 | dB | 0 | 0–80 | 4 | |
| Fifth formant amplitude (parallel) | a5 | dB | 0 | 0–80 | 4 | |
| Sixth formant amplitude (parallel) | a6 | dB | 0 | 0–80 | 4 | |
| Nasal formant amplitude (parallel) | an | dB | 0 | 0–80 | 4 | Parallel nasalization (vowels via parallel tract). |
| First formant bandwidth (parallel) | p1 | Hz | 80 | 30–1000 | 4 | Parallel bandwidths wider than cascade. |
| Second formant bandwidth (parallel) | p2 | Hz | 200 | 40–1000 | 4 | |
| Third formant bandwidth (parallel) | p3 | Hz | 350 | 60–1000 | 4 | |
| Fourth formant bandwidth (parallel) | p4 | Hz | 500 | 100–1000 | 4 | |
| Fifth formant bandwidth (parallel) | p5 | Hz | 600 | 100–1500 | 4 | |
| Sixth formant bandwidth (parallel) | p6 | Hz | 800 | 100–4000 | 4 | |

Note: `rs` range is listed as 1–99 in Table I but the prose (p.12) states any value 0–99999 is accepted. Fixed high formants when nf=8: F7=6500, B7=500, F8=7500, B8=600 *(p.10)*.

### Table II — Synthesis commands (single lowercase char, no CR; `?` is the exception) *(p.6)*

| Command | Action |
|---------|--------|
| ? | Print list of legal commands (works at any prompt) |
| q | Quit (all parameter data lost; no resume) |
| p | Print synthesis parameter default values (ctrl-s/ctrl-q to pause) |
| c | Change a parameter default value |
| e | Enter a synthesis parameter time function |
| s | Synthesize waveform |

Command-line invocation modes (mutually compatible flags) *(p.5)*: `klsyn` (default); `klsyn -n` (novice, verbose); `klsyn -b` (batch: read config and synthesize immediately); `klsyn -g` (AGC: synthesize twice, set g0 so output is as loud as possible without peaking); `klsyn -b -g` (batch + AGC); `klsyn name` (load `name.doc` instead of `default.con`); `klsyn ?` (help). Batch and AGC were not in the original KLSYN.

### Table III — Output waveform options (`os`) *(p.13)*

| os | Waveform saved |
|----|----------------|
| 0 | Normal synthesis output |
| 1 | Voicing periodic component alone |
| 2 | Aspiration alone |
| 3 | Frication alone |
| 4 | Glottal source (voicing + turbulence + aspiration) — no radiation char |
| 5 | Glottal source sent to parallel vocal tract (AP) [+ radiation char] |
| 6 | Cascade VT, output of nasal zero resonator |
| 7 | Cascade VT, output of nasal pole resonator |
| 8 | Cascade VT, output of fifth formant |
| 9 | Cascade VT, output of fourth formant |
| 10 | Cascade VT, output of third formant |
| 11 | Cascade VT, output of second formant |
| 12 | Cascade VT, output of first formant |
| 13 | Parallel VT, sixth formant alone |
| 14 | Parallel VT, fifth formant alone |
| 15 | Parallel VT, fourth formant alone |
| 16 | Parallel VT, third formant alone |
| 17 | Parallel VT, second formant alone |
| 18 | Parallel VT, first formant alone |
| 19 | Parallel VT, nasal formant alone |
| 20 | Parallel VT, bypass path alone |

Radiation characteristic is applied for `os≥5` (i.e. >4), not for `os<4`. `os=4` = actual voicing source waveform; `os=5` = first difference of the voicing source routed to the parallel tract. The source derivative is normally computed directly; displayed source approximated via a leaky integrator *(p.12)*.

### Table IV — Formant frequency/bandwidth targets for English vowels (two rows = early/late) *(p.17)*

| Vowel | F1 (Hz) | F2 (Hz) | F3 (Hz) | b1 (Hz) | b2 (Hz) | b3 (Hz) |
|-------|------|------|------|-----|-----|-----|
| [i] early | 310 | 2020 | 2960 | 45 | 200 | 400 |
| [i] late | 290 | 2070 | 2960 | 60 | 200 | 400 |
| [ɪ] early | 400 | 1800 | 2570 | 50 | 100 | 140 |
| [ɪ] late | 470 | 1600 | 2600 | 50 | 100 | 140 |
| [eɪ] early | 480 | 1720 | 2520 | 70 | 100 | 200 |
| [eɪ] late | 330 | 2020 | 2600 | 55 | 100 | 200 |
| [ɛ] early | 530 | 1680 | 2500 | 60 | 90 | 200 |
| [ɛ] late | 620 | 1530 | 2530 | 60 | 90 | 200 |
| [æ] early | 620 | 1660 | 2430 | 70 | 150 | 320 |
| [æ] late | 650 | 1490 | 2470 | 70 | 100 | 320 |
| [ɑ] | 700 | 1220 | 2600 | 130 | 70 | 160 |
| [ɔ] early | 600 | 990 | 2570 | 90 | 100 | 80 |
| [ɔ] late | 630 | 1040 | 2600 | 90 | 100 | 80 |
| [ʌ] | 620 | 1220 | 2550 | 80 | 50 | 140 |
| [oʊ] early | 540 | 1100 | 2300 | 80 | 70 | 70 |
| [oʊ] late | 450 | 900 | 2300 | 80 | 70 | 70 |
| [ʊ] early | 450 | 1100 | 2350 | 80 | 100 | 80 |
| [ʊ] late | 500 | 1180 | 2390 | 80 | 100 | 80 |
| [u] early | 350 | 1250 | 2200 | 65 | 110 | 140 |
| [u] late | 320 | 900 | 2200 | 65 | 110 | 140 |
| [ɹ] early | 470 | 1270 | 1540 | 100 | 60 | 110 |
| [ɹ] late | 420 | 1310 | 1540 | 100 | 60 | 110 |
| [aɪ] early | 660 | 1200 | 2550 | 100 | 70 | 200 |
| [aɪ] late | 400 | 1880 | 2500 | 70 | 100 | 200 |
| [aʊ] early | 640 | 1230 | 2550 | 80 | 70 | 140 |
| [aʊ] late | 420 | 940 | 2350 | 80 | 70 | 80 |
| [ɔɪ] early | 550 | 960 | 2400 | 80 | 50 | 130 |
| [ɔɪ] late | 360 | 1820 | 2450 | 60 | 50 | 160 |

### Table V — Consonants: sonorants (F1 F2 F3 b1 b2 b3) *(p.18)*

| Sonorant | F1 | F2 | F3 | b1 | b2 | b3 |
|----------|----|----|----|----|----|----|
| [w] | 290 | 610 | 2150 | 50 | 80 | 60 |
| [j] | 260 | 2070 | 3020 | 40 | 250 | 500 |
| [r] | 310 | 1060 | 1380 | 70 | 100 | 120 |
| [l] | 310 | 1050 | 2880 | 50 | 100 | 280 |

### Table V — Fricatives/affricates/plosives (F1 F2 F3 b1 b2 b3 a3 a4 a5 a6 ab) *(p.18)*

| Sound | F1 | F2 | F3 | b1 | b2 | b3 | a3 | a4 | a5 | a6 | ab |
|-------|----|----|----|----|----|----|----|----|----|----|----|
| [f] | 340 | 1100 | 2080 | 200 | 120 | 150 | 0 | 0 | 0 | 0 | 57 |
| [v] | 220 | 1100 | 2080 | 60 | 90 | 120 | 0 | 0 | 0 | 0 | 57 |
| [θ] | 320 | 1290 | 2540 | 200 | 90 | 200 | 0 | 0 | 0 | 28 | 48 |
| [ð] | 270 | 1290 | 2540 | 60 | 80 | 170 | 0 | 0 | 0 | 28 | 48 |
| [s] | 320 | 1390 | 2530 | 200 | 80 | 200 | 0 | 0 | 0 | 52 | 0 |
| [z] | 240 | 1390 | 2530 | 70 | 60 | 180 | 0 | 0 | 0 | 52 | 0 |
| [ʃ] | 300 | 1840 | 2750 | 200 | 100 | 300 | 57 | 48 | 48 | 46 | 0 |
| [tʃ] | 350 | 1800 | 2820 | 200 | 90 | 300 | 44 | 60 | 53 | 53 | 0 |
| [dʒ] | 260 | 1800 | 2820 | 60 | 80 | 270 | 44 | 60 | 53 | 53 | 0 |
| [p] | 400 | 1100 | 2150 | 300 | 150 | 220 | 0 | 0 | 0 | 0 | 63 |
| [b] | 200 | 1100 | 2150 | 60 | 110 | 130 | 0 | 0 | 0 | 0 | 63 |
| [t] | 400 | 1600 | 2600 | 300 | 120 | 250 | 30 | 45 | 57 | 63 | 0 |
| [d] | 200 | 1600 | 2600 | 60 | 100 | 170 | 47 | 60 | 62 | 60 | 0 |
| [k] | 300 | 1990 | 2850 | 250 | 160 | 330 | 53 | 43 | 45 | 45 | 0 |
| [g] | 200 | 1990 | 2850 | 60 | 150 | 280 | 53 | 43 | 45 | 45 | 0 |

### Table V — Nasals (fp fz F1 F2 F3 b1 b2 b3) *(p.18)*

| Nasal | fp | fz | F1 | F2 | F3 | b1 | b2 | b3 |
|-------|----|----|----|----|----|----|----|----|
| [m] | 270 | 450 | 480 | 1270 | 2130 | 40 | 200 | 200 |
| [n] | 270 | 450 | 480 | 1340 | 2470 | 40 | 300 | 300 |

## Methods & Implementation Details
- **Two voicing sources (`ss`)** *(p.10-11)*:
  - `ss=1` (default) impulse train through a critically-damped 2nd-order low-pass filter → spectrum −12 dB/octave then flattens; above 4 kHz further attenuated by downsampling LPF. 2-pole LP nominal cutoff 0 Hz; bandwidth ∝ `oq`. Advantage: perfectly regular spectrum, no glottal zeros. Disadvantage: primary excitation at glottal **opening**, none at closing → incorrect source phase (perceptually minor).
  - `ss=2` natural polynomial pulse `Ug(t)=a·t²−b·t³`, asymmetric (closing faster than opening), well-defined open/closing times; spectrum slightly irregular with a weak zero ~600 Hz (default). Disadvantage: formant near ~600 Hz slightly attenuated (zero location depends on `oq`).
- **Source oversampling** *(p.13-14)*: glottal source simulated at 4×`sr`, then low-pass/downsampled, to give 1/40000 s period quantization and avoid staircase pitch.
- **Parameter-update synchronization** *(p.9, p.13)*: changes to source params (`f0`,`av`,`oq`,`tl`,`sk`, also nasal amp) are delayed from the nominal `ui` update time to the next glottal-opening sample, to avoid spurious excitation/distortion at the update rate. Average delay 5 ms at f0=100 Hz, 2.5 ms at f0=200 Hz (up to 10 ms at low f0). Small distortions synchronized to `ui` are unavoidable because formant freqs/bw change at update time.
- **Voicing onset/offset** *(p.14)*: a change in `av` takes effect at the next glottal opening (for `ss=2`, excitation begins later, at closure, `oq`% after opening). Turning `av` off → vocal-tract response decays over 10–20 ms. For exact voice-onset-time, set `f0`=0 before the event and turn `f0` on simultaneously with `av`.
- **Aspiration vs turbulence** *(p.14-15)*: `ah` aspiration noise mixes with voicing (if av>0) into the cascade tract (cannot go to parallel — use `af` instead); spectrum nearly flat, falling slightly with freq. `at` turbulence identical to aspiration but off during the closed phase and scaled by `av` (breathiness; zero when av=0). `ah` for voiceless aspirated plosives and [h]; `at` for breathy voicing. For breathiness also tilt source with `tl`, raise `oq` past half-period, maybe raise `b1`.
- **Open quotient `oq`** *(p.15)*: nominal pulse width (ss=1) / exact open-sample count (ss=2). Narrow pulse (creaky/loud) → high-frequency-rich spectrum; wide pulse (breathy) → energy-rich below F1. Increase `oq` to match a strong first harmonic. Synth truncates `oq` if open portion exceeds the period and warns.
- **Spectral tilt `tl`** *(p.15)*: extra downward tilt via a soft 1-pole LPF; simulates corner-rounding at closure (incomplete/asynchronous closure), voicebar, and spectral matching.
- **Skew `sk`** *(p.15)*: ±25 µs alternating period perturbation simulating vocal fry; strong perceptual effect; common at voicing onset/offset.
- **Bandwidths** *(p.18-19)*: cascade bw `b1..b6`; separate parallel bw `p1..p6` (wider, because turbulence sources add losses and source impedance differs). Increasing bw lowers peak height (more audible) and widens the 3-dB width (less audible). If nf=5, `b6` has no effect. Guidelines: bw below soft limit → whistle-like harmonics; lower-formant bw too wide → buzzy (reduce all bw, then reduce `av`).
- **Nasalization (cascade)** *(p.18-19)*: `fp`/`fz` pole-zero pair; nasalized vowel splits F1 into pole-zero-pole (fp~300, F1 raised, fz≈halfway between fp and F1). Return to oral: move fz down to equal fp → pole/zero cancel. `bp`/`bz` default 90 Hz, rarely changed.
- **Frication/plosive bursts (parallel)** *(p.18-20)*: `af` ramps gradually for fricatives (e.g. 0→60 dB in 90 ms), abruptly to ~60 for plosive bursts. `a1..a6`,`ab` set spectral shape: front-cavity resonance formant ~60 dB first guess, back-cavity formants 0; `a1` ≈ 0 for all English fricatives. Bypass `ab` used when front cavity too short ([f],[v],[θ],[ð],[p],[b]).
- **All-parallel synthesis** *(p.20)*: `ap` voiced excitation of parallel tract (default 0; use 60 with av=0 to synth a vowel in parallel mode). Set a1..a5=60 → correct relative amplitudes for a uniform-tube vowel at 500/1500/2500/3500/4500 Hz; amplitudes diverge as formants move (no automatic skirt attenuation) → trial-and-error. `an` parallel nasal formant: for nasalized parallel vowels set fp≈280 and adjust an & a1.
- **g0** *(p.21)*: overall gain (dB), nominal 60; +3 dB by setting g0=63. Can be made time-varying though rarely useful.
- **F1 in stops** *(p.17)*: during closure F1 ≈ 180 Hz (never below 180 Hz, cavity-wall mass/compliance); on release F1 rises rapidly over 5–10 ms, may appear to jump to ~400 Hz at the first glottal pulse after the burst ([ba]).
- **Workflow/tooling** *(p.0-2)*: RECORD (A/D natural model), SPECTO (pseudo-spectrogram), KLSYN (synth), PLAY, KLSPEC (spectral comparison: "spectrogram filtering" recommended; also dft and critical-band), MAKETAPE (ID/4IAX/paired-comparison listening tests via VAX D/A), KLATTALK (synthesis-by-rule; `KT -d8` emits a `name.doc` config readable by KLSYN, giving first-guess parameters for any English text). IBM-PC version produces Cspeech files.
- **Session interface** *(p.6-8)*: `c` → "Par:" → 2-char symbol → "Change value of xx from yy to / Value:"; out-of-range asks y/n (soft limits, overridable, catch typos). `e` → "par:" → symbol → (time,value) pairs with linear interpolation for unspecified frames; empty line terminates. `s` → requests ≤8-char alphanumeric filename, writes waveform + `name.doc`, prints peak level in dB (>0 = clipped, resynth lower; <−12 = under-using top 2 D/A bits). `klsyn name` reloads.

## Figures of Interest
- **Figure 1 (p.3):** Block diagram of the speech synthesizer (placeholder "insert Figure 1 about here" in this manual copy — actual figure not embedded). Documents the ~50 parameters/constants.
- **Figure 2 (p.11):** Comparison of waveforms and spectra of the impulsive (`ss=1`) and natural (`ss=2`) glottal sources at default settings (placeholder in this copy).
- **Figure 3 (p.15):** Effect of changes in `oq` (top) and `tl` (bottom) on the voicing-source waveform and spectrum (placeholder in this copy).
- **Figure 4 (referenced p.15):** Effect of `tl` on the voicing-source spectrum (referenced; not separately embedded).

## Results Summary
The manual specifies a fully reproducible synthesizer: ~50 parameters with documented defaults/soft-ranges/units, two interchangeable glottal sources, and continuous voice-quality control. It is the authoritative parameter reference for the "KLSYN88" generation of the Klatt synthesizer.

## Limitations
- `nf` only crudely approximates vocal-tract-length variation; for ~10% shorter tracts, use 5 formants placed higher plus `tl` to fix spectral tilt *(p.10)*.
- Natural source (`ss=2`) introduces a spectral zero (~600 Hz) that slightly attenuates a nearby formant — natural but possibly undesirable for controlled stimulus continua *(p.11-12)*.
- Impulse source (`ss=1`) has incorrect source phase (excitation at opening, not closing) *(p.11)*.
- Parallel-branch formant amplitudes require trial-and-error; no automatic skirt attenuation as formants move *(p.20)*.
- Source-parameter changes cannot be applied at arbitrary instants — they snap to glottal openings (up to ~10 ms delay at low f0) *(p.9)*.
- This manual copy contains figure placeholders ("insert Figure N about here") rather than the embedded figures *(p.3, p.11, p.15)*.

## Arguments Against Prior Work
- Against the single fixed source of Klatt (1980): a single voicing waveform cannot produce natural voice-quality changes over a sentence; KLSYN88 adds a selectable second source and voice-quality parameters *(p.0)*.
- The impulse-train source's regular spectrum is preferred in some psychophysical tests, but its phase is wrong; the natural source fixes phase at the cost of spectral irregularity — neither dominates, hence both are offered *(p.11)*.

## Design Rationale
- **Two sources offered** because each trades off spectral regularity vs. correct excitation phase *(p.11)*.
- **Polynomial pulse shape** (`a·t²−b·t³`) chosen per Rothenberg (1971) and Fant (1983) for a realistic asymmetric glottal volume-velocity pulse *(p.11)*.
- **0.1 Hz f0 + 1/40000 s period quantization via 4× oversampling** to avoid audible staircase pitch on slow glides *(p.13)*.
- **Delaying source-parameter changes to glottal openings** to remove update-rate periodicity in distortions and hide them under the signal *(p.9)*.
- **Separate parallel bandwidths `p1..p6`** because turbulence sources and source impedance change effective formant bandwidths in the noise-excited branch *(p.18)*.
- **Soft (overridable) min/max limits** to suggest normal ranges and catch typos without blocking legitimate extreme values *(p.8)*.

## Testable Properties
- `oq`=50 % ⇒ exactly 5 ms open phase at sr=10000, f0=100 Hz (ss-dependent: exact samples for ss=2) *(p.15)*.
- `f0`=1000 ⇒ 100 Hz fundamental (units = Hz×10) *(p.13)*.
- Period is quantized to multiples of 1/40000 s ⇒ at 100 Hz, f0 resolves to ~0.25 Hz steps *(p.13)*.
- Natural source (ss=2) default ⇒ a spectral zero near ~600 Hz *(p.11)*.
- `tl`=24 ⇒ ~24 dB attenuation of components above ~3 kHz vs untilted source *(p.15)*.
- `sk` unit = 25 µs added/subtracted on alternate periods *(p.15)*.
- F1 never below 180 Hz; ≈180 Hz during stop closure *(p.17)*.
- nf=5 ⇒ `b6` has no effect on the waveform *(p.18)*.
- Radiation characteristic applied iff `os≥5` *(p.12)*.
- Setting all source amplitudes off and av off ⇒ vocal-tract response decays to inaudible in 10–20 ms *(p.14)*.
- Increasing bandwidth lowers formant peak height (dominant audible effect) and widens 3-dB width *(p.18)*.
- Max utterance = 200 frames × `ui` (=1000 ms at ui=5) *(p.9)*.

## Relevance to Project
Direct and central. Qlatt's stated second mission includes a **klsyn88 fidelity reimplementation** — this manual is the primary specification for that engine. It supplies: the exact KLSYN88 parameter set with symbols/defaults/soft-ranges/units (note the unit quirks: `f0` in Hz×10, `oq` in % for ss=1 but in samples for ss=2, `sk` in 25 µs units, `tl` in dB of tilt); the two source models (impulse train vs. `Ug(t)=a·t²−b·t³`); the new voice-quality parameters (oq, tl, sk, at, dF, db) that may be absent or differently implemented in older C code; the cascade/parallel topology and routing rules; the 21 diagnostic output taps (`os`) usable as an audio-path spying/verification surface; and worked default tables (Tables IV/V) usable as inventory targets. The fixed high-formant values (F7/B7=6500/500, F8/B8=7500/600), the 4× source oversampling, and the glottal-opening parameter-snapping are fidelity-critical details easy to miss.

## Open Questions
- [ ] Figures 1–4 are placeholders in this copy — the exact block-diagram routing and the `a`,`b` coefficient formulas in terms of `oq`/amplitude must be reconstructed from Klatt (1980) and the klsyn88 source (`~/src/klsyn/`).
- [ ] `rs` range discrepancy: Table I says 1–99, prose says 0–99999 — confirm against source.
- [ ] Exact filter coefficients of the `tl` 1-pole LPF and the `ss=1` critically-damped 2-pole LPF (bandwidth ∝ oq) are not given numerically here.
- [ ] Precise relationship of `dF`/`db` (delta F1/B1 at open glottis) to the open-phase modulation is only named, not formulated.

## Related Work Worth Reading
- Klatt (1980) "Software for a Cascade/Parallel Formant Synthesizer", JASA 67, 971-995 — the base synthesizer (already in collection: `Klatt_1980_CascadeParallelFormantSynthesizer`).
- Fant (1983) "The Voice Source: Acoustic Modeling", STL-QPSR 4/1982, 28-48 — source-shape basis for `Ug(t)`.
- Rosenberg (1971) "Effect of Glottal Pulse Shape on the Quality of Natural Vowels" — pulse-shape basis (cited in the manual under the misspelling "Rothenberg"; in collection as `Rosenberg_1971_EffectGlottalPulseShape`).
- Johnson & Teheranizadeh (1992) "Facilities for speech perception research at the UCLA phonetics lab", UCLA Working Papers in Phonetics — perception-test running environment.
- Klatt (1990) "Analysis, synthesis, and perception of voice quality variations" (LF / voice quality) — already in collection.

## Collection Cross-References

### Already in Collection
- [Software for a Cascade/Parallel Formant Synthesizer](../Klatt_1980_CascadeParallelFormantSynthesizer/notes.md) - the base synthesizer this manual extends; KLSYN88 is "the same synthesizer except the voicing source is augmented." Defer to it for the full block diagram, resonator/filter coefficients, and original parameter semantics.
- [Rosenberg 1971 - Effect of Glottal Pulse Shape on the Quality of Natural Vowels](../Rosenberg_1971_EffectGlottalPulseShape/notes.md) - cited basis for the natural glottal pulse shape Ug(t)=a·t²−b·t³. NOTE: the manual's reference list misspells the author as "Rothenberg, A. (1971)" with page numbers JASA 53, 1632-1645; this is a typo for Rosenberg, A.E. (1971), the well-known glottal-pulse-shape paper already in the collection.

### New Leads (Not Yet in Collection)
- Fant, G. (1983), "The Voice Source: Acoustic Modeling", STL-QPSR 4/1982, 28-48 - basis for the natural glottal pulse shape Ug(t)=a·t²−b·t³ (collection has Fant's later LF-model papers 1985/1986/1988 but not this QPSR source-modeling paper).
- Johnson, K. & Teheranizadeh, H. (1992), "Facilities for speech perception research at the UCLA phonetics lab", UCLA Working Papers in Phonetics - the online listening-test environment built around this synthesizer.

### Supersedes or Recontextualizes
- [Software for a Cascade/Parallel Formant Synthesizer](../Klatt_1980_CascadeParallelFormantSynthesizer/notes.md) - does not supersede, but extends: KLSYN88 adds a second (natural polynomial) voicing source and the voice-quality parameters (oq, tl, sk, at, dF, db) on top of the Klatt (1980) engine.

### Cited By (in Collection)
- (No collection paper cites this specific manual document directly; many cite the "KLSYN88" synthesizer generically and reference Klatt 1980 or Klatt & Klatt 1990 instead.)

### Conceptual Links (not citation-based)
- [Klatt & Klatt 1990 - Voice Quality Variations Analysis](../Klatt_1990_VoiceQualityVariations/notes.md) - direct successor concept: this manual introduces the augmented voicing source and voice-quality controls (oq, tl, at, sk) whose acoustic/perceptual study Klatt & Klatt (1990) develops in depth. The KLSYN88 parameter set documented here is the synthesis substrate for that voice-quality work.
- [Rule-Based Voice Quality Variation with Formant Synthesis](../Burkhardt_2009_VoiceQualityFormantSynthesis/notes.md) - Burkhardt's phonation-type rules manipulate exactly the KLSYN88 voice-quality parameters defined here (open quotient, spectral tilt, bandwidths, amplitudes) via a single "rate" variable; this manual is the parameter ground truth those rules operate on.
- [Synthesizing Styled Speech Using the Klatt Synthesizer](../Rutledge_1995_SynthesizingStyledSpeechKlatt/notes.md) - uses the KLSYN/Klatt parameter tracks documented here to produce styled speech; depends on the same source-amplitude and voice-quality controls.
- [Flexible Formant Synthesizer: A Tool for Improving Speech Production Quality](../Lalwani_1992_FlexibleFormantSynthesizer/notes.md) - contemporaneous flexible Klatt-family synthesizer; same cascade/parallel topology and parameter-control philosophy as KLSYN88.
