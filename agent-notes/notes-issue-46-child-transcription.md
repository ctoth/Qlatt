Parent: #46. This child covers only the scope below; it does not close the parent tracker.

Use existing YAML loaders, CEL/HRG, diagnostics and provenance contracts. Cite speech policy or label engineering estimates explicitly. Preserve unrelated behavior and extending frontend declarations. Implementation requires focused failing regressions, fixes, and the applicable repository gates.

## Scope
src/transcribe-text.ts contains maxCompoundSpan=4, compound joiners, empty-pronunciation 50 ms duration, CMU-specific candidate ordering, slash diagnostic delimiters, and pronunciation-layer citation strings.

## Acceptance
- Declare compound span/joiners and empty-pronunciation timing in cited transcription policy; retain current bundled values and test altered values plus no-match controls.
- Move dictionary candidate conventions to the owning dictionary/transcription resource, preserving current CMU ordering. Test exact entries, leading/trailing apostrophe recovery, trailing-dot recovery and alternate pronunciations without labeling CMU behavior frontend-neutral.
- Declare diagnostic-symbol delimiters and layer provenance attribution in the same existing resource system. Keep exact vocabulary entry/source parents through pronunciation.
- Validate malformed/missing required policy before execution, migrate bundled frontends and test inherited loading. Explicitly report any fallback to an empty pronunciation using existing diagnostics.
- Normalization abbreviation/initialism/table matching delivered under #149 is excluded; compound recovery after transcription remains here.
