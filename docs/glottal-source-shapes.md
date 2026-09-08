# Glottal source shapes and Doval's five parameters

Select the LF branch (`sourceMode: 1` in klatt80-baseline/qlatt-beauty), then
set `lfMode: 3` for R++ or `lfMode: 4` for Rosenberg C. Modes 0-2 retain their
existing filter behavior; mode 2 still maps to causal LFLM. The klsyn88
experiment deliberately fixes its LF branch to mode 1 via `lfModeVal`.
Mode changes take effect at the next period boundary, along with OQ/Rd/TL.

## Implemented waveforms

R++ uses Veldhuis (1998), Eqs. 2, 5, 9-13, with normalized period T0=1 and
excitation E=1. The open derivative is cubic; its integral equals the negative
return-phase area. The return derivative reaches -1 at Te and zero at T0.
Evaluating the numerator and denominator of Eq. 10 together avoids the infinite
tx in the R+ limit (Eq. 12), without an iterative solve.

The existing Fant (1997) Rd mapping supplies Tp, Te and the exponential return
constant. Positive OQ overrides Te/T0; positive TL overrides the return constant
using the first-order conversion below. Tp is projected to Veldhuis Eq. 13's
upper bound when necessary. Derived Oq is capped at 0.99 to reserve a return
interval (engineering domain guard). The worklet emits a domain-projection
diagnostic once per instance; the runtime records it even without telemetry.

Rosenberg C differentiates the raised-cosine opening and quarter-cosine closing
of Rosenberg (1971), Fig. 3C. With OQ=0 it uses the experiment-I timings
Tp/T0=0.40 and Tn/T0=0.16. Positive OQ scales the total open duration while
preserving Tp/Te=5/7. The derivative is normalized to E=1. It has abrupt
closure (Qa=0); Rd and TL do not change this mode. Both new modes share the
existing period clock, flutter, jitter, shimmer and diplophonia processing.
They directly sample analytic derivatives and do not claim alias-free synthesis
or the speedup measured for Veldhuis's own implementation.

Veldhuis describes close agreement for Rk<0.5 and evaluates perceptual
equivalence, but does not state a numerical waveform-error ceiling. The test
compares against an independently solved analytic LF waveform at matching
T parameters (Rk=0.30, 0.40, 0.49; Te/T0=0.6; Ta/T0=0.04), with RMS/E<0.08.
That threshold is an engineering regression tolerance, **not a published error
bound**. Tests also check zero net integrated derivative, closure amplitude,
the degenerate R+ limit, and Rosenberg's differentiated published flow.

## Mapping to the unified surface

Doval, d'Alessandro & Henrich (2006), Sections 2-4, define
`(T0, E, Oq, alpha_m, Qa)` with
`Te=Oq*T0`, `Tp=alpha_m*Te`, and `Ta=Qa*(1-Oq)*T0`.
Oq=0.3-0.8 is a typical voice range, not a universal validity constraint;
asymmetry validity depends on the selected model and return phase.

| Existing control | Mapping and limitation |
| --- | --- |
| F0 | `T0=1/F0`; rendering rounds the period to whole samples. |
| AV / voiceGain | E scales the derivative. The crate uses E=1; downstream gain includes source calibration and is not a physical flow unit. |
| Rd | Fant (1997) Eq. A1: `Ra=(-1+4.8*Rd)/100`, `Rk=(22.4+11.8*Rd)/100`, `Rg=Rk*(0.5+1.2*Rk)/(0.44*Rd-4*Ra*(0.5+1.2*Rk))`. Then `Oq=(1+Rk)/(2*Rg)`, `alpha_m=1/(1+Rk)`, and approximately `Qa=Ra/(1-Oq)`. |
| OQ | Positive percentage gives `Oq=OQ/100`; zero means derive from Rd (R++/LF) or 0.56 (Rosenberg C). |
| TL | Positive attenuation at 3000 Hz gives `Ta=sqrt(10^(TL/10)-1)/(2*pi*3000)` and `Qa=Ta/((1-Oq)*T0)`, under the first-order low-pass approximation. TL=0 is the existing derive-from-Rd sentinel, not an abrupt-closure request. Rosenberg C ignores TL. |
| RdRef | Reference for downstream leakage/bandwidth and gain compensation; it is not a sixth independent source-shape coordinate. |
| lfMode | Discrete model identity, outside the five continuous parameters. Rosenberg C fixes alpha_m=5/7 and Qa=0; KLGLOTT88 fixes alpha_m=2/3. |
| openPhaseRatio | Duty control for the separate impulse source. It is not an independent LF asymmetry or return-phase control. |

The TL conversion follows Doval Eq. 18 (`Fa ~= 1/(2*pi*Ta)`) and inversion
of `TL=10*log10(1+(3000/Fa)^2)`. It is not an exact inversion of the existing
discrete-time tilt filter, nor of a truncated LF return phase. In particular,
Veldhuis's exponential time constant and LF's tangent-intercept return time
are only approximately interchangeable when the residual exponential at T0
is small; the comparison oracle explicitly uses Veldhuis's shared return law.

Doval Eqs. 10-16 give `Fg=fg(alpha_m)*F0/Oq` and shape-dependent bandwidth;
for KLGLOTT88, `fg=sqrt(3)/pi`. Eq. 20 gives
`H1-H2=20*log10(abs(Nprime(Oq;alpha_m)/Nprime(2*Oq;alpha_m)))` for the
abrupt-closure generic model. Finite Qa adds return-phase spectral effects.
H1-H2 therefore cannot identify Oq independently of asymmetry/model/tilt.

**Decision:** retain the existing semantics controls and expose only the two
new mode values in this change. A unified five-parameter API needs explicit
model-specific validity, gain calibration, sentinel migration and ownership
of downstream RdRef compensation. Publishing independent Qa and TL, or
independent alpha_m and Rd, now would create conflicting controls. A future
replacement should choose one canonical surface and derive legacy policy
inputs at one cited boundary.

## Sources

- [Veldhuis 1998 notes](../papers/Veldhuis_1998_EfficientLFAlternative/notes.md), Eqs. 2-13; DOI 10.1121/1.421103.
- [Rosenberg 1971 notes](../papers/Rosenberg_1971_EffectGlottalPulseShape/notes.md), Fig. 3C and experiment I.
- [Doval 2006 notes](../papers/Doval_2006_SpectrumGlottalFlowModels/notes.md), five-parameter framework and Eqs. 10-20.
- Fant (1997), Eq. A1, as already implemented in `crates/lf-source/src/lib.rs`.
