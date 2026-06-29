# KLSYN88 Ground-Truth Signal Path — Fidelity Conformance Spec

Reverse-engineered from Dennis Klatt's published C reference source. This is the
DSP that a WebAudio reimplementation must match exactly.

Source files (all under `C:\Users\Q\src\klsyn\c\`):
- `parwv.c` — synthesis core (the published klsyn88 DSP). 1393 lines.
- `parwvt.h` — parameter tables, struct fields, B0/amptable tables.
- `klsyn.h` — driver constants, the 49-param symbol/min/max/default tables.
- `klsyn.c` — driver/main: how params reach `parwav()`, frame assembly, interpolation.

Header banner: `parwv.c:7` "Copyright 1982 by Dennis H. Klatt … Modified version of
synthesizer described in J. Acoust. Soc. Am., Mar. 1980. -- new voicing source."
Driver version string `klsyn.c:63`: "KLSYN Version 1.5 D.H. Klatt 28-Mar-86",
`klsyn.c:64`: "KLSYN13 Update Keith Johnson 12-Nov-13".

---

## 0. VERSIONS / VARIANTS (Q's "all the versions")

There is **one** C DSP file (`parwv.c`); variants are expressed at runtime and in the
edit-history comments, not as separate files.

**Runtime-selectable source variants** (`spkrdef[5]` = `glsource`, `parwv.c:331`,
`parwvt.h` SOURCE_SELECT). Constants at `parwv.c:54-56`:
- `IMPULSIVE = 1` → `impulsive_source()` (`parwv.c:494`)
- `NATURAL = 2` → `natural_source()` (`parwv.c:520`) — **this is the KLGLOTT88 polynomial source; default**
- `TRIANGULAR = 3` → `triangular_source()` (`parwv.c:547`)
- anything else → `square_source()` (`parwv.c:569`)

**Cascade/parallel config constants** `parwvt.h:269-270`: `CASCADE_PARALLEL=1`,
`ALL_PARALLEL=2` are *defined but not referenced* in this build; routing is instead
controlled by `nfcascade` (`spkrdef[4]`) and unconditional parallel mixing (see §4).

**Edit history** (revision evolution) is preserved as comments:
- `parwv.c:16-43` — DSP edit log 000001 (10-Mar-83) through 000017 (14-Oct-87,
  "convert to 16 bit integers for PC version"). Notable entries: 000013 "Add G0 code",
  000014 "linearize TLTdb, no -> oq", 000016 "Add triangular glottal source (ss=2)
  with param assym", 000008 "Add simple impulsive glottal source option".
- `klsyn.c:10-54` — driver edit log 000001 (10-Mar-83) through 000033 (12-mar-96,
  "convert back to 32 bit architecture, for sun sparc").

So the lineage is: Klatt 1980 JASA → 1982/83 "new voicing source" KLGLOTT88 →
PC 16-bit port (1987) → Sun/32-bit (1996) → Sprouse Python wrapper (2013, `README.md`).

**Latent variant bug — `as`/assym parameter (`parwv.c:379`):** `as = pars[42]` reads
the *triangular pulse asymmetry*. But only 42 variable params exist (pars[0..41]; see
§8), so `pars[42]` is **out of range / undefined** in this build. The triangular source
(ss=3) therefore reads garbage asymmetry. The triangular and square sources are
effectively unmaintained variants; **NATURAL (ss=2, KLGLOTT88) is the canonical path.**

---

## 1. TOP-LEVEL EXECUTION ORDER

Driver `synthesize()` (`klsyn.c:559`): allocates `iwave[nframes*NSAMP_PER_FRAME]`
(`klsyn.c:566,569`), then for each frame copies the compacted variable params into
`pars[]` (`klsyn.c:581-585`) and calls `parwav(&iwave[nsamtot])` (`klsyn.c:588`).

`parwav()` (`parwv.c:77`) per frame:
1. `gethost()` — load `pars[]`→named vars, convert dB→linear, set all resonator
   coefficients (`parwv.c:80`, body `parwv.c:317-482`).
2. For each output sample `ns` in `0..nspfr-1` (`parwv.c:83`):
   a. `gen_noise()` → `noise`, `nrand` (`parwv.c:86`)
   b. noise amplitude modulation (`parwv.c:92-94`)
   c. `frics = amp_frica * noise` (`parwv.c:97`)
   d. 4× oversampled glottal loop `n4=0..3` (`parwv.c:103-157`): source sample →
      pitch-synch F1/B1 → period reset → `resonlp()` downsample LP
   e. spectral tilt one-pole (`parwv.c:161-162`)
   f. breathiness add (`parwv.c:166-170`)
   g. `glotout = amp_voice*voice`; `par_glotout = par_amp_voice*voice` (`parwv.c:173-174`)
   h. aspiration add (`parwv.c:177-179`)
   i. cascade branch: nasal zero, nasal pole, F8..F1 (`parwv.c:184-251`)
   j. parallel branch: F1p, NPp, then F6p..F2p, bypass (`parwv.c:253-295`)
   k. final gain, getmax, truncate, **negate**, store (`parwv.c:297-299`)

**Frame interpolation:** none inside `parwav()`. Within a frame all params are
**step-held** constant (except F1/B1, which update pitch-synchronously inside the
glottal loop). Control-point interpolation is **linear** and done on the frame grid by
`fill_frames()` (`klsyn.c:648-669`, `val = val1 + dval*(nf-nf1)/dnf`). Frame grid
resolution = `ms_frame` (param `ui`, default 5 ms).

---

## 2. GLOTTAL SOURCE

### 2.1 KLGLOTT88 natural source (ss=2, default) — `natural_source()` `parwv.c:520-534`
```c
float natural_source(void) {
    if (nper < nopen) {        /* glottis open */
        a -= b;
        vwave += a;
        return(vwave * 0.03);
    }
    else {                     /* glottis closed */
        vwave = 0.;
        return(0.);
    }
}
```
This is the **differentiated** glottal flow polynomial. Per the derivation in
`parwvt.h:273-298`: assume `V(t)=k1 t^2 - k2 t^3`; folding in the radiation derivative
gives `dV/dt = vwave[n] = sum_{i=1..n}(a - i*b) = a*n - (b/2)*n^2`. So each open-phase
sample subtracts `b` from `a` then accumulates `a` into `vwave` — a discrete double
integration producing the cubic-derivative pulse.

Shape constants reset each period in `pitch_synch_par_reset()` (`parwv.c:632-634`):
```c
b = B0[nopen-40];
a = (b * nopen) * .333;     /* a = b*nopen/3  → zero net DC flow */
```
`B0[]` table (`parwvt.h:299-345`), `B0[nopen-40] = 1920000/(nopen*nopen)` (comment
`parwvt.h:297`); `B0[0]=1200` for nopen=40 (1920000/1600=1200 ✓). Range
40 ≤ nopen ≤ 263 (table length 224).

The `*0.03` is a fixed source scale on the open-phase output.

### 2.2 Impulsive source (ss=1) — `impulsive_source()` `parwv.c:494-507`
```c
static float doublet[] = { 0., 13000000., -13000000. };
float impulsive_source(void) {
    if (nper < 3)  vwave = doublet[nper];
    else           vwave = 0.;
    resonglot();          /* critically-damped 2nd-order LP, tc ∝ Kopen */
    return(rgl_1);
}
```
A 3-sample differentiated doublet, then `resonglot()` (`parwv.c:885-897`) low-passes it.
`resonglot` coeffs `rgla,rglb,rglc` set in `pitch_synch_par_reset()` `parwv.c:636-641`:
```c
temp = samrate / nopen;
setabc(0,temp,&rgla,&rglb,&rglc);
temp1 = nopen *.00833;
rgla *= temp1 * temp1;     /* keep gain at F1 ~constant */
```

### 2.3 Triangular source (ss=3) — `triangular_source()` `parwv.c:547-566`
Two-slope triangle in the open phase, clamped at `maxt1`/`maxt2`. Leg geometry set in
`pitch_synch_par_reset()` `parwv.c:644-661`: `assym=(nopen*(as-50))/100`,
`nfirsthalf=(nopen>>1)+assym`, `Afinal=-7000`, `slopet2=Afinal/nsecondhalf`, etc.
**Reads `as=pars[42]` which is OOB (see §0) — variant is unreliable.**

### 2.4 Square source (else) — `square_source()` `parwv.c:569-581`
`vwave=-1750` while open (`nper<nopen`), `+1750` while closed.

### 2.5 4× oversampling + downsample LP — `parwv.c:103-157`, `resonlp()` `parwv.c:902-915`
The glottal source runs at `4*samrate` (loop `n4=0..3`, `parwv.c:103`) "to minimize
quantization noise in period of female voice" (`parwv.c:100-101`). Each oversampled
sample is low-passed by `resonlp()` (a 2-pole resonator at f=FLPhz, bw=BLPhz). After
the 4 sub-samples, `voice` holds the downsampled value.
```c
void resonlp(void){            /* in=voice, out=voice */
    temp4 = rlpc*rlp_2; rlp_2=rlp_1;
    temp3 = rlpb*rlp_1; temp4+=temp3;
    temp3 = rlpa*voice; rlp_1=temp4+temp3;
    voice = rlp_1;
}
```
LP cutoff/bw: `gethost()` `parwv.c:333-334`:
`FLPhz = 950*(samrate/10000)`, `BLPhz = 630*(samrate/10000)`.
**Integer-division caveat:** `samrate/10000` is integer; for samrate=11025 it equals 1,
so FLPhz=950, BLPhz=630 for any rate in [10000,19999). (Comment at `parwv.c:152` says
"f=.09*samrate, bw=.06*samrate" — the actual code uses the integer-scaled fixed values.)

### 2.6 Period timing / F0 — `pitch_synch_par_reset()` `parwv.c:595-596`
```c
T0 = 40 * ((float)samrate / (F0hz*10));   /* period in 4×samrate samples */
```
For F0=100, samrate=11025: T0 = 40*(11025/1000) = 441 quarter-samples ≈ 110 output
samples = 11025/100 ✓. Period reset at `parwv.c:146-149`: when `nper>=T0`, set `nper=0`
and call `pitch_synch_par_reset()`. `nper++` each oversampled tick (`parwv.c:156`).

### 2.7 Open phase / open quotient (oq) — `parwv.c:608-630`
```c
nopen = T0*((float)Kopen/100);        /* Kopen = open quotient in % of T0 */
if ((glsource==IMPULSIVE)&&(nopen>263)) nopen=263;
if ((glsource==NATURAL)&&(nopen>263)) { ...warning...; nopen=263; }
if (nopen >= (T0-1)) nopen = T0-2;    /* clamp */
if (nopen < 40)      nopen = 40;      /* F0 max = 1000 Hz */
```
`Kopen` = param `oq` (pars[19], `parwv.c:378`).

### 2.8 Skew (diplophonia / alternating-period jitter) — `parwv.c:663-680`
```c
temp = T0 - nopen;
if (Kskew > temp) Kskew = temp;       /* truncate to closed phase */
if (skew >= 0) skew = Kskew; else skew = -Kskew;
T0 = T0 + skew;                       /* add skew to closed portion */
skew = - skew;                        /* alternate sign each period */
```
`Kskew` = param `sk` (pars[23]). This produces period-to-period (diplophonic) length
alternation. **No flutter, no random jitter, no shimmer** is implemented in this source
— the only period perturbation is this deterministic alternating `skew`. (Flutter as in
Klatt 1990 is absent here.)

### 2.9 AV (voicing amplitude) conversion chain
- `gethost()` `parwv.c:347-348`: `AVdb = pars[1] - 7; if (AVdb<0) AVdb=0;` (the **AV−7** offset)
- `pitch_synch_par_reset()` `parwv.c:597`: `amp_voice = DBtoLIN(AVdb);`
- apply `parwv.c:173`: `glotout = amp_voice * voice;`
- `DBtoLIN(dB)` `parwv.c:867-875`: `return amptable[dB] * .001;` (amptable in `parwvt.h:360-379`,
  87 dB→32767, 1 dB ≈ 0.5^(1/6) step; so DBtoLIN(87)=32.767).

There is **no ×0.05 on voicing** — the ×0.05 is the aspiration scale (§3). The voicing
source has a fixed `×0.03` inside `natural_source()` instead.

Parallel voicing amplitude: `gethost()` `parwv.c:387-388`:
`AVpdb = pars[38]; par_amp_voice = DBtoLIN(AVpdb);` applied `parwv.c:174`
`par_glotout = par_amp_voice * voice;` (no ×0.03 — that lives in the source return).

### 2.10 G0 / master gain chain — `gethost()` `parwv.c:420-424`, apply `parwv.c:297`
```c
Gain0 = pars[39] - 3;                  /* the G0−3 offset */
if (Gain0 <= 0) Gain0 = 57;            /* default if non-positive */
amp_gain0 = DBtoLIN(Gain0);
...
ltemp = out * amp_gain0;               /* final scale */
```

---

## 3. ASPIRATION (AH/ap) AND FRICATION (AF/af) NOISE

### 3.1 Noise generator — `gen_noise()` `parwv.c:844-854`
```c
nrand = (rand()>>17) - 8192;           /* nominally -8192..+8191 */
noise = nrand + (0.75 * nlast);        /* one-pole LP, pole near z-origin */
nlast = noise;
```
**Platform caveat for fidelity:** `rand()>>17` assumes a 31-bit `RAND_MAX` (≈2^31).
With a 15-bit `RAND_MAX` (32767) the shift yields 0, so `nrand` collapses to a constant
−8192 (DC). A faithful reimplementation must reproduce the 31-bit-`rand()` behavior, not
host `rand()`. Seed: `srand(ranseed)` once in `gethost()` init (`parwv.c:338`),
`ranseed=spkrdef[3]` (default 1).

### 3.2 Noise amplitude modulation — `parwv.c:92-94`
```c
if (nper > nmod) noise *= 0.5;         /* halve noise in semi-closed phase if voiced */
```
`nmod` set `parwv.c:600-602`: `nmod=T0` if voiceless (`AVdb==0`); `nmod=nopen` if voiced
(`AVdb>0`). (Comment `parwv.c:91` flags this is backward for the impulsive source.)
Both `frics` and `aspiration` use the modulated `noise`.

### 3.3 Frication source — `parwv.c:97`, scale `parwv.c:384-385`
```c
amp_frica = DBtoLIN(AF) * 0.25;        /* AF = pars[22] */
frics = amp_frica * noise;
```

### 3.4 Aspiration source — `parwv.c:177-179`, scale `parwv.c:376-377`
```c
amp_aspir = DBtoLIN(AP) * .05;         /* AP = pars[18] */
aspiration = amp_aspir * noise;
glotout += aspiration;                 /* added to cascade source */
par_glotout += aspiration;             /* and to parallel source */
```

### 3.5 Breathiness (Aturb/at) — `parwv.c:166-170`, scale `parwv.c:605-606`
```c
amp_breth = DBtoLIN(Aturb) * 0.1;      /* Aturb = pars[20] */
if (nper < nopen)                      /* open phase only */
    voice += amp_breth * nrand;        /* uses RAW nrand (not LP'd noise) */
```
(Comment `parwv.c:165` flags backward for impulsive source.)

### 3.6 Spectral tilt (TL/tl) — `parwv.c:161-162`, coeff `parwv.c:692-700`
```c
voice = (voice * onemd) + (vlast * decay);   /* one-pole LP on voicing */
vlast = voice;
...
if (TLTdb<0) TLTdb=0; if (TLTdb>34) TLTdb=34;
decay = lineartilt[TLTdb];
onemd = 1. - decay;
```
`lineartilt[35]` table `parwv.c:706-711` (linearized so e.g. 3 dB tilt at 2500 Hz →
decay=.233). `TLTdb=pars[21]`.

---

## 4. CASCADE FORMANT BRANCH — `parwv.c:181-251`

Input is `glotout` (voicing + aspiration). Chain order (each a 2-pole resonator):
1. `resoncnz()` nasal **antiresonator** (zero): in `glotout` → `rnzout` (`parwv.c:184,927-940`)
2. `resoncnp()` nasal pole: in `rnzout` → `rnpc_1` (`parwv.c:186,944-956`)
3. polarity: `casc_next_in = rnpc_1`; if even formant count
   `if ((nfcascade & 07776)==nfcascade) casc_next_in = -rnpc_1;` (`parwv.c:188-190`)
4. `resonc8()`..`resonc1()` gated by `nfcascade >= n` (`parwv.c:192-229`). Output of the
   chain is `r1c_1`, copied to `out` at `parwv.c:251`.

`nfcascade = spkrdef[4]` (default 5). F7/F8 are **fixed**: `setabc(6500,500,...)` for
F7 and `setabc(7500,600,...)` for F8 (`parwv.c:430-431`), intended for samrate≥16 kHz.

### 4.1 Resonator difference equation (all cascade/parallel resonators)
Canonical form, e.g. `resonc1()` `parwv.c:1073-1085`:
```c
temp4 = r1cc * r1c_2;      /* c * out[n-2] */
r1c_2 = r1c_1;
temp3 = r1cb * r1c_1;      /* + b * out[n-1] */
temp4 += temp3;
temp3 = r1ca * casc_next_in;   /* + a * in[n] */
r1c_1 = temp4 + temp3;
```
i.e. **y[n] = a·x[n] + b·y[n-1] + c·y[n-2]**.

### 4.2 Coefficient computation — `setabc()` `parwv.c:758-786`
```c
arg = minus_pi_t * bw;  r = exp(arg);     /* r = exp(-pi*bw/samrate) */
*ccoef = -(r*r);                          /* c = -r^2 */
arg = two_pi_t * f;  *bcoef = r*cos(arg)*2.;  /* b = 2 r cos(2 pi f/samrate) */
*acoef = 1.0 - *bcoef - *ccoef;           /* a = 1 - b - c  (unity DC gain) */
```
with `minus_pi_t = -3.14159/samrate`, `two_pi_t = -2*minus_pi_t = +6.28318/samrate`
(`parwv.c:335-336`). **Resonator coeffs depend on samrate via these two constants.**

### 4.3 Antiresonator — `setzeroabc()` `parwv.c:799-832`
Compute ordinary `a,b,c` as above, then invert:
```c
*acoef = 1.0 / *acoef;
*ccoef *= -*acoef;
*bcoef *= -*acoef;
```
The antiresonator output (`resoncnz`, `parwv.c:927-940`) uses input history:
`y[n] = a·x[n] + b·x[n-1] + c·x[n-2]` (note it stores `rnz_1 = glotout` = the *input*).

### 4.4 Nasal pole/zero params
`FNZhz=pars[14], BNZhz=pars[15]` (zero); `FNPhz=pars[16], BNPhz=pars[17]` (pole)
(`parwv.c:370-374`). Coeffs set `parwv.c:461-462`.

### 4.5 Pitch-synchronous F1/B1 (and F2/F3 compensation)
Cascade F1 (`setR1`, `parwv.c:724-745`) is updated **inside** the glottal loop at glottis
open/close (`parwv.c:108-142`), using `dF1hz=pars[40]`, `dB1hz=pars[41]` increments
during open phase. On a downward F-step, history vars are scaled by `Fnew/Fold` to avoid
transients: F1 in `setR1` `parwv.c:736-742`, F2 `parwv.c:447-451`, F3 `parwv.c:437-441`.

---

## 5. PARALLEL FORMANT BRANCH — `parwv.c:253-295`

Always executed (added to cascade `out`); not mutually exclusive with cascade. Two source
signals:
- `sourc = par_glotout` for F1p and NPp (`parwv.c:255`)
- `sourc = frics + par_glotout - glotlast` for F6p..F2p and bypass — the **first
  difference** of voicing (radiation/differentiation) plus frication (`parwv.c:265-266`).

Mixing:
```c
reson1p();  resonnpp();              /* parwv.c:256-257 (in-source comments are swapped) */
out += rnpp_1 + r1p_1;              /* parwv.c:258, in phase, boost lows for nasalized */

sourc = frics + par_glotout - glotlast; glotlast = par_glotout;  /* parwv.c:265-266 */
reson6p(); out = r6p_1 - out;       /* parwv.c:268-269  alternating sign */
reson5p(); out = r5p_1 - out;       /* parwv.c:271-272 */
reson4p(); out = r4p_1 - out;       /* parwv.c:274-275 */
reson3p(); out = r3p_1 - out;       /* parwv.c:277-278 */
reson2p(); out = r2p_1 - out;       /* parwv.c:280-281 */
outbypas = amp_bypas * sourc;       /* parwv.c:283 */
out = outbypas - out;               /* parwv.c:284 */
```

### 5.1 Parallel amplitude controls (a1..a6, an, ab) and bandwidths (p1..p6)
Set in `gethost()`; the amplitude is folded into the resonator `a` coefficient:
| Param | dB var | linear scale (`parwv.c`) | folded |
|-------|--------|--------------------------|--------|
| A1 (a1) | pars[24] | `amp_parF1 = DBtoLIN(A1)*0.4`  (391) | `r1pa *= amp_parF1` (467) |
| ANP (an)| pars[36] | `amp_parFNP = DBtoLIN(ANP)*0.6` (415)| `rnppa *= amp_parFNP` (469)|
| A2 (a2) | pars[26] | `amp_parF2 = DBtoLIN(A2)*0.15` (395)| `r2pa *= amp_parF2` (471) |
| A3 (a3) | pars[28] | `amp_parF3 = DBtoLIN(A3)*0.06` (399)| `r3pa *= amp_parF3` (473) |
| A4 (a4) | pars[30] | `amp_parF4 = DBtoLIN(A4)*0.04` (403)| `r4pa *= amp_parF4` (475) |
| A5 (a5) | pars[32] | `amp_parF5 = DBtoLIN(A5)*0.022`(407)| `r5pa *= amp_parF5` (477) |
| A6 (a6) | pars[34] | `amp_parF6 = DBtoLIN(A6)*0.03` (411)| `r6pa *= amp_parF6` (479) |
| AB (ab) | pars[37] | `amp_bypas = DBtoLIN(AB)*0.05` (418)| direct (283) |

Parallel resonator freqs/bw: F1 uses (F1hz,B1hz) (`parwv.c:466`); F2..F6 use their F and
the **parallel** bandwidths B2phz..B6phz = pars[27,29,31,33,35] (`parwv.c:470-478`); NPp
uses (FNPhz,BNPhz) (`parwv.c:468`). Note B1phz=pars[25] is read (`parwv.c:392`) but the
parallel F1 resonator is set with cascade B1hz, not B1phz.

---

## 6. RADIATION CHARACTERISTIC / OUTPUT / GAIN / DC

- **Radiation (differentiation):** built into the source for the cascade path (the
  KLGLOTT88 source is already `dV/dt`); for the parallel non-nasal path it is the explicit
  first difference `par_glotout - glotlast` (`parwv.c:265`). There is **no separate output
  differentiator**.
- **`no_rad_char()`** `parwv.c:1219-1229` (only used for debug `outsl<=4`, `parwv.c:245`):
  ```c
  #define ACOEF 0.005
  #define BCOEF (1.0 - ACOEF)
  out = (ACOEF*in) + (BCOEF*lastin); lastin = out; out = -100.*out;
  ```
  a leaky integrator (DC-removal) used only to visualize source waveforms; **not in the
  normal audio path.** There is no DC-blocker on the main output.
- **Final gain & write** `parwv.c:297-299`:
  ```c
  ltemp = out * amp_gain0;          /* amp_gain0 = DBtoLIN(Gain0) */
  getmax(ltemp, &sigmx);            /* track abs max for overload report */
  *jwave++ = parwv_truncate(-ltemp);/* NOTE: output is NEGATED */
  ```
  The output sample is **negated** (polarity inversion) before truncation.
- **Truncate** `parwv_truncate()` `parwv.c:1291-1306`: clamp to int16 [-32768,32767],
  `overload_warning()` on clip (`parwv.c:1308`).
- **AGC:** none inside the DSP. Optional offline auto-gain (`-g`) in the driver
  (`klsyn.c:214-227`) re-synthesizes once, adjusting `g0` from measured peak `sigmx`.
- `outsl`/`os` (spkrdef[0]) taps internal signals for debugging (`parwv.c:231-250` and
  `286-295`): 1=voice,2=aspiration,3=frics,4=glotout*2,5=par_glotout,6=rnzout,…,
  12=r1c_1,13..20 parallel taps,20=outbypas.

---

## 7. SAMPLE RATE / FRAME / DURATION

- `samrate = spkrdef[1]` (param `sr`, default **11025**, `klsyn.c:54,99-106`,
  `klsyn.h:54`). Coeffs depend on it via `minus_pi_t/two_pi_t` (§4.2) and the glottal
  LP cutoffs (§2.5).
- `nspfr = spkrdef[2]` = samples per frame. Driver `setlimits()` `klsyn.c:266`:
  `NSAMP_PER_FRAME = ms_frame * (SAMRAT/1000)` — **integer division**, wrong for
  non-1000-divisible rates (comment `klsyn.c:264-265`). Default ui=5 ms, sr=11025 →
  5*(11025/1000)=5*11=55 (matches `klsyn.c:102`).
- `ui` (ms_frame, param idx 4, default 5), `du` (totdur, param idx 2, default 100 ms).
  `nframes = (totdur+ms_frame-1)/ms_frame` (`klsyn.c:267`).
- **Within-frame interpolation: NONE** (step-hold). Per-control-point interpolation is
  linear on the frame grid (`fill_frames`, §1). F1/B1 are the only intra-frame-varying
  params (pitch-synchronous).
- Glottal source internally runs at **4×samrate** (§2.5).

---

## 8. PARAMETER LIST (49 declared, 42 reach `parwav`)

The driver declares 49 params (`klsyn.h:8 NPAR=49`). 2-char names from
`symb1`/`symb2` (`klsyn.h:25-35`), constant/variable from `cv[]` (`klsyn.h:38-40`),
min/max/default from `maxval`/`minval`/`cdefval` (`klsyn.h:43-56`).

**FIXED params (cv=='C', 7 total): indices 0,1,2,3,4,5,45.** These are skipped when
compacting into `pars[]` (`klsyn.c:581-585`), so only **42 variable params** populate
`pars[0..41]`.

Full table (idx = declared index; pars[] = compacted index seen by `gethost`):

| idx | name | role | default | min | max | category |
|----:|------|------|--------:|----:|----:|----------|
| 0 | sr | sample rate (FIXED→spkrdef[1]) | 11025 | 5000 | 22050 | config |
| 1 | nf | # cascade formants (FIXED→spkrdef[4]) | 5 | 1 | 8 | config |
| 2 | du | duration ms (FIXED) | 500* | 30 | 5000 | config |
| 3 | ss | source select (FIXED→spkrdef[5]) | 2 | 1 | 2 | config |
| 4 | ui | frame interval ms (FIXED) | 5 | 1 | 20 | config |
| 5 | rs | random seed (FIXED→spkrdef[3]) | 1 | 1 | 99 | config |
| 6 | f0 | F0 ×10? (pars[0]) | 100 | 50 | 500 | freq |
| 7 | av | AV voicing dB (pars[1], −7 offset) | 60 | 0 | 80 | **amp** |
| 8 | F1 | F1 Hz (pars[2]) | 350 | 180 | 1300 | freq |
| 9 | b1 | B1 Hz (pars[3]) | 60 | 30 | 1000 | bw |
| 10 | F2 | F2 Hz (pars[4]) | 850 | 550 | 3000 | freq |
| 11 | b2 | B2 Hz (pars[5]) | 70 | 40 | 1000 | bw |
| 12 | F3 | F3 Hz (pars[6]) | 2500 | 1200 | 4800 | freq |
| 13 | b3 | B3 Hz (pars[7]) | 150 | 60 | 1000 | bw |
| 14 | F4 | F4 Hz (pars[8]) | 3250 | 2400 | 4990 | freq |
| 15 | b4 | B4 Hz (pars[9]) | 200 | 100 | 1000 | bw |
| 16 | F5 | F5 Hz (pars[10]) | 3700 | 3000 | 4990 | freq |
| 17 | b5 | B5 Hz (pars[11]) | 200 | 100 | 1500 | bw |
| 18 | F6 | F6 Hz (pars[12]) | 4990 | 3000 | 4990 | freq |
| 19 | b6 | B6 Hz (pars[13]) | 500 | 100 | 4000 | bw |
| 20 | fz | nasal zero F (pars[14]) | 280 | 180 | 800 | freq |
| 21 | bz | nasal zero BW (pars[15]) | 90 | 40 | 1000 | bw |
| 22 | fp | nasal pole F (pars[16]) | 280 | 180 | 500 | freq |
| 23 | bp | nasal pole BW (pars[17]) | 90 | 40 | 1000 | bw |
| 24 | ah | aspiration AP dB (pars[18]) | 0 | 0 | 80 | **amp** |
| 25 | oq | open quotient % (Kopen, pars[19]) | 50 | 10 | 100 | source |
| 26 | at | breathiness Aturb dB (pars[20]) | 0 | 0 | 80 | **amp** |
| 27 | tl | spectral tilt dB (TLTdb, pars[21]) | 0 | 0 | 34 | source |
| 28 | af | frication AF dB (pars[22]) | 0 | 0 | 80 | **amp** |
| 29 | sk | skew (Kskew, pars[23]) | 0 | 0 | 100 | source |
| 30 | a1 | parallel F1 amp dB (pars[24]) | 0 | 0 | 80 | **amp** |
| 31 | p1 | parallel B1 Hz (B1phz, pars[25]) | 80 | 30 | 1000 | bw |
| 32 | a2 | parallel F2 amp dB (pars[26]) | 0 | 0 | 80 | **amp** |
| 33 | p2 | parallel B2 Hz (B2phz, pars[27]) | 200 | 40 | 1000 | bw |
| 34 | a3 | parallel F3 amp dB (pars[28]) | 0 | 0 | 80 | **amp** |
| 35 | p3 | parallel B3 Hz (B3phz, pars[29]) | 350 | 60 | 1000 | bw |
| 36 | a4 | parallel F4 amp dB (pars[30]) | 0 | 0 | 80 | **amp** |
| 37 | p4 | parallel B4 Hz (B4phz, pars[31]) | 500 | 100 | 1000 | bw |
| 38 | a5 | parallel F5 amp dB (pars[32]) | 0 | 0 | 80 | **amp** |
| 39 | p5 | parallel B5 Hz (B5phz, pars[33]) | 600 | 100 | 1500 | bw |
| 40 | a6 | parallel F6 amp dB (pars[34]) | 0 | 0 | 80 | **amp** |
| 41 | p6 | parallel B6 Hz (B6phz, pars[35]) | 800 | 100 | 4000 | bw |
| 42 | an | parallel nasal amp dB (ANP, pars[36]) | 0 | 0 | 80 | **amp** |
| 43 | ab | bypass amp dB (AB, pars[37]) | 0 | 0 | 80 | **amp** |
| 44 | ap | parallel voicing amp dB (AVpdb, pars[38]) | 0 | 0 | 80 | **amp** |
| 45 | os | output select (FIXED→spkrdef[0]) | 0 | 0 | 20 | config |
| 46 | g0 | overall gain dB (Gain0, pars[39], −3 offset) | 60 | 0 | 400 | **amp** |
| 47 | dF | F1 increment during open phase (dF1hz, pars[40]) | 0 | 0 | 100 | freq |
| 48 | db | B1 increment during open phase (dB1hz, pars[41]) | 0 | 0 | 80 | bw |

\* `du` default differs between tables: `cdefval[2]=500` (`klsyn.h:54`) vs the typical
demo files; min/max from `klsyn.h:43-51`. Values above transcribed from
`maxval`/`minval`/`cdefval` arrays in declared-index order.

Conversion (`gethost`): AV uses `−7` offset then `DBtoLIN`; G0 uses `−3` offset; all
other dB amps go straight through `DBtoLIN` (×amptable×.001) times the per-formant scale.
`as`/assymetry is **read at pars[42] which does not exist** (only 42 vars, max index 41)
— latent OOB (see §0).

---

## 9. CONFORMANCE-CRITICAL DETAILS (must reproduce exactly)

1. Output is **negated** at write (`parwv.c:299`).
2. Cascade polarity flips for even formant count (`parwv.c:190`).
3. Parallel formants summed with **alternating subtraction**, then bypass subtracted
   (`parwv.c:269-284`).
4. 4× glottal oversampling + 2-pole downsample LP (`parwv.c:103-157`).
5. AV−7 and G0−3 offsets; amptable (`parwvt.h:360-379`); per-formant linear scales (§5.1).
6. KLGLOTT88 double-accumulator polynomial with B0 table and a=b·nopen/3, return ×0.03
   (`parwv.c:520-534`, `parwv.c:632-634`).
7. `rand()>>17` 31-bit assumption; one-pole noise LP `noise = nrand + 0.75·nlast`
   (`parwv.c:846-853`).
8. Noise halved in semi-closed phase (`parwv.c:92-94`); breathiness uses raw `nrand`
   (`parwv.c:169`).
9. Spectral tilt via `lineartilt[]` one-pole (`parwv.c:161-162,706-711`).
10. Resonator: y=a·x+b·y₁+c·y₂; a=1−b−c; b=2r·cos(2πf/sr); c=−r²; r=exp(−πbw/sr)
    (`parwv.c:758-786`). Antiresonator inverts a and uses input history (`parwv.c:799-832`).
11. Pitch-synchronous F1/B1 (and F2/F3 history compensation on downward steps)
    (`parwv.c:108-142,437-451,724-745`).
12. Step-hold params within a frame; linear interpolation only on the frame grid
    (`klsyn.c:648-669`).
13. No flutter / no random jitter / no shimmer — only deterministic alternating `skew`
    (diplophonia) (`parwv.c:663-680`).
14. No output DC-blocker and no online AGC in the DSP (offline `-g` only,
    `klsyn.c:214-227`).
