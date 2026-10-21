# Formant-bank cardinality audit (#203)

Source baseline: `5e3f34b6ad4af5b7a1beaf6340869052a28b92db`.
Line references below describe that revision. This is an audit and recommendation;
it changes no schema, generated names, rendering behavior or acoustic model.

## Recommendation

Retain the current exactly-one-bank check and document it as a compiler namespace
constraint. The authored bank key identifies validation errors, but does not qualify
generated nodes, parameters or realization rules. There is no acoustic argument
in this check: it counts map entries (`src/formant-bank.ts:180–190`).

The constraint applies when `graph.meta.formantBanks` exists. An absent macro is
accepted without expansion (`src/formant-bank.ts:353–359`); a present empty map
fails the same cardinality check. Hand-authored graphs remain possible: klsyn88
declares its cascade and parallel nodes directly (`public/experiments/klsyn88/graph.yaml:155–312`).
Thus this is not a restriction on how many resonators a synthesizer can contain.

## Generated namespace

Expansion discards the bank key in its loop (`src/formant-bank.ts:361`). It sorts
the bank's formants by index, then generates the following shared names.

| Name | Producer and use |
| --- | --- |
| `cascadeF{N}` | `formant-bank.ts:369–392`; resonator binds `F{N}`/`B{N}`. |
| `parallelF{N}`, `parallelF{N}Gain` | `formant-bank.ts:395–414`; resonator and gain, when `parallelSource` exists. |
| `cascadeF{N}Frequency` | `formant-bank.ts:378–391`; optional count-gated CEL rule and cascade frequency binding. |
| `F{N}`, `B{N}`, `A{N}` | `formant-bank.ts:460–485`; global semantics parameter entries; amplitude exists for parallel formants. |
| `a{N}Linear` | `semantics/pfe-codegen.ts:38–91`; generated realization rule, bound by the gain unless `linearGainParam` overrides it. |

The generated chain and parallel edges use these same node names
(`src/formant-bank.ts:425–446`). Extra authored connections are appended unchanged
(`453–455`). `cascadeOutput` can name an authored return node; it does not rename
the generated resonator (`428`, `434`). `linearGainParam` changes the gain binding
(`411`), but expansion still generates PFE rules (`494–495`).

PFE expressions read `A{N}`, `F{N}`, other bank formants' `F{J}`/`B{J}` and the
shared `sampleRate`/`parallelScale` (`src/semantics/pfe-codegen.ts:60–91`). The
bank key qualifies none of them. Its sign/scale inputs become literals in the
expression; expansion does not create a bank-specific constants namespace.

## Concrete two-bank collision trace

Take two banks `main` and `secondary`, each containing formant index 1. This is
the existing fixture in `test/formant-bank-validation.test.ts:262–270`, which
asserts `exactly one formant bank is supported; received 2`. It is source evidence,
not a claim that tests were run for this documentation change.

`expandFormantBanks` parses before preflight and mutation (`353–359`). Therefore
the current implementation rejects this document at the schema boundary.
If only the cardinality check were removed, preflight would still reject the
second `cascadeF1`: `generatedNodes` is shared across banks (`246–249`), the name
is constructed from index alone (`261`), and the duplicate check throws
`E_FORMANT_BANK_COLLISION` before expansion (`265–274`). It would not silently
overwrite nodes. Removing both checks would expose assignments such as
`graph.nodes["cascadeF1"]` and `semantics.params["F1"]` to repeated keys
(`392`, `464`); generated edges would also target those shared names.

Banks with disjoint indices avoid this particular duplicate-node example, but
still share unqualified control/realization names and `parallelScale`. That is
not a proved independent-bank interface. This audit does not recommend relaxing
cardinality for that subset.

## Callers and downstream consumers

All non-test direct expansion callers found in `src/` and `scripts/` are:

- `src/klatt-runtime.ts:450`: expands before node creation and builds one binding
  map keyed by semantic name (`834–842`).
- `src/experiments/frontend-vocabulary.ts:13–25`: expands a clone and compares
  frontend output columns with global semantic parameter keys.
- `src/track-analysis.ts:498–505`: expands baseline semantics; gain analysis
  identifies generated gains by `/^a[0-9]+Linear$/` (`550–552`).
- `scripts/dump-realize-map.ts:124–140`: reports/evaluates the expanded rules.
- `scripts/report-vocal-effort.ts:9–24`: expands then evaluates frontend frames.

The interpreter overlays frame parameters by plain key
(`src/klatt-interpreter.ts:200–225`), categorizes binding names (`287–300`), and
reads realized or frame values using that name (`426–429`). A node prefix alone
would not separate the input and realization namespaces.

Authored consumers also refer to generated nodes directly: baseline and Beauty
connect `cascadeF1` to `standardF1Gain` (`public/experiments/klatt80-baseline/graph.yaml:691`,
`public/experiments/qlatt-beauty/graph.yaml:758`); Stevens91 targets the bandwidth
ports of `cascadeF1` and `parallelF1` (`public/experiments/stevens91/graph.yaml:22–27`);
Steinecke95 declares the F1 return connection in bank metadata
(`public/experiments/steinecke95/graph.yaml:10–13`). Authored semantics read and
transform `F1` directly (`public/experiments/klatt80-baseline/semantics.yaml:557–559`).
Existing validation, PFE, interpreter, vocabulary and rendering fixtures also
name these controls/nodes; renaming requires corresponding fixture migration.

## Compatibility and ownership

Retaining the check preserves existing authored graphs, track parameter names,
PFE expressions, vocabulary checks, gain analysis and binding lookup. No source
or fixture migration is proposed. The existing cardinality/collision assertions
already describe rejection; this audit adds no guard or test.

Any future multi-bank proposal must assign ownership of nodes, parameters,
constants and realization rules together, then specify how frontend tracks,
authored connections/CEL, analysis and fixtures refer to each owner. #253 owns
the component proof, #248 the portable ownership contract, and #252 expanded
graph checking; generic composition coordinates with ctoth/bacon#8. Qlatt's
macro and semantic consumers cannot acquire a private incompatible naming scheme.

Closing this audit does not complete #46's bank-cardinality item. Record the
adopted disposition there before checking it off. A namespace implementation
follow-up is warranted only if multiple banks are selected as required behavior;
this recommendation requires no such follow-up.
