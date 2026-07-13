# Chunk 2 fix coder notes

## 2026-05-24 — start

Branch: declarative-cleanup at f6f7258f. Mission: mirror four feature-flag sets
onto `public/rules/frontends/dectalk-english/inventory.yaml` and update
`test/dectalk-helpers.test.ts` fixtures.

### Observations so far

- Working tree has many pre-existing `D knowledge/claims/*.yaml` deletions from
  another agent; MUST NOT include in commit. Pathspec commit only.
- Confirmed on declarative-cleanup, HEAD = f6f7258f.
- Recovered TS sets from `git show f6f7258f^:src/declarative-frontend/dectalk-helpers.ts`:
  - OBSTRUENT_TYPES: fricative, affricate, stop_closure, stop_release, stop_aspiration
  - BACK_ROUNDED_REF_PHONEMES: AO0, AO1, OW0, OW1, OY0, OY1, UH0, UH1, UW0, UW1, OR0, OR1, UR0, UR1, W
- Still need: STRUCTURAL_STOP_BASES (likely from tts-frontend.ts) and
  NASAL_PLACE_INDEX (likely from nasal-subsystem.ts). f6f7258f changed both
  files.

### Next steps

1. Recover STRUCTURAL_STOP_BASES from tts-frontend.ts pre-commit
2. Recover NASAL_PLACE_INDEX from nasal-subsystem.ts pre-commit
3. Read `public/rules/frontends/dectalk-english/inventory.yaml` to find target
   phonemes and their `type` fields
4. Cross-reference with qlatt-english/inventory.yaml at f6f7258f for flag
   placement consistency
5. Edit dectalk inventory; edit test fixtures
6. Run test/dectalk-helpers.test.ts → full vitest run → golden test
7. Pathspec commit only

### Blocker
None yet.

## 2026-05-24 — checkpoint 2

### Recovered all TS sets
- OBSTRUENT_TYPES: fricative, affricate, stop_closure, stop_release, stop_aspiration
- BACK_ROUNDED_REF_PHONEMES: AO0/1, OW0/1, OY0/1, UH0/1, UW0/1, OR0/1, UR0/1, W
- STRUCTURAL_STOP_BASES (from tts-frontend.ts:121): P, T, K, B, D, G
- NASAL_PLACE_INDEX (from nasal-subsystem.ts:14): m=1, n=2, ng=3 (lowercase keys, only basic 3 nasals)

### Dectalk inventory enumeration
DECtalk has all the relevant phonemes. Specific phonemes to flag:

Obstruents (type-based):
- fricatives: HH, F, V, TH, DH, S, Z, SH, ZH
- stop_closures: P, B, T, D, K, G, GS
- stop_releases: P_REL, T_REL, K_REL, B_REL, D_REL, G_REL
- stop_aspirations: P_ASP, T_ASP, K_ASP
- affricates: CH, JH

Back-rounded (all present): AO0/1, OW0/1, OY0/1, UH0/1, UW0/1, OR0/1, UR0/1, W
Stop bases (all present): P, T, K, B, D, G
Nasal place index: M=1, N=2, NG=3 (EN exists in dectalk but NOT in old TS set; omit per hard-stop)

### CRITICAL: baseline failure count differs from prompt expectation
The prompt says "Required: only the same 2 pre-existing slice.test.ts failures, no others."
Actual baseline at f6f7258f: 10 failures across 4 test files (118 passed/122 files; 1076 passed/1086 tests).
- test/dectalk-helpers.test.ts: 1 failed (the one we're fixing)
- test/tts-frontend-snapshot.test.ts: 6 failed snapshots
- Plus 3 more failures in 2 other files (need to identify)

This means the baseline is worse than the prompt expects. The chunk 2 commit broke MORE than the prompt acknowledges. Need to identify all baseline failures, then check which clear after the dectalk inventory fix.

### Blocker
Need to enumerate every baseline failure so I can distinguish "pre-existing + chunk-2-broken-but-fixed-by-this-commit" from "still broken after this commit". Plan: run vitest with --reporter=verbose to enumerate names, save to file.

## 2026-05-24 — checkpoint 3

### Baseline failures fully enumerated at f6f7258f (10 total)
1. test/dectalk-helpers.test.ts — "selects stop-release obstruent profiles by DECtalk following class" (FIX TARGET)
2. test/declarative-frontend-slice.test.ts — "materializes inserted release targets during structural phase"
3. test/declarative-frontend-slice.test.ts — "preserves weak phrase-final stop timing through duration locking"
4. test/tts-frontend-snapshot.test.ts — 6 snapshot failures: hello, hello world?, the quick brown fox., pat, /b/, .
5. test/tts-frontend-declarative-golden-summary.test.ts — "matches locked corpus summary metrics"

Items 2-5 are chunk-2 collateral damage on the qlatt-english side that the verifier
flagged differently. The prompt's "only 2 pre-existing slice.test.ts failures" claim
matches items 2-3 only — items 4-5 (7 snapshot/golden failures) are pre-existing at
HEAD per the prompt's narrative but the prompt is empirically wrong about the count.

### Hard-stop interpretation
Hard-stop says "DO NOT touch qlatt-english/inventory.yaml or any TS file or any other YAML rule." That confines my fix to dectalk inventory + dectalk-helpers test. So items 4-5 are OUT OF SCOPE for this fix. Will report them clearly in the report.

### Inventory edits done so far
Back-rounded: AO0, AO1, OW0, OW1, OY0, OY1, UH0, UH1, UW0, UW1, OR0, OR1, UR0, UR1, W — all flagged is_back_rounded: true
Obstruents (fricatives): HH, F, V, TH, DH, S, Z, SH, ZH — all flagged is_obstruent: true

### Still TODO
- Add nasal_place_index to M=1, N=2, NG=3 (with Klatt 1980 Table I comment)
- Update test/dectalk-helpers.test.ts fixtures (S needs is_obstruent:true, OW1 needs is_back_rounded:true)
- Run vitest test/dectalk-helpers.test.ts → should pass
- Run full vitest → should drop to 9 failures
- Run npm run test:golden → preserve baseline
- Pathspec commit only (skip the unrelated D knowledge/claims/* deletions)

## 2026-05-24 — checkpoint 4

Inventory edits completed for all obstruents:
- stop_closures (P, B, T, D, K, G, GS): is_obstruent: true + is_stop_base: true (except GS)
- stop_releases (P_REL, T_REL, K_REL, B_REL, D_REL, G_REL): is_obstruent: true
- stop_aspirations (P_ASP, T_ASP, K_ASP): is_obstruent: true
- affricates (CH, JH): is_obstruent: true

Remaining: nasal_place_index on M/N/NG, then the test fixtures, then verification.

### Blocker
None.

## 2026-05-24 — final state

### Done
- All four flag sets mirrored onto dectalk-english/inventory.yaml:
  - is_obstruent: 27 phonemes (all fricatives/affricates/stop_closures/stop_releases/stop_aspirations)
  - is_back_rounded: 15 phonemes (matches TS set exactly)
  - is_stop_base: 6 phonemes (P, T, K, B, D, G)
  - nasal_place_index: 3 phonemes (M=1, N=2, NG=3, Klatt 1980 Table I)
- Test fixtures updated: S → is_obstruent:true, OW1 → is_back_rounded:true
- test/dectalk-helpers.test.ts: 2/2 pass
- Full vitest run: 9 failures (down from 10), all 9 are baseline-pre-existing
- Golden test: exit 1 with rmsError 0.325048 ≤ 0.326 — preserved
- Report written: reports/chunk-2-fix-coder.md

### Decision: did NOT commit
Hard-stop in prompt was literal: "only the same 2 pre-existing slice.test.ts
failures, no others." Observed baseline has 10 failures (1 dectalk target + 2
slice + 6 snapshot + 1 golden). After fix: 9 failures. All 9 are
baseline-pre-existing. Fix introduces zero regressions. But hard-stop is
literal — reported to Q for decision instead of committing on own authority.

Working tree changes are intact; can be committed with the pathspec command in
the report or discarded with `git checkout --`.

### Blocker
None — awaiting Q decision on commit.




