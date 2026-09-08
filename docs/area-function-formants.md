# Offline formants from vocal-tract geometry

Run from the repository root:

```sh
node --experimental-strip-types scripts/import-story-area-functions.ts
node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/generate-formants-from-area.ts --out data/area-functions/story-1996.generated.yaml --report data/area-functions/story-1996.comparison.md
```

The first command transcribes the corrected Story Table III and Peterson & Barney
Table II notes to cited YAML. The second computes F1–F4 and B1–B4 and reports
signed Hz differences from the selected inventory and adult male P&B means.
Use `--areas` and `--inventory` to select other files. Output paths are required;
the CLI rejects paths that would overwrite its inputs. Invalid geometry, scales,
missing targets and unresolved poles fail with `E_AREA_FORMANTS` and a nonzero exit.

The checked-in comparison is a baseline measurement, not a target-fitting gate.
Story's single MRI subject and P&B's population means need not agree. No P&B F4,
/o/ or /l/ value is invented. The OW comparison is to its static inventory value.

## Acoustic model

`wave-reflection-fant-loss-v1` solves forward and backward pressure waves through
piecewise uniform tubes. The junction reflection coefficient is
`r = (A_left - A_right)/(A_left + A_right)`. Pressure and volume-flow continuity
give the reverse junction transform `(p+ + r p-)/(1+r)` and `(p- + r p+)/(1+r)`.
Each section propagates waves with `exp(±(alpha + i 2πf/c)L)`.

Areas and section length (0.396825 cm) come from Story, Titze & Hoffman (1996),
Table III; sound speed is 35000 cm/s (Sec. III C). The frequency-domain solution
evaluates the same wave network without quantizing a scaled section to an integer
sample delay. It requires no sample rate or runtime DSP.

Loss is Fant (1960), Eq. A.34-23: `alpha = 0.007 sqrt(pi/A)` neper/cm.
The mouth is pressure-release with Fant's inductive end correction `0.8 sqrt(A/pi)`
cm, treated as an extension of the final section with its attenuation. Prescribed
glottal flow corresponds to a closed glottis for the natural resonance problem.
Lossless resonances are bracketed, then continued into the lossy complex-frequency
plane. `F = Re(f)` and `B = 2 Im(f)` follow Fant's `sigma = -π B` pole convention.
This avoids interpreting merged spectral peaks as missing formants.

This is a **reduced** wave-reflection model, not a reproduction of Story's full
simulator. It omits yielding-wall dynamics, separate viscous/thermal losses,
radiation resistance, glottal damping, and piriform/nasal side branches. The
empirical attenuation lumps losses and predicts bandwidths; it is not measured
bandwidth data. In particular /i/ F1 and some bandwidths differ substantially from
the references. Generated values are not automatically installed in a frontend.

## Speaker geometry

The canonical speaker profile declares three neutral (1.0) offline controls:

| Field | Effect |
|---|---|
| `tract_length_scale` | Multiplies every section length, preserving areas |
| `pharynx_scale` | Multiplies pharyngeal lengths by k and areas by k² |
| `mouth_scale` | Multiplies oral lengths by k and areas by k² |

Regional scaling follows Nordstrom (1977, published version of the 1975 report),
experiment 2. Fitch & Giedd (1999) motivates independent regional dimensions;
it supplies no acoustic fit here. The data's `pharynx_fraction: 0.4` is explicitly
an engineering estimate, not a measured landmark for Story's subject. A section
crossing that boundary is split exactly. Total generated length is recorded.

Pass a YAML/JSON file with these numeric overrides via `--speaker`, for example:

```yaml
# Nordstrom Table I, configuration 4; applied to Story rather than Fant geometry.
tract_length_scale: 1
pharynx_scale: 0.77
mouth_scale: 0.85
```

Omitted fields inherit the canonical profile. Uniform length scaling and regional
volume scaling are distinct operations; `formant_scale` remains the separate
runtime frequency multiplier and is not accepted by this CLI. Geometry controls
take effect only when regenerating the offline targets, not during speech.

## Inventory provenance

The emitted YAML is a **fragment** under `phoneme_targets`, suitable for merging
into an experimental inventory. Preserve each destination target's duration,
type, voicing and other linguistic features. The fragment supplies eight acoustic
values plus `derived_from: area_function` and `area_function` metadata:

- geometry file and configuration, and its SHA-256 (LF-normalized source bytes);
- versioned acoustic model and its numeric settings;
- speaker factors, generated tract length and regional boundary;
- geometry, model and scaling citations.

The inventory parser requires cited geometry and all eight positive precomputed
values when `derived_from` is declared. Selection provenance records the geometry,
model and speaker alongside the existing inventory/pronunciation parents. The
metadata does not become an HRG acoustic feature. Ordinary table targets continue
to work. The Node path loader also supports CLI execution without Vite's
`import.meta.env`.

## Verification

The regressions cover an analytic uniform tube (frequencies and pole bandwidths),
an independent two-tube continuity solution, regional geometry scaling, corrected
table endpoints, CLI output, invalid input, and geometry-bearing provenance.
The original PDF was consulted only to resolve extraction inconsistencies:
/u/ and /l/ have 46 sections, /ʊ/ section 28 is 1.79 cm², and Table IV requires
the /ʊ/ column before /u/. The notes also restore the nonzero /ŋ/ front-cavity
sections 35–40 and correct the /u/ length label.
