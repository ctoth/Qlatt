Generated morphology previously bypassed stress assignment, while bare LTS used syllable count and inventory selection collapsed secondary stress. This change gives both generated paths one frontend-resolved, cited Hayes (1982) metrical policy, reuses the existing CEL macros, retains morphological cycle boundaries, and preserves lexical secondary stress through inventory and HRG construction.

The implementation records feet, exclusion owners, assumptions, exceptions and their provenance. It includes source-backed derivational controls, explicit limits for unavailable underlying information, and a phrase-by-phrase golden review. The requested AGENTS.md removal remains a separate commit; current master is integrated.

The frozen evaluation is mixed: supplied-phone primary/full-pattern results improve from 12/23 and 9/23 to 14/23 and 11/23; dictionary-disabled OOV results decline from 10/23 and 7/23 to 9/23 and 6/23. All failures are retained. This implements the cited model and explicit fallbacks, not an OOV accuracy guarantee. Condensation rhythm adjustment and cursory/creative post-vocalization inputs are explicitly supplied exception/checkpoint cases, not claimed spelling-to-stress derivations.

- Model and limits: `docs/lexical-stress.md`
- Held-out evaluation: `docs/lexical-stress-evaluation.md`
- Golden controls: `docs/lexical-stress-golden-review.md`
- Primary source: [Hayes (1982), Extrametricality and English Stress](https://brucehayes.org/papers/Hayes1982ExtrametricalityAndEnglishStress.pdf)

Validation: red/green regressions for metrical placement, secondary preservation, resource/input contracts, morphology history and neutral-cycle ordering; `pwsh -NoProfile -File build.ps1`; `npm test`; `npm run check`; `npm run typecheck`; `npm run build`. The golden review reproduced every pre-change metric using only the legacy secondary-vowel target mapping before updating the affected expectation.

Closes #37
