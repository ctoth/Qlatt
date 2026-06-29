# KLSYN88 Fidelity — Paper-Only Voice-Source Features: Implementation Spec

Spec extraction only (no code changes). Sources are the pre-extracted notes in this
repo:

- `papers/Klatt_1990_VoiceQualityVariations/notes.md` — PRIMARY (KLSYN88 / KLGLOTT88,
  Tables XI/XII, Eq. 1, §3 source model). Page refs are to JASA 87(2), 820-857.
- `papers/Fant_1985_LFModelGlottalFlow/notes.md` — original 4-parameter LF model
  (STL-QPSR 26(4):1-13).
- `papers/Fant_1988_LFFrequencyDomainInterpretation/notes.md` — normalized R-params,
  Fg/Fa/Rg/Rk/Ra/Qo (STL-QPSR 29(2-3):1-21).
- `papers/Fant_1997_VoiceSourceConnectedSpeech/notes.md` — Rd unified parameter and the
  Rd↔(Ra,Rk,Rg,OQ) conversion table/eqs (Speech Comm. 22:125-139).
- `papers/Doval_2003_VoiceSourceCALM/notes.md` — LF-as-anticausal-filter, αm asymmetry
  ↔ Oq/Fg.
- `papers/Klatt_1980_CascadeParallelFormantSynthesizer/notes.md` — cascade nasal
  pole/zero convention the tracheal pair mirrors.
- `notes/klsyn88-fidelity-reference-signalpath.md` — the reverse-engineered SHIPPED C
  DSP (`~/src/klsyn/c/parwv.c`). This is the conformance ground truth and it
  **diverges sharply from the 1990 paper** for three of the four features below; the
  divergences are flagged in §6.

**Read §6 first if you only read one section.** Three of these four features (LF source,
flutter, tracheal pole-zero) and half of the fourth (diplophonia attenuation) are
described in the 1990 paper but are **absent from the shipped klsyn88 C reference**.
"Fidelity to the paper" and "fidelity to the shipped synth" are different targets here.

---

## 1. LF GLOTTAL SOURCE (paper SS=3, "modified LF model")

### 1.1 What the paper says it is

Klatt & Klatt 1990 §4 lists three source options (notes §4): SS=1 old impulsive,
SS=2 KLGLOTT88 polynomial (`at²−bt³` derivative, the default), and **SS=3 "Modified LF
model"** (Fant, Liljencrants & Lin 1985). The 1990 paper does *not* re-derive the LF
equations; it references Fant et al. 1985 and exposes it through the high-level controls
**OQ** (open quotient) and **SQ** (speed quotient). All LF math below is from the Fant
papers; the Klatt contribution is the OQ/SQ front-end and the parameter ranges
(Table XII, notes §6): SQ 100–500 %, default 200 %; OQ 10–99 %, default 50 %.

### 1.2 LF flow-derivative waveform (the two-segment exp-sinusoid form)

The LF model describes the **derivative of glottal flow** `E(t) = dUg/dt` in two
segments per period (Fant 1985 notes "Key Equations"; Fant 1988 notes "Time-Domain
Equations"):

**Open / opening-closing segment**, `0 ≤ t < te` — exponentially growing sinusoid:

```
E(t) = E0 · e^(α t) · sin(ωg t)          (Fant 1985 eq. for L-model; Fant 1988 t<Te)
```

**Return segment**, `te ≤ t < tc` (tc = T0) — exponential decay to closure:

```
E(t) = −(Ee / (ε·ta)) · [ e^(−ε(t−te)) − e^(−ε(tc−te)) ]
                                          (Fant 1985 LF return phase; Fant 1988 Te<t<Tc)
```

Glottal flow itself (integral of the open segment) is, in closed form (Fant 1985):

```
Ug(t) = E0 · [ e^(α t)(α·sin ωg t − ωg·cos ωg t) + ωg ] / (α² + ωg²)
```

Parameters / symbols (Fant 1985 & 1988 notes parameter tables):

| Symbol | Meaning | Units | Typical |
|--------|---------|-------|---------|
| `T0`   | fundamental period = 1/F0 | s | 5–20 ms |
| `tp`   | instant of flow peak = instant `E` crosses zero going negative | s | 2–4 ms |
| `te`   | instant of negative peak of `E` (= main excitation / closure) | s | 3–6 ms |
| `ta`   | effective return-phase time constant | s | 0–1.5 ms |
| `tc`   | end of cycle (set = T0) | s | = T0 |
| `Ee`   | magnitude of negative peak at te (excitation strength; sets level) | — | — |
| `Ei`   | positive peak of `E` (during opening) | — | — |
| `E0`   | open-segment amplitude scale factor | — | derived |
| `α`    | exp growth constant (positive ⇒ negative damping) | 1/s | derived |
| `ωg`   | glottal "formant" angular freq = 2π·Fg, `Fg = 1/(2tp)` | rad/s | — |
| `ε`    | return-phase decay rate (≈1/ta for small ta) | 1/s | derived |

### 1.3 The three implicit/derived relations (what an implementation must solve)

These tie the free shape parameters (tp, te, ta) to the internal constants (ωg, α, ε,
E0). Every LF synthesizer solves these per period.

1. **Glottal-formant frequency** (the sinusoid passes zero at the flow peak tp):

   ```
   ωg = π / tp           (i.e. Fg = 1/(2 tp); Fant 1988 normalized-params table)
   ```

2. **ε from ta** (transcendental; Newton/iterate, or ε≈1/ta for small ta) — Fant 1985
   "Epsilon-Ta Relationship":

   ```
   ε · ta = 1 − e^(−ε (tc − te))
   ```

3. **α from area balance + amplitude match.** Two conditions:
   - amplitude continuity at te: `E(te) = −Ee` ⇒
     ```
     E0 = −Ee / ( e^(α te) · sin(ωg te) )
     ```
   - zero net flow over the period (Fant 1985 "Area Balance Constraint",
     `∫₀^T0 E dt = 0`). Using relation (2) the return-segment area collapses to a clean
     form, giving the implicit equation in α:

     ```
     Ug(te) = (Ee / ε) · [ 1 − ((tc − te)/ta) · e^(−ε (tc − te)) ]

     where Ug(te) = E0 · [ e^(α te)(α sin ωg te − ωg cos ωg te) + ωg ] / (α² + ωg²)
           and    E0 = −Ee / ( e^(α te) sin ωg te )
     ```

     Solve for α by Newton iteration (α has no closed form given the area constraint —
     Fant 1985 "Limitations": "requires iterative solution to find alpha given area
     balance"). This is exactly what an Rd-driven LF crate already does internally.

Spectral consequence of the return phase (useful for wiring TL/breathiness):

```
Fa = 1 / (2π ta)        first-order LP cutoff on the source spectrum
ΔL(f) = −10·log10(1 + (2π ta f)²) dB     (Fant 1985; Fant 1988 eq. 16)
```
e.g. ta = 0.15 ms ⇒ Fa ≈ 1060 Hz (−3 dB @ 1060 Hz, −12 dB @ 4 kHz).

### 1.4 Klatt OQ / SQ → LF timing (tp, te, ta) — THE mapping you asked for

Klatt exposes only OQ and SQ (plus TL for tilt). The standard reconciliation, using the
classical definitions and Fant's "Klatt definition" of OQ (Fant 1997 notes, "Open
Quotient (reduced form, Klatt definition)" `OQi = Te/T0`):

- **OQ (open quotient)** ⇒ the closure instant:
  ```
  te = (OQ/100) · T0
  ```
  (OQ in %, e.g. OQ=50 ⇒ te = 0.5·T0.) This is the *reduced* open quotient OQi (excludes
  the return tail). If you instead treat OQ as the complete open quotient `(te+ta)/T0`
  you must subtract ta — see ambiguity flag in §6.

- **SQ (speed quotient)** = ratio of the opening duration to the closing duration within
  the open phase = `tp / (te − tp)`. Klatt SQ is in % (100–500, default 200). Define the
  fraction `q = SQ/100`. Then:
  ```
  tp / (te − tp) = q
  ⇒  tp = te · q/(q+1)  = te / (1 + Rk),   with Rk = (te−tp)/tp = 1/q = 100/SQ
  ⇒  te − tp = te / (q+1)
  ```
  Check: SQ=200 % ⇒ q=2 ⇒ tp = (2/3)te, te−tp = (1/3)te, Rk = 0.5. ✓

- **ta**: NOT set by OQ or SQ. Drive it from spectral tilt TL (Klatt's tilt control) or
  from an Rd default. Via Fant: `ta = Ra·T0`, and a reasonable default `Ra` comes from Rd
  (next section) or from inverting `Fa = 1/(2π ta)` against the desired TL. Modal default
  ta ≈ 0.1–0.2 ms (Fant 1985 voice-quality table: modal ta 0–0.2 ms, breathy 0.6–1.5 ms).

So the full forward map is:
```
T0 = 1/F0
te = (OQ/100)·T0
Rk = 100/SQ
tp = te/(1+Rk)
ta = Ra·T0          (Ra from TL or from Rd default, §1.5)
```
then solve §1.3 relations (2),(3) for ε, α, E0. Ee is set by AV (voicing amplitude).

### 1.5 Rd parameterization (Fant 1995/1997) and Rd ↔ (OQ,SQ) / Rd ↔ (tp,te,ta)

Our existing crate is Rd-driven, so here is the bridge in both directions.

Normalized R-parameters (Fant 1988 notes "Normalized Parameters"; Fant 1997 notes):

```
Rg = Fg/F0 = T0/(2 tp) = 1/(2 tp F0)     (glottal-frequency ratio)
Rk = (te − tp)/tp = (Te/Tp) − 1          (steepness)  = 100/SQ
Ra = ta/T0                               (normalized return time)
OQi = te/T0 = (1 + Rk)/(2 Rg)            (reduced/Klatt open quotient)
```

**(OQ, SQ) → Rk, Rg:**
```
Rk = 100/SQ
Rg = (1 + Rk) / (2 · OQ_frac)            where OQ_frac = OQ/100
```
(Derived from `OQi = (1+Rk)/(2Rg)` with OQi = OQ_frac.)

**(tp, te, ta) → Rd** and **(Rk, Rg, Ra) → Rd** (Fant 1997 notes, "Rd from LF
parameters"; accurate to ~0.5 dB for Rd<1.4, ≤1.5 dB error at Rd=2.7):
```
Rd = (1/0.11) · (0.5 + 1.2·Rk) · ( Rk/(4·Rg) + Ra )
```

So **Klatt (OQ, SQ, ta) → Rd**:
```
Rk = 100/SQ
Rg = (1 + Rk)/(2·OQ_frac)
Ra = ta / T0
Rd = (1/0.11)(0.5 + 1.2 Rk)(Rk/(4 Rg) + Ra)
```

**Rd → (OQ, SQ, ta)** to drive the Klatt front-end from Rd (Fant 1997 notes, "Default LF
parameters from Rd", validated by their Table 1):
```
Ra = (−1 + 4.8·Rd)/100        (Rap default)
Rk = (22.4 + 11.8·Rd)/100     (Rkp default)
# Rg by inverting the Rd formula with the defaulted Rk, Ra:
Rg = Rk / ( 4 · ( 0.11·Rd/(0.5 + 1.2·Rk) − Ra ) )
# then back to Klatt controls:
SQ  = 100 / Rk
OQ  = 100 · (1 + Rk)/(2·Rg)
ta  = Ra · T0
```
Sanity vs Fant 1997 Table 1 (notes): Rd=0.7 ⇒ Ra≈2.36 %, Rk≈30.7 %, Rg≈118 %,
OQi≈55.5 %. Plugging Rk=0.307, Rg=1.18 ⇒ OQ = (1.307)/(2·1.18) = 55.4 % ✓;
SQ = 100/0.307 = 326 %. (Note Fant's *default* Rk grows with Rd, so the implied SQ is NOT
200 % at the modal Rd — see §6 ambiguity on the SQ default vs Rd defaults mismatch.)

Doval 2003 (notes) gives the same physics in filter form if you want the anticausal
implementation instead of time-domain: anticausal pole `bp = π/(Oq·T0)`,
`ap = −π/(Oq·T0·tan(π·αm))`, with asymmetry `αm = tp/te = 1/(1+Rk)` (so αm ↔ SQ:
`αm = q/(q+1) = SQ/(SQ+100)`). Glottal-formant `Fg ≈ 0.75·F0` at Oq≈1 (soft) up to
`≈3·F0` at Oq≈0.3 (pressed).

---

## 2. FLUTTER (FL) — slow quasi-random F0 wander

### 2.1 Equation (CONFIRMED)

Klatt & Klatt 1990 Eq. 1 (notes §3 "Flutter Formula" and §14):

```
Δf0 = (FL/50) · (F0/100) · [ sin(2π·12.7·t) + sin(2π·7.1·t) + sin(2π·4.7·t) ]   Hz
```

Your transcription is exact. Verified details:

- **Constants 12.7, 7.1, 4.7 Hz**: confirmed; "chosen to ensure a long period before
  repetition" (notes §3). They are incommensurate so the composite barely repeats.
- **Units of t**: seconds — absolute elapsed time within the utterance (these are Hz
  modulation rates, so `2π·12.7·t` must have t in seconds). 
- **FL**: percent, 0–100, default 0 (Table XII, notes §6). The paper notes FL = 25 %
  "produces realistic pitch variation" (notes §3); the synthesis examples (notes §11) use
  FL = 25 for both normal and breathy voice.
- **F0**: in Hz (the current fundamental). The `(F0/100)` factor makes flutter scale with
  pitch (more absolute wander at higher F0).
- **Amplitude**: peak |Δf0| = (FL/50)(F0/100)·3. At FL=25, F0=100 ⇒ ±1.5 Hz max; at
  FL=100, F0=200 ⇒ ±6 Hz max.

### 2.2 Where it is applied (added to F0)

`Δf0` is **added to the F0 value** used to set the period. The paper presents it as a
perturbation of the fundamental (notes block diagram: F0 is an input to the basic voicing
waveform generator alongside OQ/FL/DI). It is most naturally applied to the F0 contour
**after declination** (declination is part of the supplied F0 track; flutter is an
additive micro-perturbation on top of whatever F0 the contour already specifies at time
t). The paper does not state an explicit ordering relative to declination — see §6
ambiguity. Net F0 driving the period generator:
```
F0_eff(t) = F0_contour(t) + Δf0(t)
T0(t)     = 1 / F0_eff(t)
```

---

## 3. DIPLOPHONIA (DI, 0–100 %, def 0) — alternate-pulse perturbation

### 3.1 Paper algorithm (Klatt & Klatt 1990 §3, notes §3 & §14)

When `DI > 0`, **every other** glottal pulse (the alternate / "second of each pair") is
both **delayed** and **attenuated**:

- **Delay**: the alternate pulse is shifted later in time. Maximum delay (at DI=100 %) is
  defined so that "the closure of the first pulse coincides with the opening of the next"
  (notes §3). With the worked example OQ=50 %, DI=50 % ⇒ delay = a **quarter period**
  (notes §3). That fixes the law:
  ```
  delay = (DI/100) · closed_phase = (DI/100) · (1 − OQ/100) · T0
  ```
  Check: OQ=50 ⇒ closed_phase = 0.5·T0; DI=50 ⇒ delay = 0.5·0.5·T0 = 0.25·T0 (quarter
  period) ✓. At DI=100, delay = full closed phase ⇒ first pulse's closure meets the next
  pulse's opening ✓.

- **Attenuation**: amplitude of the alternate pulse scales **linearly from 1 to 0 as DI
  goes 0→100 %** (notes §3). Worked example: DI=50 % ⇒ "attenuated by half (−6 dB)".
  ```
  amp_factor(alternate pulse) = 1 − DI/100        (linear; DI=50 ⇒ 0.5 ⇒ −6 dB ✓)
  ```
  Odd-numbered pulses keep amp_factor = 1.

### 3.2 Interaction with the period generator

DI operates per-period on a two-pulse (period-doubled) pattern: the generator emits the
normal pulse, then for the alternate pulse it (a) offsets its onset by `delay` and (b)
multiplies its amplitude by `1 − DI/100`. The result is a perceived sub-harmonic
(diplophonic double-pulsing) without changing the mean F0. It is independent of and
composable with flutter (FL perturbs F0; DI perturbs alternate-pulse timing/amplitude).

---

## 4. TRACHEAL POLE-ZERO (FTP / FTZ / BTP / BTZ) — subglottal coupling

### 4.1 What it models

Acoustic coupling of the (open) glottis to the subglottal/tracheal system inserts extra
**pole-zero pairs** into the vowel spectrum, prominent in breathy voice (notes §2 cue 4,
§10 "Tracheal Coupling"). KLSYN88 adds **one** tracheal pole + one tracheal zero as a new
cascade element (notes §4 "New Features").

### 4.2 Placement in the signal chain (mirrors the nasal pole/zero)

Cascade branch order (Klatt & Klatt 1990, notes §4):
```
Nasal Pole-Zero → Tracheal Pole-Zero → F1 → F2 → F3 → F4 → F5 → Output
```
So the tracheal pair sits immediately **after** the nasal pole/zero and **before** F1,
exactly analogous to the nasal pole/zero placement. Implement each as the Klatt 1980
cascade primitives (Klatt_1980 notes, "Antiresonator Coefficients"): the tracheal **zero**
as an antiresonator (`setzeroabc`, output uses input history `y=a·x+b·x₁+c·x₂` with a
inverted) and the tracheal **pole** as an ordinary 2-pole resonator (`y=a·x+b·y₁+c·y₂`,
a=1−b−c). Same difference equations as the nasal RNZ/RNP pair.

### 4.3 Parameters, defaults, ranges (Table XII, notes §6)

| Symbol | Meaning | Min | Default | Max | Units |
|--------|---------|----:|--------:|----:|-------|
| FTP | tracheal pole frequency | 300 | 2150 | 3000 | Hz |
| BTP | tracheal pole bandwidth | 40 | 180 | 1000 | Hz |
| FTZ | tracheal zero frequency | 300 | 2150 | 3000 | Hz |
| BTZ | tracheal zero bandwidth | 40 | 180 | 2000 | Hz |

### 4.4 Enable / amplitude control

There is **no separate on/off or amplitude knob**. As with the nasal pair, the pole and
zero **cancel when coincident**: defaults FTP = FTZ = 2150 and BTP = BTZ = 180 ⇒ the pair
is transparent (no spectral effect). You "turn it on" by **separating** FTZ from FTP
(notes §13 "Tracheal Coupling Strategy"):
1. Move FTP and FTZ together to the observed tracheal resonance frequency.
2. Gradually separate FTZ **downward** over ~50 ms to simulate abduction (the zero
   usually sits just below its pole — notes §10).
3. A second tracheal resonance can borrow the nasal pole/zero pair (notes §13).
(In the parallel branch there is also a tracheal-formant amplitude `ATV`, default 0, in
the voicing-parallel amplitude table, notes §6 — that is the parallel-path analogue, not
the cascade enable.)

### 4.5 Acoustic effect & speaker-specific frequencies

Effect: extra pole-zero ripple in the **~550, 1300, 2100 Hz** region for females
(notes §10), i.e. low-to-mid spectrum; strongest in breathy vowels, contributing to the
breathy/lax percept and to apparent F1-bandwidth increase. Zero sits immediately below
the pole. Empirical placements (Table VII, notes §7):

Female (median): 1st pole (750)/zero 900; 2nd 1650/1800; 3rd 2350/2200; 4th (3150)/(3100).
Male (median):   2nd 1550/1800; 3rd 2200/2050; 4th 3275/3000. Tracheal poles ~50 Hz
higher in females (notes §15).

---

## 5. Consolidated parameter table

LF/source high-level controls and the new pole-zero, with paper provenance. (KLGLOTT88
controls AV/OQ/TL/AH shown for context where they interact.)

| Name | Symbol | Units | Default | Min | Max | Source feature | Citation |
|------|--------|-------|--------:|----:|----:|----------------|----------|
| Open quotient | OQ | % | 50 | 10 | 99 | LF & KLGLOTT88 | K&K1990 Table XII |
| Speed quotient | SQ | % | 200 | 100 | 500 | LF only (SS=3) | K&K1990 Table XII |
| Spectral tilt | TL | dB @3 kHz | 0 | 0 | 41 | LF (→ta/Fa) & tilt LP | K&K1990 Table XII |
| Flutter | FL | % | 0 | 0 | 100 | F0 perturbation | K&K1990 Eq. 1, Table XII |
| Diplophonia | DI | % | 0 | 0 | 100 | alternate-pulse perturb | K&K1990 §3, Table XII |
| Voicing amplitude | AV | dB | 60 | 0 | 80 | sets Ee / level | K&K1990 Table XII |
| Aspiration | AH | dB | 0 | 0 | 80 | breathiness (interacts) | K&K1990 Table XII |
| Source switch | SS | — | 2 | 1 | 3 | selects LF when =3 | K&K1990 Table XI |
| Tracheal pole freq | FTP | Hz | 2150 | 300 | 3000 | subglottal coupling | K&K1990 Table XII |
| Tracheal pole BW | BTP | Hz | 180 | 40 | 1000 | subglottal coupling | K&K1990 Table XII |
| Tracheal zero freq | FTZ | Hz | 2150 | 300 | 3000 | subglottal coupling | K&K1990 Table XII |
| Tracheal zero BW | BTZ | Hz | 180 | 40 | 2000 | subglottal coupling | K&K1990 Table XII |
| Tracheal parallel amp | ATV | dB | 0 | 0 | 80 | parallel tracheal formant | K&K1990 Table XII |

Internal LF quantities (derived, not user params): tp, te, ta, ωg, α, ε, E0, Ee, Ei,
Fg=1/(2tp), Fa=1/(2πta), Rg, Rk, Ra, Rd, αm — see §1, citations Fant 1985 / 1988 / 1997,
Doval 2003.

Key conversion formulas, one place:
```
# Klatt → LF timing
T0 = 1/F0 ;  te = (OQ/100)·T0 ;  Rk = 100/SQ ;  tp = te/(1+Rk) ;  ta = Ra·T0
ωg = π/tp ;  ε from  ε·ta = 1 − e^(−ε(T0−te)) ;  α from area balance (§1.3)
# R-params
Rg = (1+Rk)/(2·OQ_frac) ;  Ra = ta/T0
Rd = (1/0.11)(0.5+1.2 Rk)(Rk/(4 Rg) + Ra)
# Rd → Klatt
Ra=(−1+4.8 Rd)/100 ; Rk=(22.4+11.8 Rd)/100 ;
Rg=Rk/(4(0.11 Rd/(0.5+1.2 Rk)−Ra)) ; SQ=100/Rk ; OQ=100(1+Rk)/(2 Rg) ; ta=Ra·T0
```

---

## 6. AMBIGUITIES & PAPER-vs-SHIPPED-CODE RECONCILIATION FLAGS

**The big one — three of these four features are NOT in the shipped klsyn88 C.** Per
`notes/klsyn88-fidelity-reference-signalpath.md`, the published `parwv.c` implements
sources ss=1 (impulsive), ss=2 (KLGLOTT88 natural, default), ss=3 (**triangular**, not
LF), else square — and the driver clamps `ss` to max 2 (signalpath §8 param table: ss
min 1 / max 2). Consequences for "fidelity":

1. **LF source (SS=3) is absent from the shipped C.** The 1990 paper's SS=3 = "modified
   LF model"; the shipped code's ss=3 = triangular source (and unreachable via the driver
   anyway, and reads an out-of-range asymmetry param — signalpath §0). **There is no
   reference C waveform to bit-match for the LF source.** Match it against Fant
   1985/1988/1997 math (this spec) and the KLSYN88 *manual* (parallel reader), not parwv.c.

2. **SQ has no effect in the shipped C.** SQ only parameterizes the LF source. With no LF
   source compiled in, `sq` is inert. So the SQ default (200 %) and range come from the
   paper/manual only.

3. **Flutter (FL) is absent from the shipped C.** signalpath §2.8 / §9.13: "No flutter,
   no random jitter, no shimmer is implemented... the only period perturbation is the
   deterministic alternating skew." Implement Eq. 1 from the paper; there is no C oracle.

4. **Diplophonia: paper ≠ shipped C.** The paper's DI both *delays* and *attenuates*
   alternate pulses (§3 above). The shipped C implements only the **delay** half, as
   `skew`/`Kskew` (param `sk`): a deterministic alternating change to the closed-phase
   length, sign-flipped each period (signalpath §2.8). **No amplitude attenuation of the
   alternate pulse exists in parwv.c.** Also note the control surface differs: shipped
   `sk` is a raw skew count (0–100), not the paper's DI percentage with its
   `delay=(DI/100)·closed_phase` and `amp=1−DI/100` laws. Decide explicitly whether to
   target the paper (full DI) or the shipped C (delay-only skew).

5. **Tracheal pole-zero is absent from the shipped C cascade.** signalpath §4 lists the
   cascade as nasal-zero → nasal-pole → F8..F1 only; there is no FTP/FTZ/BTP/BTZ in the
   reverse-engineered DSP, and the 42 live params (signalpath §8) contain no tracheal
   entries. The tracheal pair is a paper/manual feature; model it on the nasal pole/zero
   primitives (§4.2).

**Genuine math ambiguities (paper underspecified; resolve against the manual):**

6. **OQ definition for the LF path: reduced vs complete.** Fant gives two OQs —
   `OQi = Te/T0` (the "Klatt definition", reduced) and `Qo = (Te+Ta)/T0` (complete). I
   mapped `te = OQ·T0` (reduced). If the manual means the complete OQ, use
   `te = OQ·T0 − ta`. This shifts te by ta (sub-ms) — small but real for breathy ta.

7. **SQ definition.** I used the classical speed quotient `SQ = tp/(te−tp)` (opening:
   closing within the open phase), giving `Rk = 100/SQ`. The paper/notes never write the
   SQ↔timing formula; a minority of sources define speed quotient on the *flow* peak vs
   on T0. Confirm against the manual that SQ is opening/closing of the open phase.

8. **SQ default (200 %) vs Rd defaults are inconsistent.** Fant's Rd-defaulted Rk grows
   with Rd (Rk=(22.4+11.8Rd)/100), so the implied SQ ranges ~290–390 % across modal Rd,
   *not* 200 %. So you cannot simultaneously honor Klatt's SQ=200 % default and Fant's Rd
   default covariation. Pick one as authoritative (likely: SQ=200 % is Klatt's UI default;
   use Fant's covariation only when driving from Rd).

9. **Flutter ordering vs declination.** Eq. 1 says Δf0 is added to F0 but not whether to
   the pre- or post-declination contour. I assumed post (additive on the final F0 track).
   Low stakes (declination is slow, flutter is a small perturbation) but state it.

10. **`ta`/TL coupling for the LF source.** The LF return-phase tilt (Fa=1/(2πta)) and
    Klatt's separate TL one-pole tilt filter (signalpath §3.6, `lineartilt[]`) are two
    different tilt mechanisms. With the LF source you can express tilt *either* via ta
    *or* via the TL post-filter; doing both double-counts. Decide whether SS=3 drives
    tilt through ta (set ta from TL) or keeps the TL post-filter and uses a fixed modal
    ta. The paper does not say.

11. **α has no closed form.** Area-balance α (§1.3) needs Newton iteration; document the
    seed and tolerance you choose so the source is reproducible across platforms.
