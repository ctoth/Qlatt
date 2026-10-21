# Synthesizer model audit

Snapshot: master `77e6e8e3`; partial delivery for #254, following #443/#252.
The manifest contains eight models and one inheritance fixture.
This report separates published evidence, implementation behavior, and unknowns.
It does not certify complete historical fidelity for any model or rename one.
Paths below are repository-relative unless an external source root is stated.

## Evidence and limits

The primary paper pages were read visually after consulting their existing notes:

- Laine (1988), printed p. 34, Fig. 18 and adjacent text:
  `papers/Laine_1988_HigherPoleCorrection/pngs/page-013.png`.
- Steinecke and Herzel (1995), printed p. 1876, Eqs. 3–14 and symmetric-model configuration:
  `papers/Steinecke_Herzel_1995_BifurcationsAsymmetricVocalFold/pngs/page-002.png`.
- Stevens and Bickley (1991), printed p. 163, Section 2:
  `papers/Stevens_1991_HL_Parameters/pngs/page-002.png`.

Local reference source roots inspected for this audit are:

- `C:/Users/Q/src/klatt80/`: `COEWAV.FOR`, coefficient layout in lines 22–37.
- `C:/Users/Q/src/klsyn/`: `c/parwv.c`, dated header and source selection.
- `C:/Users/Q/src/dectalk/463/dapi/src/`: `VTM/vtmiont.c` and `VTM/vtm3.c`.

Those local trees are reference evidence, not vendored or revision-pinned by this
report. Reproducing the comparison requires identifying the same source version.
The observations below are narrower than a complete equation-by-equation audit.
Names, matching parameter spellings, inheritance, and publication years do not
establish acoustic compatibility or an implementation's historical ancestry.

## Model dispositions

| Manifest model | Present disposition | Remaining decision evidence |
| --- | --- | --- |
| klatt80-baseline | Extended Klatt-family implementation | Separate original behavior from later features |
| klsyn88 | Reference-inspired implementation with later LF branch | Date and verify each additional source/control |
| stevens91 | Approximate HL mapping; currently rejected configuration | Resolve inherited definitions from intended topology |
| laine88 | Four-zero HPC variant on the inherited baseline | Bound fidelity beyond the verified worked example |
| steinecke95 | Two-mass-source/tract hybrid | Complete source and coupling equation audit |
| dectalk-english | DECtalk frontend to Klatt-family acoustic adaptation | Explicit control-by-control adapter coverage |
| dectalk-vtm | Packet/VTM port with host adaptation | Bound oracle coverage and host conversion behavior |
| qlatt-beauty | Explicit engineering extension | Verify individual scientific and perceptual claims |

### klatt80-baseline

Implementation: `public/experiments/klatt80-baseline/graph.yaml:126–151`
declares parallel contributions for F9/F10 with engineering-estimate amplitude
limits and separate scale factors. Its pitch-synchronous section at 194–214 binds F0,
OQ, F1, B1, DF1 and DB1. These are actual graph consumers, not just declarations.
The baseline also supplies the higher-pole correction formulas discussed below.

Reference evidence: `COEWAV.FOR:22–37` lays out A1PAR through A6PAR and six
formant coefficient sets in the waveform generator's coefficient storage.
The current ten-formant configuration therefore cannot be identified with that
reference merely because its directory says 1980.

Disposition: retain useful extensions while separating claims about the original
model. Full source waveform, parameter ranges, and numeric equivalence remain
unverified here. This comparison does not prove every current feature is later.

### klsyn88

Implementation: `public/experiments/klsyn88/graph.yaml:14–43` declares the
oversampled source and a separately selectable LF source. The latter binds Rd,
OQ, TL and source-mode controls and explicitly cites Fant 1985 / Klatt 1990.
This is evidence of the current added branch, not of historical KLSYN88 support.

Reference evidence: `c/parwv.c:101–140` selects impulsive, natural, triangular,
or square source functions and performs pitch-synchronous first-formant changes.
Its dated header records triangular-source work in February 1986 and earlier
fixed F7/F8 and pitch-synchronous work. The current square-source branch does not
by itself establish the year that branch was introduced.

Disposition: do not remove triangular source as supposedly nonhistorical.
Record LF and other later controls as extensions pending individual comparison.
Neither the current C filename nor the graph header certifies all source options,
coefficient calculations, units, or ranges as faithful to a single 1988 version.

### stevens91

Published evidence: printed p. 163 describes ten higher-level controls transformed
into roughly forty KL parameters of the existing KLSYN88 synthesizer, with
selected transformations illustrated. It does not establish a new complete
waveform engine or justify every constant in this repository's approximation.
`crates/aerodynamic-model/src/lib.rs:42–52` explicitly describes its mapping as
an HL-to-KL approximation; its constants need separate equation-level review.

Implementation: `public/experiments/stevens91/graph.yaml` gives formants 1–6
parallel sources, while 7–10 are cascade-only. Inherited baseline semantics at
1111–1125 expands `fricA{n}` and `fricA{n}Linear`; their fallback expressions
refer to `A7`–`A10` and `a7Linear`–`a10Linear`, which those banks do not create.
Preparation now rejects the first missing reference with its authored source
at baseline `semantics.yaml:1119`, rather than allocating an invalid graph.

Disposition: unsupported configuration until intended topology and definitions
are reconciled from evidence. Do not invent zero controls or silently prune
definitions. Existing formant-expansion and PLSTEP tests still inspect authored
data independently; they are not evidence that this prepared model can render.

### laine88

Published evidence: printed p. 34 Fig. 18 gives four correction zeros at odd
multiples of 500 Hz, with 1500 Hz bandwidths and a 2000 Hz fourth bandwidth in case (c),
for effective length 17.5 cm. These are correction zeros, not a proof that the
tract must have four formants. A separate five-zero illustration varies length
from 14–21 cm, with first-zero frequencies 417–625 Hz and bandwidths 1.25–1.875 kHz.

Implementation: the child `semantics.yaml:1–11` enables higher-pole correction
and sets NFC to 4. The inherited baseline `semantics.yaml:630–658` computes
35000/(4*length), odd multiples, and 1500/2000*17.5/length bandwidths.
At 17.5 cm these reproduce the cited zero frequencies and bandwidths.
`docs/higher-pole-correction.md` describes the cascade-only correction route;
the inherited graph's hpc sections consume these frequency/bandwidth bindings.

Disposition: retain the documented worked correction variant, clearly separate
from certification of the entire inherited synthesizer. The implementation's
14–21 cm range and inverse-length scaling of 1500 Hz bandwidths match that
five-zero illustration. It does not verify this four-zero variant's B4 scaling
or NFC 4 selection; Table 1 and complete digital response remain unaudited.

### steinecke95

Published evidence: p. 1876 Eqs. 3–14 gives pressure/area forces, Bernoulli flow,
collision gating and symmetric-model masses, stiffnesses, damping and coupling.
`crates/two-mass-source/src/lib.rs:22–59` computes the gated areas, pressure,
forces and collision terms; its flow calculation at 119 uses the minimum area.
The symmetric-model configuration supports those constants and cm/g/ms units.
This is a partial correspondence, not a complete numerical validation.

Implementation: `public/experiments/steinecke95/graph.yaml` combines that source
with a Klatt tract. Its semantics selects sourceMode 3 by default, clamps pressure
to 0–30 cmH2O and asymmetry to 0.4–1, and provides gates bypassing pulse shaping.
The pressure bound is explicitly an engineering bound in that declaration.

Disposition: describe the source/tract hybrid explicitly. Full asymmetry Eq. 38,
the source's 1.4 cm length, integration behavior, and coupling to the downstream
tract remain unverified by the inspected page. Do not imply the whole graph is
the published bifurcation experiment or every exposed range is paper-derived.

### dectalk-english

Implementation: this experiment inherits the baseline and adapts the DECtalk
frontend parameter vocabulary. Its graph at 161/178/195/278 and 561–574 declares
and connects impulse and selectable KLGLOTT routes. Semantics 137 defaults
sourceMode to 0; 217 and 226 gate KLGLOTT at 3 and impulse at 0 respectively.
Those selectors establish the configured fallback. Comments asserting a mode 3
runtime defect have not been verified by a current reproduction in this audit.

`test/frontend-vocabulary-render.test.ts` exercises the selected DECtalk frontend
with this model, rejects its unsupported baseline pairing, and compares audible
control effects for A9/A10 and NFC. The tests' concrete scope does not establish
full DECtalk acoustic equivalence or validate every compatible-looking field.

Disposition: keep the frontend/model adapter distinct from the VTM port below.
Audit each mapped control, source selector, unit and unused compatibility field
before promising interchangeable playback. A shared frontend does not make the
two acoustic implementations equivalent.

### dectalk-vtm

Implementation: the graph has one VTM node with packet-oriented controls.
`src/dectalk-vtm-track.ts` maps packet words, retains packet-code quantities,
and uses 71/11025 seconds per frame; semantics 179–180 forms `round(F0*10.0)`.
`crates/dectalk-vtm/src/backend.rs:293–311` passes the packet through
`try_voice_packet`, then `speech_waveform_generator`; host scheduling and
resampling are additional behavior outside that source call.

Reference evidence: DECtalk `VTM/vtmiont.c:670–695` reads frame packet fields
and 1344–1358 invokes the waveform generator. `VTM/vtm3.c:2397–2413` sets the
71-sample frame in the inspected PC sample-rate branch.
The port's `tests/oracle.rs` checks equal sample lengths and exact samples for
fixture replays; `tests/vtmio_oracle.rs` checks frames and all nine built-in
speaker setups. Extra-corpus replay is conditional on its environment variable.

Disposition: report fixture-specific oracle assertions, not universal waveform
equivalence. Unread Klatt compatibility declarations in the semantics are not
VTM capabilities. Packet encoding and host timing require an explicit adapter;
the waveform oracle alone does not certify host-resampled output.

### qlatt-beauty and the inheritance fixture

Beauty is an intentional engineering extension. Its graph lines 531/607/616 declares
piriform notch, HF air gain and singer-formant paths; lines 803–826 connects those
branches to the output. Semantics lines 476/481 declares explicitly tuned
master and post-limiter output gains, distinct from the feature-branch gains.
These consumers establish implemented features, not the cited papers' perceptual
benefits or complete physical fidelity. Verify those claims individually before
exporting a capability description. No rename or feature removal is proposed.

`test-inherit` is explicitly a manifest inheritance fixture. Its overrides and
loader tests exercise composition; it is not an additional historical model.

## Remaining delivery and migration work

Keep #254 open. This audit establishes bounded classifications, not its complete
parameter/range/pairing inventory. Remaining work is concrete:

1. Compare original Klatt/KLSYN coefficient and source functions with each current
   primitive; record extensions separately without inferring dates from names.
2. Resolve Stevens' inherited definitions against intended topology and primary
   transformations; retain the precise rejection until a coherent repair exists.
3. Trace every proposed frontend/model pairing through actual bindings and unit
   conversions, including unread controls and packet-code versus dB quantities.
4. Complete Laine length, two-mass asymmetry/coupling, and Beauty claim checks;
   correct paper notes only where a primary comparison establishes an error.
5. Use those results for #248 identities, #76 pairing, #82 extraction and #258
   kernel requirements. Naming migration and unsupported-control regressions
   belong with verified dispositions; this report supplies neither silently.
