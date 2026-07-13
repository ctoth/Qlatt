# Chunk 6 Coder Notes

## Task
Move 3 rate-scaling formulas from src/tts-frontend.ts into policy.rate YAML.

## Status: COMMITTED — 5233825a

## Verification observed
- **vitest run**: 7 failed / 1088 passed / 1095 total. Exactly the master-debt baseline:
  - 6 tts-frontend-snapshot mismatches (hello, hello world?, the quick brown fox., pat, /b/, .)
  - 1 tts-frontend-declarative-golden-summary "matches locked corpus summary metrics"
  - Verified identical to pre-chunk-6 baseline per notes/fresh-baseline-investigator.md and notes/chunk-2-baseline-investigation.md.
  - No new failures.
- **npm run test:golden**: exits 1 with pre-existing error `E_RULE_EXPRESSION_INVALID at rules.f0_continuation_rise.insert_point.value`. Confirmed pre-existing by stashing changes and re-running — same error. NOT caused by chunk 6.

## Math equivalence at rate=1.0 (verified by inspection)
- undershoot: max(0, 0*0.3) = 0 → max(0, 0*undershoot_coefficient) = 0
- f0Range: 1^(-0.5) = 1 ≡ 1/sqrt(1) = 1
- transition: transitionMs * 1^(-1) = transitionMs ≡ transitionMs/1

## Files touched (pathspec commit)
- src/tts-frontend.ts
- public/rules/frontends/qlatt-english/frontend.yaml
- public/rules/frontends/dectalk-english/frontend.yaml

## Other agent's work — DID NOT touch
Working tree shows 4 other modified files I deliberately excluded via pathspec:
- public/rules/frontends/dectalk-english/inventory.yaml
- public/rules/frontends/qlatt-english/inventory.yaml
- public/rules/frontends/qlatt-english/phases/duration.yaml
- public/rules/frontends/qlatt-english/phases/prosody.yaml
Shared-index discipline: used explicit `git commit <paths> -m ...` so those stay untouched.

## Diff stat
3 files changed, 54 insertions(+), 7 deletions(-)

## Next
Write reports/chunk-6-coder.md (the task report, NOT auto-committed — separate from commit per hard-stop).
