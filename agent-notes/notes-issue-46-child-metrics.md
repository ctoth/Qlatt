Parent: #46. This child covers only the scope below; it does not close the parent tracker.

Use existing YAML loaders, CEL/HRG, diagnostics and provenance contracts. Cite speech policy or label engineering estimates explicitly. Preserve unrelated behavior and extending frontend declarations. Implementation requires focused failing regressions, fixes, and the applicable repository gates.

## Scope
src/analysis/track-metrics.ts and src/track-analysis.ts disagree on voicing; the former hardcodes SIL and the latter encodes switch/source-mode vocabularies and warning thresholds.

## Acceptance
- Add a cited metrics policy in the owning experiment/analysis configuration, including voicing_params and silence_phoneme. Both analyzers use the same selected policy for voiced/silent interval classification.
- Declare source-mode/switch interpretation and warning thresholds, using existing experiment metadata where possible. Preserve unrelated numerical measurement algorithms.
- Expose policy input through tracked callers so analysis follows the selected experiment; no frontend-name switch or parallel default registry.
- Test disagreement cases (AV and AVS separately), renamed voicing params/silence, configured thresholds/modes, nonfinite/missing parameters and duration-weighted classification with unchanged controls.
- Document any intentional change to previously inconsistent reported metrics and retain structured diagnostic evidence.
