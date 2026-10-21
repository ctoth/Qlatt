# Inventory conventions

Each frontend's inventory declares its symbol conventions, in `inventory.yaml`
or in the phonology document that it names (see "Layering an inventory over a
phonology document" below):

```yaml
# Engineering convention: CMU/ARPABET transcription.
silence_symbol: SIL
nucleus_types: [vowel]
symbol_grammar: '[A-Z]+'
stress_markers: {0: '0', 1: '1', 2: '2'}
default_duration_ms: 30 # engineering estimate for targets without dur
target_feature_exclusions: [dur, SW, type]
```

`target_feature_exclusions` is a required array of non-empty field names; `[]`
explicitly excludes nothing. It belongs to the inventory and skips only declared
target columns when constructing Segment features. It does not remove `base_params` features or
change materialization: `dur` supplies duration, `SW` supplies `inventorySW`, and
`type` supplies the already-declared Segment type.

`target_features` is a required mapping from column names to HRG `FeatureSchema`
shapes: `number`, `string`, `boolean`, `null`, `literal`, `array`, `object` or `union`.
Object shapes use `fields` and optional `optional` names; arrays use `items` and
unions use `variants`. Columns in `base_params` already have the numeric contract.
Every other target column needs a declaration, including excluded metadata.
The loader checks values against these shapes; it does not infer or widen types.

`silence_symbol` must name a target with a positive `dur`. Its parameters inherit
`base_params` and supply the initial and final lowering edges. Declare source-off
parameters in that target and cite their source or label engineering estimates.

`nucleus_types` names the target classes that bear lexical stress and count as
syllable nuclei in graph queries. `symbol_grammar` is a Unicode JavaScript regular
expression for a complete **unstressed transcription symbol**, without delimiters.
The decoder tries the declared suffixes longest-first, then an unsuffixed symbol.
The silence label is accepted independently of the grammar. Internal structural
targets such as stop closures need not belong to the transcription alphabet.

`stress_markers` maps lexical stress levels 0, 1, and 2 to distinct nonempty
suffixes. Lexical stress stays numeric in the graph. Nucleus lookup uses the
requested suffix; missing targets fail explicitly. A cited
`secondary_stress_fallback` can project level 2 onto level 0 or 1 while retaining
lexical secondary stress and recording the selected acoustic target. Non-nucleus
targets use their declared name directly.

Invalid transcription symbols emit `PHONEME_SYMBOL_REJECTED` diagnostics and
`phoneme_symbol_rejected` provenance records linked to the pronunciation decision.
Targets without `dur` use `default_duration_ms`, with a diagnostic and selection
provenance identifying that default.

## Layering an inventory over a phonology document

Part of an inventory is about the language, not about a voice: which symbols
there are, how stress is written, and for each phoneme its class (`type`), its
features (`voiced`, `alveolar`, `back`, ...) and its coarticulation-resistance
class (`dac`). `docs/frontend-document-model.md` decision 6 gives that column to
the language and the acoustic columns to the voice. An inventory takes the
language's column from a shared document by naming it:

```yaml
# public/rules/frontends/qlatt-beauty/inventory.yaml
version: v1
phonology_path: /rules/languages/english/phonology.yaml
default_duration_ms: 30
base_params: { ... }
target_features:
  dur: {kind: number}
phoneme_targets:
  IY1: { F1: 310, F2: 2790, F3: 3310, B1: 60, B2: 90, B3: 180, AV: 63, dur: 207, Rd: 1.55 }
```

```yaml
# public/rules/languages/english/phonology.yaml
version: v1
silence_symbol: SIL
nucleus_types: [vowel]
symbol_grammar: '[A-Z]+'
stress_markers: {0: '0', 1: '1', 2: '2'}
target_features:
  type: {kind: string}
  hi: {kind: union, variants: [{kind: boolean}, {kind: "null"}]}
  front: {kind: union, variants: [{kind: boolean}, {kind: "null"}]}
  dac: {kind: number}
phoneme_targets:
  IY1: { type: vowel, hi: true, front: true, dac: 3 }
```

The loader (`src/declarative-frontend/inventory.ts`) merges the two before it
validates anything, so every reader of an inventory (the frontend, rule
validation of phoneme literals and `normalization_aliases`, the tests) sees one
`InventorySpec`, the one the two documents would make written as a single file.
The rules of the merge:

- **A phonology document holds only** `version`, the four convention keys
  `silence_symbol`, `nucleus_types`, `symbol_grammar`, `stress_markers`, and
  `phoneme_targets` and `target_features`. Anything else is `E_INVENTORY_PHONOLOGY_SCHEMA`.
  `default_duration_ms`, `citations`, `base_params`, `normalization_aliases`,
  `secondary_stress_fallback` and `duration_models` are the inventory's.
- **Each target gets the inventory's fields and then the phonology document's
  fields for the same key.** Nothing overrides anything: a field is the
  language's or the voice's, so a field both documents give one target is
  `E_INVENTORY_PHONOLOGY_CONFLICT`, whether or not the two values agree. The
  same holds for a convention key both documents declare. A convention key
  neither declares fails as it does in a one-document inventory
  (`E_INVENTORY_SCHEMA`).
- **Both documents declare `target_features`.** Their column maps are combined;
  declaring a column in both is `E_INVENTORY_PHONOLOGY_CONFLICT`, even if the
  shapes agree. Each owner declares the columns its targets supply.
- **The inventory decides which targets exist.** A target the inventory has
  and the phonology document does not is `E_INVENTORY_PHONOLOGY_TARGET`: a
  voice cannot realize a phoneme its language does not declare, and a
  misspelled key would otherwise lose its `type` silently. A phoneme the
  phonology document declares and the inventory gives no target is not a
  target of that inventory (a voice may, for example, have no secondary-stress
  targets and declare `secondary_stress_fallback`).
- **A `phonology_path` that is not a path, or names a document that cannot be
  read,** is `E_INVENTORY_PHONOLOGY_PATH`.
- **An inventory without `phonology_path` is one document,** loaded exactly as
  before. `dectalk-english` is one.

A field belongs in the phonology document when it names a class of the phoneme
(category, feature, place, manner, coarticulation resistance, the components of
a diphthong) and would be the same for every voice of the language. A value in
Hz, dB or ms is a voice's: `fricative_min_ms` looks like a class and stays with
the voice because it is a duration. `nasal_place_index` is the code of the
nasal's place (1, 2, 3 for /m/, /n/, /ng/), not a magnitude, and is in the
phonology document beside `nasal_place`.

The order of a target's fields is the order in which its features are written
when a Segment is materialized, and so the order of those provenance records:
the inventory's fields in the order it lists them, then the phonology
document's. Moving a field between the two documents can therefore reorder the
records of the targets that have it without changing any value.

Provenance records that select the inventory or one of its targets cite every
document the target's fields come from: `FrontendResources.inventoryDocuments`
is the inventory's path followed by its phonology document's.
`scripts/dump-inventory-spec.ts` prints the merged inventory of a frontend, and
`scripts/compare-inventory-fields.ts` counts, field by field, what two
frontends' inventories share.

In a browser the phonology document is one more resource the synchronous
loaders read; `public/rules/frontends/<id>/resources.json` lists it beside the
inventory for a frontend whose inventory is read at speak time.

Rules must use the vocabulary declared by their inventory. Graph queries that
classify nuclei or navigate silence boundaries require an inventory resource and
record its decision as a dependency; text-only graph execution needs none.

`phonotactics.yaml` stores multi-phone `legal_onsets` with spaces between symbols
(for example, `TH R` and `S T R`). This distinguishes `TH R` from `T HR`.
