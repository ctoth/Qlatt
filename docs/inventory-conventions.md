# Inventory conventions

Each frontend's `inventory.yaml` owns its acoustic symbol conventions:

```yaml
# Engineering convention: CMU/ARPABET transcription.
silence_symbol: SIL
nucleus_types: [vowel]
symbol_grammar: '[A-Z]+'
stress_markers: {0: '0', 1: '1', 2: '2'}
default_duration_ms: 30 # engineering estimate for targets without dur
```

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

Rules must use the vocabulary declared by their inventory. Graph queries that
classify nuclei or navigate silence boundaries require an inventory resource and
record its decision as a dependency; text-only graph execution needs none.

`phonotactics.yaml` stores multi-phone `legal_onsets` with spaces between symbols
(for example, `TH R` and `S T R`). This distinguishes `TH R` from `T HR`.
