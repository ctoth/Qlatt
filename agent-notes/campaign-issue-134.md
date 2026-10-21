# Issue 134: equivalent optional defaults

## Goal
Finish behavior-preserving get adoption against origin/master 5e3f34b6.

## State
Implemented: one burst-template YAML expression and 43 lines of requested coverage in the existing CEL get test. Coverage loads the real expanded rule, checks all nine fields with absent/zero/nonzero values against the previous expression, and verifies both consuming inventories keep these fields numeric. No evaluator or validation machinery. Tests have not been run locally; PR CI owns validation.

## Decisions and why
- Replace only the A2..A10 burst fallback. Both shipped consumers (qlatt-english and inherited qlatt-beauty) declare numeric amplitude base parameters. tts-frontend.ts:294 creates number schemas from these; hrg/item.ts:60-62,168-180 rejects null writes. Targets contain numeric amplitudes, so missing and numeric (including zero) values are valid. The literal fallback has no eager-evaluation hazard.
- VCV defaults already use get; DECtalk's former stress-default rules were replaced by its timing port. Do not restore obsolete rules.
- Retain durationFloor's computed fallback, inherentDuration's current.duration fallback, and DECtalk prev.B1's current.B1 fallback: get eagerly evaluates fallback reads even when the existing field is present. This cleanup does not strengthen those input contracts.
- Retain stress comparison predicates: stress is nullable, so absence-to-zero replacement changes null behavior. Retain accentIndexInPhrase/breakIndex range checks.
- Retain word/punctuation predicates, null checks, strict boolean predicates, nested receiver guards and structural selections. They are conditions or nullable string accesses, not equivalent optional numeric defaults.
- Preserve citations, tags, dispatch order and numeric policy.

## Surprises
Local master was stale; implementation starts from fetched origin/master. Issue 132's rule is gone; most issue 134 formant defaults already migrated.

## Next step
Commit/push/open PR, then respond to Claude review. PR CI owns validation; no local CI runs.
