# Goal

Use the already-resolved Qlatt lexicon in the lexical-stress evaluator (#141).

# State

Fresh isolated branch from origin/master d3897a32. Preparing the approved
script-only change for hosted CI and Claude review.

# Decisions and why

- Smallest change: about four added / two removed script lines plus this note.
- The script already resolves qlatt-english resources for LTS, morphology and
  stress policy. Its separate hardcoded dictionary load bypasses that owner.
- Consume resources.lexicon.dictionary; missing lexicon is a contextual
  E_FRONTEND_CONFIG error naming qlatt-english and lexicon.
- Keep frozen words, scoring, report text and G2P behavior unchanged. Existing
  test/lexical-stress-evaluation.test.ts exercises the actual function caller.
- No new test, guard, cache or local CI. #141 remains open.

# Surprises

None.

# Next step

Inspect owned diff, commit/push and open PR for hosted CI and Claude review.
Supervisor owns merge and cleanup; preserve other agents' work.
