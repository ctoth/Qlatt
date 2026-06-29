# klsyn88 Fidelity — Divergence Diff (Qlatt port vs published parwv.c)

Session 2026-06-28. Built from the two signal-path specs:
- Reference: notes/klsyn88-fidelity-reference-signalpath.md (parwv.c, KLSYN 1.5 + KLSYN13)
- Qlatt:     notes/klsyn88-fidelity-qlatt-signalpath.md (oversampled-glottal-source port)

## HEADLINE
Qlatt's klsyn88 is **already a faithful port** of parwv.c. Every excitation-gain
scalar matches EXACTLY (asp×0.05, fric×0.25, breath×0.1, a1×0.4, a2×0.15, a3×0.06,
a4×0.04, a5×0.022, a6×0.03, an×0.6, ab×0.05), as do AV−7, G0−3/default-57, the
KLGLOTT88 polynomial (vwave+=a; ×0.03; B0[nopen−40]; a=b·nopen/3), output negation,
even-formant cascade polarity flip, resonator setabc coeffs, F7/F8 fixed values,
noise LP (0.75·nlast), noise halving (nper>nmod), breathiness on raw nrand.
The remaining work is mostly **fixing the verification instrument**, plus a few
small confirm-by-waveform items.

## CRITICAL INSTRUMENT DEFECT
### O1 — Oracle RNG is 15-bit → noise = constant DC (VERIFIED 2026-06-28)
parwv.c gen_noise: `nrand = (rand()>>17) - 8192` assumes 31-bit RAND_MAX. Our
oracle was built with MinGW gcc where **RAND_MAX=32767** (proved with tmp/rngtest:
all 10 draws give (rand()>>17)-8192 = -8192). So the oracle's aspiration, frication,
AND breathiness collapse to DC — the oracle has NO turbulent noise. Every prior
oracle comparison on a phrase with fricatives is therefore invalid on the noise
channel. The authentic published klsyn88 ran on 31-bit rand() (VAX/Sun); the >>17
was designed for that. **Qlatt's 31-bit LCG is closer to the published intent than
our oracle binary.**
- FIX: patch the oracle's gen_noise to use a 31-bit RNG. To enable SAMPLE-LEVEL
  conformance, use the SAME LCG Qlatt uses (state=state*1103515245+12345 &0x7fffffff,
  then >>17) with the same seed — then voiceless/fricative segments can match
  sample-for-sample (subject to identical draw count/order). Rebuild oracle.exe.

### O1 STATUS 2026-06-28: PATCHED (rebuild pending)
Edited `scripts/oracle/klsyn88-c/parwv.c` (a COPY; ~/src/klsyn untouched):
- added `klsyn_rng_state` + `klsyn_rand31()` (31-bit LCG = Qlatt's
  state*1103515245+12345 &0x7fffffff, advance-then-return) after the externs.
- `srand(ranseed)` → `klsyn_rng_state = (unsigned int)ranseed`.
- `nrand = (rand()>>17)-8192` → `(klsyn_rand31()>>17)-8192`.
NEXT: rebuild `gcc -std=gnu89 -O2 -w -o klsyn-oracle.exe klsyn.c parwv.c -lm`, then
render a noise-heavy input (e.g. /s/ AF-only, AV=0) and confirm output is no longer
DC (RMS > 0, spectrum white-ish). Then re-run compare-klsyn88 on a vowel (no noise)
and a fricative (noise) to get a clean baseline.
NOTE: not guaranteed sample-identical to Qlatt (draw count/order may differ); the
fix guarantees noise is PRESENT and statistically correct. Sample-identity only
matters for voiced (no-RNG) segments anyway.

## Qlatt vs reference — items to verify/align
### Q1 — Sample-rate mismatch in the harness (HIGH)
Qlatt renders 22050 (render-phrase.ts:28); klsyn default 11025; the bridge sets
oracle sr=16000. Resonator coeffs (minus_pi_t/two_pi_t) AND the glottal downsample
LP cutoff depend on samrate. Worse, the LP cutoff has an integer-division quirk:
`FLPhz=950*(samrate/10000)` → 950 at 11025 but 1900 at 22050. For a valid
conformance test BOTH engines must render at the SAME rate. Plan: drive Qlatt with
`--sample-rate 11025` (the klsyn canonical default) and set oracle sr=11025 too.

### Q2 — Frame interpolation: linear-on-grid (ref) vs step (Qlatt) (MED)
Reference step-holds within a frame but LINEAR-interpolates control points onto the
5 ms frame grid (fill_frames, klsyn.c:648-669). Qlatt steps params at event times
(no defaultScheduling: ramp). The bridge already resamples Qlatt's event track to a
uniform grid by step-hold. Need to confirm the bridge's step-hold grid == klsyn's
interpolated grid for the SAME control points, else mid-segment values diverge.

### Q3 — Cascade radiation differentiation: NOT a divergence (RESOLVED)
Scout B flagged "cascade lacks differentiation". Scout A clarifies: the KLGLOTT88
source IS already dV/dt (pre-differentiated), so the cascade path correctly has NO
separate differentiator. Parallel path uses explicit first-difference
(par_glotout − glotlast); Qlatt's `diff` node on the parallel path matches. ✓

### Q4 — Parallel alternating-sign summation (MED, verify by waveform)
Reference telescopes: `out += rnpp+r1p` then `out = r6p−out; out = r5p−out; …;
out = outbypas−out`. Qlatt uses alternating-SIGN gains summed (a2,a4,a6 negative;
a1,a3,a5,an positive; ab positive) into outputSum. The telescoping subtraction is
algebraically a signed sum but the exact sign/scale mapping must be confirmed by
driving a parallel-only render through both and diffing. (Default phrases are
cascade-dominant so this is lower-urgency until we test a fricative/parallel case.)

### Q5 — Proxy layer (Rd/OQ/TL/Ee) (drive raw for the test)
Qlatt frontend adds Rd→Kopen/tilt/Ee proxies + Fant-1997 bandwidth widening
(deltaB1/B2). For an apples-to-apples conformance test, drive Qlatt from RAW klsyn
params (Kopen, TLTdb, AV, ss, B1) so the proxy math is out of the picture. Confirm
the proxies are identity when given canonical inputs.

### Q6 — resonator int rounding (LOW)
plain `resonator` (cascade F4-F8) doesn't round freq/bw; reference pars are ints.
Via the .doc bridge both are int, so moot for conformance. Native Qlatt may pass
fractional formant targets — acceptable.

### Q7 — Flutter / paper-vs-source (DECISION for Q)
parwv.c has NO flutter/jitter/shimmer (only deterministic alternating skew). Klatt
1990 PAPER specifies flutter (FL). Qlatt matches the SOURCE (no flutter). Since the
goal is "match the published version" and the released C IS the reference impl, no
flutter is correct. Flag to Q only if he means the paper's spec.

## VERIFICATION PLAN (elevate beyond peak/RMS)
1. Fix oracle RNG (O1), rebuild. 
2. Matched sample rate (Q1): render both at 11025.
3. Drive from raw klsyn params (Q5), simple controlled stimuli first:
   - steady vowel (voicing only) → tests source+cascade+tilt, NO noise.
   - voiceless fricative (AF only, AV=0) → tests frication+parallel+RNG match.
   - aspirated /h/ (AH only) → tests aspiration.
   - then a full phrase.
4. Compare: per-sample diff after lag alignment (xcorr), normalized RMS error,
   and spectral distance (already have Praat measure). Target: voiced segments
   near-identical spectrally; with matched LCG, noise segments sample-close.
5. Any residual → localize to a block via the outsl/os debug taps (parwv.c can emit
   internal signals 1..20) vs Qlatt per-node taps.
