# Issue 134: residual burst defaults

## Goal
Finish residual get adoption against origin/master 5e3f34b6, repairing the invalid burst fallback without changing other rule conditions.

## State
Implemented one burst-template YAML expression and requested coverage in the existing CEL get test. Coverage loads the real expanded rule, asserts the intended missing/zero/nonzero result for all nine fields, and verifies both consuming inventories keep these fields numeric. No evaluator or validation machinery. Tests have not been run locally; PR CI owns validation.

## Decisions and why
- Replace only the A2..A10 burst fallback. Both shipped consumers (qlatt-english and inherited qlatt-beauty) declare numeric amplitude base parameters. tts-frontend.ts:294 creates number schemas from these; hrg/item.ts:60-62,168-180 rejects null writes. Targets contain numeric amplitudes, so missing and numeric (including zero) values are valid. The literal fallback has no eager-evaluation hazard.
- VCV defaults already use get; DECtalk's former stress-default rules were replaced by its timing port. Do not restore obsolete rules.
- Retain durationFloor's computed fallback, inherentDuration's current.duration fallback, and DECtalk prev.B1's current.B1 fallback: get eagerly evaluates fallback reads even when the existing field is present. This cleanup does not strengthen those input contracts.
- Retain stress comparison predicates: stress is nullable, so absence-to-zero replacement changes null behavior. Retain accentIndexInPhrase/breakIndex range checks.
- Retain word/punctuation predicates, null checks, strict boolean predicates, nested receiver guards and structural selections. They are conditions or nullable string accesses, not equivalent optional numeric defaults.
- Preserve citations, tags, dispatch order and numeric policy.

## Surprises
Local master was stale; implementation starts from fetched origin/master. Issue 132's rule is gone; most issue 134 formant defaults already migrated. The exact removed expression has(current.?A2) is invalid under locked CEL 8.0.0: its has macro requires ordinary outer member access (lib/macros.js:104-106). Parser placeholder replacement preserves the question mark (parser.ts:69-75). Hosted test failure exposed my incorrect equivalence claim; this change repairs that fallback. No real production phrase reaching the default dispatch branch has been established.

## Next step
Claude accepted the production change and requested an exact old-expression comparator. That exposed the invalid old expression in hosted CI. Q explicitly authorized correcting the test and continuing: removed the invalid comparator, retained direct intended-value assertions, and corrected the PR narrative. Import ordering/formatting feedback is already applied. Push and await replacement CI before supervisor merge; no extra guards or local CI reruns.
