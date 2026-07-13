# Slice failures investigation

2026-05-24: investigating 2 failures in test/declarative-frontend-slice.test.ts.

## ROOT CAUSE FOUND — verified by math

Commit **`05e057a3`** "tune: shorten weak final release floor" (Tue May 5 18:38:04 2026)
changed `public/rules/frontends/qlatt-english/frontend.yaml:55-56`:
- `weak_release_min_ms` value: 15 → 5
- Citation kept: Allen et al. 1987 Table C-1
- One-line tune commit, no test updates.

Both failing tests assert `rel?.duration === 15`. Both depend on
`max(weak_release_min_ms, base * weak_release_scale)`. With the floor at 5 instead
of 15, the floor no longer dominates and the scaled-base value (smaller than 15)
shows through.

## Failure 1 — "materializes inserted release targets during structural phase" (line 142-170)
- Input: K_CL → SIL, phase ["structural"]
- Rule: `insert_voiceless_stop_release_and_aspiration` (structural.yaml:166-247)
- word_initial=true (no prev) → vot_target = `initial.k` = 43
- rel_target=K_REL (dur=25), asp_target=K_ASP (dur=58)
- vot_sum=83; rel_share=25/83=0.30120481927...
- rel_duration_base = 43 * 25/83 = 12.951807228915663
- weak=true (next=SIL); weak_release_scale=0.5
- rel_duration = max(5, 12.9518 * 0.5) = max(5, 6.4759036...) = **6.475903614457832** ✓ matches observed
- Test was introduced in commit `09366cc9` (when floor=15, max(15, 6.48)=15)
- asp expectation 15.024096385542169 = 43 * (58/83) * 0.5 = 15.024... still works because
  asp_base*0.5 > 5; the failure is only the rel_duration line.

## Failure 2 — "preserves weak phrase-final stop timing through duration locking" (line 172-193)
- Input: P_CL → SIL, phases ["structural","duration"]
- Same rule applies (next!=null since SIL)
- word_initial=true → vot_target = initial.p = 28
- rel_target=P_REL (dur=5), asp_target=P_ASP (dur=53)
- vot_sum=58; rel_share=5/58=0.08620...
- rel_duration_base = 28 * 5/58 = 2.4138
- weak_release_scale=0.5
- rel_duration = max(5, 2.4138*0.5) = max(5, 1.207) = **5** ✓ matches observed
- Test was introduced in commit `be171ddc` (frontend.yaml at that commit had weak_release_min_ms=15)
- The test asserts BOTH rel and asp = 15, plus inherentDuration=15. With current 5 floor:
  - rel.duration = 5 (fails — expected 15)
  - asp.duration: 28*(53/58)*0.5 = 12.7931 → max(5, 12.7931) = 12.7931 → ALSO would fail expected 15
  - the displayed error "5 to be 15" is the first failed assertion (rel.duration)

## Chunk 8 relationship
Plan `~/.claude/plans/typed-finding-lampson.md:138-144`:
- Chunk 8 deletes structural.yaml:166-383 (the four stop-release rules)
- Replaces with at-most-two rules consulting a `phoneme_release_map:` table
- It is a STRUCTURAL REFACTOR, not a re-tuning of `weak_release_min_ms`
- If chunk 8 preserves the existing `weak_release_min_ms=5` parameter and the
  `max(floor, base*scale)` formula, these failures will still occur after chunk 8.
- The failures are ORTHOGONAL to chunk 8 unless the rewrite explicitly restores 15.

## Recommendation
Two reasonable fixes — Q to choose:
1. **Revert the production tune** (`weak_release_min_ms: 5 → 15`) if 5 was a wrong
   choice. Commit message "tune: shorten weak final release floor" is terse —
   no rationale linking to audio quality testing — and there is no test update
   in that commit suggesting it was a half-done change.
2. **Update the tests** to match production. Test 1's expected 15 becomes
   6.475903614457832; test 2's expected 15 (×4 — rel/asp duration/inherentDuration)
   becomes 5/5/12.7931/12.7931. Add a comment explaining the floor=5 derivation.

The tune commit `05e057a3` shipped a production-test mismatch (changed a parameter
that load-bearing tests assert against, without updating the tests). This looks
like an oversight, not a deliberate test-supersession. Lean recommendation:
ASK Q which direction — the tests pre-date the tune and may encode an intent
the tune contradicted.

## Evidence trail
- `git show 05e057a3` — single-file diff, weak_release_min_ms 15→5
- `git show be171ddc:public/rules/frontends/qlatt-english/frontend.yaml | grep -A2 weak_release_min` → value: 15 at test-introduction
- structural.yaml:200-205 — the `max([weak_release_min_ms, base*scale])` formula
- inventory.yaml:912 (P_REL dur=5), :937 (T_REL dur=15), :962 (K_REL dur=25)
- inventory.yaml:1061 (P_ASP dur=53), :1085 (T_ASP dur=56), :1109 (K_ASP dur=58)
- frontend.yaml:25-50 (vot_target_ms initial.p=28, initial.t=39, initial.k=43)

## Status
Investigation complete. Writing report to reports/slice-failures-investigator.md next.

## 2026-05-24 coder checkpoint (claude)
On branch declarative-cleanup @ 66b7ac27. Confirmed working tree has:
- test/__snapshots__/tts-frontend-snapshot.test.ts.snap (M, codex leftover)
- test/golden/declarative-corpus-summary.json (M, codex leftover)
- knowledge/claims/*.yaml (many D, unrelated other agent — DO NOT TOUCH)
Next: discard the two test/ leftovers via `git checkout HEAD --`, then edit frontend.yaml lines 55-58 to revert weak_release_min_ms 5→15.

## 2026-05-24 coder progress (claude)
- Discarded codex's test/ leftovers cleanly (status clean for test/).
- 05e057a3 confirmed single-value change (15→5 on frontend.yaml only).
- Edited frontend.yaml: floor reverted 5→15 with explanatory comment.
- Ran slice tests:
  - Test 2 "preserves weak phrase-final stop timing" → NOW PASSES (was a duration assertion).
  - Test 1 "materializes inserted release targets" → STILL FAILS but at a DIFFERENT line:
    - Was failing at line 159 `rel?.duration === 15` → now PASSES.
    - New failure at line 160: `rel?.params?.AF` expected 45, got 33.
- K_REL inventory has AF=55, A3=53, A4=43, A5=45, A6=45. None of those is 33.
- This is an unrelated/secondary failure exposed by the revert; the investigation predicted only duration would change.
- BLOCKER: Per prompt hard-stop "If slice tests don't pass after the revert, STOP — revert is incomplete."
- DECISION POINT: My revert is correct (test 2 fully fixed, test 1's duration fixed). The AF=33 failure is a separate concern. The prompt says STOP and report — I should NOT investigate AF semantics or commit; report the situation to the foreman.
- Choosing: STOP, do not commit, write report with full observations so foreman can decide whether to (a) commit the partial fix anyway, (b) dispatch separate AF investigation, or (c) update test expectation.

## 2026-05-24 AF=33 root cause TRACED (claude)
Math: K_REL.AF=55 (inventory.yaml:950), reduction_db=22 → 55-22 = 33. Test expects 45.
- Test line 169 comment EXPLICITLY says reduction_db=10 ("K_ASP inventory AH=53 minus weak_release_amplitude_reduction_db=10"). With reduction_db=10: 55-10 = 45 ✓ matches test.
- `git log -S"value: 22" -- frontend.yaml` → commit `7b285e8d` "tune: attenuate weak final stop releases" Tue May 5 18:31:13 2026 (-0600).
- That commit is 7 minutes BEFORE 05e057a3 "tune: shorten weak final release floor" (18:38:04 same day).
- 7b285e8d changed weak_release_amplitude_reduction_db: 10→22 (single-line tune commit, no test updates — same pattern as 05e057a3).
- Both tests' AF assertions on line 160 (K_REL) and AH assertion on line 169 (K_ASP: 53-22=31, test expects 43) would fail with reduction_db=22. The test 1 AH assertion was masked behind the AF one; test 2's release/asp assertions on K_REL/K_ASP would also break.
- The SAME root-cause pattern exists for AF/AH that exists for the floor: a tune commit shipped that breaks load-bearing slice tests, with no test update.
- Prompt's scope is ONLY the weak_release_min_ms revert. Q approved only that. Reverting 7b285e8d too is outside scope and requires Q sign-off.
- Final action: do not commit, write report explaining (a) the floor revert succeeds, (b) but unmasks a parallel tune-drift (7b285e8d, reduction_db 10→22) blocking test 1 from going green, (c) revert is sound but partial fix unsuitable to commit per hard-stop.
